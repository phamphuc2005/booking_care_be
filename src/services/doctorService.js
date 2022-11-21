const db = require('../models/index');
require('dotenv').config();
const _ = require ('lodash'); 

const MAX_NUMBER_SCHEDULE = process.env.MAX_NUMBER_SCHEDULE;

let getTopDoctorHome = (limitInput) => {
    return new Promise(async(resolve, reject) => {
        try {
            let users = await db.User.findAll({
                limit: limitInput,
                where: {roleId: 'R1'},
                order: [['createdAt', 'DESC']],
                attributes: {
                    exclude: ['password']
                },
                include: [
                    {model: db.Allcode, as: 'positionData', attributes: ['valueEn', 'valueVi']},
                    {model: db.Allcode, as: 'genderData', attributes: ['valueEn', 'valueVi']},
                ],
                raw: true,
                nest: true
            })
            resolve({
                errCode: 0,
                data: users
            })
        } catch (error) {
            reject(error)
        }
    })
}

let getAllDoctors = () => {
    return new Promise(async(resolve, reject) => {
        try {
            let doctors = await db.User.findAll({
                where: {roleId: 'R1'},
                attributes: {
                    exclude: ['password', 'image']
                },
            })
            resolve({
                errCode: 0,
                data: doctors
            })
        } catch (error) {
            reject(error)
        }
    })
    
}

let saveInfoDoctor = (inputData) => {
    return new Promise(async(resolve, reject) => {
        try {
            if(!inputData.doctorId || !inputData.contentHTML || !inputData.contentMarkdown || !inputData.action ||
                !inputData.selectedPrice || !inputData.selectedPayment || !inputData.selectedProvince ||
                !inputData.nameClinic || !inputData.addressClinic || !inputData.note) {
                resolve({
                    errCode: 1,
                    errMessage: 'Missing parameters!'
                })
            } else {
                if(inputData.action === 'CREATE') {
                    await db.Markdown.create({
                        contentHTML: inputData.contentHTML,
                        contentMarkdown: inputData.contentMarkdown,
                        description: inputData.description,
                        doctorId: inputData.doctorId
                    })
                } else if(inputData.action === 'EDIT') {
                    let doctorMarkdown = await db.Markdown.findOne({
                        where: {doctorId: inputData.doctorId},
                        raw: false
                    })
                    if(doctorMarkdown) {
                        doctorMarkdown.contentHTML = inputData.contentHTML;
                        doctorMarkdown.contentMarkdown = inputData.contentMarkdown;
                        doctorMarkdown.description = inputData.description;
                        doctorMarkdown.updateAt = new Date();

                        await doctorMarkdown.save()
                    }
                }

                let doctorInfo = await db.Doctor_Info.findOne({
                    where: {
                        doctorId: inputData.doctorId
                    },
                    raw: false
                })
                if(doctorInfo) {
                    doctorInfo.doctorId = inputData.doctorId;
                    doctorInfo.priceId = inputData.selectedPrice;
                    doctorInfo.paymentId = inputData.selectedPayment;
                    doctorInfo.provinceId = inputData.selectedProvince;
                    doctorInfo.nameClinic = inputData.nameClinic;
                    doctorInfo.addressClinic = inputData.addressClinic;
                    doctorInfo.note = inputData.note;

                    await doctorInfo.save()
                } else {
                    await db.Doctor_Info.create({
                        doctorId: inputData.doctorId,
                        priceId: inputData.selectedPrice,
                        paymentId: inputData.selectedPayment,
                        provinceId: inputData.selectedProvince,
                        nameClinic: inputData.nameClinic,
                        addressClinic: inputData.addressClinic,
                        note: inputData.note
                    })
                }

                resolve({
                    errCode: 0,
                    errMessage: 'Save doctor info successfully!'
                })
            }
        } catch (error) {
            reject(error)
        }
    })
}

let getDetailDoctorById = (inputId) => {
    return new Promise(async(resolve, reject) => {
        try {
            if(!inputId) {
                resolve({
                    errCode: 1,
                    errMessage: 'Missing required parameters!'
                })
            } else {
                let data = await db.User.findOne({
                    where: { id: inputId},
                    attributes: {
                        exclude: ['password']
                    },
                    include: [
                        {model: db.Markdown},
                        {model: db.Allcode, as: 'positionData', attributes: ['valueEn', 'valueVi']},
                        {model: db.Doctor_Info,
                            include: [
                                {model: db.Allcode, as: 'priceData', attributes: ['valueEn', 'valueVi']},
                                {model: db.Allcode, as: 'paymentData', attributes: ['valueEn', 'valueVi']},
                                {model: db.Allcode, as: 'provinceData', attributes: ['valueEn', 'valueVi']}
                            ]
                        }
                    ],
                    raw: false,
                    nest: true
                })
                if(data && data.image){
                    data.image = new Buffer(data.image, 'base64').toString('binary');
                }
                if(!data) data = {};
                resolve({
                    errCode: 0,
                    data: data
                })
            }
        } catch (error) {
            reject(error)
        }
    })
}

let createScheduleDoctor = (data) => {
    return new Promise(async(resolve, reject) => {
        try {
            if(!data.arrSchedule || !data.doctorId || !data.date) {
                resolve({
                    errCode: 1,
                    errMessage: 'Missing required parameters!'
                })
            } else {
                let schedule = data.arrSchedule;
                if(schedule && schedule.length>0) {
                    schedule = schedule.map(item=>{
                        item.maxNumber = MAX_NUMBER_SCHEDULE;
                        return item;
                    })
                }
                // console.log('data:',schedule);

                let existing = await db.Schedule.findAll(
                    {
                        where: {doctorId: data.doctorId, date: data.date},
                        attributes:['timeType', 'date', 'doctorId', 'maxNumber'],
                        raw: true
                    }
                );
                // if(existing && existing.length>0) {
                //     existing = existing.map(item=>{
                //         item.date = new Date(item.date).getTime();
                //         return item;
                //     })
                // }
                let toCreate = _.differenceWith(schedule, existing, (a, b)=>{
                    return a.timeType === b.timeType && +a.date === +b.date;
                });
                if(toCreate && toCreate.length > 0) {
                    await db.Schedule.bulkCreate(toCreate)

                }
                console.log(toCreate)

                resolve({
                    errCode: 0,
                    errMessage: 'OK'
                })
            }
        } catch (error) {
            reject(error)
        }
    })
}

let getDoctorScheduleByDate = (doctorId, date) => {
    return new Promise(async(resolve, reject) => {
        try {
            if(!doctorId || !date) {
                resolve({
                    errCode: 1,
                    errMessage: 'Missing required parameters!'
                })
            } else {
                let data = await db.Schedule.findAll({
                    where: {
                        doctorId: doctorId,
                        date: date
                    },
                    include: [
                        {model: db.Allcode, as: 'timeTypeData', attributes: ['valueEn', 'valueVi']}
                    ],
                    raw: false,
                    nest: true
                })
                if(!data) data = [];
                resolve({
                    errCode: 0,
                    data: data
                })
            }
        } catch (error) {
            reject(error)
        }
    })
}

module.exports = {
    getTopDoctorHome: getTopDoctorHome,
    getAllDoctors: getAllDoctors,
    saveInfoDoctor: saveInfoDoctor,
    getDetailDoctorById: getDetailDoctorById,
    createScheduleDoctor: createScheduleDoctor,
    getDoctorScheduleByDate: getDoctorScheduleByDate
}
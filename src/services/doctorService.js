const db = require('../models/index');
require('dotenv').config();
const _ = require ('lodash'); 
const mailService = require('./mailService');

const MAX_NUMBER_SCHEDULE = process.env.MAX_NUMBER_SCHEDULE;

let getTopDoctorHome = (limitInput) => {
    return new Promise(async(resolve, reject) => {
        try {
            let users = await db.User.findAll({
                limit: limitInput,
                where: {roleId: 'R1', isDelete: 0},
                order: [['createdAt', 'ASC']],
                attributes: {
                    exclude: ['password']
                },
                include: [
                    {model: db.Allcode, as: 'positionData', attributes: ['valueEn', 'valueVi']},
                    {model: db.Allcode, as: 'genderData', attributes: ['valueEn', 'valueVi']},
                    {model: db.Doctor_Info, attributes: ['specialtyId'],
                    include: [
                        {model: db.Specialty, attributes: ['name']},
                        {model: db.Specialty_En, attributes: ['name']},
                    ]
                    },
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
                where: {roleId: 'R1', isDelete: 0},
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

let checkRequired = (inputData) => {
    let arr = ['doctorId', 'contentHTML', 'contentMarkdown', 'action', 
                'selectedPrice', 'selectedPayment', 'selectedProvince',
                'nameClinic', 'addressClinic', 'note', 'specialtyId',
                'contentHTML_en', 'contentMarkdown_en'];
    let isValid = true;
    let element = '';
    for(let i = 0; i<arr.length; i++) {
        if(!inputData[arr[i]]) {
            isValid = false;
            element = arr[i];
            break;
        }
    }
    return {
        isValid: isValid,
        element: element
    }
}

let saveInfoDoctor = (inputData) => {
    return new Promise(async(resolve, reject) => {
        try {
            let checkObject = checkRequired(inputData);
            if(checkObject.isValid === false) {
                resolve({
                    errCode: 1,
                    errMessage: `Thiếu: ${checkObject.element}`
                })
            } else {
                if(inputData.action === 'CREATE') {
                    await db.Markdown.create({
                        contentHTML: inputData.contentHTML,
                        contentMarkdown: inputData.contentMarkdown,
                        description: inputData.description,
                        doctorId: inputData.doctorId
                    })
                    await db.Markdown_En.create({
                        contentHTML: inputData.contentHTML_en,
                        contentMarkdown: inputData.contentMarkdown_en,
                        description: inputData.description_en,
                        doctorId: inputData.doctorId
                    })
                } else if(inputData.action === 'EDIT') {
                    let doctorMarkdown = await db.Markdown.findOne({
                        where: {doctorId: inputData.doctorId},
                        raw: false
                    })
                    let doctorMarkdown_en = await db.Markdown_En.findOne({
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
                    if(doctorMarkdown_en) {
                        doctorMarkdown_en.contentHTML = inputData.contentHTML_en;
                        doctorMarkdown_en.contentMarkdown = inputData.contentMarkdown_en;
                        doctorMarkdown_en.description = inputData.description_en;
                        doctorMarkdown_en.updateAt = new Date();

                        await doctorMarkdown_en.save()
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
                    doctorInfo.specialtyId = inputData.specialtyId;
                    doctorInfo.clinicId = inputData.clinicId

                    await doctorInfo.save()
                } else {
                    await db.Doctor_Info.create({
                        doctorId: inputData.doctorId,
                        priceId: inputData.selectedPrice,
                        paymentId: inputData.selectedPayment,
                        provinceId: inputData.selectedProvince,
                        nameClinic: inputData.nameClinic,
                        addressClinic: inputData.addressClinic,
                        note: inputData.note,
                        specialtyId: inputData.specialtyId,
                        clinicId: inputData.clinicId
                    })
                }

                resolve({
                    errCode: 0,
                    errMessage: 'Lưu thông tin bác sĩ thành công!'
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
                    errMessage: 'Thiếu dữ liệu!'
                })
            } else {
                let data = await db.User.findOne({
                    where: { id: inputId, isDelete: 0},
                    attributes: {
                        exclude: ['password']
                    },
                    include: [
                        {model: db.Markdown},
                        {model: db.Markdown_En},
                        {model: db.Allcode, as: 'positionData', attributes: ['valueEn', 'valueVi']},
                        {model: db.Allcode, as: 'genderData', attributes: ['valueEn', 'valueVi']},
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
                    data.image = new Buffer.from(data.image, 'base64').toString('binary');
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
            if(!data.arrSchedule || !data.doctorId || !data.date || !data.maxNumber) {
                resolve({
                    errCode: 1,
                    errMessage: 'Thiếu dữ liệu!'
                })
            } else {
                let schedule = data.arrSchedule;
                if(schedule && schedule.length>0) {
                    schedule = schedule.map(item=>{
                        item.maxNumber = data.maxNumber;
                        item.currentNumber = 0;
                        return item;
                    })
                }

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
                    errMessage: 'Thiếu dữ liệu!'
                })
            } else {
                let data = await db.Schedule.findAll({
                    where: {
                        doctorId: doctorId,
                        date: date
                    },
                    include: [
                        {model: db.Allcode, as: 'timeTypeData', attributes: ['valueEn', 'valueVi']},
                        {model: db.User, as: 'doctorData', attributes: ['firstName', 'lastName']}
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

let getMoreDoctorInfoById = (inputId) => {
    return new Promise(async(resolve, reject) => {
        try {
            if(!inputId){
                resolve({
                    errCode: 1,
                    errMessage: 'Thiếu dữ liệu!'
                })
            } else {
                let data = await db.Doctor_Info.findOne({
                    where: {
                        doctorId: inputId
                    },
                    include: [
                        {model: db.Allcode, as: 'priceData', attributes: ['valueEn', 'valueVi']},
                        {model: db.Allcode, as: 'paymentData', attributes: ['valueEn', 'valueVi']},
                        {model: db.Allcode, as: 'provinceData', attributes: ['valueEn', 'valueVi']},
                        {model: db.Clinic, attributes: ['name']},
                        {model: db.Clinic_En, attributes: ['name_en']},
                    ],
                    raw: false,
                    nest: true
                })
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

let getProfileDoctorById = (inputId) => {
    return new Promise(async(resolve, reject) => {
        try {
            if(!inputId){
                resolve({
                    errCode: 1,
                    errMessage: 'Thiếu dữ liệu!'
                })
            } else {
                let data = await db.User.findOne({
                    where: { id: inputId, isDelete: 0},
                    attributes: {
                        exclude: ['password']
                    },
                    include: [
                        {model: db.Markdown},
                        {model: db.Markdown_En},
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
                    data.image = new Buffer.from(data.image, 'base64').toString('binary');
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

let getListAppointment = (inputId, inputDate) => {
    return new Promise(async(resolve, reject) => {
        try {
            if(!inputId || !inputDate){
                resolve({
                    errCode: 1,
                    errMessage: 'Thiếu dữ liệu!'
                })
            } else {
                let data = await db.Booking.findAll({
                    where: {
                        statusId: 'S2',
                        doctorId: inputId,
                        date: inputDate
                    },
                    include: [
                        {model: db.User, as:'patientData', attributes: ['email', 'firstName', 'phonenumber', 'address', 'gender'],
                            include: [
                                {model: db.Allcode, as: 'genderData', attributes: ['valueEn', 'valueVi']}
                            ]
                        },
                        {model: db.Allcode, as:'timeTypeData2', attributes: ['valueEn', 'valueVi']}
                    ],
                    raw: false,
                    nest: true
                })
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

let sendConfirm = (data) => {
    return new Promise(async(resolve, reject) => {
        try {
            if(!data.email || !data.doctorId || !data.patientId || !data.timeType || !data.fileBase64){
                resolve({
                    errCode: 1,
                    errMessage: 'Thiếu dữ liệu!'
                })
            } else {
                let appointment = await db.Booking.findOne({
                    where: {
                        doctorId: data.doctorId,
                        patientId: data.patientId,
                        timeType: data.timeType,
                        statusId: 'S2'
                    },
                    raw: false
                })
                if(appointment) {
                    appointment.statusId = 'S3',
                    appointment.bill = data.fileBase64
                    await appointment.save()
                }
                await mailService.sendConfirmMail(data)
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

let getListPatient = (inputId, inputDate) => {
    return new Promise(async(resolve, reject) => {
        try {
            if(!inputId || !inputDate){
                resolve({
                    errCode: 1,
                    errMessage: 'Thiếu dữ liệu!'
                })
            } else {
                let data = await db.Booking.findAll({
                    where: {
                        statusId: 'S3',
                        doctorId: inputId,
                        date: inputDate
                    },
                    include: [
                        {model: db.User, as:'patientData', attributes: ['email', 'firstName', 'lastName', 'phonenumber', 'address', 'gender'],
                            include: [
                                {model: db.Allcode, as: 'genderData', attributes: ['valueEn', 'valueVi']}
                            ]
                        },
                        {model: db.Allcode, as:'timeTypeData2', attributes: ['valueEn', 'valueVi']}
                    ],
                    raw: false,
                    nest: true
                })
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

let deleteSchedule = (data) => {
    return new Promise(async(resolve, reject) => {
        try {
            if(!data.id) {
                resolve({
                    errCode: 1,
                    errMessage: 'Thiếu dữ liệu!',
                })
            } else {
                let schedule = await db.Schedule.findOne({
                    where : {id: data.id},
                })
                if(!schedule) {
                    resolve({
                        errCode: 2,
                        errMessage: 'Kế hoạch không tồn tại!'
                    })
                }
                await db.Schedule.destroy({
                    where : {id: data.id},
                });
                resolve({
                    errCode: 0,
                    message: 'Xóa kế hoạch thành công!'
                })
            }
        } catch (error) {
            reject(error)
        }
    })
}

let confirmCancel = (data) => {
    return new Promise(async(resolve, reject) => {
        try {
            if(!data.id) {
                resolve({
                    errCode: 1,
                    errMessage: 'Thiếu dữ liệu!',
                })
            } else {
                let appointment = await db.Booking.findOne({
                    where: {id: data.id},
                    raw: false
                })
                if(appointment) {
                    appointment.statusId = 'S5',
                    await appointment.save();
                    resolve({
                        errCode: 0,
                        message: 'Hủy thành công!'
                    });
                } else {
                    resolve({
                        errCode: 2,
                        errMessage: 'Lịch hẹn không tồn tại!'
                    });
                }
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
    getDoctorScheduleByDate: getDoctorScheduleByDate,
    getMoreDoctorInfoById: getMoreDoctorInfoById,
    getProfileDoctorById: getProfileDoctorById,
    getListAppointment: getListAppointment,
    sendConfirm: sendConfirm,
    getListPatient,
    deleteSchedule,
    confirmCancel
}
const db = require('../models/index');
require('dotenv').config();
const _ = require ('lodash'); 
const mailService = require('./mailService');
const { v4 : uuidv4 } = require('uuid');

let buildURLMail = (doctorId, token) => {
    let result = `${process.env.URL_REACT}/verify-booking?token=${token}&doctorId=${doctorId}`
    return result;
}

let postPatientBooking = (data) => {
    return new Promise(async(resolve, reject) => {
        try {
            if(!data.email || !data.doctorId || !data.date || !data.timeType ||
                !data.fullName || !data.selectGender || !data.address || !data.phoneNumber) {
                resolve({
                    errCode: 1,
                    errMessage: 'Thiếu dữ liệu!'
                })
            } else {
                let booked = await db.Booking.findOne({
                    where: {
                        patientId : data.patientId,
                        date: data.date,
                        timeType: data.timeType,
                        statusId: 'S2'
                    }
                })
                if(booked){
                    resolve({
                        errCode: 11,
                        errMessage: 'Bạn đã đặt lịch khác vào thời gian này !'
                    })
                } else {
                    let doctor = await db.Booking.findOne({
                        where: {
                            patientId: data.patientId,
                            date: data.date,
                            doctorId: data.doctorId,
                            statusId: 'S2'
                        }
                    })
                    if(doctor){
                        resolve({
                            errCode: 12,
                            errMessage: 'Bạn đã đặt lịch khác của bác sĩ trong ngày !'
                        })
                    } else {
                        let token = uuidv4();
                        await mailService.sendExampleMail({
                            receiveMail: data.email,
                            patientName: data.fullName,
                            time: data.timeString,
                            doctorName: data.doctorName,
                            language: data.language,
                            link: buildURLMail(data.doctorId, token)
                        })

                        let user = await db.User.findOne({
                            where: {email: data.email},
                            raw: false,
                            // defaults: {
                            //     email: data.email,
                            //     roleId: 'R2',
                            //     gender: data.selectGender,
                            //     address: data.address,
                            //     phonenumber: data.phoneNumber,
                            //     firstName: data.fullName
                            // }
                        })
                        if(user) {
                            user.gender = data.selectGender,
                            user.phonenumber = data.phoneNumber,
                            user.address = data.address

                            await user.save();

                            let patient = await db.Booking.findOne({
                                where: {
                                    patientId: user.id,
                                    statusId: 'S1'
                                },
                                raw: false
                                // defaults: {
                                //     statusId: 'S1',
                                //     doctorId: data.doctorId,
                                //     patientId: user[0].id,
                                //     date: data.date,
                                //     timeType: data.timeType
                                // }
                            })
                            if(patient) {
                                patient.statusId = 'S1',
                                patient.doctorId = data.doctorId,
                                patient.patientId = user.id,
                                patient.date = data.date,
                                patient.timeType = data.timeType
                                patient.token = token

                                await patient.save();
                            } else {
                                await db.Booking.create({
                                    statusId: 'S1',
                                    doctorId: data.doctorId,
                                    patientId: user.id,
                                    date: data.date,
                                    timeType: data.timeType,
                                    token: token
                                });
                            }
                        }
                        resolve({
                            errCode: 0,
                            errMessage: 'Gửi yêu cầu đăng kí thành công!'
                        })
                    }
                }      
            }
        } catch (error) {
            reject(error)
        }
    })
}

let postVerifyBooking = (data) => {
    return new Promise(async(resolve, reject) => {
        try {
            if(!data.token || !data.doctorId) {
                resolve({
                    errCode: 1,
                    errMessage: 'Thiếu dữ liệu!'
                })
            } else {
                let appointment = await db.Booking.findOne({
                    where: {
                        doctorId: data.doctorId,
                        token: data.token,
                        statusId: 'S1'
                    },
                    raw: false
                })
                if(appointment) {
                    let currentnumber = await db.Schedule.findOne({
                        where: {
                            doctorId: appointment.doctorId,
                            date: appointment.date,
                            timeType: appointment.timeType
                        },
                        raw: false
                    })
                    if(currentnumber.currentNumber === currentnumber.maxNumber) {
                        resolve({
                            errCode: 3,
                            errMessage: 'Số lương đặt lịch đã đầy. Mong bạn thông cảm!'
                        })
                    } else {
                        let booked = await db.Booking.findOne({
                            where: {
                                patientId : appointment.patientId,
                                date: appointment.date,
                                timeType: appointment.timeType,
                                statusId: 'S2'
                            }
                        })
                        if(booked){
                            resolve({
                                errCode: 11,
                                errMessage: 'Bạn đã đặt lịch khác vào thời gian này!'
                            })
                        } else {
                            let doctor = await db.Booking.findOne({
                                where: {
                                    patientId: appointment.patientId,
                                    date: appointment.date,
                                    doctorId: appointment.doctorId,
                                    statusId: 'S2'
                                }
                            })
                            if(doctor){
                                resolve({
                                    errCode: 12,
                                    errMessage: "Bạn đã đặt lịch khác của bác sĩ trong ngày!"
                                })
                            } else {
                                appointment.statusId = 'S2';
                                currentnumber.currentNumber = currentnumber.currentNumber + 1;
                                await appointment.save();
                                await currentnumber.save();
                                resolve({
                                    errCode: 0,
                                    errMessage: 'Xác nhận đăng kí thành công!'
                                })
                            }
                        }
                    }
                } else {
                    resolve({
                        errCode: 2,
                        errMessage: 'Lịch hẹn đã được xác nhận hoặc không tồn tại!'
                    })
                }
            }
        } catch (error) {
            reject(error)
        }
    })
}

let getListSchedule = (inputId) => {
    return new Promise(async(resolve, reject) => {
        try {
            if(!inputId) {
                resolve({
                    errCode: 1,
                    errMessage: 'Thiếu dữ liệu!'
                })
            } else {
                let data = await db.Booking.findAll({
                    order: [['id', 'ASC']],
                    where: { 
                        patientId: inputId,
                        statusId: 'S2'
                    },
                    include: [
                        {model: db.User, as:'doctorData2', attributes: ['firstName', 'lastName'],
                        include: [{model: db.Doctor_Info,
                            include: [
                                {model: db.Clinic, as:'Clinic'},
                                {model: db.Clinic_En, as: 'Clinic_En'}
                            ]
                        }]
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

let getHistory = (inputId) => {
    return new Promise(async(resolve, reject) => {
        try {
            if(!inputId) {
                resolve({
                    errCode: 1,
                    errMessage: 'Thiếu dữ liệu!'
                })
            } else {
                let data = await db.Booking.findAll({
                    order: [['id', 'ASC']],
                    where: { 
                        patientId: inputId,
                        statusId: 'S3'
                    },
                    include: [
                        {model: db.User, as:'doctorData2', attributes: ['firstName', 'lastName'],
                        include: [
                            {model: db.Doctor_Info,
                                include: [
                                    {model: db.Clinic, as:'Clinic'},
                                    {model: db.Clinic_En, as: 'Clinic_En'}
                                ]
                            },
                        ]
                    },
                        {model: db.Allcode, as:'timeTypeData2', attributes: ['valueEn', 'valueVi']}
                    ],
                    raw: false,
                    nest: true
                })
                if (data && data.length > 0) {
                    data.map(item => {
                        item.bill = new Buffer.from(item.bill, 'base64').toString('binary');
                        return item;
                    })
                }
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

let cancelAppointment = (data) => {
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
                    let schedule = await db.Schedule.findOne({
                        where: {
                            date: appointment.date,
                            timeType: appointment.timeType,
                            doctorId: appointment.doctorId
                        },
                        raw: false
                    })
                    appointment.statusId = 'S4',
                    schedule.currentNumber = schedule.currentNumber - 1;
                    await appointment.save();
                    await schedule.save();
                    resolve({
                        errCode: 0,
                        message: 'Hủy lịch hẹn thành công!'
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
    postPatientBooking: postPatientBooking,
    postVerifyBooking: postVerifyBooking,
    getListSchedule,
    getHistory,
    cancelAppointment
}
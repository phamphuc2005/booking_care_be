const db = require('../models/index');
require('dotenv').config();
const _ = require ('lodash'); 

let checkSpecialtyName = (dataName) => {
    return new Promise(async(resolve, reject) => {
        try {
            let specialty = await db.Specialty.findOne({
                where: {name: dataName}
            })
            if(specialty) {
                resolve(true);
            } else {
                resolve(false);
            }
        } catch (error) {
            reject(error);
        }
    })
}

let checkSpecialtyName_en = (dataName) => {
    return new Promise(async(resolve, reject) => {
        try {
            let specialty = await db.Specialty_En.findOne({
                where: {name: dataName}
            })
            if(specialty) {
                resolve(true);
            } else {
                resolve(false);
            }
        } catch (error) {
            reject(error);
        }
    })
}

let createSpecialty = (data) => {
    return new Promise(async(resolve, reject) => {
        try {
            if(!data.name_vi || !data.imageBase64 || !data.descriptionHTML_vi || !data.descriptionMarkdown_vi ||
                !data.name_en || !data.descriptionHTML_en || !data.descriptionMarkdown_en) {
                resolve({
                    errCode: 1,
                    errMessage: 'Thiếu dữ liệu!'
                })
            } else {
                let check = await checkSpecialtyName(data.name_vi);
                let check_en = await checkSpecialtyName_en(data.name_en);
                if(check === true && check_en === true) {
                    resolve({
                        errCode: -1,
                        errMessage: 'Tên chuyên khoa đã được sử dụng. Vui lòng chọn tên khác!'
                    });
                } else {
                    await db.Specialty.create({
                        name: data.name_vi,
                        image: data.imageBase64,
                        descriptionHTML: data.descriptionHTML_vi,
                        descriptionMarkdown: data.descriptionMarkdown_vi,
                        isDelete: 0
                    })
                    let specialty = await db.Specialty.findOne({
                        where: {name: data.name_vi},
                        raw: false
                    })
                    if(specialty){
                        await db.Specialty_En.create({
                            name: data.name_en,
                            image: data.imageBase64,
                            descriptionHTML: data.descriptionHTML_en,
                            descriptionMarkdown: data.descriptionMarkdown_en,
                            id : specialty.id,
                            isDelete: 0
                        })
                    }
                    resolve({
                        errCode: 0,
                        errMessage: 'OK!'
                    })
                }
            }
        } catch (error) {
            reject(error)
        }
    })
}

let getAllSpecialty = (data_vi, data_en) => {
    return new Promise(async(resolve, reject) => {
        try {
            let data_vi = await db.Specialty.findAll({
                where : {isDelete: 0}
            });
            if (data_vi && data_vi.length > 0) {
                data_vi.map(item => {
                    item.image = new Buffer.from(item.image, 'base64').toString('binary');
                    return item;
                })
            }
            let data_en = await db.Specialty_En.findAll({
                where : {isDelete: 0}
            });
            if (data_en && data_en.length > 0) {
                data_en.map(item => {
                    item.image = new Buffer.from(item.image, 'base64').toString('binary');
                    return item;
                })
            }
            resolve({
                errMessage: "OK!",
                errCode: 0,
                data_vi: data_vi,
                data_en: data_en
            })
        } catch (error) {
            reject(error)
        }
    })
}

let editSpecialty = (data) => {
    return new Promise(async(resolve, reject) => {
        try {
            if(!data.id || !data.name_vi || !data.imageBase64 || !data.descriptionHTML_vi || !data.descriptionMarkdown_vi ||
                !data.name_en || !data.descriptionHTML_en || !data.descriptionMarkdown_en) {
                resolve({
                    errCode: 1,
                    errMessage: 'Thiếu dữ liệu!',
                })
            } else {
                let specialty = await db.Specialty.findOne({
                    where: {id: data.id},
                    raw: false
                })
                let specialty_en = await db.Specialty_En.findOne({
                    where: {id: data.id},
                    raw: false
                })
                if(specialty && specialty_en) {
                    if(specialty.name == data.name_vi && specialty_en.name == data.name_en) {
                        specialty.name = data.name_vi,
                        specialty.image = data.imageBase64,
                        specialty.descriptionHTML = data.descriptionHTML_vi,
                        specialty.descriptionMarkdown = data.descriptionMarkdown_vi;
                        await specialty.save();

                        specialty_en.name = data.name_en,
                        specialty_en.image = data.imageBase64,
                        specialty_en.descriptionHTML = data.descriptionHTML_en,
                        specialty_en.descriptionMarkdown = data.descriptionMarkdown_en;
                        await specialty_en.save();
                        resolve({
                            errCode: 0,
                            message: 'Cập nhật chuyên khoa thành công!'
                        });
                    } else {
                        let check = await checkSpecialtyName(data.name_vi);
                        let check_en = await checkSpecialtyName_en(data.name_en);
                        if(check === true && check_en === true) {
                            resolve({
                                errCode: -1,
                                errMessage: 'Tên chuyên khoa đã được sử dụng. Vui lòng chọn tên khác!'
                            });
                        } else {
                            specialty.name = data.name_vi,
                            specialty.image = data.imageBase64,
                            specialty.descriptionHTML = data.descriptionHTML_vi,
                            specialty.descriptionMarkdown = data.descriptionMarkdown_vi;
                            await specialty.save();

                            specialty_en.name = data.name_en,
                            specialty_en.image = data.imageBase64,
                            specialty_en.descriptionHTML = data.descriptionHTML_en,
                            specialty_en.descriptionMarkdown = data.descriptionMarkdown_en;
                            await specialty_en.save();
                            resolve({
                                errCode: 0,
                                message: 'Cập nhật chuyên khoa thành công!'
                            });
                        }                   
                    }
                } else {
                    resolve({
                        errCode: 2,
                        errMessage: 'Chuyên khoa không tồn tại!'
                    });
                }
            }
        } catch (error) {
            reject(error)
        }
    })
}

let deleteSpecialty = (data) => {
    return new Promise(async(resolve, reject) => {
        try {
            if(!data.id) {
                resolve({
                    errCode: 1,
                    errMessage: 'Thiếu dữ liệu!',
                })
            } else {
                let specialty = await db.Specialty.findOne({
                    where : {id: data.id, isDelete: 0},
                    raw: false
                })
                let specialty_en = await db.Specialty_En.findOne({
                    where : {id: data.id, isDelete: 0},
                    raw: false
                })
                if(!specialty || !specialty_en) {
                    resolve({
                        errCode: 2,
                        errMessage: 'Chuyên khoa không tồn tại!'
                    })
                } else {
                    specialty.isDelete = 1;
                    await specialty.save();
                    specialty_en.isDelete = 1;
                    await specialty_en.save();
                }
                // await db.Specialty.destroy({
                //     where : {id: data.id},
                // });
                // await db.Specialty_En.destroy({
                //     where : {id: data.id},
                // });
                resolve({
                    errCode: 0,
                    message: 'Xóa chuyên khoa thành công!'
                })
            }
        } catch (error) {
            reject(error)
        }
    })
}

let unDeleteSpecialty = (data) => {
    return new Promise(async(resolve, reject) => {
        try {
            if(!data.id) {
                resolve({
                    errCode: 1,
                    errMessage: 'Thiếu dữ liệu!',
                })
            } else {
                let specialty = await db.Specialty.findOne({
                    where : {id: data.id, isDelete: 1},
                    raw: false
                })
                let specialty_en = await db.Specialty_En.findOne({
                    where : {id: data.id, isDelete: 1},
                    raw: false
                })
                if(!specialty || !specialty_en) {
                    resolve({
                        errCode: 2,
                        errMessage: 'Chuyên khoa không tồn tại!'
                    })
                } else {
                    specialty.isDelete = 0;
                    await specialty.save();
                    specialty_en.isDelete = 0;
                    await specialty_en.save();
                }
                resolve({
                    errCode: 0,
                    message: 'Khôi phục chuyên khoa thành công!'
                })
            }
        } catch (error) {
            reject(error)
        }
    })
}

let getDetailSpecialtyById = (inputId, location) => {
    return new Promise(async(resolve, reject) => {
        try {
            if(!inputId || !location) {
                resolve({
                    errCode: 1,
                    errMessage: 'Thiếu dữ liệu!',
                })
            } else {
                let data_vi = await db.Specialty.findOne({
                    where : {id: inputId},
                })
                let data_en = await db.Specialty_En.findOne({
                    where : {id: inputId},
                })

                if(data_vi) {
                    data_vi.image = new Buffer.from(data_vi.image, 'base64').toString('binary');

                    let doctorSpecialty = [];
                    if(location === 'ALL') {
                        doctorSpecialty = await db.Doctor_Info.findAll({
                            where: {specialtyId: inputId},
                            attributes: ['doctorId', 'provinceId']
                        })
                    } else {
                        doctorSpecialty = await db.Doctor_Info.findAll({
                            where: {
                                specialtyId: inputId,
                                provinceId: location
                            },
                            attributes: ['doctorId', 'provinceId']
                        })
                    }
                    data_vi.doctorSpecialty = doctorSpecialty;
                } else data_vi = {};
                if(data_en) {
                    data_en.image = new Buffer.from(data_en.image, 'base64').toString('binary');

                    let doctorSpecialty = [];
                    if(location === 'ALL') {
                        doctorSpecialty = await db.Doctor_Info.findAll({
                            where: {specialtyId: inputId},
                            attributes: ['doctorId', 'provinceId']
                        })
                    } else {
                        doctorSpecialty = await db.Doctor_Info.findAll({
                            where: {
                                specialtyId: inputId,
                                provinceId: location
                            },
                            attributes: ['doctorId', 'provinceId']
                        })
                    }
                    data_en.doctorSpecialty = doctorSpecialty;
                } else data_en = {};
                resolve({
                    errMessage: "OK!",
                    errCode: 0,
                    data_vi: data_vi,
                    data_en: data_en
                }) 
            }
        } catch (error) {
            reject(error)
        }
    })
}

let handleGetTrashSpecialty = (data_vi, data_en) => {
    return new Promise(async(resolve, reject) => {
        try {
            let data_vi = await db.Specialty.findAll({
                where : {isDelete: 1}
            });
            if (data_vi && data_vi.length > 0) {
                data_vi.map(item => {
                    item.image = new Buffer.from(item.image, 'base64').toString('binary');
                    return item;
                })
            }
            let data_en = await db.Specialty_En.findAll({
                where : {isDelete: 1}
            });
            if (data_en && data_en.length > 0) {
                data_en.map(item => {
                    item.image = new Buffer.from(item.image, 'base64').toString('binary');
                    return item;
                })
            }
            resolve({
                errMessage: "OK!",
                errCode: 0,
                data_vi: data_vi,
                data_en: data_en
            })
        } catch (error) {
            reject(error)
        }
    })
}

module.exports = {
    createSpecialty,
    getAllSpecialty,
    editSpecialty,
    deleteSpecialty,
    unDeleteSpecialty,
    getDetailSpecialtyById,
    handleGetTrashSpecialty
}
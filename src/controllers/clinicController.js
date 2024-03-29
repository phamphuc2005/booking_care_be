const clinicService = require ('../services/clinicService');

let createClinic = async (req, res) => {
    try {
        let data = await clinicService.createClinic(req.body);
        return res.status(200).json(data);
    } catch (error) {
        console.log(error);
        return res.status(200).json({
            errCode: -1,
            errMessage: 'Lỗi từ server !'
        })
    }
}

let getAllClinic = async (req, res) => {
    try {
        let data = await clinicService.getAllClinic();
        return res.status(200).json(data);
    } catch (error) {
        console.log(error);
        return res.status(200).json({
            errCode: -1,
            errMessage: 'Lỗi từ server !'
        })
    }
}

let getTrashClinic = async (req, res) => {
    try {
        let data = await clinicService.getTrashClinic();
        return res.status(200).json(data);
    } catch (error) {
        console.log(error);
        return res.status(200).json({
            errCode: -1,
            errMessage: 'Lỗi từ server !'
        })
    }
}

let editClinic = async (req, res) => {
    try {
        let data = await clinicService.editClinic(req.body);
        return res.status(200).json(data);
    } catch (error) {
        console.log(error);
        return res.status(200).json({
            errCode: -1,
            errMessage: 'Lỗi từ server !'
        })
    }
}

let deleteClinic = async (req, res) => {
    try {
        let data = await clinicService.deleteClinic(req.body);
        return res.status(200).json(data);
    } catch (error) {
        console.log(error);
        return res.status(200).json({
            errCode: -1,
            errMessage: 'Lỗi từ server !'
        })
    }
}

let unDeleteClinic = async (req, res) => {
    try {
        let data = await clinicService.unDeleteClinic(req.body.data);
        return res.status(200).json(data);
    } catch (error) {
        console.log(error);
        return res.status(200).json({
            errCode: -1,
            errMessage: 'Lỗi từ server !'
        })
    }
}

let getDetailClinicById = async (req, res) => {
    try {
        let data = await clinicService.getDetailClinicById(req.query.id);
        return res.status(200).json(data);
    } catch (error) {
        console.log(error);
        return res.status(200).json({
            errCode: -1,
            errMessage: 'Lỗi từ server !'
        })
    }
}

module.exports = {
    createClinic,
    getAllClinic,
    editClinic,
    deleteClinic,
    getDetailClinicById,
    getTrashClinic,
    unDeleteClinic
}
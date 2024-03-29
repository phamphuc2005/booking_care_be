const userService = require('../services/userService');

let handleLogin = async (req, res) => {
    let email = req.body.email;
    let password = req.body.password;

    if(!email || !password) {
        return res.status(500).json({
            errCode: 1,
            message: 'Thiếu dữ liệu!'
        })
    }

    let userData = await userService.handleUserLogin(email, password);

    return res.status(200).json({
        errCode: userData.errCode,
        message: userData.errMessage,
        user: userData.user ? userData.user : {}
    })
}

let handleGetAllUsers = async (req, res) => {
    let id = req.query.id; //ALL, ID
    let users = await userService.getAllUsers(id);

    if(!id) {
        return res.status(200).json({
            errCode: 1,
            errMessage: 'Thiếu dữ liệu!',
            users: []
        })
    }

    return res.status(200).json({
        errCode: 0,
        errMessage: 'OK',
        users
    })
}

let handleCreateNewUser = async (req, res) => {
    let message = await userService.createNewUser(req.body);
    return res.status(200).json(message);

}

let handleEditUser = async (req, res) => {
    let data = req.body;
    let message = await userService.updateUser(data);
    return res.status(200).json(message);
}

let handleDeleteUser = async (req, res) => {
    if(!req.body.data.id) {
        return res.status(200).json({
            errCode: 1,
            errMessage: 'Thiếu dữ liệu!',
        })
    }
    let message = await userService.deleteUser(req.body.data.id);
    return res.status(200).json(message);
}

let handleUnDeleteUser = async (req, res) => {
    if(!req.body.data.id) {
        return res.status(200).json({
            errCode: 1,
            errMessage: 'Thiếu dữ liệu!',
        })
    }
    let message = await userService.unDeleteUser(req.body.data.id);
    return res.status(200).json(message);
}

let getAllCode = async (req, res) => {
    try {
        let data = await userService.getAllCodeService(req.query.type);
        return res.status(200).json(data);
    } catch (error) {
        console.log(error)
        return res.status(200).json({
            errCode: -1,
            errMessage: 'Lỗi từ server !'
        })
    }
}

let handleRegister = async (req, res) => {
    try {
        let message = await userService.handleRegister(req.body);
        return res.status(200).json(message);
    } catch (error) {
        return res.status(200).json({
            errCode: -1,
            errMessage: 'Lỗi từ server !'
        })
    }
}

let handleConfirmRegister = async (req, res) => {
    try {
        let message = await userService.handleConfirmRegister(req.body);
        return res.status(200).json(message);
    } catch (error) {
        return res.status(200).json({
            errCode: -1,
            errMessage: 'Lỗi từ server !'
        })
    }
}

let handleUserInfo = async (req, res) => {
    try {
        let data = await userService.handleUserInfo(req.query.id);
        return res.status(200).json(data);
    } catch (error) {
        console.log(error);
        return res.status(200).json({
            errCode: -1,
            errMessage: 'Lỗi từ server !'
        })
    }
}

let handleGetTrashUsers = async (req, res) => {
    try {
        let data = await userService.handleGetTrashUsers();
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
    handleLogin: handleLogin,
    handleGetAllUsers: handleGetAllUsers,
    handleCreateNewUser: handleCreateNewUser,
    handleEditUser: handleEditUser,
    handleDeleteUser: handleDeleteUser,
    getAllCode: getAllCode,
    handleRegister,
    handleConfirmRegister,
    handleUserInfo,
    handleGetTrashUsers,
    handleUnDeleteUser
}
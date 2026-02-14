const Admin = require('../models/Admin');
const authService = require('../services/authService');

async function login(req, res, next) {
    try {
        const { username, password } = req.body;
        const result = await authService.login(req, username, password);

        if (!result.success) {
            return res.status(401).json({ success: false, message: 'Invalid username or password' });
        }

        return res.json({ success: true, sessionToken: result.sessionToken, admin: result.admin });
    } catch (error) {
        return next(error);
    }
}

async function logout(req, res, next) {
    try {
        await authService.logout(req);
        res.clearCookie('connect.sid');
        return res.json({ success: true, message: 'Logged out successfully' });
    } catch (error) {
        return next(error);
    }
}

async function getAdminInfo(_req, res, next) {
    try {
        const admin = await Admin.getAdminPublicInfo();
        return res.json({ success: true, data: admin });
    } catch (error) {
        return next(error);
    }
}

async function updateAdmin(req, res, next) {
    try {
        const { username, password } = req.body;
        const updated = await Admin.updateCredentials(username, password);
        return res.json({ success: true, data: updated });
    } catch (error) {
        return next(error);
    }
}

module.exports = {
    login,
    logout,
    getAdminInfo,
    updateAdmin
};

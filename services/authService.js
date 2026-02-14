const crypto = require('crypto');
const Admin = require('../models/Admin');

const failedLoginAttempts = new Map();

function getClientKey(req) {
    return req.ip || req.headers['x-forwarded-for'] || 'unknown';
}

async function login(req, username, password) {
    const key = getClientKey(req);
    const failures = failedLoginAttempts.get(key) || 0;
    if (failures >= 10) {
        const error = new Error('Too many failed login attempts');
        error.statusCode = 429;
        throw error;
    }

    const isValid = await Admin.verifyPassword(username, password);
    if (!isValid) {
        failedLoginAttempts.set(key, failures + 1);
        return { success: false };
    }

    failedLoginAttempts.delete(key);
    req.session.admin = {
        username,
        loginAt: new Date().toISOString(),
        token: crypto.randomBytes(24).toString('hex')
    };

    return {
        success: true,
        sessionToken: req.session.admin.token,
        admin: await Admin.getAdminPublicInfo()
    };
}

function logout(req) {
    return new Promise((resolve, reject) => {
        req.session.destroy((error) => {
            if (error) {
                reject(error);
                return;
            }
            resolve(true);
        });
    });
}

function verifySession(req) {
    return Boolean(req.session && req.session.admin);
}

module.exports = {
    login,
    logout,
    verifySession,
    failedLoginAttempts
};

const authService = require('../services/authService');

function requireAuth(req, res, next) {
    if (!authService.verifySession(req)) {
        return res.status(401).json({
            success: false,
            message: 'Unauthorized'
        });
    }

    req.user = req.session.admin;
    return next();
}

function csrfProtection(req, res, next) {
    if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) {
        return next();
    }

    const origin = req.headers.origin;
    const host = `${req.protocol}://${req.get('host')}`;

    if (origin && origin !== host) {
        return res.status(403).json({
            success: false,
            message: 'Invalid CSRF origin'
        });
    }

    return next();
}

module.exports = {
    requireAuth,
    csrfProtection
};

const { body, validationResult } = require('express-validator');

const validateLogin = [
    body('username').isString().trim().notEmpty(),
    body('password').isString().trim().notEmpty()
];

const validateMember = [
    body('fullName').isString().trim().notEmpty(),
    body('firstName').optional({ nullable: true }).isString().trim(),
    body('lastName').optional({ nullable: true }).isString().trim(),
    body('title').isString().trim().notEmpty(),
    body('department').isString().trim().notEmpty(),
    body('callsign').optional({ nullable: true }).isString().trim(),
    body('hireDate').optional({ nullable: true }).isISO8601().toDate(),
    body('lastPromotion').optional({ nullable: true }).isISO8601().toDate(),
    body('mi').optional().isBoolean(),
    body('air').optional().isBoolean(),
    body('fp').optional().isBoolean()
];

const validateAdminUpdate = [
    body('username').isString().trim().notEmpty(),
    body('password').isString().isLength({ min: 6 })
];

function runValidation(req, res, next) {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(422).json({
            success: false,
            errors: errors.array()
        });
    }
    return next();
}

module.exports = {
    validateMember,
    validateLogin,
    validateAdminUpdate,
    runValidation
};

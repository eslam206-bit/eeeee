const memberService = require('../services/memberService');

function getMembers(req, res, next) {
    try {
        const { department } = req.query;
        const members = department
            ? memberService.getAllMembers().filter(member => member.department === department)
            : memberService.getAllMembers();

        res.json({
            success: true,
            data: members
        });
    } catch (error) {
        next(error);
    }
}

function createMember(req, res, next) {
    try {
        const created = memberService.createMember(req.body);
        res.status(201).json({
            success: true,
            data: created
        });
    } catch (error) {
        error.statusCode = error.statusCode || 400;
        next(error);
    }
}

function updateMember(req, res, next) {
    try {
        const updated = memberService.updateMember(Number(req.params.id), req.body);
        if (!updated) {
            return res.status(404).json({
                success: false,
                message: 'Member not found'
            });
        }

        return res.json({
            success: true,
            data: updated
        });
    } catch (error) {
        error.statusCode = error.statusCode || 400;
        return next(error);
    }
}

function deleteMember(req, res, next) {
    try {
        const deleted = memberService.deleteMember(Number(req.params.id));
        if (!deleted) {
            return res.status(404).json({
                success: false,
                message: 'Member not found'
            });
        }

        return res.json({
            success: true,
            message: 'Member deleted'
        });
    } catch (error) {
        return next(error);
    }
}

function checkCallsign(req, res, next) {
    try {
        const callsign = req.query.callsign;
        if (!callsign) {
            return res.status(400).json({ success: false, message: 'callsign query param required' });
        }

        const available = memberService.isCallsignAvailable(callsign);
        return res.json({ success: true, available });
    } catch (error) {
        return next(error);
    }
}

module.exports = {
    getMembers,
    createMember,
    updateMember,
    deleteMember,
    checkCallsign
};



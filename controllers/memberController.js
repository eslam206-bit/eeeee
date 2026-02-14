const memberService = require('../services/memberService');

async function getMembers(req, res, next) {
    try {
        const { department } = req.query;
        const all = await memberService.getAllMembers();
        const members = department ? all.filter(member => member.department === department) : all;

        res.json({ success: true, data: members });
    } catch (error) {
        next(error);
    }
}

async function createMember(req, res, next) {
    try {
        // Debug: log incoming payload to help diagnose missing fields
        console.log('[DEBUG] createMember payload:', {
            body: req.body
        });
        const created = await memberService.createMember(req.body);
        res.status(201).json({ success: true, data: created });
    } catch (error) {
        error.statusCode = error.statusCode || 400;
        next(error);
    }
}

async function updateMember(req, res, next) {
    try {
        // Debug: log incoming payload for update
        console.log('[DEBUG] updateMember id=%s payload:', req.params.id, { body: req.body });
        const updated = await memberService.updateMember(Number(req.params.id), req.body);
        if (!updated) {
            return res.status(404).json({ success: false, message: 'Member not found' });
        }

        return res.json({ success: true, data: updated });
    } catch (error) {
        error.statusCode = error.statusCode || 400;
        return next(error);
    }
}

async function deleteMember(req, res, next) {
    try {
        const deleted = await memberService.deleteMember(Number(req.params.id));
        if (!deleted) {
            return res.status(404).json({ success: false, message: 'Member not found' });
        }

        return res.json({ success: true, message: 'Member deleted' });
    } catch (error) {
        return next(error);
    }
}

async function checkCallsign(req, res, next) {
    try {
        const callsign = req.query.callsign;
        if (!callsign) {
            return res.status(400).json({ success: false, message: 'callsign query param required' });
        }

        const available = await memberService.isCallsignAvailable(callsign);
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



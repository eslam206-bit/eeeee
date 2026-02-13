const dataService = require('../services/dataService');
const memberService = require('../services/memberService');

function exportAll(_req, res, next) {
    try {
        const data = dataService.exportAllData();
        res.json({
            success: true,
            data
        });
    } catch (error) {
        next(error);
    }
}

function exportMembers(_req, res, next) {
    try {
        const data = dataService.exportMembers();
        res.json({
            success: true,
            data
        });
    } catch (error) {
        next(error);
    }
}

function importData(req, res, next) {
    try {
        const result = dataService.importData(req.body);
        // Invalidate members cache so GET /api/members reflects the imported data
        try {
            if (memberService && typeof memberService.invalidateMembersCache === 'function') {
                memberService.invalidateMembersCache();
            }
        } catch (err) {
            // Non-fatal: continue to return success while logging
            console.warn('Failed to invalidate members cache after import', err);
        }

        res.json({
            success: true,
            data: result
        });
    } catch (error) {
        error.statusCode = error.statusCode || 400;
        next(error);
    }
}

module.exports = {
    exportAll,
    exportMembers,
    importData
};

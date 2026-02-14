const dataService = require('../services/dataService');
const memberService = require('../services/memberService');

async function exportAll(_req, res, next) {
    try {
        const data = await dataService.exportAllData();
        res.json({ success: true, data });
    } catch (error) {
        next(error);
    }
}

async function exportMembers(_req, res, next) {
    try {
        const data = await dataService.exportMembers();
        res.json({ success: true, data });
    } catch (error) {
        next(error);
    }
}

async function importData(req, res, next) {
    try {
        const result = await dataService.importData(req.body);
        try {
            if (memberService && typeof memberService.invalidateMembersCache === 'function') {
                memberService.invalidateMembersCache();
            }
        } catch (err) {
            console.warn('Failed to invalidate members cache after import', err);
        }

        res.json({ success: true, data: result });
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

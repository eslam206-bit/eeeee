const db = require('../database/connection');
const Member = require('../models/Member');
const Admin = require('../models/Admin');
const imageHandler = require('../utils/imageHandler');

async function exportMembers() {
    return {
        members: await Member.findAll(),
        exportDate: new Date().toISOString(),
        version: '2.0'
    };
}

async function exportAllData() {
    return {
        members: await Member.findAll(),
        admin: await Admin.getAdminPublicInfo(),
        exportDate: new Date().toISOString(),
        version: '2.0'
    };
}

async function importData(jsonData) {
    if (!jsonData || !Array.isArray(jsonData.members)) {
        throw new Error('Invalid import payload');
    }

    const incomingPhotos = new Set(
        jsonData.members
            .map(m => (m && m.photo) ? String(m.photo).trim() : null)
            .filter(Boolean)
    );

    try {
        const rows = await db.all('SELECT photo FROM members WHERE photo IS NOT NULL AND photo != ""');
        for (const r of rows) {
            const existing = r.photo;
            if (!existing) continue;
            if (!incomingPhotos.has(existing)) {
                try {
                    imageHandler.removePhoto(existing);
                } catch (err) {
                    console.warn('Failed to remove orphaned photo', existing, err);
                }
            }
        }
    } catch (err) {
        console.warn('Failed to cleanup orphaned photos before import', err);
    }

    await db.transaction(async (tx) => {
        const run = (tx && tx.query) ? (sql, params) => tx.query(sql, params) : db.run;

        await run('DELETE FROM members');

        const insertSql = `INSERT INTO members (
                fullName, firstName, lastName, title, callsign, department,
                hireDate, lastPromotion, discord, notes, mi, air, fp, photo,
                createdAt, updatedAt
            ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16)`;
        for (const member of jsonData.members) {
            const now = new Date().toISOString();
            await run(insertSql, [
                member.fullName || `${member.firstName || ''} ${member.lastName || ''}`.trim(),
                member.firstName || '',
                member.lastName || '',
                member.title || '',
                member.callsign || null,
                member.department || '',
                member.hireDate || null,
                member.lastPromotion || null,
                member.discord || null,
                member.notes || null,
                member.mi ? 1 : 0,
                member.air ? 1 : 0,
                member.fp ? 1 : 0,
                member.photo || null,
                member.createdAt || now,
                member.updatedAt || now
            ]);
        }
    });

    return {
        success: true,
        importedMembers: jsonData.members.length
    };
}

module.exports = {
    exportAllData,
    exportMembers,
    importData
};

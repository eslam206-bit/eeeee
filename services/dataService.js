const db = require('../database/connection');
const Member = require('../models/Member');
const Admin = require('../models/Admin');
const imageHandler = require('../utils/imageHandler');

function exportMembers() {
    return {
        members: Member.findAll(),
        exportDate: new Date().toISOString(),
        version: '2.0'
    };
}

function exportAllData() {
    return {
        members: Member.findAll(),
        admin: Admin.getAdminPublicInfo(),
        exportDate: new Date().toISOString(),
        version: '2.0'
    };
}

function importData(jsonData) {
    if (!jsonData || !Array.isArray(jsonData.members)) {
        throw new Error('Invalid import payload');
    }

    // Remove orphaned photos: determine which photo paths are used in incoming payload
    const incomingPhotos = new Set(
        jsonData.members
            .map(m => (m && m.photo) ? String(m.photo).trim() : null)
            .filter(Boolean)
    );

    try {
        const rows = db.prepare('SELECT photo FROM members WHERE photo IS NOT NULL AND photo != ""').all();
        for (const r of rows) {
            const existing = r.photo;
            if (!existing) continue;
            // If existing photo is not referenced by incoming payload, remove it
            if (!incomingPhotos.has(existing)) {
                try {
                    imageHandler.removePhoto(existing);
                } catch (err) {
                    console.warn('Failed to remove orphaned photo', existing, err);
                }
            }
        }
    } catch (err) {
        // Non-fatal: log and continue with import
        console.warn('Failed to cleanup orphaned photos before import', err);
    }

    const transaction = db.transaction((payload) => {
        db.prepare('DELETE FROM members').run();

        const insert = db.prepare(`
            INSERT INTO members (
                fullName, firstName, lastName, title, callsign, department,
                hireDate, lastPromotion, discord, notes, mi, air, fp, photo,
                createdAt, updatedAt
            ) VALUES (
                @fullName, @firstName, @lastName, @title, @callsign, @department,
                @hireDate, @lastPromotion, @discord, @notes, @mi, @air, @fp, @photo,
                @createdAt, @updatedAt
            )
        `);

        for (const member of payload.members) {
            const now = new Date().toISOString();
            insert.run({
                fullName: member.fullName || `${member.firstName || ''} ${member.lastName || ''}`.trim(),
                firstName: member.firstName || '',
                lastName: member.lastName || '',
                title: member.title || '',
                callsign: member.callsign || null,
                department: member.department || '',
                hireDate: member.hireDate || null,
                lastPromotion: member.lastPromotion || null,
                discord: member.discord || null,
                notes: member.notes || null,
                mi: member.mi ? 1 : 0,
                air: member.air ? 1 : 0,
                fp: member.fp ? 1 : 0,
                photo: member.photo || null,
                createdAt: member.createdAt || now,
                updatedAt: member.updatedAt || now
            });
        }
    });

    transaction(jsonData);

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

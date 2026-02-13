const fs = require('fs');
const path = require('path');
const bcrypt = require('bcrypt');
const db = require('./connection');

const schemaPath = path.resolve(__dirname, 'schema.sql');
const membersJsonPath = path.resolve(process.cwd(), 'data', 'members.json');
const adminJsonPath = path.resolve(process.cwd(), 'data', 'admin.json');

function readJson(filePath, fallbackValue) {
    try {
        if (!fs.existsSync(filePath)) {
            return fallbackValue;
        }
        const raw = fs.readFileSync(filePath, 'utf8');
        if (!raw.trim()) {
            return fallbackValue;
        }
        return JSON.parse(raw);
    } catch (_error) {
        return fallbackValue;
    }
}

function normalizeMember(member) {
    const now = new Date().toISOString();
    const fullName = member.fullName || `${member.firstName || ''} ${member.lastName || ''}`.trim() || 'Unknown';
    const [firstName, ...rest] = fullName.split(' ');
    return {
        fullName,
        firstName: member.firstName || firstName || '',
        lastName: member.lastName || rest.join(' ') || '',
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
    };
}

function migrateMembersFromJson() {
    const existingCount = db.prepare('SELECT COUNT(*) AS count FROM members').get().count;
    if (existingCount > 0) {
        return;
    }

    const members = readJson(membersJsonPath, []);
    if (!Array.isArray(members) || members.length === 0) {
        return;
    }

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

    const insertMany = db.transaction((rows) => {
        for (const row of rows) {
            insert.run(normalizeMember(row));
        }
    });

    insertMany(members);
}

function createOrMigrateAdmin() {
    const existing = db.prepare('SELECT id FROM admin LIMIT 1').get();
    if (existing) {
        return;
    }

    const now = new Date().toISOString();
    const adminData = readJson(adminJsonPath, null);

    let username = 'EMS';
    let plainPassword = '7408574';

    if (adminData && typeof adminData === 'object') {
        username = adminData.username || username;
        plainPassword = adminData.plainPassword || adminData.password || plainPassword;
    }

    const hashed = bcrypt.hashSync(String(plainPassword), 12);

    db.prepare(`
        INSERT INTO admin (username, password, createdAt, updatedAt)
        VALUES (?, ?, ?, ?)
    `).run(username, hashed, now, now);
}

function initializeDatabase() {
    const schemaSql = fs.readFileSync(schemaPath, 'utf8');
    db.exec(schemaSql);
    migrateMembersFromJson();
    createOrMigrateAdmin();
}

module.exports = {
    initializeDatabase,
    migrateMembersFromJson,
    createOrMigrateAdmin
};

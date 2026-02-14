const fs = require('fs');
const path = require('path');
const bcrypt = require('bcrypt');
const db = require('./connection');

const schemaPath = path.resolve(__dirname, 'schema.sql');
const schemaPgPath = path.resolve(__dirname, 'schema-postgres.sql');
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

async function migrateMembersFromJson() {
    const countRow = await db.get('SELECT COUNT(*) AS count FROM members');
    const existingCount = countRow && countRow.count ? Number(countRow.count) : 0;
    if (existingCount > 0) {
        return;
    }

    const members = readJson(membersJsonPath, []);
    if (!Array.isArray(members) || members.length === 0) {
        return;
    }

    // Use transaction for import
    await db.transaction(async (tx) => {
        const run = (tx && tx.query) ? (sql, params) => tx.query(sql, params) : db.run;

        const insertSql = `
            INSERT INTO members (
                fullName, firstName, lastName, title, callsign, department,
                hireDate, lastPromotion, discord, notes, mi, air, fp, photo,
                createdAt, updatedAt
            ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16)
            `;

        for (const m of members) {
            const nm = normalizeMember(m);
            await run(insertSql, [
                nm.fullName, nm.firstName, nm.lastName, nm.title, nm.callsign, nm.department,
                nm.hireDate, nm.lastPromotion, nm.discord, nm.notes, nm.mi ? 1 : 0, nm.air ? 1 : 0, nm.fp ? 1 : 0,
                nm.photo, nm.createdAt, nm.updatedAt
            ]);
        }
    });
}

async function createOrMigrateAdmin() {
    const existing = await db.get('SELECT id FROM admin LIMIT 1');
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

    await db.run('INSERT INTO admin (username, password, createdAt, updatedAt) VALUES ($1,$2,$3,$4)', [username, hashed, now, now]);
}

async function initializeDatabase() {
    // Choose schema based on adapter
    const schemaSql = (process.env.DB_TYPE === 'postgres')
        ? fs.readFileSync(schemaPgPath, 'utf8')
        : fs.readFileSync(schemaPath, 'utf8');

    // For sqlite adapter, exec might be supported via the underlying driver; for postgres we execute statements
    if (process.env.DB_TYPE === 'postgres') {
        // split on semicolons and run each non-empty statement inside a single transaction
        const statements = schemaSql.split(/;\s*\n/).map(s => s.trim()).filter(Boolean);
        await db.transaction(async (tx) => {
            for (const stmt of statements) {
                if (!stmt) continue;
                try {
                    await tx.query(stmt);
                } catch (err) {
                    console.error('Failed to execute schema statement:', stmt.slice(0, 200));
                    throw err;
                }
            }
        });
    } else {
        // sqlite - adapter provides run/get/all but not exec; execute schema safely.
        try {
            // If adapter exposes raw client (better-sqlite3), use exec to run multi-statement SQL
            if (db && db.client && typeof db.client.exec === 'function') {
                db.client.exec(schemaSql);
            } else {
                // Fallback: split statements and run each individually
                const statements = schemaSql.split(/;\s*\n/).map(s => s.trim()).filter(Boolean);
                for (const stmt of statements) {
                    if (!stmt) continue;
                    await db.run(stmt);
                }
            }
        } catch (err) {
            console.error('Failed to execute sqlite schema:', err);
            throw err;
        }
    }

    await migrateMembersFromJson();
    await createOrMigrateAdmin();
}

module.exports = {
    initializeDatabase,
    migrateMembersFromJson,
    createOrMigrateAdmin
};

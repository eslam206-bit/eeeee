const bcrypt = require('bcrypt');
const db = require('../database/connection');

function sanitizeAdmin(admin) {
    if (!admin) {
        return null;
    }

    return {
        id: admin.id,
        username: admin.username,
        createdAt: admin.createdAt,
        updatedAt: admin.updatedAt
    };
}

async function findByUsername(username) {
    return db.get('SELECT * FROM admin WHERE username = $1', [username]);
}

async function getAdminPublicInfo() {
    const row = await db.get('SELECT id, username, createdAt, updatedAt FROM admin ORDER BY id ASC LIMIT 1');
    return sanitizeAdmin(row);
}

async function verifyPassword(username, password) {
    const admin = await findByUsername(username);
    if (!admin) {
        return false;
    }
    return bcrypt.compareSync(String(password), admin.password);
}

async function updateCredentials(username, password) {
    const existing = await db.get('SELECT id FROM admin ORDER BY id ASC LIMIT 1');
    const now = new Date().toISOString();
    const hashedPassword = bcrypt.hashSync(String(password), 12);

    if (existing) {
        await db.run('UPDATE admin SET username = $1, password = $2, updatedAt = $3 WHERE id = $4', [username, hashedPassword, now, existing.id]);
        return getAdminPublicInfo();
    }

    await db.run('INSERT INTO admin (username, password, createdAt, updatedAt) VALUES ($1,$2,$3,$4)', [username, hashedPassword, now, now]);
    return getAdminPublicInfo();
}

module.exports = {
    findByUsername,
    verifyPassword,
    updateCredentials,
    getAdminPublicInfo
};

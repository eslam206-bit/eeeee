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

function findByUsername(username) {
    return db.prepare('SELECT * FROM admin WHERE username = ?').get(username);
}

function getAdminPublicInfo() {
    const row = db.prepare('SELECT id, username, createdAt, updatedAt FROM admin ORDER BY id ASC LIMIT 1').get();
    return sanitizeAdmin(row);
}

function verifyPassword(username, password) {
    const admin = findByUsername(username);
    if (!admin) {
        return false;
    }
    return bcrypt.compareSync(String(password), admin.password);
}

function updateCredentials(username, password) {
    const existing = db.prepare('SELECT id FROM admin ORDER BY id ASC LIMIT 1').get();
    const now = new Date().toISOString();
    const hashedPassword = bcrypt.hashSync(String(password), 12);

    if (existing) {
        db.prepare('UPDATE admin SET username = ?, password = ?, updatedAt = ? WHERE id = ?').run(username, hashedPassword, now, existing.id);
        return getAdminPublicInfo();
    }

    db.prepare('INSERT INTO admin (username, password, createdAt, updatedAt) VALUES (?, ?, ?, ?)').run(username, hashedPassword, now, now);
    return getAdminPublicInfo();
}

module.exports = {
    findByUsername,
    verifyPassword,
    updateCredentials,
    getAdminPublicInfo
};

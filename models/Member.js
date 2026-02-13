const db = require('../database/connection');

const baseColumns = `
    id, fullName, firstName, lastName, title, callsign, department,
    hireDate, lastPromotion, discord, notes, mi, air, fp, photo,
    createdAt, updatedAt
`;

function normalizeRow(row) {
    if (!row) {
        return null;
    }

    return {
        ...row,
        mi: Boolean(row.mi),
        air: Boolean(row.air),
        fp: Boolean(row.fp)
    };
}

function findAll() {
    const rows = db.prepare(`SELECT ${baseColumns} FROM members ORDER BY id DESC`).all();
    return rows.map(normalizeRow);
}

function findById(id) {
    const row = db.prepare(`SELECT ${baseColumns} FROM members WHERE id = ?`).get(id);
    return normalizeRow(row);
}

function findByDepartment(department) {
    const rows = db.prepare(`SELECT ${baseColumns} FROM members WHERE department = ? ORDER BY id DESC`).all(department);
    return rows.map(normalizeRow);
}

function findByCallsign(callsign) {
    const row = db.prepare(`SELECT ${baseColumns} FROM members WHERE callsign = ?`).get(callsign);
    return normalizeRow(row);
}

function create(memberData) {
    const stmt = db.prepare(`
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

    const result = stmt.run({
        ...memberData,
        mi: memberData.mi ? 1 : 0,
        air: memberData.air ? 1 : 0,
        fp: memberData.fp ? 1 : 0
    });

    return findById(result.lastInsertRowid);
}

function update(id, memberData) {
    const stmt = db.prepare(`
        UPDATE members SET
            fullName = @fullName,
            firstName = @firstName,
            lastName = @lastName,
            title = @title,
            callsign = @callsign,
            department = @department,
            hireDate = @hireDate,
            lastPromotion = @lastPromotion,
            discord = @discord,
            notes = @notes,
            mi = @mi,
            air = @air,
            fp = @fp,
            photo = @photo,
            updatedAt = @updatedAt
        WHERE id = @id
    `);

    stmt.run({
        ...memberData,
        id,
        mi: memberData.mi ? 1 : 0,
        air: memberData.air ? 1 : 0,
        fp: memberData.fp ? 1 : 0
    });

    return findById(id);
}

function remove(id) {
    const stmt = db.prepare('DELETE FROM members WHERE id = ?');
    const result = stmt.run(id);
    return result.changes > 0;
}

module.exports = {
    findAll,
    findById,
    create,
    update,
    delete: remove,
    findByDepartment,
    findByCallsign
};

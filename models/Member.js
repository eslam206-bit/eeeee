const db = require('../database/connection');

const baseColumns = `
    id,
    fullName AS "fullName",
    firstName AS "firstName",
    lastName AS "lastName",
    title,
    callsign,
    department,
    hireDate AS "hireDate",
    lastPromotion AS "lastPromotion",
    discord,
    notes,
    mi,
    air,
    fp,
    photo,
    createdAt AS "createdAt",
    updatedAt AS "updatedAt"
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

async function findAll() {
    const rows = await db.all(`SELECT ${baseColumns} FROM members ORDER BY id DESC`);
    return (rows || []).map(normalizeRow);
}

async function findById(id) {
    const row = await db.get(`SELECT ${baseColumns} FROM members WHERE id = $1`, [id]);
    return normalizeRow(row);
}

async function findByDepartment(department) {
    const rows = await db.all(`SELECT ${baseColumns} FROM members WHERE department = $1 ORDER BY id DESC`, [department]);
    return (rows || []).map(normalizeRow);
}

async function findByCallsign(callsign) {
    const row = await db.get(`SELECT ${baseColumns} FROM members WHERE callsign = $1`, [callsign]);
    return normalizeRow(row);
}

async function create(memberData) {
    const returning = (process.env.DB_TYPE === 'postgres') ? 'RETURNING id' : '';
    const sql = `INSERT INTO members (
            fullName, firstName, lastName, title, callsign, department,
            hireDate, lastPromotion, discord, notes, mi, air, fp, photo,
            createdAt, updatedAt
        ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16) ${returning}`;

    const params = [
        memberData.fullName,
        memberData.firstName,
        memberData.lastName,
        memberData.title,
        memberData.callsign || null,
        memberData.department,
        memberData.hireDate || null,
        memberData.lastPromotion || null,
        memberData.discord || null,
        memberData.notes || null,
        memberData.mi ? 1 : 0,
        memberData.air ? 1 : 0,
        memberData.fp ? 1 : 0,
        memberData.photo || null,
        memberData.createdAt,
        memberData.updatedAt
    ];

    const result = await db.run(sql, params);
    const newId = result.lastInsertRowid || (result && result.lastInsertRowid) || (result && result.id) || null;
    return findById(newId);
}

async function update(id, memberData) {
    const sql = `UPDATE members SET
            fullName = $1,
            firstName = $2,
            lastName = $3,
            title = $4,
            callsign = $5,
            department = $6,
            hireDate = $7,
            lastPromotion = $8,
            discord = $9,
            notes = $10,
            mi = $11,
            air = $12,
            fp = $13,
            photo = $14,
            updatedAt = $15
        WHERE id = $16`;

    const params = [
        memberData.fullName,
        memberData.firstName,
        memberData.lastName,
        memberData.title,
        memberData.callsign || null,
        memberData.department,
        memberData.hireDate || null,
        memberData.lastPromotion || null,
        memberData.discord || null,
        memberData.notes || null,
        memberData.mi ? 1 : 0,
        memberData.air ? 1 : 0,
        memberData.fp ? 1 : 0,
        memberData.photo || null,
        memberData.updatedAt,
        id
    ];

    await db.run(sql, params);
    return findById(id);
}

async function remove(id) {
    const result = await db.run('DELETE FROM members WHERE id = $1', [id]);
    return result && result.changes > 0;
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

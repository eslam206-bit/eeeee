const Member = require('../models/Member');
const cache = require('../utils/cache');
const imageHandler = require('../utils/imageHandler');

const MEMBERS_CACHE_KEY = 'members:list';

function normalizeNameFields(memberData) {
    const fullName = (memberData.fullName || '').trim();
    const parts = fullName.split(' ').filter(Boolean);
    // Convert empty strings to undefined so || operator works as expected
    const firstName = memberData.firstName && String(memberData.firstName).trim() ? String(memberData.firstName).trim() : undefined;
    const lastName = memberData.lastName && String(memberData.lastName).trim() ? String(memberData.lastName).trim() : undefined;
    return {
        ...memberData,
        fullName,
        firstName: firstName || parts[0] || '',
        lastName: lastName || parts.slice(1).join(' ') || ''
    };
}

function sanitizeDateFields(memberData) {
    function parseDateToISO(value) {
        if (!value) return null;
        const s = String(value).trim();
        if (!s) return null;
        const d = new Date(s);
        if (Number.isNaN(d.getTime())) return null;
        return d.toISOString();
    }

    return {
        ...memberData,
        hireDate: parseDateToISO(memberData.hireDate),
        lastPromotion: parseDateToISO(memberData.lastPromotion)
    };
}

function validateMemberData(memberData, { isUpdate = false } = {}) {
    if (!isUpdate && !memberData.fullName) {
        throw new Error('fullName is required');
    }

    if (!memberData.title) {
        throw new Error('title is required');
    }

    if (!memberData.department) {
        throw new Error('department is required');
    }

    if (memberData.callsign && typeof memberData.callsign !== 'string') {
        throw new Error('callsign must be a string');
    }
}

function processPhoto(photo, previousPhotoPath = null) {
    if (!photo) {
        return previousPhotoPath || null;
    }

    if (!photo.startsWith('data:image/')) {
        return photo;
    }

    if (Buffer.byteLength(photo, 'utf8') > 7 * 1024 * 1024) {
        throw new Error('photo payload too large');
    }

    const storedPath = imageHandler.saveBase64Image(photo);
    if (previousPhotoPath && previousPhotoPath !== storedPath) {
        imageHandler.removePhoto(previousPhotoPath);
    }
    return storedPath;
}

function invalidateMembersCache() {
    cache.del(MEMBERS_CACHE_KEY);
}

async function isCallsignAvailable(callsign) {
    if (!callsign) return true;
    const existing = await Member.findByCallsign(callsign);
    return !existing;
}

async function getAllMembers() {
    const cached = cache.get(MEMBERS_CACHE_KEY);
    if (cached) {
        return cached;
    }

    const members = await Member.findAll();
    cache.set(MEMBERS_CACHE_KEY, members);
    return members;
}

async function getMemberById(id) {
    return Member.findById(id);
}

async function createMember(memberData) {
    let normalized = normalizeNameFields(memberData);
    normalized = sanitizeDateFields(normalized);
    validateMemberData(normalized);

    if (normalized.callsign) {
        const existing = await Member.findByCallsign(normalized.callsign);
        if (existing) {
            const err = new Error('callsign already exists');
            err.statusCode = 409;
            throw err;
        }
    }

    const now = new Date().toISOString();
    const created = await Member.create({
        ...normalized,
        callsign: normalized.callsign || null,
        photo: processPhoto(normalized.photo || null),
        createdAt: now,
        updatedAt: now
    });

    invalidateMembersCache();
    return created;
}

async function updateMember(id, memberData) {
    const existing = await Member.findById(id);
    if (!existing) {
        return null;
    }

    const merged = normalizeNameFields({ ...existing, ...memberData });
    const sanitized = sanitizeDateFields(merged);
    validateMemberData(sanitized, { isUpdate: true });

    if (merged.callsign && merged.callsign !== existing.callsign) {
        const withSameCallsign = await Member.findByCallsign(merged.callsign);
        if (withSameCallsign && Number(withSameCallsign.id) !== Number(id)) {
            const err = new Error('callsign already exists');
            err.statusCode = 409;
            throw err;
        }
    }

    const updated = await Member.update(id, {
        ...sanitized,
        callsign: sanitized.callsign || null,
        photo: processPhoto(sanitized.photo, existing.photo),
        updatedAt: new Date().toISOString()
    });

    invalidateMembersCache();
    return updated;
}

async function deleteMember(id) {
    const existing = await Member.findById(id);
    if (!existing) {
        return false;
    }

    if (existing.photo) {
        imageHandler.removePhoto(existing.photo);
    }

    const deleted = await Member.delete(id);
    invalidateMembersCache();
    return deleted;
}

module.exports = {
    getAllMembers,
    getMemberById,
    createMember,
    updateMember,
    deleteMember,
    invalidateMembersCache,
    isCallsignAvailable
};

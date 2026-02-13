const Member = require('../models/Member');
const cache = require('../utils/cache');
const imageHandler = require('../utils/imageHandler');

const MEMBERS_CACHE_KEY = 'members:list';

function normalizeNameFields(memberData) {
    const fullName = (memberData.fullName || '').trim();
    const parts = fullName.split(' ').filter(Boolean);
    return {
        ...memberData,
        fullName,
        firstName: memberData.firstName || parts[0] || '',
        lastName: memberData.lastName || parts.slice(1).join(' ') || ''
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

function isCallsignAvailable(callsign) {
    if (!callsign) return true;
    const existing = Member.findByCallsign(callsign);
    return !existing;
}

function getAllMembers() {
    const cached = cache.get(MEMBERS_CACHE_KEY);
    if (cached) {
        return cached;
    }

    const members = Member.findAll();
    cache.set(MEMBERS_CACHE_KEY, members);
    return members;
}

function getMemberById(id) {
    return Member.findById(id);
}

function createMember(memberData) {
    const normalized = normalizeNameFields(memberData);
    validateMemberData(normalized);

    if (normalized.callsign) {
        const existing = Member.findByCallsign(normalized.callsign);
        if (existing) {
            const err = new Error('callsign already exists');
            err.statusCode = 409;
            throw err;
        }
    }

    const now = new Date().toISOString();
    const created = Member.create({
        ...normalized,
        callsign: normalized.callsign || null,
        photo: processPhoto(normalized.photo || null),
        createdAt: now,
        updatedAt: now
    });

    invalidateMembersCache();
    return created;
}

function updateMember(id, memberData) {
    const existing = Member.findById(id);
    if (!existing) {
        return null;
    }

    const merged = normalizeNameFields({ ...existing, ...memberData });
    validateMemberData(merged, { isUpdate: true });

    if (merged.callsign && merged.callsign !== existing.callsign) {
        const withSameCallsign = Member.findByCallsign(merged.callsign);
        if (withSameCallsign && Number(withSameCallsign.id) !== Number(id)) {
            const err = new Error('callsign already exists');
            err.statusCode = 409;
            throw err;
        }
    }

    const updated = Member.update(id, {
        ...merged,
        callsign: merged.callsign || null,
        photo: processPhoto(merged.photo, existing.photo),
        updatedAt: new Date().toISOString()
    });

    invalidateMembersCache();
    return updated;
}

function deleteMember(id) {
    const existing = Member.findById(id);
    if (!existing) {
        return false;
    }

    if (existing.photo) {
        imageHandler.removePhoto(existing.photo);
    }

    const deleted = Member.delete(id);
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

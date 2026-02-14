const API_ENDPOINTS = {
    MEMBERS: '/api/members',
    ADMIN: '/api/admin',
    LOGIN: '/api/auth/login',
    LOGOUT: '/api/auth/logout',
    EXPORT_ALL: '/api/data/export',
    EXPORT_MEMBERS: '/api/data/export/members',
    IMPORT: '/api/data/import'
};

const API_BASE_URL = (typeof window !== 'undefined' && window.location.protocol === 'file:')
    ? 'http://localhost:3000'
    : '';

// Date helpers
// formatDisplayDate: for table/dialog display (DD/MM/YYYY)
function formatDisplayDate(dateStr) {
    if (!dateStr) return '';
    try {
        const d = new Date(dateStr);
        if (Number.isNaN(d.getTime())) return '';
        return d.toLocaleDateString('en-GB');
    } catch (_e) {
        return '';
    }
}

// formatInputDate: for setting <input type="date"> values (YYYY-MM-DD)
function formatInputDate(dateStr) {
    if (!dateStr) return '';
    try {
        const d = new Date(dateStr);
        if (Number.isNaN(d.getTime())) return '';
        return d.toISOString().slice(0, 10);
    } catch (_e) {
        return '';
    }
}

// Expose globally for other scripts
window.formatDisplayDate = formatDisplayDate;
window.formatInputDate = formatInputDate;

let membersCache = [];
let adminCache = null;

async function requestJSON(method, endpoint, payload = null) {
    const resolvedEndpoint = endpoint.startsWith('http') ? endpoint : `${API_BASE_URL}${endpoint}`;

    const response = await fetch(resolvedEndpoint, {
        method,
        credentials: 'include',
        headers: {
            'Content-Type': 'application/json'
        },
        body: payload ? JSON.stringify(payload) : undefined
    });

    const text = await response.text();
    const body = text ? JSON.parse(text) : null;

    if (!response.ok) {
        const message = body?.message || body?.error || `HTTP ${response.status}`;
        throw new Error(message);
    }

    return body;
}

async function initStorage() {
    try {
        const membersResponse = await requestJSON('GET', API_ENDPOINTS.MEMBERS);
        membersCache = Array.isArray(membersResponse?.data) ? membersResponse.data : [];
    } catch (_error) {
        membersCache = [];
    }

    document.dispatchEvent(new CustomEvent('dataUpdated', {
        detail: {
            type: 'members',
            changes: {
                added: [],
                modified: [],
                deleted: [],
                hasChanges: false
            },
            timestamp: new Date().toISOString()
        }
    }));
}

function getMembers() {
    return [...membersCache];
}

function getMemberById(id) {
    return membersCache.find(member => String(member.id) === String(id)) || null;
}

function emitDataUpdated(type, changes) {
    document.dispatchEvent(new CustomEvent('dataUpdated', {
        detail: {
            type,
            changes,
            timestamp: new Date().toISOString()
        }
    }));
}

async function refreshMembers() {
    const response = await requestJSON('GET', API_ENDPOINTS.MEMBERS);
    membersCache = Array.isArray(response?.data) ? response.data : [];
    return membersCache;
}

async function addMember(memberData) {
    const response = await requestJSON('POST', API_ENDPOINTS.MEMBERS, memberData);
    const created = response.data;
    membersCache.unshift(created);

    emitDataUpdated('members', {
        added: [created],
        modified: [],
        deleted: [],
        hasChanges: true
    });

    return created;
}

async function updateMember(id, memberData) {
    const oldMember = getMemberById(id);
    const response = await requestJSON('PUT', `${API_ENDPOINTS.MEMBERS}/${id}`, memberData);
    const updated = response.data;

    membersCache = membersCache.map(member => String(member.id) === String(id) ? updated : member);

    emitDataUpdated('members', {
        added: [],
        modified: oldMember ? [{ old: oldMember, new: updated }] : [],
        deleted: [],
        hasChanges: true
    });

    return updated;
}

async function deleteMember(id) {
    const deletedMember = getMemberById(id);
    await requestJSON('DELETE', `${API_ENDPOINTS.MEMBERS}/${id}`);
    membersCache = membersCache.filter(member => String(member.id) !== String(id));

    emitDataUpdated('members', {
        added: [],
        modified: [],
        deleted: deletedMember ? [deletedMember] : [],
        hasChanges: true
    });

    return true;
}

async function loginAdmin(username, password) {
    const response = await requestJSON('POST', API_ENDPOINTS.LOGIN, { username, password });
    adminCache = response.admin || null;
    return response;
}

async function logoutAdmin() {
    await requestJSON('POST', API_ENDPOINTS.LOGOUT);
    adminCache = null;
}

async function getAdminInfo() {
    const response = await requestJSON('GET', API_ENDPOINTS.ADMIN);
    adminCache = response.data;
    return adminCache;
}

async function updateAdminCredentials(username, password) {
    const response = await requestJSON('PUT', API_ENDPOINTS.ADMIN, { username, password });
    const oldAdmin = adminCache ? { ...adminCache } : null;
    adminCache = response.data;

    emitDataUpdated('admin', {
        added: [],
        modified: [{ old: oldAdmin, new: adminCache }],
        deleted: [],
        hasChanges: true
    });

    return true;
}

function downloadJSON(data, fileName) {
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');

    link.href = url;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    URL.revokeObjectURL(url);
}

async function exportDataToJSON() {
    const response = await requestJSON('GET', API_ENDPOINTS.EXPORT_ALL);
    const date = new Date().toISOString().split('T')[0];
    downloadJSON(response.data, `ems-roster-backup-${date}.json`);
    return true;
}

async function exportMembersOnly() {
    const response = await requestJSON('GET', API_ENDPOINTS.EXPORT_MEMBERS);
    const date = new Date().toISOString().split('T')[0];
    downloadJSON(response.data, `ems-roster-members-${date}.json`);
    return true;
}

function importDataFromJSON(file) {
    return new Promise((resolve, reject) => {
        if (!file) {
            reject(new Error('لم يتم اختيار ملف'));
            return;
        }

        const reader = new FileReader();

        reader.onload = async function(event) {
            try {
                const parsed = JSON.parse(event.target.result);
                if (!parsed || !Array.isArray(parsed.members)) {
                    throw new Error('صيغة الملف غير صحيحة');
                }

                const confirmed = confirm('سيتم استبدال جميع البيانات الحالية. هل تريد المتابعة؟');
                if (!confirmed) {
                    resolve(false);
                    return;
                }

                await requestJSON('POST', API_ENDPOINTS.IMPORT, parsed);
                await refreshMembers();

                emitDataUpdated('members', {
                    added: [],
                    modified: [],
                    deleted: [],
                    hasChanges: true
                });

                resolve(true);
            } catch (error) {
                reject(new Error('فشل استيراد البيانات: ' + error.message));
            }
        };

        reader.onerror = function() {
            reject(new Error('تعذر قراءة الملف'));
        };

        reader.readAsText(file);
    });
}

function importMembersOnly(file) {
    return importDataFromJSON(file);
}

initStorage().catch((error) => {
    console.error('Storage initialization failed:', error);
});

const Member = require('../models/Member');

async function cleanupMemberData() {
    const members = await Member.findAll();
    for (const member of members) {
        const updates = {};
        // Clean name fields
        if (!member.firstName || member.firstName === 'undefined') {
            const parts = (member.fullName || '').split(' ').filter(Boolean);
            updates.firstName = parts[0] || '';
        }
        if (!member.lastName || member.lastName === 'undefined') {
            const parts = (member.fullName || '').split(' ').filter(Boolean);
            updates.lastName = parts.slice(1).join(' ') || '';
        }
        // Clean date fields
        if (member.hireDate === '' || member.hireDate === 'undefined') {
            updates.hireDate = null;
        }
        if (member.lastPromotion === '' || member.lastPromotion === 'undefined') {
            updates.lastPromotion = null;
        }
        if (Object.keys(updates).length > 0) {
            // merge with existing to preserve other fields
            await Member.update(member.id, { ...member, ...updates });
        }
    }
}

if (require.main === module) {
    cleanupMemberData().then(() => {
        console.log('Cleanup completed');
        process.exit(0);
    }).catch(err => {
        console.error('Cleanup failed', err);
        process.exit(1);
    });
}

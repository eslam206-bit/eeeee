const DEPARTMENTS = {
    'MANAGEMENT_STAFF': 'MANGMENT STAFF',
    'HOSPITAL_SUPERVISOR': 'Hospital Supervisor',
    'HUMAN_RESOURCES': 'Human resources',
    'CHIEF_OF_DOCTOR': 'Chief of Doctor',
    'DOCTORS': 'Doctors',
    'EMS_SUPERVISOR': 'EMS Supervisor',
    'MEDICAL_DIRECTOR': 'Medical Director',
    'PARAMEDIC_SUPERVISOR': 'Paramedic Officer',
    'PARAMEDIC_OFFICER': 'Licensed Paramedic (Call signs From P-01 to P-20)',
    'SENIOR_PARAMEDICS': 'Senior Paramedics and Paramedics (Call signs From P-21 to P-40)',
    'SENIOR_EMT': 'Advanced EMT and EMT (Call signs From E-39 to E-59)',
    'ECA': 'ECA (Call signs From E-60 to E-79)',
    'CADET_STUDENTS': 'Students (Call Signs From C-80 to C-99)'
};

// Notification system
function showUpdateNotification(message, type = 'info') {
    const notificationContainer = document.getElementById('notificationContainer');
    if (!notificationContainer) return;
    
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.innerHTML = `
        <span class="notification-icon">${type === 'success' ? '✅' : type === 'error' ? '❌' : '🔄'}</span>
        <span class="notification-message">${message}</span>
        <button class="notification-close" onclick="this.parentElement.remove()">×</button>
    `;
    
    notificationContainer.appendChild(notification);
    
    // Auto-remove after 5 seconds
    setTimeout(() => {
        if (notification.parentElement) {
            notification.remove();
        }
    }, 5000);
}

// Handle data updates with visual feedback
function handleDataUpdate(event) {
    const { type, changes } = event.detail;
    
    if (type === 'members') {
        renderRosterWithAnimations(changes);
    }
}

// Enhanced renderRoster with animations for new/updated items
function renderRosterWithAnimations(changes = null) {
    const members = getMembers();
    const tbody = document.getElementById('rosterBody');
    
    const groupedMembers = {};
    Object.keys(DEPARTMENTS).forEach(key => {
        groupedMembers[key] = [];
    });
    
    if (members && members.length > 0) {
        members.forEach(member => {
            const deptKey = member.department || 'CADET_STUDENTS';
            if (groupedMembers[deptKey]) {
                groupedMembers[deptKey].push(member);
            } else {
                groupedMembers['CADET_STUDENTS'].push(member);
            }
        });
    }
    
    let html = '';
    
    Object.keys(DEPARTMENTS).forEach(deptKey => {
        const deptMembers = groupedMembers[deptKey];
        html += `
            <tr class="department-header">
                <td colspan="11">${DEPARTMENTS[deptKey]}</td>
            </tr>
        `;
        
        if (deptMembers && deptMembers.length > 0) {
            // Sort members within SENIOR_PARAMEDICS department: Senior Paramedics first, then Paramedics
            if (deptKey === 'SENIOR_PARAMEDICS') {
                deptMembers.sort((a, b) => {
                    const aIsSenior = (a.title === 'Senior Paramedics');
                    const bIsSenior = (b.title === 'Senior Paramedics');
                    
                    if (aIsSenior && !bIsSenior) return -1;
                    if (!aIsSenior && bIsSenior) return 1;
                    
                    // If both have same title level, sort by callsign
                    return (a.callsign || '').localeCompare(b.callsign || '');
                });
            }
            
            // Sort members within SENIOR_EMT department: Advanced EMT first, then EMT
            if (deptKey === 'SENIOR_EMT') {
                deptMembers.sort((a, b) => {
                    const aIsAdvanced = (a.title === 'Advanced EMT');
                    const bIsAdvanced = (b.title === 'Advanced EMT');
                    
                    if (aIsAdvanced && !bIsAdvanced) return -1;
                    if (!aIsAdvanced && bIsAdvanced) return 1;
                    
                    // If both have same title level, sort by callsign
                    return (a.callsign || '').localeCompare(b.callsign || '');
                });
            }
            
            deptMembers.forEach(member => {
                const displayName = member.fullName || (member.firstName + ' ' + member.lastName) || 'غير محدد';
                
                // Determine if this is a new or updated member
                let rowClass = 'fade-in';
                if (changes) {
                    if (changes.added.find(item => item.id === member.id)) {
                        rowClass = 'newly-added';
                    } else if (changes.modified.find(item => item.new.id === member.id)) {
                        rowClass = 'recently-updated';
                    }
                }
                
                html += `
                    <tr class="${rowClass}">
                        <td><a href="#" class="member-name" onclick="showMemberDetails('${member.id}'); return false;">${sanitizeHTML(displayName)}</a></td>
                        <td>${sanitizeHTML(member.title || '')}</td>
                        <td>${sanitizeHTML(member.callsign || '')}</td>
                        <td>${sanitizeHTML(member.hireDate || '')}</td>
                        <td>${sanitizeHTML(member.lastPromotion || '')}</td>
                        <td>${sanitizeHTML(member.discord || '')}</td>
                        <td><div class="checkbox-display ${member.mi ? 'checked' : ''}"></div></td>
                        <td><div class="checkbox-display ${member.air ? 'checked' : ''}"></div></td>
                        <td><div class="checkbox-display ${member.fp ? 'checked' : ''}"></div></td>
                        <td>${sanitizeHTML(member.notes || '')}</td>
                    </tr>
                `;
            });
        } else {
            html += `
                <tr class="fade-in">
                    <td colspan="10" style="text-align: center; color: #999; padding: 15px; font-style: italic;">لا يوجد أعضاء في هذا القسم</td>
                </tr>
            `;
        }
        
        html += `
            <tr>
                <td colspan="10" class="department-separator" style="height: 15px; padding: 0; background: linear-gradient(90deg, transparent, #C8E6C9, transparent);"></td>
            </tr>
        `;
    });
    
    tbody.innerHTML = html;
}

function renderRoster() {
    renderRosterWithAnimations();
}

function sanitizeHTML(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
}

function showMemberDetails(memberId) {
    const member = getMemberById(memberId);
    if (!member) return;
    
    const displayName = member.fullName || (member.firstName + ' ' + member.lastName) || 'غير محدد';
    const memberInfo = `
<div class="member-details-container">
    <div class="details-section">
        <div class="section-title">
            <span class="section-icon">�</span>
            <span class="section-text">المعلومات الشخصية</span>
        </div>
        <div class="detail-item">
            <span class="detail-label">الاسم الكامل:</span>
            <span class="detail-value">${sanitizeHTML(displayName)}</span>
        </div>
        <div class="detail-item">
            <span class="detail-label">المنصب:</span>
            <span class="detail-value">${member.title || 'غير محدد'}</span>
        </div>
        <div class="detail-item">
            <span class="detail-label">القسم:</span>
            <span class="detail-value">${DEPARTMENTS[member.department] || 'غير محدد'}</span>
        </div>
    </div>

    <div class="details-section">
        <div class="section-title">
            <span class="section-icon">📞</span>
            <span class="section-text">معلومات الاتصال</span>
        </div>
        <div class="detail-item">
            <span class="detail-label">الرمز:</span>
            <span class="detail-value callsign-badge">${member.callsign || 'غير متوفر'}</span>
        </div>
        <div class="detail-item">
            <span class="detail-label">ديسكورد:</span>
            <span class="detail-value">${member.discord || 'غير متوفر'}</span>
        </div>
    </div>

    <div class="details-section">
        <div class="section-title">
            <span class="section-icon">📅</span>
            <span class="section-text">المعلومات الوظيفية</span>
        </div>
        <div class="detail-item">
            <span class="detail-label">تاريخ التعيين:</span>
            <span class="detail-value">${member.hireDate || 'غير متوفر'}</span>
        </div>
        <div class="detail-item">
            <span class="detail-label">آخر ترقية:</span>
            <span class="detail-value">${member.lastPromotion || 'غير متوفر'}</span>
        </div>
    </div>

    <div class="details-section">
        <div class="section-title">
            <span class="section-icon">🏆</span>
            <span class="section-text">الشهادات والتدريبات</span>
        </div>
        <div class="certifications-grid">
            <div class="certification-item ${member.mi ? 'certified' : 'not-certified'}">
                <span class="cert-icon">${member.mi ? '✅' : '❌'}</span>
                <span class="cert-name">MI</span>
            </div>
            <div class="certification-item ${member.air ? 'certified' : 'not-certified'}">
                <span class="cert-icon">${member.air ? '✅' : '❌'}</span>
                <span class="cert-name">AIR</span>
            </div>
            <div class="certification-item ${member.fp ? 'certified' : 'not-certified'}">
                <span class="cert-icon">${member.fp ? '✅' : '❌'}</span>
                <span class="cert-name">FP</span>
            </div>
        </div>
    </div>

    <div class="details-section">
        <div class="section-title">
            <span class="section-icon">📝</span>
            <span class="section-text">ملاحظات</span>
        </div>
        <div class="notes-content">
            ${member.notes ? `<p class="notes-text">${sanitizeHTML(member.notes)}</p>` : '<p class="no-notes">لا توجد ملاحظات</p>'}
        </div>
    </div>
</div>
    `;
    
    if (member.photo) {
        showCustomDialogWithImage(memberInfo, member.photo, displayName);
    } else {
        showCustomDialog(memberInfo, displayName);
    }
}

function closeMemberDetails() {
    closeCustomDialog();
}

function showCustomDialog(message, title = 'معلومات') {
    const dialogOverlay = document.createElement('div');
    dialogOverlay.className = 'custom-dialog-overlay';

    dialogOverlay.innerHTML = `
        <div class="custom-dialog">
            <div class="custom-dialog-header">
                <h3>${title}</h3>
                <button class="custom-dialog-close" aria-label="إغلاق">×</button>
            </div>
            <div class="custom-dialog-body">
                <div class="dialog-info">${message}</div>
            </div>
            <div class="custom-dialog-footer">
                <button class="btn btn-primary dialog-close-btn">إغلاق</button>
            </div>
        </div>
    `;

    document.body.appendChild(dialogOverlay);
    // Attach handlers for close buttons
    dialogOverlay.querySelectorAll('.custom-dialog-close, .dialog-close-btn').forEach(btn => {
        btn.addEventListener('click', closeCustomDialog);
    });

    // Close when clicking outside the dialog content
    dialogOverlay.addEventListener('click', function(e) {
        if (e.target === dialogOverlay) {
            closeCustomDialog();
        }
    });

    setTimeout(() => dialogOverlay.classList.add('active'), 10);
}

function showCustomDialogWithImage(message, imageUrl, title = 'معلومات') {
    const dialogOverlay = document.createElement('div');
    dialogOverlay.className = 'custom-dialog-overlay';
    dialogOverlay.innerHTML = `
        <div class="custom-dialog custom-dialog-with-image">
            <div class="custom-dialog-header">
                <h3>${title}</h3>
                <button class="custom-dialog-close" aria-label="إغلاق">×</button>
            </div>
            <div class="custom-dialog-body">
                <div class="dialog-image-container">
                    <img src="${imageUrl}" alt="${title}" class="dialog-member-photo">
                </div>
                <div class="dialog-info">${message}</div>
            </div>
            <div class="custom-dialog-footer">
                <button class="btn btn-primary dialog-close-btn">إغلاق</button>
            </div>
        </div>
    `;

    document.body.appendChild(dialogOverlay);
    dialogOverlay.querySelectorAll('.custom-dialog-close, .dialog-close-btn').forEach(btn => {
        btn.addEventListener('click', closeCustomDialog);
    });

    dialogOverlay.addEventListener('click', function(e) {
        if (e.target === dialogOverlay) {
            closeCustomDialog();
        }
    });

    setTimeout(() => dialogOverlay.classList.add('active'), 10);
}

function closeCustomDialog() {
    const dialog = document.querySelector('.custom-dialog-overlay');
    if (dialog) {
        dialog.classList.remove('active');
        setTimeout(() => dialog.remove(), 300);
    }
}

document.addEventListener('DOMContentLoaded', async function() {
    try {
        await refreshMembers();
    } catch (_error) {
        // Keep cached data if API call fails
    }

    renderRoster();
    
    // Listen for data updates
    document.addEventListener('dataUpdated', handleDataUpdate);
    
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') {
            closeCustomDialog();
        }
    });
});

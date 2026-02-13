document.addEventListener('DOMContentLoaded', function() {
    const loginForm = document.getElementById('loginForm');
    const errorMessage = document.getElementById('errorMessage');

    if (sessionStorage.getItem('emsAdminSession')) {
        window.location.href = 'admin.html';
        return;
    }

    loginForm.addEventListener('submit', async function(e) {
        e.preventDefault();

        const username = document.getElementById('username').value.trim();
        const password = document.getElementById('password').value;

        if (!username || !password) {
            showError('يرجى إدخال اسم المستخدم وكلمة المرور');
            return;
        }

        try {
            const result = await loginAdmin(username, password);
            if (!result?.success) {
                showError('اسم المستخدم أو كلمة المرور غير صحيحة');
                document.getElementById('password').value = '';
                return;
            }

            sessionStorage.setItem('emsAdminSession', result.sessionToken || Date.now().toString(36));
            errorMessage.classList.remove('show');
            window.location.href = 'admin.html';
        } catch (_error) {
            showError('اسم المستخدم أو كلمة المرور غير صحيحة');
            document.getElementById('password').value = '';
        }
    });

    function showError(message) {
        errorMessage.textContent = message;
        errorMessage.classList.add('show');

        setTimeout(() => {
            errorMessage.classList.remove('show');
        }, 5000);
    }
});

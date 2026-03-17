/* ====================================================
   auth.js — Login, JWT, show/hide password, logout
   ==================================================== */

const API_BASE = '';

// ---------- UTILITIES ----------
function getToken() { return localStorage.getItem('sdms_token'); }
function setToken(t) { localStorage.setItem('sdms_token', t); }
function clearToken() { localStorage.removeItem('sdms_token'); localStorage.removeItem('sdms_user'); }

function authHeaders() {
    return {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${getToken()}`
    };
}

function requireAuth() {
    if (!getToken() && !window.location.pathname.endsWith('login.html') && window.location.pathname !== '/' && window.location.pathname !== '/index.html') {
        window.location.href = '/login.html';
    }
}

function doLogout() {
    fetch('/api/auth/logout', { method: 'POST', headers: authHeaders() }).catch(() => { });
    clearToken();
    window.location.href = '/login.html';
}

// ---------- LOGIN PAGE ----------
const loginForm = document.getElementById('loginForm');
if (loginForm) {
    // Redirect if already logged in
    if (getToken()) window.location.href = '/dashboard.html';

    // Show / hide master key
    const eyeToggle = document.getElementById('eyeToggle');
    const masterKeyInput = document.getElementById('masterKey');
    if (eyeToggle && masterKeyInput) {
        eyeToggle.addEventListener('click', () => {
            const isHidden = masterKeyInput.type === 'password';
            masterKeyInput.type = isHidden ? 'text' : 'password';
            eyeToggle.textContent = isHidden ? '🙈' : '👁️';
        });
    }

    // Form submit
    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const errorDiv = document.getElementById('loginError');
        const submitBtn = document.getElementById('loginSubmit');
        const masterKey = document.getElementById('masterKey').value.trim();

        errorDiv.style.display = 'none';
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<span class="spinner"></span> Signing in...';

        try {
            const res = await fetch('/api/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ masterKey })
            });
            const data = await res.json();

            if (!res.ok) {
                errorDiv.textContent = data.error || 'Login failed. Please try again.';
                errorDiv.style.display = 'block';
                submitBtn.disabled = false;
                submitBtn.textContent = 'Sign In';
                return;
            }

            setToken(data.token);
            localStorage.setItem('sdms_user', JSON.stringify(data.user));
            window.location.href = '/dashboard.html';
        } catch (err) {
            errorDiv.textContent = 'Network error. Please check your connection.';
            errorDiv.style.display = 'block';
            submitBtn.disabled = false;
            submitBtn.textContent = 'Sign In';
        }
    });
}

// ---------- DASHBOARD AUTH GUARD ----------
if (window.location.pathname.includes('dashboard')) {
    if (!getToken()) {
        window.location.href = '/login.html';
    }

    // Populate admin name
    const user = JSON.parse(localStorage.getItem('sdms_user') || '{}');
    const adminEmail = user.email || 'admin@sdms.edu';
    const adminName = document.getElementById('adminName');
    const adminAvatar = document.getElementById('adminAvatar');
    if (adminName) adminName.textContent = adminEmail.split('@')[0];
    if (adminAvatar) adminAvatar.textContent = adminEmail[0].toUpperCase();

    // Logout buttons
    document.getElementById('sidebarLogout')?.addEventListener('click', doLogout);
}

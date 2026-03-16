/* ====================================================
   app.js — SPA Router + Sidebar toggle
   ==================================================== */

// Toast helper (global)
function showToast(message, type = 'success') {
    const container = document.getElementById('toastContainer');
    if (!container) return;
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    const icons = { success: '✅', error: '❌', info: 'ℹ️' };
    toast.innerHTML = `<span>${icons[type] || ''}</span> ${message}`;
    container.appendChild(toast);
    setTimeout(() => toast.remove(), 3500);
}

// Modal helper (global)
function openModal(html) {
    const portal = document.getElementById('modalPortal');
    portal.innerHTML = html;
    const overlay = portal.querySelector('.modal-overlay');
    if (overlay) {
        setTimeout(() => overlay.classList.add('active'), 10);
        overlay.querySelector('.modal-close')?.addEventListener('click', () => closeModal());
        overlay.addEventListener('click', (e) => { if (e.target === overlay) closeModal(); });
    }
}

function closeModal() {
    const portal = document.getElementById('modalPortal');
    const overlay = portal.querySelector('.modal-overlay');
    if (overlay) {
        overlay.classList.remove('active');
        setTimeout(() => { portal.innerHTML = ''; }, 260);
    }
}

// API call helper (global)
async function apiCall(method, path, body = null) {
    const opts = {
        method,
        headers: authHeaders()
    };
    if (body) opts.body = JSON.stringify(body);
    const res = await fetch(path, opts);
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
        if (res.status === 401) { doLogout(); return null; }
        throw new Error(data.error || 'Request failed');
    }
    return data;
}

// SPA Router
const viewMap = {
    dashboard: renderDashboard,
    students: renderStudents,
    complaints: renderComplaints,
    violations: renderViolations,
    'community-service': renderCommunityService,
    history: renderHistory,
    'gm-issuance': renderGMIssuance,
    'gm-certificate': renderGMCertificate,
};

let currentView = 'dashboard';

function navigateTo(view) {
    currentView = view;

    // Update sidebar active
    document.querySelectorAll('.nav-item').forEach(item => {
        item.classList.toggle('active', item.dataset.view === view);
    });

    // Close mobile sidebar
    document.getElementById('sidebar')?.classList.remove('open');
    document.getElementById('sidebarOverlay')?.classList.remove('active');

    const fn = viewMap[view];
    if (fn) fn();
}

// Sidebar nav click listeners
document.querySelectorAll('.nav-item[data-view]').forEach(item => {
    item.addEventListener('click', (e) => {
        e.preventDefault();
        navigateTo(item.dataset.view);
    });
});

// Mobile hamburger
const menuToggle = document.getElementById('menuToggle');
const sidebar = document.getElementById('sidebar');
const sidebarOverlay = document.getElementById('sidebarOverlay');

menuToggle?.addEventListener('click', () => {
    sidebar?.classList.toggle('open');
    sidebarOverlay?.classList.toggle('active');
});

sidebarOverlay?.addEventListener('click', () => {
    sidebar?.classList.remove('open');
    sidebarOverlay?.classList.remove('active');
});

// Global search — navigate to students view with search term
document.getElementById('globalSearch')?.addEventListener('input', (e) => {
    const val = e.target.value.trim();
    if (val.length >= 2) {
        navigateTo('students');
        setTimeout(() => {
            const si = document.getElementById('studentSearch');
            if (si) { si.value = val; si.dispatchEvent(new Event('input')); }
        }, 400);
    }
});

// Initial load
navigateTo('dashboard');

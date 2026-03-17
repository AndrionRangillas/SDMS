/* ====================================================
   students.js — Students CRUD Module
   ==================================================== */

let studentPage = 1;
let studentSearch = '';
let studentInstitute = '';
let studentCourses = [];

async function renderStudents() {
    const content = document.getElementById('pageContent');
    content.innerHTML = `
    <div class="page-header">
      <h2>👥 Students</h2>
      <p>Manage student records and profiles</p>
    </div>
    <div class="card">
      <div class="card-header">
        <div class="toolbar">
          <div class="search-box">
            <span class="si">🔍</span>
            <input type="text" id="studentSearch" placeholder="Search by name or ID..." />
          </div>
          <select class="form-control" id="studentInstituteFilter" style="width: 150px; margin-right: 12px;">
            <option value="">All Institutes</option>
          </select>
          <button class="btn btn-primary" id="addStudentBtn">＋ Add Student</button>
        </div>
      </div>
      <div class="table-wrapper">
        <table>
          <thead>
            <tr>
              <th>Student ID</th>
              <th>Full Name</th>
              <th>Institute</th>
              <th>Gender</th>
              <th>Age</th>
              <th>Contact</th>
              <th>Guardian</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody id="studentsTbody"><tr><td colspan="8" class="empty-state"><div class="spinner"></div></td></tr></tbody>
        </table>
      </div>
      <div class="pagination" id="studentPagination"></div>
    </div>`;

    studentPage = 1;
    studentSearch = '';
    studentInstitute = '';

    await loadCourses();
    
    const filterSelect = document.getElementById('studentInstituteFilter');
    if (filterSelect && studentCourses.length) {
        filterSelect.innerHTML = `<option value="">All Institutes</option>` + 
            studentCourses.map(c => `<option value="${c.id}">${c.course_code}</option>`).join('');
        filterSelect.addEventListener('change', (e) => {
            studentInstitute = e.target.value;
            studentPage = 1;
            loadStudents();
        });
    }

    loadStudents();

    document.getElementById('studentSearch').addEventListener('input', debounce(e => {
        studentSearch = e.target.value;
        studentPage = 1;
        loadStudents();
    }, 400));

    document.getElementById('addStudentBtn').addEventListener('click', () => openStudentModal(null));
}

async function loadCourses() {
    if (studentCourses.length) return;
    try {
        const data = await apiCall('GET', '/api/courses');
        studentCourses = data || [];
    } catch (e) { }
}

async function loadStudents() {
    try {
        let url = `/api/students?page=${studentPage}&limit=10&search=${encodeURIComponent(studentSearch)}`;
        if (studentInstitute) url += `&course_id=${studentInstitute}`;
        const data = await apiCall('GET', url);
        if (!data) return;

        const tbody = document.getElementById('studentsTbody');
        if (!data.data || data.data.length === 0) {
            tbody.innerHTML = `<tr><td colspan="8"><div class="empty-state"><div class="empty-icon">👤</div><p>No students found</p></div></td></tr>`;
            document.getElementById('studentPagination').innerHTML = '';
            return;
        }

        tbody.innerHTML = data.data.map(s => `
      <tr>
        <td><a class="student-id-link" onclick="openStudentRecords('${s.id}')" title="View Records">${s.student_id}</a></td>
        <td>${s.full_name}</td>
        <td><span class="badge badge-case1" ${s.course_id ? `style="cursor:pointer" onclick="filterByInstitute('${s.course_id}')" title="Filter by ${s.courses?.course_code}"` : ''}>${s.courses?.course_code || '—'}</span></td>
        <td>${s.gender || '—'}</td>
        <td>${s.age || '—'}</td>
        <td>${s.contact_number || '—'}</td>
        <td>${s.guardian_name || '—'}</td>
        <td>
          <button class="btn btn-warning btn-sm" onclick="openStudentModal('${s.id}')">✏️ Edit</button>
          <button class="btn btn-danger btn-sm" onclick="deleteStudent('${s.id}', '${escHtml(s.full_name)}')">🗑️ Del</button>
        </td>
      </tr>`).join('');

        renderPagination('studentPagination', data.count, studentPage, 10, p => { studentPage = p; loadStudents(); });
    } catch (e) {
        showToast('Failed to load students: ' + e.message, 'error');
    }
}

async function openStudentModal(id) {
    await loadCourses();
    let student = null;
    if (id) {
        try { student = await apiCall('GET', `/api/students/${id}`); } catch (e) { }
    }

    const courseOptions = studentCourses.map(c => `<option value="${c.id}" ${student?.course_id === c.id ? 'selected' : ''}>${c.course_code} — ${c.course_name}</option>`).join('');

    openModal(`
    <div class="modal-overlay">
      <div class="modal">
        <div class="modal-header">
          <h3>${id ? '✏️ Edit Student' : '➕ Add Student'}</h3>
          <button class="modal-close">✕</button>
        </div>
        <div class="modal-body">
          <form id="studentForm">
            <div class="form-row">
              <div class="form-group">
                <label>Student ID *</label>
                <input class="form-control" name="student_id" value="${student?.student_id || ''}" required />
              </div>
              <div class="form-group">
                <label>Full Name *</label>
                <input class="form-control" name="full_name" value="${escHtml(student?.full_name || '')}" required />
              </div>
            </div>
            <div class="form-row">
              <div class="form-group">
                <label>Institute</label>
                <select class="form-control" name="course_id">
                  <option value="">Select Institute</option>
                  ${courseOptions}
                </select>
              </div>
              <div class="form-group">
                <label>Gender</label>
                <select class="form-control" name="gender">
                  <option value="" ${!student?.gender ? 'selected' : ''}>Select</option>
                  <option ${student?.gender === 'Male' ? 'selected' : ''}>Male</option>
                  <option ${student?.gender === 'Female' ? 'selected' : ''}>Female</option>
                  <option ${student?.gender === 'Other' ? 'selected' : ''}>Other</option>
                </select>
              </div>
            </div>
            <div class="form-row">
              <div class="form-group">
                <label>Age</label>
                <input class="form-control" type="number" name="age" min="1" max="100" value="${student?.age || ''}" />
              </div>
              <div class="form-group">
                <label>Birthdate</label>
                <input class="form-control" type="date" name="birthdate" value="${student?.birthdate || ''}" />
              </div>
            </div>
            <div class="form-group">
              <label>Contact Number</label>
              <input class="form-control" name="contact_number" value="${student?.contact_number || ''}" />
            </div>
            <div class="form-group">
              <label>Address</label>
              <textarea class="form-control" name="address">${student?.address || ''}</textarea>
            </div>
            <div class="form-row">
              <div class="form-group">
                <label>Guardian Name</label>
                <input class="form-control" name="guardian_name" value="${escHtml(student?.guardian_name || '')}" />
              </div>
              <div class="form-group">
                <label>Guardian Contact</label>
                <input class="form-control" name="guardian_contact" value="${student?.guardian_contact || ''}" />
              </div>
            </div>
            <div class="form-actions">
              <button type="button" class="btn btn-danger" onclick="closeModal()">Cancel</button>
              <button type="submit" class="btn btn-primary">${id ? 'Update' : 'Add'} Student</button>
            </div>
          </form>
        </div>
      </div>
    </div>`);

    document.getElementById('studentForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        const fd = new FormData(e.target);
        const body = Object.fromEntries(fd.entries());
        try {
            if (id) {
                await apiCall('PUT', `/api/students/${id}`, body);
                showToast('Student updated successfully');
            } else {
                await apiCall('POST', '/api/students', body);
                showToast('Student added successfully');
            }
            closeModal();
            loadStudents();
        } catch (err) {
            showToast(err.message, 'error');
        }
    });
}

async function deleteStudent(id, name) {
    if (!confirm(`Delete student "${name}"? This cannot be undone.`)) return;
    try {
        await apiCall('DELETE', `/api/students/${id}`);
        showToast('Student deleted');
        loadStudents();
    } catch (e) {
        showToast(e.message, 'error');
    }
}

/* ====================================================
   openStudentRecords — Student Record Details Modal
   ==================================================== */
async function openStudentRecords(id) {
    // Show loading modal immediately
    openModal(`
    <div class="modal-overlay">
      <div class="modal records-modal">
        <div class="modal-header">
          <h3>📋 Student Records</h3>
          <button class="modal-close">✕</button>
        </div>
        <div class="modal-body">
          <div class="empty-state"><div class="spinner"></div></div>
        </div>
      </div>
    </div>`);

    try {
        const rec = await apiCall('GET', `/api/students/${id}/records`);
        if (!rec) return;

        const s = rec.student;
        const complaints = rec.complaints || [];
        const cs = rec.communityService || [];
        const violations = rec.violations || [];

        const pendingComplaints = complaints.filter(c => c.status === 'Pending');
        const pendingCS = cs.filter(x => x.status !== 'Completed');
        const hasPendingComplaints = pendingComplaints.length > 0;
        const hasPendingCS = pendingCS.length > 0;
        const hasViolations = violations.length > 0;

        // ---- Student Info ----
        const infoHtml = `
        <div class="records-section">
          <div class="records-section-title">👤 Student Information</div>
          <div class="records-info-grid">
            <div><span class="info-label">Student ID</span><span class="info-value">${escHtml(s.student_id || '—')}</span></div>
            <div><span class="info-label">Full Name</span><span class="info-value">${escHtml(s.full_name || '—')}</span></div>
            <div><span class="info-label">Institute</span><span class="info-value">${escHtml(s.courses?.course_code || '—')} — ${escHtml(s.courses?.course_name || '')}</span></div>
            <div><span class="info-label">Gender</span><span class="info-value">${escHtml(s.gender || '—')}</span></div>
            <div><span class="info-label">Age</span><span class="info-value">${s.age || '—'}</span></div>
            <div><span class="info-label">Contact</span><span class="info-value">${escHtml(s.contact_number || '—')}</span></div>
          </div>
        </div>`;

        // ---- Complaints Section ----
        let complaintsHtml = `<div class="records-section"><div class="records-section-title">⚠️ Complaints Record</div>`;
        if (complaints.length === 0) {
            complaintsHtml += `<p class="records-empty">No complaint records found.</p>`;
        } else {
            // Show pending first, then others
            const sorted = [
                ...complaints.filter(c => c.status === 'Pending'),
                ...complaints.filter(c => c.status !== 'Pending')
            ];
            complaintsHtml += `
            <div class="table-wrapper">
              <table class="records-table">
                <thead><tr>
                  <th>#</th>
                  <th>Type</th>
                  <th>Subject</th>
                  <th>Date Filed</th>
                  <th>Case Level</th>
                  <th>Status</th>
                </tr></thead>
                <tbody>
                  ${sorted.map((c, i) => `
                  <tr>
                    <td>${i + 1}</td>
                    <td>${escHtml(c.complaint_type || '—')}</td>
                    <td>${escHtml(c.subject || '—')}</td>
                    <td>${c.created_at ? new Date(c.created_at).toLocaleDateString() : '—'}</td>
                    <td>${c.case_level ? 'Level ' + c.case_level : '—'}</td>
                    <td><span class="badge ${c.status === 'Pending' ? 'badge-pending' : 'badge-resolved'}">${escHtml(c.status || '—')}</span></td>
                  </tr>`).join('')}
                </tbody>
              </table>
            </div>`;
        }
        complaintsHtml += `</div>`;

        // ---- Community Service Section ----
        let csHtml = `<div class="records-section"><div class="records-section-title">🌿 Community Service</div>`;
        if (cs.length === 0) {
            csHtml += `<p class="records-empty">No community service record.</p>`;
        } else {
            csHtml += `
            <div class="table-wrapper">
              <table class="records-table">
                <thead><tr>
                  <th>#</th>
                  <th>Required Hours</th>
                  <th>Completed Hours</th>
                  <th>Remaining Hours</th>
                  <th>Date Assigned</th>
                  <th>Status</th>
                </tr></thead>
                <tbody>
                  ${cs.map((x, i) => {
                    const remaining = Math.max(0, (x.hours_required || 0) - (x.hours_rendered || 0));
                    const statusLabel = remaining > 0 ? 'Pending' : 'Completed';
                    return `
                  <tr>
                    <td>${i + 1}</td>
                    <td>${x.hours_required ?? '—'}</td>
                    <td>${x.hours_rendered ?? '—'}</td>
                    <td>${remaining}</td>
                    <td>${x.created_at ? new Date(x.created_at).toLocaleDateString() : '—'}</td>
                    <td><span class="badge ${statusLabel === 'Completed' ? 'badge-completed' : 'badge-pending'}">${statusLabel}</span></td>
                  </tr>`;
                  }).join('')}
                </tbody>
              </table>
            </div>`;
        }
        csHtml += `</div>`;

        // ---- Violation Slips Section ----
        let violHtml = `<div class="records-section"><div class="records-section-title">🚨 Violation Slips</div>`;
        if (violations.length === 0) {
            violHtml += `<p class="records-empty">No violation slip records found.</p>`;
        } else {
            violHtml += `
            <div class="table-wrapper">
              <table class="records-table">
                <thead><tr>
                  <th>#</th>
                  <th>Violation</th>
                  <th>SHB Article/Section</th>
                  <th>Sanction</th>
                  <th>Date</th>
                  <th>Status</th>
                  <th>Count</th>
                </tr></thead>
                <tbody>
                  ${violations.map((v, i) => `
                  <tr>
                    <td>${i + 1}</td>
                    <td>${escHtml(v.violation || '—')}</td>
                    <td>${escHtml(v.shb_article_section || '—')}</td>
                    <td>${escHtml(v.sanction || '—')}</td>
                    <td>${v.date_of_violation || (v.created_at ? new Date(v.created_at).toLocaleDateString() : '—')}</td>
                    <td><span class="badge badge-${(v.status || 'Pending') === 'Completed' ? 'completed' : 'pending'}">${v.status || 'Pending'}</span></td>
                    <td><span class="badge badge-pending">${v.violation_count ?? 1}x</span></td>
                  </tr>`).join('')}
                </tbody>
              </table>
            </div>`;
        }
        violHtml += `</div>`;

        // ---- Status Summary ----
        const noPendingRecords = !hasPendingComplaints && !hasPendingCS && !hasViolations;
        const summaryHtml = `
        <div class="records-section">
          <div class="records-section-title">📊 Status Summary</div>
          ${noPendingRecords
            ? `<p class="records-empty records-clear">✅ No pending records for this student.</p>`
            : `<div class="status-summary-grid">
                <div class="status-summary-item">
                  <span class="info-label">Pending Complaints</span>
                  <span class="badge ${hasPendingComplaints ? 'badge-pending' : 'badge-completed'}">${hasPendingComplaints ? 'Yes (' + pendingComplaints.length + ')' : 'No'}</span>
                </div>
                <div class="status-summary-item">
                  <span class="info-label">Pending Community Service</span>
                  <span class="badge ${hasPendingCS ? 'badge-pending' : 'badge-completed'}">${hasPendingCS ? 'Yes (' + pendingCS.length + ')' : 'No'}</span>
                </div>
                <div class="status-summary-item">
                  <span class="info-label">Violation Slips</span>
                  <span class="badge ${hasViolations ? 'badge-pending' : 'badge-completed'}">${hasViolations ? 'Yes (' + violations.length + ')' : 'No'}</span>
                </div>
              </div>`
          }
        </div>`;

        const portal = document.getElementById('modalPortal');
        const body = portal.querySelector('.modal-body');
        if (body) {
            body.innerHTML = infoHtml + complaintsHtml + csHtml + violHtml + summaryHtml;
        }
    } catch (e) {
        showToast('Failed to load student records: ' + e.message, 'error');
        closeModal();
    }
}

// Utilities
function debounce(fn, ms) {
    let t; return (...args) => { clearTimeout(t); t = setTimeout(() => fn(...args), ms); };
}

function escHtml(str) {
    return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function renderPagination(containerId, total, page, limit, onNavigate) {
    const totalPages = Math.ceil(total / limit);
    const el = document.getElementById(containerId);
    if (!el || totalPages <= 1) { if (el) el.innerHTML = `<span class="pagination-info">Showing ${Math.min(total, limit)} of ${total} records</span>`; return; }

    const from = (page - 1) * limit + 1;
    const to = Math.min(page * limit, total);

    el.innerHTML = `
    <span class="pagination-info">Showing ${from}–${to} of ${total}</span>
    <div class="pagination-btns">
      <button class="page-btn" ${page <= 1 ? 'disabled' : ''} onclick="(${onNavigate})(${page - 1})">◀</button>
      ${Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
        const p = Math.max(1, Math.min(page - 2, totalPages - 4)) + i;
        if (p < 1 || p > totalPages) return '';
        return `<button class="page-btn ${p === page ? 'active' : ''}" onclick="(${onNavigate})(${p})">${p}</button>`;
    }).join('')}
      <button class="page-btn" ${page >= totalPages ? 'disabled' : ''} onclick="(${onNavigate})(${page + 1})">▶</button>
    </div>`;
}

window.filterByInstitute = (id) => {
    if (!id) return;
    const filterSelect = document.getElementById('studentInstituteFilter');
    if (filterSelect) {
        filterSelect.value = id;
    }
    studentInstitute = id;
    studentPage = 1;
    loadStudents();
};

/* ====================================================
   complaints.js — Complaints CRUD Module
   ==================================================== */

let compPage = 1;
let compSearchText = '';

async function renderComplaints() {
    const content = document.getElementById('pageContent');
    content.innerHTML = `
    <div class="page-header">
      <h2>📋 Complaints</h2>
      <p>Manage disciplinary complaints with automatic case level assignment</p>
    </div>
    <div class="card">
      <div class="card-header">
        <div class="toolbar">
          <div class="search-box">
            <span class="si">🔍</span>
            <input type="text" id="compSearch" placeholder="Search name or subject..." style="width:200px" />
          </div>
          <button class="btn btn-primary" id="addCompBtn">➕ Add Complaint</button>
        </div>
      </div>
      <div class="table-wrapper">
        <table>
          <thead>
            <tr>
              <th>Student</th>
              <th>Institute</th>
              <th>Type</th>
              <th>Subject</th>
              <th>Case Level</th>
              <th>Status</th>
              <th>Action Taken</th>
              <th>Date</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody id="compTbody"><tr><td colspan="9" class="empty-state"><div class="spinner"></div></td></tr></tbody>
        </table>
      </div>
      <div class="pagination" id="compPagination"></div>
    </div>`;

    compPage = 1;
    compSearchText = '';
    loadComplaints();

    document.getElementById('compSearch').addEventListener('input', debounce(e => {
        compSearchText = e.target.value;
        compPage = 1; 
        loadComplaints();
    }, 400));
    document.getElementById('addCompBtn').addEventListener('click', () => openComplaintModal());
}

async function loadComplaints() {
    try {
        let url = `/api/complaints?page=${compPage}&limit=10`;
        if (compSearchText) url += `&search=${encodeURIComponent(compSearchText)}`;
        const data = await apiCall('GET', url);
        if (!data) return;
        const tbody = document.getElementById('compTbody');

        if (!data.data?.length) {
            tbody.innerHTML = `<tr><td colspan="9"><div class="empty-state"><div class="empty-icon">📋</div><p>No complaints found</p></div></td></tr>`;
            document.getElementById('compPagination').innerHTML = '';
            return;
        }

        const caseBadge = (l) => {
            const m = { 1: 'case1', 2: 'case2', 3: 'case3' };
            return `<span class="badge badge-${m[l] || 'case4'}">Case ${l}</span>`;
        };

        const statusBadge = (s) => {
            const m = { Pending: 'pending', Approved: 'approved', Resolved: 'resolved' };
            return `<span class="badge badge-${m[s] || 'pending'}">${s}</span>`;
        };

        tbody.innerHTML = data.data.map(c => `
      <tr>
        <td><strong>${c.students?.full_name || '—'}</strong><br><small style="color:var(--text-muted)">${c.students?.student_id || ''}</small></td>
        <td>${c.courses?.course_code || '—'}</td>
        <td>${c.complaint_type || '—'}</td>
        <td>${c.subject}</td>
        <td>${caseBadge(c.case_level)}</td>
        <td>${statusBadge(c.status)}</td>
        <td>${c.action_taken || '—'}</td>
        <td>${new Date(c.created_at).toLocaleDateString()}</td>
        <td>
          <button class="btn btn-warning btn-sm" onclick="openUpdateStatus('${c.id}','${c.status}')">🔄 Status</button>
        </td>
      </tr>`).join('');

        renderPagination('compPagination', data.count, compPage, 10, p => { compPage = p; loadComplaints(); });
    } catch (e) {
        showToast('Failed to load complaints: ' + e.message, 'error');
    }
}

async function openComplaintModal() {
    await loadCourses();
    // Load student list for search
    openModal(`
    <div class="modal-overlay">
      <div class="modal">
        <div class="modal-header">
          <h3>➕ Add Complaint</h3>
          <button class="modal-close">✕</button>
        </div>
        <div class="modal-body">
          <form id="compForm">
            <div class="form-row">
              <div class="form-group">
                <label>Student ID *</label>
                <input class="form-control" id="compStudentId" placeholder="Enter Student ID..." required />
                <small id="compStudentName" style="color:var(--text-muted);margin-top:4px;display:block"></small>
              </div>
              <div class="form-group">
                <label>Institute</label>
                <select class="form-control" id="compCourseId">
                  <option value="">Select Institute</option>
                  ${studentCourses.map(c => `<option value="${c.id}">${c.course_code}</option>`).join('')}
                </select>
              </div>
            </div>
            <div class="form-row">
              <div class="form-group">
                <label>Complaint Type *</label>
                <select class="form-control" id="compType" required>
                  <option value="">Select Type</option>
                  <option>Bullying</option>
                  <option>Harassment</option>
                  <option>Vandalism</option>
                  <option>Cheating</option>
                  <option>Insubordination</option>
                  <option>Other</option>
                </select>
              </div>
              <div class="form-group">
                <label>Subject *</label>
                <input class="form-control" id="compSubject" required />
              </div>
            </div>
            <div class="form-group">
              <label>Description</label>
              <textarea class="form-control" id="compDesc"></textarea>
            </div>
            <div class="form-actions">
              <button type="button" class="btn btn-danger" onclick="closeModal()">Cancel</button>
              <button type="submit" class="btn btn-primary">Submit Complaint</button>
            </div>
          </form>
        </div>
      </div>
    </div>`);

    // Auto-find student by ID
    document.getElementById('compStudentId').addEventListener('change', async (e) => {
        const sid = e.target.value.trim();
        if (!sid) return;
        try {
            const data = await apiCall('GET', `/api/students?search=${encodeURIComponent(sid)}&limit=1`);
            const student = data?.data?.[0];
            const label = document.getElementById('compStudentName');
            if (student && student.student_id === sid) {
                label.textContent = `✅ ${student.full_name}`;
                label.style.color = 'var(--success)';
                document.getElementById('compStudentId').dataset.uuid = student.id;
                if (student.course_id) document.getElementById('compCourseId').value = student.course_id;
            } else {
                label.textContent = '❌ Student not found';
                label.style.color = 'var(--danger)';
                delete document.getElementById('compStudentId').dataset.uuid;
            }
        } catch (e) { }
    });

    document.getElementById('compForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        const studentUUID = document.getElementById('compStudentId').dataset.uuid;
        if (!studentUUID) { showToast('Please enter a valid Student ID', 'error'); return; }

        try {
            await apiCall('POST', '/api/complaints', {
                student_id: studentUUID,
                course_id: document.getElementById('compCourseId').value || null,
                complaint_type: document.getElementById('compType').value,
                subject: document.getElementById('compSubject').value,
                description: document.getElementById('compDesc').value
            });
            showToast('Complaint added — Case level auto-assigned');
            closeModal();
            loadComplaints();
        } catch (err) {
            showToast(err.message, 'error');
        }
    });
}

function openUpdateStatus(id, currentStatus) {
    const statuses = ['Pending', 'Approved', 'Resolved'];
    openModal(`
    <div class="modal-overlay">
      <div class="modal" style="max-width:380px">
        <div class="modal-header">
          <h3>🔄 Update Status</h3>
          <button class="modal-close">✕</button>
        </div>
        <div class="modal-body">
          <div class="form-group">
            <label>New Status</label>
            <select class="form-control" id="newStatus">
              ${statuses.map(s => `<option ${s === currentStatus ? 'selected' : ''}>${s}</option>`).join('')}
            </select>
          </div>
          <div class="form-group" style="margin-top:12px">
            <label>Action Taken</label>
            <textarea class="form-control" id="actionTaken"></textarea>
          </div>
          <div class="form-actions">
            <button class="btn btn-danger" onclick="closeModal()">Cancel</button>
            <button class="btn btn-primary" id="saveStatus">Save</button>
          </div>
        </div>
      </div>
    </div>`);

    document.getElementById('saveStatus').addEventListener('click', async () => {
        try {
            await apiCall('PUT', `/api/complaints/${id}`, {
                status: document.getElementById('newStatus').value,
                action_taken: document.getElementById('actionTaken').value
            });
            showToast('Status updated');
            closeModal();
            loadComplaints();
        } catch (err) { showToast(err.message, 'error'); }
    });
}

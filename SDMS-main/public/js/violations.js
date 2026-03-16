/* ====================================================
   violations.js — Violation Slips Module
   ==================================================== */

let violPage = 1;

async function renderViolations() {
    const content = document.getElementById('pageContent');
    content.innerHTML = `
    <div class="page-header">
      <h2>⚠️ Violation Slips</h2>
      <p>Record and track minor violations and sanctions</p>
    </div>
    <div class="card">
      <div class="card-header">
        <div class="toolbar">
          <div class="search-box">
            <span class="si">🔍</span>
            <input type="text" id="violSearch" placeholder="Search violations..." />
          </div>
          <button class="btn btn-primary" id="addViolBtn">➕ Add Violation Slip</button>
        </div>
      </div>
      <div class="table-wrapper">
        <table>
          <thead>
            <tr>
              <th>Student</th>
              <th>Course</th>
              <th>Violation</th>
              <th>#</th>
              <th>SHB Article/Section</th>
              <th>Sanction</th>
              <th>Date</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody id="violTbody"><tr><td colspan="8"><div class="empty-state"><div class="spinner"></div></div></td></tr></tbody>
        </table>
      </div>
      <div class="pagination" id="violPagination"></div>
    </div>`;

    violPage = 1;
    loadViolations();
    document.getElementById('violSearch').addEventListener('input', debounce(() => loadViolations(), 400));
    document.getElementById('addViolBtn').addEventListener('click', () => openViolationModal(null));
}

async function loadViolations() {
    try {
        const data = await apiCall('GET', `/api/violations?page=${violPage}&limit=10`);
        if (!data) return;
        const tbody = document.getElementById('violTbody');
        if (!data.data?.length) {
            tbody.innerHTML = `<tr><td colspan="8"><div class="empty-state"><div class="empty-icon">⚠️</div><p>No violation slips</p></div></td></tr>`;
            document.getElementById('violPagination').innerHTML = '';
            return;
        }
        tbody.innerHTML = data.data.map(v => `
      <tr>
        <td><strong>${v.students?.full_name || '—'}</strong><br><small style="color:var(--text-muted)">${v.students?.student_id || ''}</small></td>
        <td>${v.students?.courses?.course_code || '—'}</td>
        <td>${v.violation}</td>
        <td><span class="badge badge-case${Math.min(v.violation_count, 4)}">${v.violation_count}</span></td>
        <td>${v.shb_article_section || '—'}</td>
        <td>${v.sanction || '—'}</td>
        <td>${v.date_of_violation || new Date(v.created_at).toLocaleDateString()}</td>
        <td>
          <button class="btn btn-warning btn-sm" onclick="openViolationModal('${v.id}')">✏️</button>
          <button class="btn btn-danger btn-sm" onclick="deleteViolation('${v.id}')">🗑️</button>
        </td>
      </tr>`).join('');
        renderPagination('violPagination', data.count, violPage, 10, p => { violPage = p; loadViolations(); });
    } catch (e) {
        showToast('Failed to load violations: ' + e.message, 'error');
    }
}

async function openViolationModal(id) {
    let viol = null;
    if (id) {
        try {
            const data = await apiCall('GET', `/api/violations?page=1&limit=1000`);
            viol = data?.data?.find(v => v.id === id);
        } catch (e) { }
    }

    openModal(`
    <div class="modal-overlay">
      <div class="modal">
        <div class="modal-header">
          <h3>${id ? '✏️ Edit' : '➕ Add'} Violation Slip</h3>
          <button class="modal-close">✕</button>
        </div>
        <div class="modal-body">
          <form id="violForm">
            <div class="form-group">
              <label>Student ID *</label>
              <input class="form-control" id="violStudentId" placeholder="Enter Student ID..." required />
              <small id="violStudentName" style="color:var(--text-muted);margin-top:4px;display:block"></small>
            </div>
            <div class="form-group">
              <label>Violation Committed *</label>
              <input class="form-control" id="violDesc" value="${escHtml(viol?.violation || '')}" required />
            </div>
            <div class="form-row">
              <div class="form-group">
                <label>SHB Article & Section</label>
                <input class="form-control" id="violSHB" value="${viol?.shb_article_section || ''}" placeholder="e.g. Art. III, Sec. 4" />
              </div>
              <div class="form-group">
                <label>Date of Violation</label>
                <input class="form-control" type="date" id="violDate" value="${viol?.date_of_violation || new Date().toISOString().split('T')[0]}" />
              </div>
            </div>
            <div class="form-group">
              <label>Sanction</label>
              <input class="form-control" id="violSanction" value="${escHtml(viol?.sanction || '')}" placeholder="e.g. 8 hours community service" />
            </div>
            <div class="form-actions">
              <button type="button" class="btn btn-danger" onclick="closeModal()">Cancel</button>
              <button type="submit" class="btn btn-primary">${id ? 'Update' : 'Submit'}</button>
            </div>
          </form>
        </div>
      </div>
    </div>`);

    // Student lookup
    document.getElementById('violStudentId').addEventListener('change', async (e) => {
        const sid = e.target.value.trim();
        if (!sid) return;
        try {
            const data = await apiCall('GET', `/api/students?search=${encodeURIComponent(sid)}&limit=1`);
            const student = data?.data?.[0];
            const label = document.getElementById('violStudentName');
            if (student && student.student_id === sid) {
                label.textContent = `✅ ${student.full_name}`;
                label.style.color = 'var(--success)';
                document.getElementById('violStudentId').dataset.uuid = student.id;
            } else {
                label.textContent = '❌ Student not found';
                label.style.color = 'var(--danger)';
                delete document.getElementById('violStudentId').dataset.uuid;
            }
        } catch (e) { }
    });

    document.getElementById('violForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        const studentId = id ? viol?.student_id : document.getElementById('violStudentId').dataset.uuid;
        if (!studentId) { showToast('Please enter a valid Student ID', 'error'); return; }

        const body = {
            student_id: studentId,
            violation: document.getElementById('violDesc').value,
            shb_article_section: document.getElementById('violSHB').value,
            date_of_violation: document.getElementById('violDate').value,
            sanction: document.getElementById('violSanction').value
        };

        try {
            if (id) await apiCall('PUT', `/api/violations/${id}`, body);
            else await apiCall('POST', '/api/violations', body);
            showToast(id ? 'Violation updated' : 'Violation slip added');
            closeModal();
            loadViolations();
        } catch (err) { showToast(err.message, 'error'); }
    });
}

async function deleteViolation(id) {
    if (!confirm('Delete this violation slip?')) return;
    try {
        await apiCall('DELETE', `/api/violations/${id}`);
        showToast('Violation slip deleted');
        loadViolations();
    } catch (e) { showToast(e.message, 'error'); }
}

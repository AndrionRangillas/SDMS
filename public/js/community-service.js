/* ====================================================
   community-service.js — Community Service Tracking
   ==================================================== */

let csPage = 1;
let csSearch = '';

async function renderCommunityService() {
    const content = document.getElementById('pageContent');
    content.innerHTML = `
    <div class="page-header">
      <h2>🤝 Community Service</h2>
      <p>Track student community service hours and completion status</p>
    </div>
    <div class="card">
      <div class="card-header">
        <div class="toolbar">
          <div class="search-box">
            <span class="si">🔍</span>
            <input type="text" id="csSearch" placeholder="Search..." />
          </div>
          <button class="btn btn-primary" id="addCsBtn">➕ Add Record</button>
        </div>
      </div>
      <div class="table-wrapper">
        <table>
          <thead>
            <tr>
              <th>Student</th>
              <th>Institute</th>
              <th>Linked Violation</th>
              <th>Hours Required</th>
              <th>Hours Rendered</th>
              <th>Progress</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody id="csTbody"><tr><td colspan="8"><div class="empty-state"><div class="spinner"></div></div></td></tr></tbody>
        </table>
      </div>
      <div class="pagination" id="csPagination"></div>
    </div>`;

    csPage = 1;
    csSearch = '';
    loadCS();
    
    document.getElementById('csSearch').addEventListener('input', debounce(e => {
        csSearch = e.target.value;
        csPage = 1;
        loadCS();
    }, 400));
    
    document.getElementById('addCsBtn').addEventListener('click', () => openCSModal(null));
}

async function loadCS() {
    try {
        let url = `/api/community-service?page=${csPage}&limit=10`;
        if (csSearch) url += `&search=${encodeURIComponent(csSearch)}`;
        const data = await apiCall('GET', url);
        if (!data) return;
        const tbody = document.getElementById('csTbody');

        if (!data.data?.length) {
            tbody.innerHTML = `<tr><td colspan="8"><div class="empty-state"><div class="empty-icon">🤝</div><p>No records found</p></div></td></tr>`;
            document.getElementById('csPagination').innerHTML = '';
            return;
        }

        tbody.innerHTML = data.data.map(r => {
            const pct = r.hours_required > 0 ? Math.min(100, Math.round((r.hours_rendered / r.hours_required) * 100)) : 0;
            return `
        <tr>
          <td><strong>${r.students?.full_name || '—'}</strong><br><small style="color:var(--text-muted)">${r.students?.student_id || ''}</small></td>
          <td>${r.students?.courses?.course_code || '—'}</td>
          <td>${r.violation_slips?.violation ? escHtml(r.violation_slips.violation) : '<span style="color:var(--text-muted)">—</span>'}</td>
          <td>${r.hours_required} hrs</td>
          <td>${r.hours_rendered} hrs</td>
          <td>
            <div style="font-size:0.75rem;color:var(--text-muted);margin-bottom:4px">${pct}%</div>
            <div class="progress-bar"><div class="progress-fill" style="width:${pct}%"></div></div>
          </td>
          <td><span class="badge badge-${r.status === 'Completed' ? 'completed' : 'partial'}">${r.status}</span></td>
          <td>
            <button class="btn btn-warning btn-sm" onclick="openCSModal('${r.id}')">✏️ Update</button>
            <button class="btn btn-danger btn-sm" onclick="deleteCS('${r.id}')">🗑️</button>
          </td>
        </tr>`;
        }).join('');

        renderPagination('csPagination', data.count, csPage, 10, p => { csPage = p; loadCS(); });
    } catch (e) {
        showToast('Failed to load records: ' + e.message, 'error');
    }
}

async function openCSModal(id) {
    let rec = null;
    if (id) {
        try { const all = await apiCall('GET', '/api/community-service?page=1&limit=1000'); rec = all?.data?.find(r => r.id === id); } catch (e) { }
    }

    openModal(`
    <div class="modal-overlay">
      <div class="modal">
        <div class="modal-header">
          <h3>${id ? '✏️ Update CS Record' : '➕ Add CS Record'}</h3>
          <button class="modal-close">✕</button>
        </div>
        <div class="modal-body">
          <form id="csForm">
            ${!id ? `
            <div class="form-group">
              <label>Student ID *</label>
              <input class="form-control" id="csStudentId" placeholder="Enter Student ID..." required />
              <small id="csStudentName" style="color:var(--text-muted);display:block;margin-top:4px"></small>
            </div>` : `<div class="form-group"><label>Student</label><input class="form-control" value="${escHtml(rec?.students?.full_name || '')} (${rec?.students?.student_id || ''})" readonly /></div>`}
            
            ${rec?.violation_slips ? `
            <div class="form-group">
                <label>Linked Violation</label>
                <input class="form-control" value="${escHtml(rec.violation_slips.violation)} (Status: ${rec.violation_slips.status || 'Pending'})" readonly />
            </div>` : ''}

            <div class="form-row">
              <div class="form-group">
                <label>Hours Required *</label>
                <input class="form-control" type="number" id="csRequired" min="1" value="${rec?.hours_required || ''}" required />
              </div>
              <div class="form-group">
                <label>Hours Rendered</label>
                <input class="form-control" type="number" id="csRendered" min="0" value="${rec?.hours_rendered || 0}" />
              </div>
            </div>

            <div class="form-row">
              <div class="form-group">
                <label>Date Started</label>
                <input class="form-control" type="date" id="csDateStarted" value="${rec?.date_started || ''}" />
              </div>
              <div class="form-group">
                <label>Date Completed</label>
                <input class="form-control" type="date" id="csDateCompleted" value="${rec?.date_completed || ''}" />
              </div>
            </div>

            <div class="form-group">
              <label>Verified By</label>
              <input class="form-control" id="csVerifiedBy" value="${escHtml(rec?.verified_by || '')}" placeholder="Name of verifier..." />
            </div>

            <div class="form-group">
              <label>Remarks</label>
              <textarea class="form-control" id="csRemarks" rows="2" placeholder="Any additional notes...">${escHtml(rec?.remarks || '')}</textarea>
            </div>

            <div class="form-actions">
              <button type="button" class="btn btn-danger" onclick="closeModal()">Cancel</button>
              <button type="submit" class="btn btn-primary">${id ? 'Update' : 'Add'} Record</button>
            </div>
          </form>
        </div>
      </div>
    </div>`);

    if (!id) {
        document.getElementById('csStudentId').addEventListener('change', async (e) => {
            const sid = e.target.value.trim();
            const data = await apiCall('GET', `/api/students?search=${encodeURIComponent(sid)}&limit=1`);
            const student = data?.data?.[0];
            const label = document.getElementById('csStudentName');
            if (student && student.student_id === sid) {
                label.textContent = `✅ ${student.full_name}`; label.style.color = 'var(--success)';
                document.getElementById('csStudentId').dataset.uuid = student.id;
            } else {
                label.textContent = '❌ Student not found'; label.style.color = 'var(--danger)';
                delete document.getElementById('csStudentId').dataset.uuid;
            }
        });
    }

    document.getElementById('csForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        const studentId = id ? rec.student_id : document.getElementById('csStudentId').dataset.uuid;
        if (!studentId) { showToast('Please enter a valid Student ID', 'error'); return; }
        const body = {
            student_id: studentId,
            hours_required: parseInt(document.getElementById('csRequired').value),
            hours_rendered: parseInt(document.getElementById('csRendered').value) || 0,
            date_started: document.getElementById('csDateStarted').value || null,
            date_completed: document.getElementById('csDateCompleted').value || null,
            verified_by: document.getElementById('csVerifiedBy').value || null,
            remarks: document.getElementById('csRemarks').value || null
        };
        try {
            if (id) await apiCall('PUT', `/api/community-service/${id}`, body);
            else await apiCall('POST', '/api/community-service', body);
            showToast(id ? 'Record updated' : 'Record added');
            closeModal();
            loadCS();
        } catch (err) { showToast(err.message, 'error'); }
    });
}

async function deleteCS(id) {
    if (!confirm('Delete this community service record?')) return;
    try { await apiCall('DELETE', `/api/community-service/${id}`); showToast('Record deleted'); loadCS(); }
    catch (e) { showToast(e.message, 'error'); }
}

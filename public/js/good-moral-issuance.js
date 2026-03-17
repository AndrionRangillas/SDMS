/* ====================================================
   good-moral-issuance.js — GM Issuance Tracking
   ==================================================== */

let gmiPage = 1;

async function renderGMIssuance() {
  const content = document.getElementById('pageContent');
  content.innerHTML = `
    <div class="page-header">
      <h2>📖 Good Moral Issuance</h2>
      <p>Track all issued Good Moral Certificates</p>
    </div>
    <div class="card">
      <div class="card-header">
        <div class="toolbar">
          <div style="display:flex;gap:8px;flex-wrap:wrap">
            <div class="search-box">
              <span class="si">🔍</span>
              <input type="text" id="gmiSearch" placeholder="Search by name or ID..." />
            </div>
            <select class="form-control" id="gmiMonth" style="width:140px">
              <option value="">All Months</option>
              ${['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'].map((m, i) => `<option value="${i + 1}">${m}</option>`).join('')}
            </select>
            <select class="form-control" id="gmiYear" style="width:100px">
              <option value="">All Years</option>
              ${[2024, 2025, 2026, 2027].map(y => `<option value="${y}">${y}</option>`).join('')}
            </select>
            <button class="btn btn-primary btn-sm" id="gmiFilter">🔍 Filter</button>
          </div>
          <button class="btn btn-success" id="addGMIBtn">➕ Record Issuance</button>
        </div>
      </div>
      <div class="table-wrapper">
        <table>
          <thead>
            <tr>
              <th>Student</th>
              <th>Program</th>
              <th>Purpose</th>
              <th>Contact</th>
              <th>Date Requested</th>
              <th>Date Processed</th>
              <th>Processed By</th>
              <th>Remarks</th>
            </tr>
          </thead>
          <tbody id="gmiTbody"><tr><td colspan="8"><div class="empty-state"><div class="spinner"></div></div></td></tr></tbody>
        </table>
      </div>
      <div class="pagination" id="gmiPagination"></div>
    </div>`;

  gmiPage = 1; loadGMI();
  document.getElementById('gmiSearch').addEventListener('input', debounce(e => {
    gmiPage = 1; loadGMI();
  }, 400));
  document.getElementById('gmiFilter').addEventListener('click', () => { gmiPage = 1; loadGMI(); });
  document.getElementById('addGMIBtn').addEventListener('click', openGMIModal);
}

async function loadGMI() {
  const s = document.getElementById('gmiSearch')?.value || '';
  const m = document.getElementById('gmiMonth')?.value || '';
  const y = document.getElementById('gmiYear')?.value || '';
  try {
    const data = await apiCall('GET', `/api/good-moral-issuance?page=${gmiPage}&limit=10&month=${m}&year=${y}&search=${encodeURIComponent(s)}`);
    if (!data) return;
    const tbody = document.getElementById('gmiTbody');
    if (!data.data?.length) {
      tbody.innerHTML = `<tr><td colspan="8"><div class="empty-state"><div class="empty-icon">📖</div><p>No issuance records found</p></div></td></tr>`;
      document.getElementById('gmiPagination').innerHTML = '';
      return;
    }
    tbody.innerHTML = data.data.map(r => `
      <tr>
        <td><strong>${r.students?.full_name || '—'}</strong><br><small style="color:var(--text-muted)">${r.students?.student_id || ''}</small></td>
        <td>${r.program || r.students?.courses?.course_code || '—'}</td>
        <td>${r.purpose || '—'}</td>
        <td>${r.contact_number || '—'}</td>
        <td>${r.date_requested ? new Date(r.date_requested).toLocaleDateString() : '—'}</td>
        <td>${new Date(r.date_processed).toLocaleDateString()}</td>
        <td>${r.processed_by || '—'}</td>
        <td>${r.remarks || '—'}</td>
      </tr>`).join('');
    renderPagination('gmiPagination', data.count, gmiPage, 10, p => { gmiPage = p; loadGMI(); });
  } catch (e) { showToast('Error loading issuance records', 'error'); }
}

async function openGMIModal() {
  openModal(`
    <div class="modal-overlay">
      <div class="modal">
        <div class="modal-header">
          <h3>➕ Record GM Issuance</h3>
          <button class="modal-close">✕</button>
        </div>
        <div class="modal-body">
          <form id="gmiForm">
            <div class="form-group">
              <label>Student ID *</label>
              <input class="form-control" id="gmiStudentId" placeholder="Enter Student ID..." required />
              <small id="gmiStudentName" style="color:var(--text-muted);display:block;margin-top:4px"></small>
            </div>
            <div class="form-row">
              <div class="form-group">
                <label>Contact Number</label>
                <input class="form-control" id="gmiContact" />
              </div>
              <div class="form-group">
                <label>Email</label>
                <input class="form-control" type="email" id="gmiEmail" />
              </div>
            </div>
            <div class="form-row">
              <div class="form-group">
                <label>Program</label>
                <input class="form-control" id="gmiProgram" />
              </div>
              <div class="form-group">
                <label>Date Requested</label>
                <input class="form-control" type="date" id="gmiDateReq" />
              </div>
            </div>
            <div class="form-group">
              <label>Purpose</label>
              <textarea class="form-control" id="gmiPurpose"></textarea>
            </div>
            <div class="form-row">
              <div class="form-group">
                <label>Processed By</label>
                <input class="form-control" id="gmiProcessedBy" />
              </div>
              <div class="form-group">
                <label>Remarks</label>
                <input class="form-control" id="gmiRemarks" />
              </div>
            </div>
            <div class="form-actions">
              <button type="button" class="btn btn-danger" onclick="closeModal()">Cancel</button>
              <button type="submit" class="btn btn-success">Record Issuance</button>
            </div>
          </form>
        </div>
      </div>
    </div>`);

  document.getElementById('gmiStudentId').addEventListener('change', async (e) => {
    const sid = e.target.value.trim();
    const data = await apiCall('GET', `/api/students?search=${encodeURIComponent(sid)}&limit=1`);
    const student = data?.data?.[0];
    const label = document.getElementById('gmiStudentName');
    if (student && student.student_id === sid) {
      label.textContent = `✅ ${student.full_name}`; label.style.color = 'var(--success)';
      document.getElementById('gmiStudentId').dataset.uuid = student.id;
      document.getElementById('gmiProgram').value = student.courses?.course_code || '';
    } else {
      label.textContent = '❌ Student not found'; label.style.color = 'var(--danger)';
    }
  });

  document.getElementById('gmiForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const studentId = document.getElementById('gmiStudentId').dataset.uuid;
    if (!studentId) { showToast('Please enter a valid Student ID', 'error'); return; }
    try {
      await apiCall('POST', '/api/good-moral-issuance', {
        student_id: studentId,
        contact_number: document.getElementById('gmiContact').value,
        email: document.getElementById('gmiEmail').value,
        program: document.getElementById('gmiProgram').value,
        purpose: document.getElementById('gmiPurpose').value,
        date_requested: document.getElementById('gmiDateReq').value || null,
        processed_by: document.getElementById('gmiProcessedBy').value,
        remarks: document.getElementById('gmiRemarks').value
      });
      showToast('Issuance recorded');
      closeModal();
      loadGMI();
    } catch (err) { showToast(err.message, 'error'); }
  });
}

function debounce(fn, ms) {
  let t; return (...args) => { clearTimeout(t); t = setTimeout(() => fn(...args), ms); };
}

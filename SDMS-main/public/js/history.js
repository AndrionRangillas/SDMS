/* ====================================================
   history.js — Record History Module
   ==================================================== */

let histPage = 1;

async function renderHistory() {
    const content = document.getElementById('pageContent');
    content.innerHTML = `
    <div class="page-header">
      <h2>📁 Record History</h2>
      <p>Complete disciplinary history with advanced filtering</p>
    </div>
    <div class="card">
      <div class="card-header">
        <div class="toolbar" style="flex-wrap:wrap;gap:10px">
          <select class="form-control" id="histStatus" style="width:150px">
            <option value="">All Statuses</option>
            <option>Pending</option>
            <option>Approved</option>
            <option>Resolved</option>
          </select>
          <select class="form-control" id="histCourse" style="width:120px">
            <option value="">All Courses</option>
            <option>IT</option>
            <option>IBM</option>
            <option>TEP</option>
          </select>
          <input type="date" class="form-control" id="histStart" style="width:160px" />
          <span style="color:var(--text-muted);align-self:center">to</span>
          <input type="date" class="form-control" id="histEnd" style="width:160px" />
          <button class="btn btn-primary btn-sm" id="histFilter">🔍 Apply Filters</button>
          <button class="btn btn-warning btn-sm" id="histReset">↺ Reset</button>
        </div>
      </div>
      <div class="table-wrapper">
        <table>
          <thead>
            <tr>
              <th>Student Name</th>
              <th>Course</th>
              <th>Complaint Type</th>
              <th>Subject</th>
              <th>Case Level</th>
              <th>Status</th>
              <th>Action Taken</th>
              <th>Date</th>
            </tr>
          </thead>
          <tbody id="histTbody"><tr><td colspan="8"><div class="empty-state"><div class="spinner"></div></div></td></tr></tbody>
        </table>
      </div>
      <div class="pagination" id="histPagination"></div>
    </div>`;

    histPage = 1;
    loadHistory();

    document.getElementById('histFilter').addEventListener('click', () => { histPage = 1; loadHistory(); });
    document.getElementById('histReset').addEventListener('click', () => {
        document.getElementById('histStatus').value = '';
        document.getElementById('histCourse').value = '';
        document.getElementById('histStart').value = '';
        document.getElementById('histEnd').value = '';
        histPage = 1;
        loadHistory();
    });
}

async function loadHistory() {
    const status = document.getElementById('histStatus')?.value || '';
    const course = document.getElementById('histCourse')?.value || '';
    const start = document.getElementById('histStart')?.value || '';
    const end = document.getElementById('histEnd')?.value || '';

    let url = `/api/history?page=${histPage}&limit=10`;
    if (status) url += `&status=${encodeURIComponent(status)}`;
    if (course) url += `&course=${encodeURIComponent(course)}`;
    if (start) url += `&start=${start}`;
    if (end) url += `&end=${end}`;

    try {
        const data = await apiCall('GET', url);
        if (!data) return;
        const tbody = document.getElementById('histTbody');

        if (!data.data?.length) {
            tbody.innerHTML = `<tr><td colspan="8"><div class="empty-state"><div class="empty-icon">📁</div><p>No records found for the selected filters</p></div></td></tr>`;
            document.getElementById('histPagination').innerHTML = '';
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
        <td>${c.subject || '—'}</td>
        <td>${caseBadge(c.case_level)}</td>
        <td>${statusBadge(c.status)}</td>
        <td>${c.action_taken || '—'}</td>
        <td>${new Date(c.created_at).toLocaleDateString()}</td>
      </tr>`).join('');

        renderPagination('histPagination', data.count, histPage, 10, p => { histPage = p; loadHistory(); });
    } catch (e) {
        showToast('Failed to load history: ' + e.message, 'error');
    }
}

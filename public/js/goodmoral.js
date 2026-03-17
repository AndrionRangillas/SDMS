/* ====================================================
   goodmoral.js — Good Moral Certificate Generator
   ==================================================== */

async function renderGMCertificate() {
    const content = document.getElementById('pageContent');
    content.innerHTML = `
    <div class="page-header">
      <h2>🏅 Good Moral Certificate</h2>
      <p>Generate and download Good Moral Certificates for eligible students</p>
    </div>

    <!-- Eligibility Rules -->
    <div class="card" style="margin-bottom:20px">
      <div class="card-header"><h3>📜 Eligibility Requirements</h3></div>
      <div class="card-body">
        <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:12px">
          <div style="display:flex;align-items:center;gap:10px;padding:12px;background:var(--bg-dark);border-radius:8px;border:1px solid var(--border)">
            <span style="font-size:1.4rem">✅</span>
            <div><strong style="font-size:0.85rem">No Active Complaints</strong><br><small style="color:var(--text-muted)">All complaints must be Resolved</small></div>
          </div>
          <div style="display:flex;align-items:center;gap:10px;padding:12px;background:var(--bg-dark);border-radius:8px;border:1px solid var(--border)">
            <span style="font-size:1.4rem">🤝</span>
            <div><strong style="font-size:0.85rem">Community Service Done</strong><br><small style="color:var(--text-muted)">All CS obligations must be completed</small></div>
          </div>
          <div style="display:flex;align-items:center;gap:10px;padding:12px;background:var(--bg-dark);border-radius:8px;border:1px solid var(--border)">
            <span style="font-size:1.4rem">📋</span>
            <div><strong style="font-size:0.85rem">No Pending Sanctions</strong><br><small style="color:var(--text-muted)">Must have completed all sanctions</small></div>
          </div>
        </div>
      </div>
    </div>

    <!-- Certificate Generator -->
    <div class="card">
      <div class="card-header"><h3>🔍 Check Eligibility & Generate Certificate</h3></div>
      <div class="card-body">
        <div style="display:flex;gap:12px;margin-bottom:16px">
          <div class="search-box" style="flex:1;max-width:400px">
            <span class="si">🔍</span>
            <input type="text" id="certStudentId" placeholder="Enter Student ID..." />
          </div>
          <button class="btn btn-primary" id="checkEligBtn">Check Eligibility</button>
        </div>

        <div id="eligibilityResult" class="eligibility-result">
          <!-- Student info and eligibility result loaded here -->
        </div>
      </div>
    </div>

    <!-- Certificate History -->
    <div class="card" style="margin-top:20px">
      <div class="card-header"><h3>📋 Certificates Issued</h3></div>
      <div class="table-wrapper">
        <table>
          <thead>
            <tr>
              <th>Student</th>
              <th>Institute</th>
              <th>Date Issued</th>
              <th>Issued By</th>
            </tr>
          </thead>
          <tbody id="certHistoryTbody"><tr><td colspan="4"><div class="empty-state"><p>Search a student to view their certificate history</p></div></td></tr></tbody>
        </table>
      </div>
    </div>`;

    document.getElementById('checkEligBtn').addEventListener('click', checkAndShowEligibility);
    document.getElementById('certStudentId').addEventListener('keypress', e => {
        if (e.key === 'Enter') checkAndShowEligibility();
    });
}

async function checkAndShowEligibility() {
    const sid = document.getElementById('certStudentId').value.trim();
    if (!sid) { showToast('Please enter a Student ID', 'error'); return; }

    const resultDiv = document.getElementById('eligibilityResult');
    resultDiv.style.display = 'block';
    resultDiv.className = 'eligibility-result';
    resultDiv.innerHTML = `<div style="text-align:center;padding:20px"><div class="spinner"></div><p style="margin-top:8px;color:var(--text-muted)">Checking eligibility...</p></div>`;

    try {
        // Find student by student_id
        const students = await apiCall('GET', `/api/students?search=${encodeURIComponent(sid)}&limit=1`);
        const student = students?.data?.find(s => s.student_id === sid);

        if (!student) {
            resultDiv.className = 'eligibility-result not-eligible';
            resultDiv.style.display = 'block';
            resultDiv.innerHTML = `<div style="display:flex;align-items:center;gap:12px"><span style="font-size:2rem">❌</span><div><strong>Student Not Found</strong><p style="color:var(--text-secondary);margin-top:4px">No student found with ID: ${escHtml(sid)}</p></div></div>`;
            return;
        }

        const elig = await apiCall('GET', `/api/certificates/check/${student.id}`);
        const certHistory = await apiCall('GET', `/api/certificates/${student.id}`);

        // Update history table
        const tbody = document.getElementById('certHistoryTbody');
        if (certHistory && certHistory.length > 0) {
            tbody.innerHTML = certHistory.map(c => `
        <tr>
          <td>${student.full_name}</td>
          <td>${student.courses?.course_code || '—'}</td>
          <td>${new Date(c.issued_date).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</td>
          <td>${c.issued_by || '—'}</td>
        </tr>`).join('');
        } else {
            tbody.innerHTML = `<tr><td colspan="4"><div class="empty-state"><p>No certificates issued yet for this student</p></div></td></tr>`;
        }

        // Show eligibility result
        if (elig.eligible) {
            resultDiv.className = 'eligibility-result eligible';
            resultDiv.style.display = 'block';
            resultDiv.innerHTML = `
        <div style="display:flex;align-items:flex-start;gap:16px;flex-wrap:wrap">
          <span style="font-size:2.5rem">✅</span>
          <div style="flex:1">
            <h3 style="color:var(--success);margin-bottom:8px">Student is ELIGIBLE</h3>
            <div style="background:var(--bg-dark);border-radius:8px;padding:16px;margin-bottom:16px">
              <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:12px;font-size:0.875rem">
                <div><span style="color:var(--text-muted)">Name:</span><br><strong>${escHtml(student.full_name)}</strong></div>
                <div><span style="color:var(--text-muted)">Student ID:</span><br><strong>${student.student_id}</strong></div>
                <div><span style="color:var(--text-muted)">Institute:</span><br><strong>${student.courses?.course_code || '—'}</strong></div>
              </div>
            </div>
            <p style="color:var(--text-secondary);font-size:0.875rem;margin-bottom:16px">${elig.reason}</p>
            <div style="display:flex;gap:10px;flex-wrap:wrap">
              <button class="btn btn-success" id="generateCertBtn">🏅 Generate & Download Certificate</button>
              <button class="btn btn-primary" onclick="window.print?.()">🖨️ Print</button>
            </div>
          </div>
        </div>`;

            document.getElementById('generateCertBtn').addEventListener('click', () => generateCertificate(student.id, student.full_name));
        } else {
            resultDiv.className = 'eligibility-result not-eligible';
            resultDiv.style.display = 'block';
            resultDiv.innerHTML = `
        <div style="display:flex;align-items:flex-start;gap:16px">
          <span style="font-size:2.5rem">❌</span>
          <div>
            <h3 style="color:var(--danger);margin-bottom:8px">Student is NOT Eligible</h3>
            <div style="background:var(--bg-dark);border-radius:8px;padding:16px;margin-bottom:12px;font-size:0.875rem">
              <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:12px">
                <div><span style="color:var(--text-muted)">Name:</span><br><strong>${escHtml(student.full_name)}</strong></div>
                <div><span style="color:var(--text-muted)">Student ID:</span><br><strong>${student.student_id}</strong></div>
                <div><span style="color:var(--text-muted)">Institute:</span><br><strong>${student.courses?.course_code || '—'}</strong></div>
              </div>
            </div>
            <div style="display:flex;align-items:center;gap:8px;padding:12px;background:rgba(239,68,68,0.08);border-radius:8px;border:1px solid rgba(239,68,68,0.2)">
              <span>⚠️</span>
              <p style="color:#f87171;font-size:0.875rem">${elig.reason}</p>
            </div>
          </div>
        </div>`;
        }
    } catch (err) {
        resultDiv.className = 'eligibility-result not-eligible';
        resultDiv.style.display = 'block';
        resultDiv.innerHTML = `<p style="color:var(--danger)">Error checking eligibility: ${err.message}</p>`;
    }
}

async function generateCertificate(studentId, name) {
    try {
        const btn = document.getElementById('generateCertBtn');
        btn.disabled = true;
        btn.innerHTML = '<span class="spinner"></span> Generating...';

        const res = await fetch('/api/certificates/generate', {
            method: 'POST',
            headers: authHeaders(),
            body: JSON.stringify({ student_id: studentId })
        });

        if (!res.ok) {
            const err = await res.json();
            throw new Error(err.error || 'Generation failed');
        }

        // Trigger download
        const blob = await res.blob();
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `GoodMoral_${name.replace(/\s+/g, '_')}.pdf`;
        a.click();
        URL.revokeObjectURL(url);

        showToast('Certificate downloaded successfully! 🎉', 'success');
        btn.disabled = false;
        btn.innerHTML = '🏅 Generate & Download Certificate';
    } catch (err) {
        showToast(err.message, 'error');
        const btn = document.getElementById('generateCertBtn');
        if (btn) { btn.disabled = false; btn.innerHTML = '🏅 Generate & Download Certificate'; }
    }
}

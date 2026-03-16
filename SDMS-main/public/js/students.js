/* ====================================================
   students.js — Students CRUD Module
   ==================================================== */

let studentPage = 1;
let studentSearch = '';
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
          <button class="btn btn-primary" id="addStudentBtn">＋ Add Student</button>
        </div>
      </div>
      <div class="table-wrapper">
        <table>
          <thead>
            <tr>
              <th>Student ID</th>
              <th>Full Name</th>
              <th>Course</th>
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

    await loadCourses();
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
        const data = await apiCall('GET', `/api/students?page=${studentPage}&limit=10&search=${encodeURIComponent(studentSearch)}`);
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
        <td><span class="badge badge-case1">${s.courses?.course_code || '—'}</span></td>
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
            <!-- Basic Information (Always Visible) -->
            <div class="form-section">
              <h4>📋 Personal Information</h4>
              <div class="form-row">
                <div class="form-group">
                  <label>Student ID *</label>
                  <input class="form-control" name="student_id" value="${student?.student_id || ''}" required />
                </div>
                <div class="form-group">
                  <label>First Name *</label>
                  <input class="form-control" name="first_name" value="${student?.first_name || ''}" required />
                </div>
                <div class="form-group">
                  <label>Last Name *</label>
                  <input class="form-control" name="last_name" value="${student?.last_name || ''}" required />
                </div>
              </div>
              <div class="form-row">
                <div class="form-group">
                  <label>Middle Name</label>
                  <input class="form-control" name="middle_name" value="${student?.middle_name || ''}" />
                </div>
                <div class="form-group">
                  <label>Course</label>
                  <select class="form-control" name="course_id">
                    <option value="">Select Course</option>
                    ${courseOptions}
                  </select>
                </div>
                <div class="form-group">
                  <label>Year</label>
                  <select class="form-control" name="year_level">
                    <option value="">Select Year</option>
                    <option ${student?.year_level === '1st Year' ? 'selected' : ''}>1st Year</option>
                    <option ${student?.year_level === '2nd Year' ? 'selected' : ''}>2nd Year</option>
                    <option ${student?.year_level === '3rd Year' ? 'selected' : ''}>3rd Year</option>
                    <option ${student?.year_level === '4th Year' ? 'selected' : ''}>4th Year</option>
                  </select>
                </div>
              </div>
              <div class="form-row">
                <div class="form-group">
                  <label>Gender</label>
                  <select class="form-control" name="gender">
                    <option value="" ${!student?.gender ? 'selected' : ''}>Select</option>
                    <option ${student?.gender === 'Male' ? 'selected' : ''}>Male</option>
                    <option ${student?.gender === 'Female' ? 'selected' : ''}>Female</option>
                    <option ${student?.gender === 'Other' ? 'selected' : ''}>Other</option>
                  </select>
                </div>
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
            </div>

            <!-- View More Button -->
            <div class="view-more-section">
              <button type="button" class="btn btn-outline view-more-btn" onclick="toggleViewMore()">
                <span class="view-more-text">📄 View More (Optional)</span>
                <span class="view-more-arrow">▼</span>
              </button>
            </div>

            <!-- Extended Information (Hidden by Default) -->
            <div class="extended-form-section" id="extendedFormSection" style="display: none;">
              
              <!-- Student Background -->
              <div class="form-section">
                <h4>🎓 Student Background</h4>
                <div class="form-group">
                  <label>First Generation College Student</label>
                  <div class="checkbox-group">
                    <label class="checkbox-label">
                      <input type="radio" name="first_generation" value="yes" ${student?.first_generation === 'yes' ? 'checked' : ''}>
                      <span>YES</span>
                    </label>
                    <label class="checkbox-label">
                      <input type="radio" name="first_generation" value="no" ${student?.first_generation === 'no' ? 'checked' : ''}>
                      <span>NO</span>
                    </label>
                  </div>
                </div>
                
                <div class="form-group">
                  <label>Child of a Person Deprived of Liberty</label>
                  <div class="checkbox-group">
                    <label class="checkbox-label">
                      <input type="radio" name="child_of_pdl" value="yes" ${student?.child_of_pdl === 'yes' ? 'checked' : ''}>
                      <span>YES</span>
                    </label>
                    <label class="checkbox-label">
                      <input type="radio" name="child_of_pdl" value="no" ${student?.child_of_pdl === 'no' ? 'checked' : ''}>
                      <span>NO</span>
                    </label>
                  </div>
                </div>

                <div class="form-row">
                  <div class="form-group">
                    <label>Raised by a Single/Solo Parent</label>
                    <div class="checkbox-group">
                      <label class="checkbox-label">
                        <input type="radio" name="single_parent" value="yes" ${student?.single_parent === 'yes' ? 'checked' : ''}>
                        <span>YES</span>
                      </label>
                      <label class="checkbox-label">
                        <input type="radio" name="single_parent" value="no" ${student?.single_parent === 'no' ? 'checked' : ''}>
                        <span>NO</span>
                      </label>
                    </div>
                  </div>
                  <div class="form-group">
                    <label>Solo Parent</label>
                    <div class="checkbox-group">
                      <label class="checkbox-label">
                        <input type="radio" name="solo_parent" value="yes" ${student?.solo_parent === 'yes' ? 'checked' : ''}>
                        <span>YES</span>
                      </label>
                      <label class="checkbox-label">
                        <input type="radio" name="solo_parent" value="no" ${student?.solo_parent === 'no' ? 'checked' : ''}>
                        <span>NO</span>
                      </label>
                    </div>
                  </div>
                  <div class="form-group">
                    <label>Orphan</label>
                    <div class="checkbox-group">
                      <label class="checkbox-label">
                        <input type="radio" name="orphan" value="yes" ${student?.orphan === 'yes' ? 'checked' : ''}>
                        <span>YES</span>
                      </label>
                      <label class="checkbox-label">
                        <input type="radio" name="orphan" value="no" ${student?.orphan === 'no' ? 'checked' : ''}>
                        <span>NO</span>
                      </label>
                    </div>
                  </div>
                </div>

                <div class="form-row">
                  <div class="form-group">
                    <label>Child of an Overseas Filipino Worker (OFW)</label>
                    <div class="checkbox-group">
                      <label class="checkbox-label">
                        <input type="radio" name="child_of_ofw" value="yes" ${student?.child_of_ofw === 'yes' ? 'checked' : ''}>
                        <span>YES</span>
                      </label>
                      <label class="checkbox-label">
                        <input type="radio" name="child_of_ofw" value="no" ${student?.child_of_ofw === 'no' ? 'checked' : ''}>
                        <span>NO</span>
                      </label>
                    </div>
                  </div>
                  <div class="form-group">
                    <label>4Ps Beneficiary</label>
                    <div class="checkbox-group">
                      <label class="checkbox-label">
                        <input type="radio" name="fourps_beneficiary" value="yes" ${student?.fourps_beneficiary === 'yes' ? 'checked' : ''}>
                        <span>YES</span>
                      </label>
                      <label class="checkbox-label">
                        <input type="radio" name="fourps_beneficiary" value="no" ${student?.fourps_beneficiary === 'no' ? 'checked' : ''}>
                        <span>NO</span>
                      </label>
                    </div>
                  </div>
                </div>
              </div>

              <!-- Person with Disability -->
              <div class="form-section">
                <h4>♿ Person with Disability (PWD)</h4>
                <div class="form-group">
                  <label>Are you a PWD?</label>
                  <div class="checkbox-group">
                    <label class="checkbox-label">
                      <input type="radio" name="is_pwd" value="yes" ${student?.is_pwd === 'yes' ? 'checked' : ''}>
                      <span>YES</span>
                    </label>
                    <label class="checkbox-label">
                      <input type="radio" name="is_pwd" value="no" ${student?.is_pwd === 'no' ? 'checked' : ''}>
                      <span>NO</span>
                    </label>
                  </div>
                </div>
                <div class="form-row">
                  <div class="form-group">
                    <label>Type of Disability</label>
                    <input class="form-control" name="disability_type" value="${student?.disability_type || ''}" placeholder="For PWD only" />
                  </div>
                  <div class="form-group">
                    <label>PWD ID No.</label>
                    <input class="form-control" name="pwd_id_number" value="${student?.pwd_id_number || ''}" />
                  </div>
                </div>
              </div>

              <!-- Indigenous People Identity -->
              <div class="form-section">
                <h4>🏛️ Indigenous People (IP) Identity</h4>
                <div class="form-group">
                  <label>Are you a member of the Indigenous People (IP)?</label>
                  <div class="checkbox-group">
                    <label class="checkbox-label">
                      <input type="radio" name="is_indigenous" value="yes" ${student?.is_indigenous === 'yes' ? 'checked' : ''}>
                      <span>YES</span>
                    </label>
                    <label class="checkbox-label">
                      <input type="radio" name="is_indigenous" value="no" ${student?.is_indigenous === 'no' ? 'checked' : ''}>
                      <span>NO</span>
                    </label>
                  </div>
                </div>
                <div class="form-group">
                  <label>Please specify your tribe:</label>
                  <div class="checkbox-group">
                    <label class="checkbox-label">
                      <input type="checkbox" name="ip_tribe[]" value="pure_blooded" ${student?.ip_tribe?.includes('pure_blooded') ? 'checked' : ''}>
                      <span>Pure-blooded IP</span>
                    </label>
                    <label class="checkbox-label">
                      <input type="checkbox" name="ip_tribe[]" value="not_pure_blooded" ${student?.ip_tribe?.includes('not_pure_blooded') ? 'checked' : ''}>
                      <span>Not pure-blooded IP</span>
                    </label>
                  </div>
                </div>
              </div>

              <!-- Living Arrangements & Transportation -->
              <div class="form-section">
                <h4>🏠 Living Arrangements & Transportation</h4>
                <div class="form-group">
                  <label>Living Arrangement (Select 1 that applies)</label>
                  <div class="checkbox-group vertical">
                    <label class="checkbox-label">
                      <input type="radio" name="living_arrangement" value="commuting" ${student?.living_arrangement === 'commuting' ? 'checked' : ''}>
                      <span>Commuting</span>
                    </label>
                    <label class="checkbox-label">
                      <input type="radio" name="living_arrangement" value="renting" ${student?.living_arrangement === 'renting' ? 'checked' : ''}>
                      <span>Renting</span>
                    </label>
                    <label class="checkbox-label">
                      <input type="radio" name="living_arrangement" value="residing_near_school" ${student?.living_arrangement === 'residing_near_school' ? 'checked' : ''}>
                      <span>Residing Near the School</span>
                    </label>
                  </div>
                </div>
                <div class="form-row">
                  <div class="form-group">
                    <label>Average daily commute cost (Php)</label>
                    <input class="form-control" type="number" name="commute_cost" value="${student?.commute_cost || ''}" />
                  </div>
                  <div class="form-group">
                    <label>Monthly rent cost (Php)</label>
                    <input class="form-control" type="number" name="rent_cost" value="${student?.rent_cost || ''}" />
                  </div>
                </div>
                <div class="form-group">
                  <label>Address commuting from / Residence name / Address</label>
                  <textarea class="form-control" name="detailed_address">${student?.detailed_address || ''}</textarea>
                </div>
              </div>

              <!-- Work Status -->
              <div class="form-section">
                <h4>💼 Work Status</h4>
                <div class="form-group">
                  <label>Are you a working student?</label>
                  <div class="checkbox-group">
                    <label class="checkbox-label">
                      <input type="radio" name="is_working_student" value="yes" ${student?.is_working_student === 'yes' ? 'checked' : ''}>
                      <span>YES</span>
                    </label>
                    <label class="checkbox-label">
                      <input type="radio" name="is_working_student" value="no" ${student?.is_working_student === 'no' ? 'checked' : ''}>
                      <span>NO</span>
                    </label>
                  </div>
                </div>
                <div class="form-group">
                  <label>Work Schedule (For working students only)</label>
                  <div class="checkbox-group">
                    <label class="checkbox-label">
                      <input type="checkbox" name="work_schedule[]" value="part_time" ${student?.work_schedule?.includes('part_time') ? 'checked' : ''}>
                      <span>Part-time</span>
                    </label>
                    <label class="checkbox-label">
                      <input type="checkbox" name="work_schedule[]" value="full_time" ${student?.work_schedule?.includes('full_time') ? 'checked' : ''}>
                      <span>Full-time</span>
                    </label>
                    <label class="checkbox-label">
                      <input type="checkbox" name="work_schedule[]" value="in_house" ${student?.work_schedule?.includes('in_house') ? 'checked' : ''}>
                      <span>In-house</span>
                    </label>
                    <label class="checkbox-label">
                      <input type="checkbox" name="work_schedule[]" value="out_house" ${student?.work_schedule?.includes('out_house') ? 'checked' : ''}>
                      <span>Out-house</span>
                    </label>
                  </div>
                </div>
                <div class="form-row">
                  <div class="form-group">
                    <label>Type of work</label>
                    <input class="form-control" name="work_type" value="${student?.work_type || ''}" />
                  </div>
                  <div class="form-group">
                    <label>Place/Company where you work</label>
                    <input class="form-control" name="work_place" value="${student?.work_place || ''}" />
                  </div>
                </div>
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
        
        // Handle checkbox arrays
        const checkboxArrays = ['ip_tribe', 'work_schedule'];
        checkboxArrays.forEach(field => {
            const values = fd.getAll(field + '[]');
            if (values.length > 0) {
                body[field] = values;
            }
        });

        // Combine first, middle, last name into full_name for compatibility
        if (body.first_name || body.last_name) {
            body.full_name = [body.first_name, body.middle_name, body.last_name].filter(Boolean).join(' ');
        }

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

// Function to toggle the extended form section
function toggleViewMore() {
    const extendedSection = document.getElementById('extendedFormSection');
    const viewMoreBtn = document.querySelector('.view-more-btn');
    const arrow = document.querySelector('.view-more-arrow');
    const text = document.querySelector('.view-more-text');
    
    if (extendedSection.style.display === 'none') {
        extendedSection.style.display = 'block';
        arrow.textContent = '▲';
        text.textContent = '📄 View Less';
        viewMoreBtn.classList.add('expanded');
    } else {
        extendedSection.style.display = 'none';
        arrow.textContent = '▼';
        text.textContent = '📄 View More (Optional)';
        viewMoreBtn.classList.remove('expanded');
    }
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

        const pendingComplaints = complaints.filter(c => c.status === 'Pending');
        const pendingCS = cs.filter(x => x.status !== 'Completed');
        const hasPendingComplaints = pendingComplaints.length > 0;
        const hasPendingCS = pendingCS.length > 0;

        // ---- Student Info ----
        const infoHtml = `
        <div class="records-section">
          <div class="records-section-title">👤 Student Information</div>
          <div class="records-info-grid">
            <div><span class="info-label">Student ID</span><span class="info-value">${escHtml(s.student_id || '—')}</span></div>
            <div><span class="info-label">Full Name</span><span class="info-value">${escHtml(s.full_name || '—')}</span></div>
            <div><span class="info-label">Course</span><span class="info-value">${escHtml(s.courses?.course_code || '—')} — ${escHtml(s.courses?.course_name || '')}</span></div>
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

        // ---- Status Summary ----
        const noPendingRecords = !hasPendingComplaints && !hasPendingCS;
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
              </div>`
          }
        </div>`;

        const portal = document.getElementById('modalPortal');
        const body = portal.querySelector('.modal-body');
        if (body) {
            body.innerHTML = infoHtml + complaintsHtml + csHtml + summaryHtml;
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

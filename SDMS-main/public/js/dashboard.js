/* ====================================================
   dashboard.js — Stats + Chart.js bar chart + date filters
   ==================================================== */

let bullChart = null;

async function renderDashboard() {
    const content = document.getElementById('pageContent');
    content.innerHTML = `
    <div class="page-header">
      <h2>📊 Dashboard</h2>
      <p>Welcome back! Here's an overview of the discipline office.</p>
    </div>

    <!-- Stats Cards -->
    <div class="stats-grid" id="statsGrid">
      ${['', '', '', '', ''].map(() => `
        <div class="stat-card">
          <div class="stat-icon blue"><span class="spinner"></span></div>
          <div class="stat-info"><h3>—</h3><p>Loading...</p></div>
        </div>
      `).join('')}
    </div>

    <!-- Bullying / Complaints Chart -->
    <div class="chart-section">
      <div class="chart-header">
        <h3>📈 Complaints by Course</h3>
        <div class="chart-filters">
          <button class="filter-btn active" data-filter="month">This Month</button>
          <button class="filter-btn" data-filter="week">This Week</button>
          <button class="filter-btn" data-filter="today">Today</button>
          <button class="filter-btn" data-filter="custom">Custom</button>
        </div>
      </div>
      <div class="custom-date-range" id="customRange">
        <input type="date" id="dateStart" />
        <span style="color:var(--text-muted)">to</span>
        <input type="date" id="dateEnd" />
        <button class="btn btn-primary btn-sm" id="applyCustom">Apply</button>
      </div>
      <div class="chart-canvas-wrapper">
        <canvas id="complaintsChart"></canvas>
      </div>
    </div>
  `;

    loadStats();
    loadChart('month');
    setupChartFilters();
}

async function loadStats() {
    try {
        console.log('Loading dashboard stats...');
        const data = await apiCall('GET', '/api/dashboard/stats');
        console.log('Dashboard stats data received:', data);
        
        if (!data) {
            console.error('No data received from stats API');
            return;
        }

        // Ensure all values are numbers with fallbacks
        const stats = {
            totalStudents: Number(data.totalStudents) || 0,
            maleStudents: Number(data.maleStudents) || 0,
            femaleStudents: Number(data.femaleStudents) || 0,
            totalComplaints: Number(data.totalComplaints) || 0,
            pendingCases: Number(data.pendingCases) || 0,
            approvedCases: Number(data.approvedCases) || 0,
            resolvedCases: Number(data.resolvedCases) || 0
        };

        console.log('Processed stats:', stats);

        document.getElementById('statsGrid').innerHTML = `
      <div class="stat-card clickable" onclick="showAllStudents()">
        <div class="stat-icon blue">👥</div>
        <div class="stat-info"><h3>${stats.totalStudents}</h3><p>Total Students</p></div>
      </div>
      <div class="stat-card clickable" onclick="showStudentsByGender('Male')">
        <div class="stat-icon green">👨</div>
        <div class="stat-info"><h3>${stats.maleStudents}</h3><p>Male Students</p></div>
      </div>
      <div class="stat-card clickable" onclick="showStudentsByGender('Female')">
        <div class="stat-icon pink">👩</div>
        <div class="stat-info"><h3>${stats.femaleStudents}</h3><p>Female Students</p></div>
      </div>
      <div class="stat-card">
        <div class="stat-icon purple">📋</div>
        <div class="stat-info"><h3>${stats.totalComplaints}</h3><p>Total Complaints</p></div>
      </div>
      <div class="stat-card">
        <div class="stat-icon orange">⏳</div>
        <div class="stat-info"><h3>${stats.pendingCases}</h3><p>Pending Cases</p></div>
      </div>
      <div class="stat-card">
        <div class="stat-icon blue">✅</div>
        <div class="stat-info"><h3>${stats.approvedCases}</h3><p>Approved Cases</p></div>
      </div>
      <div class="stat-card">
        <div class="stat-icon green">🏁</div>
        <div class="stat-info"><h3>${stats.resolvedCases}</h3><p>Resolved Cases</p></div>
      </div>
    `;
    } catch (e) {
        console.error('Stats loading error:', e);
        showToast('Failed to load dashboard stats', 'error');
    }
}

async function loadChart(filter, start = '', end = '') {
    try {
        let url = `/api/dashboard/chart?filter=${filter}`;
        if (filter === 'custom' && start && end) url += `&start=${start}&end=${end}`;

        const data = await apiCall('GET', url);
        if (!data) return;

        const canvas = document.getElementById('complaintsChart');
        if (!canvas) return;

        if (bullChart) { bullChart.destroy(); bullChart = null; }

        const ctx = canvas.getContext('2d');
        bullChart = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: data.labels,
                datasets: [{
                    label: 'Complaints',
                    data: data.values,
                    backgroundColor: [
                        'rgba(34,197,94,0.7)',   // IT - Green
                        'rgba(234,179,8,0.7)',   // IBM - Yellow
                        'rgba(59,130,246,0.7)'   // TEP - Blue
                    ],
                    borderColor: [
                        'rgba(34,197,94,1)',     // IT - Green
                        'rgba(234,179,8,1)',     // IBM - Yellow
                        'rgba(59,130,246,1)'     // TEP - Blue
                    ],
                    borderWidth: 2,
                    borderRadius: 8,
                    borderSkipped: false,
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { display: false },
                    tooltip: {
                        backgroundColor: '#0f1e35',
                        borderColor: 'rgba(37,99,235,0.3)',
                        borderWidth: 1,
                        titleColor: '#f0f6ff',
                        bodyColor: '#8ba3c7',
                        padding: 12,
                        callbacks: {
                            label: ctx => ` ${ctx.parsed.y} complaint${ctx.parsed.y !== 1 ? 's' : ''}`
                        }
                    }
                },
                scales: {
                    x: {
                        grid: { color: 'rgba(255,255,255,0.05)' },
                        ticks: { color: '#8ba3c7', font: { size: 13, weight: '600' } }
                    },
                    y: {
                        beginAtZero: true,
                        grid: { color: 'rgba(255,255,255,0.05)' },
                        ticks: { color: '#8ba3c7', stepSize: 1 }
                    }
                }
            }
        });
    } catch (e) {
        console.error('Chart error:', e);
    }
}

function setupChartFilters() {
    document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            const filter = btn.dataset.filter;
            const customRange = document.getElementById('customRange');
            if (filter === 'custom') {
                customRange?.classList.add('visible');
            } else {
                customRange?.classList.remove('visible');
                loadChart(filter);
            }
        });
    });

    document.getElementById('applyCustom')?.addEventListener('click', () => {
        const start = document.getElementById('dateStart')?.value;
        const end = document.getElementById('dateEnd')?.value;
        if (start && end) loadChart('custom', start, end);
        else showToast('Please select both start and end dates', 'error');
    });
}

// Function to show all students in a modal
async function showAllStudents() {
    try {
        // Fetch all students with course information
        const response = await fetch('/api/students?limit=1000', {
            headers: {
                'Authorization': `Bearer ${getToken()}`,
                'Content-Type': 'application/json'
            }
        });
        
        if (!response.ok) {
            throw new Error('Failed to fetch students');
        }
        
        const data = await response.json();
        const students = data.data || [];

        // Create modal content with course filter
        const studentsRows = students.map(student => {
            const courseDisplay = student.courses 
                ? `${student.courses.course_code} — ${student.courses.course_name}` 
                : (student.course_id ? 'Unknown Course' : '—');
            
            return `
                <tr class="student-row" data-course="${student.courses?.course_code || 'none'}">
                    <td><strong>${student.student_id}</strong></td>
                    <td>${student.full_name}</td>
                    <td><span class="badge badge-case1">${courseDisplay}</span></td>
                    <td>${student.gender || '—'}</td>
                    <td>${student.age || '—'}</td>
                    <td>${student.contact_number || '—'}</td>
                </tr>
            `;
        }).join('');

        const modalContent = `
            <div class="modal-overlay">
                <div class="modal large-modal">
                    <div class="modal-header">
                        <h3>👥 All Students (${students.length})</h3>
                        <button class="modal-close" onclick="closeModal()">✕</button>
                    </div>
                    <div class="modal-body">
                        <div class="students-modal-content">
                            <!-- Course Filter Section -->
                            <div class="course-filter-section">
                                <h4>📚 Filter by Course:</h4>
                                <div class="course-filter-buttons">
                                    <button class="filter-course-btn active" onclick="filterStudentsByCourse('all')">
                                        <span class="course-icon all">👥</span>
                                        All Students
                                    </button>
                                    <button class="filter-course-btn" onclick="filterStudentsByCourse('IT')">
                                        <span class="course-icon it">💻</span>
                                        IT
                                    </button>
                                    <button class="filter-course-btn" onclick="filterStudentsByCourse('IBM')">
                                        <span class="course-icon ibm">💼</span>
                                        IBM
                                    </button>
                                    <button class="filter-course-btn" onclick="filterStudentsByCourse('TEP')">
                                        <span class="course-icon tep">🎓</span>
                                        TEP
                                    </button>
                                </div>
                            </div>

                            ${students.length === 0 ? 
                                '<div class="empty-state"><div class="empty-icon">👤</div><p>No students found</p></div>' :
                                `<div class="table-wrapper">
                                    <table>
                                        <thead>
                                            <tr>
                                                <th>Student ID</th>
                                                <th>Full Name</th>
                                                <th>Course</th>
                                                <th>Gender</th>
                                                <th>Age</th>
                                                <th>Contact</th>
                                            </tr>
                                        </thead>
                                        <tbody id="studentsTableBody">
                                            ${studentsRows}
                                        </tbody>
                                    </table>
                                </div>`
                            }
                        </div>
                        <div class="modal-footer">
                            <button class="btn btn-primary" onclick="closeModal()">Close</button>
                        </div>
                    </div>
                </div>
            </div>
        `;

        // Show modal
        openModal(modalContent);

    } catch (error) {
        console.error('Error fetching students:', error);
        showToast('Failed to load students: ' + error.message, 'error');
    }
}
// Function to show students by gender in a modal
async function showStudentsByGender(gender) {
    try {
        // Fetch students filtered by gender with course information
        const response = await fetch(`/api/students?limit=1000`, {
            headers: {
                'Authorization': `Bearer ${getToken()}`,
                'Content-Type': 'application/json'
            }
        });
        
        if (!response.ok) {
            throw new Error('Failed to fetch students');
        }
        
        const data = await response.json();
        const allStudents = data.data || [];
        
        // Filter students by gender
        const students = allStudents.filter(student => student.gender === gender);

        // Create modal content
        const studentsRows = students.map(student => {
            const courseDisplay = student.courses 
                ? `${student.courses.course_code} — ${student.courses.course_name}` 
                : (student.course_id ? 'Unknown Course' : '—');
            
            return `
                <tr>
                    <td><strong>${student.student_id}</strong></td>
                    <td>${student.full_name}</td>
                    <td><span class="badge badge-case1">${courseDisplay}</span></td>
                    <td><span class="gender-badge ${gender.toLowerCase()}">${student.gender}</span></td>
                    <td>${student.age || '—'}</td>
                    <td>${student.contact_number || '—'}</td>
                    <td>${student.guardian_name || '—'}</td>
                </tr>
            `;
        }).join('');

        const genderIcon = gender === 'Male' ? '👨' : '👩';
        const genderColor = gender === 'Male' ? 'blue' : 'pink';

        const modalContent = `
            <div class="modal-overlay">
                <div class="modal large-modal">
                    <div class="modal-header">
                        <h3><span class="stat-icon ${genderColor}">${genderIcon}</span> ${gender} Students (${students.length})</h3>
                        <button class="modal-close" onclick="closeModal()">✕</button>
                    </div>
                    <div class="modal-body">
                        <div class="students-modal-content">
                            ${students.length === 0 ? 
                                `<div class="empty-state">
                                    <div class="empty-icon">${genderIcon}</div>
                                    <p>No ${gender.toLowerCase()} students found</p>
                                </div>` :
                                `<div class="table-wrapper">
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
                                            </tr>
                                        </thead>
                                        <tbody>
                                            ${studentsRows}
                                        </tbody>
                                    </table>
                                </div>`
                            }
                        </div>
                        <div class="modal-footer">
                            <button class="btn btn-primary" onclick="closeModal()">Close</button>
                        </div>
                    </div>
                </div>
            </div>
        `;

        // Show modal
        openModal(modalContent);

    } catch (error) {
        console.error('Error fetching students by gender:', error);
        showToast(`Failed to load ${gender.toLowerCase()} students: ` + error.message, 'error');
    }
}


// Function to show students by course in a modal
async function showStudentsByCourse(courseCode) {
    try {
        // Close dropdown
        document.getElementById('courseDropdownContent').classList.remove('show');

        // Fetch all students with course information
        const response = await fetch(`/api/students?limit=1000`, {
            headers: {
                'Authorization': `Bearer ${getToken()}`,
                'Content-Type': 'application/json'
            }
        });
        
        if (!response.ok) {
            throw new Error('Failed to fetch students');
        }
        
        const data = await response.json();
        const allStudents = data.data || [];
        
        // Filter students by course code
        const students = allStudents.filter(student => 
            student.courses && student.courses.course_code === courseCode
        );

        // Course information
        const courseInfo = {
            'IT': { name: 'Information Technology', icon: '💻', color: 'green' },
            'IBM': { name: 'International Business Management', icon: '💼', color: 'yellow' },
            'TEP': { name: 'Teacher Education Program', icon: '🎓', color: 'blue' }
        };

        const course = courseInfo[courseCode];

        // Create modal content
        const studentsRows = students.map(student => {
            return `
                <tr>
                    <td><strong>${student.student_id}</strong></td>
                    <td>${student.full_name}</td>
                    <td><span class="gender-badge ${student.gender ? student.gender.toLowerCase() : 'unknown'}">${student.gender || '—'}</span></td>
                    <td>${student.age || '—'}</td>
                    <td>${student.contact_number || '—'}</td>
                    <td>${student.guardian_name || '—'}</td>
                </tr>
            `;
        }).join('');

        const modalContent = `
            <div class="modal-overlay">
                <div class="modal large-modal">
                    <div class="modal-header">
                        <h3>
                            <span class="course-icon-large ${courseCode.toLowerCase()}">${course.icon}</span>
                            ${courseCode} - ${course.name} (${students.length} students)
                        </h3>
                        <button class="modal-close" onclick="closeModal()">✕</button>
                    </div>
                    <div class="modal-body">
                        <div class="students-modal-content">
                            ${students.length === 0 ? 
                                `<div class="empty-state">
                                    <div class="empty-icon">${course.icon}</div>
                                    <p>No students found in ${courseCode} course</p>
                                </div>` :
                                `<div class="course-stats-summary">
                                    <div class="course-stat">
                                        <span class="stat-label">Total Students:</span>
                                        <span class="stat-value">${students.length}</span>
                                    </div>
                                    <div class="course-stat">
                                        <span class="stat-label">Male:</span>
                                        <span class="stat-value">${students.filter(s => s.gender === 'Male').length}</span>
                                    </div>
                                    <div class="course-stat">
                                        <span class="stat-label">Female:</span>
                                        <span class="stat-value">${students.filter(s => s.gender === 'Female').length}</span>
                                    </div>
                                </div>
                                <div class="table-wrapper">
                                    <table>
                                        <thead>
                                            <tr>
                                                <th>Student ID</th>
                                                <th>Full Name</th>
                                                <th>Gender</th>
                                                <th>Age</th>
                                                <th>Contact</th>
                                                <th>Guardian</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            ${studentsRows}
                                        </tbody>
                                    </table>
                                </div>`
                            }
                        </div>
                        <div class="modal-footer">
                            <button class="btn btn-primary" onclick="closeModal()">Close</button>
                        </div>
                    </div>
                </div>
            </div>
        `;

        // Show modal
        openModal(modalContent);

    } catch (error) {
        console.error('Error fetching students by course:', error);
        showToast(`Failed to load ${courseCode} students: ` + error.message, 'error');
    }
}
// Function to filter students by course within the modal
function filterStudentsByCourse(courseCode) {
    const rows = document.querySelectorAll('.student-row');
    const buttons = document.querySelectorAll('.filter-course-btn');
    
    // Update button states
    buttons.forEach(btn => btn.classList.remove('active'));
    event.target.closest('.filter-course-btn').classList.add('active');
    
    // Filter rows
    rows.forEach(row => {
        const studentCourse = row.getAttribute('data-course');
        if (courseCode === 'all' || studentCourse === courseCode) {
            row.style.display = '';
        } else {
            row.style.display = 'none';
        }
    });
    
    // Update visible count
    const visibleRows = document.querySelectorAll('.student-row[style=""], .student-row:not([style])');
    const modalHeader = document.querySelector('.modal-header h3');
    const courseName = courseCode === 'all' ? 'All Students' : 
                      courseCode === 'IT' ? 'IT Students' :
                      courseCode === 'IBM' ? 'IBM Students' :
                      courseCode === 'TEP' ? 'TEP Students' : 'Students';
    
    modalHeader.innerHTML = `👥 ${courseName} (${visibleRows.length})`;
}
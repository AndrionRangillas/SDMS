/* ====================================================
   dashboard.js — Stats + Chart.js bar chart + date filters
   ==================================================== */

let bullChart = null;
let demoChart = null;

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
        <h3>📈 Complaints by Institute</h3>
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

    <!-- Demographics Chart -->
    <div class="chart-section" style="margin-top: 1.5rem;">
      <div class="chart-header">
        <h3>🚻 Student Demographics per Institute</h3>
      </div>
      <div class="chart-canvas-wrapper">
        <canvas id="demographicsChart"></canvas>
      </div>
    </div>
  `;

    loadStats();
    loadChart('month');
    loadDemographicsChart();
    setupChartFilters();
}

async function loadStats() {
    try {
        const data = await apiCall('GET', '/api/dashboard/stats');
        if (!data) return;

        document.getElementById('statsGrid').innerHTML = `
      <div class="stat-card">
        <div class="stat-icon blue">👥</div>
        <div class="stat-info"><h3>${data.totalStudents}</h3><p>Total Students</p></div>
      </div>
      <div class="stat-card">
        <div class="stat-icon purple">📋</div>
        <div class="stat-info"><h3>${data.totalComplaints}</h3><p>Total Complaints</p></div>
      </div>
      <div class="stat-card">
        <div class="stat-icon orange">⏳</div>
        <div class="stat-info"><h3>${data.pendingCases}</h3><p>Pending Cases</p></div>
      </div>
      <div class="stat-card">
        <div class="stat-icon blue">✅</div>
        <div class="stat-info"><h3>${data.approvedCases}</h3><p>Approved Cases</p></div>
      </div>
      <div class="stat-card">
        <div class="stat-icon green">🏁</div>
        <div class="stat-info"><h3>${data.resolvedCases}</h3><p>Resolved Cases</p></div>
      </div>
    `;
    } catch (e) {
        console.error('Stats error:', e);
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
                    backgroundColor: data.labels.map(l => 
                        l === 'IT' ? 'rgba(34, 197, 94, 0.7)' :
                        l === 'IBM' ? 'rgba(234, 179, 8, 0.7)' :
                        l === 'TEP' ? 'rgba(59, 130, 246, 0.7)' :
                        'rgba(156, 163, 175, 0.7)'
                    ),
                    borderColor: data.labels.map(l => 
                        l === 'IT' ? 'rgba(34, 197, 94, 1)' :
                        l === 'IBM' ? 'rgba(234, 179, 8, 1)' :
                        l === 'TEP' ? 'rgba(59, 130, 246, 1)' :
                        'rgba(156, 163, 175, 1)'
                    ),
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

async function loadDemographicsChart() {
    try {
        const data = await apiCall('GET', '/api/dashboard/demographics');
        if (!data) return;

        const canvas = document.getElementById('demographicsChart');
        if (!canvas) return;

        if (demoChart) { demoChart.destroy(); demoChart = null; }

        const ctx = canvas.getContext('2d');
        const getColors = (opacity) => data.labels.map(l => 
            l === 'IT' ? `rgba(34, 197, 94, ${opacity})` :
            l === 'IBM' ? `rgba(234, 179, 8, ${opacity})` :
            l === 'TEP' ? `rgba(59, 130, 246, ${opacity})` :
            `rgba(156, 163, 175, ${opacity})`
        );

        demoChart = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: data.labels,
                datasets: [
                    {
                        label: 'Male',
                        data: data.maleData,
                        backgroundColor: getColors(0.9),
                        borderColor: getColors(1),
                        borderWidth: 2,
                        borderRadius: 4
                    },
                    {
                        label: 'Female',
                        data: data.femaleData,
                        backgroundColor: getColors(0.5),
                        borderColor: getColors(1),
                        borderWidth: 2,
                        borderRadius: 4
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { 
                        display: true, 
                        labels: { color: '#8ba3c7', font: { size: 13, weight: '500' } } 
                    },
                    tooltip: {
                        backgroundColor: '#0f1e35',
                        borderColor: 'rgba(37,99,235,0.3)',
                        borderWidth: 1,
                        titleColor: '#f0f6ff',
                        bodyColor: '#8ba3c7',
                        padding: 12
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
        console.error('Demographics chart error:', e);
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

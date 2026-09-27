// Comprehensive Reporting & Analytics Service

const Reports = {
  activeTab: 'events',

  async fetchEventReport() {
    const data = await API.get('/reports/events');
    return data.success ? data : { summary: {}, events: [] };
  },

  async fetchRegistrationReport(params = {}) {
    const data = await API.get('/reports/registrations', params);
    return data.success ? data : { totalCount: 0, deptDistribution: {}, registrations: [] };
  },

  async fetchPresenterReport() {
    const data = await API.get('/reports/presenters');
    return data.success ? data.presenters : [];
  },

  async fetchResultReport() {
    const data = await API.get('/reports/results');
    return data.success ? data.results : [];
  },

  exportCSV(type = 'events') {
    API.downloadCSV(`/reports/export/csv?type=${type}`, `college_${type}_report_${Date.now()}.csv`);
  },

  print() {
    window.print();
  },

  async renderReportsView() {
    const container = document.getElementById('view-container');
    if (!container) return;

    container.innerHTML = `
      <div style="max-width: 1200px; margin: 0 auto;">
        <div class="page-header">
          <div>
            <h1 class="page-title">📊 Analytics & System Reports</h1>
            <p class="page-subtitle">Exportable metrics, capacity utilization, registration trends, and certificates</p>
          </div>
          <div style="display: flex; gap: 0.75rem;">
            <button class="btn btn-outline" onclick="Reports.print()">🖨️ Print Report</button>
            <button class="btn btn-primary" onclick="Reports.exportCurrentCSV()">📥 Export to CSV</button>
          </div>
        </div>

        <!-- Report Tabs -->
        <div style="display: flex; gap: 0.5rem; margin-bottom: 2rem; border-bottom: 1px solid var(--border); padding-bottom: 0.5rem;">
          <button class="btn ${this.activeTab === 'events' ? 'btn-primary' : 'btn-outline'} btn-sm" onclick="Reports.switchTab('events')">Events Summary</button>
          <button class="btn ${this.activeTab === 'registrations' ? 'btn-primary' : 'btn-outline'} btn-sm" onclick="Reports.switchTab('registrations')">Student Registrations</button>
          <button class="btn ${this.activeTab === 'presenters' ? 'btn-primary' : 'btn-outline'} btn-sm" onclick="Reports.switchTab('presenters')">Presenter Engagement</button>
          <button class="btn ${this.activeTab === 'results' ? 'btn-primary' : 'btn-outline'} btn-sm" onclick="Reports.switchTab('results')">Results & Awardees</button>
        </div>

        <!-- Report Content -->
        <div id="report-content-body">
          <div style="text-align: center; padding: 3rem;"><div class="brand-icon" style="margin: 0 auto 1rem; animation: spin 1s infinite linear;">⚙️</div><p>Loading analytics report...</p></div>
        </div>
      </div>
    `;

    this.loadTabContent();
  },

  switchTab(tab) {
    this.activeTab = tab;
    this.renderReportsView();
  },

  exportCurrentCSV() {
    this.exportCSV(this.activeTab);
  },

  async loadTabContent() {
    const body = document.getElementById('report-content-body');
    if (!body) return;

    if (this.activeTab === 'events') {
      const { summary, events } = await this.fetchEventReport();
      body.innerHTML = `
        <div class="stats-bar" style="margin-bottom: 2rem;">
          <div class="stat-box">
            <div class="stat-icon-wrapper events">📅</div>
            <div>
              <div class="stat-val">${summary.totalEvents || 0}</div>
              <div class="stat-lbl">Total Events</div>
            </div>
          </div>
          <div class="stat-box">
            <div class="stat-icon-wrapper students">👥</div>
            <div>
              <div class="stat-val">${summary.totalCapacity || 0}</div>
              <div class="stat-lbl">Total Seat Capacity</div>
            </div>
          </div>
          <div class="stat-box">
            <div class="stat-icon-wrapper presenters">🎫</div>
            <div>
              <div class="stat-val">${summary.totalRegistrations || 0}</div>
              <div class="stat-lbl">Total Registrations</div>
            </div>
          </div>
          <div class="stat-box">
            <div class="stat-icon-wrapper attendance">📈</div>
            <div>
              <div class="stat-val">${summary.avgUtilization || 0}%</div>
              <div class="stat-lbl">Avg Utilization Rate</div>
            </div>
          </div>
        </div>

        <div class="card" style="padding: 0; overflow: hidden;">
          <div style="padding: 1.25rem 1.5rem; border-bottom: 1px solid var(--border); font-weight: 700; font-size: 1.1rem; color: var(--secondary);">
            Event Performance & Utilization Table
          </div>
          <div class="table-responsive">
            <table class="table">
              <thead>
                <tr>
                  <th>Event Title</th>
                  <th>Category</th>
                  <th>Date & Time</th>
                  <th>Venue</th>
                  <th>Presenter</th>
                  <th>Seats</th>
                  <th>Booked</th>
                  <th>Attended</th>
                  <th>Utilization</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                ${events.map(e => `
                  <tr>
                    <td><strong>${e.title}</strong></td>
                    <td><span class="badge badge-primary">${e.category}</span></td>
                    <td>${new Date(e.eventDate).toLocaleDateString()} <br><small style="color: var(--text-muted);">${e.startTime}</small></td>
                    <td>${e.venue}</td>
                    <td>${e.presenterName}</td>
                    <td>${e.capacity}</td>
                    <td><strong>${e.totalRegistrations}</strong></td>
                    <td><span style="color: var(--success); font-weight: 600;">${e.attendedCount}</span></td>
                    <td>
                      <div style="display: flex; align-items: center; gap: 0.5rem;">
                        <div class="capacity-bar" style="width: 60px;">
                          <div class="capacity-fill" style="width: ${e.utilizationPercentage}%;"></div>
                        </div>
                        <small style="font-weight: 600;">${e.utilizationPercentage}%</small>
                      </div>
                    </td>
                    <td><span class="badge badge-info">${e.status}</span></td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
        </div>
      `;
    } else if (this.activeTab === 'registrations') {
      const { totalCount, deptDistribution, registrations } = await this.fetchRegistrationReport();
      body.innerHTML = `
        <div class="card" style="margin-bottom: 1.5rem;">
          <h4 style="font-size: 1.05rem; margin-bottom: 0.75rem; color: var(--secondary);">Department Breakdown</h4>
          <div style="display: flex; gap: 1rem; flex-wrap: wrap;">
            ${Object.entries(deptDistribution).map(([dept, count]) => `
              <div style="background: var(--bg-alt); padding: 0.5rem 1rem; border-radius: var(--radius-md); font-size: 0.85rem;">
                <strong>${dept}:</strong> ${count} (${Math.round((count/Math.max(1, totalCount))*100)}%)
              </div>
            `).join('')}
          </div>
        </div>

        <div class="card" style="padding: 0; overflow: hidden;">
          <div class="table-responsive">
            <table class="table">
              <thead>
                <tr>
                  <th>Pass ID</th>
                  <th>Student Name</th>
                  <th>ID / Roll No</th>
                  <th>Department & Year</th>
                  <th>Registered Event</th>
                  <th>Event Date</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                ${registrations.map(r => `
                  <tr>
                    <td><code style="background: var(--primary-subtle); color: var(--primary); padding: 2px 6px; border-radius: 4px;">${r.ticketCode}</code></td>
                    <td><strong>${r.studentName}</strong><br><small style="color: var(--text-muted);">${r.studentEmail}</small></td>
                    <td>${r.studentId}</td>
                    <td>${r.department} • ${r.year}</td>
                    <td>${r.eventTitle}</td>
                    <td>${new Date(r.eventDate).toLocaleDateString()}</td>
                    <td>
                      <span class="badge ${r.registrationStatus === 'attended' ? 'badge-success' : r.registrationStatus === 'cancelled' ? 'badge-danger' : 'badge-primary'}">
                        ${r.registrationStatus}
                      </span>
                    </td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
        </div>
      `;
    } else if (this.activeTab === 'presenters') {
      const presenters = await this.fetchPresenterReport();
      body.innerHTML = `
        <div class="card" style="padding: 0; overflow: hidden;">
          <div class="table-responsive">
            <table class="table">
              <thead>
                <tr>
                  <th>Presenter Name</th>
                  <th>Designation</th>
                  <th>Department</th>
                  <th>Contact Info</th>
                  <th>Assigned Events</th>
                  <th>Total Registered Students</th>
                  <th>Total Attendees</th>
                </tr>
              </thead>
              <tbody>
                ${presenters.map(p => `
                  <tr>
                    <td><strong>${p.name}</strong></td>
                    <td>${p.designation}</td>
                    <td>${p.department}</td>
                    <td>${p.email}<br><small style="color: var(--text-muted);">${p.contact}</small></td>
                    <td><span class="badge badge-primary">${p.totalAssignedEvents} Events</span></td>
                    <td><strong>${p.totalStudentsReached}</strong> students</td>
                    <td><strong style="color: var(--success);">${p.totalAttendees}</strong> verified</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
        </div>
      `;
    } else if (this.activeTab === 'results') {
      const results = await this.fetchResultReport();
      body.innerHTML = `
        <div class="card" style="padding: 0; overflow: hidden;">
          <div class="table-responsive">
            <table class="table">
              <thead>
                <tr>
                  <th>Event</th>
                  <th>Position / Award</th>
                  <th>Student Name</th>
                  <th>Department</th>
                  <th>Score</th>
                  <th>Remarks</th>
                  <th>Certificate</th>
                </tr>
              </thead>
              <tbody>
                ${results.map(r => `
                  <tr>
                    <td><strong>${r.eventTitle}</strong></td>
                    <td><span class="badge badge-warning" style="font-weight: 700;">🏆 ${r.position}</span></td>
                    <td>${r.studentName} (${r.studentId})</td>
                    <td>${r.department}</td>
                    <td><strong>${r.score} / 100</strong></td>
                    <td>${r.remarks || '-'}</td>
                    <td>${r.certificateIssued ? '<span style="color: var(--success); font-weight: 600;">✓ Issued</span>' : 'Pending'}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
        </div>
      `;
    }
  }
};

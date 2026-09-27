// Role-Based Dashboards & Specialized Management Views

const Dashboard = {
  async render() {
    if (!Auth.isLoggedIn()) {
      window.location.hash = '#/login';
      return;
    }

    const user = Auth.getUser();
    if (user.role === 'admin') {
      await this.renderAdmin();
    } else if (user.role === 'presenter') {
      await this.renderPresenter();
    } else {
      await this.renderStudent();
    }
  },

  // ==========================================
  // 1. ADMIN DASHBOARD
  // ==========================================
  async renderAdmin() {
    const container = document.getElementById('view-container');
    if (!container) return;

    container.innerHTML = '<div style="text-align: center; padding: 4rem;"><div class="brand-icon" style="margin: 0 auto 1rem; animation: spin 1s infinite linear;">⚙️</div><p>Loading Administrator Dashboard...</p></div>';

    try {
      const statsRes = await API.get('/events/stats/overview');
      const stats = statsRes.stats || {};
      const user = Auth.getUser();

      container.innerHTML = `
        <div style="max-width: 1280px; margin: 0 auto;">
          <!-- Top Header -->
          <div class="page-header">
            <div>
              <div style="display: flex; align-items: center; gap: 0.5rem; margin-bottom: 0.25rem;">
                <span class="role-badge admin">ADMIN CONTROL PANEL</span>
              </div>
              <h1 class="page-title">Welcome back, ${user.name}</h1>
              <p class="page-subtitle">College Event Management System Overview & Operations</p>
            </div>
            <div style="display: flex; gap: 0.75rem; flex-wrap: wrap;">
              <button class="btn btn-primary" onclick="Dashboard.openAddEventModal()">+ Create New Event</button>
              <button class="btn btn-outline" onclick="Presenters.openAddModal()">+ Add Presenter</button>
              <a href="#/admin/reports" class="btn btn-outline">📊 View Reports</a>
            </div>
          </div>

          <!-- Metric Cards Bar -->
          <div class="stats-bar">
            <div class="stat-box">
              <div class="stat-icon-wrapper events">📅</div>
              <div>
                <div class="stat-val">${stats.totalEvents || 0}</div>
                <div class="stat-lbl">Total Events (${stats.upcomingEvents || 0} Upcoming)</div>
              </div>
            </div>
            <div class="stat-box">
              <div class="stat-icon-wrapper students">🎓</div>
              <div>
                <div class="stat-val">${stats.totalStudents || 0}</div>
                <div class="stat-lbl">Registered Students</div>
              </div>
            </div>
            <div class="stat-box">
              <div class="stat-icon-wrapper presenters">🎙️</div>
              <div>
                <div class="stat-val">${stats.totalPresenters || 0}</div>
                <div class="stat-lbl">Active Presenters</div>
              </div>
            </div>
            <div class="stat-box">
              <div class="stat-icon-wrapper attendance">🎫</div>
              <div>
                <div class="stat-val">${stats.totalRegistrations || 0}</div>
                <div class="stat-lbl">Total Bookings (${stats.totalAttended || 0} Attended)</div>
              </div>
            </div>
          </div>

          <!-- Quick Navigation Shortcuts -->
          <div style="display: flex; gap: 1rem; margin-bottom: 2rem; flex-wrap: wrap;">
            <a href="#/admin/events" class="btn btn-outline btn-sm">🛠️ Manage Events Directory</a>
            <a href="#/admin/presenters" class="btn btn-outline btn-sm">🎙️ Presenter Directory</a>
            <a href="#/admin/registrations" class="btn btn-outline btn-sm">📋 Registration & Attendance</a>
            <a href="#/admin/reports" class="btn btn-outline btn-sm">📈 Comprehensive Reports</a>
          </div>

          <!-- Grid: Recent Events & Recent Registrations -->
          <div class="grid-2">
            <!-- Left: Recent Events -->
            <div class="card" style="padding: 0; overflow: hidden;">
              <div style="padding: 1.25rem 1.5rem; border-bottom: 1px solid var(--border); display: flex; justify-content: space-between; align-items: center;">
                <h3 style="font-size: 1.15rem; color: var(--secondary);">Recent College Events</h3>
                <a href="#/admin/events" style="font-size: 0.85rem; font-weight: 600;">View All &rarr;</a>
              </div>
              <div class="table-responsive" style="border: none;">
                <table class="table">
                  <thead>
                    <tr>
                      <th>Event Title</th>
                      <th>Category</th>
                      <th>Date</th>
                      <th>Capacity</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    ${
                      (stats.recentEvents || []).map(e => `
                        <tr>
                          <td><strong>${e.title}</strong></td>
                          <td><span class="badge badge-primary">${e.category}</span></td>
                          <td>${new Date(e.eventDate).toLocaleDateString()}</td>
                          <td>${e.capacity}</td>
                          <td>
                            <div style="display: flex; gap: 0.35rem;">
                              <a href="#/events/${e._id}" class="btn btn-outline btn-sm" style="padding: 2px 6px;">👁️</a>
                              <button class="btn btn-outline btn-sm" style="padding: 2px 6px;" onclick="Dashboard.openEditEventModal('${e._id}')">✏️</button>
                            </div>
                          </td>
                        </tr>
                      `).join('')
                    }
                  </tbody>
                </table>
              </div>
            </div>

            <!-- Right: Recent Registrations -->
            <div class="card" style="padding: 0; overflow: hidden;">
              <div style="padding: 1.25rem 1.5rem; border-bottom: 1px solid var(--border); display: flex; justify-content: space-between; align-items: center;">
                <h3 style="font-size: 1.15rem; color: var(--secondary);">Live Student Registrations</h3>
                <a href="#/admin/registrations" style="font-size: 0.85rem; font-weight: 600;">Manage All &rarr;</a>
              </div>
              <div class="table-responsive" style="border: none;">
                <table class="table">
                  <thead>
                    <tr>
                      <th>Student</th>
                      <th>Event</th>
                      <th>Status</th>
                      <th>Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    ${
                      (stats.recentRegistrations || []).map(r => `
                        <tr>
                          <td><strong>${r.student?.user?.name || 'Student'}</strong></td>
                          <td>${r.event?.title || 'Event'}</td>
                          <td>
                            <span class="badge ${r.registrationStatus === 'attended' ? 'badge-success' : r.registrationStatus === 'cancelled' ? 'badge-danger' : 'badge-primary'}">
                              ${r.registrationStatus}
                            </span>
                          </td>
                          <td><small style="color: var(--text-muted);">${new Date(r.createdAt).toLocaleDateString()}</small></td>
                        </tr>
                      `).join('')
                    }
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      `;
    } catch (err) {
      container.innerHTML = `<div class="card" style="text-align: center; padding: 3rem; color: var(--danger);">Failed to load admin stats: ${err.message}</div>`;
    }
  },

  // ==========================================
  // 2. PRESENTER DASHBOARD
  // ==========================================
  async renderPresenter() {
    const container = document.getElementById('view-container');
    if (!container) return;

    container.innerHTML = '<div style="text-align: center; padding: 4rem;"><div class="brand-icon" style="margin: 0 auto 1rem; animation: spin 1s infinite linear;">⚙️</div><p>Loading Presenter Dashboard...</p></div>';

    try {
      const user = Auth.getUser();
      const events = await Presenters.fetchMyAssignedEvents();

      container.innerHTML = `
        <div style="max-width: 1280px; margin: 0 auto;">
          <div class="page-header">
            <div>
              <div style="display: flex; align-items: center; gap: 0.5rem; margin-bottom: 0.25rem;">
                <span class="role-badge presenter">EVENT COORDINATOR & PRESENTER PORTAL</span>
              </div>
              <h1 class="page-title">Welcome, ${user.name}</h1>
              <p class="page-subtitle">${user.profile?.designation || 'Presenter'} • ${user.profile?.department || 'Academics'}</p>
            </div>
            <div style="display: flex; gap: 0.75rem;">
              <button class="btn btn-primary" onclick="Dashboard.openAddEventModal()">+ Create Event</button>
            </div>
          </div>

          <div class="stats-bar">
            <div class="stat-box">
              <div class="stat-icon-wrapper events">📅</div>
              <div>
                <div class="stat-val">${events.length}</div>
                <div class="stat-lbl">My Assigned Events</div>
              </div>
            </div>
            <div class="stat-box">
              <div class="stat-icon-wrapper students">🎙️</div>
              <div>
                <div class="stat-val">${user.profile?.specialization || 'Leadership'}</div>
                <div class="stat-lbl">Specialization Area</div>
              </div>
            </div>
          </div>

          <div class="card" style="padding: 0; overflow: hidden; margin-bottom: 2rem;">
            <div style="padding: 1.25rem 1.5rem; border-bottom: 1px solid var(--border); font-weight: 700; font-size: 1.15rem; color: var(--secondary);">
              My Assigned Events Directory
            </div>
            <div class="table-responsive" style="border: none;">
              <table class="table">
                <thead>
                  <tr>
                    <th>Event Title</th>
                    <th>Category</th>
                    <th>Date & Time</th>
                    <th>Venue</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  ${
                    events.length === 0
                      ? '<tr><td colspan="6" style="text-align: center; padding: 2rem; color: var(--text-muted);">No events assigned yet.</td></tr>'
                      : events.map(e => `
                        <tr>
                          <td><strong>${e.title}</strong></td>
                          <td><span class="badge badge-primary">${e.category}</span></td>
                          <td>${new Date(e.eventDate).toLocaleDateString()} • ${e.startTime}</td>
                          <td>${e.venue}</td>
                          <td><span class="badge badge-info">${e.status}</span></td>
                          <td>
                            <div style="display: flex; gap: 0.5rem;">
                              <a href="#/events/${e._id}" class="btn btn-outline btn-sm">View</a>
                              <button class="btn btn-outline-primary btn-sm" onclick="Schedules.openAddModal('${e._id}')">+ Schedule</button>
                              <button class="btn btn-primary btn-sm" onclick="Results.openPublishModal('${e._id}')">🏆 Results</button>
                            </div>
                          </td>
                        </tr>
                      `).join('')
                  }
                </tbody>
              </table>
            </div>
          </div>
        </div>
      `;
    } catch (err) {
      container.innerHTML = `<div class="card" style="color: var(--danger); padding: 3rem;">Failed to load presenter dashboard: ${err.message}</div>`;
    }
  },

  // ==========================================
  // 3. STUDENT DASHBOARD
  // ==========================================
  async renderStudent() {
    const container = document.getElementById('view-container');
    if (!container) return;

    container.innerHTML = '<div style="text-align: center; padding: 4rem;"><div class="brand-icon" style="margin: 0 auto 1rem; animation: spin 1s infinite linear;">⚙️</div><p>Loading Student Dashboard...</p></div>';

    try {
      const user = Auth.getUser();
      const myRegistrations = await Registrations.fetchMyRegistrations();
      const myResults = await Results.fetchMyResults();

      const activeRegistrations = myRegistrations.filter(r => r.registrationStatus !== 'cancelled');
      const attendedCount = myRegistrations.filter(r => r.registrationStatus === 'attended').length;

      container.innerHTML = `
        <div style="max-width: 1280px; margin: 0 auto;">
          <div class="page-header">
            <div>
              <div style="display: flex; align-items: center; gap: 0.5rem; margin-bottom: 0.25rem;">
                <span class="role-badge student">STUDENT DASHBOARD</span>
              </div>
              <h1 class="page-title">Hello, ${user.name}!</h1>
              <p class="page-subtitle">ID: <strong>${user.profile?.studentId || 'STU-NEW'}</strong> • ${user.profile?.department || 'Engineering'} • ${user.profile?.year || 'Student'}</p>
            </div>
            <div>
              <a href="#/events" class="btn btn-primary">🔍 Browse More Events</a>
            </div>
          </div>

          <!-- Stats Bar -->
          <div class="stats-bar">
            <div class="stat-box">
              <div class="stat-icon-wrapper events">🎫</div>
              <div>
                <div class="stat-val">${activeRegistrations.length}</div>
                <div class="stat-lbl">Active Registrations</div>
              </div>
            </div>
            <div class="stat-box">
              <div class="stat-icon-wrapper students">✅</div>
              <div>
                <div class="stat-val">${attendedCount}</div>
                <div class="stat-lbl">Events Attended</div>
              </div>
            </div>
            <div class="stat-box">
              <div class="stat-icon-wrapper attendance">🏆</div>
              <div>
                <div class="stat-val">${myResults.length}</div>
                <div class="stat-lbl">Achievements & Awards</div>
              </div>
            </div>
          </div>

          <!-- Section: Registered Event Passes -->
          <div style="margin-bottom: 3rem;">
            <h3 style="font-size: 1.35rem; color: var(--secondary); margin-bottom: 1.25rem;">🎟️ My Event Passes & Registrations</h3>
            
            ${
              activeRegistrations.length === 0
                ? `
                  <div class="card" style="text-align: center; padding: 3rem;">
                    <p style="color: var(--text-muted); margin-bottom: 1rem;">You have not registered for any upcoming events yet.</p>
                    <a href="#/events" class="btn btn-primary btn-sm">Explore Upcoming Events</a>
                  </div>
                `
                : `
                  <div class="grid-2">
                    ${activeRegistrations.map(r => `
                      <div class="ticket-card">
                        <div class="ticket-details">
                          <div style="display: flex; align-items: center; gap: 0.5rem; margin-bottom: 0.5rem;">
                            <span class="badge badge-primary">${r.event?.category || 'Event'}</span>
                            <span class="badge ${r.paymentAmount > 0 ? 'badge-success' : 'badge-info'}" style="font-size: 0.75rem;">
                              ${r.paymentAmount > 0 ? `💳 Paid ₹${r.paymentAmount}` : '🆓 Free'}
                            </span>
                          </div>
                          <h4>${r.event?.title || 'College Event'}</h4>
                          <div style="font-size: 0.85rem; color: var(--text-muted); margin-bottom: 0.75rem;">
                            📅 ${new Date(r.event?.eventDate).toLocaleDateString()} • 📍 ${r.event?.venue}
                          </div>
                          <div>Pass ID: <span class="ticket-code">${r.qrCodeToken}</span></div>
                        </div>
                        <div style="display: flex; flex-direction: column; gap: 0.5rem; align-items: flex-end;">
                          <button class="btn btn-outline-primary btn-sm" onclick='Registrations.viewReceipt(${JSON.stringify(r).replace(/'/g, "&apos;")})'>🧾 Receipt</button>
                          <a href="#/events/${r.event?._id}" class="btn btn-outline btn-sm">Details</a>
                          <button class="btn btn-danger btn-sm" onclick="Registrations.cancel('${r._id}')">Cancel</button>
                        </div>
                      </div>
                    `).join('')}
                  </div>
                `
            }
          </div>

          <!-- Section: Results & Awards -->
          ${
            myResults.length > 0
              ? `
                <div style="margin-bottom: 3rem;">
                  <h3 style="font-size: 1.35rem; color: var(--secondary); margin-bottom: 1.25rem;">🏆 My Results & Certificates</h3>
                  <div class="card" style="padding: 0; overflow: hidden;">
                    <div class="table-responsive">
                      <table class="table">
                        <thead>
                          <tr>
                            <th>Event</th>
                            <th>Position / Award</th>
                            <th>Score</th>
                            <th>Remarks</th>
                            <th>Certificate</th>
                          </tr>
                        </thead>
                        <tbody>
                          ${myResults.map(res => `
                            <tr>
                              <td><strong>${res.event?.title || 'Event'}</strong></td>
                              <td><span class="badge badge-warning" style="font-weight: 700;">${res.position}</span></td>
                              <td><strong>${res.score} pts</strong></td>
                              <td>${res.remarks || 'Great performance!'}</td>
                              <td><span class="badge badge-success">✓ Certificate Valid</span></td>
                            </tr>
                          `).join('')}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              `
              : ''
          }
        </div>
      `;
    } catch (err) {
      container.innerHTML = `<div class="card" style="color: var(--danger); padding: 3rem;">Failed to load student dashboard: ${err.message}</div>`;
    }
  },

  // ==========================================
  // 4. ADMIN: MANAGE EVENTS DIRECTORY
  // ==========================================
  async renderManageEvents() {
    const container = document.getElementById('view-container');
    if (!container) return;

    const events = await Events.fetchAll({ category: 'All', status: 'All' });

    container.innerHTML = `
      <div style="max-width: 1280px; margin: 0 auto;">
        <div class="page-header">
          <div>
            <h1 class="page-title">🛠️ Manage College Events</h1>
            <p class="page-subtitle">Add, edit, publish results, manage schedules, and delete events</p>
          </div>
          <div>
            <button class="btn btn-primary" onclick="Dashboard.openAddEventModal()">+ Add New Event</button>
          </div>
        </div>

        <div class="card" style="padding: 0; overflow: hidden;">
          <div class="table-responsive">
            <table class="table">
              <thead>
                <tr>
                  <th>Event Title</th>
                  <th>Category</th>
                  <th>Date & Time</th>
                  <th>Venue</th>
                  <th>Capacity</th>
                  <th>Presenter</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                ${events.map(e => `
                  <tr>
                    <td><strong>${e.title}</strong></td>
                    <td><span class="badge badge-primary">${e.category}</span></td>
                    <td>${new Date(e.eventDate).toLocaleDateString()}<br><small style="color: var(--text-muted);">${e.startTime}</small></td>
                    <td>${e.venue}</td>
                    <td>${e.registeredCount || 0} / ${e.capacity}</td>
                    <td>${e.presenter?.user?.name || '<span style="color: var(--text-muted)">Unassigned</span>'}</td>
                    <td><span class="badge badge-info">${e.status}</span></td>
                    <td>
                      <div style="display: flex; gap: 0.35rem; flex-wrap: wrap;">
                        <a href="#/events/${e._id}" class="btn btn-outline btn-sm" title="View">👁️</a>
                        <button class="btn btn-outline btn-sm" onclick="Dashboard.openEditEventModal('${e._id}')" title="Edit">✏️</button>
                        <button class="btn btn-outline-primary btn-sm" onclick="Schedules.openAddModal('${e._id}')" title="Add Schedule">📅</button>
                        <button class="btn btn-outline btn-sm" onclick="Results.openPublishModal('${e._id}')" title="Publish Results">🏆</button>
                        <button class="btn btn-danger btn-sm" onclick="Dashboard.handleDeleteEvent('${e._id}')" title="Delete">🗑️</button>
                      </div>
                    </td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    `;
  },

  async handleDeleteEvent(id) {
    const ok = await Events.delete(id);
    if (ok) this.renderManageEvents();
  },

  // ==========================================
  // 5. ADMIN: MANAGE PRESENTERS
  // ==========================================
  async renderManagePresenters() {
    const container = document.getElementById('view-container');
    if (!container) return;

    const presenters = await Presenters.fetchAll();

    container.innerHTML = `
      <div style="max-width: 1280px; margin: 0 auto;">
        <div class="page-header">
          <div>
            <h1 class="page-title">🎙️ Presenter & Coordinator Directory</h1>
            <p class="page-subtitle">Manage guest speakers, faculty coordinators, and event mentors</p>
          </div>
          <div>
            <button class="btn btn-primary" onclick="Presenters.openAddModal()">+ Add Presenter</button>
          </div>
        </div>

        <div id="presenters-grid" class="grid-3"></div>
      </div>
    `;

    Presenters.renderCards(presenters, 'presenters-grid');
  },

  // ==========================================
  // 6. ADMIN: REGISTRATION MANAGEMENT
  // ==========================================
  async renderRegistrationManagement() {
    const container = document.getElementById('view-container');
    if (!container) return;

    const registrations = await Registrations.fetchAll();

    container.innerHTML = `
      <div style="max-width: 1280px; margin: 0 auto;">
        <div class="page-header">
          <div>
            <h1 class="page-title">📋 Student Registrations & Attendance</h1>
            <p class="page-subtitle">Verify passes, mark attendance, and manage student bookings</p>
          </div>
          <div>
            <button class="btn btn-primary" onclick="Reports.exportCSV('registrations')">📥 Export Registrations CSV</button>
          </div>
        </div>

        <div class="card" style="padding: 0; overflow: hidden;">
          <div class="table-responsive">
            <table class="table">
              <thead>
                <tr>
                  <th>Pass Code</th>
                  <th>Student Name</th>
                  <th>Student ID</th>
                  <th>Event</th>
                  <th>Date</th>
                  <th>Status</th>
                  <th>Attendance Action</th>
                  <th>Cancel</th>
                </tr>
              </thead>
              <tbody>
                ${registrations.map(r => `
                  <tr>
                    <td><code style="background: var(--primary-subtle); color: var(--primary); padding: 3px 6px; border-radius: 4px; font-weight: bold;">${r.qrCodeToken}</code></td>
                    <td><strong>${r.student?.user?.name || 'Student'}</strong><br><small style="color: var(--text-muted);">${r.student?.user?.email || ''}</small></td>
                    <td>${r.student?.studentId || 'N/A'}</td>
                    <td>${r.event?.title || 'Event'}</td>
                    <td>${r.event?.eventDate ? new Date(r.event.eventDate).toLocaleDateString() : ''}</td>
                    <td>
                      <span class="badge ${r.registrationStatus === 'attended' ? 'badge-success' : r.registrationStatus === 'cancelled' ? 'badge-danger' : 'badge-primary'}">
                        ${r.registrationStatus}
                      </span>
                    </td>
                    <td>
                      ${
                        r.registrationStatus !== 'cancelled'
                          ? `
                            <button class="btn ${r.attended ? 'btn-success' : 'btn-outline'} btn-sm" onclick="Registrations.updateAttendance('${r._id}', '${r.attended ? 'registered' : 'attended'}', ${!r.attended})">
                              ${r.attended ? '✓ Attended' : 'Mark Attended'}
                            </button>
                          `
                          : '<span style="color: var(--text-muted); font-size: 0.8rem;">Cancelled</span>'
                      }
                    </td>
                    <td>
                      ${r.registrationStatus !== 'cancelled' ? `<button class="btn btn-danger btn-sm" style="padding: 2px 6px;" onclick="Registrations.cancel('${r._id}')">✕</button>` : '-'}
                    </td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    `;
  },

  // ==========================================
  // 7. EVENT MODALS (ADD & EDIT)
  // ==========================================
  async openAddEventModal() {
    const modalBody = document.getElementById('app-modal-body');
    const modalTitle = document.getElementById('app-modal-title');
    if (!modalBody || !modalTitle) return;

    modalTitle.textContent = 'Create New College Event';

    const presenters = await Presenters.fetchAll();

    modalBody.innerHTML = `
      <form id="event-form" onsubmit="Dashboard.submitEventForm(event)">
        <div class="form-group">
          <label class="form-label">Event Title *</label>
          <input type="text" id="ev-title" class="form-control" required placeholder="e.g. AI & Cloud Architecture Summit 2026" />
        </div>

        <div class="grid-2">
          <div class="form-group">
            <label class="form-label">Category *</label>
            <select id="ev-category" class="form-select" required>
              <option value="Technical">Technical</option>
              <option value="Workshop">Workshop</option>
              <option value="Seminar">Seminar</option>
              <option value="Hackathon">Hackathon</option>
              <option value="Cultural">Cultural</option>
              <option value="Sports">Sports</option>
              <option value="Management">Management</option>
              <option value="Other">Other</option>
            </select>
          </div>
          <div class="form-group">
            <label class="form-label">Presenter / Lead Coordinator</label>
            <select id="ev-presenter" class="form-select">
              <option value="">-- Select Presenter --</option>
              ${presenters.map(p => `<option value="${p._id}">${p.user?.name || 'Presenter'} (${p.department})</option>`).join('')}
            </select>
          </div>
        </div>

        <div class="grid-2">
          <div class="form-group">
            <label class="form-label">Event Date *</label>
            <input type="date" id="ev-date" class="form-control" required />
          </div>
          <div class="form-group">
            <label class="form-label">Max Student Capacity *</label>
            <input type="number" id="ev-capacity" class="form-control" min="1" max="1000" value="60" required />
          </div>
        </div>

        <div class="grid-2">
          <div class="form-group">
            <label class="form-label">Start Time *</label>
            <input type="text" id="ev-start" class="form-control" placeholder="09:30 AM" required />
          </div>
          <div class="form-group">
            <label class="form-label">End Time *</label>
            <input type="text" id="ev-end" class="form-control" placeholder="04:30 PM" required />
          </div>
        </div>

        <div class="grid-2">
          <div class="form-group">
            <label class="form-label">Registration Fee (₹ INR) *</label>
            <input type="number" id="ev-fee" class="form-control" min="0" value="0" placeholder="e.g. 499 for Hackathons, 299 for Workshops, 0 for Free" required />
          </div>
          <div class="form-group">
            <label class="form-label">College Payment UPI ID</label>
            <input type="text" id="ev-upi" class="form-control" value="college.events@upi" placeholder="college.events@upi" />
          </div>
        </div>

        <div class="form-group">
          <label class="form-label">Venue Location *</label>
          <input type="text" id="ev-venue" class="form-control" required placeholder="e.g. Main Auditorium / Lab 304" />
        </div>

        <div class="form-group">
          <label class="form-label">Event Description *</label>
          <textarea id="ev-desc" class="form-textarea" required placeholder="Comprehensive details about the event, agenda, prerequisites..."></textarea>
        </div>

        <div class="form-group">
          <label class="form-label">Cover Image URL (Optional)</label>
          <input type="url" id="ev-image" class="form-control" placeholder="https://images.unsplash.com/..." />
        </div>

        <div style="display: flex; justify-content: flex-end; gap: 0.75rem; margin-top: 1.5rem;">
          <button type="button" class="btn btn-outline" onclick="App.closeModal()">Cancel</button>
          <button type="submit" class="btn btn-primary">Create Event</button>
        </div>
      </form>
    `;

    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 7);
    document.getElementById('ev-date').value = tomorrow.toISOString().split('T')[0];

    App.openModal();
  },

  async openEditEventModal(eventId) {
    const modalBody = document.getElementById('app-modal-body');
    const modalTitle = document.getElementById('app-modal-title');
    if (!modalBody || !modalTitle) return;

    modalTitle.textContent = 'Edit College Event';

    const ev = await Events.fetchById(eventId);
    const presenters = await Presenters.fetchAll();

    modalBody.innerHTML = `
      <form id="edit-event-form" onsubmit="Dashboard.submitEditEventForm(event, '${eventId}')">
        <div class="form-group">
          <label class="form-label">Event Title *</label>
          <input type="text" id="edit-ev-title" class="form-control" required value="${ev.title}" />
        </div>

        <div class="grid-2">
          <div class="form-group">
            <label class="form-label">Category *</label>
            <select id="edit-ev-category" class="form-select" required>
              <option value="Technical" ${ev.category === 'Technical' ? 'selected' : ''}>Technical</option>
              <option value="Workshop" ${ev.category === 'Workshop' ? 'selected' : ''}>Workshop</option>
              <option value="Seminar" ${ev.category === 'Seminar' ? 'selected' : ''}>Seminar</option>
              <option value="Hackathon" ${ev.category === 'Hackathon' ? 'selected' : ''}>Hackathon</option>
              <option value="Cultural" ${ev.category === 'Cultural' ? 'selected' : ''}>Cultural</option>
              <option value="Sports" ${ev.category === 'Sports' ? 'selected' : ''}>Sports</option>
              <option value="Management" ${ev.category === 'Management' ? 'selected' : ''}>Management</option>
              <option value="Other" ${ev.category === 'Other' ? 'selected' : ''}>Other</option>
            </select>
          </div>
          <div class="form-group">
            <label class="form-label">Presenter / Lead</label>
            <select id="edit-ev-presenter" class="form-select">
              <option value="">-- Select Presenter --</option>
              ${presenters.map(p => `<option value="${p._id}" ${ev.presenter?._id === p._id ? 'selected' : ''}>${p.user?.name || 'Presenter'} (${p.department})</option>`).join('')}
            </select>
          </div>
        </div>

        <div class="grid-2">
          <div class="form-group">
            <label class="form-label">Event Date *</label>
            <input type="date" id="edit-ev-date" class="form-control" required value="${new Date(ev.eventDate).toISOString().split('T')[0]}" />
          </div>
          <div class="form-group">
            <label class="form-label">Capacity *</label>
            <input type="number" id="edit-ev-capacity" class="form-control" min="1" max="1000" required value="${ev.capacity}" />
          </div>
        </div>

        <div class="grid-2">
          <div class="form-group">
            <label class="form-label">Start Time *</label>
            <input type="text" id="edit-ev-start" class="form-control" required value="${ev.startTime}" />
          </div>
          <div class="form-group">
            <label class="form-label">End Time *</label>
            <input type="text" id="edit-ev-end" class="form-control" required value="${ev.endTime}" />
          </div>
        </div>

        <div class="grid-2">
          <div class="form-group">
            <label class="form-label">Registration Fee (₹ INR) *</label>
            <input type="number" id="edit-ev-fee" class="form-control" min="0" value="${ev.registrationFee || 0}" required />
          </div>
          <div class="form-group">
            <label class="form-label">UPI ID for QR Payments</label>
            <input type="text" id="edit-ev-upi" class="form-control" value="${ev.upiId || 'college.events@upi'}" />
          </div>
        </div>

        <div class="grid-2">
          <div class="form-group">
            <label class="form-label">Venue Location *</label>
            <input type="text" id="edit-ev-venue" class="form-control" required value="${ev.venue}" />
          </div>
          <div class="form-group">
            <label class="form-label">Status *</label>
            <select id="edit-ev-status" class="form-select">
              <option value="upcoming" ${ev.status === 'upcoming' ? 'selected' : ''}>Upcoming</option>
              <option value="ongoing" ${ev.status === 'ongoing' ? 'selected' : ''}>Ongoing</option>
              <option value="completed" ${ev.status === 'completed' ? 'selected' : ''}>Completed</option>
              <option value="cancelled" ${ev.status === 'cancelled' ? 'selected' : ''}>Cancelled</option>
            </select>
          </div>
        </div>

        <div class="form-group">
          <label class="form-label">Event Description *</label>
          <textarea id="edit-ev-desc" class="form-textarea" required>${ev.description}</textarea>
        </div>

        <div style="display: flex; justify-content: flex-end; gap: 0.75rem; margin-top: 1.5rem;">
          <button type="button" class="btn btn-outline" onclick="App.closeModal()">Cancel</button>
          <button type="submit" class="btn btn-primary">Save Changes</button>
        </div>
      </form>
    `;

    App.openModal();
  },

  async submitEventForm(e) {
    e.preventDefault();
    const fee = Number(document.getElementById('ev-fee').value) || 0;
    const payload = {
      title: document.getElementById('ev-title').value,
      category: document.getElementById('ev-category').value,
      presenter: document.getElementById('ev-presenter').value || null,
      eventDate: document.getElementById('ev-date').value,
      capacity: Number(document.getElementById('ev-capacity').value),
      startTime: document.getElementById('ev-start').value,
      endTime: document.getElementById('ev-end').value,
      venue: document.getElementById('ev-venue').value,
      registrationFee: fee,
      isPaid: fee > 0,
      upiId: document.getElementById('ev-upi').value || 'college.events@upi',
      description: document.getElementById('ev-desc').value,
      image: document.getElementById('ev-image').value || 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=800'
    };

    try {
      await Events.create(payload);
      App.closeModal();
      if (window.location.hash === '#/admin/events') {
        Dashboard.renderManageEvents();
      } else {
        Dashboard.render();
      }
    } catch (err) {
      App.showToast(err.message, 'error');
    }
  },

  async submitEditEventForm(e, id) {
    e.preventDefault();
    const fee = Number(document.getElementById('edit-ev-fee').value) || 0;
    const payload = {
      title: document.getElementById('edit-ev-title').value,
      category: document.getElementById('edit-ev-category').value,
      presenter: document.getElementById('edit-ev-presenter').value || null,
      eventDate: document.getElementById('edit-ev-date').value,
      capacity: Number(document.getElementById('edit-ev-capacity').value),
      startTime: document.getElementById('edit-ev-start').value,
      endTime: document.getElementById('edit-ev-end').value,
      venue: document.getElementById('edit-ev-venue').value,
      registrationFee: fee,
      isPaid: fee > 0,
      upiId: document.getElementById('edit-ev-upi').value || 'college.events@upi',
      status: document.getElementById('edit-ev-status').value,
      description: document.getElementById('edit-ev-desc').value
    };

    try {
      await Events.update(id, payload);
      App.closeModal();
      if (window.location.hash === '#/admin/events') {
        Dashboard.renderManageEvents();
      } else if (window.location.hash.startsWith('#/events/')) {
        Events.renderDetailPage(id);
      } else {
        Dashboard.render();
      }
    } catch (err) {
      App.showToast(err.message, 'error');
    }
  }
};

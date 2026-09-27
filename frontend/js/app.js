// Main Single-Page Application Router & View Orchestrator

const App = {
  async init() {
    window.addEventListener('hashchange', () => this.route());
    this.updateNav();
    this.route();
    if (Auth.isLoggedIn()) {
      Notifications.fetch();
      // Polling notification check every 30s
      setInterval(() => Notifications.fetch(), 30000);
    }
  },

  updateNav() {
    const user = Auth.getUser();
    const navMenu = document.getElementById('nav-menu');
    const navActions = document.getElementById('nav-actions');

    if (!navMenu || !navActions) return;

    if (Auth.isLoggedIn()) {
      navActions.innerHTML = `
        <!-- Notification Bell -->
        <div style="position: relative;">
          <button class="notif-bell-btn" onclick="Notifications.toggleDropdown()" title="Notifications">
            🔔
            <span id="notif-badge" class="notif-badge" style="display: none;">0</span>
          </button>
          <div id="notif-dropdown" class="notif-dropdown">
            <div class="notif-header">
              <span>Notifications</span>
              <button style="background: none; border: none; color: var(--primary); font-size: 0.8rem; cursor: pointer;" onclick="Notifications.markAllRead()">Mark all read</button>
            </div>
            <div id="notif-list" class="notif-list"></div>
          </div>
        </div>

        <!-- User Dropdown -->
        <div class="user-menu">
          <button class="user-btn" onclick="App.toggleUserDropdown()">
            <div class="user-avatar-badge">${user.name.charAt(0).toUpperCase()}</div>
            <span>${user.name.split(' ')[0]}</span>
            <span class="role-badge ${user.role}">${user.role}</span>
            <span style="font-size: 0.75rem;">▼</span>
          </button>
          <div id="user-dropdown-card" class="dropdown-card">
            <div style="padding: 0.5rem 0.8rem; font-size: 0.85rem; color: var(--text-muted); border-bottom: 1px solid var(--border); margin-bottom: 0.35rem;">
              Signed in as <br><strong style="color: var(--secondary);">${user.email}</strong>
            </div>
            <a href="#/dashboard" class="dropdown-item">📊 My Dashboard</a>
            <a href="#/profile" class="dropdown-item">⚙️ Profile Settings</a>
            ${user.role === 'admin' ? `
              <div class="dropdown-divider"></div>
              <a href="#/admin/events" class="dropdown-item">🛠️ Manage Events</a>
              <a href="#/admin/presenters" class="dropdown-item">🎙️ Manage Presenters</a>
              <a href="#/admin/registrations" class="dropdown-item">📋 Registrations</a>
              <a href="#/admin/reports" class="dropdown-item">📈 System Reports</a>
            ` : ''}
            <div class="dropdown-divider"></div>
            <button class="dropdown-item" style="color: var(--danger);" onclick="Auth.logout()">🚪 Sign Out</button>
          </div>
        </div>
      `;
    } else {
      navActions.innerHTML = `
        <a href="#/login" class="btn btn-outline btn-sm">Login</a>
        <a href="#/register" class="btn btn-primary btn-sm">Register</a>
      `;
    }
  },

  toggleUserDropdown() {
    const el = document.getElementById('user-dropdown-card');
    if (el) el.classList.toggle('show');
  },

  toggleMobileNav() {
    const el = document.getElementById('nav-menu');
    if (el) el.classList.toggle('show');
  },

  showToast(message, type = 'info') {
    const container = document.getElementById('toast-container');
    if (!container) return;

    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    const icon = type === 'success' ? '✅' : type === 'error' ? '❌' : type === 'warning' ? '⚠️' : 'ℹ️';
    toast.innerHTML = `<span>${icon}</span> <span>${message}</span>`;

    container.appendChild(toast);
    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateX(100%)';
      setTimeout(() => toast.remove(), 300);
    }, 3500);
  },

  openModal() {
    const modal = document.getElementById('app-modal');
    if (modal) modal.classList.add('show');
  },

  closeModal() {
    const modal = document.getElementById('app-modal');
    if (modal) modal.classList.remove('show');
  },

  // Client-Side Routing
  async route() {
    // Close any open dropdowns
    const uDd = document.getElementById('user-dropdown-card');
    if (uDd) uDd.classList.remove('show');
    const nDd = document.getElementById('notif-dropdown');
    if (nDd) nDd.classList.remove('show');

    const hash = window.location.hash || '#/';
    const [routePath, queryString] = hash.split('?');

    // Update active navbar link
    document.querySelectorAll('.nav-link').forEach(link => {
      const linkHash = link.getAttribute('href');
      if (linkHash === routePath || (routePath.startsWith(linkHash) && linkHash !== '#/')) {
        link.classList.add('active');
      } else {
        link.classList.remove('active');
      }
    });

    // Route Table
    if (routePath === '#/' || routePath === '#/home') {
      await this.renderHome();
    } else if (routePath === '#/about') {
      this.renderAbout();
    } else if (routePath === '#/events') {
      await this.renderEvents(queryString);
    } else if (routePath.startsWith('#/events/')) {
      const eventId = routePath.replace('#/events/', '');
      await Events.renderDetailPage(eventId);
    } else if (routePath === '#/login') {
      this.renderLogin();
    } else if (routePath === '#/register') {
      this.renderRegister();
    } else if (routePath === '#/dashboard') {
      await Dashboard.render();
    } else if (routePath === '#/admin/events') {
      if (!Auth.hasRole('admin')) { window.location.hash = '#/login'; return; }
      await Dashboard.renderManageEvents();
    } else if (routePath === '#/admin/presenters') {
      if (!Auth.hasRole('admin')) { window.location.hash = '#/login'; return; }
      await Dashboard.renderManagePresenters();
    } else if (routePath === '#/admin/registrations') {
      if (!Auth.hasRole('admin', 'presenter')) { window.location.hash = '#/login'; return; }
      await Dashboard.renderRegistrationManagement();
    } else if (routePath === '#/admin/reports') {
      if (!Auth.hasRole('admin', 'presenter')) { window.location.hash = '#/login'; return; }
      await Reports.renderReportsView();
    } else if (routePath === '#/profile') {
      await this.renderProfile();
    } else {
      this.render404();
    }

    window.scrollTo(0, 0);
  },

  // ==========================================
  // PAGE RENDERERS
  // ==========================================

  // 1. Home Page
  async renderHome() {
    const container = document.getElementById('view-container');
    if (!container) return;

    container.innerHTML = `
      <div>
        <!-- Hero Section -->
        <section class="hero-section">
          <div class="hero-glow"></div>
          <div class="hero-content">
            <div class="hero-pill">
              <span>🏛️ Campus Premier Event Platform</span>
            </div>
            <h1 class="hero-title">
              Empowering Campus Innovation, <span>Events</span> & Presenters.
            </h1>
            <p class="hero-description">
              Streamlining collegiate hackathons, technical workshops, cultural symposiums, presenter assignments, live session schedules, student seat allocations, and verified certifications.
            </p>
            <div class="hero-actions">
              <a href="#/events" class="btn btn-primary btn-lg">Explore All Events</a>
              ${
                !Auth.isLoggedIn()
                  ? '<a href="#/register" class="btn btn-outline btn-lg" style="color: white; border-color: rgba(255,255,255,0.4);">Student Registration</a>'
                  : '<a href="#/dashboard" class="btn btn-outline btn-lg" style="color: white; border-color: rgba(255,255,255,0.4);">Go to Dashboard</a>'
              }
            </div>
          </div>
        </section>

        <!-- Stats Counter Bar -->
        <div id="home-stats-bar" class="stats-bar">
          <div class="stat-box">
            <div class="stat-icon-wrapper events">📅</div>
            <div>
              <div class="stat-val" id="stat-total-events">5+</div>
              <div class="stat-lbl">Active Events</div>
            </div>
          </div>
          <div class="stat-box">
            <div class="stat-icon-wrapper students">👥</div>
            <div>
              <div class="stat-val" id="stat-total-students">150+</div>
              <div class="stat-lbl">Student Participants</div>
            </div>
          </div>
          <div class="stat-box">
            <div class="stat-icon-wrapper presenters">🎙️</div>
            <div>
              <div class="stat-val" id="stat-total-presenters">10+</div>
              <div class="stat-lbl">Expert Presenters</div>
            </div>
          </div>
          <div class="stat-box">
            <div class="stat-icon-wrapper attendance">🏆</div>
            <div>
              <div class="stat-val" id="stat-total-results">100%</div>
              <div class="stat-lbl">Verified Results</div>
            </div>
          </div>
        </div>

        <!-- Section: Featured & Upcoming Events -->
        <div style="margin-bottom: 3.5rem;">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem; flex-wrap: wrap; gap: 1rem;">
            <div>
              <h2 style="font-size: 1.65rem; color: var(--secondary); font-weight: 700;">Featured Upcoming Events</h2>
              <p style="color: var(--text-muted); font-size: 0.95rem;">Join workshops, national hackathons, and guest lectures</p>
            </div>
            <a href="#/events" class="btn btn-outline-primary">View All Events &rarr;</a>
          </div>

          <div id="featured-events-grid" class="grid-3">
            <div style="text-align: center; grid-column: 1 / -1; padding: 2rem;"><p>Loading events...</p></div>
          </div>
        </div>

        <!-- Section: Platform Capabilities -->
        <div style="margin-bottom: 3rem;">
          <div style="text-align: center; max-width: 650px; margin: 0 auto 2.5rem;">
            <h2 style="font-size: 1.75rem; color: var(--secondary); font-weight: 800; margin-bottom: 0.5rem;">Built for the Modern University</h2>
            <p style="color: var(--text-muted);">A cohesive ecosystem connecting administrators, speakers, and enthusiastic student participants.</p>
          </div>

          <div class="grid-3">
            <div class="card" style="text-align: center; padding: 2rem;">
              <div style="font-size: 2.5rem; margin-bottom: 1rem;">🛡️</div>
              <h3 style="font-size: 1.15rem; color: var(--secondary); margin-bottom: 0.5rem;">Role-Based Dashboards</h3>
              <p style="color: var(--text-muted); font-size: 0.9rem;">Tailored workflows for Admins, Presenters/Coordinators, and Students with security-first JWT authorization.</p>
            </div>

            <div class="card" style="text-align: center; padding: 2rem;">
              <div style="font-size: 2.5rem; margin-bottom: 1rem;">⚡</div>
              <h3 style="font-size: 1.15rem; color: var(--secondary); margin-bottom: 0.5rem;">Automated Seat Allocations</h3>
              <p style="color: var(--text-muted); font-size: 0.9rem;">Instant ticket generation, duplicate prevention, and real-time capacity monitoring powered by MongoDB.</p>
            </div>

            <div class="card" style="text-align: center; padding: 2rem;">
              <div style="font-size: 2.5rem; margin-bottom: 1rem;">📊</div>
              <h3 style="font-size: 1.15rem; color: var(--secondary); margin-bottom: 0.5rem;">Live Schedules & Results</h3>
              <p style="color: var(--text-muted); font-size: 0.9rem;">Multi-session timeline agendas, podium leaderboards, digital certificates, and CSV analytics exports.</p>
            </div>
          </div>
        </div>
      </div>
    `;

    // Load Events into Home Grid
    try {
      const events = await Events.fetchAll({ status: 'upcoming' });
      Events.renderCards(events.slice(0, 3), 'featured-events-grid');
    } catch (e) {
      console.error(e);
    }
  },

  // 2. About Page
  renderAbout() {
    const container = document.getElementById('view-container');
    if (!container) return;

    container.innerHTML = `
      <div style="max-width: 900px; margin: 0 auto;">
        <div class="page-header" style="text-align: center; display: block; margin-bottom: 3rem;">
          <span class="badge badge-primary" style="margin-bottom: 0.75rem;">ABOUT OUR PLATFORM</span>
          <h1 class="page-title" style="font-size: 2.25rem;">College Event Presenter Management System</h1>
          <p class="page-subtitle" style="font-size: 1.05rem; max-width: 650px; margin: 0.5rem auto 0;">
            A next-generation platform engineered to manage the lifecycle of university events, workshops, hackathons, and speaker sessions.
          </p>
        </div>

        <div class="card" style="margin-bottom: 2rem;">
          <h3 style="font-size: 1.25rem; color: var(--secondary); margin-bottom: 1rem;">🎯 Project Objectives</h3>
          <ul style="padding-left: 1.5rem; color: var(--text-main); display: flex; flex-direction: column; gap: 0.5rem; font-size: 0.95rem;">
            <li>Eliminate manual paperwork and duplicate registrations across campus events.</li>
            <li>Provide event presenters with dedicated portals to manage session schedules, view attendee rosters, and evaluate winners.</li>
            <li>Give students frictionless 1-click registration, instant ticket codes, schedule tracking, and verifiable awards.</li>
            <li>Enable administrators with real-time capacity monitoring, automated notifications, and exportable audit reports.</li>
          </ul>
        </div>

        <div class="card" style="margin-bottom: 2rem;">
          <h3 style="font-size: 1.25rem; color: var(--secondary); margin-bottom: 1rem;">🏛️ Campus Venues & Facilities</h3>
          <div class="grid-3" style="margin-top: 1rem;">
            <div style="background: var(--bg-alt); padding: 1rem; border-radius: var(--radius-md);">
              <strong>Main Tech Auditorium</strong>
              <div style="font-size: 0.85rem; color: var(--text-muted); margin-top: 0.25rem;">Capacity: 500 Seats • Dolby Audio & Projectors</div>
            </div>
            <div style="background: var(--bg-alt); padding: 1rem; border-radius: var(--radius-md);">
              <strong>Computing Complex (Lab 1-4)</strong>
              <div style="font-size: 0.85rem; color: var(--text-muted); margin-top: 0.25rem;">High-Speed Gig-Ethernet • Dual Monitors</div>
            </div>
            <div style="background: var(--bg-alt); padding: 1rem; border-radius: var(--radius-md);">
              <strong>Design & Innovation Studio</strong>
              <div style="font-size: 0.85rem; color: var(--text-muted); margin-top: 0.25rem;">Interactive Smartboards • Prototyping Kits</div>
            </div>
          </div>
        </div>

        <div class="card">
          <h3 style="font-size: 1.25rem; color: var(--secondary); margin-bottom: 1rem;">💡 Technology Stack Overview</h3>
          <div style="display: flex; gap: 0.5rem; flex-wrap: wrap;">
            <span class="badge badge-primary">Node.js</span>
            <span class="badge badge-primary">Express.js</span>
            <span class="badge badge-primary">MongoDB & Mongoose</span>
            <span class="badge badge-primary">JWT Authentication</span>
            <span class="badge badge-primary">bcrypt Password Hashing</span>
            <span class="badge badge-primary">Vanilla Modern JavaScript</span>
            <span class="badge badge-primary">Responsive CSS3</span>
          </div>
        </div>
      </div>
    `;
  },

  // 3. Events Page
  async renderEvents(queryString = '') {
    const container = document.getElementById('view-container');
    if (!container) return;

    let initialCategory = 'All';
    let initialPresenter = '';
    if (queryString) {
      const params = new URLSearchParams(queryString);
      if (params.get('category')) initialCategory = params.get('category');
      if (params.get('presenter')) initialPresenter = params.get('presenter');
    }

    Events.selectedCategory = initialCategory;

    container.innerHTML = `
      <div>
        <div class="page-header">
          <div>
            <h1 class="page-title">Explore College Events</h1>
            <p class="page-subtitle">Find upcoming hackathons, guest lectures, technical workshops, and fests</p>
          </div>
          ${
            Auth.hasRole('admin', 'presenter')
              ? '<button class="btn btn-primary" onclick="Dashboard.openAddEventModal()">+ Create Event</button>'
              : ''
          }
        </div>

        <!-- Filter Bar -->
        <div class="filter-bar">
          <div class="search-input-wrap">
            <span class="search-icon">🔍</span>
            <input type="text" id="event-search" class="form-control" placeholder="Search by title, keywords, or venue..." oninput="App.handleEventSearch(event)" />
          </div>

          <div style="min-width: 160px;">
            <select id="event-status-filter" class="form-select" onchange="App.handleStatusFilter(event)">
              <option value="All">All Statuses</option>
              <option value="upcoming">Upcoming</option>
              <option value="ongoing">Live Now</option>
              <option value="completed">Completed</option>
            </select>
          </div>
        </div>

        <!-- Category Pills -->
        <div class="category-pills">
          ${['All', 'Technical', 'Workshop', 'Seminar', 'Hackathon', 'Cultural', 'Sports', 'Management'].map(cat => `
            <button class="category-pill ${cat === initialCategory ? 'active' : ''}" onclick="App.handleCategoryFilter('${cat}')">${cat}</button>
          `).join('')}
        </div>

        <!-- Events Grid -->
        <div id="events-grid" class="grid-3">
          <div style="grid-column: 1/-1; text-align: center; padding: 3rem;"><p>Loading events directory...</p></div>
        </div>
      </div>
    `;

    const events = await Events.fetchAll({ presenter: initialPresenter });
    Events.renderCards(events, 'events-grid');
  },

  handleEventSearch(e) {
    Events.searchQuery = e.target.value;
    Events.fetchAll().then(evs => Events.renderCards(evs));
  },

  handleCategoryFilter(cat) {
    Events.selectedCategory = cat;
    document.querySelectorAll('.category-pill').forEach(btn => {
      btn.classList.toggle('active', btn.textContent === cat);
    });
    Events.fetchAll().then(evs => Events.renderCards(evs));
  },

  handleStatusFilter(e) {
    Events.selectedStatus = e.target.value;
    Events.fetchAll().then(evs => Events.renderCards(evs));
  },

  // 4. Login Page
  renderLogin() {
    const container = document.getElementById('view-container');
    if (!container) return;

    if (Auth.isLoggedIn()) {
      window.location.hash = '#/dashboard';
      return;
    }

    container.innerHTML = `
      <div style="max-width: 460px; margin: 2rem auto;">
        <div class="card">
          <div style="text-align: center; margin-bottom: 2rem;">
            <div class="brand-icon" style="margin: 0 auto 0.75rem;">🎓</div>
            <h2 style="font-size: 1.5rem; color: var(--secondary); font-weight: 700;">Account Sign In</h2>
            <p style="color: var(--text-muted); font-size: 0.9rem;">College Event Presenter Management Portal</p>
          </div>

          <form id="login-form" onsubmit="App.handleLogin(event)">
            <div class="form-group">
              <label class="form-label">Email Address *</label>
              <input type="email" id="login-email" class="form-control" required placeholder="name@college.edu" />
            </div>

            <div class="form-group">
              <label class="form-label">Password *</label>
              <input type="password" id="login-password" class="form-control" required placeholder="••••••••" />
            </div>

            <button type="submit" class="btn btn-primary btn-block" style="margin-top: 1.5rem;">Sign In</button>
          </form>

          <!-- Quick Test Auto-Fill Demo Accounts -->
          <div class="demo-box">
            <div class="demo-title">⚡ 1-Click Evaluation Credentials</div>
            <div class="demo-buttons">
              <button type="button" class="btn btn-outline btn-sm" onclick="Auth.fillDemo('student')">🎓 Student Demo</button>
              <button type="button" class="btn btn-outline btn-sm" onclick="Auth.fillDemo('presenter')">🎙️ Presenter Demo</button>
              <button type="button" class="btn btn-outline btn-sm" onclick="Auth.fillDemo('admin')">🛡️ Admin Demo</button>
            </div>
          </div>

          <div style="text-align: center; margin-top: 1.5rem; font-size: 0.9rem; color: var(--text-muted);">
            Don't have an account? <a href="#/register" style="font-weight: 600;">Register as Student</a>
          </div>
        </div>
      </div>
    `;
  },

  async handleLogin(e) {
    e.preventDefault();
    const email = document.getElementById('login-email').value;
    const password = document.getElementById('login-password').value;

    try {
      const res = await Auth.login(email, password);
      this.showToast(`Welcome back, ${res.user.name}!`, 'success');
      this.updateNav();
      Notifications.fetch();
      window.location.hash = '#/dashboard';
    } catch (err) {
      this.showToast(err.message || 'Login failed', 'error');
    }
  },

  // 5. Register Page
  renderRegister() {
    const container = document.getElementById('view-container');
    if (!container) return;

    if (Auth.isLoggedIn()) {
      window.location.hash = '#/dashboard';
      return;
    }

    container.innerHTML = `
      <div style="max-width: 580px; margin: 2rem auto;">
        <div class="card">
          <div style="text-align: center; margin-bottom: 2rem;">
            <div class="brand-icon" style="margin: 0 auto 0.75rem;">📝</div>
            <h2 style="font-size: 1.5rem; color: var(--secondary); font-weight: 700;">Student Account Registration</h2>
            <p style="color: var(--text-muted); font-size: 0.9rem;">Join events, workshops, hackathons, and receive verified certificates</p>
          </div>

          <form id="register-form" onsubmit="App.handleRegister(event)">
            <div class="form-group">
              <label class="form-label">Full Name *</label>
              <input type="text" id="reg-name" class="form-control" required placeholder="e.g. Jordan Lee" />
            </div>

            <div class="grid-2">
              <div class="form-group">
                <label class="form-label">Email Address *</label>
                <input type="email" id="reg-email" class="form-control" required placeholder="jordan@college.edu" />
              </div>
              <div class="form-group">
                <label class="form-label">Password *</label>
                <input type="password" id="reg-password" class="form-control" required minlength="6" placeholder="Min 6 characters" />
              </div>
            </div>

            <div class="grid-2">
              <div class="form-group">
                <label class="form-label">Student ID / Roll Number *</label>
                <input type="text" id="reg-studentid" class="form-control" required placeholder="e.g. CS2024-99" />
              </div>
              <div class="form-group">
                <label class="form-label">Phone Number *</label>
                <input type="tel" id="reg-phone" class="form-control" required placeholder="+1 555-0199" />
              </div>
            </div>

            <div class="grid-2">
              <div class="form-group">
                <label class="form-label">Department *</label>
                <select id="reg-dept" class="form-select" required>
                  <option value="Computer Science & Engineering">Computer Science & Engineering</option>
                  <option value="Information Technology">Information Technology</option>
                  <option value="Electronics & Communication">Electronics & Communication</option>
                  <option value="Mechanical Engineering">Mechanical Engineering</option>
                  <option value="Management Studies">Management Studies</option>
                  <option value="Fine Arts & Design">Fine Arts & Design</option>
                </select>
              </div>
              <div class="form-group">
                <label class="form-label">Academic Year *</label>
                <select id="reg-year" class="form-select" required>
                  <option value="1st Year">1st Year</option>
                  <option value="2nd Year">2nd Year</option>
                  <option value="3rd Year">3rd Year</option>
                  <option value="4th Year">4th Year</option>
                  <option value="Postgraduate">Postgraduate</option>
                </select>
              </div>
            </div>

            <button type="submit" class="btn btn-primary btn-block" style="margin-top: 1.5rem;">Create Account</button>
          </form>

          <div style="text-align: center; margin-top: 1.5rem; font-size: 0.9rem; color: var(--text-muted);">
            Already have an account? <a href="#/login" style="font-weight: 600;">Sign In</a>
          </div>
        </div>
      </div>
    `;
  },

  async handleRegister(e) {
    e.preventDefault();
    const payload = {
      name: document.getElementById('reg-name').value,
      email: document.getElementById('reg-email').value,
      password: document.getElementById('reg-password').value,
      role: 'student',
      studentId: document.getElementById('reg-studentid').value,
      phone: document.getElementById('reg-phone').value,
      department: document.getElementById('reg-dept').value,
      year: document.getElementById('reg-year').value
    };

    try {
      const res = await Auth.register(payload);
      this.showToast(`Account created! Welcome, ${res.user.name}`, 'success');
      this.updateNav();
      Notifications.fetch();
      window.location.hash = '#/dashboard';
    } catch (err) {
      this.showToast(err.message || 'Registration failed', 'error');
    }
  },

  // 6. Profile Page
  async renderProfile() {
    const container = document.getElementById('view-container');
    if (!container) return;

    if (!Auth.isLoggedIn()) {
      window.location.hash = '#/login';
      return;
    }

    const user = await Auth.fetchProfile();

    container.innerHTML = `
      <div style="max-width: 680px; margin: 0 auto;">
        <div class="page-header">
          <div>
            <h1 class="page-title">⚙️ User Profile Settings</h1>
            <p class="page-subtitle">Manage your credentials, academic details, and contact info</p>
          </div>
        </div>

        <div class="card">
          <form id="profile-form" onsubmit="App.handleProfileUpdate(event)">
            <div style="display: flex; align-items: center; gap: 1.25rem; margin-bottom: 2rem; padding-bottom: 1.5rem; border-bottom: 1px solid var(--border);">
              <div class="user-avatar-badge" style="width: 64px; height: 64px; font-size: 1.5rem;">
                ${user.name.charAt(0).toUpperCase()}
              </div>
              <div>
                <h3 style="font-size: 1.25rem; color: var(--secondary);">${user.name}</h3>
                <div style="font-size: 0.85rem; color: var(--text-muted);">${user.email}</div>
                <div style="margin-top: 0.35rem;"><span class="role-badge ${user.role}">${user.role}</span></div>
              </div>
            </div>

            <div class="form-group">
              <label class="form-label">Full Name</label>
              <input type="text" id="prof-name" class="form-control" required value="${user.name}" />
            </div>

            <div class="form-group">
              <label class="form-label">Email Address</label>
              <input type="email" id="prof-email" class="form-control" required value="${user.email}" />
            </div>

            ${
              user.role === 'student' ? `
                <div class="grid-2">
                  <div class="form-group">
                    <label class="form-label">Student ID / Roll No</label>
                    <input type="text" id="prof-studentid" class="form-control" value="${user.profile?.studentId || ''}" />
                  </div>
                  <div class="form-group">
                    <label class="form-label">Phone Number</label>
                    <input type="text" id="prof-phone" class="form-control" value="${user.profile?.phone || ''}" />
                  </div>
                </div>
                <div class="grid-2">
                  <div class="form-group">
                    <label class="form-label">Department</label>
                    <input type="text" id="prof-dept" class="form-control" value="${user.profile?.department || ''}" />
                  </div>
                  <div class="form-group">
                    <label class="form-label">Academic Year</label>
                    <input type="text" id="prof-year" class="form-control" value="${user.profile?.year || ''}" />
                  </div>
                </div>
              ` : ''
            }

            ${
              user.role === 'presenter' ? `
                <div class="grid-2">
                  <div class="form-group">
                    <label class="form-label">Designation</label>
                    <input type="text" id="prof-desig" class="form-control" value="${user.profile?.designation || ''}" />
                  </div>
                  <div class="form-group">
                    <label class="form-label">Department</label>
                    <input type="text" id="prof-dept" class="form-control" value="${user.profile?.department || ''}" />
                  </div>
                </div>
                <div class="form-group">
                  <label class="form-label">Contact</label>
                  <input type="text" id="prof-contact" class="form-control" value="${user.profile?.contact || ''}" />
                </div>
                <div class="form-group">
                  <label class="form-label">Bio</label>
                  <textarea id="prof-bio" class="form-textarea">${user.profile?.bio || ''}</textarea>
                </div>
              ` : ''
            }

            <div style="display: flex; justify-content: flex-end; margin-top: 1.5rem;">
              <button type="submit" class="btn btn-primary">Save Profile Updates</button>
            </div>
          </form>
        </div>
      </div>
    `;
  },

  async handleProfileUpdate(e) {
    e.preventDefault();
    const user = Auth.getUser();
    const payload = {
      name: document.getElementById('prof-name').value,
      email: document.getElementById('prof-email').value
    };

    if (user.role === 'student') {
      const sId = document.getElementById('prof-studentid');
      const sPhone = document.getElementById('prof-phone');
      const sDept = document.getElementById('prof-dept');
      const sYear = document.getElementById('prof-year');
      if (sId) payload.studentId = sId.value;
      if (sPhone) payload.phone = sPhone.value;
      if (sDept) payload.department = sDept.value;
      if (sYear) payload.year = sYear.value;
    } else if (user.role === 'presenter') {
      const pDesig = document.getElementById('prof-desig');
      const pDept = document.getElementById('prof-dept');
      const pContact = document.getElementById('prof-contact');
      const pBio = document.getElementById('prof-bio');
      if (pDesig) payload.designation = pDesig.value;
      if (pDept) payload.department = pDept.value;
      if (pContact) payload.contact = pContact.value;
      if (pBio) payload.bio = pBio.value;
    }

    try {
      await Auth.updateProfile(payload);
      this.showToast('Profile updated successfully!', 'success');
      this.updateNav();
    } catch (err) {
      this.showToast(err.message, 'error');
    }
  },

  // 7. 404 Page
  render404() {
    const container = document.getElementById('view-container');
    if (!container) return;

    container.innerHTML = `
      <div style="text-align: center; padding: 5rem 1rem;">
        <div style="font-size: 4.5rem; font-weight: 800; color: var(--primary); line-height: 1;">404</div>
        <h2 style="font-size: 1.75rem; color: var(--secondary); margin: 1rem 0 0.5rem;">Page Not Found</h2>
        <p style="color: var(--text-muted); max-width: 450px; margin: 0 auto 2rem;">
          The requested page could not be located. It might have been moved or the URL might be invalid.
        </p>
        <a href="#/" class="btn btn-primary">Return to Homepage</a>
      </div>
    `;
  }
};

// Start application on DOM Ready
document.addEventListener('DOMContentLoaded', () => {
  App.init();
});

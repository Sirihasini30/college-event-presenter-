// Event Management & Rendering Service

const Events = {
  currentEvents: [],
  selectedCategory: 'All',
  selectedStatus: 'All',
  searchQuery: '',

  async fetchAll(filters = {}) {
    const params = {
      category: this.selectedCategory,
      status: this.selectedStatus,
      search: this.searchQuery,
      ...filters
    };
    const data = await API.get('/events', params);
    if (data.success) {
      this.currentEvents = data.events || [];
      return this.currentEvents;
    }
    return [];
  },

  async fetchById(id) {
    const data = await API.get(`/events/${id}`);
    if (data.success) {
      return data.event;
    }
    throw new Error(data.message || 'Event not found');
  },

  async create(eventData) {
    const data = await API.post('/events', eventData);
    if (data.success) {
      App.showToast('Event created successfully!', 'success');
      return data.event;
    }
    throw new Error(data.message);
  },

  async update(id, eventData) {
    const data = await API.put(`/events/${id}`, eventData);
    if (data.success) {
      App.showToast('Event updated successfully!', 'success');
      return data.event;
    }
    throw new Error(data.message);
  },

  async delete(id) {
    if (!confirm('Are you sure you want to delete this event? This will also remove registrations, schedules, and results.')) {
      return false;
    }
    const data = await API.delete(`/events/${id}`);
    if (data.success) {
      App.showToast('Event deleted successfully!', 'success');
      return true;
    }
    throw new Error(data.message);
  },

  renderCards(events, containerId = 'events-grid') {
    const container = document.getElementById(containerId);
    if (!container) return;

    if (!events || events.length === 0) {
      container.innerHTML = `
        <div style="grid-column: 1 / -1; text-align: center; padding: 4rem 1rem; background: #fff; border-radius: var(--radius-lg); border: 1px solid var(--border);">
          <div style="font-size: 3rem; margin-bottom: 1rem;">📅</div>
          <h3 style="font-size: 1.25rem; color: var(--secondary); margin-bottom: 0.5rem;">No Events Found</h3>
          <p style="color: var(--text-muted); font-size: 0.95rem;">Try adjusting your search criteria or category filter.</p>
        </div>
      `;
      return;
    }

    container.innerHTML = events.map(ev => {
      const fillPercentage = ev.capacity > 0 ? Math.min(100, Math.round((ev.registeredCount / ev.capacity) * 100)) : 0;
      const isFull = ev.registeredCount >= ev.capacity;
      const fillClass = fillPercentage > 85 ? (isFull ? 'full' : 'high') : '';
      const formattedDate = new Date(ev.eventDate).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' });
      const fee = ev.registrationFee || (ev.category === 'Hackathon' ? 499 : ev.category === 'Workshop' ? 299 : 0);
      
      let statusBadge = '';
      if (ev.status === 'upcoming') statusBadge = '<span class="badge badge-primary">Upcoming</span>';
      else if (ev.status === 'ongoing') statusBadge = '<span class="badge badge-warning">Live Now</span>';
      else if (ev.status === 'completed') statusBadge = '<span class="badge badge-success">Completed</span>';
      else if (ev.status === 'cancelled') statusBadge = '<span class="badge badge-danger">Cancelled</span>';

      return `
        <div class="event-card">
          <div class="event-image-wrap">
            <img src="${ev.image || 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=800'}" alt="${ev.title}" loading="lazy" onerror="this.onerror=null; this.src='https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=800';" />
            <span class="event-category-badge">${ev.category}</span>
            <div class="event-status-badge">${statusBadge}</div>
          </div>
          <div class="event-card-body">
            <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 0.35rem;">
              <h3 class="event-card-title" style="margin-bottom: 0;">${ev.title}</h3>
            </div>
            
            <div style="margin-bottom: 0.6rem;">
              <span class="badge ${fee > 0 ? 'badge-warning' : 'badge-success'}" style="font-size: 0.75rem;">
                ${fee > 0 ? `💳 Fee: ₹${fee} (UPI QR)` : '🆓 Free Entry'}
              </span>
            </div>

            <p class="event-card-desc">${ev.description}</p>
            
            <ul class="event-meta-list">
              <li class="event-meta-item">
                <span class="event-meta-icon">📅</span>
                <span>${formattedDate} • ${ev.startTime}</span>
              </li>
              <li class="event-meta-item">
                <span class="event-meta-icon">📍</span>
                <span>${ev.venue}</span>
              </li>
              <li class="event-meta-item">
                <span class="event-meta-icon">🎙️</span>
                <span>Presenter: ${ev.presenter?.user?.name || 'Academic Committee'}</span>
              </li>
            </ul>

            <div class="capacity-container">
              <div class="capacity-info">
                <span>Seats: ${ev.registeredCount || 0}/${ev.capacity}</span>
                <span>${isFull ? '<span style="color: var(--danger)">Housefull</span>' : `${ev.availableSeats} Available`}</span>
              </div>
              <div class="capacity-bar">
                <div class="capacity-fill ${fillClass}" style="width: ${fillPercentage}%;"></div>
              </div>
            </div>

            <div class="event-card-footer">
              <a href="#/events/${ev._id}" class="btn btn-outline btn-sm">View Details</a>
              ${
                ev.status === 'upcoming'
                  ? isFull
                    ? '<span class="badge badge-danger">Full</span>'
                    : `<button class="btn btn-primary btn-sm" onclick="Registrations.quickRegister('${ev._id}')">${fee > 0 ? `Pay ₹${fee} & Register` : 'Register'}</button>`
                  : `<a href="#/events/${ev._id}" class="btn btn-outline-primary btn-sm">${ev.status === 'completed' ? 'Results & Highlights' : 'View'}</a>`
              }
            </div>
          </div>
        </div>
      `;
    }).join('');
  },

  async renderDetailPage(eventId) {
    const mainEl = document.getElementById('view-container');
    if (!mainEl) return;

    try {
      mainEl.innerHTML = '<div style="text-align: center; padding: 4rem;"><div class="brand-icon" style="margin: 0 auto 1rem; animation: spin 1s infinite linear;">⚙️</div><p>Loading event details...</p></div>';
      
      const ev = await this.fetchById(eventId);
      const isStudent = Auth.hasRole('student');
      const isAdminOrPresenter = Auth.hasRole('admin', 'presenter');
      
      let isUserRegistered = false;
      let userRegistration = null;

      if (isStudent) {
        try {
          const myRegs = await Registrations.fetchMyRegistrations();
          userRegistration = myRegs.find(r => r.event?._id === ev._id && r.registrationStatus !== 'cancelled');
          if (userRegistration) isUserRegistered = true;
        } catch (e) {
          console.error(e);
        }
      }

      const formattedDate = new Date(ev.eventDate).toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });
      const fillPercentage = ev.capacity > 0 ? Math.min(100, Math.round((ev.registeredCount / ev.capacity) * 100)) : 0;
      const isFull = ev.registeredCount >= ev.capacity;
      const fee = ev.registrationFee || (ev.category === 'Hackathon' ? 499 : ev.category === 'Workshop' ? 299 : 0);

      mainEl.innerHTML = `
        <div style="max-width: 1100px; margin: 0 auto;">
          <!-- Breadcrumb Navigation -->
          <div style="margin-bottom: 1.5rem; font-size: 0.9rem; color: var(--text-muted); display: flex; align-items: center; gap: 0.5rem;">
            <a href="#/events">Events</a> &gt; <span>${ev.category}</span> &gt; <span style="color: var(--secondary); font-weight: 600;">${ev.title}</span>
          </div>

          <!-- Hero Banner Header -->
          <div class="card" style="padding: 0; overflow: hidden; margin-bottom: 2rem;">
            <div style="position: relative; height: 320px; background: #1e1b4b;">
              <img src="${ev.image || 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=1200'}" style="width: 100%; height: 100%; object-fit: cover; opacity: 0.85;" onerror="this.onerror=null; this.src='https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=1200';" />
              <div style="position: absolute; bottom: 0; left: 0; right: 0; padding: 2rem; background: linear-gradient(180deg, transparent 0%, rgba(15, 23, 42, 0.95) 100%); color: white;">
                <div style="display: flex; gap: 0.5rem; margin-bottom: 0.75rem;">
                  <span class="badge" style="background: var(--primary); color: white;">${ev.category}</span>
                  <span class="badge" style="background: rgba(255,255,255,0.2); color: white;">${ev.status.toUpperCase()}</span>
                </div>
                <h1 style="font-size: 2.25rem; font-weight: 800; line-height: 1.2;">${ev.title}</h1>
              </div>
            </div>

            <!-- Details Content Grid -->
            <div style="padding: 2rem; display: grid; grid-template-columns: 2fr 1fr; gap: 2.5rem;">
              <!-- Left Column: Description, Schedule, Results -->
              <div>
                <div style="margin-bottom: 2.5rem;">
                  <h3 style="font-size: 1.35rem; color: var(--secondary); margin-bottom: 1rem;">About This Event</h3>
                  <p style="font-size: 1.05rem; color: var(--text-main); line-height: 1.7; white-space: pre-line;">${ev.description}</p>
                </div>

                <!-- Event Schedule Timeline -->
                <div style="margin-bottom: 2.5rem;">
                  <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.25rem;">
                    <h3 style="font-size: 1.35rem; color: var(--secondary);">Event Schedule & Sessions</h3>
                    ${isAdminOrPresenter ? `<button class="btn btn-outline-primary btn-sm" onclick="Schedules.openAddModal('${ev._id}')">+ Add Session</button>` : ''}
                  </div>
                  
                  <div id="event-schedule-timeline">
                    ${
                      ev.schedules && ev.schedules.length > 0
                        ? `
                          <div class="timeline">
                            ${ev.schedules.map(sch => `
                              <div class="timeline-item">
                                <div class="timeline-dot"></div>
                                <div class="timeline-content">
                                  <div style="display: flex; justify-content: space-between; align-items: flex-start;">
                                    <div class="timeline-time">${sch.startTime} - ${sch.endTime}</div>
                                    ${isAdminOrPresenter ? `
                                      <div>
                                        <button class="btn btn-sm btn-outline" style="padding: 2px 6px; font-size: 0.75rem;" onclick="Schedules.delete('${sch._id}', '${ev._id}')">🗑️</button>
                                      </div>
                                    ` : ''}
                                  </div>
                                  <div class="timeline-title">${sch.activityName}</div>
                                  <div style="font-size: 0.85rem; color: var(--text-muted);">
                                    📍 <strong>Venue:</strong> ${sch.venue} ${sch.speakerOrLead ? `• 🎙️ <strong>Lead:</strong> ${sch.speakerOrLead}` : ''}
                                  </div>
                                </div>
                              </div>
                            `).join('')}
                          </div>
                        `
                        : '<div class="card" style="text-align: center; color: var(--text-muted); padding: 2rem;">No detailed schedule posted yet for this event.</div>'
                    }
                  </div>
                </div>

                <!-- Event Results (if available) -->
                ${
                  ev.results && ev.results.length > 0
                    ? `
                      <div style="margin-bottom: 2.5rem;">
                        <h3 style="font-size: 1.35rem; color: var(--secondary); margin-bottom: 1.25rem;">🏆 Official Results & Winners</h3>
                        <div class="table-responsive">
                          <table class="table">
                            <thead>
                              <tr>
                                <th>Position / Award</th>
                                <th>Student Name</th>
                                <th>Score</th>
                                <th>Remarks</th>
                              </tr>
                            </thead>
                            <tbody>
                              ${ev.results.map(r => `
                                <tr>
                                  <td><strong>${r.position}</strong></td>
                                  <td>${r.student?.user?.name || 'Student Participant'}</td>
                                  <td>${r.score} pts</td>
                                  <td style="color: var(--text-muted);">${r.remarks || '-'}</td>
                                </tr>
                              `).join('')}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    `
                    : ''
                }
              </div>

              <!-- Right Column: Registration Card & Presenter Profile -->
              <div>
                <!-- Registration Action Box -->
                <div class="card" style="background: #f8faff; border: 1px solid var(--border); margin-bottom: 1.5rem;">
                  <h4 style="font-size: 1.15rem; color: var(--secondary); margin-bottom: 1rem;">Event Information</h4>
                  
                  <div style="display: flex; flex-direction: column; gap: 0.85rem; font-size: 0.9rem; margin-bottom: 1.5rem;">
                    <div>📅 <strong>Date:</strong> ${formattedDate}</div>
                    <div>⏰ <strong>Time:</strong> ${ev.startTime} - ${ev.endTime}</div>
                    <div>📍 <strong>Venue:</strong> ${ev.venue}</div>
                    <div>👥 <strong>Capacity:</strong> ${ev.registeredCount || 0} / ${ev.capacity} registered</div>
                    <div>💳 <strong>Registration Fee:</strong> <span class="badge ${fee > 0 ? 'badge-warning' : 'badge-success'}">${fee > 0 ? `₹${fee} INR (UPI QR Payment)` : 'Free Entry'}</span></div>
                  </div>

                  <div style="margin-bottom: 1.5rem;">
                    <div style="display: flex; justify-content: space-between; font-size: 0.8rem; font-weight: 600; margin-bottom: 0.35rem;">
                      <span>Registration Status</span>
                      <span>${isFull ? '100% Full' : `${ev.availableSeats} Seats Left`}</span>
                    </div>
                    <div class="capacity-bar">
                      <div class="capacity-fill ${isFull ? 'full' : ''}" style="width: ${fillPercentage}%;"></div>
                    </div>
                  </div>

                  <!-- Registration Action Buttons -->
                  ${
                    ev.status !== 'upcoming'
                      ? `<div class="badge badge-info" style="display: block; text-align: center; padding: 0.75rem; font-size: 0.9rem;">Event is ${ev.status}</div>`
                      : isUserRegistered
                        ? `
                          <div style="background: var(--success-light); border: 1px solid #a7f3d0; border-radius: var(--radius-md); padding: 1rem; text-align: center; margin-bottom: 1rem;">
                            <div style="font-size: 1.25rem; font-weight: 700; color: #065f46; margin-bottom: 0.25rem;">✓ Registered & Confirmed</div>
                            <div style="font-size: 0.85rem; color: #047857; margin-bottom: 0.25rem;">Pass Code: <strong>${userRegistration.qrCodeToken}</strong></div>
                            ${userRegistration.paymentAmount > 0 ? `<div style="font-size: 0.8rem; color: #047857; margin-bottom: 0.5rem;">💳 Fee Paid: <strong>₹${userRegistration.paymentAmount}</strong> (Txn: ${userRegistration.transactionId || 'PAID'})</div>` : ''}
                            
                            <div style="display: flex; flex-direction: column; gap: 0.4rem; margin-top: 0.5rem;">
                              <button class="btn btn-outline-primary btn-sm btn-block" onclick='Registrations.viewReceipt(${JSON.stringify({ ...userRegistration, event: ev })})'>🧾 View Payment Receipt</button>
                              <button class="btn btn-danger btn-sm btn-block" onclick="Registrations.cancel('${userRegistration._id}', true, '${ev._id}')">Cancel Registration</button>
                            </div>
                          </div>
                        `
                        : isFull
                          ? `<button class="btn btn-secondary btn-block" disabled>Registration Closed (Full)</button>`
                          : isStudent
                            ? `<button class="btn btn-primary btn-lg btn-block" onclick="Registrations.register('${ev._id}', true)">${fee > 0 ? `Pay ₹${fee} & Register (UPI QR)` : 'Register Now'}</button>`
                            : Auth.isLoggedIn()
                              ? `<div style="font-size: 0.85rem; color: var(--text-muted); text-align: center;">Logged in as ${Auth.getUser().role}. (Only students can register)</div>`
                              : `
                                <div style="display: flex; flex-direction: column; gap: 0.5rem;">
                                  <a href="#/login" class="btn btn-primary btn-block">Login to Register</a>
                                  <a href="#/register" class="btn btn-outline btn-block">Create Student Account</a>
                                </div>
                              `
                  }
                </div>

                <!-- Presenter Details Card -->
                <div class="card">
                  <h4 style="font-size: 1.15rem; color: var(--secondary); margin-bottom: 1rem;">Event Presenter / Lead</h4>
                  ${
                    ev.presenter
                      ? `
                        <div style="display: flex; align-items: center; gap: 1rem; margin-bottom: 1rem;">
                          <div style="width: 56px; height: 56px; border-radius: 50%; background: var(--primary-subtle); color: var(--primary); display: flex; align-items: center; justify-content: center; font-size: 1.5rem; font-weight: bold;">
                            🎙️
                          </div>
                          <div>
                            <div style="font-weight: 700; font-size: 1.05rem; color: var(--secondary);">${ev.presenter.user?.name || 'Distinguished Faculty'}</div>
                            <div style="font-size: 0.85rem; color: var(--primary); font-weight: 600;">${ev.presenter.designation}</div>
                            <div style="font-size: 0.8rem; color: var(--text-muted);">${ev.presenter.department}</div>
                          </div>
                        </div>
                        <p style="font-size: 0.85rem; color: var(--text-muted); line-height: 1.5; margin-bottom: 0.75rem;">${ev.presenter.bio || 'Expert coordinator and speaker.'}</p>
                        <div style="font-size: 0.8rem; color: var(--text-muted);">📧 ${ev.presenter.user?.email || 'N/A'} • 📞 ${ev.presenter.contact}</div>
                      `
                      : '<div style="color: var(--text-muted); font-size: 0.9rem;">Organized by University Central Academic & Cultural Committee.</div>'
                  }
                </div>
              </div>
            </div>
          </div>
        </div>
      `;
    } catch (err) {
      mainEl.innerHTML = `
        <div class="card" style="text-align: center; padding: 4rem;">
          <h3 style="color: var(--danger);">Failed to load event</h3>
          <p style="color: var(--text-muted); margin: 1rem 0;">${err.message}</p>
          <a href="#/events" class="btn btn-primary">Back to Events</a>
        </div>
      `;
    }
  }
};

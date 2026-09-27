// Presenter Management Service

const Presenters = {
  currentPresenters: [],

  async fetchAll() {
    const data = await API.get('/presenters');
    if (data.success) {
      this.currentPresenters = data.presenters || [];
      return this.currentPresenters;
    }
    return [];
  },

  async fetchById(id) {
    const data = await API.get(`/presenters/${id}`);
    if (data.success) {
      return data;
    }
    throw new Error(data.message);
  },

  async create(formData) {
    const data = await API.post('/presenters', formData);
    if (data.success) {
      App.showToast('Presenter profile created successfully!', 'success');
      return data.presenter;
    }
    throw new Error(data.message);
  },

  async update(id, formData) {
    const data = await API.put(`/presenters/${id}`, formData);
    if (data.success) {
      App.showToast('Presenter updated successfully!', 'success');
      return data.presenter;
    }
    throw new Error(data.message);
  },

  async delete(id) {
    if (!confirm('Are you sure you want to remove this presenter?')) return false;
    const data = await API.delete(`/presenters/${id}`);
    if (data.success) {
      App.showToast('Presenter removed successfully', 'success');
      return true;
    }
    throw new Error(data.message);
  },

  async fetchMyAssignedEvents() {
    const data = await API.get('/presenters/my/assigned-events');
    if (data.success) {
      return data.events || [];
    }
    return [];
  },

  renderCards(presenters, containerId = 'presenters-grid') {
    const container = document.getElementById(containerId);
    if (!container) return;

    if (!presenters || presenters.length === 0) {
      container.innerHTML = '<div style="text-align: center; color: var(--text-muted); padding: 2rem;">No presenters listed yet.</div>';
      return;
    }

    container.innerHTML = presenters.map(p => `
      <div class="presenter-card">
        <div class="presenter-avatar">🎙️</div>
        <h4 class="presenter-name">${p.user?.name || 'Academic Lead'}</h4>
        <div class="presenter-designation">${p.designation}</div>
        <div class="presenter-department">${p.department}</div>
        <p style="font-size: 0.85rem; color: var(--text-muted); line-height: 1.5; margin-bottom: 1rem; min-height: 50px;">${p.bio || 'Coordinator & Presenter'}</p>
        
        <div style="font-size: 0.8rem; color: var(--primary); font-weight: 600; margin-bottom: 1rem;">
          📅 ${p.eventsCount || 0} Assigned Events
        </div>

        <div style="display: flex; justify-content: center; gap: 0.5rem;">
          <a href="#/events?presenter=${p._id}" class="btn btn-outline-primary btn-sm">View Events</a>
          ${
            Auth.hasRole('admin')
              ? `
                <button class="btn btn-outline btn-sm" onclick="Presenters.openEditModal('${p._id}')">Edit</button>
                <button class="btn btn-danger btn-sm" onclick="Presenters.handleDelete('${p._id}')">Delete</button>
              `
              : ''
          }
        </div>
      </div>
    `).join('');
  },

  async handleDelete(id) {
    const ok = await this.delete(id);
    if (ok) {
      const plist = await this.fetchAll();
      this.renderCards(plist);
    }
  },

  openAddModal() {
    const modalBody = document.getElementById('app-modal-body');
    const modalTitle = document.getElementById('app-modal-title');
    if (!modalBody || !modalTitle) return;

    modalTitle.textContent = 'Add New Presenter / Coordinator';
    modalBody.innerHTML = `
      <form id="add-presenter-form" onsubmit="Presenters.submitAdd(event)">
        <div class="form-group">
          <label class="form-label">Full Name *</label>
          <input type="text" id="p-name" class="form-control" required placeholder="e.g. Dr. Arthur Dent" />
        </div>
        <div class="grid-2">
          <div class="form-group">
            <label class="form-label">Email Address *</label>
            <input type="email" id="p-email" class="form-control" required placeholder="presenter@college.edu" />
          </div>
          <div class="form-group">
            <label class="form-label">Password *</label>
            <input type="password" id="p-password" class="form-control" required minlength="6" placeholder="At least 6 characters" />
          </div>
        </div>
        <div class="grid-2">
          <div class="form-group">
            <label class="form-label">Designation *</label>
            <input type="text" id="p-designation" class="form-control" required placeholder="e.g. Professor & Head of Dept" />
          </div>
          <div class="form-group">
            <label class="form-label">Department *</label>
            <input type="text" id="p-department" class="form-control" required placeholder="e.g. Computer Science" />
          </div>
        </div>
        <div class="form-group">
          <label class="form-label">Contact Phone / Extension *</label>
          <input type="text" id="p-contact" class="form-control" required placeholder="e.g. +1 555-0192" />
        </div>
        <div class="form-group">
          <label class="form-label">Bio & Specialization</label>
          <textarea id="p-bio" class="form-textarea" placeholder="Brief background, research areas, and key topics..."></textarea>
        </div>
        <div style="display: flex; justify-content: flex-end; gap: 0.75rem; margin-top: 1.5rem;">
          <button type="button" class="btn btn-outline" onclick="App.closeModal()">Cancel</button>
          <button type="submit" class="btn btn-primary">Create Presenter Account</button>
        </div>
      </form>
    `;
    App.openModal();
  },

  async submitAdd(e) {
    e.preventDefault();
    const payload = {
      name: document.getElementById('p-name').value,
      email: document.getElementById('p-email').value,
      password: document.getElementById('p-password').value,
      designation: document.getElementById('p-designation').value,
      department: document.getElementById('p-department').value,
      contact: document.getElementById('p-contact').value,
      bio: document.getElementById('p-bio').value
    };

    try {
      await this.create(payload);
      App.closeModal();
      if (window.location.hash === '#/admin/presenters') {
        const plist = await this.fetchAll();
        this.renderCards(plist);
      }
    } catch (err) {
      App.showToast(err.message, 'error');
    }
  }
};

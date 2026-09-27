// Schedule Management Service

const Schedules = {
  async fetchByEvent(eventId) {
    const data = await API.get(`/schedules/${eventId}`);
    if (data.success) {
      return data.schedules || [];
    }
    return [];
  },

  async create(scheduleData) {
    const data = await API.post('/schedules', scheduleData);
    if (data.success) {
      App.showToast('Schedule session added successfully!', 'success');
      return data.schedule;
    }
    throw new Error(data.message);
  },

  async delete(scheduleId, eventId) {
    if (!confirm('Are you sure you want to remove this schedule item?')) return;
    try {
      const data = await API.delete(`/schedules/${scheduleId}`);
      if (data.success) {
        App.showToast('Session removed', 'success');
        if (eventId) {
          Events.renderDetailPage(eventId);
        }
      }
    } catch (err) {
      App.showToast(err.message, 'error');
    }
  },

  openAddModal(eventId) {
    const modalBody = document.getElementById('app-modal-body');
    const modalTitle = document.getElementById('app-modal-title');
    if (!modalBody || !modalTitle) return;

    modalTitle.textContent = 'Add Schedule Activity / Session';
    modalBody.innerHTML = `
      <form id="add-schedule-form" onsubmit="Schedules.submitAdd(event, '${eventId}')">
        <div class="form-group">
          <label class="form-label">Activity / Session Title *</label>
          <input type="text" id="sch-title" class="form-control" required placeholder="e.g. Keynote Address & Panel Discussion" />
        </div>
        <div class="grid-2">
          <div class="form-group">
            <label class="form-label">Date *</label>
            <input type="date" id="sch-date" class="form-control" required />
          </div>
          <div class="form-group">
            <label class="form-label">Venue Location *</label>
            <input type="text" id="sch-venue" class="form-control" required placeholder="e.g. Auditorium Hall A" />
          </div>
        </div>
        <div class="grid-2">
          <div class="form-group">
            <label class="form-label">Start Time *</label>
            <input type="text" id="sch-start" class="form-control" required placeholder="e.g. 10:00 AM" />
          </div>
          <div class="form-group">
            <label class="form-label">End Time *</label>
            <input type="text" id="sch-end" class="form-control" required placeholder="e.g. 11:30 AM" />
          </div>
        </div>
        <div class="form-group">
          <label class="form-label">Speaker / Lead Coordinator</label>
          <input type="text" id="sch-lead" class="form-control" placeholder="e.g. Dr. Sarah Jenkins / Industry Guest" />
        </div>
        <div style="display: flex; justify-content: flex-end; gap: 0.75rem; margin-top: 1.5rem;">
          <button type="button" class="btn btn-outline" onclick="App.closeModal()">Cancel</button>
          <button type="submit" class="btn btn-primary">Add to Schedule</button>
        </div>
      </form>
    `;

    // Set default date to today or tomorrow
    const today = new Date().toISOString().split('T')[0];
    document.getElementById('sch-date').value = today;

    App.openModal();
  },

  async submitAdd(e, eventId) {
    e.preventDefault();
    const payload = {
      event: eventId,
      activityName: document.getElementById('sch-title').value,
      scheduleDate: document.getElementById('sch-date').value,
      startTime: document.getElementById('sch-start').value,
      endTime: document.getElementById('sch-end').value,
      venue: document.getElementById('sch-venue').value,
      speakerOrLead: document.getElementById('sch-lead').value
    };

    try {
      await this.create(payload);
      App.closeModal();
      Events.renderDetailPage(eventId);
    } catch (err) {
      App.showToast(err.message, 'error');
    }
  }
};

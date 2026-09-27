// Results & Leaderboard Management Service

const Results = {
  async fetchByEvent(eventId) {
    const data = await API.get(`/results/${eventId}`);
    if (data.success) {
      return data.results || [];
    }
    return [];
  },

  async fetchMyResults() {
    const data = await API.get('/results/my');
    if (data.success) {
      return data.results || [];
    }
    return [];
  },

  async create(resultData) {
    const data = await API.post('/results', resultData);
    if (data.success) {
      App.showToast('Result published successfully!', 'success');
      return data.result;
    }
    throw new Error(data.message);
  },

  async delete(resultId) {
    if (!confirm('Are you sure you want to delete this result entry?')) return;
    const data = await API.delete(`/results/${resultId}`);
    if (data.success) {
      App.showToast('Result deleted', 'info');
      return true;
    }
    throw new Error(data.message);
  },

  async openPublishModal(eventId) {
    const modalBody = document.getElementById('app-modal-body');
    const modalTitle = document.getElementById('app-modal-title');
    if (!modalBody || !modalTitle) return;

    modalTitle.textContent = 'Publish Event Results & Awards';

    // Fetch registered students for this event
    let attendees = [];
    try {
      const regData = await API.get(`/registrations/event/${eventId}`);
      attendees = regData.registrations || [];
    } catch (e) {
      console.error(e);
    }

    modalBody.innerHTML = `
      <form id="publish-result-form" onsubmit="Results.submitPublish(event, '${eventId}')">
        <div class="form-group">
          <label class="form-label">Select Student *</label>
          <select id="res-student" class="form-select" required>
            <option value="">-- Choose Registered Student --</option>
            ${
              attendees.map(a => `
                <option value="${a.student?._id}">${a.student?.user?.name || 'Student'} (${a.student?.studentId || 'N/A'} - ${a.student?.department || ''})</option>
              `).join('')
            }
          </select>
        </div>

        <div class="grid-2">
          <div class="form-group">
            <label class="form-label">Position / Award *</label>
            <input type="text" id="res-position" class="form-control" required placeholder="e.g. 1st Place (Gold Medal), Runner-up, Special Mention" />
          </div>
          <div class="form-group">
            <label class="form-label">Score (Points) *</label>
            <input type="number" id="res-score" class="form-control" min="0" max="100" value="95" required />
          </div>
        </div>

        <div class="form-group">
          <label class="form-label">Judge Remarks / Feedback</label>
          <textarea id="res-remarks" class="form-textarea" placeholder="Outstanding performance, creative solution..."></textarea>
        </div>

        <div class="form-group" style="display: flex; align-items: center; gap: 0.5rem;">
          <input type="checkbox" id="res-cert" style="width: 18px; height: 18px;" checked />
          <label for="res-cert" style="font-size: 0.9rem; font-weight: 500;">Generate Official Digital Participation Certificate</label>
        </div>

        <div style="display: flex; justify-content: flex-end; gap: 0.75rem; margin-top: 1.5rem;">
          <button type="button" class="btn btn-outline" onclick="App.closeModal()">Cancel</button>
          <button type="submit" class="btn btn-primary">Publish Result</button>
        </div>
      </form>
    `;

    App.openModal();
  },

  async submitPublish(e, eventId) {
    e.preventDefault();
    const payload = {
      event: eventId,
      student: document.getElementById('res-student').value,
      position: document.getElementById('res-position').value,
      score: Number(document.getElementById('res-score').value),
      remarks: document.getElementById('res-remarks').value,
      certificateIssued: document.getElementById('res-cert').checked
    };

    try {
      await this.create(payload);
      App.closeModal();
      if (window.location.hash.startsWith('#/events/')) {
        Events.renderDetailPage(eventId);
      } else {
        App.showToast('Result published and student notified!', 'success');
      }
    } catch (err) {
      App.showToast(err.message, 'error');
    }
  }
};

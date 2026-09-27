// Registration & Payment Management Service

const Registrations = {
  async register(eventId, reloadDetail = false) {
    if (!Auth.isLoggedIn()) {
      App.showToast('Please login as a student to register for events.', 'warning');
      window.location.hash = '#/login';
      return;
    }

    if (!Auth.hasRole('student')) {
      App.showToast('Only student accounts are eligible for event registration.', 'warning');
      return;
    }

    try {
      // Check if event is paid (Hackathon, Workshop, etc.)
      const event = await Events.fetchById(eventId);
      const fee = event.registrationFee || (event.category === 'Hackathon' ? 499 : event.category === 'Workshop' ? 299 : 0);

      if (fee > 0 || event.isPaid) {
        // Open Payment QR Code Modal
        this.openPaymentModal(event, reloadDetail);
        return;
      }

      // Free event registration
      const data = await API.post('/registrations', { eventId });
      if (data.success) {
        App.showToast('Registration Confirmed! Ticket pass generated.', 'success');
        Notifications.fetch();
        if (reloadDetail) {
          Events.renderDetailPage(eventId);
        } else {
          Events.fetchAll().then(evs => Events.renderCards(evs));
        }
      }
    } catch (err) {
      App.showToast(err.message || 'Registration failed', 'error');
    }
  },

  async quickRegister(eventId) {
    return this.register(eventId, false);
  },

  // Open Payment QR Code Modal for Hackathons and Workshops
  openPaymentModal(event, reloadDetail = false) {
    const modalBody = document.getElementById('app-modal-body');
    const modalTitle = document.getElementById('app-modal-title');
    if (!modalBody || !modalTitle) return;

    const user = Auth.getUser();
    const fee = event.registrationFee || (event.category === 'Hackathon' ? 499 : event.category === 'Workshop' ? 299 : 199);
    const payeeName = event.upiId || 'RANGA SIRIHASINI';
    const upiHandle = event.upiHandle || 'ranga.sirihasini@phonepe';
    const qrImage = event.paymentQrImage || '/img/payment-qr.jpg';

    modalTitle.innerHTML = `💳 Event Registration Payment`;

    modalBody.innerHTML = `
      <div style="text-align: center; max-width: 440px; margin: 0 auto;">
        <!-- Header Banner -->
        <div style="background: linear-gradient(135deg, #1e1b4b 0%, #4338ca 100%); color: white; padding: 1.25rem; border-radius: var(--radius-md); margin-bottom: 1.25rem; box-shadow: var(--shadow-sm);">
          <div style="font-size: 0.8rem; text-transform: uppercase; letter-spacing: 0.5px; opacity: 0.9;">Registration Fee (${event.category})</div>
          <h3 style="font-size: 1.15rem; font-weight: 700; margin: 0.25rem 0 0.5rem; color: #fff;">${event.title}</h3>
          <div style="font-size: 2.25rem; font-weight: 800; color: #fbbf24;">₹${fee}<span style="font-size: 0.95rem; font-weight: 500; color: #e0e7ff;"> INR</span></div>
          <div style="font-size: 0.85rem; opacity: 0.9; margin-top: 0.25rem;">Student: <strong>${user.name}</strong> (${user.profile?.studentId || 'STU-ID'})</div>
        </div>

        <!-- QR Code Card Container -->
        <div style="background: #0f172a; color: white; border-radius: var(--radius-lg); padding: 1.25rem; margin-bottom: 1.25rem; box-shadow: var(--shadow-lg); position: relative; overflow: hidden;">
          <div style="display: flex; align-items: center; justify-content: center; gap: 0.5rem; margin-bottom: 0.75rem;">
            <span style="font-size: 1.25rem;">🟣</span>
            <span style="font-weight: 700; font-size: 1.1rem; letter-spacing: 0.5px;">PhonePe</span>
            <span class="badge" style="background: rgba(168, 85, 247, 0.2); color: #c084fc; font-size: 0.7rem;">ACCEPTED HERE</span>
          </div>

          <div style="font-size: 0.8rem; color: #94a3b8; margin-bottom: 0.75rem;">
            Scan QR using <strong>PhonePe, Google Pay, Paytm</strong> or Any UPI App
          </div>

          <!-- Official Uploaded QR Code Image -->
          <div style="background: #ffffff; border-radius: var(--radius-md); padding: 0.5rem; width: 230px; margin: 0 auto; box-shadow: 0 4px 15px rgba(0,0,0,0.3);">
            <img src="${qrImage}" alt="PhonePe QR Code - RANGA SIRIHASINI" style="width: 100%; height: auto; border-radius: 4px; display: block;" onerror="this.src='https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=upi://pay?pa=ranga.sirihasini@phonepe&pn=RANGA%20SIRIHASINI&am=${fee}&cu=INR'" />
          </div>

          <div style="margin-top: 0.75rem;">
            <div style="font-weight: 800; font-size: 1.05rem; letter-spacing: 1px; color: #f8fafc;">${payeeName}</div>
            <div style="font-size: 0.8rem; color: #a855f7; font-family: monospace;">UPI ID: ${upiHandle}</div>
          </div>
        </div>

        <!-- Copy UPI Box -->
        <div style="background: var(--bg-alt); padding: 0.6rem 1rem; border-radius: var(--radius-md); display: flex; align-items: center; justify-content: space-between; margin-bottom: 1.25rem; font-size: 0.85rem; border: 1px solid var(--border);">
          <div style="text-align: left;">
            <span style="color: var(--text-muted); font-size: 0.75rem;">Payee UPI ID:</span><br>
            <strong style="color: var(--secondary); font-family: monospace;">${upiHandle}</strong>
          </div>
          <button type="button" class="btn btn-outline btn-sm" style="padding: 4px 10px; font-size: 0.8rem;" onclick="navigator.clipboard.writeText('${upiHandle}'); App.showToast('UPI ID (${upiHandle}) copied!', 'info');">
            📋 Copy ID
          </button>
        </div>

        <!-- Payment Verification Form -->
        <form id="payment-verify-form" onsubmit="Registrations.submitPayment(event, '${event._id}', ${fee}, ${reloadDetail})">
          <div class="form-group" style="text-align: left; margin-bottom: 1rem;">
            <label class="form-label" style="font-size: 0.85rem; font-weight: 600;">UPI Reference / Transaction ID (UTR) *</label>
            <input type="text" id="pay-txnid" class="form-control" placeholder="e.g. UPI489210492817" required />
            <small style="color: var(--text-muted); font-size: 0.75rem;">Enter the 12-digit transaction ID from your payment app confirmation</small>
          </div>

          <div style="display: flex; flex-direction: column; gap: 0.5rem;">
            <!-- Fast Instant Simulation for Evaluation / Demo Testing -->
            <button type="button" class="btn btn-outline-primary btn-sm" style="background: #f0fdf4; border-color: #86efac; color: #166534; font-weight: 600; padding: 0.6rem;" onclick="Registrations.simulateInstantPayment(${fee})">
              ⚡ Auto-Fill Demo Payment Reference
            </button>
            
            <div style="display: flex; gap: 0.5rem; margin-top: 0.35rem;">
              <button type="button" class="btn btn-outline btn-block" onclick="App.closeModal()">Cancel</button>
              <button type="submit" id="btn-confirm-payment" class="btn btn-primary btn-block">Verify & Confirm Pass</button>
            </div>
          </div>
        </form>
      </div>
    `;

    App.openModal();
  },

  // Instant Payment Simulation for seamless testing
  simulateInstantPayment(fee) {
    const txnField = document.getElementById('pay-txnid');
    if (txnField) {
      const randomTxn = 'UPI' + Math.floor(100000000000 + Math.random() * 900000000000);
      txnField.value = randomTxn;
      App.showToast(`Simulated successful payment of ₹${fee}! Click 'Verify & Confirm Pass'.`, 'success');
    }
  },

  async submitPayment(e, eventId, amount, reloadDetail) {
    e.preventDefault();
    const txnInput = document.getElementById('pay-txnid');
    const transactionId = txnInput ? txnInput.value.trim() : ('TXN-' + Date.now());
    const btn = document.getElementById('btn-confirm-payment');

    if (btn) {
      btn.disabled = true;
      btn.innerHTML = '⏳ Verifying Payment...';
    }

    try {
      const data = await API.post('/registrations', {
        eventId,
        transactionId,
        paymentAmount: amount,
        paymentMethod: 'UPI / QR Code'
      });

      if (data.success) {
        App.closeModal();
        App.showToast(`🎉 Payment Verified (₹${amount})! Ticket Pass Confirmed.`, 'success');
        Notifications.fetch();

        // Show Digital Payment Receipt Modal
        if (data.registration) {
          setTimeout(() => {
            this.viewReceipt(data.registration);
          }, 400);
        }

        if (reloadDetail) {
          Events.renderDetailPage(eventId);
        } else if (window.location.hash === '#/dashboard') {
          Dashboard.render();
        } else {
          Events.fetchAll().then(evs => Events.renderCards(evs));
        }
      }
    } catch (err) {
      App.showToast(err.message || 'Payment verification failed', 'error');
      if (btn) {
        btn.disabled = false;
        btn.innerHTML = 'Verify & Confirm Pass';
      }
    }
  },

  // Digital Tax Invoice / Payment Receipt
  viewReceipt(reg) {
    const modalBody = document.getElementById('app-modal-body');
    const modalTitle = document.getElementById('app-modal-title');
    if (!modalBody || !modalTitle) return;

    const event = reg.event || {};
    const student = reg.student || {};
    const user = student.user || Auth.getUser() || {};
    const amount = reg.paymentAmount || event.registrationFee || 0;
    const txnId = reg.transactionId || 'TXN-' + Math.random().toString(36).substring(2, 9).toUpperCase();
    const dateStr = new Date(reg.paymentDate || reg.registrationDate || Date.now()).toLocaleString();

    modalTitle.innerHTML = `🧾 Official Payment Receipt`;

    modalBody.innerHTML = `
      <div id="printable-receipt" style="background: #fff; padding: 1.5rem; border: 1px solid var(--border); border-radius: var(--radius-md);">
        <!-- College Header -->
        <div style="display: flex; justify-content: space-between; align-items: flex-start; padding-bottom: 1rem; border-bottom: 2px solid var(--border); margin-bottom: 1.25rem;">
          <div>
            <div style="display: flex; align-items: center; gap: 0.5rem;">
              <div class="brand-icon" style="width: 32px; height: 32px; font-size: 1rem;">🏛️</div>
              <h3 style="font-size: 1.15rem; color: var(--secondary);">College Event Management</h3>
            </div>
            <div style="font-size: 0.8rem; color: var(--text-muted); margin-top: 0.25rem;">University Campus, Innovation & Event Hub</div>
          </div>
          <div style="text-align: right;">
            <span class="badge badge-success" style="font-size: 0.8rem; padding: 0.35rem 0.75rem;">✓ PAYMENT PAID</span>
            <div style="font-size: 0.75rem; color: var(--text-muted); margin-top: 0.35rem;">Receipt #: <strong>INV-${reg._id ? reg._id.slice(-6).toUpperCase() : '892147'}</strong></div>
          </div>
        </div>

        <!-- Receipt Metadata Grid -->
        <div class="grid-2" style="font-size: 0.85rem; margin-bottom: 1.25rem; gap: 1rem;">
          <div>
            <div style="color: var(--text-muted);">Billed To:</div>
            <strong style="color: var(--secondary); font-size: 0.95rem;">${user.name}</strong>
            <div style="color: var(--text-muted);">ID: ${student.studentId || 'STU-ID'} • ${student.department || ''}</div>
            <div style="color: var(--text-muted);">${user.email}</div>
          </div>
          <div style="text-align: right;">
            <div style="color: var(--text-muted);">Payment Date & Time:</div>
            <div style="font-weight: 600; color: var(--secondary);">${dateStr}</div>
            <div style="color: var(--text-muted); margin-top: 0.25rem;">Payment Method: <strong>${reg.paymentMethod || 'UPI / QR Code'}</strong></div>
            <div style="color: var(--text-muted);">Transaction Ref: <code style="background: var(--bg-alt); padding: 1px 4px;">${txnId}</code></div>
          </div>
        </div>

        <!-- Line Items Table -->
        <table class="table" style="margin-bottom: 1.25rem; font-size: 0.85rem;">
          <thead>
            <tr>
              <th>Description / Event</th>
              <th>Category</th>
              <th>Pass ID</th>
              <th style="text-align: right;">Amount (INR)</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td><strong>${event.title || 'College Event'}</strong><br><small style="color: var(--text-muted);">${event.venue || 'Campus Auditorium'}</small></td>
              <td><span class="badge badge-primary">${event.category || 'Event'}</span></td>
              <td><code>${reg.qrCodeToken || 'REG-PASS'}</code></td>
              <td style="text-align: right; font-weight: 700; font-size: 1rem; color: var(--secondary);">₹${amount}.00</td>
            </tr>
          </tbody>
          <tfoot>
            <tr>
              <td colspan="3" style="text-align: right; font-weight: 700;">Total Paid:</td>
              <td style="text-align: right; font-weight: 800; font-size: 1.15rem; color: var(--primary);">₹${amount}.00</td>
            </tr>
          </tfoot>
        </table>

        <div style="background: var(--bg-alt); padding: 0.75rem; border-radius: var(--radius-sm); font-size: 0.75rem; color: var(--text-muted); text-align: center;">
          This is a system-generated electronic payment receipt for collegiate event registration. No physical signature required.
        </div>

        <div style="display: flex; justify-content: flex-end; gap: 0.75rem; margin-top: 1.25rem;">
          <button type="button" class="btn btn-outline btn-sm" onclick="App.closeModal()">Close</button>
          <button type="button" class="btn btn-primary btn-sm" onclick="window.print()">🖨️ Print Receipt</button>
        </div>
      </div>
    `;

    App.openModal();
  },

  async fetchMyRegistrations() {
    const data = await API.get('/registrations/my');
    if (data.success) {
      return data.registrations || [];
    }
    return [];
  },

  async fetchAll(filters = {}) {
    const data = await API.get('/registrations', filters);
    if (data.success) {
      return data.registrations || [];
    }
    return [];
  },

  async cancel(registrationId, reloadDetail = false, eventId = null) {
    if (!confirm('Are you sure you want to cancel this event registration?')) {
      return;
    }

    try {
      const data = await API.delete(`/registrations/${registrationId}`);
      if (data.success) {
        App.showToast('Registration cancelled successfully', 'info');
        Notifications.fetch();
        if (reloadDetail && eventId) {
          Events.renderDetailPage(eventId);
        } else if (window.location.hash === '#/dashboard') {
          Dashboard.render();
        } else if (window.location.hash === '#/admin/registrations') {
          Dashboard.renderRegistrationManagement();
        } else {
          App.route();
        }
      }
    } catch (err) {
      App.showToast(err.message || 'Cancellation failed', 'error');
    }
  },

  async updateAttendance(registrationId, status, attended) {
    try {
      const data = await API.put(`/registrations/${registrationId}/status`, {
        registrationStatus: status,
        attended
      });
      if (data.success) {
        App.showToast('Attendance status updated', 'success');
        if (window.location.hash === '#/admin/registrations') {
          Dashboard.renderRegistrationManagement();
        }
      }
    } catch (err) {
      App.showToast(err.message || 'Failed to update attendance', 'error');
    }
  }
};

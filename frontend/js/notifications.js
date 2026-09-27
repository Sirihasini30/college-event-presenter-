// Notification Handling Service

const Notifications = {
  items: [],
  unreadCount: 0,

  async fetch() {
    if (!Auth.isLoggedIn()) return;
    try {
      const data = await API.get('/notifications');
      if (data.success) {
        this.items = data.notifications || [];
        this.unreadCount = data.unreadCount || 0;
        this.renderBadgeAndDropdown();
      }
    } catch (err) {
      console.error('[Notifications] Failed to load:', err);
    }
  },

  async markAsRead(id) {
    try {
      await API.put(`/notifications/${id}/read`);
      const item = this.items.find(n => n._id === id);
      if (item) item.isRead = true;
      if (this.unreadCount > 0) this.unreadCount--;
      this.renderBadgeAndDropdown();
    } catch (err) {
      console.error('[Notifications] Mark read error:', err);
    }
  },

  async markAllRead() {
    try {
      await API.put('/notifications/read-all');
      this.items.forEach(n => n.isRead = true);
      this.unreadCount = 0;
      this.renderBadgeAndDropdown();
      App.showToast('All notifications marked as read', 'success');
    } catch (err) {
      App.showToast('Failed to mark notifications read', 'error');
    }
  },

  renderBadgeAndDropdown() {
    const badgeEl = document.getElementById('notif-badge');
    const listEl = document.getElementById('notif-list');
    
    if (badgeEl) {
      if (this.unreadCount > 0) {
        badgeEl.textContent = this.unreadCount > 9 ? '9+' : this.unreadCount;
        badgeEl.style.display = 'flex';
      } else {
        badgeEl.style.display = 'none';
      }
    }

    if (listEl) {
      if (this.items.length === 0) {
        listEl.innerHTML = '<div style="padding: 1.5rem; text-align: center; color: var(--text-muted); font-size: 0.85rem;">No notifications yet</div>';
        return;
      }

      listEl.innerHTML = this.items.map(n => `
        <div class="notif-item ${n.isRead ? '' : 'unread'}" onclick="Notifications.handleClick('${n._id}', '${n.link || ''}')">
          <div class="notif-icon">
            ${n.type === 'registration' ? '🎫' : n.type === 'result' ? '🏆' : n.type === 'schedule' ? '📅' : '📢'}
          </div>
          <div style="flex: 1;">
            <div>${n.message}</div>
            <div class="notif-time">${new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} • ${new Date(n.createdAt).toLocaleDateString()}</div>
          </div>
          ${!n.isRead ? '<span style="width: 8px; height: 8px; border-radius: 50%; background: var(--primary); display: inline-block;"></span>' : ''}
        </div>
      `).join('');
    }
  },

  handleClick(id, link) {
    this.markAsRead(id);
    if (link) {
      window.location.hash = '#' + link;
    }
    const dd = document.getElementById('notif-dropdown');
    if (dd) dd.classList.remove('show');
  },

  toggleDropdown() {
    const dd = document.getElementById('notif-dropdown');
    if (dd) {
      dd.classList.toggle('show');
      if (dd.classList.contains('show')) {
        this.fetch();
      }
    }
  }
};

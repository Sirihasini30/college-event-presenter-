// Authentication & User State Service

const Auth = {
  getUser() {
    try {
      const user = localStorage.getItem('user');
      return user ? JSON.parse(user) : null;
    } catch {
      return null;
    }
  },

  setUser(user, token) {
    if (user) localStorage.setItem('user', JSON.stringify(user));
    if (token) localStorage.setItem('token', token);
  },

  getToken() {
    return localStorage.getItem('token');
  },

  isLoggedIn() {
    return !!this.getToken() && !!this.getUser();
  },

  hasRole(...roles) {
    const user = this.getUser();
    return user && roles.includes(user.role);
  },

  async login(email, password) {
    const data = await API.post('/auth/login', { email, password });
    if (data.success) {
      this.setUser(data.user, data.token);
      return data;
    }
    throw new Error(data.message);
  },

  async register(formData) {
    const data = await API.post('/auth/register', formData);
    if (data.success) {
      this.setUser(data.user, data.token);
      return data;
    }
    throw new Error(data.message);
  },

  logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    App.showToast('Logged out successfully', 'info');
    App.updateNav();
    window.location.hash = '#/';
  },

  async fetchProfile() {
    const data = await API.get('/auth/profile');
    if (data.success && data.user) {
      localStorage.setItem('user', JSON.stringify(data.user));
      return data.user;
    }
    return null;
  },

  async updateProfile(formData) {
    const data = await API.put('/auth/profile', formData);
    if (data.success && data.user) {
      localStorage.setItem('user', JSON.stringify(data.user));
      return data.user;
    }
    throw new Error(data.message);
  },

  fillDemo(role) {
    const emailField = document.getElementById('login-email');
    const passField = document.getElementById('login-password');
    if (!emailField || !passField) return;

    if (role === 'admin') {
      emailField.value = 'admin@college.edu';
      passField.value = 'adminpassword123';
    } else if (role === 'presenter') {
      emailField.value = 'dr.sarah@college.edu';
      passField.value = 'presenter123';
    } else if (role === 'student') {
      emailField.value = 'alex.morgan@college.edu';
      passField.value = 'student123';
    }
    App.showToast(`Auto-filled ${role.toUpperCase()} demo credentials!`, 'info');
  }
};

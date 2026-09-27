// API Client for College Event Presenter Management System

const API = {
  getBaseURL() {
    // If the frontend is served by Express on port 5000, use relative '/api'
    if (typeof window !== 'undefined' && window.location.port === '5000') {
      return '/api';
    }
    // If opened via VS Code Live Server (port 5500), file://, or another dev server, target localhost:5000
    return 'http://localhost:5000/api';
  },

  get baseURL() {
    return this.getBaseURL();
  },

  async request(endpoint, options = {}) {
    const token = localStorage.getItem('token');
    
    const headers = {
      'Content-Type': 'application/json',
      ...options.headers
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const config = {
      ...options,
      headers
    };

    try {
      const url = `${this.baseURL}${endpoint}`;
      const response = await fetch(url, config);
      const data = await response.json();

      if (!response.ok) {
        if (response.status === 401 && !endpoint.includes('/auth/login')) {
          // Token expired or invalid
          console.warn('[Auth] Session expired. Please log in again.');
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          if (window.location.hash !== '#/login') {
            window.location.hash = '#/login';
          }
        }
        throw new Error(data.message || 'API request failed');
      }

      return data;
    } catch (error) {
      if (error.message.includes('Failed to fetch') || error.name === 'TypeError') {
        const errorMsg = 'Cannot connect to backend server. Please make sure the server is running on http://localhost:5000';
        console.error(`[API Network Error]`, errorMsg);
        throw new Error(errorMsg);
      }
      console.error(`[API Error] ${endpoint}:`, error.message);
      throw error;
    }
  },

  get(endpoint, params = {}) {
    const queryString = new URLSearchParams(params).toString();
    const url = queryString ? `${endpoint}?${queryString}` : endpoint;
    return this.request(url, { method: 'GET' });
  },

  post(endpoint, body) {
    return this.request(endpoint, {
      method: 'POST',
      body: JSON.stringify(body)
    });
  },

  put(endpoint, body) {
    return this.request(endpoint, {
      method: 'PUT',
      body: JSON.stringify(body)
    });
  },

  delete(endpoint) {
    return this.request(endpoint, { method: 'DELETE' });
  },

  async downloadCSV(endpoint, filename) {
    const token = localStorage.getItem('token');
    const headers = {};
    if (token) headers['Authorization'] = `Bearer ${token}`;

    try {
      const res = await fetch(`${this.baseURL}${endpoint}`, { headers });
      if (!res.ok) throw new Error('Failed to download CSV');
      
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename || 'report.csv';
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error('[CSV Download Error]', err);
      throw err;
    }
  }
};

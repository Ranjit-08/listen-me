/**
 * config.js — ListenMe API client
 * Update API_BASE to your Frontend ALB DNS
 */

const API_BASE = 'http://YOUR-FRONTEND-ALB-DNS/api';  // ← change this

const api = {
  async req(method, path, body, auth = true) {
    const headers = { 'Content-Type': 'application/json' };
    if (auth) {
      const token = localStorage.getItem('token');
      if (token) headers['Authorization'] = 'Bearer ' + token;
    }
    const opts = { method, headers };
    if (body) opts.body = JSON.stringify(body);

    const res = await fetch(API_BASE + path, opts);
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      const err = new Error(data.error || 'Request failed');
      Object.assign(err, data);
      throw err;
    }
    return data;
  },

  get:    (path, auth=true)          => api.req('GET',    path, null, auth),
  post:   (path, body, auth=true)    => api.req('POST',   path, body, auth),
  delete: (path, auth=true)          => api.req('DELETE', path, null, auth),

  async upload(path, formData) {
    const token = localStorage.getItem('token');
    const headers = {};
    if (token) headers['Authorization'] = 'Bearer ' + token;
    const res = await fetch(API_BASE + path, { method: 'POST', headers, body: formData });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      const err = new Error(data.error || 'Upload failed');
      Object.assign(err, data);
      throw err;
    }
    return data;
  }
};

function requireAuth() {
  if (!localStorage.getItem('token')) window.location.href = 'login.html';
}

function getUser() {
  try { return JSON.parse(localStorage.getItem('user')); } catch(e) { return null; }
}

function isAdmin() {
  const u = getUser(); return u && u.is_admin;
}

function logout() {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
  window.location.href = 'login.html';
}
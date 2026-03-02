const API = {
  BASE: 'http://YOUR_EC2_PUBLIC_IP/api',  // ← Replace with your EC2 IP before deploying

  _headers() {
    const token = localStorage.getItem('aura_token') || sessionStorage.getItem('aura_token');
    const h = { 'Content-Type': 'application/json' };
    if (token) h['Authorization'] = `Bearer ${token}`;
    return h;
  },

  async get(path) {
    const res = await fetch(`${this.BASE}${path}`, { method:'GET', headers:this._headers() });
    if (res.status === 401) { localStorage.clear(); sessionStorage.clear(); window.location.href = 'login.html'; }
    return res.json();
  },

  async post(path, data) {
    const res = await fetch(`${this.BASE}${path}`, { method:'POST', headers:this._headers(), body:JSON.stringify(data) });
    if (res.status === 401) { localStorage.clear(); sessionStorage.clear(); window.location.href = 'login.html'; }
    return res.json();
  },

  async delete(path) {
    const res = await fetch(`${this.BASE}${path}`, { method:'DELETE', headers:this._headers() });
    return res.json();
  }
};
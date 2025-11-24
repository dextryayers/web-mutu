const base = import.meta.env.VITE_API_URL;

function url(path) {
  if (!base) throw new Error('VITE_API_URL is not set');
  return `${base.replace(/\/$/, '')}/${path.replace(/^\//, '')}`;
}

async function parseJson(r) {
  const ct = r.headers.get('content-type') || '';
  const text = await r.text();
  if (!ct.includes('application/json')) {
    try { return JSON.parse(text); } catch { throw new Error(text || `HTTP ${r.status}`); }
  }
  try { return JSON.parse(text); } catch { throw new Error(text || 'Invalid JSON'); }
}

async function request(path, options = {}) {
  const { method = 'GET' } = options;
  let r;
  try {
    const headers = new Headers(options.headers || {});
    const token = localStorage.getItem('mutu-token');
    if (token && !headers.has('Authorization')) headers.set('Authorization', `Bearer ${token}`);
    const opts = { ...options, headers };
    r = await fetch(url(path), opts);
    if (r.ok) return parseJson(r);
    // fallback for cPanel blocks on PUT/DELETE
    if ((method === 'PUT' || method === 'DELETE') && (r.status === 405 || r.status === 404 || r.status === 400)) {
      headers.set('X-HTTP-Method-Override', method);
      const rr = await fetch(url(path), { ...opts, method: 'POST', headers });
      if (rr.ok) return parseJson(rr);
      const errTxt = await rr.text();
      throw new Error(errTxt || `HTTP ${rr.status}`);
    }
    const errTxt = await r.text();
    throw new Error(errTxt || `HTTP ${r.status}`);
  } catch (e) {
    throw e;
  }
}

export async function getAkreditasi({ year, month } = {}) {
  const params = [];
  if (year) params.push(`year=${encodeURIComponent(year)}`);
  if (month) params.push(`month=${encodeURIComponent(month)}`);
  const qs = params.length ? `?${params.join('&')}` : '';
  return request(`akreditasi.php${qs}`);
}

export async function getAkreditasiPeriods() {
  return request('akreditasi.php?action=periods');
}

export async function updateAkreditasi(payload) {
  const { year, month, ...rest } = payload || {};
  const params = [];
  if (year) params.push(`year=${encodeURIComponent(year)}`);
  if (month) params.push(`month=${encodeURIComponent(month)}`);
  const qs = params.length ? `?${params.join('&')}` : '';
  return request(`akreditasi.php${qs}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...rest, year, month }) });
}

export async function getIndikators() {
  return request('indikators.php');
}

export async function createIndicator({ name, capaian = 0, target = 100, date = null }) {
  return request('indikators.php', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name, capaian, target, date }) });
}

export async function updateIndicator({ id, name, capaian, target, date = null, status }) {
  const payload = { name, capaian, target, date };
  if (status) payload.status = status;
  return request(`indikators.php?id=${encodeURIComponent(id)}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
}

export async function deleteIndicator(id) {
  return request(`indikators.php?id=${encodeURIComponent(id)}`, { method: 'DELETE' });
}

export async function replaceIndicators(items) {
  return request('indikators.php', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ items }) });
}

export async function getDocuments() {
  const arr = await request('documents.php');
  return arr.map(d => ({
    id: d.id,
    title: d.title,
    description: d.description || '',
    fileUrl: d.file_url || d.fileUrl,
    createdAt: d.created_at || d.createdAt
  }));
}

export async function uploadDocument(file, title, description) {
  const fd = new FormData();
  fd.set('file', file);
  if (title) fd.set('title', title);
  if (description) fd.set('description', description);
  const d = await request('documents.php', { method: 'POST', body: fd });
  return {
    id: d.id,
    title: d.title,
    description: d.description || '',
    fileUrl: d.file_url || d.fileUrl,
  };
}

export async function updateDocument(id, payload) {
  return request(`documents.php?id=${encodeURIComponent(id)}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
}

export async function deleteDocument(id) {
  return request(`documents.php?id=${encodeURIComponent(id)}`, { method: 'DELETE' });
}

// Auth
export async function register(username, password, email, phone, role = 'member', nik, fullName, city, instansi, recaptchaToken) {
  const payload = { username, password, email, phone, role, fullName };
  if (nik) payload.nik = nik;
  if (city) payload.city = city;
  if (instansi) payload.instansi = instansi;
  if (recaptchaToken) payload.recaptchaToken = recaptchaToken;
  return request('auth.php?action=register', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
}

export async function login(email, password, recaptchaToken) {
  const body = { email, password };
  if (recaptchaToken) body.recaptchaToken = recaptchaToken;
  const res = await request('auth.php?action=login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
  if (res.token) localStorage.setItem('mutu-token', res.token);
  return res;
}

export async function me() {
  return request('auth.php?action=me');
}

export async function logout() {
  try { await request('auth.php?action=logout', { method: 'POST' }); } catch {}
  localStorage.removeItem('mutu-token');
}

export async function getUsers() {
  return request('auth.php?action=users');
}

export async function deleteUser(id) {
  return request(`auth.php?action=users&id=${encodeURIComponent(id)}`, { method: 'DELETE' });
}

export async function updateUser(id, payload) {
  return request(`auth.php?action=users&id=${encodeURIComponent(id)}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
}

export async function createAdminUser({ username, password, email, phone, nik, fullName, city, instansi }, recaptchaToken) {
  const payload = { username, password, email, phone, nik, fullName, city, instansi };
  if (recaptchaToken) payload.recaptchaToken = recaptchaToken;
  return request('auth.php?action=create-admin', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
}

export async function updateProfile({ email, phone, password }) {
  const payload = {};
  if (email !== undefined) payload.email = email;
  if (phone !== undefined) payload.phone = phone;
  if (password) payload.password = password;
  return request('auth.php?action=profile', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
}

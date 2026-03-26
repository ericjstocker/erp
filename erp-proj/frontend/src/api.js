import store from './store'

const DEFAULT_BASE = 'http://localhost:8000'
const BASE = import.meta.env.VITE_API_BASE || DEFAULT_BASE

async function request(path, opts = {}) {
  const headers = { 'Content-Type': 'application/json' }
  const token = store.getToken()
  if (token) {
    headers['Authorization'] = `Bearer ${token}`
  }
  const res = await fetch(`${BASE}${path}`, {
    headers,
    ...opts,
  })
  if (!res.ok) {
    const txt = await res.text()
    if (res.status === 401) {
      store.logout()
      window.location.href = '/'
    }
    throw new Error(txt || res.status)
  }
  return res.headers.get('content-type')?.includes('application/json') ? res.json() : res.text()
}

export const api = {
  login: (username, password) => request('/login', { method: 'POST', body: JSON.stringify({ username, password }) }),
  listCustomers: () => request('/customers'),
  createCustomer: (body) => request('/customers', { method: 'POST', body: JSON.stringify(body) }),
  listJobs: () => request('/jobs'),
  createJob: (body) => request('/jobs', { method: 'POST', body: JSON.stringify(body) }),
  updateJob: (id, body) => request(`/jobs/${id}`, { method: 'PUT', body: JSON.stringify(body) }),
  listParts: () => request('/parts'),
  createPart: (body) => request('/parts', { method: 'POST', body: JSON.stringify(body) }),
  updatePart: (id, body) => request(`/parts/${id}`, { method: 'PUT', body: JSON.stringify(body) }),
  listMaterials: () => request('/materials'),
  createMaterial: (body) => request('/materials', { method: 'POST', body: JSON.stringify(body) }),
  listPOs: () => request('/pos'),
  createPO: (body) => request('/pos', { method: 'POST', body: JSON.stringify(body) }),
  updatePO: (id, body) => request(`/pos/${id}`, { method: 'PUT', body: JSON.stringify(body) }),
  // blueprint upload (multipart)
  uploadBlueprint: async (partId, file) => {
    const url = `${BASE}/blueprints/upload?part_id=${encodeURIComponent(partId)}`
    const fd = new FormData()
    fd.append('file', file, file.name)
    const token = store.getToken()
    const headers = {}
    if (token) {
      headers['Authorization'] = `Bearer ${token}`
    }
    const res = await fetch(url, { method: 'POST', body: fd, headers })
    if (!res.ok) throw new Error(await res.text())
    return res.json()
  }
}

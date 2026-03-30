import store from './store'

// Use VITE_API_BASE if set (e.g., /api or http://backend:8000)
// Otherwise use same origin for external access
const BASE = import.meta.env.VITE_API_BASE || (typeof window !== 'undefined' ? window.location.origin : 'http://localhost:8000')

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
  if (res.status === 204) return null
  return res.headers.get('content-type')?.includes('application/json') ? res.json() : res.text()
}

export const api = {
  login: (username, password) => request('/login', { method: 'POST', body: JSON.stringify({ username, password }) }),
  changePassword: (current_password, new_password) => request('/auth/change-password', { method: 'POST', body: JSON.stringify({ current_password, new_password }) }),
  listCustomers: () => request('/customers'),
  getCustomer: (id) => request(`/customers/${id}`),
  getCustomerJobs: (id) => request(`/customers/${id}/jobs`),
  createCustomer: (body) => request('/customers', { method: 'POST', body: JSON.stringify(body) }),
  updateCustomer: (id, body) => request(`/customers/${id}`, { method: 'PUT', body: JSON.stringify(body) }),
  updateMaterial: (id, body) => request(`/materials/${id}`, { method: 'PUT', body: JSON.stringify(body) }),
  listJobs: () => request('/jobs'),
  getJob: (id) => request(`/jobs/${id}`),
  getJobParts: (id) => request(`/jobs/${id}/parts`),
  createJob: (body) => request('/jobs', { method: 'POST', body: JSON.stringify(body) }),
  updateJob: (id, body) => request(`/jobs/${id}`, { method: 'PUT', body: JSON.stringify(body) }),
  listParts: () => request('/parts'),
  getPart: (id) => request(`/parts/${id}`),
  createPart: (body) => request('/parts', { method: 'POST', body: JSON.stringify(body) }),
  updatePart: (id, body) => request(`/parts/${id}`, { method: 'PUT', body: JSON.stringify(body) }),
  listMaterials: () => request('/materials'),
  getMaterial: (id) => request(`/materials/${id}`),
  createMaterial: (body) => request('/materials', { method: 'POST', body: JSON.stringify(body) }),
  deleteMaterial: (id) => request(`/materials/${id}`, { method: 'DELETE' }),
  listPOs: () => request('/pos'),
  createPO: (body) => request('/pos', { method: 'POST', body: JSON.stringify(body) }),
  updatePO: (id, body) => request(`/pos/${id}`, { method: 'PUT', body: JSON.stringify(body) }),
  // blueprint endpoints (multi-file)
  listBlueprints: (partId) => request(`/parts/${partId}/blueprints`),
  deleteBlueprint: (blueprintId) => request(`/blueprints/${blueprintId}`, { method: 'DELETE' }),
  downloadBlueprint: async (blueprintId, filename) => {
    const token = store.getToken()
    const res = await fetch(`${BASE}/blueprints/download/${blueprintId}`, {
      headers: token ? { 'Authorization': `Bearer ${token}` } : {}
    })
    if (!res.ok) throw new Error(await res.text())
    const blob = await res.blob()
    return { url: URL.createObjectURL(blob), filename }
  },
  uploadBlueprint: async (partId, file) => {
    const url = `${BASE}/blueprints/upload?part_id=${encodeURIComponent(partId)}`
    const fd = new FormData()
    fd.append('file', file, file.name)
    const token = store.getToken()
    const headers = token ? { 'Authorization': `Bearer ${token}` } : {}
    const res = await fetch(url, { method: 'POST', body: fd, headers })
    if (!res.ok) throw new Error(await res.text())
    return res.json()
  },
  // job document endpoints (multi-file PO uploads)
  listJobDocuments: (jobId) => request(`/jobs/${jobId}/documents`),
  deleteJobDocument: (docId) => request(`/job-documents/${docId}`, { method: 'DELETE' }),
  downloadJobDocument: async (docId, filename) => {
    const token = store.getToken()
    const res = await fetch(`${BASE}/job-documents/download/${docId}`, {
      headers: token ? { 'Authorization': `Bearer ${token}` } : {}
    })
    if (!res.ok) throw new Error(await res.text())
    const blob = await res.blob()
    return { url: URL.createObjectURL(blob), filename }
  },
  uploadJobDocument: async (jobId, file) => {
    const url = `${BASE}/job-documents/upload?job_id=${encodeURIComponent(jobId)}`
    const fd = new FormData()
    fd.append('file', file, file.name)
    const token = store.getToken()
    const headers = token ? { 'Authorization': `Bearer ${token}` } : {}
    const res = await fetch(url, { method: 'POST', body: fd, headers })
    if (!res.ok) throw new Error(await res.text())
    return res.json()
  }
}

export default api

import axios from 'axios'

const TOKEN_KEY = 'tsotra.access'
const REFRESH_KEY = 'tsotra.refresh'
const USER_KEY = 'tsotra.user'

export const auth = {
  get token() { return localStorage.getItem(TOKEN_KEY) },
  get refresh() { return localStorage.getItem(REFRESH_KEY) },
  get user() {
    try { return JSON.parse(localStorage.getItem(USER_KEY) || 'null') }
    catch { return null }
  },
  set({ access, refresh, user }) {
    if (access) localStorage.setItem(TOKEN_KEY, access)
    if (refresh) localStorage.setItem(REFRESH_KEY, refresh)
    if (user) localStorage.setItem(USER_KEY, JSON.stringify(user))
  },
  clear() {
    localStorage.removeItem(TOKEN_KEY)
    localStorage.removeItem(REFRESH_KEY)
    localStorage.removeItem(USER_KEY)
  },
  isLogged() { return !!localStorage.getItem(TOKEN_KEY) },
}

const client = axios.create({ baseURL: '/api' })

client.interceptors.request.use(config => {
  const t = auth.token
  if (t) config.headers.Authorization = `Bearer ${t}`
  return config
})

client.interceptors.response.use(
  r => r,
  err => {
    if (err?.response?.status === 401) {
      auth.clear()
    }
    return Promise.reject(err)
  },
)

export const api = {
  // public
  listOffers: (params) => client.get('/offers/', { params }),
  getOffer: (id) => client.get(`/offers/${id}/`),
  applyToOffer: (id, payload) => {
    const isFile = payload?.cv instanceof File
    if (isFile) {
      const fd = new FormData()
      Object.entries(payload).forEach(([k, v]) => v != null && fd.append(k, v))
      return client.post(`/offers/${id}/apply/`, fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
    }
    return client.post(`/offers/${id}/apply/`, payload)
  },
  reportOffer: (id, payload) => client.post(`/offers/${id}/report/`, payload),
  draftOffer: (payload) => client.post('/offers/draft/', payload),

  // auth
  register: (payload) => client.post('/auth/register/', payload),
  registerCandidate: (payload) => client.post('/auth/register-candidate/', payload),
  login: (payload) => client.post('/auth/login/', payload),
  me: () => client.get('/me/'),

  // recruiter
  myOffers: () => client.get('/me/offers/'),
  createOffer: (payload) => client.post('/me/offers/', payload),
  updateOffer: (id, payload) => client.patch(`/me/offers/${id}/`, payload),
  deleteOffer: (id) => client.delete(`/me/offers/${id}/`),
  myOfferApplications: (id) => client.get(`/me/offers/${id}/applications/`),
  setApplicationStatus: (id, status) =>
    client.patch(`/applications/${id}/`, { status }),

  // payments (mobile money)
  payOffer: (id, payload) => client.post(`/me/offers/${id}/pay/`, payload),
  simulatePayment: (paymentId, success) =>
    client.post(`/payments/${paymentId}/simulate/`, { success }),
  myOffer: (id) => client.get(`/me/offers/${id}/`),
}

export function flatErrors(err) {
  const data = err?.response?.data
  if (!data) return [err?.message || 'Erreur réseau']
  if (typeof data === 'string') return [data]
  if (data.detail) return [data.detail]
  return Object.entries(data).flatMap(([k, v]) =>
    Array.isArray(v) ? v.map(s => `${k}: ${s}`) : [`${k}: ${v}`]
  )
}

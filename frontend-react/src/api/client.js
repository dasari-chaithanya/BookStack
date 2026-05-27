import axios from 'axios'

const client = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/',
  withCredentials: false,
  headers: {
    'Content-Type': 'application/json',
  },
})

// ── Request interceptor: inject JWT Bearer token ──
client.interceptors.request.use((config) => {
  const token = localStorage.getItem('bookstack_token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// ── Response interceptor: normalize errors & handle 401 ──
client.interceptors.response.use(
  (res) => res,
  (err) => {
    // Pass through canceled/aborted requests untouched so callers can detect them
    if (axios.isCancel(err) || err.name === 'CanceledError' || err.code === 'ERR_CANCELED') {
      return Promise.reject(err)
    }

    if (err?.response?.status === 401) {
      // Only fire auth-expired if we had a token (not on login itself)
      if (localStorage.getItem('bookstack_token')) {
        localStorage.removeItem('bookstack_token')
        window.dispatchEvent(new CustomEvent('auth-expired'))
      }
    }
    const msg =
      err?.response?.data?.message ||
      err?.response?.data?.error ||
      'Something went wrong.'
    return Promise.reject(new Error(msg))
  }
)

export default client

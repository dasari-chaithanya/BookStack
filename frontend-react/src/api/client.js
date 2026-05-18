import axios from 'axios'

const client = axios.create({
  baseURL: '/',
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Request interceptor - inject JWT token
client.interceptors.request.use((config) => {
  const token = localStorage.getItem('bookstack_token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// Response interceptor — normalize errors
client.interceptors.response.use(
  (res) => res,
  (err) => {
    const msg =
      err?.response?.data?.error ||
      err?.response?.data?.message ||
      'Something went wrong.'
    return Promise.reject(new Error(msg))
  }
)

export default client

import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import client from '../api/client'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)       // { id, username, email }
  const [loading, setLoading] = useState(true) // initial session check

  // Broadcast token to the browser extension via content script
  const broadcastTokenToExtension = useCallback((token) => {
    try {
      window.postMessage({ type: 'BOOKSTACK_AUTH_TOKEN', token }, '*')
    } catch (e) {
      // Extension may not be installed — ignore silently
    }
  }, [])

  // Validate stored JWT token on mount
  useEffect(() => {
    const token = localStorage.getItem('bookstack_token')
    if (token) {
      client.get('/api/auth/status')
        .then((res) => {
          setUser({ username: res.data.data.username })
          // Sync token to extension on session restore
          broadcastTokenToExtension(token)
        })
        .catch(() => {
          localStorage.removeItem('bookstack_token')
          setUser(null)
          broadcastTokenToExtension(null)
        })
        .finally(() => setLoading(false))
    } else {
      setLoading(false)
    }
  }, [broadcastTokenToExtension])

  const login = useCallback(async (username, password) => {
    const res = await client.post('/api/auth/login', { username, password })
    const { token, user: userData } = res.data.data
    localStorage.setItem('bookstack_token', token)
    setUser({ username: userData.username, email: userData.email })
    // Sync token to extension on login
    broadcastTokenToExtension(token)
    return res.data
  }, [broadcastTokenToExtension])

  const register = useCallback(async (username, email, password) => {
    const res = await client.post('/api/auth/register', { username, email, password })
    return res.data
  }, [])

  const logout = useCallback(() => {
    localStorage.removeItem('bookstack_token')
    setUser(null)
    // Clear token from extension on logout
    broadcastTokenToExtension(null)
  }, [broadcastTokenToExtension])

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}

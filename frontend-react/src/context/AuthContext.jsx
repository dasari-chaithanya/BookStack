import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import client from '../api/client'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)       // { username, email }
  const [loading, setLoading] = useState(true) // initial session check

  // Check session on mount
  useEffect(() => {
    const token = localStorage.getItem('bookstack_token')
    if (token) {
      client.get('/api/status')
        .then((res) => setUser({ username: res.data.username }))
        .catch(() => {
          setUser(null)
          localStorage.removeItem('bookstack_token')
        })
        .finally(() => setLoading(false))
    } else {
      setLoading(false)
    }
  }, [])

  const login = useCallback(async (username, password) => {
    const res = await client.post('/api/auth/login', { username, password })
    localStorage.setItem('bookstack_token', res.data.token)
    setUser({ username: res.data.user.username, email: res.data.user.email })
    return res.data
  }, [])

  const register = useCallback(async (username, email, password) => {
    const res = await client.post('/api/auth/register', { username, email, password })
    return res.data
  }, [])

  const logout = useCallback(async () => {
    // JWT logout: simply remove the token client-side
    localStorage.removeItem('bookstack_token')
    setUser(null)
  }, [])

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

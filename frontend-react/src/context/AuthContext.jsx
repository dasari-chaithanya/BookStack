import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import client from '../api/client'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)       // { username }
  const [loading, setLoading] = useState(true) // initial session check

  // Check session on mount
  useEffect(() => {
    client.get('/api/status')
      .then((res) => setUser({ username: res.data.username }))
      .catch(() => setUser(null))
      .finally(() => setLoading(false))
  }, [])

  const login = useCallback(async (username, password) => {
    const res = await client.post('/api/login', { username, password })
    setUser({ username: res.data.user.username })
    return res.data
  }, [])

  const register = useCallback(async (username, email, password) => {
    // Backend uses username + password; email stored client-side for display
    const res = await client.post('/api/register', { username, password })
    return res.data
  }, [])

  const logout = useCallback(async () => {
    await client.post('/api/logout')
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

import { createContext, useContext, useState, useEffect, useCallback } from 'react'

const AuthContext = createContext(null)

const API  = import.meta.env.VITE_API_URL || 'http://localhost:8000'
const KEY  = 'who_afro_portal_token'

export function AuthProvider({ children }) {
  const [user,    setUser]    = useState(null)
  const [loading, setLoading] = useState(true)

  // Restore session from stored JWT
  useEffect(() => {
    const token = localStorage.getItem(KEY)
    if (!token) { setLoading(false); return }

    fetch(`${API}/api/auth/me`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(r => r.ok ? r.json() : Promise.reject('expired'))
      .then(u  => setUser({ ...u, token }))
      .catch(() => localStorage.removeItem(KEY))
      .finally(() => setLoading(false))
  }, [])

  const login = useCallback(async (email, password) => {
    try {
      const res = await fetch(`${API}/api/auth/login`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body:    new URLSearchParams({ username: email.trim().toLowerCase(), password }),
      })

      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        // FastAPI 422 returns detail as an array of Pydantic error objects — normalise to string
        const detail = err.detail
        const msg = typeof detail === 'string'
          ? detail
          : Array.isArray(detail)
            ? detail.map(d => d.msg).join(', ')
            : 'Invalid email or password'
        return { success: false, error: msg }
      }

      const data    = await res.json()
      const userObj = { ...data.user, token: data.access_token }
      localStorage.setItem(KEY, data.access_token)
      setUser(userObj)
      return { success: true, user: userObj }

    } catch {
      return { success: false, error: 'Cannot reach the server. Make sure the backend is running on port 8000.' }
    }
  }, [])

  const logout = useCallback(() => {
    setUser(null)
    localStorage.removeItem(KEY)
  }, [])

  return (
    <AuthContext.Provider value={{ user, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider')
  return ctx
}

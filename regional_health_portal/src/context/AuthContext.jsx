import { createContext, useContext, useState, useEffect } from 'react'

const AuthContext = createContext(null)

// Demo users — mirrors seed_users.py. Swap for real JWT calls when backend is live.
const MOCK_USERS = {
  nga_admin:     { password: 'password123', role: 'country_admin',  country_code: 'NGA', subregion: null,       full_name: 'Nigeria Admin' },
  gha_admin:     { password: 'password123', role: 'country_admin',  country_code: 'GHA', subregion: null,       full_name: 'Ghana Admin' },
  ken_admin:     { password: 'password123', role: 'country_admin',  country_code: 'KEN', subregion: null,       full_name: 'Kenya Admin' },
  zaf_admin:     { password: 'password123', role: 'country_admin',  country_code: 'ZAF', subregion: null,       full_name: 'South Africa Admin' },
  eth_admin:     { password: 'password123', role: 'country_admin',  country_code: 'ETH', subregion: null,       full_name: 'Ethiopia Admin' },
  cod_admin:     { password: 'password123', role: 'country_admin',  country_code: 'COD', subregion: null,       full_name: 'DR Congo Admin' },
  sen_admin:     { password: 'password123', role: 'country_admin',  country_code: 'SEN', subregion: null,       full_name: 'Senegal Admin' },
  cmr_admin:     { password: 'password123', role: 'country_admin',  country_code: 'CMR', subregion: null,       full_name: 'Cameroon Admin' },
  tza_admin:     { password: 'password123', role: 'country_admin',  country_code: 'TZA', subregion: null,       full_name: 'Tanzania Admin' },
  uga_admin:     { password: 'password123', role: 'country_admin',  country_code: 'UGA', subregion: null,       full_name: 'Uganda Admin' },
  west_admin:    { password: 'password123', role: 'regional_admin', country_code: null,  subregion: 'West',     full_name: 'West Africa Regional Admin' },
  central_admin: { password: 'password123', role: 'regional_admin', country_code: null,  subregion: 'Central',  full_name: 'Central Africa Regional Admin' },
  east_admin:    { password: 'password123', role: 'regional_admin', country_code: null,  subregion: 'East',     full_name: 'East Africa Regional Admin' },
  south_admin:   { password: 'password123', role: 'regional_admin', country_code: null,  subregion: 'Southern', full_name: 'Southern Africa Regional Admin' },
  super_admin:   { password: 'password123', role: 'super_admin',    country_code: null,  subregion: null,       full_name: 'Super Administrator' },
}

const STORAGE_KEY = 'who_afro_portal_user'

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      if (stored) setUser(JSON.parse(stored))
    } catch {
      localStorage.removeItem(STORAGE_KEY)
    }
    setLoading(false)
  }, [])

  const login = (username, password) => {
    const record = MOCK_USERS[username]
    if (!record || record.password !== password) {
      return { success: false, error: 'Invalid username or password' }
    }
    const userObj = {
      username,
      role: record.role,
      country_code: record.country_code,
      subregion: record.subregion,
      full_name: record.full_name,
    }
    setUser(userObj)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(userObj))
    return { success: true, user: userObj }
  }

  const logout = () => {
    setUser(null)
    localStorage.removeItem(STORAGE_KEY)
  }

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

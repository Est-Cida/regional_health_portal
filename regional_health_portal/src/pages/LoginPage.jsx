import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

const DEMO_HINTS = [
  { label: 'Country Admin (Nigeria)',      username: 'nga_admin',     desc: 'See only Nigeria data' },
  { label: 'Country Admin (Kenya)',        username: 'ken_admin',     desc: 'See only Kenya data' },
  { label: 'Regional Admin (West Africa)',  username: 'west_admin',    desc: 'See 7 West African countries' },
  { label: 'Regional Admin (East Africa)', username: 'east_admin',    desc: 'See 5 East African countries' },
  { label: 'Super Admin',                  username: 'super_admin',   desc: 'Full access to all 20 countries' },
]

const REDIRECT = {
  country_admin:  '/country',
  regional_admin: '/region',
  super_admin:    '/admin',
}

export default function LoginPage() {
  const { login } = useAuth()
  const navigate = useNavigate()

  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError]       = useState('')
  const [loading, setLoading]   = useState(false)

  const handleSubmit = (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    setTimeout(() => {
      const result = login(username.trim(), password)
      setLoading(false)
      if (result.success) {
        navigate(REDIRECT[result.user.role] || '/country')
      } else {
        setError(result.error)
      }
    }, 300)
  }

  const fillHint = (hint) => {
    setUsername(hint.username)
    setPassword('password123')
    setError('')
  }

  return (
    <div className="login-page">
      {/* Left panel */}
      <div className="login-hero">
        <div className="login-hero-content">
          <div className="login-globe">
            <svg width="80" height="80" viewBox="0 0 80 80" fill="none">
              <circle cx="40" cy="40" r="38" fill="white" fillOpacity="0.15" stroke="white" strokeWidth="2"/>
              <circle cx="40" cy="40" r="28" stroke="white" strokeWidth="1.5" fill="none"/>
              <line x1="4" y1="40" x2="76" y2="40" stroke="white" strokeWidth="1.5"/>
              <line x1="40" y1="4" x2="40" y2="76" stroke="white" strokeWidth="1.5"/>
              <ellipse cx="40" cy="40" rx="14" ry="38" stroke="white" strokeWidth="1.5" fill="none"/>
            </svg>
          </div>
          <h1 className="login-hero-title">WHO AFRO</h1>
          <h2 className="login-hero-subtitle">Regional Health<br />Surveillance Portal</h2>
          <p className="login-hero-desc">
            Real-time disease surveillance, outbreak monitoring, and
            health system capacity tracking across the WHO African Region.
          </p>

          <div className="login-stats">
            <div className="login-stat">
              <div className="login-stat-value">20</div>
              <div className="login-stat-label">Countries</div>
            </div>
            <div className="login-stat">
              <div className="login-stat-value">4</div>
              <div className="login-stat-label">Sub-regions</div>
            </div>
            <div className="login-stat">
              <div className="login-stat-value">7</div>
              <div className="login-stat-label">Diseases tracked</div>
            </div>
            <div className="login-stat">
              <div className="login-stat-value">2021–25</div>
              <div className="login-stat-label">Data coverage</div>
            </div>
          </div>
        </div>
      </div>

      {/* Right panel — login form */}
      <div className="login-form-panel">
        <div className="login-form-container">
          <div className="login-form-header">
            <h2 className="login-form-title">Sign in</h2>
            <p className="login-form-subtitle">Access your surveillance dashboard</p>
          </div>

          {error && (
            <div className="login-error">
              <span>⚠</span> {error}
            </div>
          )}

          <form className="login-form" onSubmit={handleSubmit}>
            <div className="form-field">
              <label htmlFor="username">Username</label>
              <input
                id="username"
                type="text"
                autoComplete="username"
                value={username}
                onChange={e => setUsername(e.target.value)}
                placeholder="e.g. nga_admin"
                required
              />
            </div>

            <div className="form-field">
              <label htmlFor="password">Password</label>
              <input
                id="password"
                type="password"
                autoComplete="current-password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="Enter password"
                required
              />
            </div>

            <button className="btn-login" type="submit" disabled={loading}>
              {loading ? 'Signing in…' : 'Sign in'}
            </button>
          </form>

          {/* Demo accounts */}
          <div className="demo-section">
            <div className="demo-title">Demo accounts — password: <code>password123</code></div>
            <div className="demo-hints">
              {DEMO_HINTS.map(h => (
                <button key={h.username} className="demo-hint-btn" onClick={() => fillHint(h)}>
                  <div className="demo-hint-label">{h.label}</div>
                  <div className="demo-hint-desc">{h.desc}</div>
                </button>
              ))}
            </div>
          </div>

          <p className="login-footer">
            WHO African Region Office · Brazzaville, Congo
          </p>
        </div>
      </div>
    </div>
  )
}

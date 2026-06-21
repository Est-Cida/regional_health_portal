import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

const ALLOWED_DOMAINS = ['gmail.com', 'yahoo.com', 'who.int']

const REDIRECT = {
  country_admin:  '/country',
  regional_admin: '/region',
  super_admin:    '/admin',
}

function validateEmail(email) {
  if (!email) return 'Email is required'
  const match = email.trim().match(/^[^\s@]+@([^\s@]+)$/)
  if (!match) return 'Enter a valid email address'
  if (!ALLOWED_DOMAINS.includes(match[1].toLowerCase())) {
    return 'Only @gmail.com, @yahoo.com or @who.int addresses are accepted'
  }
  return null
}

export default function LoginPage() {
  const { login } = useAuth()
  const navigate = useNavigate()

  const [email,      setEmail]      = useState('')
  const [password,   setPassword]   = useState('')
  const [emailError, setEmailError] = useState('')
  const [error,      setError]      = useState('')
  const [loading,    setLoading]    = useState(false)

  const handleEmailBlur = () => {
    setEmailError(validateEmail(email) || '')
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')

    const emailErr = validateEmail(email)
    if (emailErr) {
      setEmailError(emailErr)
      return
    }

    setLoading(true)
    const result = await login(email, password)
    setLoading(false)
    if (result.success) {
      navigate(REDIRECT[result.user.role] || '/country')
    } else {
      setError(result.error)
    }
  }

  return (
    <div className="login-page">
      {/* Left panel */}
      <div className="login-hero">
        <div className="login-hero-content">
          <div className="login-globe">
            {/* <img src="/WHO AFRO.png" alt="WHO Logo" /> */}
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
              <label htmlFor="email">Email address</label>
              <input
                id="email"
                type="email"
                autoComplete="email"
                value={email}
                onChange={e => { setEmail(e.target.value); if (emailError) setEmailError('') }}
                onBlur={handleEmailBlur}
                placeholder="you@who.int"
                required
                className={emailError ? 'input-error' : ''}
              />
              {emailError && <span className="field-error">{emailError}</span>}
              <span className="field-hint">Accepted: @gmail.com · @yahoo.com · @who.int</span>
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

          <p className="login-footer">
            WHO African Region Office · Brazzaville, Congo
          </p>
        </div>
      </div>
    </div>
  )
}

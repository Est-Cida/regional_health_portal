import { useState } from 'react'
import { useAuth } from '../context/AuthContext'
import Navbar from '../components/Layout/Navbar'
import Sidebar from '../components/Layout/Sidebar'

const API = import.meta.env.VITE_API_URL || 'http://localhost:8000'

const ROLE_LABEL = {
  country_admin:  'Country Admin',
  regional_admin: 'Regional Admin',
  super_admin:    'Super Admin',
}

const ROLE_COLOR = {
  country_admin:  { text: '#059669', bg: '#F0FFF4', border: '#059669' },
  regional_admin: { text: '#D97706', bg: '#FFF8ED', border: '#D97706' },
  super_admin:    { text: '#7B2D8B', bg: '#F5F0FF', border: '#7B2D8B' },
}

function ReadOnlyField({ label, value }) {
  return (
    <div>
      <label className="form-label">{label}</label>
      <div style={{
        border: '1.5px solid #E5EAF0', borderRadius: 7, padding: '8px 10px',
        fontSize: 14, color: '#6B7C93', background: '#F8FAFC',
      }}>
        {value || '—'}
      </div>
    </div>
  )
}

function StatusBanner({ status }) {
  if (!status) return null
  const isSuccess = status.type === 'success'
  return (
    <div style={{
      padding: '10px 14px', borderRadius: 8, fontSize: 13, fontWeight: 500,
      marginBottom: 16,
      background: isSuccess ? '#F0FFF4' : '#FFF0F0',
      border:     `1px solid ${isSuccess ? '#6EE7B7' : '#FCA5A5'}`,
      color:      isSuccess ? '#059669'  : '#C00000',
    }}>
      {status.message}
    </div>
  )
}

export default function ProfileSettings() {
  const { user, updateUser } = useAuth()

  const roleColor = ROLE_COLOR[user.role] || ROLE_COLOR.country_admin

  // ── Profile form ──────────────────────────────────────────────────────────
  const [profile, setProfile] = useState({
    full_name: user.full_name || '',
    email:     user.email     || '',
  })
  const [profileStatus,  setProfileStatus]  = useState(null)
  const [profileSaving,  setProfileSaving]  = useState(false)

  async function saveProfile(e) {
    e.preventDefault()
    if (!profile.full_name.trim() || !profile.email.trim()) {
      setProfileStatus({ type: 'error', message: 'Full name and email are required' })
      return
    }
    setProfileSaving(true)
    setProfileStatus(null)
    try {
      const res = await fetch(`${API}/api/auth/profile`, {
        method:  'PUT',
        headers: { Authorization: `Bearer ${user.token}`, 'Content-Type': 'application/json' },
        body:    JSON.stringify({ full_name: profile.full_name.trim(), email: profile.email.trim() }),
      })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.detail || 'Failed to save profile')
      }
      const updated = await res.json()
      updateUser({ full_name: updated.full_name, email: updated.email })
      setProfileStatus({ type: 'success', message: 'Profile updated successfully' })
    } catch (err) {
      setProfileStatus({ type: 'error', message: err.message })
    } finally {
      setProfileSaving(false)
    }
  }

  // ── Password form ─────────────────────────────────────────────────────────
  const [passwords, setPasswords] = useState({
    current_password: '',
    new_password:     '',
    confirm_password: '',
  })
  const [passwordStatus,  setPasswordStatus]  = useState(null)
  const [passwordSaving,  setPasswordSaving]  = useState(false)

  async function savePassword(e) {
    e.preventDefault()
    if (!passwords.current_password || !passwords.new_password || !passwords.confirm_password) {
      setPasswordStatus({ type: 'error', message: 'All password fields are required' })
      return
    }
    if (passwords.new_password.length < 6) {
      setPasswordStatus({ type: 'error', message: 'New password must be at least 6 characters' })
      return
    }
    if (passwords.new_password !== passwords.confirm_password) {
      setPasswordStatus({ type: 'error', message: 'New passwords do not match' })
      return
    }
    setPasswordSaving(true)
    setPasswordStatus(null)
    try {
      const res = await fetch(`${API}/api/auth/change-password`, {
        method:  'POST',
        headers: { Authorization: `Bearer ${user.token}`, 'Content-Type': 'application/json' },
        body:    JSON.stringify({
          current_password: passwords.current_password,
          new_password:     passwords.new_password,
        }),
      })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.detail || 'Failed to change password')
      }
      setPasswords({ current_password: '', new_password: '', confirm_password: '' })
      setPasswordStatus({ type: 'success', message: 'Password changed successfully' })
    } catch (err) {
      setPasswordStatus({ type: 'error', message: err.message })
    } finally {
      setPasswordSaving(false)
    }
  }

  // ── Render ────────────────────────────────────────────────────────────────

  const scopeLabel =
    user.role === 'country_admin'  ? user.country_code
    : user.role === 'regional_admin' ? `${user.subregion} Africa`
    : 'All Regions'

  return (
    <div className="app-layout">
      <Sidebar />
      <div className="page-wrapper">
        <Navbar />
        <main className="page-main">

          {/* Header */}
          <div className="page-header">
            <div className="page-header-left">
              <div className="page-breadcrumb">Account</div>
              <h1 className="page-title">Profile Settings</h1>
              <p className="page-desc">Manage your personal information and password</p>
            </div>
          </div>

          {/* Avatar + identity banner */}
          <section className="section">
            <div className="card" style={{ padding: '24px 28px', display: 'flex', alignItems: 'center', gap: 20 }}>
              <div style={{
                width: 64, height: 64, borderRadius: '50%',
                background: roleColor.bg,
                border: `2px solid ${roleColor.border}`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 26, fontWeight: 700, color: roleColor.text,
                flexShrink: 0,
              }}>
                {(user.full_name || user.username || '?').charAt(0).toUpperCase()}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                  <span style={{ fontSize: 18, fontWeight: 700, color: '#1A2B4A' }}>{user.full_name || '—'}</span>
                  <span style={{
                    fontSize: 11, fontWeight: 700, padding: '2px 10px', borderRadius: 99,
                    background: roleColor.bg, color: roleColor.text, border: `1px solid ${roleColor.border}`,
                  }}>
                    {ROLE_LABEL[user.role]}
                  </span>
                </div>
                <div style={{ fontSize: 13, color: '#6B7C93', marginTop: 3 }}>
                  @{user.username}
                  {scopeLabel && (
                    <span style={{ marginLeft: 12, fontWeight: 500, color: roleColor.text }}>{scopeLabel}</span>
                  )}
                </div>
              </div>
            </div>
          </section>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: 20 }}>

            {/* ── Profile Information ────────────────────────────────────── */}
            <section className="section" style={{ margin: 0 }}>
              <div className="card">
                <div className="card-header">
                  <h2 className="card-title">Profile Information</h2>
                </div>
                <form className="modal-form" onSubmit={saveProfile} noValidate>
                  <div style={{ display: 'grid', gap: 14, marginBottom: 20 }}>
                    <ReadOnlyField label="Username" value={user.username} />
                    <ReadOnlyField label="Role"     value={ROLE_LABEL[user.role]} />
                    {scopeLabel && (
                      <ReadOnlyField label="Scope" value={scopeLabel} />
                    )}
                    <div>
                      <label className="form-label">Full Name *</label>
                      <input
                        className="form-input"
                        value={profile.full_name}
                        onChange={e => setProfile(p => ({ ...p, full_name: e.target.value }))}
                        placeholder="Your full name"
                      />
                    </div>
                    <div>
                      <label className="form-label">Email Address *</label>
                      <input
                        className="form-input"
                        type="email"
                        value={profile.email}
                        onChange={e => setProfile(p => ({ ...p, email: e.target.value }))}
                        placeholder="your.email@who.int"
                      />
                    </div>
                  </div>

                  <StatusBanner status={profileStatus} />

                  <div className="modal-actions">
                    <button
                      type="submit"
                      className="btn-primary"
                      disabled={profileSaving}
                    >
                      {profileSaving ? 'Saving…' : 'Save Changes'}
                    </button>
                  </div>
                </form>
              </div>
            </section>

            {/* ── Change Password ────────────────────────────────────────── */}
            <section className="section" style={{ margin: 0 }}>
              <div className="card">
                <div className="card-header">
                  <h2 className="card-title">Change Password</h2>
                </div>
                <form className="modal-form" onSubmit={savePassword} noValidate>
                  <div style={{ display: 'grid', gap: 14, marginBottom: 20 }}>
                    <div>
                      <label className="form-label">Current Password *</label>
                      <input
                        className="form-input"
                        type="password"
                        value={passwords.current_password}
                        onChange={e => setPasswords(p => ({ ...p, current_password: e.target.value }))}
                        placeholder="Enter current password"
                        autoComplete="current-password"
                      />
                    </div>
                    <div>
                      <label className="form-label">New Password *</label>
                      <input
                        className="form-input"
                        type="password"
                        value={passwords.new_password}
                        onChange={e => setPasswords(p => ({ ...p, new_password: e.target.value }))}
                        placeholder="Min. 6 characters"
                        autoComplete="new-password"
                      />
                    </div>
                    <div>
                      <label className="form-label">Confirm New Password *</label>
                      <input
                        className={`form-input${
                          passwords.confirm_password && passwords.confirm_password !== passwords.new_password
                            ? ' form-input-error' : ''
                        }`}
                        type="password"
                        value={passwords.confirm_password}
                        onChange={e => setPasswords(p => ({ ...p, confirm_password: e.target.value }))}
                        placeholder="Repeat new password"
                        autoComplete="new-password"
                      />
                      {passwords.confirm_password && passwords.confirm_password !== passwords.new_password && (
                        <p className="form-error" style={{ marginTop: 4 }}>Passwords do not match</p>
                      )}
                    </div>
                  </div>

                  <StatusBanner status={passwordStatus} />

                  <div className="modal-actions">
                    <button
                      type="submit"
                      className="btn-primary"
                      disabled={passwordSaving}
                    >
                      {passwordSaving ? 'Saving…' : 'Change Password'}
                    </button>
                  </div>
                </form>
              </div>
            </section>

          </div>

        </main>
      </div>
    </div>
  )
}

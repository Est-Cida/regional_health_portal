import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '../context/AuthContext'
import Navbar from '../components/Layout/Navbar'
import Sidebar from '../components/Layout/Sidebar'
import { getCountries, SUBREGIONS } from '../data/dataService'

const API = import.meta.env.VITE_API_URL || 'http://localhost:8000'

const ALL_COUNTRIES = getCountries()

const ROLE_OPTIONS = [
  { value: 'country_admin',  label: 'Country Admin'  },
  { value: 'regional_admin', label: 'Regional Admin' },
  { value: 'super_admin',    label: 'Super Admin'    },
]

const ROLE_COLOR = {
  country_admin:  { text: '#059669', bg: '#F0FFF4', border: '#059669' },
  regional_admin: { text: '#D97706', bg: '#FFF8ED', border: '#D97706' },
  super_admin:    { text: '#7B2D8B', bg: '#F5F0FF', border: '#7B2D8B' },
}

const ROLE_SECTION_LABEL = {
  super_admin:    'Super Admins',
  regional_admin: 'Regional Admins',
  country_admin:  'Country Admins',
}

const EMPTY_FORM = {
  full_name: '', username: '', email: '',
  role: 'country_admin', country_code: '', subregion: '', password: '',
}

// ── SVG icons ──────────────────────────────────────────────────────────────────

const IconEdit = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
  </svg>
)

const IconKey = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="11" width="18" height="11" rx="2"/>
    <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
  </svg>
)

const IconBan = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
    <circle cx="12" cy="12" r="10"/>
    <line x1="4.93" y1="4.93" x2="19.07" y2="19.07"/>
  </svg>
)

const IconCheck = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="20 6 9 17 4 12"/>
  </svg>
)

const IconTrash = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="3 6 5 6 21 6"/>
    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/>
  </svg>
)

export default function UserManagement() {
  const { user: currentUser } = useAuth()

  const [users,         setUsers]         = useState([])
  const [loading,       setLoading]       = useState(true)
  const [fetchError,    setFetchError]    = useState(null)

  const [modal,         setModal]         = useState(null)   // null | { mode: 'add'|'edit'|'reset', target?: user }
  const [form,          setForm]          = useState(EMPTY_FORM)
  const [formError,     setFormError]     = useState(null)
  const [saving,        setSaving]        = useState(false)

  const [confirmDelete, setConfirmDelete] = useState(null)   // user object to delete

  const authHeaders = {
    Authorization:  `Bearer ${currentUser.token}`,
    'Content-Type': 'application/json',
  }

  // ── Data fetching ─────────────────────────────────────────────────────────

  const fetchUsers = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch(`${API}/api/users/`, {
        headers: { Authorization: `Bearer ${currentUser.token}` },
      })
      if (!res.ok) throw new Error('Could not load users')
      setUsers(await res.json())
      setFetchError(null)
    } catch (e) {
      setFetchError(e.message)
    } finally {
      setLoading(false)
    }
  }, [currentUser.token])

  useEffect(() => { fetchUsers() }, [fetchUsers])

  // ── Modal helpers ─────────────────────────────────────────────────────────

  function openAdd() {
    setForm(EMPTY_FORM)
    setFormError(null)
    setModal({ mode: 'add' })
  }

  function openEdit(u) {
    setForm({
      full_name:    u.full_name    || '',
      username:     u.username,
      email:        u.email        || '',
      role:         u.role,
      country_code: u.country_code || '',
      subregion:    u.subregion    || '',
      password:     '',
    })
    setFormError(null)
    setModal({ mode: 'edit', target: u })
  }

  function openReset(u) {
    setForm({ ...EMPTY_FORM, password: '' })
    setFormError(null)
    setModal({ mode: 'reset', target: u })
  }

  function setField(key, value) {
    setForm(f => ({ ...f, [key]: value }))
  }

  // ── Save handlers ─────────────────────────────────────────────────────────

  async function handleSave() {
    setFormError(null)
    setSaving(true)
    try {
      if (modal.mode === 'add') {
        if (!form.full_name.trim() || !form.username.trim() || !form.email.trim() || !form.password.trim()) {
          setFormError('Full name, username, email and password are all required')
          return
        }
        if (form.role === 'country_admin' && !form.country_code) {
          setFormError('Please select a country for this user')
          return
        }
        if (form.role === 'regional_admin' && !form.subregion) {
          setFormError('Please select a region for this user')
          return
        }
        const res = await fetch(`${API}/api/users/`, {
          method: 'POST',
          headers: authHeaders,
          body: JSON.stringify({
            full_name:    form.full_name.trim(),
            username:     form.username.trim(),
            email:        form.email.trim(),
            role:         form.role,
            country_code: form.role === 'country_admin'  ? form.country_code : null,
            subregion:    form.role === 'regional_admin' ? form.subregion    : null,
            password:     form.password,
          }),
        })
        if (!res.ok) { const e = await res.json(); throw new Error(e.detail || 'Failed to create user') }

      } else if (modal.mode === 'edit') {
        if (!form.full_name.trim() || !form.email.trim()) {
          setFormError('Full name and email are required')
          return
        }
        const res = await fetch(`${API}/api/users/${modal.target.id}`, {
          method: 'PUT',
          headers: authHeaders,
          body: JSON.stringify({
            full_name:    form.full_name.trim(),
            email:        form.email.trim(),
            role:         form.role,
            country_code: form.role === 'country_admin'  ? form.country_code : null,
            subregion:    form.role === 'regional_admin' ? form.subregion    : null,
          }),
        })
        if (!res.ok) { const e = await res.json(); throw new Error(e.detail || 'Failed to update user') }

      } else if (modal.mode === 'reset') {
        if (!form.password.trim() || form.password.length < 6) {
          setFormError('Password must be at least 6 characters')
          return
        }
        const res = await fetch(`${API}/api/users/${modal.target.id}/reset-password`, {
          method: 'POST',
          headers: authHeaders,
          body: JSON.stringify({ new_password: form.password }),
        })
        if (!res.ok) { const e = await res.json(); throw new Error(e.detail || 'Failed to reset password') }
      }

      setModal(null)
      fetchUsers()
    } catch (e) {
      setFormError(e.message)
    } finally {
      setSaving(false)
    }
  }

  async function handleToggleActive(u) {
    await fetch(`${API}/api/users/${u.id}`, {
      method: 'PUT',
      headers: authHeaders,
      body: JSON.stringify({ is_active: u.is_active ? 0 : 1 }),
    })
    fetchUsers()
  }

  async function handleDelete() {
    try {
      const res = await fetch(`${API}/api/users/${confirmDelete.id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${currentUser.token}` },
      })
      if (!res.ok) { const e = await res.json(); throw new Error(e.detail || 'Failed to delete') }
      setConfirmDelete(null)
      fetchUsers()
    } catch (e) {
      alert(e.message)
    }
  }

  // ── Derived data ──────────────────────────────────────────────────────────

  const grouped = {
    super_admin:    users.filter(u => u.role === 'super_admin'),
    regional_admin: users.filter(u => u.role === 'regional_admin'),
    country_admin:  users.filter(u => u.role === 'country_admin'),
  }

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="app-layout">
      <Sidebar />
      <div className="page-wrapper">
        <Navbar />
        <main className="page-main">

          {/* Header */}
          <div className="page-header">
            <div className="page-header-left">
              <div className="page-breadcrumb">Super Admin</div>
              <h1 className="page-title">User Management</h1>
              <p className="page-desc">{users.length} registered users across all roles</p>
            </div>
            <div className="page-header-controls">
              <button className="btn-add-record" onClick={openAdd}>
                + Add User
              </button>
            </div>
          </div>

          {/* Fetch error */}
          {fetchError && (
            <div style={{ background: '#FFF0F0', border: '1px solid #FCA5A5', borderRadius: 8, padding: '12px 16px', color: '#C00000', marginBottom: 16, fontSize: 13 }}>
              {fetchError}
            </div>
          )}

          {loading ? (
            <div className="page-loading">Loading users…</div>
          ) : (
            ['super_admin', 'regional_admin', 'country_admin'].map(role => {
              const rows  = grouped[role]
              const color = ROLE_COLOR[role]
              if (!rows.length) return null
              return (
                <section className="section" key={role}>
                  <div className="card">
                    <div className="card-header">
                      <div>
                        <h2 className="card-title" style={{ color: color.text }}>{ROLE_SECTION_LABEL[role]}</h2>
                      </div>
                      <span style={{ fontSize: 12, color: '#6B7C93' }}>
                        {rows.length} user{rows.length !== 1 ? 's' : ''}
                      </span>
                    </div>

                    <div className="table-wrapper">
                      <table className="data-table">
                        <thead>
                          <tr>
                            <th>Name</th>
                            <th>Username</th>
                            <th>Email</th>
                            <th>Scope</th>
                            <th>Status</th>
                            <th className="actions-col">Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {rows.map(u => (
                            <tr key={u.id} style={{ opacity: u.is_active ? 1 : 0.5 }}>
                              <td>
                                <strong>{u.full_name || '—'}</strong>
                                {u.id === currentUser.id && (
                                  <span style={{ fontSize: 10, fontWeight: 700, marginLeft: 6, background: color.bg, color: color.text, border: `1px solid ${color.border}`, borderRadius: 99, padding: '1px 7px' }}>
                                    You
                                  </span>
                                )}
                              </td>
                              <td><span className="mono">{u.username}</span></td>
                              <td style={{ color: '#6B7C93', fontSize: 12.5 }}>{u.email || '—'}</td>
                              <td>
                                {u.role === 'country_admin' && u.country_code ? (
                                  <span className="subregion-pill" style={{ background: '#EBF5FF', color: '#0071BC' }}>{u.country_code}</span>
                                ) : u.role === 'regional_admin' && u.subregion ? (
                                  <span className="subregion-pill" style={{ background: '#FFF8ED', color: '#D97706' }}>{u.subregion} Africa</span>
                                ) : (
                                  <span style={{ color: '#6B7C93', fontSize: 12 }}>All regions</span>
                                )}
                              </td>
                              <td>
                                <span style={{
                                  fontSize: 11, fontWeight: 600, padding: '2px 10px', borderRadius: 99, border: '1px solid',
                                  color:       u.is_active ? '#059669' : '#9CA3AF',
                                  borderColor: u.is_active ? '#059669' : '#D1D5DB',
                                  background:  u.is_active ? '#F0FFF4' : '#F9FAFB',
                                }}>
                                  {u.is_active ? 'Active' : 'Inactive'}
                                </span>
                              </td>
                              <td>
                                <div style={{ display: 'flex', gap: 2, justifyContent: 'center' }}>
                                  <button
                                    className="btn-action btn-action-edit"
                                    title="Edit user"
                                    onClick={() => openEdit(u)}
                                  >
                                    <IconEdit />
                                  </button>
                                  <button
                                    className="btn-action"
                                    title="Reset password"
                                    style={{ color: '#D97706' }}
                                    onClick={() => openReset(u)}
                                  >
                                    <IconKey />
                                  </button>
                                  {u.id !== currentUser.id && (
                                    <button
                                      className="btn-action"
                                      title={u.is_active ? 'Deactivate' : 'Activate'}
                                      style={{ color: u.is_active ? '#6B7C93' : '#059669' }}
                                      onClick={() => handleToggleActive(u)}
                                    >
                                      {u.is_active ? <IconBan /> : <IconCheck />}
                                    </button>
                                  )}
                                  {u.id !== currentUser.id && (
                                    <button
                                      className="btn-action btn-action-delete"
                                      title="Delete user"
                                      onClick={() => setConfirmDelete(u)}
                                    >
                                      <IconTrash />
                                    </button>
                                  )}
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </section>
              )
            })
          )}

          {/* ── Add / Edit modal ─────────────────────────────────────────── */}
          {modal && modal.mode !== 'reset' && (
            <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setModal(null)}>
              <div className="modal">
                <div className="modal-header">
                  <h3 className="modal-title">{modal.mode === 'add' ? 'Add New User' : 'Edit User'}</h3>
                  <button className="modal-close" onClick={() => setModal(null)}>✕</button>
                </div>

                <div className="modal-form">
                  <div className="modal-fields-grid">
                    <div>
                      <label className="form-label">Full Name *</label>
                      <input
                        className="form-input"
                        value={form.full_name}
                        onChange={e => setField('full_name', e.target.value)}
                        placeholder="e.g. Jane Doe"
                      />
                    </div>
                    <div>
                      <label className="form-label">Username *</label>
                      <input
                        className="form-input"
                        value={form.username}
                        onChange={e => setField('username', e.target.value)}
                        placeholder="e.g. jane.doe"
                        disabled={modal.mode === 'edit'}
                        style={modal.mode === 'edit' ? { background: '#F1F5F9', color: '#6B7C93' } : {}}
                      />
                    </div>
                    <div className="form-field-wide">
                      <label className="form-label">Email Address *</label>
                      <input
                        className="form-input"
                        type="email"
                        value={form.email}
                        onChange={e => setField('email', e.target.value)}
                        placeholder="e.g. jane.doe@who.int"
                      />
                    </div>
                    <div>
                      <label className="form-label">Role *</label>
                      <select
                        className="form-input"
                        value={form.role}
                        onChange={e => setField('role', e.target.value)}
                      >
                        {ROLE_OPTIONS.map(r => (
                          <option key={r.value} value={r.value}>{r.label}</option>
                        ))}
                      </select>
                    </div>

                    {form.role === 'country_admin' && (
                      <div>
                        <label className="form-label">Country *</label>
                        <select
                          className="form-input"
                          value={form.country_code}
                          onChange={e => setField('country_code', e.target.value)}
                        >
                          <option value="">Select country…</option>
                          {ALL_COUNTRIES.map(c => (
                            <option key={c.iso_3_code} value={c.iso_3_code}>{c.country_name}</option>
                          ))}
                        </select>
                      </div>
                    )}

                    {form.role === 'regional_admin' && (
                      <div>
                        <label className="form-label">Region *</label>
                        <select
                          className="form-input"
                          value={form.subregion}
                          onChange={e => setField('subregion', e.target.value)}
                        >
                          <option value="">Select region…</option>
                          {SUBREGIONS.map(s => (
                            <option key={s} value={s}>{s} Africa</option>
                          ))}
                        </select>
                      </div>
                    )}

                    {modal.mode === 'add' && (
                      <div>
                        <label className="form-label">Temporary Password *</label>
                        <input
                          className="form-input"
                          type="password"
                          value={form.password}
                          onChange={e => setField('password', e.target.value)}
                          placeholder="Min. 6 characters"
                        />
                      </div>
                    )}
                  </div>

                  {formError && (
                    <p className="form-error" style={{ marginBottom: 16 }}>{formError}</p>
                  )}

                  <div className="modal-actions">
                    <button className="btn-secondary" onClick={() => setModal(null)}>Cancel</button>
                    <button className="btn-primary" onClick={handleSave} disabled={saving}>
                      {saving ? 'Saving…' : modal.mode === 'add' ? 'Create User' : 'Save Changes'}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ── Reset Password modal ─────────────────────────────────────── */}
          {modal?.mode === 'reset' && (
            <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setModal(null)}>
              <div className="modal" style={{ maxWidth: 400 }}>
                <div className="modal-header">
                  <h3 className="modal-title">Reset Password</h3>
                  <button className="modal-close" onClick={() => setModal(null)}>✕</button>
                </div>
                <div className="modal-form">
                  <p style={{ fontSize: 13, color: '#6B7C93', marginBottom: 16 }}>
                    Setting a new password for <strong style={{ color: '#1A2B4A' }}>{modal.target.full_name}</strong>
                    <span className="mono" style={{ fontSize: 11, marginLeft: 6, color: '#6B7C93' }}>({modal.target.username})</span>
                  </p>
                  <div style={{ marginBottom: 16 }}>
                    <label className="form-label">New Password *</label>
                    <input
                      className="form-input"
                      type="password"
                      value={form.password}
                      onChange={e => setField('password', e.target.value)}
                      placeholder="Min. 6 characters"
                      autoFocus
                    />
                  </div>
                  {formError && <p className="form-error" style={{ marginBottom: 12 }}>{formError}</p>}
                  <div className="modal-actions">
                    <button className="btn-secondary" onClick={() => setModal(null)}>Cancel</button>
                    <button className="btn-primary" onClick={handleSave} disabled={saving}>
                      {saving ? 'Saving…' : 'Reset Password'}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ── Delete confirmation ──────────────────────────────────────── */}
          {confirmDelete && (
            <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setConfirmDelete(null)}>
              <div className="modal confirm-modal">
                <div className="confirm-body">
                  <div className="confirm-icon">🗑️</div>
                  <div className="confirm-title">Delete User</div>
                  <p className="confirm-message">
                    Permanently delete <strong>{confirmDelete.full_name}</strong> ({confirmDelete.username})?
                    This cannot be undone.
                  </p>
                  <div className="modal-actions modal-actions-center">
                    <button className="btn-secondary" onClick={() => setConfirmDelete(null)}>Cancel</button>
                    <button className="btn-danger" onClick={handleDelete}>Delete</button>
                  </div>
                </div>
              </div>
            </div>
          )}

        </main>
      </div>
    </div>
  )
}

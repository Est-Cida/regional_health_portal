import { useAuth } from '../../context/AuthContext'
import { useNavigate } from 'react-router-dom'

const ROLE_LABELS = {
  country_admin:  'Country Admin',
  regional_admin: 'Regional Admin',
  super_admin:    'Super Admin',
}

const ROLE_BADGE = {
  country_admin:  'badge-country',
  regional_admin: 'badge-regional',
  super_admin:    'badge-super',
}

export default function Navbar() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  return (
    <header className="navbar">
      <div className="navbar-left">
        <button
          className="navbar-hamburger"
          onClick={() => document.body.classList.toggle('sidebar-open')}
          aria-label="Toggle navigation"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
            <line x1="3" y1="6" x2="21" y2="6"/>
            <line x1="3" y1="12" x2="21" y2="12"/>
            <line x1="3" y1="18" x2="21" y2="18"/>
          </svg>
        </button>
        <span className="navbar-title">Regional Health Portal</span>
      </div>

      <div className="navbar-right">
        {user && (
          <>
            <span className={`role-badge ${ROLE_BADGE[user.role]}`}>
              {ROLE_LABELS[user.role]}
            </span>
            <span className="navbar-user">{user.full_name}</span>
            <button className="btn-logout" onClick={handleLogout}>
              Sign out
            </button>
          </>
        )}
      </div>
    </header>
  )
}

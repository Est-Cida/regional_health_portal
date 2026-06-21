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
        <span className="navbar-logo">
          {/* <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
            <circle cx="14" cy="14" r="13" stroke="#0071BC" strokeWidth="2"/>
            <path d="M14 3 C8 3 3 8 3 14 S8 25 14 25 25 20 25 14 20 3 14 3Z" fill="#0071BC" opacity="0.12"/>
            <line x1="3" y1="14" x2="25" y2="14" stroke="#0071BC" strokeWidth="1.5"/>
            <ellipse cx="14" cy="14" rx="5" ry="11" stroke="#0071BC" strokeWidth="1.5" fill="none"/>
          </svg> */}
          {/* <img src="/WHO-icon.png" alt="WHO Logo" /> */}
        </span>
        <span className="navbar-title" >Regional Health Portal</span>
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

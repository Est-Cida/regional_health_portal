import { NavLink } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'

const NAV_ITEMS = {
  country_admin: [
    { to: '/country',  label: 'Country Overview',  icon: '🏛️' },
    { to: '/country#diseases',  label: 'Disease Surveillance', icon: '🦠' },
    { to: '/country#outbreaks', label: 'Outbreaks',            icon: '⚠️' },
    { to: '/country#capacity',  label: 'Health Capacity',      icon: '🔬' },
    { to: '/country#funding',   label: 'Funding',              icon: '💰' },
  ],
  regional_admin: [
    { to: '/region',  label: 'Regional Overview', icon: '🗺️' },
    { to: '/country', label: 'Country View',      icon: '🏛️' },
  ],
  super_admin: [
    { to: '/admin',   label: 'All Regions',        icon: '🌍' },
    { to: '/region',  label: 'Regional View',      icon: '🗺️' },
    { to: '/country', label: 'Country View',        icon: '🏛️' },
  ],
}

export default function Sidebar() {
  const { user } = useAuth()
  if (!user) return null

  const items = NAV_ITEMS[user.role] || NAV_ITEMS.country_admin

  return (
    <aside className="sidebar">
      <div className="sidebar-brand">
        <div className="sidebar-logo">
          <svg width="36" height="36" viewBox="0 0 36 36" fill="none">
            <circle cx="18" cy="18" r="17" fill="#0071BC"/>
            <circle cx="18" cy="18" r="13" stroke="white" strokeWidth="1.5" fill="none"/>
            <line x1="4" y1="18" x2="32" y2="18" stroke="white" strokeWidth="1.5"/>
            <ellipse cx="18" cy="18" rx="6" ry="13" stroke="white" strokeWidth="1.5" fill="none"/>
          </svg>
        </div>
        <div>
          <div className="sidebar-brand-name">WHO AFRO</div>
          <div className="sidebar-brand-sub">Health Surveillance</div>
        </div>
      </div>

      <nav className="sidebar-nav">
        <div className="sidebar-section-label">Navigation</div>
        {items.map(item => (
          <NavLink
            key={item.to + item.label}
            to={item.to}
            className={({ isActive }) =>
              `sidebar-link${isActive && !item.to.includes('#') ? ' active' : ''}`
            }
          >
            <span className="sidebar-icon">{item.icon}</span>
            <span>{item.label}</span>
          </NavLink>
        ))}
      </nav>

      <div className="sidebar-footer">
        <div className="sidebar-user-info">
          <div className="sidebar-avatar">
            {user.full_name?.charAt(0).toUpperCase()}
          </div>
          <div>
            <div className="sidebar-user-name">{user.full_name}</div>
            <div className="sidebar-user-scope">
              {user.role === 'country_admin'  && user.country_code}
              {user.role === 'regional_admin' && `${user.subregion} Region`}
              {user.role === 'super_admin'    && 'All Regions'}
            </div>
          </div>
        </div>
      </div>
    </aside>
  )
}

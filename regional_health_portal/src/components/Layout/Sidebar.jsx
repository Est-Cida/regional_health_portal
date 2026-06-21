import { useState, useEffect } from 'react'
import { NavLink } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'

const NAV_ITEMS = {
  country_admin: [
    { to: '/country',            label: 'Country Overview',    icon: '🏛️', end: true  },
    { to: '/country/diseases',   label: 'Disease Surveillance',icon: '🦠', end: false },
    { to: '/country/outbreaks',  label: 'Outbreaks',           icon: '⚠️', end: false },
    { to: '/country/laboratory', label: 'Laboratory',          icon: '🔬', end: false },
    { to: '/country/capacity',   label: 'Health Capacity',     icon: '👥', end: false },
    { to: '/country/funding',    label: 'Funding',             icon: '💰', end: false },
  ],
  regional_admin: [
    { to: '/region',             label: 'Regional Overview',   icon: '🗺️', end: true  },
    { to: '/country',            label: 'Country View',        icon: '🏛️', end: true  },
    { to: '/country/diseases',   label: 'Disease Surveillance',icon: '🦠', end: false },
    { to: '/country/outbreaks',  label: 'Outbreaks',           icon: '⚠️', end: false },
    { to: '/country/laboratory', label: 'Laboratory',          icon: '🔬', end: false },
    { to: '/country/capacity',   label: 'Health Capacity',     icon: '👥', end: false },
    { to: '/country/funding',    label: 'Funding',             icon: '💰', end: false },
  ],
  super_admin: [
    { to: '/admin',              label: 'All Regions',         icon: '🌍', end: true  },
    { to: '/region',             label: 'Regional View',       icon: '🗺️', end: true  },
    { to: '/country',            label: 'Country Overview',    icon: '🏛️', end: true  },
    { to: '/country/diseases',   label: 'Disease Surveillance',icon: '🦠', end: false },
    { to: '/country/outbreaks',  label: 'Outbreaks',           icon: '⚠️', end: false },
    { to: '/country/laboratory', label: 'Laboratory',          icon: '🔬', end: false },
    { to: '/country/capacity',   label: 'Health Capacity',     icon: '👥', end: false },
    { to: '/country/funding',    label: 'Funding',             icon: '💰', end: false },
  ],
}

const EXPANDED_W  = '240px'
const COLLAPSED_W = '64px'
const STORAGE_KEY = 'who_sidebar_collapsed'

export default function Sidebar() {
  const { user } = useAuth()

  const [collapsed, setCollapsed] = useState(() => {
    try { return sessionStorage.getItem(STORAGE_KEY) === 'true' } catch { return false }
  })

  useEffect(() => {
    document.documentElement.style.setProperty('--sidebar-w', collapsed ? COLLAPSED_W : EXPANDED_W)
    try { sessionStorage.setItem(STORAGE_KEY, collapsed) } catch {}
  }, [collapsed])

  if (!user) return null

  const items = NAV_ITEMS[user.role] || NAV_ITEMS.country_admin

  return (
    <aside className={`sidebar${collapsed ? ' sidebar-collapsed' : ''}`}>

      {/* Brand + toggle */}
      <div className="sidebar-brand">
        <div className="sidebar-logo" style={{ flexShrink: 0 }}>
          <svg width="36" height="36" viewBox="0 0 36 36" fill="none">
            <circle cx="18" cy="18" r="17" fill="#0071BC"/>
            <circle cx="18" cy="18" r="13" stroke="white" strokeWidth="1.5" fill="none"/>
            <line x1="4" y1="18" x2="32" y2="18" stroke="white" strokeWidth="1.5"/>
            <ellipse cx="18" cy="18" rx="6" ry="13" stroke="white" strokeWidth="1.5" fill="none"/>
          </svg>
        </div>
        {!collapsed && (
          <div className="sidebar-brand-text">
            <div className="sidebar-brand-name">WHO AFRO</div>
            <div className="sidebar-brand-sub">Health Surveillance</div>
          </div>
        )}
        <button
          className="sidebar-toggle"
          onClick={() => setCollapsed(c => !c)}
          title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {collapsed
            ? <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="9 18 15 12 9 6"/></svg>
            : <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="15 18 9 12 15 6"/></svg>
          }
        </button>
      </div>

      {/* Nav */}
      <nav className="sidebar-nav">
        {!collapsed && <div className="sidebar-section-label">Navigation</div>}
        {items.map(item => (
          <NavLink
            key={item.to + item.label}
            to={item.to}
            end={item.end}
            className={({ isActive }) => `sidebar-link${isActive ? ' active' : ''}`}
            title={collapsed ? item.label : undefined}
          >
            <span className="sidebar-icon">{item.icon}</span>
            {!collapsed && <span className="sidebar-link-label">{item.label}</span>}
          </NavLink>
        ))}
      </nav>

      {/* Footer */}
      <div className="sidebar-footer">
        <div className={`sidebar-user-info${collapsed ? ' sidebar-user-info-collapsed' : ''}`}>
          <div className="sidebar-avatar" title={collapsed ? user.full_name : undefined}>
            {user.full_name?.charAt(0).toUpperCase()}
          </div>
          {!collapsed && (
            <div className="sidebar-user-text">
              <div className="sidebar-user-name">{user.full_name}</div>
              <div className="sidebar-user-scope">
                {user.role === 'country_admin'  && user.country_code}
                {user.role === 'regional_admin' && `${user.subregion} Region`}
                {user.role === 'super_admin'    && 'All Regions'}
              </div>
            </div>
          )}
        </div>
      </div>
    </aside>
  )
}

import { useState, useEffect } from 'react'
import { NavLink } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'

const SettingsIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="3"/>
    <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>
  </svg>
)

const UsersIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
    <circle cx="9" cy="7" r="4"/>
    <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
    <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
  </svg>
)

const PopulationIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="9" cy="7" r="3"/>
    <path d="M3 21v-2a4 4 0 0 1 4-4h4a4 4 0 0 1 4 4v2"/>
    <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
    <path d="M21 21v-2a4 4 0 0 0-3-3.87"/>
  </svg>
)

const DiseaseIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#4ade80" strokeWidth="2" strokeLinecap="round">
    {/* 6 main spokes */}
    <line x1="12" y1="2"    x2="12" y2="22" />
    <line x1="3"  y1="6.8"  x2="21" y2="17.2" />
    <line x1="21" y1="6.8"  x2="3"  y2="17.2" />
    {/* Branch tips — top spoke */}
    <line x1="12" y1="5.5"  x2="9.5" y2="3.5" />
    <line x1="12" y1="5.5"  x2="14.5" y2="3.5" />
    {/* Branch tips — bottom spoke */}
    <line x1="12" y1="18.5" x2="9.5" y2="20.5" />
    <line x1="12" y1="18.5" x2="14.5" y2="20.5" />
    {/* Branch tips — upper-right spoke */}
    <line x1="17.6" y1="8.6"  x2="19.5" y2="6.3" />
    <line x1="17.6" y1="8.6"  x2="20.1" y2="9.9" />
    {/* Branch tips — lower-left spoke */}
    <line x1="6.4"  y1="15.4" x2="4.5"  y2="17.7" />
    <line x1="6.4"  y1="15.4" x2="3.9"  y2="14.1" />
    {/* Branch tips — upper-left spoke */}
    <line x1="6.4"  y1="8.6"  x2="3.9"  y2="9.9"  />
    <line x1="6.4"  y1="8.6"  x2="4.5"  y2="6.3"  />
    {/* Branch tips — lower-right spoke */}
    <line x1="17.6" y1="15.4" x2="20.1" y2="14.1" />
    <line x1="17.6" y1="15.4" x2="19.5" y2="17.7" />
  </svg>
)

const NAV_ITEMS = {
  country_admin: [
    { to: '/country',              label: 'Country Overview',    icon: '🏛️',             end: true  },
    { to: '/country/diseases',     label: 'Disease Surveillance',icon: <DiseaseIcon />,    end: false },
    { to: '/country/outbreaks',    label: 'Outbreaks',           icon: '⚠️',              end: false },
    { to: '/country/laboratory',   label: 'Laboratory',          icon: '🔬',              end: false },
    { to: '/country/population',   label: 'Population',          icon: <PopulationIcon />, end: false },
    { to: '/country/capacity',     label: 'Health Capacity',     icon: '👥',              end: false },
    { to: '/country/funding',      label: 'Funding',             icon: '💰',              end: false },
  ],
  regional_admin: [
    { to: '/region',               label: 'Regional Overview',   icon: '🗺️',             end: true  },
    { to: '/country',              label: 'Country View',        icon: '🏛️',             end: true  },
    { to: '/country/diseases',     label: 'Disease Surveillance',icon: <DiseaseIcon />,    end: false },
    { to: '/country/outbreaks',    label: 'Outbreaks',           icon: '⚠️',              end: false },
    { to: '/country/laboratory',   label: 'Laboratory',          icon: '🔬',              end: false },
    { to: '/country/population',   label: 'Population',          icon: <PopulationIcon />, end: false },
    { to: '/country/capacity',     label: 'Health Capacity',     icon: '👥',              end: false },
    { to: '/country/funding',      label: 'Funding',             icon: '💰',              end: false },
  ],
  super_admin: [
    { to: '/admin',                label: 'All Regions',         icon: '🌍',              end: true  },
    { to: '/region',               label: 'Regional View',       icon: '🗺️',             end: true  },
    { to: '/country',              label: 'Country Overview',    icon: '🏛️',             end: true  },
    { to: '/country/diseases',     label: 'Disease Surveillance',icon: <DiseaseIcon />,    end: false },
    { to: '/country/outbreaks',    label: 'Outbreaks',           icon: '⚠️',              end: false },
    { to: '/country/laboratory',   label: 'Laboratory',          icon: '🔬',              end: false },
    { to: '/country/population',   label: 'Population',          icon: <PopulationIcon />, end: false },
    { to: '/country/capacity',     label: 'Health Capacity',     icon: '👥',              end: false },
    { to: '/country/funding',      label: 'Funding',             icon: '💰',              end: false },
    { to: '/admin/users',          label: 'User Management',     icon: <UsersIcon />,      end: false },
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
    const apply = () => {
      if (window.innerWidth < 768) {
        document.documentElement.style.setProperty('--sidebar-w', '0px')
      } else {
        document.documentElement.style.setProperty('--sidebar-w', collapsed ? COLLAPSED_W : EXPANDED_W)
        document.body.classList.remove('sidebar-open')
      }
    }
    apply()
    try { sessionStorage.setItem(STORAGE_KEY, collapsed) } catch {}
    window.addEventListener('resize', apply)
    return () => window.removeEventListener('resize', apply)
  }, [collapsed])

  if (!user) return null

  const items = NAV_ITEMS[user.role] || NAV_ITEMS.country_admin

  return (
    <>
    <div className="sidebar-backdrop" onClick={() => document.body.classList.remove('sidebar-open')} />
    <aside className={`sidebar${collapsed ? ' sidebar-collapsed' : ''}`}>

      {/* Brand + toggle */}
      <div className="sidebar-brand">
        
          <img src="/WHO-icon.png" alt="" href="/WHO-icon.png"/>
        
        {!collapsed && (
          <div className="sidebar-brand-text">
            <div className="sidebar-brand-name">WHO AFRO</div>
            <div className="sidebar-brand-sub">Regional Health Portal</div>
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

        {/* Settings — visible to all roles */}
        {!collapsed && (
          <div className="sidebar-section-label" style={{ marginTop: 10 }}>Account</div>
        )}
        <NavLink
          to="/settings"
          end={false}
          className={({ isActive }) => `sidebar-link${isActive ? ' active' : ''}`}
          title={collapsed ? 'Profile Settings' : undefined}
        >
          <span className="sidebar-icon"><SettingsIcon /></span>
          {!collapsed && <span className="sidebar-link-label">Profile Settings</span>}
        </NavLink>
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
    </>
  )
}

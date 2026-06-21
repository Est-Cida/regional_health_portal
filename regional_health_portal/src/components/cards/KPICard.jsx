const ICONS = {
  cases:  <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 3H5a2 2 0 00-2 2v4m6-6h10a2 2 0 012 2v4M9 3v18m0 0h10a2 2 0 002-2V9M9 21H5a2 2 0 01-2-2V9m0 0h18"/></svg>,
  deaths: <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z"/></svg>,
  attack: <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>,
  cfr:    <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>,
  alert:  <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2"><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>,
  lab:    <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 3H5a2 2 0 00-2 2v4m6-6h10a2 2 0 012 2v4M9 3v18m0 0h10a2 2 0 002-2V9M9 21H5a2 2 0 01-2-2V9m0 0h18"/></svg>,
  people: <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75"/></svg>,
  money:  <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6"/></svg>,
}

const COLOR_MAP = {
  blue:   { bg: '#EBF5FF', border: '#0071BC', text: '#0071BC', icon: '#0071BC' },
  red:    { bg: '#FFF0F0', border: '#C00000', text: '#C00000', icon: '#C00000' },
  orange: { bg: '#FFF8ED', border: '#D97706', text: '#D97706', icon: '#D97706' },
  purple: { bg: '#F5F0FF', border: '#7B2D8B', text: '#7B2D8B', icon: '#7B2D8B' },
  teal:   { bg: '#E6FAF8', border: '#0D9488', text: '#0D9488', icon: '#0D9488' },
  green:  { bg: '#ECFDF5', border: '#059669', text: '#059669', icon: '#059669' },
}

export default function KPICard({ title, value, subtitle, color = 'blue', icon = 'cases', trend }) {
  const c = COLOR_MAP[color]
  const iconEl = ICONS[icon]

  return (
    <div className="kpi-card" style={{ borderTop: `4px solid ${c.border}`, background: c.bg }}>
      <div className="kpi-card-header">
        <span className="kpi-title">{title}</span>
        <span className="kpi-icon" style={{ color: c.icon }}>{iconEl}</span>
      </div>
      <div className="kpi-value" style={{ color: c.text }}>
        {value ?? '—'}
      </div>
      <div className="kpi-subtitle">{subtitle}</div>
      {trend !== undefined && (
        <div className={`kpi-trend ${trend >= 0 ? 'trend-up' : 'trend-down'}`}>
          {trend >= 0 ? '▲' : '▼'} {Math.abs(trend).toFixed(1)}% vs prev year
        </div>
      )}
    </div>
  )
}

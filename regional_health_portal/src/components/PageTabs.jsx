const DEFAULT = [
  { key: 'charts', icon: '📊', label: 'Charts'     },
  { key: 'table',  icon: '📋', label: 'Data Table' },
]

export default function PageTabs({ view, onChange, tabs = DEFAULT }) {
  return (
    <div className="page-tab-bar">
      {tabs.map(t => (
        <button
          key={t.key}
          className={`page-tab${view === t.key ? ' active' : ''}`}
          onClick={() => onChange(t.key)}
        >
          <span className="page-tab-icon">{t.icon}</span>
          {t.label}
        </button>
      ))}
    </div>
  )
}

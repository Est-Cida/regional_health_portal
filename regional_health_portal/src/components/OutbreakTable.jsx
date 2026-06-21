const DISEASE_PILL = {
  'Cholera':                   { bg: '#EBF5FF', color: '#0071BC' },
  'Measles':                   { bg: '#FFF8ED', color: '#D97706' },
  'Meningitis':                { bg: '#F5F0FF', color: '#7B2D8B' },
  'Yellow fever':              { bg: '#FEFCE8', color: '#854D0E' },
  'Lassa fever':               { bg: '#FFF0F0', color: '#C00000' },
  'Viral haemorrhagic fever':  { bg: '#FFF0F0', color: '#7F1D1D' },
  'Polio (cVDPV)':             { bg: '#ECFDF5', color: '#059669' },
}

function formatDate(str) {
  if (!str) return '—'
  return new Date(str).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
}

function cfr(deaths, cases) {
  if (!cases) return '—'
  return `${((deaths / cases) * 100).toFixed(1)}%`
}

function EditBtn({ onClick }) {
  return (
    <button className="btn-action btn-action-edit" onClick={onClick} title="Edit record">
      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
        <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
      </svg>
    </button>
  )
}

function DeleteBtn({ onClick }) {
  return (
    <button className="btn-action btn-action-delete" onClick={onClick} title="Delete record">
      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
        <polyline points="3 6 5 6 21 6"/>
        <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
        <path d="M10 11v6M14 11v6"/>
        <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/>
      </svg>
    </button>
  )
}

export default function OutbreakTable({ data = [], onEdit, onDelete }) {
  const hasActions = Boolean(onEdit || onDelete)

  if (!data.length) {
    return (
      <div className="table-empty">
        <p>No outbreaks recorded for this period.</p>
      </div>
    )
  }

  return (
    <div className="table-wrapper">
      <table className="data-table">
        <thead>
          <tr>
            <th>ID</th>
            <th>Disease</th>
            <th>Start Date</th>
            <th>Duration (days)</th>
            <th>Detection (days)</th>
            <th>Cases</th>
            <th>Deaths</th>
            <th>CFR</th>
            {hasActions && <th className="actions-col">Actions</th>}
          </tr>
        </thead>
        <tbody>
          {data.map(o => {
            const pill = DISEASE_PILL[o.disease] || { bg: '#F1F5F9', color: '#475569' }
            return (
              <tr key={o.outbreak_id}>
                <td className="mono">{o.outbreak_id}</td>
                <td>
                  <span className="disease-pill" style={{ background: pill.bg, color: pill.color }}>
                    {o.disease}
                  </span>
                </td>
                <td>{formatDate(o.start_date)}</td>
                <td className="num">{o.duration_days}</td>
                <td className={`num ${o.time_to_detection_days > 10 ? 'text-warn' : ''}`}>
                  {o.time_to_detection_days}
                </td>
                <td className="num">{o.cases?.toLocaleString()}</td>
                <td className="num">{o.deaths?.toLocaleString()}</td>
                <td className={`num ${parseFloat(cfr(o.deaths, o.cases)) > 5 ? 'text-danger' : ''}`}>
                  {cfr(o.deaths, o.cases)}
                </td>
                {hasActions && (
                  <td className="actions-col">
                    {onEdit   && <EditBtn   onClick={() => onEdit(o)}   />}
                    {onDelete && <DeleteBtn onClick={() => onDelete(o)} />}
                  </td>
                )}
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}

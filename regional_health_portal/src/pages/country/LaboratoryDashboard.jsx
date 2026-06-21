import { useMemo, useState } from 'react'
import { useCountry } from '../../context/CountryContext'
import { useDataStore, rowId } from '../../context/DataStore'
import { useAuth } from '../../context/AuthContext'
import EditRecordModal from '../../components/EditRecordModal'
import ConfirmDialog from '../../components/ConfirmDialog'
import PageTabs from '../../components/PageTabs'
import { YEARS } from '../../data/dataService'
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, BarChart, Bar,
} from 'recharts'

const ChartTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null
  return (
    <div className="chart-tooltip">
      <p className="tooltip-label">{label}</p>
      {payload.map(p => (
        <p key={p.dataKey} style={{ color: p.color }}>
          {p.name}: <strong>{typeof p.value === 'number' ? p.value.toLocaleString() : p.value}</strong>
        </p>
      ))}
    </div>
  )
}

function AccreditationGauge({ value }) {
  const capped = Math.min(value || 0, 100)
  const color  = capped >= 80 ? '#059669' : capped >= 50 ? '#D97706' : '#C00000'
  const r = 52, cx = 64, cy = 64
  const circ = 2 * Math.PI * r
  const dash = (capped / 100) * circ
  return (
    <div className="gauge-wrap">
      <svg width="128" height="128" viewBox="0 0 128 128">
        <circle cx={cx} cy={cy} r={r} fill="none" stroke="#E5EAF0" strokeWidth="12"/>
        <circle cx={cx} cy={cy} r={r} fill="none" stroke={color} strokeWidth="12" strokeLinecap="round"
          strokeDasharray={`${dash} ${circ}`} transform={`rotate(-90 ${cx} ${cy})`}
          style={{ transition: 'stroke-dasharray .6s ease' }} />
        <text x={cx} y={cy + 6} textAnchor="middle" fill={color} fontSize="20" fontWeight="800">
          {value?.toFixed(1)}%
        </text>
      </svg>
      <div className="gauge-label">ISO 15189<br/>Accreditation</div>
    </div>
  )
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

export default function LaboratoryDashboard() {
  const { selectedIsos, selectedYears } = useCountry()
  const { state, update, remove } = useDataStore()
  const { user } = useAuth()
  const canEdit = user.role === 'country_admin'

  const [view,         setView]         = useState('charts')
  const [editRecord,   setEditRecord]   = useState(null)
  const [deleteRecord, setDeleteRecord] = useState(null)

  const multiIso = selectedIsos.length > 1
  const yLabel = !selectedYears.length || selectedYears.length === YEARS.length
    ? 'All Years' : selectedYears.length === 1 ? String(selectedYears[0]) : `${selectedYears.length} Years`

  // Per-year aggregated data for trend charts (summed labs, averaged rates across selected countries)
  const allYears = useMemo(() => {
    const filtered = state.labCapacity.filter(r =>
      !selectedIsos.length || selectedIsos.includes(r.iso_3_code)
    )
    const byYear = {}
    filtered.forEach(r => {
      if (!byYear[r.year]) byYear[r.year] = { year: r.year, _n: 0, total_public_labs: 0, labs_iso15189_accredited: 0, iso15189_accreditation_pct: 0, avg_turnaround_time_days: 0, diagnostic_tests_per_100k: 0 }
      const b = byYear[r.year]
      b._n++
      b.total_public_labs          += r.total_public_labs          || 0
      b.labs_iso15189_accredited   += r.labs_iso15189_accredited   || 0
      b.iso15189_accreditation_pct += r.iso15189_accreditation_pct || 0
      b.avg_turnaround_time_days   += r.avg_turnaround_time_days   || 0
      b.diagnostic_tests_per_100k  += r.diagnostic_tests_per_100k  || 0
    })
    return Object.values(byYear).map(({ _n, iso15189_accreditation_pct, avg_turnaround_time_days, diagnostic_tests_per_100k, ...r }) => ({
      ...r,
      iso15189_accreditation_pct: _n > 0 ? iso15189_accreditation_pct / _n : 0,
      avg_turnaround_time_days:   _n > 0 ? avg_turnaround_time_days   / _n : 0,
      diagnostic_tests_per_100k:  _n > 0 ? diagnostic_tests_per_100k  / _n : 0,
    })).sort((a, b) => a.year - b.year)
  }, [state.labCapacity, selectedIsos])

  // KPI aggregate for selected years
  const current = useMemo(() => {
    const rows = allYears.filter(r => !selectedYears.length || selectedYears.includes(r.year))
    if (!rows.length) return null
    const n = rows.length
    return {
      total_public_labs:          Math.round(rows.reduce((s, r) => s + r.total_public_labs, 0) / n),
      labs_iso15189_accredited:   Math.round(rows.reduce((s, r) => s + r.labs_iso15189_accredited, 0) / n),
      iso15189_accreditation_pct: rows.reduce((s, r) => s + r.iso15189_accreditation_pct, 0) / n,
      avg_turnaround_time_days:   rows.reduce((s, r) => s + r.avg_turnaround_time_days, 0) / n,
      diagnostic_tests_per_100k:  Math.round(rows.reduce((s, r) => s + r.diagnostic_tests_per_100k, 0) / n),
    }
  }, [allYears, selectedYears])

  // Raw rows for Data Table tab
  const tableRows = useMemo(() =>
    state.labCapacity.filter(r =>
      (!selectedIsos.length  || selectedIsos.includes(r.iso_3_code)) &&
      (!selectedYears.length || selectedYears.includes(r.year))
    ).sort((a, b) => a.year - b.year || a.iso_3_code.localeCompare(b.iso_3_code))
  , [state.labCapacity, selectedIsos, selectedYears])

  if (!selectedIsos.length) return <div className="page-empty">Select a country above.</div>

  return (
    <>
      <div className="page-header-slim">
        <h1 className="page-title">Laboratory Capacity</h1>
        <p className="page-desc">Lab infrastructure, accreditation &amp; diagnostic output · {yLabel}</p>
      </div>

      <PageTabs view={view} onChange={setView} />

      {view === 'charts' && <>

      <section className="section">
        <div className="lab-overview-grid">
          <AccreditationGauge value={current?.iso15189_accreditation_pct} />
          <div className="kpi-grid kpi-grid-4" style={{ flex: 1 }}>
            <div className="kpi-card" style={{ borderTop: '4px solid #0071BC', background: '#EBF5FF' }}>
              <div className="kpi-card-header"><span className="kpi-title">Public Labs</span></div>
              <div className="kpi-value" style={{ color: '#0071BC' }}>{current?.total_public_labs ?? '—'}</div>
              <div className="kpi-subtitle">total public laboratories</div>
            </div>
            <div className="kpi-card" style={{ borderTop: '4px solid #059669', background: '#ECFDF5' }}>
              <div className="kpi-card-header"><span className="kpi-title">Accredited</span></div>
              <div className="kpi-value" style={{ color: '#059669' }}>{current?.labs_iso15189_accredited ?? '—'}</div>
              <div className="kpi-subtitle">ISO 15189 certified labs</div>
            </div>
            <div className="kpi-card" style={{ borderTop: '4px solid #D97706', background: '#FFF8ED' }}>
              <div className="kpi-card-header"><span className="kpi-title">Turnaround</span></div>
              <div className="kpi-value" style={{ color: '#D97706' }}>
                {current?.avg_turnaround_time_days?.toFixed(1) ?? '—'}<span style={{ fontSize: 14 }}> d</span>
              </div>
              <div className="kpi-subtitle">avg. result time</div>
            </div>
            <div className="kpi-card" style={{ borderTop: '4px solid #7B2D8B', background: '#F5F0FF' }}>
              <div className="kpi-card-header"><span className="kpi-title">Tests / 100k</span></div>
              <div className="kpi-value" style={{ color: '#7B2D8B' }}>{current?.diagnostic_tests_per_100k ?? '—'}</div>
              <div className="kpi-subtitle">diagnostic tests per 100k pop</div>
            </div>
          </div>
        </div>
      </section>

      <section className="section">
        <div className="charts-grid">
          <div className="card">
            <div className="card-header"><h2 className="card-title">ISO 15189 Accreditation Rate (%)</h2></div>
            <ResponsiveContainer width="100%" height={260}>
              <LineChart data={allYears} margin={{ top: 8, right: 24, left: 8, bottom: 8 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E5EAF0" />
                <XAxis dataKey="year" tick={{ fontSize: 11, fill: '#6B7C93' }} />
                <YAxis domain={[0, 100]} tickFormatter={v => `${v}%`} tick={{ fontSize: 11, fill: '#6B7C93' }} />
                <Tooltip content={<ChartTooltip />} />
                <Line type="monotone" dataKey="iso15189_accreditation_pct" name="Accreditation %" stroke="#059669" strokeWidth={2.5} dot={{ r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
          <div className="card">
            <div className="card-header"><h2 className="card-title">Avg. Turnaround Time (days)</h2></div>
            <ResponsiveContainer width="100%" height={260}>
              <LineChart data={allYears} margin={{ top: 8, right: 24, left: 8, bottom: 8 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E5EAF0" />
                <XAxis dataKey="year" tick={{ fontSize: 11, fill: '#6B7C93' }} />
                <YAxis tick={{ fontSize: 11, fill: '#6B7C93' }} />
                <Tooltip content={<ChartTooltip />} />
                <Line type="monotone" dataKey="avg_turnaround_time_days" name="Turnaround (days)" stroke="#D97706" strokeWidth={2.5} dot={{ r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </section>

      <section className="section">
        <div className="card">
          <div className="card-header"><h2 className="card-title">Diagnostic Tests per 100k Population</h2></div>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={allYears} margin={{ top: 8, right: 24, left: 8, bottom: 8 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5EAF0" />
              <XAxis dataKey="year" tick={{ fontSize: 11, fill: '#6B7C93' }} />
              <YAxis tick={{ fontSize: 11, fill: '#6B7C93' }} />
              <Tooltip content={<ChartTooltip />} />
              <Bar dataKey="diagnostic_tests_per_100k" name="Tests / 100k" fill="#0071BC" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </section>

      </>}

      {view === 'table' && (
        <section className="section">
          <div className="card">
            <div className="card-header">
              <h2 className="card-title">Laboratory Data — All Years</h2>
              <span className="card-subtitle">{tableRows.length} records</span>
            </div>
            <div className="table-wrapper">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Year</th>
                    {multiIso && <th>Country</th>}
                    <th>Public Labs</th>
                    <th>Accredited Labs</th>
                    <th>Accreditation %</th>
                    <th>Avg. Turnaround (days)</th>
                    <th>Tests / 100k</th>
                    {canEdit && !multiIso && <th className="actions-col">Actions</th>}
                  </tr>
                </thead>
                <tbody>
                  {tableRows.length === 0 && (
                    <tr><td colSpan={7} className="table-empty">No laboratory data found</td></tr>
                  )}
                  {tableRows.map(r => (
                    <tr key={`${r.iso_3_code}-${r.year}`} className={selectedYears.includes(r.year) ? 'row-highlighted' : ''}>
                      <td>
                        <strong>{r.year}</strong>
                        {selectedYears.includes(r.year) && selectedYears.length < YEARS.length && (
                          <span className="year-badge">selected</span>
                        )}
                      </td>
                      {multiIso && <td className="mono">{r.iso_3_code}</td>}
                      <td className="num">{r.total_public_labs}</td>
                      <td className="num">{r.labs_iso15189_accredited}</td>
                      <td className={`num ${r.iso15189_accreditation_pct >= 80 ? 'text-success' : r.iso15189_accreditation_pct < 50 ? 'text-danger' : 'text-warn'}`}>
                        {r.iso15189_accreditation_pct?.toFixed(1)}%
                      </td>
                      <td className={`num ${r.avg_turnaround_time_days > 5 ? 'text-warn' : ''}`}>
                        {r.avg_turnaround_time_days?.toFixed(1)}
                      </td>
                      <td className="num">{r.diagnostic_tests_per_100k}</td>
                      {canEdit && !multiIso && (
                        <td className="actions-col">
                          <EditBtn   onClick={() => setEditRecord(r)}   />
                          <DeleteBtn onClick={() => setDeleteRecord(r)} />
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </section>
      )}

      {editRecord && (
        <EditRecordModal record={editRecord} tableType="labCapacity" onSave={changes => { update('labCapacity', rowId('labCapacity', editRecord), changes); setEditRecord(null) }} onClose={() => setEditRecord(null)} />
      )}
      {deleteRecord && (
        <ConfirmDialog
          title="Delete Laboratory Record"
          message={`Delete laboratory data for ${deleteRecord.year}? This cannot be undone.`}
          onConfirm={() => { remove('labCapacity', rowId('labCapacity', deleteRecord)); setDeleteRecord(null) }}
          onCancel={() => setDeleteRecord(null)}
        />
      )}
    </>
  )
}

import { useMemo, useState } from 'react'
import { useCountry } from '../../context/CountryContext'
import { useDataStore, rowId } from '../../context/DataStore'
import { useAuth } from '../../context/AuthContext'
import EditRecordModal from '../../components/EditRecordModal'
import ConfirmDialog from '../../components/ConfirmDialog'
import PageTabs from '../../components/PageTabs'
import { YEARS } from '../../data/dataService'
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer, Cell,
} from 'recharts'

const fmtM = v => v != null ? `$${(v / 1_000_000).toFixed(1)}M` : '—'

const ChartTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null
  return (
    <div className="chart-tooltip">
      <p className="tooltip-label">{label}</p>
      {payload.map(p => (
        <p key={p.dataKey} style={{ color: p.color }}>
          {p.name}: <strong>{fmtM(p.value)}</strong>
        </p>
      ))}
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

export default function FundingDashboard() {
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

  // Per-year aggregated funding across selected countries
  const allYears = useMemo(() => {
    const filtered = state.funding.filter(r => !selectedIsos.length || selectedIsos.includes(r.iso_3_code))
    const byYear = {}
    filtered.forEach(r => {
      if (!byYear[r.year]) byYear[r.year] = { year: r.year, _n: 0, total_funding_usd: 0, domestic_funding_usd: 0, external_funding_usd: 0, funding_per_capita_usd: 0, domestic_funding_share_pct: 0 }
      const b = byYear[r.year]
      b._n++
      b.total_funding_usd          += r.total_funding_usd          || 0
      b.domestic_funding_usd       += r.domestic_funding_usd       || 0
      b.external_funding_usd       += r.external_funding_usd       || 0
      b.funding_per_capita_usd     += r.funding_per_capita_usd     || 0
      b.domestic_funding_share_pct += r.domestic_funding_share_pct || 0
    })
    return Object.values(byYear).map(({ _n, funding_per_capita_usd, domestic_funding_share_pct, ...r }) => ({
      ...r,
      funding_per_capita_usd:     _n > 0 ? funding_per_capita_usd     / _n : 0,
      domestic_funding_share_pct: _n > 0 ? domestic_funding_share_pct / _n : 0,
    })).sort((a, b) => a.year - b.year)
  }, [state.funding, selectedIsos])

  // KPI aggregate for selected years
  const current = useMemo(() => {
    const rows = allYears.filter(r => !selectedYears.length || selectedYears.includes(r.year))
    if (!rows.length) return null
    const n = rows.length
    return {
      total_funding_usd:          rows.reduce((s, r) => s + r.total_funding_usd,          0),
      domestic_funding_usd:       rows.reduce((s, r) => s + r.domestic_funding_usd,       0),
      external_funding_usd:       rows.reduce((s, r) => s + r.external_funding_usd,       0),
      funding_per_capita_usd:     rows.reduce((s, r) => s + r.funding_per_capita_usd,     0) / n,
      domestic_funding_share_pct: rows.reduce((s, r) => s + r.domestic_funding_share_pct, 0) / n,
    }
  }, [allYears, selectedYears])

  // Raw rows for Data Table tab
  const tableRows = useMemo(() =>
    state.funding.filter(r =>
      (!selectedIsos.length  || selectedIsos.includes(r.iso_3_code)) &&
      (!selectedYears.length || selectedYears.includes(r.year))
    ).sort((a, b) => a.year - b.year || a.iso_3_code.localeCompare(b.iso_3_code))
  , [state.funding, selectedIsos, selectedYears])

  if (!selectedIsos.length) return <div className="page-empty">Select a country above.</div>

  const domShare = current?.domestic_funding_share_pct ?? 0
  const extShare = 100 - domShare

  return (
    <>
      <div className="page-header-slim">
        <h1 className="page-title">Health Financing</h1>
        <p className="page-desc">Domestic &amp; external health funding · {yLabel}</p>
      </div>

      <PageTabs view={view} onChange={setView} />

      {view === 'charts' && <>

      <section className="section">
        <div className="kpi-grid kpi-grid-4">
          <div className="kpi-card" style={{ borderTop: '4px solid #0071BC', background: '#EBF5FF' }}>
            <div className="kpi-card-header"><span className="kpi-title">Total Funding</span></div>
            <div className="kpi-value" style={{ color: '#0071BC' }}>{fmtM(current?.total_funding_usd)}</div>
            <div className="kpi-subtitle">{yLabel}</div>
          </div>
          <div className="kpi-card" style={{ borderTop: '4px solid #059669', background: '#ECFDF5' }}>
            <div className="kpi-card-header"><span className="kpi-title">Domestic</span></div>
            <div className="kpi-value" style={{ color: '#059669' }}>{fmtM(current?.domestic_funding_usd)}</div>
            <div className="kpi-subtitle">{domShare.toFixed(1)}% of total</div>
          </div>
          <div className="kpi-card" style={{ borderTop: '4px solid #D97706', background: '#FFF8ED' }}>
            <div className="kpi-card-header"><span className="kpi-title">External</span></div>
            <div className="kpi-value" style={{ color: '#D97706' }}>{fmtM(current?.external_funding_usd)}</div>
            <div className="kpi-subtitle">{current?.external_funding_usd ? `${extShare.toFixed(1)}% of total` : 'not reported'}</div>
          </div>
          <div className="kpi-card" style={{ borderTop: '4px solid #7B2D8B', background: '#F5F0FF' }}>
            <div className="kpi-card-header"><span className="kpi-title">Per Capita</span></div>
            <div className="kpi-value" style={{ color: '#7B2D8B' }}>${current?.funding_per_capita_usd?.toFixed(2) ?? '—'}</div>
            <div className="kpi-subtitle">avg USD per person</div>
          </div>
        </div>
      </section>

      {current && (
        <section className="section">
          <div className="capacity-card">
            <h3 className="capacity-title">Domestic vs External Split — {yLabel}</h3>
            <div className="funding-stacked-labels">
              <span>Domestic ({domShare.toFixed(1)}%)</span>
              <span>External ({extShare.toFixed(1)}%)</span>
            </div>
            <div className="funding-bar" style={{ height: 28 }}>
              <div className="funding-bar-domestic" style={{ width: `${domShare}%` }} />
              <div className="funding-bar-external" style={{ width: `${extShare}%` }} />
            </div>
            <div className="funding-totals" style={{ marginTop: 12 }}>
              <div className="funding-total-item">
                <span className="dot dot-domestic" />
                <div><div className="funding-label">Domestic</div><div className="funding-amount">{fmtM(current.domestic_funding_usd)}</div></div>
              </div>
              <div className="funding-total-item">
                <span className="dot dot-external" />
                <div><div className="funding-label">External</div><div className="funding-amount">{fmtM(current.external_funding_usd)}</div></div>
              </div>
              <div className="funding-total-item">
                <span className="dot dot-total" />
                <div><div className="funding-label">Total</div><div className="funding-amount">{fmtM(current.total_funding_usd)}</div></div>
              </div>
            </div>
          </div>
        </section>
      )}

      <section className="section">
        <div className="charts-grid">
          <div className="card">
            <div className="card-header">
              <h2 className="card-title">Total Funding Trend</h2>
              <span className="card-subtitle">USD millions</span>
            </div>
            <ResponsiveContainer width="100%" height={260}>
              <LineChart data={allYears} margin={{ top: 8, right: 24, left: 8, bottom: 8 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E5EAF0" />
                <XAxis dataKey="year" tick={{ fontSize: 11, fill: '#6B7C93' }} />
                <YAxis tickFormatter={v => `$${(v/1e6).toFixed(0)}M`} tick={{ fontSize: 11, fill: '#6B7C93' }} width={60} />
                <Tooltip content={<ChartTooltip />} />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                <Line type="monotone" dataKey="total_funding_usd"    name="Total"    stroke="#1A2B4A" strokeWidth={2.5} dot={{ r: 4 }} />
                <Line type="monotone" dataKey="domestic_funding_usd" name="Domestic" stroke="#059669" strokeWidth={2}   dot={{ r: 3 }} />
                <Line type="monotone" dataKey="external_funding_usd" name="External" stroke="#D97706" strokeWidth={2}   dot={{ r: 3 }} strokeDasharray="5 3" />
              </LineChart>
            </ResponsiveContainer>
          </div>

          <div className="card">
            <div className="card-header">
              <h2 className="card-title">Domestic Funding Share (%)</h2>
            </div>
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={allYears} margin={{ top: 8, right: 24, left: 8, bottom: 8 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5EAF0" />
                <XAxis dataKey="year" tick={{ fontSize: 11, fill: '#6B7C93' }} />
                <YAxis tickFormatter={v => `${v}%`} domain={[0, 100]} tick={{ fontSize: 11, fill: '#6B7C93' }} />
                <Tooltip formatter={v => [`${v?.toFixed(1)}%`]} />
                <Bar dataKey="domestic_funding_share_pct" name="Domestic %" radius={[4, 4, 0, 0]}>
                  {allYears.map(r => (
                    <Cell key={r.year} fill={r.domestic_funding_share_pct >= 50 ? '#059669' : r.domestic_funding_share_pct >= 30 ? '#D97706' : '#C00000'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </section>

      <section className="section">
        <div className="card">
          <div className="card-header">
            <h2 className="card-title">Per Capita Health Funding (USD)</h2>
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={allYears} margin={{ top: 8, right: 24, left: 8, bottom: 8 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E5EAF0" />
              <XAxis dataKey="year" tick={{ fontSize: 11, fill: '#6B7C93' }} />
              <YAxis tickFormatter={v => `$${v}`} tick={{ fontSize: 11, fill: '#6B7C93' }} />
              <Tooltip formatter={v => [`$${v?.toFixed(2)}`]} />
              <Line type="monotone" dataKey="funding_per_capita_usd" name="Per Capita (USD)" stroke="#0071BC" strokeWidth={2.5} dot={{ r: 4 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </section>

      </>}

      {view === 'table' && (
        <section className="section">
          <div className="card">
            <div className="card-header">
              <h2 className="card-title">Funding Data — All Years</h2>
              <span className="card-subtitle">{tableRows.length} records</span>
            </div>
            <div className="table-wrapper">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Year</th>
                    {multiIso && <th>Country</th>}
                    <th>Total Funding</th>
                    <th>Domestic</th>
                    <th>External</th>
                    <th>Per Capita (USD)</th>
                    <th>Domestic Share %</th>
                    {canEdit && !multiIso && <th className="actions-col">Actions</th>}
                  </tr>
                </thead>
                <tbody>
                  {tableRows.length === 0 && (
                    <tr><td colSpan={7} className="table-empty">No funding data found</td></tr>
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
                      <td className="num">{fmtM(r.total_funding_usd)}</td>
                      <td className="num">{fmtM(r.domestic_funding_usd)}</td>
                      <td className="num">{fmtM(r.external_funding_usd)}</td>
                      <td className="num">${r.funding_per_capita_usd?.toFixed(2)}</td>
                      <td className={`num ${r.domestic_funding_share_pct >= 50 ? 'text-success' : r.domestic_funding_share_pct < 30 ? 'text-danger' : 'text-warn'}`}>
                        {r.domestic_funding_share_pct?.toFixed(1)}%
                      </td>
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
        <EditRecordModal
          record={editRecord}
          tableType="funding"
          onSave={changes => { update('funding', rowId('funding', editRecord), changes); setEditRecord(null) }}
          onClose={() => setEditRecord(null)}
        />
      )}

      {deleteRecord && (
        <ConfirmDialog
          title="Delete Funding Record"
          message={`Delete funding data for ${deleteRecord.year}? This cannot be undone.`}
          onConfirm={() => { remove('funding', rowId('funding', deleteRecord)); setDeleteRecord(null) }}
          onCancel={() => setDeleteRecord(null)}
        />
      )}
    </>
  )
}

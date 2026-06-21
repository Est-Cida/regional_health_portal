import { useMemo, useState } from 'react'
import { useCountry } from '../../context/CountryContext'
import { useDataStore, rowId } from '../../context/DataStore'
import { useAuth } from '../../context/AuthContext'
import { YEARS } from '../../data/dataService'
import EditRecordModal from '../../components/EditRecordModal'
import ConfirmDialog from '../../components/ConfirmDialog'
import PageTabs from '../../components/PageTabs'
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  Legend, ResponsiveContainer,
} from 'recharts'

const DISEASE_COLORS = {
  'Cholera':                   '#0071BC',
  'Measles':                   '#F7941D',
  'Meningitis':                '#7B2D8B',
  'Yellow fever':              '#D4A017',
  'Lassa fever':               '#C00000',
  'Viral haemorrhagic fever':  '#8B0000',
  'Polio (cVDPV)':             '#059669',
}
const DEFAULT_COLOR = '#6B7C93'

const fmt = v => v >= 1_000_000 ? `${(v/1_000_000).toFixed(1)}M` : v >= 1000 ? `${(v/1000).toFixed(0)}k` : v

const ChartTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null
  return (
    <div className="chart-tooltip">
      <p className="tooltip-label">{label}</p>
      {payload.map(p => (
        <p key={p.dataKey} style={{ color: p.color }}>
          {p.name}: <strong>{p.value?.toLocaleString()}</strong>
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

export default function DiseaseDashboard() {
  const { selectedIsos, selectedYears, selectedDiseases, allDiseases: ALL_DISEASES } = useCountry()
  const { state, update, remove } = useDataStore()
  const { user } = useAuth()
  const canEdit = user.role === 'country_admin'

  const [view,         setView]         = useState('charts')
  const [focusDisease, setFocusDisease] = useState('All')
  const [editRecord,   setEditRecord]   = useState(null)
  const [deleteRecord, setDeleteRecord] = useState(null)

  const yLabel = !selectedYears.length || selectedYears.length === YEARS.length
    ? 'All Years' : selectedYears.length === 1 ? String(selectedYears[0]) : `${selectedYears.length} Years`

  const allDiseases = ALL_DISEASES
  const allDiseasesSelected = selectedDiseases.length === allDiseases.length

  // Disease summary: aggregate by disease for selected isos + years + diseases
  const diseases = useMemo(() => {
    const rows = state.surveillance.filter(s =>
      (!selectedIsos.length  || selectedIsos.includes(s.iso_3_code)) &&
      (!selectedYears.length || selectedYears.includes(s.year)) &&
      (allDiseasesSelected   || selectedDiseases.includes(s.disease))
    )
    const byDisease = {}
    rows.forEach(s => {
      if (!byDisease[s.disease]) {
        byDisease[s.disease] = { ...s, cases_reported: 0, deaths_reported: 0, _arSum: 0, _cfrSum: 0, _n: 0 }
      }
      byDisease[s.disease].cases_reported  += s.cases_reported           || 0
      byDisease[s.disease].deaths_reported += s.deaths_reported          || 0
      byDisease[s.disease]._arSum          += s.attack_rate_per_100k     || 0
      byDisease[s.disease]._cfrSum         += s.case_fatality_ratio_pct  || 0
      byDisease[s.disease]._n              += 1
    })
    return Object.values(byDisease).map(({ _arSum, _cfrSum, _n, ...d }) => ({
      ...d,
      attack_rate_per_100k:    _n > 0 ? _arSum  / _n : 0,
      case_fatality_ratio_pct: _n > 0 ? _cfrSum / _n : 0,
    }))
  }, [state.surveillance, selectedIsos, selectedYears])

  // Multi-disease trend matrix — only show selected diseases
  const matrix = useMemo(() =>
    YEARS.map(year => {
      const row = { year }
      allDiseases.forEach(d => {
        if (!allDiseasesSelected && !selectedDiseases.includes(d)) return
        const entries = state.surveillance.filter(
          s => (!selectedIsos.length || selectedIsos.includes(s.iso_3_code)) && s.year === year && s.disease === d
        )
        row[d] = entries.reduce((sum, e) => sum + (e.cases_reported ?? 0), 0)
      })
      return row
    }), [state.surveillance, selectedIsos, allDiseases, selectedDiseases, allDiseasesSelected])

  // Single disease 5-year trend
  const diseaseTrend = useMemo(() => {
    if (focusDisease === 'All') return null
    return YEARS.map(year => {
      const rows = state.surveillance.filter(
        s => (!selectedIsos.length || selectedIsos.includes(s.iso_3_code)) && s.year === year && s.disease === focusDisease
      )
      const n = rows.length || 1
      return {
        year,
        cases:      rows.reduce((s, r) => s + (r.cases_reported           ?? 0), 0),
        deaths:     rows.reduce((s, r) => s + (r.deaths_reported          ?? 0), 0),
        attackRate: rows.reduce((s, r) => s + (r.attack_rate_per_100k     ?? 0), 0) / n,
        cfr:        rows.reduce((s, r) => s + (r.case_fatality_ratio_pct  ?? 0), 0) / n,
      }
    })
  }, [state.surveillance, selectedIsos, focusDisease])

  // All rows for Data Table tab
  const allSurvRows = useMemo(() =>
    state.surveillance.filter(s =>
      (!selectedIsos.length  || selectedIsos.includes(s.iso_3_code)) &&
      (!selectedYears.length || selectedYears.includes(s.year)) &&
      (allDiseasesSelected   || selectedDiseases.includes(s.disease))
    ).sort((a, b) => b.year - a.year || a.iso_3_code.localeCompare(b.iso_3_code) || a.disease.localeCompare(b.disease))
  , [state.surveillance, selectedIsos, selectedYears, selectedDiseases, allDiseasesSelected])

  function handleSaveEdit(changes) {
    update('surveillance', rowId('surveillance', editRecord), changes)
    setEditRecord(null)
  }

  function handleConfirmDelete() {
    remove('surveillance', rowId('surveillance', deleteRecord))
    setDeleteRecord(null)
  }

  if (!selectedIsos.length) return <div className="page-empty">Select a country above.</div>

  const multiIso = selectedIsos.length > 1

  return (
    <>
      <div className="page-header-slim">
        <h1 className="page-title">Disease Surveillance</h1>
        <p className="page-desc">Notifiable disease data · {yLabel}</p>
      </div>

      <PageTabs view={view} onChange={setView} />

      {view === 'charts' && <>

      <section className="section">
        <div className="card">
          <div className="card-header">
            <h2 className="card-title">Disease Summary — {yLabel}</h2>
          </div>
          <div className="table-wrapper">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Disease</th>
                  <th>Cases Reported</th>
                  <th>Deaths</th>
                  <th>Attack Rate / 100k</th>
                  <th>CFR (%)</th>
                  {canEdit && !multiIso && <th className="actions-col">Actions</th>}
                </tr>
              </thead>
              <tbody>
                {diseases.length === 0 && (
                  <tr><td colSpan={canEdit && !multiIso ? 6 : 5} className="table-empty">No data for selected filters</td></tr>
                )}
                {diseases.map(d => (
                  <tr key={d.disease}>
                    <td>
                      <span className="disease-dot" style={{ background: DISEASE_COLORS[d.disease] || DEFAULT_COLOR }} />
                      {d.disease}
                    </td>
                    <td className="num">{d.cases_reported?.toLocaleString()}</td>
                    <td className="num">{d.deaths_reported?.toLocaleString()}</td>
                    <td className="num">{d.attack_rate_per_100k?.toFixed(3)}</td>
                    <td className={`num ${d.case_fatality_ratio_pct > 10 ? 'text-danger' : d.case_fatality_ratio_pct > 5 ? 'text-warn' : ''}`}>
                      {d.case_fatality_ratio_pct?.toFixed(2)}
                    </td>
                    {canEdit && !multiIso && (
                      <td className="actions-col">
                        <EditBtn   onClick={() => setEditRecord(d)}   />
                        <DeleteBtn onClick={() => setDeleteRecord(d)} />
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      <section className="section">
        <div className="card">
          <div className="card-header">
            <h2 className="card-title">Cases by Disease — 2021–2025</h2>
            <span className="card-subtitle">All notifiable diseases</span>
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={matrix} margin={{ top: 8, right: 24, left: 8, bottom: 8 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E5EAF0" />
              <XAxis dataKey="year" tick={{ fontSize: 11, fill: '#6B7C93' }} />
              <YAxis tickFormatter={fmt} tick={{ fontSize: 11, fill: '#6B7C93' }} width={52} />
              <Tooltip content={<ChartTooltip />} />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              {allDiseases.map(d => (
                <Line key={d} type="monotone" dataKey={d} name={d}
                  stroke={DISEASE_COLORS[d] || DEFAULT_COLOR} strokeWidth={2} dot={{ r: 3 }} activeDot={{ r: 5 }} />
              ))}
            </LineChart>
          </ResponsiveContainer>
        </div>
      </section>

      <section className="section">
        <div className="card">
          <div className="card-header">
            <h2 className="card-title">Single Disease — 5-Year Trend</h2>
            <select className="select-control select-sm" value={focusDisease} onChange={e => setFocusDisease(e.target.value)}>
              <option value="All">Select a disease…</option>
              {allDiseases.map(d => <option key={d} value={d}>{d}</option>)}
            </select>
          </div>

          {focusDisease === 'All' ? (
            <div className="chart-empty" style={{ height: 180 }}>Select a disease to see its trend</div>
          ) : (
            <>
              <div className="disease-kpi-row">
                {diseaseTrend?.map(r => (
                  <div key={r.year} className={`disease-kpi-cell${selectedYears.includes(r.year) ? ' highlighted' : ''}`}>
                    <div className="disease-kpi-year">{r.year}</div>
                    <div className="disease-kpi-cases">{r.cases.toLocaleString()}</div>
                    <div className="disease-kpi-label">cases</div>
                    <div className="disease-kpi-deaths">{r.deaths.toLocaleString()} deaths</div>
                    <div className="disease-kpi-cfr">{r.cfr.toFixed(1)}% CFR</div>
                  </div>
                ))}
              </div>
              <ResponsiveContainer width="100%" height={240}>
                <LineChart data={diseaseTrend} margin={{ top: 8, right: 24, left: 8, bottom: 8 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E5EAF0" />
                  <XAxis dataKey="year" tick={{ fontSize: 11, fill: '#6B7C93' }} />
                  <YAxis tickFormatter={fmt} tick={{ fontSize: 11, fill: '#6B7C93' }} width={52} />
                  <Tooltip content={<ChartTooltip />} />
                  <Legend wrapperStyle={{ fontSize: 12 }} />
                  <Line type="monotone" dataKey="cases"  name="Cases"  stroke={DISEASE_COLORS[focusDisease] || DEFAULT_COLOR} strokeWidth={2.5} dot={{ r: 4 }} />
                  <Line type="monotone" dataKey="deaths" name="Deaths" stroke="#C00000" strokeWidth={2.5} dot={{ r: 4 }} strokeDasharray="5 3" />
                </LineChart>
              </ResponsiveContainer>
            </>
          )}
        </div>
      </section>

      </>}

      {view === 'table' && (
        <section className="section">
          <div className="card">
            <div className="card-header">
              <h2 className="card-title">Disease Surveillance — All Years</h2>
              <span className="card-subtitle">{allSurvRows.length} records</span>
            </div>
            <div className="table-wrapper">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Year</th>
                    {multiIso && <th>Country</th>}
                    <th>Disease</th>
                    <th>Cases Reported</th>
                    <th>Deaths Reported</th>
                    <th>Attack Rate / 100k</th>
                    <th>CFR (%)</th>
                    {canEdit && !multiIso && <th className="actions-col">Actions</th>}
                  </tr>
                </thead>
                <tbody>
                  {allSurvRows.length === 0 && (
                    <tr><td colSpan={6 + (multiIso ? 1 : 0)} className="table-empty">No records found</td></tr>
                  )}
                  {allSurvRows.map(d => (
                    <tr key={`${d.iso_3_code}-${d.year}-${d.disease}`}
                      className={selectedYears.includes(d.year) ? 'row-highlighted' : ''}>
                      <td>
                        <strong>{d.year}</strong>
                        {selectedYears.includes(d.year) && selectedYears.length < YEARS.length && (
                          <span className="year-badge">selected</span>
                        )}
                      </td>
                      {multiIso && <td className="mono">{d.iso_3_code}</td>}
                      <td>
                        <span className="disease-dot" style={{ background: DISEASE_COLORS[d.disease] || DEFAULT_COLOR }} />
                        {d.disease}
                      </td>
                      <td className="num">{d.cases_reported?.toLocaleString()}</td>
                      <td className="num">{d.deaths_reported?.toLocaleString()}</td>
                      <td className="num">{d.attack_rate_per_100k?.toFixed(3)}</td>
                      <td className={`num ${d.case_fatality_ratio_pct > 10 ? 'text-danger' : d.case_fatality_ratio_pct > 5 ? 'text-warn' : ''}`}>
                        {d.case_fatality_ratio_pct?.toFixed(2)}%
                      </td>
                      {canEdit && !multiIso && (
                        <td className="actions-col">
                          <EditBtn   onClick={() => setEditRecord(d)}   />
                          <DeleteBtn onClick={() => setDeleteRecord(d)} />
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
        <EditRecordModal record={editRecord} tableType="surveillance" onSave={handleSaveEdit} onClose={() => setEditRecord(null)} />
      )}
      {deleteRecord && (
        <ConfirmDialog
          title="Delete Surveillance Record"
          message={`Delete ${deleteRecord.disease} data for ${deleteRecord.year}? This cannot be undone.`}
          onConfirm={handleConfirmDelete}
          onCancel={() => setDeleteRecord(null)}
        />
      )}
    </>
  )
}

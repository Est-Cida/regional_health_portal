import { useMemo, useState } from 'react'
import { useCountry } from '../../context/CountryContext'
import { useDataStore, rowId } from '../../context/DataStore'
import { useAuth } from '../../context/AuthContext'
import { getDiseaseList, YEARS } from '../../data/dataService'
import EditRecordModal from '../../components/EditRecordModal'
import ConfirmDialog from '../../components/ConfirmDialog'
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
  const { selectedIso, selectedYear } = useCountry()
  const { state, update, remove } = useDataStore()
  const { user } = useAuth()
  const canEdit = user.role === 'country_admin'

  const [focusDisease, setFocusDisease] = useState('All')
  const [editRecord,   setEditRecord]   = useState(null)
  const [deleteRecord, setDeleteRecord] = useState(null)

  const allDiseases = useMemo(() => getDiseaseList(), [])

  // Disease rows for selected country + year (from DataStore)
  const diseases = useMemo(() => {
    if (!selectedIso) return []
    return state.surveillance
      .filter(s => s.iso_3_code === selectedIso && s.year === Number(selectedYear))
  }, [state.surveillance, selectedIso, selectedYear])

  // Multi-disease trend matrix (DataStore-aware)
  const matrix = useMemo(() => {
    if (!selectedIso) return []
    return YEARS.map(year => {
      const row = { year }
      allDiseases.forEach(d => {
        const entry = state.surveillance.find(
          s => s.iso_3_code === selectedIso && s.year === year && s.disease === d,
        )
        row[d] = entry?.cases_reported ?? 0
      })
      return row
    })
  }, [state.surveillance, selectedIso, allDiseases])

  // Single disease 5-year trend (DataStore-aware)
  const diseaseTrend = useMemo(() => {
    if (!selectedIso || focusDisease === 'All') return null
    return YEARS.map(year => {
      const row = state.surveillance.find(
        s => s.iso_3_code === selectedIso && s.year === year && s.disease === focusDisease,
      )
      return {
        year,
        cases:      row?.cases_reported           ?? 0,
        deaths:     row?.deaths_reported          ?? 0,
        attackRate: row?.attack_rate_per_100k      ?? 0,
        cfr:        row?.case_fatality_ratio_pct   ?? 0,
      }
    })
  }, [state.surveillance, selectedIso, focusDisease])

  function handleSaveEdit(changes) {
    update('surveillance', rowId('surveillance', editRecord), changes)
    setEditRecord(null)
  }

  function handleConfirmDelete() {
    remove('surveillance', rowId('surveillance', deleteRecord))
    setDeleteRecord(null)
  }

  if (!selectedIso) return <div className="page-empty">Select a country above.</div>

  return (
    <>
      <div className="page-header-slim">
        <h1 className="page-title">Disease Surveillance</h1>
        <p className="page-desc">Notifiable disease data · {selectedYear}</p>
      </div>

      {/* Summary table */}
      <section className="section">
        <div className="card">
          <div className="card-header">
            <h2 className="card-title">Disease Summary — {selectedYear}</h2>
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
                  {canEdit && <th className="actions-col">Actions</th>}
                </tr>
              </thead>
              <tbody>
                {diseases.length === 0 && (
                  <tr><td colSpan={canEdit ? 6 : 5} className="table-empty">No data for {selectedYear}</td></tr>
                )}
                {diseases.map(d => (
                  <tr key={d.disease}>
                    <td>
                      <span
                        className="disease-dot"
                        style={{ background: DISEASE_COLORS[d.disease] || DEFAULT_COLOR }}
                      />
                      {d.disease}
                    </td>
                    <td className="num">{d.cases_reported?.toLocaleString()}</td>
                    <td className="num">{d.deaths_reported?.toLocaleString()}</td>
                    <td className="num">{d.attack_rate_per_100k?.toFixed(3)}</td>
                    <td className={`num ${d.case_fatality_ratio_pct > 10 ? 'text-danger' : d.case_fatality_ratio_pct > 5 ? 'text-warn' : ''}`}>
                      {d.case_fatality_ratio_pct?.toFixed(2)}
                    </td>
                    {canEdit && (
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

      {/* Multi-disease trend */}
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
                <Line
                  key={d}
                  type="monotone"
                  dataKey={d}
                  name={d}
                  stroke={DISEASE_COLORS[d] || DEFAULT_COLOR}
                  strokeWidth={2}
                  dot={{ r: 3 }}
                  activeDot={{ r: 5 }}
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
        </div>
      </section>

      {/* Per-disease drill-down */}
      <section className="section">
        <div className="card">
          <div className="card-header">
            <h2 className="card-title">Single Disease — 5-Year Trend</h2>
            <select
              className="select-control select-sm"
              value={focusDisease}
              onChange={e => setFocusDisease(e.target.value)}
            >
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
                  <div key={r.year} className={`disease-kpi-cell${r.year === selectedYear ? ' highlighted' : ''}`}>
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

      {editRecord && (
        <EditRecordModal
          record={editRecord}
          tableType="surveillance"
          onSave={handleSaveEdit}
          onClose={() => setEditRecord(null)}
        />
      )}

      {deleteRecord && (
        <ConfirmDialog
          title="Delete Surveillance Record"
          message={`Delete ${deleteRecord.disease} data for ${selectedYear}? This cannot be undone.`}
          onConfirm={handleConfirmDelete}
          onCancel={() => setDeleteRecord(null)}
        />
      )}
    </>
  )
}

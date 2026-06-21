import { useMemo, useState } from 'react'
import { useCountry } from '../../context/CountryContext'
import { useDataStore, rowId } from '../../context/DataStore'
import { useAuth } from '../../context/AuthContext'
import EditRecordModal from '../../components/EditRecordModal'
import ConfirmDialog from '../../components/ConfirmDialog'
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  Legend, ResponsiveContainer, BarChart, Bar,
} from 'recharts'

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

function MetricProgress({ label, value, unit = '%', max = 100, color }) {
  const pct = Math.min((value / max) * 100, 100)
  const c = color || (pct >= 80 ? '#059669' : pct >= 50 ? '#D97706' : '#C00000')
  return (
    <div className="metric-progress-row">
      <div className="metric-progress-header">
        <span className="metric-progress-label">{label}</span>
        <span className="metric-progress-value" style={{ color: c }}>{value?.toFixed(1)}{unit}</span>
      </div>
      <div className="metric-bar-track" style={{ width: '100%' }}>
        <div className="metric-bar-fill" style={{ width: `${pct}%`, background: c }} />
      </div>
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

export default function CapacityDashboard() {
  const { selectedIso, selectedYear } = useCountry()
  const { state, update, remove } = useDataStore()
  const { user } = useAuth()
  const canEdit = user.role === 'country_admin'

  const [editWF,   setEditWF]   = useState(null)
  const [deleteWF, setDeleteWF] = useState(null)
  const [editRep,  setEditRep]  = useState(null)
  const [deleteRep, setDeleteRep] = useState(null)

  const workforceAll = useMemo(
    () => state.workforce.filter(w => w.iso_3_code === selectedIso).sort((a, b) => a.year - b.year),
    [state.workforce, selectedIso],
  )
  const reportingAll = useMemo(
    () => state.reporting.filter(r => r.iso_3_code === selectedIso).sort((a, b) => a.year - b.year),
    [state.reporting, selectedIso],
  )

  const workforce = useMemo(
    () => workforceAll.find(w => w.year === Number(selectedYear)) || null,
    [workforceAll, selectedYear],
  )
  const reporting = useMemo(
    () => reportingAll.find(r => r.year === Number(selectedYear)) || null,
    [reportingAll, selectedYear],
  )

  if (!selectedIso) return <div className="page-empty">Select a country above.</div>

  return (
    <>
      <div className="page-header-slim">
        <h1 className="page-title">Health Capacity</h1>
        <p className="page-desc">Workforce &amp; surveillance reporting · {selectedYear}</p>
      </div>

      {/* ── Workforce ──────────────────────────────────────────────── */}
      <section className="section">
        <h2 className="section-heading">Health Workforce</h2>

        <div className="kpi-grid kpi-grid-3 section">
          <div className="kpi-card" style={{ borderTop: '4px solid #0071BC', background: '#EBF5FF' }}>
            <div className="kpi-card-header"><span className="kpi-title">Epidemiologists</span></div>
            <div className="kpi-value" style={{ color: '#0071BC' }}>{workforce?.epidemiologists_total?.toLocaleString() ?? '—'}</div>
            <div className="kpi-subtitle">{workforce?.epidemiologists_per_100k?.toFixed(3) ?? '—'} per 100k pop</div>
          </div>
          <div className="kpi-card" style={{ borderTop: '4px solid #059669', background: '#ECFDF5' }}>
            <div className="kpi-card-header"><span className="kpi-title">FELTP Trained</span></div>
            <div className="kpi-value" style={{ color: '#059669' }}>{workforce?.feltp_trained_total?.toLocaleString() ?? '—'}</div>
            <div className="kpi-subtitle">{workforce?.feltp_trained_pct?.toFixed(1) ?? '—'}% of epidemiologists</div>
          </div>
          <div className="kpi-card" style={{ borderTop: '4px solid #7B2D8B', background: '#F5F0FF' }}>
            <div className="kpi-card-header"><span className="kpi-title">Lab Technicians</span></div>
            <div className="kpi-value" style={{ color: '#7B2D8B' }}>{workforce?.lab_technicians_total?.toLocaleString() ?? '—'}</div>
            <div className="kpi-subtitle">{workforce?.lab_technicians_per_100k?.toFixed(2) ?? '—'} per 100k pop</div>
          </div>
        </div>

        <div className="charts-grid">
          <div className="card">
            <div className="card-header">
              <h2 className="card-title">Epidemiologist Count — 2021–2025</h2>
            </div>
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={workforceAll} margin={{ top: 8, right: 24, left: 8, bottom: 8 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5EAF0" />
                <XAxis dataKey="year" tick={{ fontSize: 11, fill: '#6B7C93' }} />
                <YAxis tick={{ fontSize: 11, fill: '#6B7C93' }} />
                <Tooltip content={<ChartTooltip />} />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                <Bar dataKey="epidemiologists_total" name="Epidemiologists" fill="#0071BC" radius={[4, 4, 0, 0]} />
                <Bar dataKey="feltp_trained_total"   name="FELTP Trained"  fill="#059669" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="card">
            <div className="card-header">
              <h2 className="card-title">FELTP Training Rate (%)</h2>
            </div>
            <ResponsiveContainer width="100%" height={240}>
              <LineChart data={workforceAll} margin={{ top: 8, right: 24, left: 8, bottom: 8 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E5EAF0" />
                <XAxis dataKey="year" tick={{ fontSize: 11, fill: '#6B7C93' }} />
                <YAxis tickFormatter={v => `${v}%`} domain={[0, 100]} tick={{ fontSize: 11, fill: '#6B7C93' }} />
                <Tooltip content={<ChartTooltip />} formatter={v => [`${v?.toFixed(1)}%`]} />
                <Line type="monotone" dataKey="feltp_trained_pct" name="FELTP %" stroke="#059669" strokeWidth={2.5} dot={{ r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Workforce data table */}
        <div className="card">
          <div className="card-header"><h2 className="card-title">Workforce Data by Year</h2></div>
          <div className="table-wrapper">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Year</th>
                  <th>Epidemiologists</th>
                  <th>Epi / 100k</th>
                  <th>FELTP Trained</th>
                  <th>FELTP %</th>
                  <th>Lab Technicians</th>
                  <th>Lab Tech / 100k</th>
                  {canEdit && <th className="actions-col">Actions</th>}
                </tr>
              </thead>
              <tbody>
                {workforceAll.map(r => (
                  <tr key={r.year} className={r.year === selectedYear ? 'row-highlighted' : ''}>
                    <td><strong>{r.year}</strong>{r.year === selectedYear && <span className="year-badge">selected</span>}</td>
                    <td className="num">{r.epidemiologists_total}</td>
                    <td className="num">{r.epidemiologists_per_100k?.toFixed(3)}</td>
                    <td className="num">{r.feltp_trained_total}</td>
                    <td className={`num ${r.feltp_trained_pct >= 50 ? 'text-success' : 'text-warn'}`}>
                      {r.feltp_trained_pct?.toFixed(1)}%
                    </td>
                    <td className="num">{r.lab_technicians_total}</td>
                    <td className="num">{r.lab_technicians_per_100k?.toFixed(2)}</td>
                    {canEdit && (
                      <td className="actions-col">
                        <EditBtn   onClick={() => setEditWF(r)}   />
                        <DeleteBtn onClick={() => setDeleteWF(r)} />
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* ── Reporting Metrics ──────────────────────────────────────── */}
      <section className="section">
        <h2 className="section-heading">Surveillance Reporting — {selectedYear}</h2>

        {reporting ? (
          <div className="capacity-card" style={{ marginBottom: 16 }}>
            <MetricProgress label="Timeliness"             value={reporting.timeliness_pct} />
            <MetricProgress label="Completeness"           value={reporting.completeness_pct} />
            <MetricProgress label="IDSR Weekly Compliance" value={reporting.idsr_weekly_compliance_pct} />
          </div>
        ) : (
          <p className="no-data">No reporting data for {selectedYear}</p>
        )}

        <div className="card">
          <div className="card-header">
            <h2 className="card-title">Reporting Metrics Trend — 2021–2025</h2>
          </div>
          <ResponsiveContainer width="100%" height={260}>
            <LineChart data={reportingAll} margin={{ top: 8, right: 24, left: 8, bottom: 8 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E5EAF0" />
              <XAxis dataKey="year" tick={{ fontSize: 11, fill: '#6B7C93' }} />
              <YAxis tickFormatter={v => `${v}%`} domain={[0, 100]} tick={{ fontSize: 11, fill: '#6B7C93' }} />
              <Tooltip content={<ChartTooltip />} formatter={v => [`${v?.toFixed(1)}%`]} />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              <Line type="monotone" dataKey="timeliness_pct"              name="Timeliness"      stroke="#0071BC" strokeWidth={2} dot={{ r: 3 }} />
              <Line type="monotone" dataKey="completeness_pct"            name="Completeness"    stroke="#059669" strokeWidth={2} dot={{ r: 3 }} />
              <Line type="monotone" dataKey="idsr_weekly_compliance_pct"  name="IDSR Compliance" stroke="#D97706" strokeWidth={2} dot={{ r: 3 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Reporting data table */}
        <div className="card" style={{ marginTop: 16 }}>
          <div className="card-header"><h2 className="card-title">Reporting Data by Year</h2></div>
          <div className="table-wrapper">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Year</th>
                  <th>Timeliness %</th>
                  <th>Completeness %</th>
                  <th>IDSR Compliance %</th>
                  {canEdit && <th className="actions-col">Actions</th>}
                </tr>
              </thead>
              <tbody>
                {reportingAll.map(r => (
                  <tr key={r.year} className={r.year === selectedYear ? 'row-highlighted' : ''}>
                    <td><strong>{r.year}</strong>{r.year === selectedYear && <span className="year-badge">selected</span>}</td>
                    <td className={`num ${r.timeliness_pct >= 80 ? 'text-success' : r.timeliness_pct < 50 ? 'text-danger' : 'text-warn'}`}>
                      {r.timeliness_pct?.toFixed(1)}%
                    </td>
                    <td className={`num ${r.completeness_pct >= 80 ? 'text-success' : r.completeness_pct < 50 ? 'text-danger' : 'text-warn'}`}>
                      {r.completeness_pct?.toFixed(1)}%
                    </td>
                    <td className={`num ${r.idsr_weekly_compliance_pct >= 80 ? 'text-success' : r.idsr_weekly_compliance_pct < 50 ? 'text-danger' : 'text-warn'}`}>
                      {r.idsr_weekly_compliance_pct?.toFixed(1)}%
                    </td>
                    {canEdit && (
                      <td className="actions-col">
                        <EditBtn   onClick={() => setEditRep(r)}   />
                        <DeleteBtn onClick={() => setDeleteRep(r)} />
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* Workforce modals */}
      {editWF && (
        <EditRecordModal
          record={editWF}
          tableType="workforce"
          onSave={changes => { update('workforce', rowId('workforce', editWF), changes); setEditWF(null) }}
          onClose={() => setEditWF(null)}
        />
      )}
      {deleteWF && (
        <ConfirmDialog
          title="Delete Workforce Record"
          message={`Delete workforce data for ${deleteWF.year}? This cannot be undone.`}
          onConfirm={() => { remove('workforce', rowId('workforce', deleteWF)); setDeleteWF(null) }}
          onCancel={() => setDeleteWF(null)}
        />
      )}

      {/* Reporting modals */}
      {editRep && (
        <EditRecordModal
          record={editRep}
          tableType="reporting"
          onSave={changes => { update('reporting', rowId('reporting', editRep), changes); setEditRep(null) }}
          onClose={() => setEditRep(null)}
        />
      )}
      {deleteRep && (
        <ConfirmDialog
          title="Delete Reporting Record"
          message={`Delete reporting metrics for ${deleteRep.year}? This cannot be undone.`}
          onConfirm={() => { remove('reporting', rowId('reporting', deleteRep)); setDeleteRep(null) }}
          onCancel={() => setDeleteRep(null)}
        />
      )}
    </>
  )
}

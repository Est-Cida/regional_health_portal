import { useMemo } from 'react'
import { useCountry } from '../../context/CountryContext'
import { getWorkforce, getWorkforceAllYears, getReporting, getReportingAllYears } from '../../data/dataService'
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

export default function CapacityDashboard() {
  const { selectedIso, selectedYear } = useCountry()

  const workforce     = useMemo(() => selectedIso ? getWorkforce(selectedIso, selectedYear)         : null, [selectedIso, selectedYear])
  const workforceAll  = useMemo(() => selectedIso ? getWorkforceAllYears(selectedIso)               : [], [selectedIso])
  const reporting     = useMemo(() => selectedIso ? getReporting(selectedIso, selectedYear)         : null, [selectedIso, selectedYear])
  const reportingAll  = useMemo(() => selectedIso ? getReportingAllYears(selectedIso)               : [], [selectedIso])

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
      </section>

      {/* ── Reporting Metrics ──────────────────────────────────────── */}
      <section className="section">
        <h2 className="section-heading">Surveillance Reporting — {selectedYear}</h2>

        {reporting ? (
          <div className="capacity-card" style={{ marginBottom: 16 }}>
            <MetricProgress label="Timeliness"              value={reporting.timeliness_pct} />
            <MetricProgress label="Completeness"            value={reporting.completeness_pct} />
            <MetricProgress label="IDSR Weekly Compliance"  value={reporting.idsr_weekly_compliance_pct} />
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
              <Line type="monotone" dataKey="timeliness_pct"              name="Timeliness"     stroke="#0071BC" strokeWidth={2} dot={{ r: 3 }} />
              <Line type="monotone" dataKey="completeness_pct"            name="Completeness"   stroke="#059669" strokeWidth={2} dot={{ r: 3 }} />
              <Line type="monotone" dataKey="idsr_weekly_compliance_pct"  name="IDSR Compliance" stroke="#D97706" strokeWidth={2} dot={{ r: 3 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </section>

      {/* Workforce data table */}
      <section className="section">
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
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>
    </>
  )
}

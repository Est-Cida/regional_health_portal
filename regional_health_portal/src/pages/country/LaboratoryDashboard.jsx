import { useMemo } from 'react'
import { useCountry } from '../../context/CountryContext'
import { getLabCapacity, getLabCapacityAllYears } from '../../data/dataService'
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
        <circle
          cx={cx} cy={cy} r={r} fill="none"
          stroke={color} strokeWidth="12"
          strokeLinecap="round"
          strokeDasharray={`${dash} ${circ}`}
          transform={`rotate(-90 ${cx} ${cy})`}
          style={{ transition: 'stroke-dasharray .6s ease' }}
        />
        <text x={cx} y={cy + 6} textAnchor="middle" fill={color} fontSize="20" fontWeight="800">
          {value?.toFixed(1)}%
        </text>
      </svg>
      <div className="gauge-label">ISO 15189<br/>Accreditation</div>
    </div>
  )
}

export default function LaboratoryDashboard() {
  const { selectedIso, selectedYear } = useCountry()

  const current = useMemo(() => selectedIso ? getLabCapacity(selectedIso, selectedYear)     : null, [selectedIso, selectedYear])
  const allYears = useMemo(() => selectedIso ? getLabCapacityAllYears(selectedIso)           : [], [selectedIso])

  if (!selectedIso) return <div className="page-empty">Select a country above.</div>

  return (
    <>
      <div className="page-header-slim">
        <h1 className="page-title">Laboratory Capacity</h1>
        <p className="page-desc">Lab infrastructure, accreditation &amp; diagnostic output · {selectedYear}</p>
      </div>

      {/* KPI cards + gauge */}
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
                {current?.avg_turnaround_time_days?.toFixed(1) ?? '—'}
                <span style={{ fontSize: 14 }}> d</span>
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

      {/* Trend charts */}
      <section className="section">
        <div className="charts-grid">
          <div className="card">
            <div className="card-header">
              <h2 className="card-title">ISO 15189 Accreditation Rate (%)</h2>
            </div>
            <ResponsiveContainer width="100%" height={260}>
              <LineChart data={allYears} margin={{ top: 8, right: 24, left: 8, bottom: 8 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E5EAF0" />
                <XAxis dataKey="year" tick={{ fontSize: 11, fill: '#6B7C93' }} />
                <YAxis domain={[0, 100]} tickFormatter={v => `${v}%`} tick={{ fontSize: 11, fill: '#6B7C93' }} />
                <Tooltip content={<ChartTooltip />} formatter={v => [`${v?.toFixed(1)}%`]} />
                <Line type="monotone" dataKey="iso15189_accreditation_pct" name="Accreditation %" stroke="#059669" strokeWidth={2.5} dot={{ r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>

          <div className="card">
            <div className="card-header">
              <h2 className="card-title">Avg. Turnaround Time (days)</h2>
            </div>
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

      {/* Diagnostic tests trend */}
      <section className="section">
        <div className="card">
          <div className="card-header">
            <h2 className="card-title">Diagnostic Tests per 100k Population</h2>
          </div>
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

      {/* Year-by-year data table */}
      <section className="section">
        <div className="card">
          <div className="card-header">
            <h2 className="card-title">Laboratory Data by Year</h2>
          </div>
          <div className="table-wrapper">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Year</th>
                  <th>Public Labs</th>
                  <th>Accredited Labs</th>
                  <th>Accreditation %</th>
                  <th>Avg. Turnaround (days)</th>
                  <th>Tests / 100k</th>
                </tr>
              </thead>
              <tbody>
                {allYears.map(r => (
                  <tr key={r.year} className={r.year === selectedYear ? 'row-highlighted' : ''}>
                    <td><strong>{r.year}</strong>{r.year === selectedYear && <span className="year-badge">selected</span>}</td>
                    <td className="num">{r.total_public_labs}</td>
                    <td className="num">{r.labs_iso15189_accredited}</td>
                    <td className={`num ${r.iso15189_accreditation_pct >= 80 ? 'text-success' : r.iso15189_accreditation_pct < 50 ? 'text-danger' : 'text-warn'}`}>
                      {r.iso15189_accreditation_pct?.toFixed(1)}%
                    </td>
                    <td className={`num ${r.avg_turnaround_time_days > 5 ? 'text-warn' : ''}`}>
                      {r.avg_turnaround_time_days?.toFixed(1)}
                    </td>
                    <td className="num">{r.diagnostic_tests_per_100k}</td>
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

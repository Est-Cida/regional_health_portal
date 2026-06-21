import { useMemo, useState } from 'react'
import { useCountry } from '../../context/CountryContext'
import {
  getSurveillanceSummary,
  getDiseaseYearMatrix,
  getDiseaseList,
  getDiseaseTrend,
  YEARS,
} from '../../data/dataService'
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

export default function DiseaseDashboard() {
  const { selectedIso, selectedYear } = useCountry()
  const [focusDisease, setFocusDisease] = useState('All')

  const allDiseases = useMemo(() => selectedIso ? getDiseaseList() : [], [selectedIso])
  const summary     = useMemo(() => selectedIso ? getSurveillanceSummary(selectedIso, selectedYear) : null, [selectedIso, selectedYear])
  const matrix      = useMemo(() => selectedIso ? getDiseaseYearMatrix(selectedIso) : [], [selectedIso])

  const diseaseTrend = useMemo(() => {
    if (!selectedIso || focusDisease === 'All') return null
    return getDiseaseTrend(selectedIso, focusDisease)
  }, [selectedIso, focusDisease])

  if (!selectedIso) return <div className="page-empty">Select a country above.</div>

  const diseases = summary?.diseaseBreakdown || []

  return (
    <>
      <div className="page-header-slim">
        <h1 className="page-title">Disease Surveillance</h1>
        <p className="page-desc">Notifiable disease data · {selectedYear}</p>
      </div>

      {/* Summary table for selected year */}
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
                </tr>
              </thead>
              <tbody>
                {diseases.length === 0 && (
                  <tr><td colSpan={5} className="table-empty">No data for {selectedYear}</td></tr>
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
                    <td className="num">{d.cases?.toLocaleString()}</td>
                    <td className="num">{d.deaths?.toLocaleString()}</td>
                    <td className="num">{d.attackRate?.toFixed(3)}</td>
                    <td className={`num ${d.cfr > 10 ? 'text-danger' : d.cfr > 5 ? 'text-warn' : ''}`}>
                      {d.cfr?.toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* Multi-disease trend chart */}
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
              {/* KPI row for selected disease */}
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
    </>
  )
}

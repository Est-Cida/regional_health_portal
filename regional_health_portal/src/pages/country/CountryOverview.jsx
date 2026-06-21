import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useCountry } from '../../context/CountryContext'
import { useDataStore } from '../../context/DataStore'
import { useAuth } from '../../context/AuthContext'
import KPICard from '../../components/cards/KPICard'
import DiseaseBarChart from '../../components/charts/DiseaseBarChart'
import TrendLineChart from '../../components/charts/TrendLineChart'
import PageTabs from '../../components/PageTabs'
import {
  getSurveillanceSummary,
  getSurveillanceTrend,
  getOutbreaks,
  getLabCapacity,
  YEARS,
} from '../../data/dataService'

const fmtM = v => v != null ? `$${(v / 1_000_000).toFixed(1)}M` : '—'

export default function CountryOverview() {
  const { selectedIso, selectedYear } = useCountry()
  const { state } = useDataStore()
  const { user } = useAuth()
  const navigate = useNavigate()

  const [view, setView] = useState('charts')

  const summary     = useMemo(() => selectedIso ? getSurveillanceSummary(selectedIso, selectedYear) : null, [selectedIso, selectedYear])
  const trend       = useMemo(() => selectedIso ? getSurveillanceTrend(selectedIso)                 : [], [selectedIso])
  const outbreaks   = useMemo(() => selectedIso ? getOutbreaks(selectedIso, selectedYear)           : [], [selectedIso, selectedYear])
  const labData     = useMemo(() => selectedIso ? getLabCapacity(selectedIso, selectedYear)         : null, [selectedIso, selectedYear])

  const prevSummary = useMemo(() => (selectedIso && selectedYear > 2021)
    ? getSurveillanceSummary(selectedIso, selectedYear - 1) : null, [selectedIso, selectedYear])

  const caseTrend  = summary && prevSummary?.totalCases  > 0
    ? ((summary.totalCases  - prevSummary.totalCases)  / prevSummary.totalCases)  * 100 : undefined
  const deathTrend = summary && prevSummary?.totalDeaths > 0
    ? ((summary.totalDeaths - prevSummary.totalDeaths) / prevSummary.totalDeaths) * 100 : undefined

  // Multi-year summary from DataStore for the table tab
  const summaryRows = useMemo(() => {
    if (!selectedIso) return []
    return [...YEARS].reverse().map(year => {
      const survRows     = state.surveillance.filter(s => s.iso_3_code === selectedIso && s.year === year)
      const totalCases   = survRows.reduce((s, r) => s + (r.cases_reported  || 0), 0)
      const totalDeaths  = survRows.reduce((s, r) => s + (r.deaths_reported || 0), 0)
      const avgCFR       = survRows.length
        ? survRows.reduce((s, r) => s + (r.case_fatality_ratio_pct || 0), 0) / survRows.length : 0
      const outbreakCount = state.outbreaks.filter(o => o.iso_3_code === selectedIso && o.year === year).length
      const lab  = state.labCapacity.find(l => l.iso_3_code === selectedIso && l.year === year)
      const wf   = state.workforce.find(w => w.iso_3_code === selectedIso && w.year === year)
      const fund = state.funding.find(f => f.iso_3_code === selectedIso && f.year === year)
      return { year, totalCases, totalDeaths, avgCFR, outbreakCount,
        accreditation: lab?.iso15189_accreditation_pct  ?? null,
        epidemiologists: wf?.epidemiologists_total      ?? null,
        totalFunding: fund?.total_funding_usd           ?? null,
      }
    })
  }, [state, selectedIso])

  if (!selectedIso) return <div className="page-empty">Select a country to view its dashboard.</div>

  return (
    <>
      <PageTabs
        view={view}
        onChange={setView}
        tabs={[
          { key: 'charts', icon: '📊', label: 'Overview'      },
          { key: 'table',  icon: '📋', label: 'Summary Table' },
        ]}
      />

      {/* ── Charts / Overview tab ─────────────────────────────────────── */}
      {view === 'charts' && (
        <>
          <div className="kpi-grid section">
            <KPICard title="Total Cases"        value={summary?.totalCases?.toLocaleString()}              subtitle="All diseases"               color="blue"   icon="cases"  trend={caseTrend} />
            <KPICard title="Total Deaths"       value={summary?.totalDeaths?.toLocaleString()}             subtitle="All diseases"               color="red"    icon="deaths" trend={deathTrend} />
            <KPICard title="Avg. Attack Rate"   value={summary?.avgAttackRate?.toFixed(2)}                 subtitle="per 100,000 population"     color="orange" icon="attack" />
            <KPICard title="Avg. Case Fatality" value={summary ? `${summary.avgCFR?.toFixed(2)}%` : null} subtitle="Case fatality ratio"        color="purple" icon="cfr" />
            <KPICard title="Outbreaks"          value={outbreaks.length}                                   subtitle={`recorded in ${selectedYear}`} color="teal" icon="alert" />
            <KPICard title="Lab Accreditation"  value={labData ? `${labData.iso15189_accreditation_pct?.toFixed(1)}%` : null} subtitle="ISO 15189 certified" color="green" icon="lab" />
          </div>

          <div className="charts-grid section">
            <div className="card">
              <div className="card-header">
                <h2 className="card-title">Disease Burden — {selectedYear}</h2>
                <button className="btn-link" onClick={() => navigate('/country/diseases')}>View detail →</button>
              </div>
              <DiseaseBarChart data={summary?.diseaseBreakdown || []} />
            </div>
            <div className="card">
              <div className="card-header">
                <h2 className="card-title">5-Year Cases &amp; Deaths Trend</h2>
                <button className="btn-link" onClick={() => navigate('/country/diseases')}>View detail →</button>
              </div>
              <TrendLineChart data={trend} />
            </div>
          </div>

          <div className="section">
            <h2 className="section-heading">Explore Sections</h2>
            <div className="quicknav-grid">
              {[
                { to: '/country/diseases',   icon: '🦠', title: 'Disease Surveillance', desc: 'Cases, deaths, attack rates & CFR by pathogen' },
                { to: '/country/outbreaks',  icon: '⚠️', title: 'Outbreaks',           desc: 'Outbreak events, duration & detection times' },
                { to: '/country/laboratory', icon: '🔬', title: 'Laboratory',           desc: 'Lab accreditation, turnaround & diagnostic capacity' },
                { to: '/country/capacity',   icon: '👥', title: 'Health Capacity',      desc: 'Workforce, FELTP training & reporting metrics' },
                { to: '/country/funding',    icon: '💰', title: 'Funding',              desc: 'Domestic & external health financing trends' },
              ].map(item => (
                <button key={item.to} className="quicknav-card" onClick={() => navigate(item.to)}>
                  <span className="quicknav-icon">{item.icon}</span>
                  <div>
                    <div className="quicknav-title">{item.title}</div>
                    <div className="quicknav-desc">{item.desc}</div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </>
      )}

      {/* ── Summary Table tab ─────────────────────────────────────────── */}
      {view === 'table' && (
        <section className="section">
          <div className="card">
            <div className="card-header">
              <h2 className="card-title">Multi-Indicator Summary — All Years</h2>
              <span className="card-subtitle">All data shown for {selectedIso}</span>
            </div>
            <div className="table-wrapper">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Year</th>
                    <th>Total Cases</th>
                    <th>Total Deaths</th>
                    <th>Avg CFR %</th>
                    <th>Outbreaks</th>
                    <th>Lab Accred %</th>
                    <th>Epidemiologists</th>
                    <th>Total Funding</th>
                  </tr>
                </thead>
                <tbody>
                  {summaryRows.map(r => (
                    <tr key={r.year} className={r.year === selectedYear ? 'row-highlighted' : ''}>
                      <td><strong>{r.year}</strong>{r.year === selectedYear && <span className="year-badge">selected</span>}</td>
                      <td className="num">{r.totalCases.toLocaleString()}</td>
                      <td className="num">{r.totalDeaths.toLocaleString()}</td>
                      <td className={`num ${r.avgCFR > 10 ? 'text-danger' : r.avgCFR > 5 ? 'text-warn' : ''}`}>
                        {r.avgCFR.toFixed(2)}%
                      </td>
                      <td className="num">{r.outbreakCount}</td>
                      <td className={`num ${r.accreditation != null ? (r.accreditation >= 80 ? 'text-success' : r.accreditation < 50 ? 'text-danger' : 'text-warn') : ''}`}>
                        {r.accreditation != null ? `${r.accreditation.toFixed(1)}%` : '—'}
                      </td>
                      <td className="num">{r.epidemiologists?.toLocaleString() ?? '—'}</td>
                      <td className="num">{r.totalFunding != null ? fmtM(r.totalFunding) : '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </section>
      )}
    </>
  )
}

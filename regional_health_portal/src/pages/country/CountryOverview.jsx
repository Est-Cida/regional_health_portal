import { useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { useCountry } from '../../context/CountryContext'
import KPICard from '../../components/cards/KPICard'
import DiseaseBarChart from '../../components/charts/DiseaseBarChart'
import TrendLineChart from '../../components/charts/TrendLineChart'
import {
  getSurveillanceSummary,
  getSurveillanceTrend,
  getOutbreaks,
  getLabCapacity,
} from '../../data/dataService'

export default function CountryOverview() {
  const { selectedIso, selectedYear } = useCountry()
  const navigate = useNavigate()

  const summary     = useMemo(() => selectedIso ? getSurveillanceSummary(selectedIso, selectedYear)  : null, [selectedIso, selectedYear])
  const trend       = useMemo(() => selectedIso ? getSurveillanceTrend(selectedIso)                  : [], [selectedIso])
  const outbreaks   = useMemo(() => selectedIso ? getOutbreaks(selectedIso, selectedYear)            : [], [selectedIso, selectedYear])
  const labData     = useMemo(() => selectedIso ? getLabCapacity(selectedIso, selectedYear)          : null, [selectedIso, selectedYear])

  const prevSummary = useMemo(() => (selectedIso && selectedYear > 2021)
    ? getSurveillanceSummary(selectedIso, selectedYear - 1) : null, [selectedIso, selectedYear])

  const caseTrend  = summary && prevSummary?.totalCases  > 0
    ? ((summary.totalCases  - prevSummary.totalCases)  / prevSummary.totalCases)  * 100 : undefined
  const deathTrend = summary && prevSummary?.totalDeaths > 0
    ? ((summary.totalDeaths - prevSummary.totalDeaths) / prevSummary.totalDeaths) * 100 : undefined

  if (!selectedIso) return <div className="page-empty">Select a country to view its dashboard.</div>

  return (
    <>
      {/* KPI Row */}
      <div className="kpi-grid section">
        <KPICard title="Total Cases"        value={summary?.totalCases?.toLocaleString()}           subtitle="All diseases"               color="blue"   icon="cases"  trend={caseTrend} />
        <KPICard title="Total Deaths"       value={summary?.totalDeaths?.toLocaleString()}          subtitle="All diseases"               color="red"    icon="deaths" trend={deathTrend} />
        <KPICard title="Avg. Attack Rate"   value={summary?.avgAttackRate?.toFixed(2)}              subtitle="per 100,000 population"     color="orange" icon="attack" />
        <KPICard title="Avg. Case Fatality" value={summary ? `${summary.avgCFR?.toFixed(2)}%` : null} subtitle="Case fatality ratio"     color="purple" icon="cfr" />
        <KPICard title="Outbreaks"          value={outbreaks.length}                                subtitle={`recorded in ${selectedYear}`} color="teal" icon="alert" />
        <KPICard title="Lab Accreditation"  value={labData ? `${labData.iso15189_accreditation_pct?.toFixed(1)}%` : null} subtitle="ISO 15189 certified" color="green" icon="lab" />
      </div>

      {/* Charts */}
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

      {/* Quick-nav cards */}
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
  )
}

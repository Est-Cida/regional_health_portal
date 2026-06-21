import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useCountry } from '../../context/CountryContext'
import { useDataStore } from '../../context/DataStore'
import { useAuth } from '../../context/AuthContext'
import KPICard from '../../components/cards/KPICard'
import DiseaseBarChart from '../../components/charts/DiseaseBarChart'
import TrendLineChart from '../../components/charts/TrendLineChart'
import PageTabs from '../../components/PageTabs'
import { YEARS } from '../../data/dataService'

const fmtM = v => v != null ? `$${(v / 1_000_000).toFixed(1)}M` : '—'

function yearLabel(selectedYears) {
  if (!selectedYears.length || selectedYears.length === YEARS.length) return 'All Years'
  if (selectedYears.length === 1) return String(selectedYears[0])
  return `${selectedYears.length} Years`
}

export default function CountryOverview() {
  const { selectedIsos, selectedYears, selectedDiseases, allDiseases } = useCountry()
  const { state } = useDataStore()
  const { user } = useAuth()
  const navigate = useNavigate()

  const [view, setView] = useState('charts')

  const yLabel = yearLabel(selectedYears)

  const allSelected = selectedDiseases.length === allDiseases.length

  // All surveillance rows for selected countries + diseases
  const filteredSurv = useMemo(() =>
    state.surveillance.filter(s =>
      (!selectedIsos.length || selectedIsos.includes(s.iso_3_code)) &&
      (allSelected || selectedDiseases.includes(s.disease))
    ), [state.surveillance, selectedIsos, selectedDiseases, allSelected])

  // Summary for selected years (KPI cards + disease bar chart)
  const summary = useMemo(() => {
    const rows = filteredSurv.filter(s =>
      !selectedYears.length || selectedYears.includes(s.year)
    )
    if (!rows.length) return null
    const n = rows.length
    const byDisease = {}
    rows.forEach(r => {
      if (!byDisease[r.disease]) byDisease[r.disease] = { disease: r.disease, cases_reported: 0, deaths_reported: 0, _cfrSum: 0, _n: 0 }
      byDisease[r.disease].cases_reported  += r.cases_reported          || 0
      byDisease[r.disease].deaths_reported += r.deaths_reported         || 0
      byDisease[r.disease]._cfrSum         += r.case_fatality_ratio_pct || 0
      byDisease[r.disease]._n              += 1
    })
    return {
      totalCases:       rows.reduce((s, r) => s + (r.cases_reported          || 0), 0),
      totalDeaths:      rows.reduce((s, r) => s + (r.deaths_reported         || 0), 0),
      avgAttackRate:    rows.reduce((s, r) => s + (r.attack_rate_per_100k    || 0), 0) / n,
      avgCFR:           rows.reduce((s, r) => s + (r.case_fatality_ratio_pct || 0), 0) / n,
      diseaseBreakdown: Object.values(byDisease).map(({ _cfrSum, _n, ...d }) => ({
        ...d,
        cfr: _n > 0 ? _cfrSum / _n : 0,
      })),
    }
  }, [filteredSurv, selectedYears])

  // 5-year trend (for TrendLineChart) — sum across selected countries per year
  const trend = useMemo(() =>
    YEARS.map(year => {
      const rows = filteredSurv.filter(s => s.year === year)
      return {
        year,
        totalCases:  rows.reduce((s, r) => s + (r.cases_reported  || 0), 0),
        totalDeaths: rows.reduce((s, r) => s + (r.deaths_reported || 0), 0),
      }
    }), [filteredSurv])

  // Outbreaks count for selected countries + years
  const outbreaks = useMemo(() =>
    state.outbreaks.filter(o =>
      (!selectedIsos.length  || selectedIsos.includes(o.iso_3_code)) &&
      (!selectedYears.length || selectedYears.includes(o.year))
    ), [state.outbreaks, selectedIsos, selectedYears])

  // Average lab accreditation for selected countries + years
  const labData = useMemo(() => {
    const rows = state.labCapacity.filter(l =>
      (!selectedIsos.length  || selectedIsos.includes(l.iso_3_code)) &&
      (!selectedYears.length || selectedYears.includes(l.year))
    )
    if (!rows.length) return null
    return { iso15189_accreditation_pct: rows.reduce((s, r) => s + (r.iso15189_accreditation_pct || 0), 0) / rows.length }
  }, [state.labCapacity, selectedIsos, selectedYears])

  // Multi-year summary rows for the Summary Table tab
  const summaryRows = useMemo(() =>
    [...YEARS].reverse().map(year => {
      const survRows = state.surveillance.filter(s =>
        (!selectedIsos.length || selectedIsos.includes(s.iso_3_code)) && s.year === year
      )
      const labRows  = state.labCapacity.filter(l => (!selectedIsos.length || selectedIsos.includes(l.iso_3_code)) && l.year === year)
      const wfRows   = state.workforce.filter(w   => (!selectedIsos.length || selectedIsos.includes(w.iso_3_code)) && w.year === year)
      const fundRows = state.funding.filter(f     => (!selectedIsos.length || selectedIsos.includes(f.iso_3_code)) && f.year === year)
      const obCount  = state.outbreaks.filter(o   => (!selectedIsos.length || selectedIsos.includes(o.iso_3_code)) && o.year === year).length
      return {
        year,
        totalCases:     survRows.reduce((s, r) => s + (r.cases_reported          || 0), 0),
        totalDeaths:    survRows.reduce((s, r) => s + (r.deaths_reported         || 0), 0),
        avgCFR:         survRows.length ? survRows.reduce((s, r) => s + (r.case_fatality_ratio_pct || 0), 0) / survRows.length : 0,
        outbreakCount:  obCount,
        accreditation:  labRows.length  ? labRows.reduce((s, r)  => s + (r.iso15189_accreditation_pct || 0), 0) / labRows.length : null,
        epidemiologists: wfRows.length  ? Math.round(wfRows.reduce((s, r) => s + (r.epidemiologists_total || 0), 0)) : null,
        totalFunding:   fundRows.length ? fundRows.reduce((s, r) => s + (r.total_funding_usd || 0), 0) : null,
      }
    }), [state, selectedIsos])

  if (!selectedIsos.length) return <div className="page-empty">Select a country to view its dashboard.</div>

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

      {view === 'charts' && (
        <>
          <div className="kpi-grid section">
            <KPICard title="Total Cases"        value={summary?.totalCases?.toLocaleString()}              subtitle="All diseases"               color="blue"   icon="cases" />
            <KPICard title="Total Deaths"       value={summary?.totalDeaths?.toLocaleString()}             subtitle="All diseases"               color="red"    icon="deaths" />
            <KPICard title="Avg. Attack Rate"   value={summary?.avgAttackRate?.toFixed(2)}                 subtitle="per 100,000 population"     color="orange" icon="attack" />
            <KPICard title="Avg. Case Fatality" value={summary ? `${summary.avgCFR?.toFixed(2)}%` : null} subtitle="Case fatality ratio"        color="purple" icon="cfr" />
            <KPICard title="Outbreaks"          value={outbreaks.length}                                   subtitle={`recorded in ${yLabel}`}    color="teal"   icon="alert" />
            <KPICard title="Lab Accreditation"  value={labData ? `${labData.iso15189_accreditation_pct?.toFixed(1)}%` : null} subtitle="ISO 15189 certified" color="green" icon="lab" />
          </div>

          <div className="charts-grid section">
            <div className="card">
              <div className="card-header">
                <h2 className="card-title">Disease Burden — {yLabel}</h2>
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

      {view === 'table' && (
        <section className="section">
          <div className="card">
            <div className="card-header">
              <h2 className="card-title">Multi-Indicator Summary — All Years</h2>
              <span className="card-subtitle">
                {selectedIsos.length === 1 ? selectedIsos[0] : `${selectedIsos.length} countries`}
              </span>
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
                    <tr key={r.year} className={selectedYears.includes(r.year) ? 'row-highlighted' : ''}>
                      <td>
                        <strong>{r.year}</strong>
                        {selectedYears.includes(r.year) && selectedYears.length < YEARS.length && (
                          <span className="year-badge">selected</span>
                        )}
                      </td>
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

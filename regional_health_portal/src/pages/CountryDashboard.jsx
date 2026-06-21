import { useState, useEffect, useMemo } from 'react'
import { useAuth } from '../context/AuthContext'
import Navbar from '../components/Layout/Navbar'
import Sidebar from '../components/Layout/Sidebar'
import KPICard from '../components/cards/KPICard'
import DiseaseBarChart from '../components/charts/DiseaseBarChart'
import TrendLineChart from '../components/charts/TrendLineChart'
import OutbreakTable from '../components/OutbreakTable'
import CapacityPanel from '../components/CapacityPanel'
import {
  getCountries,
  getCountry,
  getCountriesBySubregion,
  getSurveillanceSummary,
  getSurveillanceTrend,
  getOutbreaks,
  getLabCapacity,
  getReporting,
  getWorkforce,
  getFunding,
  getPopulation,
} from '../data/dataService'

const YEARS = [2021, 2022, 2023, 2024, 2025]

const PRIORITY_LABEL = { 1: 'High', 2: 'Medium', 3: 'Standard' }
const PRIORITY_COLOR  = { 1: '#C00000', 2: '#D97706', 3: '#059669' }

function YearSelector({ value, onChange }) {
  return (
    <select className="select-control" value={value} onChange={e => onChange(Number(e.target.value))}>
      {YEARS.map(y => <option key={y} value={y}>{y}</option>)}
    </select>
  )
}

function CountrySelector({ countries, value, onChange }) {
  return (
    <select className="select-control" value={value || ''} onChange={e => onChange(e.target.value)}>
      {countries.map(c => (
        <option key={c.iso_3_code} value={c.iso_3_code}>{c.country_name}</option>
      ))}
    </select>
  )
}

export default function CountryDashboard() {
  const { user } = useAuth()

  const availableCountries = useMemo(() => {
    if (user.role === 'country_admin')  return getCountries().filter(c => c.iso_3_code === user.country_code)
    if (user.role === 'regional_admin') return getCountriesBySubregion(user.subregion)
    return getCountries()
  }, [user])

  const defaultCountry = availableCountries[0]?.iso_3_code || null

  const [selectedCountry, setSelectedCountry] = useState(defaultCountry)
  const [selectedYear, setSelectedYear]       = useState(2024)

  useEffect(() => {
    if (!selectedCountry && availableCountries.length) {
      setSelectedCountry(availableCountries[0].iso_3_code)
    }
  }, [availableCountries, selectedCountry])

  const country      = useMemo(() => selectedCountry ? getCountry(selectedCountry)                              : null, [selectedCountry])
  const summary      = useMemo(() => selectedCountry ? getSurveillanceSummary(selectedCountry, selectedYear)    : null, [selectedCountry, selectedYear])
  const trend        = useMemo(() => selectedCountry ? getSurveillanceTrend(selectedCountry)                    : [], [selectedCountry])
  const outbreaks    = useMemo(() => selectedCountry ? getOutbreaks(selectedCountry, selectedYear)              : [], [selectedCountry, selectedYear])
  const labData      = useMemo(() => selectedCountry ? getLabCapacity(selectedCountry, selectedYear)            : null, [selectedCountry, selectedYear])
  const reportData   = useMemo(() => selectedCountry ? getReporting(selectedCountry, selectedYear)              : null, [selectedCountry, selectedYear])
  const workData     = useMemo(() => selectedCountry ? getWorkforce(selectedCountry, selectedYear)              : null, [selectedCountry, selectedYear])
  const fundData     = useMemo(() => selectedCountry ? getFunding(selectedCountry, selectedYear)                : null, [selectedCountry, selectedYear])
  const popData      = useMemo(() => selectedCountry ? getPopulation(selectedCountry, selectedYear)             : null, [selectedCountry, selectedYear])

  // Year-over-year case trend for KPI badge
  const prevSummary  = useMemo(() => (selectedCountry && selectedYear > 2021)
    ? getSurveillanceSummary(selectedCountry, selectedYear - 1)
    : null, [selectedCountry, selectedYear])

  const caseTrend = (summary && prevSummary && prevSummary.totalCases > 0)
    ? ((summary.totalCases - prevSummary.totalCases) / prevSummary.totalCases) * 100
    : undefined

  const deathTrend = (summary && prevSummary && prevSummary.totalDeaths > 0)
    ? ((summary.totalDeaths - prevSummary.totalDeaths) / prevSummary.totalDeaths) * 100
    : undefined

  return (
    <div className="app-layout">
      <Sidebar />
      <div className="page-wrapper">
        <Navbar />

        <main className="page-main">
          {/* ── Page Header ─────────────────────────────────────────── */}
          <div className="page-header">
            <div className="page-header-left">
              <div className="page-breadcrumb">
                {user.role === 'regional_admin' && <span>{user.subregion} Region › </span>}
                {user.role === 'super_admin'    && <span>All Regions › </span>}
                <span className="breadcrumb-current">{country?.country_name || '—'}</span>
              </div>
              <h1 className="page-title">Country Dashboard</h1>

              {country && (
                <div className="country-meta">
                  <span className="meta-tag">
                    <strong>ISO-3:</strong> {country.iso_3_code}
                  </span>
                  <span className="meta-tag">
                    <strong>Sub-region:</strong> AFRO {country.afro_subregion}
                  </span>
                  <span
                    className="meta-tag priority-tag"
                    style={{ color: PRIORITY_COLOR[country.priority_country] }}
                  >
                    <strong>Priority:</strong> {PRIORITY_LABEL[country.priority_country]}
                  </span>
                  {popData && (
                    <span className="meta-tag">
                      <strong>Population:</strong> {(popData.total_population / 1_000_000).toFixed(1)}M
                    </span>
                  )}
                </div>
              )}
            </div>

            <div className="page-header-controls">
              {user.role !== 'country_admin' && (
                <div className="control-group">
                  <label className="control-label">Country</label>
                  <CountrySelector
                    countries={availableCountries}
                    value={selectedCountry}
                    onChange={setSelectedCountry}
                  />
                </div>
              )}
              <div className="control-group">
                <label className="control-label">Year</label>
                <YearSelector value={selectedYear} onChange={setSelectedYear} />
              </div>
            </div>
          </div>

          {/* ── KPI Cards ──────────────────────────────────────────── */}
          <section className="section" id="diseases">
            <div className="kpi-grid">
              <KPICard
                title="Total Cases Reported"
                value={summary?.totalCases?.toLocaleString()}
                subtitle="All notifiable diseases"
                color="blue"
                icon="cases"
                trend={caseTrend}
              />
              <KPICard
                title="Total Deaths"
                value={summary?.totalDeaths?.toLocaleString()}
                subtitle="All notifiable diseases"
                color="red"
                icon="deaths"
                trend={deathTrend}
              />
              <KPICard
                title="Avg. Attack Rate"
                value={summary?.avgAttackRate?.toFixed(2)}
                subtitle="per 100,000 population"
                color="orange"
                icon="attack"
              />
              <KPICard
                title="Avg. Case Fatality"
                value={summary ? `${summary.avgCFR?.toFixed(2)}%` : null}
                subtitle="Case fatality ratio"
                color="purple"
                icon="cfr"
              />
              <KPICard
                title="Outbreaks Recorded"
                value={outbreaks.length}
                subtitle={`in ${selectedYear}`}
                color="teal"
                icon="alert"
              />
              <KPICard
                title="Lab Accreditation"
                value={labData ? `${labData.iso15189_accreditation_pct?.toFixed(1)}%` : null}
                subtitle="ISO 15189 certified labs"
                color="green"
                icon="lab"
              />
            </div>
          </section>

          {/* ── Charts ─────────────────────────────────────────────── */}
          <section className="section">
            <div className="charts-grid">
              <div className="card">
                <div className="card-header">
                  <h2 className="card-title">Disease Burden by Pathogen — {selectedYear}</h2>
                  <span className="card-subtitle">Cases reported, sorted by volume</span>
                </div>
                <DiseaseBarChart data={summary?.diseaseBreakdown || []} />
              </div>

              <div className="card">
                <div className="card-header">
                  <h2 className="card-title">5-Year Surveillance Trend</h2>
                  <span className="card-subtitle">Cases and deaths, 2021–2025</span>
                </div>
                <TrendLineChart data={trend} />
              </div>
            </div>
          </section>

          {/* ── Disease Detail Table ────────────────────────────────── */}
          {summary?.diseaseBreakdown?.length > 0 && (
            <section className="section">
              <div className="card">
                <div className="card-header">
                  <h2 className="card-title">Disease Surveillance Summary — {selectedYear}</h2>
                </div>
                <div className="table-wrapper">
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>Disease</th>
                        <th>Cases</th>
                        <th>Deaths</th>
                        <th>Attack Rate / 100k</th>
                        <th>CFR (%)</th>
                      </tr>
                    </thead>
                    <tbody>
                      {summary.diseaseBreakdown.map(d => (
                        <tr key={d.disease}>
                          <td>{d.disease}</td>
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
          )}

          {/* ── Outbreaks ──────────────────────────────────────────── */}
          <section className="section" id="outbreaks">
            <div className="card">
              <div className="card-header">
                <h2 className="card-title">Outbreaks — {selectedYear}</h2>
                <span className="card-badge badge-alert">{outbreaks.length} recorded</span>
              </div>
              <OutbreakTable data={outbreaks} />
            </div>
          </section>

          {/* ── Health System Capacity ─────────────────────────────── */}
          <section className="section" id="capacity">
            <h2 className="section-heading">Health System Capacity</h2>
            <div className="capacity-grid">
              <CapacityPanel title="Laboratory Capacity"  data={labData}    type="lab" />
              <CapacityPanel title="Surveillance Reporting" data={reportData} type="reporting" />
              <CapacityPanel title="Health Workforce"     data={workData}   type="workforce" />
            </div>
          </section>

          {/* ── Funding ────────────────────────────────────────────── */}
          <section className="section" id="funding">
            <h2 className="section-heading">Health Financing</h2>
            <div className="funding-grid">
              <CapacityPanel title={`Funding Overview — ${selectedYear}`} data={fundData} type="funding" />

              {fundData && (
                <div className="capacity-card funding-bar-card">
                  <h3 className="capacity-title">Domestic vs External Funding</h3>
                  <div className="funding-stacked">
                    <div className="funding-stacked-labels">
                      <span>Domestic ({fundData.domestic_funding_share_pct?.toFixed(1)}%)</span>
                      <span>External ({(100 - fundData.domestic_funding_share_pct)?.toFixed(1)}%)</span>
                    </div>
                    <div className="funding-bar">
                      <div
                        className="funding-bar-domestic"
                        style={{ width: `${fundData.domestic_funding_share_pct}%` }}
                      />
                      <div
                        className="funding-bar-external"
                        style={{ width: `${100 - fundData.domestic_funding_share_pct}%` }}
                      />
                    </div>
                    <div className="funding-totals">
                      <div className="funding-total-item">
                        <span className="dot dot-domestic" />
                        <div>
                          <div className="funding-label">Domestic</div>
                          <div className="funding-amount">
                            ${(fundData.domestic_funding_usd / 1_000_000).toFixed(1)}M
                          </div>
                        </div>
                      </div>
                      <div className="funding-total-item">
                        <span className="dot dot-external" />
                        <div>
                          <div className="funding-label">External</div>
                          <div className="funding-amount">
                            {fundData.external_funding_usd
                              ? `$${(fundData.external_funding_usd / 1_000_000).toFixed(1)}M`
                              : '—'}
                          </div>
                        </div>
                      </div>
                      <div className="funding-total-item">
                        <span className="dot dot-total" />
                        <div>
                          <div className="funding-label">Total</div>
                          <div className="funding-amount">
                            ${(fundData.total_funding_usd / 1_000_000).toFixed(1)}M
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </section>
        </main>
      </div>
    </div>
  )
}

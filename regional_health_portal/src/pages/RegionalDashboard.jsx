import { useState, useMemo, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import Navbar from '../components/Layout/Navbar'
import Sidebar from '../components/Layout/Sidebar'
import RegionalMap from '../components/RegionalMap'
import MultiSelectDropdown from '../components/MultiSelectDropdown'
import {
  getCountriesBySubregion,
  getDiseaseList,
  getRawSurveillance,
  getRawOutbreaks,
  getRawWorkforce,
  getRawFunding,
  SUBREGIONS,
  YEARS,
} from '../data/dataService'

const ALL_DISEASES     = getDiseaseList()
const RAW_SURVEILLANCE = getRawSurveillance()
const RAW_OUTBREAKS    = getRawOutbreaks()
const RAW_WORKFORCE    = getRawWorkforce()
const RAW_FUNDING      = getRawFunding()

const MAP_METRICS = [
  { key: 'totalCases',    label: 'Cases'     },
  { key: 'totalDeaths',   label: 'Deaths'    },
  { key: 'outbreakCount', label: 'Outbreaks' },
]

export default function RegionalDashboard() {
  const { user } = useAuth()

  // Default selection: super_admin starts with all regions, others start with their own
  const defaultSubregions = user.role === 'super_admin'
    ? [...SUBREGIONS]
    : [user.subregion].filter(Boolean)

  const [selectedSubregions, setSelectedSubregions] = useState(defaultSubregions)
  const [selectedYear,       setSelectedYear]       = useState(2024)
  const [selectedDiseases,   setSelectedDiseases]   = useState([...ALL_DISEASES])
  const [mapMetric,          setMapMetric]          = useState('totalCases')

  const allSubregionsSelected = selectedSubregions.length === SUBREGIONS.length
  const allDiseasesSelected   = selectedDiseases.length   === ALL_DISEASES.length
  const yearLabel = selectedYear === 'all' ? 'All Years' : selectedYear

  // Countries available under current region selection
  const availableCountries = useMemo(() => {
    const activeSubs = (allSubregionsSelected || !selectedSubregions.length)
      ? SUBREGIONS : selectedSubregions
    return activeSubs.flatMap(sub => getCountriesBySubregion(sub))
  }, [selectedSubregions, allSubregionsSelected])

  const [selectedCountries, setSelectedCountries] = useState(
    () => availableCountries.map(c => c.iso_3_code)
  )

  // Reset country filter whenever the available pool changes (region switch)
  useEffect(() => {
    setSelectedCountries(availableCountries.map(c => c.iso_3_code))
  }, [availableCountries])

  const allCountriesSelected = selectedCountries.length === availableCountries.length

  const regionLabel = useMemo(() => {
    if (allSubregionsSelected || !selectedSubregions.length) return 'WHO AFRO'
    if (selectedSubregions.length === 1) return `${selectedSubregions[0]} Africa`
    return `${selectedSubregions.length} Regions`
  }, [selectedSubregions, allSubregionsSelected])

  const overview = useMemo(() => {
    const years = selectedYear === 'all' ? YEARS : [Number(selectedYear)]
    const countries = allCountriesSelected
      ? availableCountries
      : availableCountries.filter(c => selectedCountries.includes(c.iso_3_code))

    return countries.map(c => {
      const iso3 = c.iso_3_code

      const survRows = RAW_SURVEILLANCE.filter(s =>
        s.iso_3_code === iso3 &&
        years.includes(s.year) &&
        (allDiseasesSelected || selectedDiseases.includes(s.disease))
      )
      const obsRows = RAW_OUTBREAKS.filter(o =>
        o.iso_3_code === iso3 &&
        years.includes(o.year)
      )

      const totalCases  = survRows.reduce((s, r) => s + (r.cases_reported  || 0), 0)
      const totalDeaths = survRows.reduce((s, r) => s + (r.deaths_reported || 0), 0)
      const avgCFR = survRows.length
        ? survRows.reduce((s, r) => s + (r.case_fatality_ratio_pct || 0), 0) / survRows.length
        : 0

      return {
        iso3,
        country_name:  c.country_name,
        subregion:     c.afro_subregion,
        priority:      c.priority_country,
        lat:           Number(c.latitude),
        lng:           Number(c.longitude),
        totalCases,
        totalDeaths,
        avgCFR,
        outbreakCount: obsRows.length,
      }
    }).sort((a, b) => b.totalCases - a.totalCases)
  }, [availableCountries, selectedCountries, allCountriesSelected, selectedYear, selectedDiseases, allDiseasesSelected])

  const totalCases  = overview.reduce((s, c) => s + c.totalCases,    0)
  const totalDeaths = overview.reduce((s, c) => s + c.totalDeaths,   0)
  const totalObs    = overview.reduce((s, c) => s + c.outbreakCount, 0)

  const countryLabel = allCountriesSelected
    ? 'All countries'
    : `${selectedCountries.length} countr${selectedCountries.length !== 1 ? 'ies' : 'y'}`

  const diseaseSubtitle = allDiseasesSelected
    ? `${countryLabel}, all diseases`
    : `${countryLabel}, ${selectedDiseases.length} disease${selectedDiseases.length !== 1 ? 's' : ''}`

  // Per-country detail data for the map hover panel — always all countries in subregion
  const detailData = useMemo(() => {
    const years = selectedYear === 'all' ? YEARS : [Number(selectedYear)]

    const result = {}
    availableCountries.forEach(c => {
      const iso = c.iso_3_code

      // Disease case breakdown (top 5)
      const survRows = RAW_SURVEILLANCE.filter(s => s.iso_3_code === iso && years.includes(s.year))
      const byDisease = {}
      survRows.forEach(s => {
        byDisease[s.disease] = (byDisease[s.disease] || 0) + (s.cases_reported || 0)
      })
      const diseases = Object.entries(byDisease)
        .map(([disease, cases]) => ({ disease, cases }))
        .sort((a, b) => b.cases - a.cases)
        .slice(0, 5)

      // Funding
      const fundRows = RAW_FUNDING.filter(f => f.iso_3_code === iso && years.includes(f.year))
      const totalFunding    = fundRows.reduce((s, f) => s + (f.total_health_funding_usd    || 0), 0)
      const domesticFunding = fundRows.reduce((s, f) => s + (f.domestic_funding_usd        || 0), 0)
      const externalFunding = fundRows.reduce((s, f) => s + (f.external_funding_usd        || 0), 0)

      // Workforce capacity
      const wfRows = RAW_WORKFORCE.filter(w => w.iso_3_code === iso && years.includes(w.year))
      const n = Math.max(wfRows.length, 1)
      const epidemiologists = Math.round(wfRows.reduce((s, w) => s + (w.epidemiologists_total    || 0), 0) / n)
      const feltp           = Math.round(wfRows.reduce((s, w) => s + (w.feltp_trained_total       || 0), 0) / n)
      const labTech         = Math.round(wfRows.reduce((s, w) => s + (w.lab_technicians_total     || 0), 0) / n)

      result[iso] = { diseases, totalFunding, domesticFunding, externalFunding, epidemiologists, feltp, labTech }
    })
    return result
  }, [availableCountries, selectedYear])

  const mapSubregion = selectedSubregions[0] ?? SUBREGIONS[0]

  return (
    <div className="app-layout">
      <Sidebar />
      <div className="page-wrapper">
        <Navbar />
        <main className="page-main">

          {/* Header */}
          <div className="page-header">
            <div className="page-header-left">
              <div className="page-breadcrumb">Regional Overview</div>
              <h1 className="page-title">{regionLabel} Regional Dashboard</h1>
              <p className="page-desc">
                {overview.length} of {availableCountries.length} countries · {yearLabel} surveillance data
              </p>
            </div>
            <div className="page-header-controls">
              <div className="control-group">
                <label className="control-label">Region</label>
                <MultiSelectDropdown
                  options={SUBREGIONS.map(s => ({ value: s, label: `${s} Africa` }))}
                  selected={selectedSubregions}
                  onChange={setSelectedSubregions}
                  placeholder="Select region…"
                  allLabel="All Regions"
                />
              </div>
              <div className="control-group">
                <label className="control-label">Country</label>
                <MultiSelectDropdown
                  options={availableCountries.map(c => ({ value: c.iso_3_code, label: c.country_name }))}
                  selected={selectedCountries}
                  onChange={setSelectedCountries}
                  placeholder="Select country…"
                  allLabel="All Countries"
                />
              </div>
              <div className="control-group">
                <label className="control-label">Disease</label>
                <MultiSelectDropdown
                  options={ALL_DISEASES.map(d => ({ value: d, label: d }))}
                  selected={selectedDiseases}
                  onChange={setSelectedDiseases}
                  placeholder="Select disease…"
                  allLabel="All Diseases"
                />
              </div>
              <div className="control-group">
                <label className="control-label">Year</label>
                <select
                  className="select-control"
                  value={selectedYear}
                  onChange={e => {
                    const v = e.target.value
                    setSelectedYear(v === 'all' ? 'all' : Number(v))
                  }}
                >
                  <option value="all">All Years</option>
                  {YEARS.map(y => <option key={y} value={y}>{y}</option>)}
                </select>
              </div>
            </div>
          </div>

          {/* KPIs */}
          <section className="section">
            <div className="kpi-grid kpi-grid-3">
              <div className="kpi-card" style={{ borderTop: '4px solid #0071BC', background: '#EBF5FF' }}>
                <div className="kpi-card-header"><span className="kpi-title">Total Cases</span></div>
                <div className="kpi-value" style={{ color: '#0071BC' }}>{totalCases.toLocaleString()}</div>
                <div className="kpi-subtitle">{diseaseSubtitle}</div>
              </div>
              <div className="kpi-card" style={{ borderTop: '4px solid #C00000', background: '#FFF0F0' }}>
                <div className="kpi-card-header"><span className="kpi-title">Total Deaths</span></div>
                <div className="kpi-value" style={{ color: '#C00000' }}>{totalDeaths.toLocaleString()}</div>
                <div className="kpi-subtitle">{diseaseSubtitle}</div>
              </div>
              <div className="kpi-card" style={{ borderTop: '4px solid #D97706', background: '#FFF8ED' }}>
                <div className="kpi-card-header"><span className="kpi-title">Total Outbreaks</span></div>
                <div className="kpi-value" style={{ color: '#D97706' }}>{totalObs}</div>
                <div className="kpi-subtitle">Recorded in {yearLabel}</div>
              </div>
            </div>
          </section>

          {/* Map */}
          <section className="section">
            <div className="card map-card-full">
              <div className="card-header">
                <div>
                  <h2 className="card-title">Geographic Distribution</h2>
                  <span className="card-subtitle">
                    {regionLabel} · {yearLabel} · click a country for details
                  </span>
                </div>
                <div className="map-metric-toggle">
                  {MAP_METRICS.map(m => (
                    <button
                      key={m.key}
                      className={`map-metric-btn${mapMetric === m.key ? ' active' : ''}`}
                      onClick={() => setMapMetric(m.key)}
                    >
                      {m.label}
                    </button>
                  ))}
                </div>
              </div>

              <RegionalMap
                overview={overview}
                detailData={detailData}
                metric={mapMetric}
                year={selectedYear}
                subregion={mapSubregion}
              />
            </div>
          </section>

        </main>
      </div>
    </div>
  )
}

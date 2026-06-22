import { useState, useMemo } from 'react'
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
  SUBREGIONS,
} from '../data/dataService'

const YEARS = [2021, 2022, 2023, 2024, 2025]
const ALL_DISEASES     = getDiseaseList()
const RAW_SURVEILLANCE = getRawSurveillance()
const RAW_OUTBREAKS    = getRawOutbreaks()

const MAP_METRICS = [
  { key: 'totalCases',    label: 'Cases'     },
  { key: 'totalDeaths',   label: 'Deaths'    },
  { key: 'outbreakCount', label: 'Outbreaks' },
]

export default function RegionalDashboard() {
  const { user } = useAuth()

  const availableSubregions = user.role === 'super_admin' ? SUBREGIONS : [user.subregion]

  const [selectedSubregions, setSelectedSubregions] = useState([availableSubregions[0]])
  const [selectedYear,       setSelectedYear]       = useState(2024)
  const [selectedDiseases,   setSelectedDiseases]   = useState([...ALL_DISEASES])
  const [mapMetric,          setMapMetric]          = useState('totalCases')

  const allSubregionsSelected = selectedSubregions.length === availableSubregions.length
  const allDiseasesSelected   = selectedDiseases.length   === ALL_DISEASES.length
  const yearLabel = selectedYear === 'all' ? 'All Years' : selectedYear

  // Title reflects current selection
  const regionLabel = useMemo(() => {
    if (allSubregionsSelected || !selectedSubregions.length) return 'WHO AFRO'
    if (selectedSubregions.length === 1) return `${selectedSubregions[0]} Africa`
    return `${selectedSubregions.length} Sub-regions`
  }, [selectedSubregions, allSubregionsSelected])

  const overview = useMemo(() => {
    const activeSubs = (allSubregionsSelected || !selectedSubregions.length)
      ? availableSubregions
      : selectedSubregions
    const countries = activeSubs.flatMap(sub => getCountriesBySubregion(sub))
    const years = selectedYear === 'all' ? YEARS : [Number(selectedYear)]

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
  }, [selectedSubregions, allSubregionsSelected, selectedYear, selectedDiseases, allDiseasesSelected, availableSubregions])

  const totalCases  = overview.reduce((s, c) => s + c.totalCases,    0)
  const totalDeaths = overview.reduce((s, c) => s + c.totalDeaths,   0)
  const totalObs    = overview.reduce((s, c) => s + c.outbreakCount, 0)

  const diseaseSubtitle = allDiseasesSelected
    ? 'All countries, all diseases'
    : `All countries, ${selectedDiseases.length} disease${selectedDiseases.length !== 1 ? 's' : ''}`

  // Pass the first selected subregion to map for centering; fall back to first available
  const mapSubregion = selectedSubregions[0] ?? availableSubregions[0]

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
                {overview.length} countries · {yearLabel} surveillance data
              </p>
            </div>
            <div className="page-header-controls">
              {user.role === 'super_admin' && (
                <div className="control-group">
                  <label className="control-label">Sub-region</label>
                  <MultiSelectDropdown
                    options={availableSubregions.map(s => ({ value: s, label: `${s} Africa` }))}
                    selected={selectedSubregions}
                    onChange={setSelectedSubregions}
                    placeholder="Select sub-region…"
                    allLabel="All Sub-regions"
                  />
                </div>
              )}
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

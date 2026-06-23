import { useState, useMemo, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import Navbar from '../components/Layout/Navbar'
import Sidebar from '../components/Layout/Sidebar'
import MultiSelectDropdown from '../components/MultiSelectDropdown'
import {
  getCountries,
  getDiseaseList,
  SUBREGIONS,
  YEARS,
  getRawSurveillance,
  getRawOutbreaks,
  getRawLabCapacity,
  getRawWorkforce,
  getRawFunding,
  getRawPopulation,
} from '../data/dataService'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Legend, PieChart, Pie, Cell,
} from 'recharts'

const REGION_COLORS = {
  West:     '#0071BC',
  Central:  '#7B2D8B',
  East:     '#059669',
  Southern: '#D97706',
}

const SITUATION_LEVELS = ['Minimal', 'Low', 'Moderate', 'Severe', 'Critical']
const SITUATION_COLORS = {
  Minimal:  '#059669',
  Low:      '#84cc16',
  Moderate: '#D97706',
  Severe:   '#C00000',
  Critical: '#7B1D1D',
}

function getSituation(outbreaks) {
  if (!outbreaks || outbreaks <= 2)  return 'Minimal'
  if (outbreaks <= 6)                return 'Low'
  if (outbreaks <= 12)               return 'Moderate'
  if (outbreaks <= 20)               return 'Severe'
  return 'Critical'
}

const PRIORITY_LABEL = { 1: 'High', 2: 'Medium', 3: 'Standard' }
const PRIORITY_COLOR = { 1: '#C00000', 2: '#D97706', 3: '#059669' }

const DISEASE_COLORS = {
  'Cholera':                  '#0071BC',
  'Measles':                  '#F7941D',
  'Meningitis':               '#7B2D8B',
  'Yellow fever':             '#D4A017',
  'Lassa fever':              '#C00000',
  'Viral haemorrhagic fever': '#8B0000',
  'Polio (cVDPV)':            '#059669',
}

const fmtNum  = v => v >= 1_000_000 ? `${(v / 1_000_000).toFixed(1)}M` : v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v
const fmtMill = v => v != null ? `$${(v / 1_000_000).toFixed(1)}M` : '—'

const ALL_COUNTRIES    = getCountries()
const ALL_DISEASES     = getDiseaseList()
const RAW_SURVEILLANCE = getRawSurveillance()
const RAW_OUTBREAKS    = getRawOutbreaks()
const RAW_LAB          = getRawLabCapacity()
const RAW_WORKFORCE    = getRawWorkforce()
const RAW_FUNDING      = getRawFunding()
const RAW_POPULATION   = getRawPopulation()

function fmtYearLabel(years) {
  if (!years.length || years.length === YEARS.length) return 'All Years'
  if (years.length === 1) return String(years[0])
  return `${years.length} Years`
}

function MetricCell({ icon, label, value, accent, highlighted, last }) {
  return (
    <div style={{
      padding: '13px 16px',
      borderRight: last ? 'none' : '1px solid #F0F4FA',
      background: highlighted ? accent + '09' : 'transparent',
      minWidth: 0,
    }}>
      <div style={{
        fontSize: 10, color: '#94a3b8', marginBottom: 5,
        display: 'flex', alignItems: 'center', gap: 4,
        textTransform: 'uppercase', letterSpacing: 0.5, fontWeight: 600,
        whiteSpace: 'nowrap',
      }}>
        <span style={{ fontSize: 12 }}>{icon}</span> {label}
      </div>
      <div style={{ fontSize: 17, fontWeight: 800, color: highlighted ? accent : '#1A2B4A', lineHeight: 1.1 }}>
        {value ?? <span style={{ color: '#D1DBE8', fontWeight: 400, fontSize: 14 }}>—</span>}
      </div>
    </div>
  )
}

function CountryRankRow({ rank, country, iso3, subregion, data, sortBy }) {
  const regionCol = REGION_COLORS[subregion] || '#888'
  const { outbreaks, total_public_labs, accreditation_pct, epidemiologists, population, funding } = data
  const fmtP = v => v >= 1_000_000 ? `${(v / 1_000_000).toFixed(1)}M` : v ? `${(v / 1_000).toFixed(0)}k` : null
  const fmtF = v => v ? `$${(v / 1_000_000).toFixed(1)}M` : null
  return (
    <div style={{
      border: '1.5px solid #E5EAF0', borderLeft: `4px solid ${regionCol}`,
      borderRadius: 10, background: '#fff',
      boxShadow: '0 1px 4px rgba(26,43,74,0.06)',
      overflow: 'hidden', marginBottom: 10,
    }}>
      <div style={{
        padding: '9px 16px', display: 'flex', alignItems: 'center', gap: 10,
        borderBottom: '1px solid #F0F4FA', background: regionCol + '07',
      }}>
        <span style={{
          fontSize: 10, fontWeight: 800, color: regionCol,
          background: regionCol + '1A', padding: '2px 8px', borderRadius: 99, flexShrink: 0,
        }}>#{rank}</span>
        <span style={{ fontSize: 13, fontWeight: 700, color: '#1A2B4A' }}>{country}</span>
        <span style={{ fontSize: 11, color: '#94a3b8' }}>{iso3}</span>
        {data.situation && (
          <span style={{
            fontSize: 10, fontWeight: 700,
            color: SITUATION_COLORS[data.situation],
            background: SITUATION_COLORS[data.situation] + '18',
            padding: '2px 8px', borderRadius: 99, flexShrink: 0,
          }}>{data.situation}</span>
        )}
        <span style={{ marginLeft: 'auto', fontSize: 11, fontWeight: 600, color: regionCol, flexShrink: 0 }}>
          {subregion} Africa
        </span>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)' }}>
        <MetricCell icon="⚠️" label="Outbreaks"     accent="#C00000" highlighted={sortBy === 'outbreaks'}
          value={outbreaks != null ? String(outbreaks) : null} />
        <MetricCell icon="🔬" label="Lab Capacity"   accent="#0071BC" highlighted={sortBy === 'labs'}
          value={total_public_labs != null
            ? `${total_public_labs} labs${accreditation_pct != null ? ` · ${accreditation_pct.toFixed(0)}% acc.` : ''}`
            : null} />
        <MetricCell icon="🩺" label="Workforce"      accent="#059669" highlighted={sortBy === 'workforce'}
          value={epidemiologists != null ? epidemiologists.toLocaleString() : null} />
        <MetricCell icon="👥" label="Population"     accent="#7B2D8B" highlighted={sortBy === 'population'}
          value={fmtP(population)} />
        <MetricCell icon="💰" label="Funding"        accent="#D97706" highlighted={sortBy === 'funding'} last
          value={fmtF(funding)} />
      </div>
    </div>
  )
}

export default function SuperAdminDashboard() {
  const navigate = useNavigate()

  const [selectedYears,    setSelectedYears]    = useState([2024])
  const [selectedRegions,  setSelectedRegions]  = useState([...SUBREGIONS])
  const [selectedDiseases, setSelectedDiseases] = useState([...ALL_DISEASES])
  const [tab,              setTab]              = useState('overview')
  const [tableMode,        setTableMode]        = useState('country')
  const [topN,             setTopN]             = useState(5)
  const [sortBy,           setSortBy]           = useState('outbreaks')
  const [selectedSituations, setSelectedSituations] = useState([...SITUATION_LEVELS])

  const allYearsSelected    = selectedYears.length    === YEARS.length
  const allRegionsSelected  = selectedRegions.length  === SUBREGIONS.length
  const allDiseasesSelected = selectedDiseases.length === ALL_DISEASES.length

  // Country pool scoped to selected regions
  const availableCountries = useMemo(() =>
    allRegionsSelected
      ? ALL_COUNTRIES
      : ALL_COUNTRIES.filter(c => selectedRegions.includes(c.afro_subregion))
  , [selectedRegions, allRegionsSelected])

  const [selectedCountries, setSelectedCountries] = useState(
    () => ALL_COUNTRIES.map(c => c.iso_3_code)
  )

  // Reset country selection when region filter changes
  useEffect(() => {
    setSelectedCountries(availableCountries.map(c => c.iso_3_code))
  }, [availableCountries])

  const allCountriesSelected = selectedCountries.length === availableCountries.length

  // Final active country list (region ∩ country filters)
  const activeCountries = useMemo(() =>
    allCountriesSelected
      ? availableCountries
      : availableCountries.filter(c => selectedCountries.includes(c.iso_3_code))
  , [availableCountries, selectedCountries, allCountriesSelected])

  // Per-country multi-indicator aggregate
  const countryData = useMemo(() => {
    return activeCountries.map(c => {
      const iso3 = c.iso_3_code

      const survRows = RAW_SURVEILLANCE.filter(s =>
        s.iso_3_code === iso3 &&
        (allYearsSelected    || selectedYears.includes(s.year)) &&
        (allDiseasesSelected || selectedDiseases.includes(s.disease))
      )
      const obsRows  = RAW_OUTBREAKS.filter(o =>
        o.iso_3_code === iso3 &&
        (allYearsSelected || selectedYears.includes(o.year))
      )
      const labRows  = RAW_LAB.filter(l =>
        l.iso_3_code === iso3 &&
        (allYearsSelected || selectedYears.includes(l.year))
      )
      const wfRows   = RAW_WORKFORCE.filter(w =>
        w.iso_3_code === iso3 &&
        (allYearsSelected || selectedYears.includes(w.year))
      )
      const fundRows = RAW_FUNDING.filter(f =>
        f.iso_3_code === iso3 &&
        (allYearsSelected || selectedYears.includes(f.year))
      )

      const totalCases  = survRows.reduce((s, r) => s + (r.cases_reported  || 0), 0)
      const totalDeaths = survRows.reduce((s, r) => s + (r.deaths_reported || 0), 0)
      const avgCFR = survRows.length
        ? survRows.reduce((s, r) => s + (r.case_fatality_ratio_pct || 0), 0) / survRows.length
        : 0
      const validLab  = labRows.filter(l => l.iso15189_accreditation_pct != null)
      const validEpi  = wfRows.filter(w => w.epidemiologists_total    != null)
      const validFund = fundRows.filter(f => f.total_funding_usd       != null)

      return {
        iso3,
        country_name:  c.country_name,
        subregion:     c.afro_subregion,
        priority:      c.priority_country,
        totalCases,
        totalDeaths,
        avgCFR,
        outbreakCount: obsRows.length,
        avgLabAccred:  validLab.length  ? validLab.reduce((s, l)  => s + l.iso15189_accreditation_pct, 0) / validLab.length : null,
        totalEpi:      validEpi.length  ? validEpi.reduce((s, w)  => s + (w.epidemiologists_total || 0), 0) : null,
        totalFunding:  validFund.length ? validFund.reduce((s, f) => s + (f.total_funding_usd     || 0), 0) : null,
      }
    })
  }, [activeCountries, selectedYears, allYearsSelected, selectedDiseases, allDiseasesSelected])

  // Per-country disease-level breakdown
  const countryDiseaseData = useMemo(() => {
    return activeCountries.map(c => {
      const iso3 = c.iso_3_code
      const survRows = RAW_SURVEILLANCE.filter(s =>
        s.iso_3_code === iso3 &&
        (allYearsSelected    || selectedYears.includes(s.year)) &&
        (allDiseasesSelected || selectedDiseases.includes(s.disease))
      )
      const byDisease = {}
      survRows.forEach(r => {
        if (!byDisease[r.disease]) byDisease[r.disease] = { disease: r.disease, cases: 0, deaths: 0, _cfrSum: 0, _n: 0 }
        byDisease[r.disease].cases   += (r.cases_reported          || 0)
        byDisease[r.disease].deaths  += (r.deaths_reported         || 0)
        byDisease[r.disease]._cfrSum += (r.case_fatality_ratio_pct || 0)
        byDisease[r.disease]._n      += 1
      })
      const diseases = Object.values(byDisease).map(({ _cfrSum, _n, ...d }) => ({
        ...d, avgCFR: _n > 0 ? _cfrSum / _n : 0,
      })).sort((a, b) => b.cases - a.cases)

      return {
        iso3,
        country_name: c.country_name,
        subregion:    c.afro_subregion,
        priority:     c.priority_country,
        totalCases:   diseases.reduce((s, d) => s + d.cases, 0),
        diseases,
      }
    })
  }, [activeCountries, selectedYears, allYearsSelected, selectedDiseases, allDiseasesSelected])

  // KPI totals over active data
  const afroTotals = useMemo(() => {
    const totalCases  = countryData.reduce((s, c) => s + c.totalCases,  0)
    const totalDeaths = countryData.reduce((s, c) => s + c.totalDeaths, 0)
    return {
      totalCases,
      totalDeaths,
      totalObs: countryData.reduce((s, c) => s + c.outbreakCount, 0),
      cfr: totalCases > 0 ? ((totalDeaths / totalCases) * 100).toFixed(2) : '—',
    }
  }, [countryData])

  // Public labs per country (averaged across selected years), sorted highest to lowest
  const labsByCountry = useMemo(() => {
    return activeCountries.map(c => {
      const iso3 = c.iso_3_code
      const rows = RAW_LAB.filter(l =>
        l.iso_3_code === iso3 &&
        (allYearsSelected || selectedYears.includes(l.year))
      )
      if (!rows.length) return null
      const n = rows.length
      return {
        country:                  c.country_name,
        iso3,
        subregion:                c.afro_subregion,
        total_public_labs:        Math.round(rows.reduce((s, r) => s + (r.total_public_labs        || 0), 0) / n),
        labs_iso15189_accredited: Math.round(rows.reduce((s, r) => s + (r.labs_iso15189_accredited || 0), 0) / n),
        accreditation_pct:        rows.reduce((s, r) => s + (r.iso15189_accreditation_pct          || 0), 0) / n,
      }
    }).filter(Boolean).sort((a, b) => b.total_public_labs - a.total_public_labs)
  }, [activeCountries, selectedYears, allYearsSelected])

  // Per-country multi-dimension comparison (for Country Analytics tab)
  const countryComparison = useMemo(() => {
    return activeCountries.map(c => {
      const iso3 = c.iso_3_code

      const obsRows  = RAW_OUTBREAKS.filter(o =>
        o.iso_3_code === iso3 && (allYearsSelected || selectedYears.includes(o.year))
      )
      const wfRows   = RAW_WORKFORCE.filter(w =>
        w.iso_3_code === iso3 && (allYearsSelected || selectedYears.includes(w.year))
      )
      const popRows  = RAW_POPULATION.filter(p =>
        p.iso_3_code === iso3 && (allYearsSelected || selectedYears.includes(p.year))
      )
      const fundRows = RAW_FUNDING.filter(f =>
        f.iso_3_code === iso3 && (allYearsSelected || selectedYears.includes(f.year))
      )

      const avg = (rows, key) => rows.length
        ? Math.round(rows.reduce((s, r) => s + (Number(r[key]) || 0), 0) / rows.length)
        : null

      return {
        country:         c.country_name,
        iso3,
        subregion:       c.afro_subregion,
        outbreaks:       obsRows.length,
        epidemiologists: avg(wfRows,   'epidemiologists_total'),
        lab_technicians: avg(wfRows,   'lab_technicians_total'),
        population:      avg(popRows,  'total_population'),
        funding:         avg(fundRows, 'total_funding_usd'),
      }
    })
  }, [activeCountries, selectedYears, allYearsSelected])

  // Merged per-country dataset: all 5 indicators + derived situation level
  const countryRankings = useMemo(() => {
    const labMap = Object.fromEntries(labsByCountry.map(l => [l.iso3, l]))
    return countryComparison.map(c => ({
      ...c,
      total_public_labs:        labMap[c.iso3]?.total_public_labs        ?? null,
      labs_iso15189_accredited: labMap[c.iso3]?.labs_iso15189_accredited ?? null,
      accreditation_pct:        labMap[c.iso3]?.accreditation_pct        ?? null,
      situation: getSituation(c.outbreaks),
    }))
  }, [countryComparison, labsByCountry])

  const allSituationsSelected = selectedSituations.length === SITUATION_LEVELS.length

  const filteredRankings = useMemo(() => {
    if (allSituationsSelected) return countryRankings
    return countryRankings.filter(c => selectedSituations.includes(c.situation))
  }, [countryRankings, selectedSituations, allSituationsSelected])

  const SORT_KEYS = {
    outbreaks: 'outbreaks', labs: 'total_public_labs',
    workforce: 'epidemiologists', population: 'population', funding: 'funding',
  }

  const sortedRankings = useMemo(() => {
    const key = SORT_KEYS[sortBy] || 'outbreaks'
    return [...filteredRankings].sort((a, b) => (b[key] ?? -1) - (a[key] ?? -1))
  }, [filteredRankings, sortBy])

  // Region-level aggregates (only selected regions)
  const bySubregion = useMemo(() => {
    const activeRegions = allRegionsSelected ? SUBREGIONS : selectedRegions
    return activeRegions.map(sub => {
      const rows = countryData.filter(c => c.subregion === sub)
      return {
        name:        sub,
        totalCases:  rows.reduce((s, c) => s + c.totalCases,  0),
        totalDeaths: rows.reduce((s, c) => s + c.totalDeaths, 0),
        countries:   rows.length,
      }
    })
  }, [countryData, selectedRegions, allRegionsSelected])

  // Table: country totals grouped by region
  const grouped = useMemo(() => {
    const activeRegions = allRegionsSelected ? SUBREGIONS : selectedRegions
    return activeRegions.map(sub => {
      const rows = countryData.filter(c => c.subregion === sub).sort((a, b) => b.totalCases - a.totalCases)
      if (!rows.length) return null
      const validLab  = rows.filter(c => c.avgLabAccred != null)
      const validEpi  = rows.filter(c => c.totalEpi     != null)
      const validFund = rows.filter(c => c.totalFunding  != null)
      return {
        subregion: sub,
        rows,
        subtotal: {
          totalCases:    rows.reduce((s, c) => s + c.totalCases,  0),
          totalDeaths:   rows.reduce((s, c) => s + c.totalDeaths, 0),
          avgCFR:        rows.reduce((s, c) => s + c.avgCFR, 0) / rows.length,
          outbreakCount: rows.reduce((s, c) => s + c.outbreakCount, 0),
          avgLabAccred:  validLab.length  ? validLab.reduce((s, c) => s + c.avgLabAccred,  0) / validLab.length : null,
          totalEpi:      validEpi.length  ? validEpi.reduce((s, c) => s + c.totalEpi,     0) : null,
          totalFunding:  validFund.length ? validFund.reduce((s, c) => s + c.totalFunding, 0) : null,
        },
      }
    }).filter(Boolean)
  }, [countryData, selectedRegions, allRegionsSelected])

  // Table: disease breakdown grouped by region
  const groupedDisease = useMemo(() => {
    const activeRegions = allRegionsSelected ? SUBREGIONS : selectedRegions
    return activeRegions.map(sub => {
      const rows = countryDiseaseData.filter(c => c.subregion === sub).sort((a, b) => b.totalCases - a.totalCases)
      if (!rows.length) return null
      return { subregion: sub, rows }
    }).filter(Boolean)
  }, [countryDiseaseData, selectedRegions, allRegionsSelected])

  const yLabel = fmtYearLabel(selectedYears)
  const showAfroTotal = allRegionsSelected && allCountriesSelected

  const filterDesc = [
    allRegionsSelected   ? 'all regions'   : `${selectedRegions.length} region${selectedRegions.length !== 1 ? 's' : ''}`,
    allCountriesSelected ? 'all countries' : `${selectedCountries.length} countr${selectedCountries.length !== 1 ? 'ies' : 'y'}`,
    allDiseasesSelected  ? 'all diseases'  : `${selectedDiseases.length} disease${selectedDiseases.length !== 1 ? 's' : ''}`,
  ].join(' · ')

  return (
    <div className="app-layout">
      <Sidebar />
      <div className="page-wrapper">
        <Navbar />
        <main className="page-main">

          {/* Page header */}
          <div className="page-header">
            <div className="page-header-left">
              <div className="page-breadcrumb">Super Admin</div>
              <h1 className="page-title">WHO AFRO — Pan-Regional Overview</h1>
              <p className="page-desc">
                {activeCountries.length} of {ALL_COUNTRIES.length} countries across {bySubregion.length} region{bySubregion.length !== 1 ? 's' : ''} — {yLabel}
              </p>
            </div>
            <div className="page-header-controls">
              <div className="control-group">
                <label className="control-label">Region</label>
                <MultiSelectDropdown
                  options={SUBREGIONS.map(s => ({ value: s, label: `${s} Africa` }))}
                  selected={selectedRegions}
                  onChange={setSelectedRegions}
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
                <MultiSelectDropdown
                  options={YEARS.map(y => ({ value: y, label: String(y) }))}
                  selected={selectedYears}
                  onChange={setSelectedYears}
                  placeholder="Select year…"
                  allLabel="All Years"
                />
              </div>
            </div>
          </div>

          {/* Tabs */}
          <div className="page-tab-bar">
            {[
              { key: 'overview', label: 'Overview'        },
              { key: 'table',    label: 'Country Summary' },
            ].map(t => (
              <button
                key={t.key}
                className={`page-tab${tab === t.key ? ' active' : ''}`}
                onClick={() => setTab(t.key)}
              >
                {t.label}
              </button>
            ))}
          </div>

          {/* ── OVERVIEW TAB ── */}
          {tab === 'overview' && (
            <>
              <section className="section">
                <div className="kpi-grid">
                  <div className="kpi-card" style={{ borderTop: '4px solid #0071BC', background: '#EBF5FF' }}>
                    <div className="kpi-card-header"><span className="kpi-title">Total Cases (AFRO)</span></div>
                    <div className="kpi-value" style={{ color: '#0071BC' }}>{afroTotals.totalCases.toLocaleString()}</div>
                    <div className="kpi-subtitle">{filterDesc} · {yLabel}</div>
                  </div>
                  <div className="kpi-card" style={{ borderTop: '4px solid #C00000', background: '#FFF0F0' }}>
                    <div className="kpi-card-header"><span className="kpi-title">Total Deaths (AFRO)</span></div>
                    <div className="kpi-value" style={{ color: '#C00000' }}>{afroTotals.totalDeaths.toLocaleString()}</div>
                    <div className="kpi-subtitle">{filterDesc} · {yLabel}</div>
                  </div>
                  <div className="kpi-card" style={{ borderTop: '4px solid #D97706', background: '#FFF8ED' }}>
                    <div className="kpi-card-header"><span className="kpi-title">Total Outbreaks</span></div>
                    <div className="kpi-value" style={{ color: '#D97706' }}>{afroTotals.totalObs}</div>
                    <div className="kpi-subtitle">{yLabel}</div>
                  </div>
                  <div className="kpi-card" style={{ borderTop: '4px solid #7B2D8B', background: '#F5F0FF' }}>
                    <div className="kpi-card-header"><span className="kpi-title">Overall CFR</span></div>
                    <div className="kpi-value" style={{ color: '#7B2D8B' }}>
                      {afroTotals.cfr !== '—' ? `${afroTotals.cfr}%` : '—'}
                    </div>
                    <div className="kpi-subtitle">Deaths / Cases · {yLabel}</div>
                  </div>
                </div>
              </section>

              <section className="section">
                <h2 className="section-heading">Region Summary</h2>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16 }}>
                  {bySubregion.map(sub => (
                    <div
                      key={sub.name}
                      className="kpi-card"
                      style={{ borderLeft: `4px solid ${REGION_COLORS[sub.name]}`, borderTop: 'none', cursor: 'pointer' }}
                      onClick={() => setTab('table')}
                    >
                      <div className="kpi-card-header">
                        <span className="kpi-title" style={{ color: REGION_COLORS[sub.name] }}>{sub.name} Africa</span>
                        <span style={{ fontSize: 11, color: '#6B7C93' }}>{sub.countries} countries</span>
                      </div>
                      <div className="kpi-value" style={{ fontSize: 22, color: REGION_COLORS[sub.name] }}>
                        {sub.totalCases.toLocaleString()}
                      </div>
                      <div className="kpi-subtitle">
                        cases &nbsp;·&nbsp; {sub.totalDeaths.toLocaleString()} deaths
                      </div>
                      <div style={{ marginTop: 8, fontSize: 11, color: REGION_COLORS[sub.name], opacity: 0.8 }}>
                        Click to view country detail →
                      </div>
                    </div>
                  ))}
                </div>
              </section>

              <section className="section">
                <div className="charts-grid">
                  <div className="card">
                    <div className="card-header">
                      <h2 className="card-title">Cases &amp; Deaths by Region — {yLabel}</h2>
                    </div>
                    <ResponsiveContainer width="100%" height={260}>
                      <BarChart data={bySubregion} margin={{ top: 4, right: 24, left: 8, bottom: 4 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5EAF0" />
                        <XAxis dataKey="name" tick={{ fontSize: 12, fill: '#1A2B4A' }} />
                        <YAxis tickFormatter={fmtNum} tick={{ fontSize: 11, fill: '#6B7C93' }} width={52} />
                        <Tooltip formatter={v => v.toLocaleString()} />
                        <Legend wrapperStyle={{ fontSize: 12 }} />
                        <Bar dataKey="totalCases" name="Cases" radius={[4, 4, 0, 0]}>
                          {bySubregion.map(s => (
                            <Cell key={s.name} fill={REGION_COLORS[s.name] || '#888'} />
                          ))}
                        </Bar>
                        <Bar dataKey="totalDeaths" name="Deaths" radius={[4, 4, 0, 0]} fill="#C00000" opacity={0.65} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>

                  <div className="card">
                    <div className="card-header">
                      <h2 className="card-title">Case Share by Region — {yLabel}</h2>
                    </div>
                    <ResponsiveContainer width="100%" height={260}>
                      <PieChart>
                        <Pie
                          data={bySubregion}
                          dataKey="totalCases"
                          nameKey="name"
                          cx="50%"
                          cy="50%"
                          outerRadius={100}
                          label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                          labelLine={false}
                        >
                          {bySubregion.map(s => (
                            <Cell key={s.name} fill={REGION_COLORS[s.name] || '#888'} />
                          ))}
                        </Pie>
                        <Tooltip formatter={v => v.toLocaleString()} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </section>

              {labsByCountry.length > 0 && (
                <section className="section">
                  <div className="card">
                    <div className="card-header">
                      <div>
                        <h2 className="card-title">Public Labs by Country — {yLabel}</h2>
                        <span className="card-subtitle">Total public labs · highest to lowest</span>
                      </div>
                      <span style={{
                        fontSize: 11, fontWeight: 700, color: '#059669',
                        background: '#F0FFF4', border: '1px solid #6EE7B7',
                        borderRadius: 6, padding: '3px 10px',
                      }}>
                        Accreditation % shown in tooltip
                      </span>
                    </div>
                    <ResponsiveContainer width="100%" height={Math.max(260, labsByCountry.length * 34) + 16}>
                      <BarChart
                        data={labsByCountry}
                        layout="vertical"
                        margin={{ top: 8, right: 56, left: 4, bottom: 4 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#E5EAF0" />
                        <XAxis type="number" allowDecimals={false} tick={{ fontSize: 11, fill: '#6B7C93' }} />
                        <YAxis
                          type="category"
                          dataKey="country"
                          width={175}
                          tick={{ fontSize: 11, fill: '#1A2B4A' }}
                        />
                        <Tooltip
                          content={({ active, payload }) => {
                            if (!active || !payload?.length) return null
                            const d = payload[0]?.payload
                            return (
                              <div className="chart-tooltip">
                                <p className="tooltip-label">{d?.country} <span style={{ color: '#6B7C93' }}>({d?.iso3})</span></p>
                                <p>Total Labs: <strong>{d?.total_public_labs}</strong></p>
                                <p>ISO 15189 Accredited: <strong>{d?.labs_iso15189_accredited}</strong></p>
                                <p>Accreditation rate: <strong>{d?.accreditation_pct?.toFixed(1)}%</strong></p>
                                <p style={{ color: '#6B7C93', fontSize: 11 }}>{d?.subregion} Africa</p>
                              </div>
                            )
                          }}
                        />
                        <Bar
                          dataKey="total_public_labs"
                          name="Total Public Labs"
                          maxBarSize={18}
                          radius={[0, 4, 4, 0]}
                          label={{ position: 'right', fontSize: 11, fill: '#1A2B4A', formatter: v => v || '' }}
                        >
                          {labsByCountry.map(c => (
                            <Cell key={c.iso3} fill={REGION_COLORS[c.subregion] || '#888'} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                    <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', padding: '8px 16px 16px', borderTop: '1px solid #E5EAF0' }}>
                      {Object.entries(REGION_COLORS).map(([r, col]) => (
                        <span key={r} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: '#1A2B4A' }}>
                          <span style={{ width: 12, height: 12, borderRadius: 3, background: col, display: 'inline-block' }} />
                          {r} Africa
                        </span>
                      ))}
                    </div>
                  </div>
                </section>
              )}

              {/* ── Country Rankings ── */}
              <section className="section">
                <div className="card" style={{ padding: '20px 24px' }}>

                  {/* Header */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 18, flexWrap: 'wrap', gap: 12 }}>
                    <div>
                      <h2 className="card-title" style={{ marginBottom: 2 }}>Country Rankings — {yLabel}</h2>
                      <p style={{ fontSize: 12, color: '#6B7C93', margin: 0 }}>
                        Each row shows all key indicators per country · {filterDesc}
                      </p>
                    </div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, alignItems: 'center' }}>
                      {/* Sort by */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <span style={{ fontSize: 11, color: '#6B7C93', fontWeight: 600 }}>Sort by:</span>
                        {[
                          { key: 'outbreaks',  label: '⚠️ Outbreaks',  accent: '#C00000' },
                          { key: 'labs',       label: '🔬 Labs',        accent: '#0071BC' },
                          { key: 'workforce',  label: '🩺 Workforce',   accent: '#059669' },
                          { key: 'population', label: '👥 Population',  accent: '#7B2D8B' },
                          { key: 'funding',    label: '💰 Funding',     accent: '#D97706' },
                        ].map(({ key, label, accent }) => (
                          <button key={key} onClick={() => setSortBy(key)} style={{
                            padding: '5px 12px', borderRadius: 7, fontSize: 11, fontWeight: 600,
                            border: '1.5px solid', cursor: 'pointer',
                            borderColor: sortBy === key ? accent : '#D1DBE8',
                            background:  sortBy === key ? accent : '#fff',
                            color:       sortBy === key ? '#fff' : '#6B7C93',
                          }}>{label}</button>
                        ))}
                      </div>
                      {/* Situation filter */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <span style={{ fontSize: 11, color: '#6B7C93', fontWeight: 600 }}>Situation:</span>
                        <MultiSelectDropdown
                          options={SITUATION_LEVELS.map(s => ({ value: s, label: s }))}
                          selected={selectedSituations}
                          onChange={setSelectedSituations}
                          placeholder="All situations"
                          allLabel="All Situations"
                        />
                      </div>
                      {/* Show N */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <span style={{ fontSize: 11, color: '#6B7C93', fontWeight: 600 }}>Show:</span>
                        {[5, 10, 15, 20].map(n => (
                          <button key={n} onClick={() => setTopN(n)} style={{
                            padding: '5px 12px', borderRadius: 7, fontSize: 11, fontWeight: 600,
                            border: '1.5px solid', cursor: 'pointer',
                            borderColor: topN === n ? '#0071BC' : '#D1DBE8',
                            background:  topN === n ? '#0071BC' : '#fff',
                            color:       topN === n ? '#fff'    : '#6B7C93',
                          }}>{n}</button>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Region legend */}
                  <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', marginBottom: 16 }}>
                    {Object.entries(REGION_COLORS).map(([r, col]) => (
                      <span key={r} style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11, color: '#1A2B4A' }}>
                        <span style={{ width: 10, height: 10, borderRadius: 2, background: col, display: 'inline-block' }} />
                        {r} Africa
                      </span>
                    ))}
                  </div>

                  {/* Country rows */}
                  {sortedRankings.length === 0 ? (
                    <p style={{ fontSize: 13, color: '#94a3b8' }}>No data for selected filters.</p>
                  ) : (
                    sortedRankings.slice(0, topN).map((c, i) => (
                      <CountryRankRow
                        key={c.iso3}
                        rank={i + 1}
                        country={c.country}
                        iso3={c.iso3}
                        subregion={c.subregion}
                        data={c}
                        sortBy={sortBy}
                      />
                    ))
                  )}
                </div>
              </section>

            </>
          )}

          {/* ── COUNTRY SUMMARY TAB ── */}
          {tab === 'table' && (
            <section className="section">
              <div className="card">
                <div className="card-header">
                  <h2 className="card-title">
                    AFRO Countries — {tableMode === 'disease' ? 'Disease Breakdown' : 'Multi-Indicator Summary'} — {yLabel}
                  </h2>
                  <div className="card-filters">
                    <div className="map-metric-toggle">
                      <button
                        className={`map-metric-btn${tableMode === 'country' ? ' active' : ''}`}
                        onClick={() => setTableMode('country')}
                      >
                        Country Totals
                      </button>
                      <button
                        className={`map-metric-btn${tableMode === 'disease' ? ' active' : ''}`}
                        onClick={() => setTableMode('disease')}
                      >
                        By Disease
                      </button>
                    </div>
                  </div>
                </div>

                {/* ── Country Totals table ── */}
                {tableMode === 'country' && (
                  <div className="table-wrapper">
                    <table className="data-table">
                      <thead>
                        <tr>
                          <th>Country</th>
                          <th>Priority</th>
                          <th>Cases</th>
                          <th>Deaths</th>
                          <th>CFR&nbsp;%</th>
                          <th>Outbreaks</th>
                          <th>Lab&nbsp;Accred&nbsp;%</th>
                          <th>Epidemiologists</th>
                          <th>Total&nbsp;Funding</th>
                          <th></th>
                        </tr>
                      </thead>
                      <tbody>
                        {grouped.map(({ subregion, rows, subtotal }) => (
                          <>
                            <tr
                              key={`hdr-${subregion}`}
                              style={{ background: REGION_COLORS[subregion] + '18', borderLeft: `4px solid ${REGION_COLORS[subregion]}` }}
                            >
                              <td colSpan={10} style={{ fontWeight: 700, color: REGION_COLORS[subregion], fontSize: 13, padding: '8px 12px' }}>
                                {subregion} Africa &mdash; {rows.length} {rows.length === 1 ? 'country' : 'countries'}
                              </td>
                            </tr>
                            {rows.map(c => (
                              <tr key={c.iso3}>
                                <td>
                                  <strong>{c.country_name}</strong>
                                  <span className="mono ml-1" style={{ color: '#6B7C93', fontSize: 11 }}>{c.iso3}</span>
                                </td>
                                <td>
                                  <span className="priority-badge" style={{ color: PRIORITY_COLOR[c.priority], borderColor: PRIORITY_COLOR[c.priority] + '55' }}>
                                    {PRIORITY_LABEL[c.priority]}
                                  </span>
                                </td>
                                <td className="num">{c.totalCases.toLocaleString()}</td>
                                <td className="num">{c.totalDeaths.toLocaleString()}</td>
                                <td className={`num ${c.avgCFR > 10 ? 'text-danger' : c.avgCFR > 5 ? 'text-warn' : ''}`}>
                                  {c.avgCFR.toFixed(2)}%
                                </td>
                                <td className="num">{c.outbreakCount}</td>
                                <td className={`num ${c.avgLabAccred != null ? (c.avgLabAccred >= 80 ? 'text-success' : c.avgLabAccred < 50 ? 'text-danger' : 'text-warn') : ''}`}>
                                  {c.avgLabAccred != null ? `${c.avgLabAccred.toFixed(1)}%` : '—'}
                                </td>
                                <td className="num">{c.totalEpi != null ? Math.round(c.totalEpi).toLocaleString() : '—'}</td>
                                <td className="num">{c.totalFunding != null ? fmtMill(c.totalFunding) : '—'}</td>
                                <td><button className="btn-link" onClick={() => navigate('/country')}>View →</button></td>
                              </tr>
                            ))}
                            <tr key={`sub-${subregion}`} style={{ background: REGION_COLORS[subregion] + '10', fontWeight: 600 }}>
                              <td style={{ color: REGION_COLORS[subregion], paddingLeft: 20 }}>{subregion} Subtotal</td>
                              <td></td>
                              <td className="num">{subtotal.totalCases.toLocaleString()}</td>
                              <td className="num">{subtotal.totalDeaths.toLocaleString()}</td>
                              <td className="num">{subtotal.avgCFR.toFixed(2)}%</td>
                              <td className="num">{subtotal.outbreakCount}</td>
                              <td className="num">{subtotal.avgLabAccred != null ? `${subtotal.avgLabAccred.toFixed(1)}%` : '—'}</td>
                              <td className="num">{subtotal.totalEpi != null ? Math.round(subtotal.totalEpi).toLocaleString() : '—'}</td>
                              <td className="num">{subtotal.totalFunding != null ? fmtMill(subtotal.totalFunding) : '—'}</td>
                              <td></td>
                            </tr>
                          </>
                        ))}
                        {showAfroTotal && (
                          <tr style={{ background: '#1A2B4A', color: '#fff', fontWeight: 700 }}>
                            <td style={{ color: '#fff' }}>AFRO TOTAL</td>
                            <td></td>
                            <td className="num">{afroTotals.totalCases.toLocaleString()}</td>
                            <td className="num">{afroTotals.totalDeaths.toLocaleString()}</td>
                            <td className="num">{afroTotals.cfr !== '—' ? `${afroTotals.cfr}%` : '—'}</td>
                            <td className="num">{afroTotals.totalObs}</td>
                            <td className="num">—</td>
                            <td className="num">—</td>
                            <td className="num">—</td>
                            <td></td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                )}

                {/* ── By Disease table ── */}
                {tableMode === 'disease' && (
                  <div className="table-wrapper">
                    <table className="data-table">
                      <thead>
                        <tr>
                          <th>Country</th>
                          <th>Disease</th>
                          <th>Priority</th>
                          <th>Cases</th>
                          <th>Deaths</th>
                          <th>CFR&nbsp;%</th>
                        </tr>
                      </thead>
                      <tbody>
                        {groupedDisease.map(({ subregion, rows }) => (
                          <>
                            <tr
                              key={`dhdr-${subregion}`}
                              style={{ background: REGION_COLORS[subregion] + '18', borderLeft: `4px solid ${REGION_COLORS[subregion]}` }}
                            >
                              <td colSpan={6} style={{ fontWeight: 700, color: REGION_COLORS[subregion], fontSize: 13, padding: '8px 12px' }}>
                                {subregion} Africa &mdash; {rows.length} {rows.length === 1 ? 'country' : 'countries'}
                              </td>
                            </tr>

                            {rows.map(c => (
                              <>
                                {c.diseases.map((d, i) => (
                                  <tr key={`${c.iso3}-${d.disease}`}>
                                    {i === 0 ? (
                                      <td rowSpan={c.diseases.length} style={{ verticalAlign: 'top', paddingTop: 10, borderRight: '1px solid #E5EAF0' }}>
                                        <strong>{c.country_name}</strong>
                                        <span className="mono ml-1" style={{ color: '#6B7C93', fontSize: 11 }}>{c.iso3}</span>
                                      </td>
                                    ) : null}
                                    <td>
                                      <span style={{
                                        display: 'inline-block',
                                        width: 8, height: 8,
                                        borderRadius: '50%',
                                        background: DISEASE_COLORS[d.disease] || '#6B7C93',
                                        marginRight: 6,
                                      }} />
                                      {d.disease}
                                    </td>
                                    {i === 0 ? (
                                      <td rowSpan={c.diseases.length} style={{ verticalAlign: 'top', paddingTop: 10, borderRight: '1px solid #E5EAF0' }}>
                                        <span className="priority-badge" style={{ color: PRIORITY_COLOR[c.priority], borderColor: PRIORITY_COLOR[c.priority] + '55' }}>
                                          {PRIORITY_LABEL[c.priority]}
                                        </span>
                                      </td>
                                    ) : null}
                                    <td className="num">{d.cases.toLocaleString()}</td>
                                    <td className="num">{d.deaths.toLocaleString()}</td>
                                    <td className={`num ${d.avgCFR > 10 ? 'text-danger' : d.avgCFR > 5 ? 'text-warn' : ''}`}>
                                      {d.avgCFR.toFixed(2)}%
                                    </td>
                                  </tr>
                                ))}

                                <tr key={`dtotal-${c.iso3}`} style={{ background: '#F8FAFC', fontWeight: 600, borderTop: '1px solid #D1DBE8' }}>
                                  <td style={{ paddingLeft: 20, color: '#1A2B4A' }}>{c.country_name} Total</td>
                                  <td></td>
                                  <td></td>
                                  <td className="num">{c.totalCases.toLocaleString()}</td>
                                  <td className="num">{c.diseases.reduce((s, d) => s + d.deaths, 0).toLocaleString()}</td>
                                  <td className="num">
                                    {c.diseases.length
                                      ? `${(c.diseases.reduce((s, d) => s + d.avgCFR, 0) / c.diseases.length).toFixed(2)}%`
                                      : '—'}
                                  </td>
                                </tr>
                              </>
                            ))}

                            <tr
                              key={`dsub-${subregion}`}
                              style={{ background: REGION_COLORS[subregion] + '10', fontWeight: 700, borderTop: `2px solid ${REGION_COLORS[subregion]}` }}
                            >
                              <td style={{ color: REGION_COLORS[subregion], paddingLeft: 20 }}>{subregion} Subtotal</td>
                              <td></td>
                              <td></td>
                              <td className="num">{rows.reduce((s, c) => s + c.totalCases, 0).toLocaleString()}</td>
                              <td className="num">{rows.reduce((s, c) => s + c.diseases.reduce((sd, d) => sd + d.deaths, 0), 0).toLocaleString()}</td>
                              <td className="num">—</td>
                            </tr>
                          </>
                        ))}

                        {showAfroTotal && (
                          <tr style={{ background: '#1A2B4A', color: '#fff', fontWeight: 700 }}>
                            <td style={{ color: '#fff' }}>AFRO TOTAL</td>
                            <td></td>
                            <td></td>
                            <td className="num">{afroTotals.totalCases.toLocaleString()}</td>
                            <td className="num">{afroTotals.totalDeaths.toLocaleString()}</td>
                            <td className="num">{afroTotals.cfr !== '—' ? `${afroTotals.cfr}%` : '—'}</td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </section>
          )}

        </main>
      </div>
    </div>
  )
}

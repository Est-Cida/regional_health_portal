import { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import Navbar from '../components/Layout/Navbar'
import Sidebar from '../components/Layout/Sidebar'
import MultiSelectDropdown from '../components/MultiSelectDropdown'
import {
  getCountries,
  SUBREGIONS,
  YEARS,
  getRawSurveillance,
  getRawOutbreaks,
  getRawLabCapacity,
  getRawWorkforce,
  getRawFunding,
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

const PRIORITY_LABEL = { 1: 'High', 2: 'Medium', 3: 'Standard' }
const PRIORITY_COLOR = { 1: '#C00000', 2: '#D97706', 3: '#059669' }

const fmtNum  = v => v >= 1_000_000 ? `${(v / 1_000_000).toFixed(1)}M` : v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v
const fmtMill = v => v != null ? `$${(v / 1_000_000).toFixed(1)}M` : '—'

const ALL_COUNTRIES    = getCountries()
const RAW_SURVEILLANCE = getRawSurveillance()
const RAW_OUTBREAKS    = getRawOutbreaks()
const RAW_LAB          = getRawLabCapacity()
const RAW_WORKFORCE    = getRawWorkforce()
const RAW_FUNDING      = getRawFunding()

function yearLabel(selectedYears) {
  if (!selectedYears.length || selectedYears.length === YEARS.length) return 'All Years'
  if (selectedYears.length === 1) return String(selectedYears[0])
  return `${selectedYears.length} Years`
}

export default function SuperAdminDashboard() {
  const navigate = useNavigate()
  const [selectedYears,   setSelectedYears]   = useState([2024])
  const [filterSubregion, setFilterSubregion] = useState('All')
  const [tab,             setTab]             = useState('overview')

  const allYearsSelected = selectedYears.length === YEARS.length

  // Per-country multi-indicator aggregate across selected years
  const countryData = useMemo(() => {
    return ALL_COUNTRIES.map(c => {
      const iso3 = c.iso_3_code

      const survRows = RAW_SURVEILLANCE.filter(s =>
        s.iso_3_code === iso3 &&
        (allYearsSelected || selectedYears.includes(s.year))
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
  }, [selectedYears, allYearsSelected])

  // AFRO-level KPI totals
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

  // Sub-region aggregates for charts
  const bySubregion = useMemo(() =>
    SUBREGIONS.map(sub => {
      const rows = countryData.filter(c => c.subregion === sub)
      return {
        name:        sub,
        totalCases:  rows.reduce((s, c) => s + c.totalCases,  0),
        totalDeaths: rows.reduce((s, c) => s + c.totalDeaths, 0),
        countries:   rows.length,
      }
    }), [countryData])

  // Countries grouped by sub-region for the Country Summary table
  const grouped = useMemo(() => {
    const base = filterSubregion === 'All'
      ? countryData
      : countryData.filter(c => c.subregion === filterSubregion)

    return SUBREGIONS
      .map(sub => {
        const rows = base
          .filter(c => c.subregion === sub)
          .sort((a, b) => b.totalCases - a.totalCases)
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
      })
      .filter(Boolean)
  }, [countryData, filterSubregion])

  const yLabel = yearLabel(selectedYears)

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
                {ALL_COUNTRIES.length} countries across {SUBREGIONS.length} sub-regions &mdash; {yLabel}
              </p>
            </div>
            <div className="page-header-controls">
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
                    <div className="kpi-subtitle">All countries · all diseases · {yLabel}</div>
                  </div>
                  <div className="kpi-card" style={{ borderTop: '4px solid #C00000', background: '#FFF0F0' }}>
                    <div className="kpi-card-header"><span className="kpi-title">Total Deaths (AFRO)</span></div>
                    <div className="kpi-value" style={{ color: '#C00000' }}>{afroTotals.totalDeaths.toLocaleString()}</div>
                    <div className="kpi-subtitle">All countries · all diseases · {yLabel}</div>
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
                <div className="charts-grid">
                  <div className="card">
                    <div className="card-header">
                      <h2 className="card-title">Cases &amp; Deaths by Sub-region — {yLabel}</h2>
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
                      <h2 className="card-title">Case Share by Sub-region — {yLabel}</h2>
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

              {/* Sub-region drill-down cards */}
              <section className="section">
                <h2 className="section-heading">Sub-region Summary</h2>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16 }}>
                  {bySubregion.map(sub => (
                    <div
                      key={sub.name}
                      className="kpi-card"
                      style={{ borderLeft: `4px solid ${REGION_COLORS[sub.name]}`, borderTop: 'none', cursor: 'pointer' }}
                      onClick={() => { setFilterSubregion(sub.name); setTab('table') }}
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
            </>
          )}

          {/* ── COUNTRY SUMMARY TAB ── */}
          {tab === 'table' && (
            <section className="section">
              <div className="card">
                <div className="card-header">
                  <h2 className="card-title">
                    All AFRO Countries — Multi-Indicator Summary — {yLabel}
                  </h2>
                  <div className="card-filters">
                    <select
                      className="select-control select-sm"
                      value={filterSubregion}
                      onChange={e => setFilterSubregion(e.target.value)}
                    >
                      <option value="All">All Sub-regions</option>
                      {SUBREGIONS.map(s => (
                        <option key={s} value={s}>{s} Africa</option>
                      ))}
                    </select>
                  </div>
                </div>

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
                          {/* Sub-region label row */}
                          <tr
                            key={`hdr-${subregion}`}
                            style={{
                              background: REGION_COLORS[subregion] + '18',
                              borderLeft: `4px solid ${REGION_COLORS[subregion]}`,
                            }}
                          >
                            <td
                              colSpan={10}
                              style={{ fontWeight: 700, color: REGION_COLORS[subregion], fontSize: 13, padding: '8px 12px' }}
                            >
                              {subregion} Africa &mdash; {rows.length} {rows.length === 1 ? 'country' : 'countries'}
                            </td>
                          </tr>

                          {/* Country rows */}
                          {rows.map(c => (
                            <tr key={c.iso3}>
                              <td>
                                <strong>{c.country_name}</strong>
                                <span className="mono ml-1" style={{ color: '#6B7C93', fontSize: 11 }}>{c.iso3}</span>
                              </td>
                              <td>
                                <span
                                  className="priority-badge"
                                  style={{ color: PRIORITY_COLOR[c.priority], borderColor: PRIORITY_COLOR[c.priority] + '55' }}
                                >
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
                              <td>
                                <button className="btn-link" onClick={() => navigate('/country')}>
                                  View →
                                </button>
                              </td>
                            </tr>
                          ))}

                          {/* Sub-region subtotal row */}
                          <tr
                            key={`sub-${subregion}`}
                            style={{ background: REGION_COLORS[subregion] + '10', fontWeight: 600 }}
                          >
                            <td style={{ color: REGION_COLORS[subregion], paddingLeft: 20 }}>
                              {subregion} Subtotal
                            </td>
                            <td></td>
                            <td className="num">{subtotal.totalCases.toLocaleString()}</td>
                            <td className="num">{subtotal.totalDeaths.toLocaleString()}</td>
                            <td className="num">{subtotal.avgCFR.toFixed(2)}%</td>
                            <td className="num">{subtotal.outbreakCount}</td>
                            <td className="num">
                              {subtotal.avgLabAccred != null ? `${subtotal.avgLabAccred.toFixed(1)}%` : '—'}
                            </td>
                            <td className="num">
                              {subtotal.totalEpi != null ? Math.round(subtotal.totalEpi).toLocaleString() : '—'}
                            </td>
                            <td className="num">
                              {subtotal.totalFunding != null ? fmtMill(subtotal.totalFunding) : '—'}
                            </td>
                            <td></td>
                          </tr>
                        </>
                      ))}

                      {/* AFRO Grand Total — only when all sub-regions shown */}
                      {filterSubregion === 'All' && (
                        <tr style={{ background: '#1A2B4A', color: '#fff', fontWeight: 700 }}>
                          <td style={{ color: '#fff' }}>AFRO TOTAL</td>
                          <td></td>
                          <td className="num">{afroTotals.totalCases.toLocaleString()}</td>
                          <td className="num">{afroTotals.totalDeaths.toLocaleString()}</td>
                          <td className="num">
                            {afroTotals.cfr !== '—' ? `${afroTotals.cfr}%` : '—'}
                          </td>
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
              </div>
            </section>
          )}

        </main>
      </div>
    </div>
  )
}

import { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import Navbar from '../components/Layout/Navbar'
import Sidebar from '../components/Layout/Sidebar'
import RegionalMap from '../components/RegionalMap'
import {
  getRegionalOverview,
  SUBREGIONS,
} from '../data/dataService'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Cell,
} from 'recharts'

const YEARS = [2021, 2022, 2023, 2024, 2025]

const SUBREGION_COLORS = {
  West:     '#0071BC',
  Central:  '#7B2D8B',
  East:     '#059669',
  Southern: '#D97706',
}

const PRIORITY_COLOR = { 1: '#C00000', 2: '#D97706', 3: '#059669' }
const PRIORITY_LABEL = { 1: 'High', 2: 'Medium', 3: 'Standard' }

const fmt = v => v >= 1_000_000 ? `${(v / 1_000_000).toFixed(1)}M` : v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v

const MAP_METRICS = [
  { key: 'totalCases',    label: 'Cases'     },
  { key: 'totalDeaths',   label: 'Deaths'    },
  { key: 'outbreakCount', label: 'Outbreaks' },
]

export default function RegionalDashboard() {
  const { user } = useAuth()
  const navigate = useNavigate()

  const availableSubregions = user.role === 'super_admin' ? SUBREGIONS : [user.subregion]

  const [selectedSubregion, setSelectedSubregion] = useState(availableSubregions[0])
  const [selectedYear,      setSelectedYear]       = useState(2024)
  const [mapMetric,         setMapMetric]          = useState('totalCases')

  const yearLabel = selectedYear === 'all' ? 'All Years' : selectedYear

  const overview = useMemo(() => {
    if (selectedYear !== 'all') return getRegionalOverview(selectedSubregion, selectedYear)
    // Aggregate across all years per country
    const byIso = {}
    YEARS.forEach(y => {
      getRegionalOverview(selectedSubregion, y).forEach(c => {
        if (!byIso[c.iso3]) {
          byIso[c.iso3] = { ...c, totalCases: 0, totalDeaths: 0, outbreakCount: 0, _cfrSum: 0, _n: 0 }
        }
        byIso[c.iso3].totalCases    += c.totalCases
        byIso[c.iso3].totalDeaths   += c.totalDeaths
        byIso[c.iso3].outbreakCount += c.outbreakCount
        byIso[c.iso3]._cfrSum       += c.avgCFR
        byIso[c.iso3]._n            += 1
      })
    })
    return Object.values(byIso).map(({ _cfrSum, _n, ...c }) => ({
      ...c,
      avgCFR: _n > 0 ? _cfrSum / _n : 0,
    }))
  }, [selectedSubregion, selectedYear])

  const totalCases  = overview.reduce((s, c) => s + c.totalCases,    0)
  const totalDeaths = overview.reduce((s, c) => s + c.totalDeaths,   0)
  const totalObs    = overview.reduce((s, c) => s + c.outbreakCount, 0)

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
              <h1 className="page-title">{selectedSubregion} Africa Regional Dashboard</h1>
              <p className="page-desc">
                {overview.length} countries · {yearLabel} surveillance data
              </p>
            </div>
            <div className="page-header-controls">
              {user.role === 'super_admin' && (
                <div className="control-group">
                  <label className="control-label">Sub-region</label>
                  <select
                    className="select-control"
                    value={selectedSubregion}
                    onChange={e => setSelectedSubregion(e.target.value)}
                  >
                    {availableSubregions.map(s => (
                      <option key={s} value={s}>{s} Africa</option>
                    ))}
                  </select>
                </div>
              )}
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
                <div className="kpi-subtitle">All countries, all diseases</div>
              </div>
              <div className="kpi-card" style={{ borderTop: '4px solid #C00000', background: '#FFF0F0' }}>
                <div className="kpi-card-header"><span className="kpi-title">Total Deaths</span></div>
                <div className="kpi-value" style={{ color: '#C00000' }}>{totalDeaths.toLocaleString()}</div>
                <div className="kpi-subtitle">All countries, all diseases</div>
              </div>
              <div className="kpi-card" style={{ borderTop: '4px solid #D97706', background: '#FFF8ED' }}>
                <div className="kpi-card-header"><span className="kpi-title">Total Outbreaks</span></div>
                <div className="kpi-value" style={{ color: '#D97706' }}>{totalObs}</div>
                <div className="kpi-subtitle">Recorded in {yearLabel}</div>
              </div>
            </div>
          </section>

          {/* ── Map ──────────────────────────────────────────────────────── */}
          <section className="section">
            <div className="card">
              <div className="card-header">
                <div>
                  <h2 className="card-title">Geographic Distribution</h2>
                  <span className="card-subtitle">
                    {selectedSubregion} Africa · {yearLabel} · click a country for details
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
                subregion={selectedSubregion}
              />
            </div>
          </section>

          {/* Cases by Country Chart */}
          <section className="section">
            <div className="card">
              <div className="card-header">
                <h2 className="card-title">Cases by Country — {yearLabel}</h2>
                <span className="card-subtitle">{selectedSubregion} Africa sub-region</span>
              </div>
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={overview} margin={{ top: 4, right: 24, left: 8, bottom: 60 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5EAF0" />
                  <XAxis
                    dataKey="country_name"
                    tick={{ fontSize: 10, fill: '#1A2B4A' }}
                    angle={-35}
                    textAnchor="end"
                    interval={0}
                  />
                  <YAxis tickFormatter={fmt} tick={{ fontSize: 11, fill: '#6B7C93' }} width={52} />
                  <Tooltip formatter={v => v.toLocaleString()} />
                  <Bar dataKey="totalCases" name="Cases" radius={[4, 4, 0, 0]}>
                    {overview.map(c => (
                      <Cell
                        key={c.iso3}
                        fill={SUBREGION_COLORS[selectedSubregion] || '#0071BC'}
                        opacity={0.75 + (c.priority === 1 ? 0.25 : c.priority === 2 ? 0.1 : 0)}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </section>

          {/* Country Table */}
          <section className="section">
            <div className="card">
              <div className="card-header">
                <h2 className="card-title">Country Comparison — {yearLabel}</h2>
              </div>
              <div className="table-wrapper">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Country</th>
                      <th>ISO-3</th>
                      <th>Priority</th>
                      <th>Total Cases</th>
                      <th>Total Deaths</th>
                      <th>Avg. CFR (%)</th>
                      <th>Outbreaks</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {overview.map(c => (
                      <tr key={c.iso3}>
                        <td><strong>{c.country_name}</strong></td>
                        <td className="mono">{c.iso3}</td>
                        <td>
                          <span
                            className="priority-badge"
                            style={{ color: PRIORITY_COLOR[c.priority], borderColor: PRIORITY_COLOR[c.priority] }}
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
                        <td>
                          <button
                            className="btn-link"
                            onClick={() => navigate('/country', { state: { iso3: c.iso3 } })}
                          >
                            View →
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </section>

        </main>
      </div>
    </div>
  )
}

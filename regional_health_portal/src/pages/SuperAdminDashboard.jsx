import { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import Navbar from '../components/Layout/Navbar'
import Sidebar from '../components/Layout/Sidebar'
import {
  getAllCountriesOverview,
  getCountries,
  SUBREGIONS,
} from '../data/dataService'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Legend, PieChart, Pie, Cell,
} from 'recharts'

const YEARS = [2021, 2022, 2023, 2024, 2025]

const REGION_COLORS = {
  West:     '#0071BC',
  Central:  '#7B2D8B',
  East:     '#059669',
  Southern: '#D97706',
}

const fmt = v => v >= 1_000_000 ? `${(v / 1_000_000).toFixed(1)}M` : v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v
const PRIORITY_LABEL = { 1: 'High', 2: 'Medium', 3: 'Standard' }
const PRIORITY_COLOR = { 1: '#C00000', 2: '#D97706', 3: '#059669' }

export default function SuperAdminDashboard() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [selectedYear, setSelectedYear] = useState(2024)
  const [filterSubregion, setFilterSubregion] = useState('All')

  const allOverview = useMemo(() => getAllCountriesOverview(selectedYear), [selectedYear])

  const filtered = useMemo(
    () => filterSubregion === 'All' ? allOverview : allOverview.filter(c => c.subregion === filterSubregion),
    [allOverview, filterSubregion],
  )

  const totalCases  = allOverview.reduce((s, c) => s + c.totalCases, 0)
  const totalDeaths = allOverview.reduce((s, c) => s + c.totalDeaths, 0)
  const totalObs    = allOverview.reduce((s, c) => s + c.outbreakCount, 0)

  // Subregion aggregates for pie/bar
  const bySubregion = SUBREGIONS.map(sub => {
    const rows = allOverview.filter(c => c.subregion === sub)
    return {
      name:        sub,
      totalCases:  rows.reduce((s, c) => s + c.totalCases, 0),
      totalDeaths: rows.reduce((s, c) => s + c.totalDeaths, 0),
      countries:   rows.length,
    }
  })

  return (
    <div className="app-layout">
      <Sidebar />
      <div className="page-wrapper">
        <Navbar />
        <main className="page-main">

          {/* Header */}
          <div className="page-header">
            <div className="page-header-left">
              <div className="page-breadcrumb">Super Admin</div>
              <h1 className="page-title">WHO AFRO — All Regions Overview</h1>
              <p className="page-desc">
                {getCountries().length} countries across {SUBREGIONS.length} sub-regions
              </p>
            </div>
            <div className="page-header-controls">
              <div className="control-group">
                <label className="control-label">Year</label>
                <select
                  className="select-control"
                  value={selectedYear}
                  onChange={e => setSelectedYear(Number(e.target.value))}
                >
                  {YEARS.map(y => <option key={y} value={y}>{y}</option>)}
                </select>
              </div>
            </div>
          </div>

          {/* Global KPIs */}
          <section className="section">
            <div className="kpi-grid">
              <div className="kpi-card" style={{ borderTop: '4px solid #0071BC', background: '#EBF5FF' }}>
                <div className="kpi-card-header"><span className="kpi-title">Total Cases (AFRO)</span></div>
                <div className="kpi-value" style={{ color: '#0071BC' }}>{totalCases.toLocaleString()}</div>
                <div className="kpi-subtitle">All 20 countries · all diseases</div>
              </div>
              <div className="kpi-card" style={{ borderTop: '4px solid #C00000', background: '#FFF0F0' }}>
                <div className="kpi-card-header"><span className="kpi-title">Total Deaths (AFRO)</span></div>
                <div className="kpi-value" style={{ color: '#C00000' }}>{totalDeaths.toLocaleString()}</div>
                <div className="kpi-subtitle">All 20 countries · all diseases</div>
              </div>
              <div className="kpi-card" style={{ borderTop: '4px solid #D97706', background: '#FFF8ED' }}>
                <div className="kpi-card-header"><span className="kpi-title">Total Outbreaks</span></div>
                <div className="kpi-value" style={{ color: '#D97706' }}>{totalObs}</div>
                <div className="kpi-subtitle">Recorded in {selectedYear}</div>
              </div>
              <div className="kpi-card" style={{ borderTop: '4px solid #7B2D8B', background: '#F5F0FF' }}>
                <div className="kpi-card-header"><span className="kpi-title">Overall CFR</span></div>
                <div className="kpi-value" style={{ color: '#7B2D8B' }}>
                  {totalCases > 0 ? `${((totalDeaths / totalCases) * 100).toFixed(2)}%` : '—'}
                </div>
                <div className="kpi-subtitle">Deaths / Cases</div>
              </div>
            </div>
          </section>

          {/* Sub-region breakdown charts */}
          <section className="section">
            <div className="charts-grid">
              <div className="card">
                <div className="card-header">
                  <h2 className="card-title">Cases by Sub-region — {selectedYear}</h2>
                </div>
                <ResponsiveContainer width="100%" height={260}>
                  <BarChart data={bySubregion} margin={{ top: 4, right: 24, left: 8, bottom: 4 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5EAF0" />
                    <XAxis dataKey="name" tick={{ fontSize: 12, fill: '#1A2B4A' }} />
                    <YAxis tickFormatter={fmt} tick={{ fontSize: 11, fill: '#6B7C93' }} width={52} />
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
                  <h2 className="card-title">Case Share by Sub-region</h2>
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

          {/* All Countries Table */}
          <section className="section">
            <div className="card">
              <div className="card-header">
                <h2 className="card-title">All Countries — {selectedYear}</h2>
                <div className="card-filters">
                  <select
                    className="select-control select-sm"
                    value={filterSubregion}
                    onChange={e => setFilterSubregion(e.target.value)}
                  >
                    <option value="All">All Sub-regions</option>
                    {SUBREGIONS.map(s => <option key={s} value={s}>{s} Africa</option>)}
                  </select>
                </div>
              </div>
              <div className="table-wrapper">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Country</th>
                      <th>Sub-region</th>
                      <th>Priority</th>
                      <th>Cases</th>
                      <th>Deaths</th>
                      <th>CFR (%)</th>
                      <th>Outbreaks</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map(c => (
                      <tr key={c.iso3}>
                        <td>
                          <strong>{c.country_name}</strong>
                          <span className="mono ml-1" style={{ color: '#6B7C93', fontSize: 11 }}>
                            {c.iso3}
                          </span>
                        </td>
                        <td>
                          <span
                            className="subregion-pill"
                            style={{ background: REGION_COLORS[c.subregion] + '22', color: REGION_COLORS[c.subregion] }}
                          >
                            {c.subregion}
                          </span>
                        </td>
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
                          <button className="btn-link" onClick={() => navigate('/country')}>
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

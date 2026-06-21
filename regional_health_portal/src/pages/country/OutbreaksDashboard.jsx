import { useMemo, useState } from 'react'
import { useCountry } from '../../context/CountryContext'
import { getOutbreaksAllYears, getDiseaseList, YEARS } from '../../data/dataService'
import OutbreakTable from '../../components/OutbreakTable'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Cell, Legend,
} from 'recharts'

const DISEASE_COLORS = {
  'Cholera': '#0071BC', 'Measles': '#F7941D', 'Meningitis': '#7B2D8B',
  'Yellow fever': '#D4A017', 'Lassa fever': '#C00000',
  'Viral haemorrhagic fever': '#8B0000', 'Polio (cVDPV)': '#059669',
}

export default function OutbreaksDashboard() {
  const { selectedIso, selectedYear } = useCountry()

  const [filterYear,    setFilterYear]    = useState('all')
  const [filterDisease, setFilterDisease] = useState('all')

  const allOutbreaks = useMemo(() => selectedIso ? getOutbreaksAllYears(selectedIso) : [], [selectedIso])
  const diseases     = useMemo(() => getDiseaseList(), [])

  const filtered = useMemo(() => {
    let rows = allOutbreaks
    if (filterYear    !== 'all') rows = rows.filter(o => o.year === Number(filterYear))
    if (filterDisease !== 'all') rows = rows.filter(o => o.disease === filterDisease)
    return rows
  }, [allOutbreaks, filterYear, filterDisease])

  // Stats
  const avgDuration  = filtered.length ? (filtered.reduce((s, o) => s + (o.duration_days   || 0), 0) / filtered.length).toFixed(1) : '—'
  const avgDetection = filtered.length ? (filtered.reduce((s, o) => s + (o.time_to_detection_days || 0), 0) / filtered.length).toFixed(1) : '—'
  const totalCases   = filtered.reduce((s, o) => s + (o.cases  || 0), 0)
  const totalDeaths  = filtered.reduce((s, o) => s + (o.deaths || 0), 0)

  // Outbreak count by disease (for bar chart, all years)
  const byDisease = diseases.map(d => ({
    disease: d,
    count: allOutbreaks.filter(o => o.disease === d).length,
  })).filter(d => d.count > 0).sort((a, b) => b.count - a.count)

  // Year trend
  const byYear = YEARS.map(y => ({
    year: y,
    count: allOutbreaks.filter(o => o.year === y).length,
  }))

  if (!selectedIso) return <div className="page-empty">Select a country above.</div>

  return (
    <>
      <div className="page-header-slim">
        <h1 className="page-title">Outbreaks</h1>
        <p className="page-desc">Outbreak events across all years</p>
      </div>

      {/* Summary KPI row */}
      <section className="section">
        <div className="kpi-grid kpi-grid-4">
          <div className="kpi-card" style={{ borderTop: '4px solid #D97706', background: '#FFF8ED' }}>
            <div className="kpi-card-header"><span className="kpi-title">Total Outbreaks</span></div>
            <div className="kpi-value" style={{ color: '#D97706' }}>{filtered.length}</div>
            <div className="kpi-subtitle">{filterYear === 'all' ? 'All years' : filterYear}</div>
          </div>
          <div className="kpi-card" style={{ borderTop: '4px solid #0071BC', background: '#EBF5FF' }}>
            <div className="kpi-card-header"><span className="kpi-title">Cases in Outbreaks</span></div>
            <div className="kpi-value" style={{ color: '#0071BC' }}>{totalCases.toLocaleString()}</div>
            <div className="kpi-subtitle">across selected outbreaks</div>
          </div>
          <div className="kpi-card" style={{ borderTop: '4px solid #7B2D8B', background: '#F5F0FF' }}>
            <div className="kpi-card-header"><span className="kpi-title">Avg. Duration</span></div>
            <div className="kpi-value" style={{ color: '#7B2D8B' }}>{avgDuration}<span style={{ fontSize: 14 }}> days</span></div>
            <div className="kpi-subtitle">per outbreak event</div>
          </div>
          <div className="kpi-card" style={{ borderTop: '4px solid #059669', background: '#ECFDF5' }}>
            <div className="kpi-card-header"><span className="kpi-title">Avg. Detection</span></div>
            <div className="kpi-value" style={{ color: '#059669' }}>{avgDetection}<span style={{ fontSize: 14 }}> days</span></div>
            <div className="kpi-subtitle">time to detection</div>
          </div>
        </div>
      </section>

      {/* Charts */}
      <section className="section">
        <div className="charts-grid">
          <div className="card">
            <div className="card-header">
              <h2 className="card-title">Outbreaks by Disease</h2>
              <span className="card-subtitle">All years combined</span>
            </div>
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={byDisease} layout="vertical" margin={{ top: 4, right: 20, left: 140, bottom: 4 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#E5EAF0" />
                <XAxis type="number" allowDecimals={false} tick={{ fontSize: 11, fill: '#6B7C93' }} />
                <YAxis type="category" dataKey="disease" tick={{ fontSize: 11, fill: '#1A2B4A' }} width={135} />
                <Tooltip formatter={v => [`${v} outbreaks`]} />
                <Bar dataKey="count" name="Outbreaks" radius={[0, 4, 4, 0]}>
                  {byDisease.map(d => (
                    <Cell key={d.disease} fill={DISEASE_COLORS[d.disease] || '#6B7C93'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="card">
            <div className="card-header">
              <h2 className="card-title">Outbreaks per Year</h2>
            </div>
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={byYear} margin={{ top: 4, right: 20, left: 8, bottom: 4 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5EAF0" />
                <XAxis dataKey="year" tick={{ fontSize: 11, fill: '#6B7C93' }} />
                <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: '#6B7C93' }} />
                <Tooltip formatter={v => [`${v} outbreaks`]} />
                <Bar dataKey="count" name="Outbreaks" fill="#0071BC" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </section>

      {/* Filterable table */}
      <section className="section">
        <div className="card">
          <div className="card-header">
            <h2 className="card-title">Outbreak Records</h2>
            <div className="card-filters">
              <select className="select-control select-sm" value={filterYear} onChange={e => setFilterYear(e.target.value)}>
                <option value="all">All years</option>
                {YEARS.map(y => <option key={y} value={y}>{y}</option>)}
              </select>
              <select className="select-control select-sm" value={filterDisease} onChange={e => setFilterDisease(e.target.value)}>
                <option value="all">All diseases</option>
                {diseases.map(d => <option key={d} value={d}>{d}</option>)}
              </select>
            </div>
          </div>
          <OutbreakTable data={filtered} />
        </div>
      </section>
    </>
  )
}

import { useMemo, useState } from 'react'
import { useCountry } from '../../context/CountryContext'
import { YEARS, getRawPopulation } from '../../data/dataService'
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, BarChart, Bar, Legend,
} from 'recharts'

const RAW_POP = getRawPopulation()

const fmtPop = v =>
  v >= 1_000_000 ? `${(v / 1_000_000).toFixed(1)}M`
  : v >= 1_000   ? `${(v / 1_000).toFixed(0)}k`
  : String(v ?? 0)

const ChartTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null
  return (
    <div className="chart-tooltip">
      <p className="tooltip-label">{label}</p>
      {payload.map(p => (
        <p key={p.dataKey} style={{ color: p.color }}>
          {p.name}: <strong>
            {typeof p.value === 'number' ? p.value.toLocaleString() : (p.value ?? '—')}
          </strong>
        </p>
      ))}
    </div>
  )
}

export default function PopulationDashboard() {
  const {
    selectedIsos, selectedYears,
    primaryIso, country,
    availableCountries,
  } = useCountry()

  const [tab, setTab] = useState('charts')

  const allYearsSelected = selectedYears.length === YEARS.length

  // Per-selected-country averages across selected years
  const popData = useMemo(() => {
    return availableCountries
      .filter(c => selectedIsos.includes(c.iso_3_code))
      .map(c => {
        const iso3 = c.iso_3_code
        const rows = RAW_POP.filter(p =>
          p.iso_3_code === iso3 &&
          (allYearsSelected || selectedYears.includes(p.year))
        )
        if (!rows.length) return null
        const n = rows.length
        return {
          iso3,
          country_name:      c.country_name,
          total_population:  Math.round(rows.reduce((s, r) => s + (Number(r.total_population)    || 0), 0) / n),
          under5_population: Math.round(rows.reduce((s, r) => s + (Number(r.under5_population)   || 0), 0) / n),
          urban_pct:                     rows.reduce((s, r) => s + (Number(r.urban_population_pct) || 0), 0) / n,
        }
      })
      .filter(Boolean)
      .sort((a, b) => b.total_population - a.total_population)
  }, [selectedIsos, selectedYears, allYearsSelected, availableCountries])

  // Year-by-year trend for the primary country (all years, regardless of filter)
  const primaryTrend = useMemo(() => {
    if (!primaryIso) return []
    return YEARS.map(year => {
      const row = RAW_POP.find(p => p.iso_3_code === primaryIso && p.year === year)
      return {
        year,
        'Total Population':  row ? Number(row.total_population)    : null,
        'Under-5 Population': row ? Number(row.under5_population)  : null,
        'Urban %':            row ? Number(row.urban_population_pct) : null,
      }
    })
  }, [primaryIso])

  const primaryRow = popData.find(c => c.iso3 === primaryIso) ?? popData[0]
  const isMulti    = selectedIsos.length > 1
  const yLabel     = allYearsSelected ? 'All Years'
    : selectedYears.length === 1 ? String(selectedYears[0])
    : `${selectedYears.length} Years`

  if (!popData.length) {
    return (
      <div className="page-placeholder">
        <p>No population data for the selected filters.</p>
      </div>
    )
  }

  return (
    <>
      {/* Page header */}
      <div className="page-header">
        <div className="page-header-left">
          <div className="page-breadcrumb">Demographics</div>
          <h1 className="page-title">Population</h1>
          <p className="page-desc">
            {isMulti
              ? `${popData.length} countries · ${yLabel}`
              : `${country?.country_name ?? primaryRow?.country_name} · ${yLabel}`}
          </p>
        </div>
      </div>

      {/* KPI cards */}
      <section className="section">
        <div className="kpi-grid">
          <div className="kpi-card" style={{ borderTop: '4px solid #0071BC', background: '#EBF5FF' }}>
            <div className="kpi-card-header"><span className="kpi-title">Total Population</span></div>
            <div className="kpi-value" style={{ color: '#0071BC' }}>{fmtPop(primaryRow?.total_population)}</div>
            <div className="kpi-subtitle">{primaryRow?.country_name} · {yLabel}</div>
          </div>
          <div className="kpi-card" style={{ borderTop: '4px solid #7B2D8B', background: '#F5F0FF' }}>
            <div className="kpi-card-header"><span className="kpi-title">Under-5 Population</span></div>
            <div className="kpi-value" style={{ color: '#7B2D8B' }}>{fmtPop(primaryRow?.under5_population)}</div>
            <div className="kpi-subtitle">{yLabel}</div>
          </div>
          <div className="kpi-card" style={{ borderTop: '4px solid #059669', background: '#F0FFF4' }}>
            <div className="kpi-card-header"><span className="kpi-title">Urban Population</span></div>
            <div className="kpi-value" style={{ color: '#059669' }}>{primaryRow?.urban_pct?.toFixed(1)}%</div>
            <div className="kpi-subtitle">Share of total · {yLabel}</div>
          </div>
          <div className="kpi-card" style={{ borderTop: '4px solid #D97706', background: '#FFF8ED' }}>
            <div className="kpi-card-header"><span className="kpi-title">Under-5 Share</span></div>
            <div className="kpi-value" style={{ color: '#D97706' }}>
              {primaryRow && primaryRow.total_population > 0
                ? `${((primaryRow.under5_population / primaryRow.total_population) * 100).toFixed(1)}%`
                : '—'}
            </div>
            <div className="kpi-subtitle">Of total population</div>
          </div>
        </div>
      </section>

      {/* Tab bar */}
      <div className="page-tab-bar">
        {[
          { key: 'charts', label: 'Charts'     },
          { key: 'table',  label: 'Data Table' },
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

      {/* ── CHARTS TAB ── */}
      {tab === 'charts' && (
        <>
          {/* Single-country: trend lines */}
          {!isMulti && primaryTrend.length > 0 && (
            <section className="section">
              <div className="charts-grid">
                <div className="card">
                  <div className="card-header">
                    <h2 className="card-title">Population Trend — {primaryRow?.country_name}</h2>
                    <span className="card-subtitle">All years</span>
                  </div>
                  <ResponsiveContainer width="100%" height={260}>
                    <LineChart data={primaryTrend} margin={{ top: 4, right: 24, left: 8, bottom: 4 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5EAF0" />
                      <XAxis dataKey="year" tick={{ fontSize: 12 }} />
                      <YAxis tickFormatter={fmtPop} tick={{ fontSize: 11, fill: '#6B7C93' }} width={56} />
                      <Tooltip content={<ChartTooltip />} />
                      <Legend wrapperStyle={{ fontSize: 12 }} />
                      <Line dataKey="Total Population"   stroke="#0071BC" strokeWidth={2} dot={{ r: 4 }} connectNulls />
                      <Line dataKey="Under-5 Population" stroke="#7B2D8B" strokeWidth={2} dot={{ r: 4 }} connectNulls />
                    </LineChart>
                  </ResponsiveContainer>
                </div>

                <div className="card">
                  <div className="card-header">
                    <h2 className="card-title">Urban Population % — {primaryRow?.country_name}</h2>
                    <span className="card-subtitle">All years</span>
                  </div>
                  <ResponsiveContainer width="100%" height={260}>
                    <LineChart data={primaryTrend} margin={{ top: 4, right: 24, left: 8, bottom: 4 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5EAF0" />
                      <XAxis dataKey="year" tick={{ fontSize: 12 }} />
                      <YAxis
                        domain={[0, 100]}
                        tickFormatter={v => `${v}%`}
                        tick={{ fontSize: 11, fill: '#6B7C93' }}
                        width={44}
                      />
                      <Tooltip formatter={v => (v != null ? `${v.toFixed(1)}%` : '—')} />
                      <Line dataKey="Urban %" stroke="#059669" strokeWidth={2} dot={{ r: 4 }} connectNulls />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </section>
          )}

          {/* Multi-country: horizontal bar chart */}
          {isMulti && popData.length > 0 && (
            <section className="section">
              <div className="card">
                <div className="card-header">
                  <div>
                    <h2 className="card-title">Population by Country — {yLabel}</h2>
                  </div>
                  <span className="card-subtitle">Total · under-5 · highest to lowest</span>
                </div>
                <ResponsiveContainer
                  width="100%"
                  height={Math.max(280, popData.length * 42) + 48}
                >
                  <BarChart
                    data={popData}
                    layout="vertical"
                    margin={{ top: 48, right: 40, left: 4, bottom: 4 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#E5EAF0" />
                    <XAxis
                      type="number"
                      tickFormatter={fmtPop}
                      tick={{ fontSize: 11, fill: '#6B7C93' }}
                    />
                    <YAxis
                      type="category"
                      dataKey="country_name"
                      width={175}
                      tick={{ fontSize: 11, fill: '#1A2B4A' }}
                    />
                    <Tooltip
                      content={({ active, payload }) => {
                        if (!active || !payload?.length) return null
                        const d = payload[0]?.payload
                        return (
                          <div className="chart-tooltip">
                            <p className="tooltip-label">{d?.country_name}</p>
                            <p>Total Population: <strong>{d?.total_population?.toLocaleString()}</strong></p>
                            <p>Under-5: <strong>{d?.under5_population?.toLocaleString()}</strong></p>
                            <p>Urban: <strong>{d?.urban_pct?.toFixed(1)}%</strong></p>
                          </div>
                        )
                      }}
                    />
                    <Legend verticalAlign="top" height={40} wrapperStyle={{ fontSize: 11, top: 0 }} />
                    <Bar dataKey="total_population"  name="Total Population"   fill="#0071BC" radius={[0, 4, 4, 0]} maxBarSize={14} />
                    <Bar dataKey="under5_population" name="Under-5 Population" fill="#7B2D8B" radius={[0, 4, 4, 0]} maxBarSize={14} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </section>
          )}
        </>
      )}

      {/* ── DATA TABLE TAB ── */}
      {tab === 'table' && (
        <section className="section">
          <div className="card">
            <div className="card-header">
              <h2 className="card-title">Population Data — {yLabel}</h2>
            </div>
            <div className="table-wrapper">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Country</th>
                    <th>Total Population</th>
                    <th>Under-5 Population</th>
                    <th>Under-5 Share</th>
                    <th>Urban Population %</th>
                  </tr>
                </thead>
                <tbody>
                  {popData.map(c => (
                    <tr key={c.iso3}>
                      <td>
                        <strong>{c.country_name}</strong>{' '}
                        <span style={{ color: '#6B7C93', fontSize: 11 }}>{c.iso3}</span>
                      </td>
                      <td className="num">{c.total_population.toLocaleString()}</td>
                      <td className="num">{c.under5_population.toLocaleString()}</td>
                      <td className="num">
                        {c.total_population > 0
                          ? `${((c.under5_population / c.total_population) * 100).toFixed(1)}%`
                          : '—'}
                      </td>
                      <td className={`num ${c.urban_pct >= 60 ? 'text-success' : c.urban_pct < 35 ? 'text-warn' : ''}`}>
                        {c.urban_pct.toFixed(1)}%
                      </td>
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

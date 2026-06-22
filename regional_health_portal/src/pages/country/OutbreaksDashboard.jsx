import { useMemo, useState } from 'react'
import { useCountry } from '../../context/CountryContext'
import { useDataStore, rowId } from '../../context/DataStore'
import { useAuth } from '../../context/AuthContext'
import { getDiseaseList, YEARS } from '../../data/dataService'
import OutbreakTable from '../../components/OutbreakTable'
import EditRecordModal from '../../components/EditRecordModal'
import AddOutbreakModal from '../../components/AddOutbreakModal'
import ConfirmDialog from '../../components/ConfirmDialog'
import PageTabs from '../../components/PageTabs'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Cell,
} from 'recharts'

const DISEASE_COLORS = {
  'Cholera': '#0071BC', 'Measles': '#F7941D', 'Meningitis': '#7B2D8B',
  'Yellow fever': '#D4A017', 'Lassa fever': '#C00000',
  'Viral haemorrhagic fever': '#8B0000', 'Polio (cVDPV)': '#059669',
}

function EditBtn({ onClick }) {
  return (
    <button className="btn-action btn-action-edit" onClick={onClick} title="Edit record">
      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
        <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
      </svg>
    </button>
  )
}

function DeleteBtn({ onClick }) {
  return (
    <button className="btn-action btn-action-delete" onClick={onClick} title="Delete record">
      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
        <polyline points="3 6 5 6 21 6"/>
        <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
        <path d="M10 11v6M14 11v6"/>
        <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/>
      </svg>
    </button>
  )
}

export default function OutbreaksDashboard() {
  const { selectedIsos, selectedYears, primaryIso, primaryYear, availableCountries } = useCountry()
  const { state, update, remove, add } = useDataStore()
  const { user } = useAuth()
  const canEdit = user.role === 'country_admin'

  const [view,           setView]           = useState('charts')
  const [filterYear,     setFilterYear]     = useState('all')
  const [filterDisease,  setFilterDisease]  = useState('all')
  const [editRecord,     setEditRecord]     = useState(null)
  const [deleteRecord,   setDeleteRecord]   = useState(null)
  const [showAdd,        setShowAdd]        = useState(false)
  const [topByDisease,   setTopByDisease]   = useState('all')
  const [topByCountry,   setTopByCountry]   = useState('all')

  const diseases  = useMemo(() => getDiseaseList(), [])
  const multiIso  = selectedIsos.length > 1

  // All outbreaks for selected countries
  const allOutbreaks = useMemo(() =>
    state.outbreaks
      .filter(o => !selectedIsos.length || selectedIsos.includes(o.iso_3_code))
      .sort((a, b) => new Date(b.start_date) - new Date(a.start_date)),
    [state.outbreaks, selectedIsos])

  const filtered = useMemo(() => {
    let rows = allOutbreaks
    if (filterYear    !== 'all') rows = rows.filter(o => o.year === Number(filterYear))
    if (filterDisease !== 'all') rows = rows.filter(o => o.disease === filterDisease)
    return rows
  }, [allOutbreaks, filterYear, filterDisease])

  const avgDuration  = filtered.length ? (filtered.reduce((s, o) => s + (o.duration_days          || 0), 0) / filtered.length).toFixed(1) : '—'
  const avgDetection = filtered.length ? (filtered.reduce((s, o) => s + (o.time_to_detection_days || 0), 0) / filtered.length).toFixed(1) : '—'
  const totalCases   = filtered.reduce((s, o) => s + (o.cases || 0), 0)

  const byDiseaseAll = diseases
    .map(d => ({ disease: d, count: allOutbreaks.filter(o => o.disease === d).length }))
    .filter(d => d.count > 0)
    .sort((a, b) => b.count - a.count)

  const byDisease = topByDisease === 'all' ? byDiseaseAll : byDiseaseAll.slice(0, Number(topByDisease))

  const byYear = YEARS.map(y => ({
    year: y,
    count: allOutbreaks.filter(o => o.year === y).length,
  }))

  const isoToName = useMemo(() => {
    const map = {}
    availableCountries.forEach(c => { map[c.iso_3_code] = c.country_name })
    return map
  }, [availableCountries])

  const byCountryAll = useMemo(() => {
    if (selectedIsos.length <= 1) return []
    return selectedIsos
      .map(iso => ({
        country: isoToName[iso] || iso,
        count: allOutbreaks.filter(o => o.iso_3_code === iso).length,
      }))
      .sort((a, b) => b.count - a.count)
  }, [allOutbreaks, selectedIsos, isoToName])

  const byCountry = topByCountry === 'all' ? byCountryAll : byCountryAll.slice(0, Number(topByCountry))

  function handleSaveEdit(changes) {
    update('outbreaks', rowId('outbreaks', editRecord), changes)
    setEditRecord(null)
  }

  function handleConfirmDelete() {
    remove('outbreaks', rowId('outbreaks', deleteRecord))
    setDeleteRecord(null)
  }

  function handleAddOutbreak(record) {
    add('outbreaks', record)
    setShowAdd(false)
  }

  if (!selectedIsos.length) return <div className="page-empty">Select a country above.</div>

  return (
    <>
      <div className="page-header-slim">
        <h1 className="page-title">Outbreaks</h1>
        <p className="page-desc">Outbreak events across all years</p>
      </div>

      <PageTabs view={view} onChange={setView} />

      {view === 'charts' && <>

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

      <section className="section">
        <div className="charts-grid">
          <div className="card">
            <div className="card-header">
              <h2 className="card-title">Outbreaks by Disease</h2>
              <div className="card-filters">
                <span className="card-subtitle">All years combined</span>
                <select className="select-control select-sm" value={topByDisease} onChange={e => setTopByDisease(e.target.value)}>
                  <option value="3">Top 3</option>
                  <option value="5">Top 5</option>
                  <option value="all">All</option>
                </select>
              </div>
            </div>
            <ResponsiveContainer width="100%" height={Math.max(180, byDisease.length * 38 + 16)}>
              <BarChart data={byDisease} layout="vertical" margin={{ top: 4, right: 10, left: 2, bottom: 4 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#E5EAF0" />
                <XAxis type="number" allowDecimals={false} tick={{ fontSize: 11, fill: '#6B7C93' }} />
                <YAxis type="category" dataKey="disease" tick={{ fontSize: 11, fill: '#1A2B4A' }} width={135} />
                <Tooltip formatter={v => [`${v} outbreaks`]} />
                <Bar dataKey="count" name="Outbreaks" radius={[0, 4, 4, 0]}>
                  {byDisease.map(d => <Cell key={d.disease} fill={DISEASE_COLORS[d.disease] || '#6B7C93'} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="card">
            <div className="card-header"><h2 className="card-title">Outbreaks per Year</h2></div>
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

      {byCountryAll.length > 0 && (
        <section className="section">
          <div className="card">
            <div className="card-header">
              <h2 className="card-title">Outbreaks by Country</h2>
              <div className="card-filters">
                <span className="card-subtitle">All years combined · highest to lowest</span>
                <select className="select-control select-sm" value={topByCountry} onChange={e => setTopByCountry(e.target.value)}>
                  <option value="5">Top 5</option>
                  <option value="10">Top 10</option>
                  <option value="15">Top 15</option>
                  <option value="20">Top 20</option>
                  <option value="all">All</option>
                </select>
              </div>
            </div>
            <ResponsiveContainer width="100%" height={Math.max(220, byCountry.length * 38) + 8}>
              <BarChart
                data={byCountry}
                layout="vertical"
                margin={{ top: 4, right: 40, left: 4, bottom: 4 }}
              >
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#E5EAF0" />
                <XAxis type="number" allowDecimals={false} tick={{ fontSize: 11, fill: '#6B7C93' }} />
                <YAxis
                  type="category"
                  dataKey="country"
                  width={160}
                  tick={{ fontSize: 11, fill: '#1A2B4A' }}
                />
                <Tooltip formatter={v => [`${v} outbreaks`]} />
                <Bar dataKey="count" name="Outbreaks" fill="#D97706" radius={[0, 4, 4, 0]}
                  label={{ position: 'right', fontSize: 11, fill: '#6B7C93' }}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </section>
      )}

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
              {canEdit && (
                <button className="btn-add-record" onClick={() => setShowAdd(true)}>
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                  Add Outbreak
                </button>
              )}
            </div>
          </div>
          <OutbreakTable
            data={filtered}
            onEdit={canEdit ? setEditRecord : undefined}
            onDelete={canEdit ? setDeleteRecord : undefined}
          />
        </div>
      </section>

      </>}

      {view === 'table' && (
        <section className="section">
          <div className="card">
            <div className="card-header">
              <h2 className="card-title">Outbreak Records — All Years</h2>
              <div className="card-filters">
                <span className="card-subtitle">{allOutbreaks.length} outbreaks</span>
                {canEdit && (
                  <button className="btn-add-record" onClick={() => setShowAdd(true)}>
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                    Add Outbreak
                  </button>
                )}
              </div>
            </div>
            <div className="table-wrapper">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Year</th>
                    {multiIso && <th>Country</th>}
                    <th>Disease</th>
                    <th>Start Date</th>
                    <th>End Date</th>
                    <th>Cases</th>
                    <th>Deaths</th>
                    <th>Duration (days)</th>
                    <th>Detection (days)</th>
                    {canEdit && !multiIso && <th className="actions-col">Actions</th>}
                  </tr>
                </thead>
                <tbody>
                  {allOutbreaks.length === 0 && (
                    <tr><td colSpan={9} className="table-empty">No outbreak records found</td></tr>
                  )}
                  {allOutbreaks.map(o => (
                    <tr key={o.outbreak_id} className={selectedYears.includes(o.year) ? 'row-highlighted' : ''}>
                      <td>
                        <strong>{o.year}</strong>
                        {selectedYears.includes(o.year) && selectedYears.length < YEARS.length && (
                          <span className="year-badge">selected</span>
                        )}
                      </td>
                      {multiIso && <td className="mono">{o.iso_3_code}</td>}
                      <td>
                        <span className="disease-dot" style={{ background: DISEASE_COLORS[o.disease] || '#6B7C93' }} />
                        {o.disease}
                      </td>
                      <td>{o.start_date}</td>
                      <td>{o.end_date || '—'}</td>
                      <td className="num">{o.cases?.toLocaleString() ?? '—'}</td>
                      <td className="num">{o.deaths?.toLocaleString() ?? '—'}</td>
                      <td className="num">{o.duration_days ?? '—'}</td>
                      <td className={`num ${o.time_to_detection_days > 7 ? 'text-warn' : ''}`}>
                        {o.time_to_detection_days ?? '—'}
                      </td>
                      {canEdit && !multiIso && (
                        <td className="actions-col">
                          <EditBtn   onClick={() => setEditRecord(o)}   />
                          <DeleteBtn onClick={() => setDeleteRecord(o)} />
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </section>
      )}

      {editRecord && (
        <EditRecordModal record={editRecord} tableType="outbreaks" onSave={handleSaveEdit} onClose={() => setEditRecord(null)} />
      )}
      {deleteRecord && (
        <ConfirmDialog
          title="Delete Outbreak"
          message={`Delete outbreak ${deleteRecord.outbreak_id} (${deleteRecord.disease})? This cannot be undone.`}
          onConfirm={handleConfirmDelete}
          onCancel={() => setDeleteRecord(null)}
        />
      )}
      {showAdd && (
        <AddOutbreakModal
          iso3={primaryIso}
          year={typeof primaryYear === 'number' ? primaryYear : 2025}
          existingOutbreaks={state.outbreaks}
          onSave={handleAddOutbreak}
          onClose={() => setShowAdd(false)}
        />
      )}
    </>
  )
}

import { useEffect, useState, useMemo, useCallback, useRef } from 'react'
import { MapContainer, TileLayer, GeoJSON, useMap } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'

// ── Module-level boundary cache ───────────────────────────────────────────────
let _boundaryCache = null
const API = 'http://localhost:8000'

function useBoundaries() {
  const [data, setData] = useState(_boundaryCache)
  useEffect(() => {
    if (_boundaryCache) return
    const token = localStorage.getItem('who_afro_portal_token')
    fetch(`${API}/api/boundaries/`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(r => r.json())
      .then(fc => { _boundaryCache = fc; setData(fc) })
      .catch(err => console.error('Boundary fetch failed:', err))
  }, [])
  return data
}

// ── Colour helpers ────────────────────────────────────────────────────────────

function choroplethColor(value, max) {
  if (!max || value === 0) return '#CBD5E1'
  const r = value / max
  if (r > 0.70) return '#C00000'
  if (r > 0.40) return '#D97706'
  if (r > 0.15) return '#0071BC'
  return '#059669'
}

const DISEASE_COLORS = {
  'Cholera':                  '#0071BC',
  'Measles':                  '#F7941D',
  'Meningitis':               '#7B2D8B',
  'Yellow fever':             '#D4A017',
  'Lassa fever':              '#C00000',
  'Viral haemorrhagic fever': '#8B0000',
  'Polio (cVDPV)':            '#059669',
}

const LEGEND_ITEMS = [
  { color: '#059669', label: 'Low'      },
  { color: '#0071BC', label: 'Moderate' },
  { color: '#D97706', label: 'High'     },
  { color: '#C00000', label: 'Critical' },
  { color: '#CBD5E1', label: 'No data'  },
]

// ── Formatting ────────────────────────────────────────────────────────────────

function fmtMoney(n) {
  if (!n) return '$0'
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1_000)     return `$${(n / 1_000).toFixed(0)}K`
  return `$${Math.round(n)}`
}

// ── Panel positioning helper ──────────────────────────────────────────────────

function panelStyle(x, y) {
  const W = 288
  const left = x + W + 24 < window.innerWidth ? x + 18 : x - W - 18
  const top  = Math.max(10, Math.min(y - 30, window.innerHeight - 480))
  return { left, top }
}

// ── Hover panel ───────────────────────────────────────────────────────────────

function HoverPanel({ hover }) {
  if (!hover) return null
  const { country, detail, pos } = hover
  const { left, top } = panelStyle(pos.x, pos.y)

  if (!country) {
    return (
      <div className="mhp" style={{ left, top }}>
        <div className="mhp-header">
          <div className="mhp-name">{hover.name}</div>
          <div className="mhp-sub" style={{ opacity: .6 }}>Not in current filter</div>
        </div>
      </div>
    )
  }

  const diseases     = detail?.diseases || []
  const maxCases     = diseases[0]?.cases || 1
  const totalFunding = detail?.totalFunding || 0
  const domPct       = totalFunding ? Math.round((detail.domesticFunding / totalFunding) * 100) : 0
  const extPct       = 100 - domPct

  return (
    <div className="mhp" style={{ left, top }}>

      {/* ── Header ── */}
      <div className="mhp-header">
        <div className="mhp-header-row">
          <span className="mhp-name">{country.country_name}</span>
          <span className="mhp-iso">{hover.iso}</span>
        </div>
        <div className="mhp-sub">
          {country.subregion} Africa
          {country.priority === 1 && <span className="mhp-priority-badge">⚑ High Priority</span>}
        </div>
      </div>

      {/* ── Disease Surveillance ── */}
      <div className="mhp-section">
        <div className="mhp-section-title">Disease Surveillance</div>
        <div className="mhp-stat-row">
          <span>Cases <strong>{country.totalCases.toLocaleString()}</strong></span>
          <span>Deaths <strong>{country.totalDeaths.toLocaleString()}</strong></span>
          <span>CFR <strong>{country.avgCFR.toFixed(1)}%</strong></span>
        </div>
        {diseases.slice(0, 5).map(({ disease, cases }) => (
          <div key={disease} className="mhp-disease-row">
            <div className="mhp-disease-label">
              <span
                className="mhp-disease-dot"
                style={{ background: DISEASE_COLORS[disease] || '#94A3B8' }}
              />
              <span className="mhp-disease-name">{disease}</span>
              <span className="mhp-disease-count">{cases.toLocaleString()}</span>
            </div>
            <div className="mhp-bar-track">
              <div
                className="mhp-bar-fill"
                style={{
                  width: `${Math.round((cases / maxCases) * 100)}%`,
                  background: DISEASE_COLORS[disease] || '#94A3B8',
                }}
              />
            </div>
          </div>
        ))}
      </div>

      {/* ── Outbreaks ── */}
      <div className="mhp-section mhp-section-row">
        <span className="mhp-section-title">Outbreaks</span>
        <span className="mhp-outbreak-count">
          {country.outbreakCount > 0
            ? `⚠ ${country.outbreakCount} event${country.outbreakCount !== 1 ? 's' : ''}`
            : '— none recorded'}
        </span>
      </div>

      {/* ── Funding ── */}
      {totalFunding > 0 && (
        <div className="mhp-section">
          <div className="mhp-section-title">
            Funding
            <span className="mhp-funding-total">{fmtMoney(totalFunding)} total</span>
          </div>
          <div className="mhp-funding-bar">
            <div style={{ width: `${domPct}%`, background: '#0071BC', borderRadius: '3px 0 0 3px' }} />
            <div style={{ width: `${extPct}%`, background: '#D97706', borderRadius: '0 3px 3px 0' }} />
          </div>
          <div className="mhp-funding-labels">
            <span><span className="mhp-dot" style={{ background: '#0071BC' }} />{domPct}% domestic</span>
            <span><span className="mhp-dot" style={{ background: '#D97706' }} />{extPct}% external</span>
          </div>
        </div>
      )}

      {/* ── Health Capacity ── */}
      {detail && (detail.epidemiologists > 0 || detail.labTech > 0) && (
        <div className="mhp-section">
          <div className="mhp-section-title">Health Capacity</div>
          <div className="mhp-capacity-grid">
            <span>Epidemiologists</span>  <strong>{(detail.epidemiologists || 0).toLocaleString()}</strong>
            <span>FELTP Trained</span>    <strong>{(detail.feltp          || 0).toLocaleString()}</strong>
            <span>Lab Technicians</span>  <strong>{(detail.labTech        || 0).toLocaleString()}</strong>
          </div>
        </div>
      )}

    </div>
  )
}

// ── Auto-fit ──────────────────────────────────────────────────────────────────

function FitBounds({ geojsonData }) {
  const map = useMap()
  useEffect(() => {
    if (!geojsonData?.features?.length) return
    try {
      const bounds = L.geoJSON(geojsonData).getBounds()
      if (bounds.isValid()) map.fitBounds(bounds, { padding: [24, 24], maxZoom: 7 })
    } catch { /* ignore */ }
  }, [map, geojsonData])
  return null
}

// ── Metric config ─────────────────────────────────────────────────────────────

const METRIC_CFG = {
  totalCases:    { label: 'Total Cases',  fmt: v => v.toLocaleString() },
  totalDeaths:   { label: 'Total Deaths', fmt: v => v.toLocaleString() },
  outbreakCount: { label: 'Outbreaks',    fmt: v => String(v)          },
}

// ── Main component ────────────────────────────────────────────────────────────

export default function RegionalMap({ overview, detailData = {}, metric = 'totalCases', year, subregion }) {
  const boundaries = useBoundaries()
  const cfg = METRIC_CFG[metric] || METRIC_CFG.totalCases

  const [hoverIso, setHoverIso]   = useState(null)
  const [hoverPos, setHoverPos]   = useState({ x: 0, y: 0 })
  const panelRef                  = useRef(null)

  // Lookup maps — stable references via useMemo
  const overviewMap = useMemo(() => {
    const m = {}
    overview.forEach(c => { m[c.iso3] = c })
    return m
  }, [overview])

  const values      = overview.map(c => c[metric] || 0)
  const max         = Math.max(...values, 1)
  const visibleIsos = useMemo(() => new Set(overview.map(c => c.iso3)), [overview])

  // Keep refs always current so stable callbacks can read latest values
  const stateRef = useRef({})
  stateRef.current = { overviewMap, detailData, metric, max, visibleIsos, cfg, year }

  // Filtered features for FitBounds
  const visibleFeatures = useMemo(
    () => boundaries
      ? { features: boundaries.features.filter(f => visibleIsos.has(f.properties.iso3)) }
      : null,
    [boundaries, visibleIsos]
  )

  // GeoJSON key — forces re-mount when metric or data changes
  const geoKey = useMemo(
    () => `${metric}|${overview.map(c => `${c.iso3}:${c[metric] ?? 0}`).join(',')}`,
    [metric, overview]
  )

  // Stable style callback (reads latest values from stateRef)
  const styleFeature = useCallback((feature) => {
    const { overviewMap, metric, max, visibleIsos } = stateRef.current
    const iso    = feature.properties.iso3
    const data   = overviewMap[iso]
    const val    = data ? (data[metric] || 0) : 0
    const inView = visibleIsos.has(iso)
    return {
      fillColor:   inView ? choroplethColor(val, max) : '#E2E8F0',
      fillOpacity: inView ? 0.78 : 0.35,
      color:       inView ? '#fff' : '#C4CDD9',
      weight:      inView ? 1.2 : 0.6,
    }
  }, []) // stable — reads stateRef

  // Stable event callback
  const onEachFeature = useCallback((feature, layer) => {
    const iso = feature.properties.iso3

    layer.on({
      mouseover(e) {
        const { overviewMap, detailData, year, cfg } = stateRef.current
        const country = overviewMap[iso]
        const detail  = detailData[iso]
        setHoverIso(iso)
        setHoverPos({ x: e.originalEvent.clientX, y: e.originalEvent.clientY })
        // Show tooltip text
        const val = country ? (country[stateRef.current.metric] || 0) : 0
        layer.bindTooltip(
          country
            ? `<div class="map-tooltip"><strong>${country.country_name}</strong><span>${cfg.label}: <b>${cfg.fmt(val)}</b></span>${country.priority === 1 ? '<span class="map-tt-priority">⚑ High Priority</span>' : ''}</div>`
            : `<div class="map-tooltip"><strong>${feature.properties.name}</strong><span style="opacity:.6">Not in filter</span></div>`,
          { sticky: true, opacity: 0.96 }
        ).openTooltip()
        e.target.setStyle({ fillOpacity: 0.92, weight: 2.2, color: '#1A2B4A' })
      },
      mousemove(e) {
        setHoverPos({ x: e.originalEvent.clientX, y: e.originalEvent.clientY })
      },
      mouseout(e) {
        setHoverIso(null)
        layer.closeTooltip()
        const { overviewMap, metric, max, visibleIsos } = stateRef.current
        const data   = overviewMap[iso]
        const val    = data ? (data[metric] || 0) : 0
        const inView = visibleIsos.has(iso)
        e.target.setStyle({
          fillColor:   inView ? choroplethColor(val, max) : '#E2E8F0',
          fillOpacity: inView ? 0.78 : 0.35,
          color:       inView ? '#fff' : '#C4CDD9',
          weight:      inView ? 1.2 : 0.6,
        })
      },
    })
  }, []) // stable — reads stateRef

  // Build hover prop for the panel
  const hoverProp = useMemo(() => {
    if (!hoverIso) return null
    return {
      iso:     hoverIso,
      name:    overviewMap[hoverIso]?.country_name || hoverIso,
      country: overviewMap[hoverIso] || null,
      detail:  detailData[hoverIso]  || null,
      pos:     hoverPos,
    }
  }, [hoverIso, hoverPos, overviewMap, detailData])

  return (
    <div className="regional-map-wrap">
      <MapContainer
        center={[5, 20]}
        zoom={4}
        style={{ height: 'calc(100vh - 280px)', minHeight: '480px', width: '100%' }}
        scrollWheelZoom={false}
        zoomControl={true}
      >
        <TileLayer
          url="https://{s}.basemaps.cartocdn.com/light_nolabels/{z}/{x}/{y}{r}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
          subdomains="abcd"
          maxZoom={19}
        />

        {boundaries && (
          <>
            <GeoJSON
              key={geoKey}
              data={boundaries}
              style={styleFeature}
              onEachFeature={onEachFeature}
            />
            {visibleFeatures && <FitBounds geojsonData={visibleFeatures} />}
          </>
        )}

        <TileLayer
          url="https://{s}.basemaps.cartocdn.com/light_only_labels/{z}/{x}/{y}{r}.png"
          subdomains="abcd"
          maxZoom={19}
          pane="shadowPane"
        />
      </MapContainer>

      {/* Legend */}
      <div className="map-legend">
        {LEGEND_ITEMS.map(item => (
          <div key={item.label} className="map-legend-item">
            <span className="map-legend-dot" style={{ background: item.color }} />
            <span>{item.label}</span>
          </div>
        ))}
        {!boundaries && (
          <span style={{ marginLeft: 'auto', fontSize: 11, color: '#6B7C93', fontStyle: 'italic' }}>
            Loading boundaries…
          </span>
        )}
        <div className="map-legend-note">Colour intensity ∝ {cfg.label.toLowerCase()}</div>
      </div>

      {/* Hover panel — rendered outside Leaflet so it can use React state */}
      <div ref={panelRef}>
        <HoverPanel hover={hoverProp} />
      </div>
    </div>
  )
}

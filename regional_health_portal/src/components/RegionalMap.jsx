import { useEffect, useState, useMemo } from 'react'
import { MapContainer, TileLayer, GeoJSON, useMap } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'

// ── Module-level boundary cache (fetched once per session) ────────────────────
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

const LEGEND_ITEMS = [
  { color: '#059669', label: 'Low'      },
  { color: '#0071BC', label: 'Moderate' },
  { color: '#D97706', label: 'High'     },
  { color: '#C00000', label: 'Critical' },
  { color: '#CBD5E1', label: 'No data'  },
]

// ── Auto-fit to the filtered features ─────────────────────────────────────────

function FitBounds({ geojsonData }) {
  const map = useMap()
  useEffect(() => {
    if (!geojsonData?.features?.length) return
    try {
      const layer = L.geoJSON(geojsonData)
      const bounds = layer.getBounds()
      if (bounds.isValid()) {
        map.fitBounds(bounds, { padding: [24, 24], maxZoom: 7 })
      }
    } catch (e) { /* ignore */ }
  }, [map, geojsonData])
  return null
}

// ── Metric config ──────────────────────────────────────────────────────────────

const METRIC_CFG = {
  totalCases:    { label: 'Total Cases',  fmt: v => v.toLocaleString() },
  totalDeaths:   { label: 'Total Deaths', fmt: v => v.toLocaleString() },
  outbreakCount: { label: 'Outbreaks',    fmt: v => String(v)          },
}

// ── Main component ─────────────────────────────────────────────────────────────

export default function RegionalMap({ overview, metric = 'totalCases', year, subregion }) {
  const boundaries = useBoundaries()
  const cfg = METRIC_CFG[metric] || METRIC_CFG.totalCases

  // Build iso3 → country data lookup from the overview prop
  const overviewMap = useMemo(() => {
    const m = {}
    overview.forEach(c => { m[c.iso3] = c })
    return m
  }, [overview])

  const values = overview.map(c => c[metric] || 0)
  const max    = Math.max(...values, 1)

  // Subset of boundaries matching the selected sub-region countries
  const visibleIsos = useMemo(() => new Set(overview.map(c => c.iso3)), [overview])

  // Key forces GeoJSON layer to re-mount when metric or values change
  const geoKey = useMemo(
    () => `${metric}|${overview.map(c => `${c.iso3}:${c[metric] ?? 0}`).join(',')}`,
    [metric, overview]
  )

  // GeoJSON style callback
  function styleFeature(feature) {
    const iso  = feature.properties.iso3
    const data = overviewMap[iso]
    const val  = data ? (data[metric] || 0) : null
    const inView = visibleIsos.has(iso)

    return {
      fillColor:   inView ? choroplethColor(val, max) : '#E2E8F0',
      fillOpacity: inView ? 0.78 : 0.35,
      color:       inView ? '#fff' : '#C4CDD9',
      weight:      inView ? 1.2 : 0.6,
    }
  }

  // Tooltip + popup per feature
  function onEachFeature(feature, layer) {
    const iso  = feature.properties.iso3
    const data = overviewMap[iso]

    if (!data) {
      layer.bindTooltip(
        `<div class="map-tooltip"><strong>${feature.properties.name}</strong><span style="opacity:.6">Not in current filter</span></div>`,
        { sticky: true }
      )
      return
    }

    const val = data[metric] || 0

    layer.bindTooltip(
      `<div class="map-tooltip">
        <strong>${data.country_name}</strong>
        <span>${cfg.label}: <b>${cfg.fmt(val)}</b></span>
        ${data.priority === 1 ? '<span class="map-tt-priority">⚑ High Priority</span>' : ''}
      </div>`,
      { sticky: true }
    )

    layer.bindPopup(
      `<div class="map-popup">
        <div class="map-popup-title">${data.country_name}</div>
        <div class="map-popup-iso">${iso} · ${data.subregion} Africa · ${year}</div>
        <div class="map-popup-divider"></div>
        <div class="map-popup-grid">
          <span>Cases</span>     <strong>${data.totalCases.toLocaleString()}</strong>
          <span>Deaths</span>    <strong>${data.totalDeaths.toLocaleString()}</strong>
          <span>Avg CFR</span>   <strong>${data.avgCFR.toFixed(2)}%</strong>
          <span>Outbreaks</span> <strong>${data.outbreakCount}</strong>
          <span>Priority</span>  <strong style="color:${
            data.priority === 1 ? '#C00000' : data.priority === 2 ? '#D97706' : '#059669'
          }">${data.priority === 1 ? 'High' : data.priority === 2 ? 'Medium' : 'Standard'}</strong>
        </div>
      </div>`,
      { maxWidth: 260 }
    )

    layer.on({
      mouseover(e) { e.target.setStyle({ fillOpacity: 0.92, weight: 2.2, color: '#1A2B4A' }) },
      mouseout(e)  { e.target.setStyle(styleFeature(feature)) },
    })
  }

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
            <FitBounds geojsonData={{ features: boundaries.features.filter(f => visibleIsos.has(f.properties.iso3)) }} />
          </>
        )}

        {/* Label tile layer on top so country names render over the polygons */}
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
    </div>
  )
}

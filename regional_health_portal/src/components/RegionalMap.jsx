import { useEffect } from 'react'
import { MapContainer, TileLayer, CircleMarker, Popup, Tooltip, useMap } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'

// ── colour + size helpers ─────────────────────────────────────────────────────

function markerColor(value, max) {
  if (!max || value === 0) return '#94A3B8'
  const r = value / max
  if (r > 0.70) return '#C00000'
  if (r > 0.40) return '#D97706'
  if (r > 0.15) return '#0071BC'
  return '#059669'
}

function markerRadius(value, max) {
  if (!max || value === 0) return 7
  return 9 + Math.sqrt(value / max) * 28
}

// ── auto-fit to visible markers whenever overview changes ─────────────────────

function FitBounds({ positions }) {
  const map = useMap()
  useEffect(() => {
    if (positions.length > 0) {
      map.fitBounds(positions, { padding: [48, 48], maxZoom: 7 })
    }
  }, [map, positions])
  return null
}

// ── metric config ─────────────────────────────────────────────────────────────

const METRIC_CFG = {
  totalCases:    { label: 'Total Cases',    fmt: v => v.toLocaleString() },
  totalDeaths:   { label: 'Total Deaths',   fmt: v => v.toLocaleString() },
  outbreakCount: { label: 'Outbreaks',      fmt: v => String(v)          },
}

const LEGEND_ITEMS = [
  { color: '#059669', label: 'Low'  },
  { color: '#0071BC', label: 'Moderate' },
  { color: '#D97706', label: 'High' },
  { color: '#C00000', label: 'Critical' },
  { color: '#94A3B8', label: 'No data'  },
]

// ── component ─────────────────────────────────────────────────────────────────

export default function RegionalMap({ overview, metric = 'totalCases', year, subregion }) {
  const cfg = METRIC_CFG[metric] || METRIC_CFG.totalCases

  const values = overview.map(c => c[metric] || 0)
  const max    = Math.max(...values, 1)

  const positions = overview
    .filter(c => c.lat && c.lng)
    .map(c => [c.lat, c.lng])

  return (
    <div className="regional-map-wrap">
      <MapContainer
        center={[5, 20]}
        zoom={4}
        style={{ height: '440px', width: '100%', borderRadius: '0 0 8px 8px' }}
        scrollWheelZoom={false}
        zoomControl={true}
      >
        <TileLayer
          url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
          subdomains="abcd"
          maxZoom={19}
        />

        {positions.length > 0 && <FitBounds positions={positions} />}

        {overview.map(c => {
          if (!c.lat || !c.lng) return null
          const val    = c[metric] || 0
          const color  = markerColor(val, max)
          const radius = markerRadius(val, max)

          return (
            <CircleMarker
              key={c.iso3}
              center={[c.lat, c.lng]}
              radius={radius}
              pathOptions={{
                fillColor:   color,
                fillOpacity: 0.82,
                color:       '#fff',
                weight:      c.priority === 1 ? 2.5 : 1.5,
                opacity:     1,
              }}
            >
              <Tooltip sticky>
                <div className="map-tooltip">
                  <strong>{c.country_name}</strong>
                  <span>{cfg.label}: <b>{cfg.fmt(val)}</b></span>
                  {c.priority === 1 && <span className="map-tt-priority">⚑ High Priority</span>}
                </div>
              </Tooltip>

              <Popup maxWidth={240}>
                <div className="map-popup">
                  <div className="map-popup-title">{c.country_name}</div>
                  <div className="map-popup-iso">{c.iso3} · {subregion} Africa · {year}</div>
                  <div className="map-popup-divider" />
                  <div className="map-popup-grid">
                    <span>Cases</span>       <strong>{c.totalCases.toLocaleString()}</strong>
                    <span>Deaths</span>      <strong>{c.totalDeaths.toLocaleString()}</strong>
                    <span>Avg CFR</span>     <strong>{c.avgCFR.toFixed(2)}%</strong>
                    <span>Outbreaks</span>   <strong>{c.outbreakCount}</strong>
                    <span>Priority</span>    <strong style={{ color: c.priority === 1 ? '#C00000' : c.priority === 2 ? '#D97706' : '#059669' }}>
                      {c.priority === 1 ? 'High' : c.priority === 2 ? 'Medium' : 'Standard'}
                    </strong>
                  </div>
                </div>
              </Popup>
            </CircleMarker>
          )
        })}
      </MapContainer>

      {/* Legend */}
      <div className="map-legend">
        {LEGEND_ITEMS.map(item => (
          <div key={item.label} className="map-legend-item">
            <span className="map-legend-dot" style={{ background: item.color }} />
            <span>{item.label}</span>
          </div>
        ))}
        <div className="map-legend-note">Circle size ∝ {cfg.label.toLowerCase()}</div>
      </div>
    </div>
  )
}

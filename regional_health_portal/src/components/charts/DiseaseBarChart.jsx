import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Cell,
} from 'recharts'

const DISEASE_COLORS = {
  'Cholera':                    '#0071BC',
  'Measles':                    '#F7941D',
  'Meningitis':                 '#7B2D8B',
  'Yellow fever':               '#D4A017',
  'Lassa fever':                '#C00000',
  'Viral haemorrhagic fever':   '#8B0000',
  'Polio (cVDPV)':              '#059669',
}
const DEFAULT_COLOR = '#6B7C93'

const fmt = v => v >= 1_000_000 ? `${(v / 1_000_000).toFixed(1)}M` : v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v

const CustomTooltip = ({ active, payload }) => {
  if (!active || !payload?.length) return null
  const d = payload[0].payload
  return (
    <div className="chart-tooltip">
      <p className="tooltip-label">{d.disease}</p>
      <p>Cases: <strong>{d.cases_reported?.toLocaleString()}</strong></p>
      {d.deaths_reported != null && <p>Deaths: <strong>{d.deaths_reported?.toLocaleString()}</strong></p>}
      {d.cfr != null && <p>CFR: <strong>{d.cfr?.toFixed(1)}%</strong></p>}
    </div>
  )
}

export default function DiseaseBarChart({ data = [] }) {
  if (!data.length) return <div className="chart-empty">No data available</div>

  const sorted = [...data].sort((a, b) => (b.cases_reported || 0) - (a.cases_reported || 0))

  return (
    <ResponsiveContainer width="100%" height={280}>
      <BarChart
        data={sorted}
        layout="vertical"
        margin={{ top: 4, right: 24, left: 2, bottom: 4 }}
      >
        <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#E5EAF0" />
        <XAxis type="number" tickFormatter={fmt} tick={{ fontSize: 11, fill: '#6B7C93' }} />
        <YAxis
          type="category"
          dataKey="disease"
          tick={{ fontSize: 11, fill: '#1A2B4A' }}
          width={160}
        />
        <Tooltip content={<CustomTooltip />} />
        <Bar dataKey="cases_reported" name="Cases" radius={[0, 4, 4, 0]}>
          {sorted.map(entry => (
            <Cell key={entry.disease} fill={DISEASE_COLORS[entry.disease] || DEFAULT_COLOR} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  )
}

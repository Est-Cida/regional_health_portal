import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  Legend, ResponsiveContainer, ReferenceLine,
} from 'recharts'

const fmt = (v) => v >= 1_000_000 ? `${(v / 1_000_000).toFixed(1)}M` : v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null
  return (
    <div className="chart-tooltip">
      <p className="tooltip-label">{label}</p>
      {payload.map(p => (
        <p key={p.dataKey} style={{ color: p.color }}>
          {p.name}: <strong>{p.value?.toLocaleString()}</strong>
        </p>
      ))}
    </div>
  )
}

export default function TrendLineChart({ data = [] }) {
  if (!data.length) return <div className="chart-empty">No data available</div>

  return (
    <ResponsiveContainer width="100%" height={280}>
      <LineChart data={data} margin={{ top: 4, right: 24, left: 8, bottom: 4 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#E5EAF0" />
        <XAxis dataKey="year" tick={{ fontSize: 11, fill: '#6B7C93' }} />
        <YAxis tickFormatter={fmt} tick={{ fontSize: 11, fill: '#6B7C93' }} width={52} />
        <Tooltip content={<CustomTooltip />} />
        <Legend wrapperStyle={{ fontSize: 12 }} />
        <Line
          type="monotone"
          dataKey="totalCases"
          name="Cases"
          stroke="#0071BC"
          strokeWidth={2.5}
          dot={{ r: 4, fill: '#0071BC' }}
          activeDot={{ r: 6 }}
        />
        <Line
          type="monotone"
          dataKey="totalDeaths"
          name="Deaths"
          stroke="#C00000"
          strokeWidth={2.5}
          dot={{ r: 4, fill: '#C00000' }}
          activeDot={{ r: 6 }}
        />
      </LineChart>
    </ResponsiveContainer>
  )
}

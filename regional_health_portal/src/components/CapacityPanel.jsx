function MetricRow({ label, value, unit = '', barValue, barMax = 100, warn, danger }) {
  const pct = barValue !== undefined ? Math.min((barValue / barMax) * 100, 100) : null
  const barColor = barValue >= 80 ? '#059669' : barValue >= 50 ? '#D97706' : '#C00000'

  return (
    <div className="metric-row">
      <div className="metric-label">{label}</div>
      <div className="metric-right">
        <span className={`metric-value ${warn ? 'text-warn' : ''} ${danger ? 'text-danger' : ''}`}>
          {value ?? '—'}{value != null ? unit : ''}
        </span>
        {pct !== null && (
          <div className="metric-bar-track">
            <div className="metric-bar-fill" style={{ width: `${pct}%`, background: barColor }} />
          </div>
        )}
      </div>
    </div>
  )
}

export default function CapacityPanel({ title, data, type }) {
  if (!data) {
    return (
      <div className="capacity-card">
        <h3 className="capacity-title">{title}</h3>
        <p className="no-data">No data available</p>
      </div>
    )
  }

  return (
    <div className="capacity-card">
      <h3 className="capacity-title">{title}</h3>

      {type === 'lab' && (
        <>
          <MetricRow label="Public Labs"              value={data.total_public_labs} />
          <MetricRow label="ISO 15189 Accredited"     value={data.labs_iso15189_accredited} />
          <MetricRow
            label="Accreditation Rate"
            value={data.iso15189_accreditation_pct?.toFixed(1)}
            unit="%"
            barValue={data.iso15189_accreditation_pct}
          />
          <MetricRow
            label="Avg. Turnaround Time"
            value={data.avg_turnaround_time_days?.toFixed(1)}
            unit=" days"
            warn={data.avg_turnaround_time_days > 5}
          />
          <MetricRow
            label="Diagnostic Tests / 100k"
            value={data.diagnostic_tests_per_100k}
          />
        </>
      )}

      {type === 'reporting' && (
        <>
          <MetricRow
            label="Timeliness"
            value={data.timeliness_pct?.toFixed(1)}
            unit="%"
            barValue={data.timeliness_pct}
            warn={data.timeliness_pct < 80}
          />
          <MetricRow
            label="Completeness"
            value={data.completeness_pct?.toFixed(1)}
            unit="%"
            barValue={data.completeness_pct}
            warn={data.completeness_pct < 80}
          />
          <MetricRow
            label="IDSR Weekly Compliance"
            value={data.idsr_weekly_compliance_pct?.toFixed(1)}
            unit="%"
            barValue={data.idsr_weekly_compliance_pct}
            warn={data.idsr_weekly_compliance_pct < 80}
          />
        </>
      )}

      {type === 'workforce' && (
        <>
          <MetricRow label="Epidemiologists"        value={data.epidemiologists_total} />
          <MetricRow label="Epi / 100k pop"         value={data.epidemiologists_per_100k?.toFixed(3)} />
          <MetricRow label="FELTP Trained"           value={data.feltp_trained_total} />
          <MetricRow
            label="FELTP %"
            value={data.feltp_trained_pct?.toFixed(1)}
            unit="%"
            barValue={data.feltp_trained_pct}
          />
          <MetricRow label="Lab Technicians"         value={data.lab_technicians_total} />
          <MetricRow label="Lab Tech / 100k"         value={data.lab_technicians_per_100k?.toFixed(2)} />
        </>
      )}

      {type === 'funding' && (
        <>
          <MetricRow
            label="Total Funding"
            value={data.total_funding_usd ? `$${(data.total_funding_usd / 1_000_000).toFixed(1)}M` : null}
          />
          <MetricRow
            label="Domestic"
            value={data.domestic_funding_usd ? `$${(data.domestic_funding_usd / 1_000_000).toFixed(1)}M` : null}
          />
          <MetricRow
            label="External"
            value={data.external_funding_usd ? `$${(data.external_funding_usd / 1_000_000).toFixed(1)}M` : null}
          />
          <MetricRow
            label="Per Capita"
            value={data.funding_per_capita_usd?.toFixed(2)}
            unit=" USD"
          />
          <MetricRow
            label="Domestic Share"
            value={data.domestic_funding_share_pct?.toFixed(1)}
            unit="%"
            barValue={data.domestic_funding_share_pct}
          />
        </>
      )}
    </div>
  )
}

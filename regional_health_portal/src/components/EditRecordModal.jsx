import { useState, useEffect } from 'react'

const SCHEMAS = {
  outbreaks: {
    title: 'Edit Outbreak Record',
    readOnly: [
      { key: 'outbreak_id', label: 'ID' },
      { key: 'iso_3_code',  label: 'Country' },
      { key: 'year',        label: 'Year' },
      { key: 'disease',     label: 'Disease' },
    ],
    editable: [
      { key: 'start_date',             label: 'Start Date',            type: 'date' },
      { key: 'duration_days',          label: 'Duration (days)',       type: 'number', min: 0 },
      { key: 'time_to_detection_days', label: 'Detection Time (days)', type: 'number', min: 0 },
      { key: 'cases',                  label: 'Cases',                 type: 'number', min: 0 },
      { key: 'deaths',                 label: 'Deaths',                type: 'number', min: 0 },
    ],
  },
  surveillance: {
    title: 'Edit Surveillance Record',
    readOnly: [
      { key: 'iso_3_code', label: 'Country' },
      { key: 'year',       label: 'Year' },
      { key: 'disease',    label: 'Disease' },
    ],
    editable: [
      { key: 'cases_reported',          label: 'Cases Reported',   type: 'number', min: 0 },
      { key: 'deaths_reported',         label: 'Deaths Reported',  type: 'number', min: 0 },
      { key: 'attack_rate_per_100k',    label: 'Attack Rate/100k', type: 'number', min: 0 },
      { key: 'case_fatality_ratio_pct', label: 'CFR (%)',          type: 'number', min: 0, max: 100 },
    ],
  },
  labCapacity: {
    title: 'Edit Laboratory Record',
    readOnly: [
      { key: 'iso_3_code', label: 'Country' },
      { key: 'year',       label: 'Year' },
    ],
    editable: [
      { key: 'total_public_labs',          label: 'Public Labs',           type: 'number', min: 0 },
      { key: 'labs_iso15189_accredited',   label: 'Accredited Labs',       type: 'number', min: 0 },
      { key: 'iso15189_accreditation_pct', label: 'Accreditation (%)',     type: 'number', min: 0, max: 100 },
      { key: 'avg_turnaround_time_days',   label: 'Avg Turnaround (days)', type: 'number', min: 0 },
      { key: 'diagnostic_tests_per_100k',  label: 'Tests per 100k',        type: 'number', min: 0 },
    ],
  },
  reporting: {
    title: 'Edit Reporting Record',
    readOnly: [
      { key: 'iso_3_code', label: 'Country' },
      { key: 'year',       label: 'Year' },
    ],
    editable: [
      { key: 'timeliness_pct',             label: 'Timeliness (%)',      type: 'number', min: 0, max: 100 },
      { key: 'completeness_pct',           label: 'Completeness (%)',    type: 'number', min: 0, max: 100 },
      { key: 'idsr_weekly_compliance_pct', label: 'IDSR Compliance (%)', type: 'number', min: 0, max: 100 },
    ],
  },
  workforce: {
    title: 'Edit Workforce Record',
    readOnly: [
      { key: 'iso_3_code', label: 'Country' },
      { key: 'year',       label: 'Year' },
    ],
    editable: [
      { key: 'epidemiologists_total',    label: 'Epidemiologists',    type: 'number', min: 0 },
      { key: 'epidemiologists_per_100k', label: 'Epi per 100k',      type: 'number', min: 0 },
      { key: 'feltp_trained_total',      label: 'FELTP Trained',     type: 'number', min: 0 },
      { key: 'feltp_trained_pct',        label: 'FELTP (%)',         type: 'number', min: 0, max: 100 },
      { key: 'lab_technicians_total',    label: 'Lab Technicians',   type: 'number', min: 0 },
      { key: 'lab_technicians_per_100k', label: 'Lab Tech / 100k',  type: 'number', min: 0 },
    ],
  },
  funding: {
    title: 'Edit Funding Record',
    readOnly: [
      { key: 'iso_3_code', label: 'Country' },
      { key: 'year',       label: 'Year' },
    ],
    editable: [
      { key: 'total_funding_usd',          label: 'Total Funding (USD)',  type: 'number', min: 0 },
      { key: 'domestic_funding_usd',       label: 'Domestic (USD)',       type: 'number', min: 0 },
      { key: 'external_funding_usd',       label: 'External (USD)',       type: 'number', min: 0 },
      { key: 'funding_per_capita_usd',     label: 'Per Capita (USD)',     type: 'number', min: 0 },
      { key: 'domestic_funding_share_pct', label: 'Domestic Share (%)',   type: 'number', min: 0, max: 100 },
    ],
  },
}

function EditIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
    </svg>
  )
}

export { EditIcon }

export default function EditRecordModal({ record, tableType, onSave, onClose }) {
  const schema = SCHEMAS[tableType]

  const [form, setForm] = useState(() => {
    const init = {}
    schema.editable.forEach(f => { init[f.key] = record[f.key] ?? '' })
    return init
  })
  const [errors, setErrors] = useState({})

  useEffect(() => {
    const handleKey = e => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [onClose])

  function validate() {
    const errs = {}
    schema.editable.forEach(f => {
      if (f.type !== 'number') return
      const v = form[f.key]
      if (v === '' || v == null) { errs[f.key] = 'Required'; return }
      const n = Number(v)
      if (isNaN(n))                 { errs[f.key] = 'Must be a number'; return }
      if (f.min != null && n < f.min) { errs[f.key] = `Min ${f.min}`; return }
      if (f.max != null && n > f.max) { errs[f.key] = `Max ${f.max}`; return }
    })
    return errs
  }

  function handleSubmit(e) {
    e.preventDefault()
    const errs = validate()
    if (Object.keys(errs).length) { setErrors(errs); return }
    const parsed = {}
    schema.editable.forEach(f => {
      parsed[f.key] = f.type === 'number' ? Number(form[f.key]) : form[f.key]
    })
    onSave(parsed)
  }

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal edit-modal">
        <div className="modal-header">
          <h2 className="modal-title">{schema.title}</h2>
          <button className="modal-close" onClick={onClose} aria-label="Close">✕</button>
        </div>

        <div className="modal-readonly-fields">
          {schema.readOnly.map(f => (
            <div key={f.key} className="readonly-field">
              <span className="readonly-label">{f.label}</span>
              <span className="readonly-value">{record[f.key]}</span>
            </div>
          ))}
        </div>

        <form className="modal-form" onSubmit={handleSubmit}>
          <div className="modal-fields-grid">
            {schema.editable.map(f => (
              <div key={f.key} className="form-field">
                <label className="form-label" htmlFor={`field-${f.key}`}>{f.label}</label>
                <input
                  id={`field-${f.key}`}
                  className={`form-input${errors[f.key] ? ' form-input-error' : ''}`}
                  type={f.type === 'date' ? 'date' : 'text'}
                  inputMode={f.type === 'number' ? 'decimal' : undefined}
                  value={form[f.key]}
                  onChange={e => {
                    const v = e.target.value
                    setForm(prev => ({ ...prev, [f.key]: v }))
                    if (errors[f.key]) setErrors(prev => ({ ...prev, [f.key]: null }))
                  }}
                />
                {errors[f.key] && <span className="form-error">{errors[f.key]}</span>}
              </div>
            ))}
          </div>

          <div className="modal-actions">
            <button type="button" className="btn-secondary" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn-primary">Save Changes</button>
          </div>
        </form>
      </div>
    </div>
  )
}

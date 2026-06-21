import { useState, useEffect } from 'react'
import { getDiseaseList } from '../data/dataService'

const DISEASES = getDiseaseList()

const EMPTY = {
  disease: '',
  start_date: '',
  duration_days: '',
  time_to_detection_days: '',
  cases: '',
  deaths: '',
}

function nextId(outbreaks) {
  const max = outbreaks.reduce((m, o) => {
    const n = parseInt(o.outbreak_id?.replace(/\D/g, '') || '0', 10)
    return Math.max(m, n)
  }, 0)
  return `OB-${String(max + 1).padStart(5, '0')}`
}

export default function AddOutbreakModal({ iso3, year, existingOutbreaks, onSave, onClose }) {
  const [form, setForm] = useState(EMPTY)
  const [errors, setErrors] = useState({})

  useEffect(() => {
    const handleKey = e => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [onClose])

  function set(key, value) {
    setForm(prev => ({ ...prev, [key]: value }))
    if (errors[key]) setErrors(prev => ({ ...prev, [key]: null }))
  }

  function validate() {
    const errs = {}
    if (!form.disease)                             errs.disease                = 'Required'
    if (!form.start_date)                          errs.start_date             = 'Required'
    if (form.duration_days          === '')        errs.duration_days          = 'Required'
    if (form.time_to_detection_days === '')        errs.time_to_detection_days = 'Required'
    if (form.cases                  === '')        errs.cases                  = 'Required'
    if (form.deaths                 === '')        errs.deaths                 = 'Required'
    ;['duration_days', 'time_to_detection_days', 'cases', 'deaths'].forEach(k => {
      if (!errs[k] && isNaN(Number(form[k]))) errs[k] = 'Must be a number'
      if (!errs[k] && Number(form[k]) < 0)    errs[k] = 'Must be ≥ 0'
    })
    return errs
  }

  function handleSubmit(e) {
    e.preventDefault()
    const errs = validate()
    if (Object.keys(errs).length) { setErrors(errs); return }
    onSave({
      outbreak_id:              nextId(existingOutbreaks),
      iso_3_code:               iso3,
      year:                     Number(year),
      disease:                  form.disease,
      start_date:               form.start_date,
      duration_days:            Number(form.duration_days),
      time_to_detection_days:   Number(form.time_to_detection_days),
      cases:                    Number(form.cases),
      deaths:                   Number(form.deaths),
    })
  }

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal edit-modal">
        <div className="modal-header">
          <h2 className="modal-title">Add Outbreak Record</h2>
          <button className="modal-close" onClick={onClose} aria-label="Close">✕</button>
        </div>

        <div className="modal-readonly-fields">
          <div className="readonly-field">
            <span className="readonly-label">Country</span>
            <span className="readonly-value">{iso3}</span>
          </div>
          <div className="readonly-field">
            <span className="readonly-label">Year</span>
            <span className="readonly-value">{year}</span>
          </div>
        </div>

        <form className="modal-form" onSubmit={handleSubmit}>
          <div className="modal-fields-grid">

            <div className="form-field form-field-wide">
              <label className="form-label" htmlFor="add-disease">Disease</label>
              <select
                id="add-disease"
                className={`form-input${errors.disease ? ' form-input-error' : ''}`}
                value={form.disease}
                onChange={e => set('disease', e.target.value)}
              >
                <option value="">Select a disease…</option>
                {DISEASES.map(d => <option key={d} value={d}>{d}</option>)}
              </select>
              {errors.disease && <span className="form-error">{errors.disease}</span>}
            </div>

            <div className="form-field form-field-wide">
              <label className="form-label" htmlFor="add-start_date">Start Date</label>
              <input
                id="add-start_date"
                type="date"
                className={`form-input${errors.start_date ? ' form-input-error' : ''}`}
                value={form.start_date}
                onChange={e => set('start_date', e.target.value)}
              />
              {errors.start_date && <span className="form-error">{errors.start_date}</span>}
            </div>

            {[
              { key: 'duration_days',          label: 'Duration (days)' },
              { key: 'time_to_detection_days', label: 'Detection Time (days)' },
              { key: 'cases',                  label: 'Cases' },
              { key: 'deaths',                 label: 'Deaths' },
            ].map(f => (
              <div key={f.key} className="form-field">
                <label className="form-label" htmlFor={`add-${f.key}`}>{f.label}</label>
                <input
                  id={`add-${f.key}`}
                  type="text"
                  inputMode="decimal"
                  className={`form-input${errors[f.key] ? ' form-input-error' : ''}`}
                  value={form[f.key]}
                  onChange={e => set(f.key, e.target.value)}
                />
                {errors[f.key] && <span className="form-error">{errors[f.key]}</span>}
              </div>
            ))}
          </div>

          <div className="modal-actions">
            <button type="button" className="btn-secondary" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn-primary">Add Outbreak</button>
          </div>
        </form>
      </div>
    </div>
  )
}

import { useState, useRef, useEffect } from 'react'

export default function MultiSelectDropdown({
  options,
  selected,
  onChange,
  placeholder = 'Select…',
  allLabel = 'All',
}) {
  const [open, setOpen] = useState(false)
  const ref = useRef(null)

  useEffect(() => {
    const handler = e => { if (ref.current && !ref.current.contains(e.target)) setOpen(false) }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const allSelected  = selected.length === options.length
  const someSelected = selected.length > 0 && !allSelected

  const displayText = allSelected
    ? allLabel
    : selected.length === 0
    ? placeholder
    : selected.length === 1
    ? options.find(o => String(o.value) === String(selected[0]))?.label ?? String(selected[0])
    : `${selected.length} selected`

  function toggleAll() {
    onChange(allSelected ? [] : options.map(o => o.value))
  }

  function toggle(value) {
    const str = String(value)
    const has = selected.some(s => String(s) === str)
    onChange(has ? selected.filter(s => String(s) !== str) : [...selected, value])
  }

  return (
    <div className="msd-wrap" ref={ref}>
      <button
        className={`msd-trigger${open ? ' open' : ''}`}
        onClick={() => setOpen(o => !o)}
        type="button"
      >
        <span className="msd-label">{displayText}</span>
        <svg
          className={`msd-chevron${open ? ' flipped' : ''}`}
          width="11" height="11" viewBox="0 0 24 24"
          fill="none" stroke="currentColor" strokeWidth="2.5"
        >
          <polyline points="6 9 12 15 18 9"/>
        </svg>
      </button>

      {open && (
        <div className="msd-panel">
          <label className="msd-option msd-option-all">
            <input
              type="checkbox"
              className="msd-checkbox"
              checked={allSelected}
              ref={el => { if (el) el.indeterminate = someSelected }}
              onChange={toggleAll}
            />
            <span className="msd-option-label">{allLabel}</span>
          </label>
          <div className="msd-divider" />
          {options.map(o => (
            <label key={o.value} className="msd-option">
              <input
                type="checkbox"
                className="msd-checkbox"
                checked={selected.some(s => String(s) === String(o.value))}
                onChange={() => toggle(o.value)}
              />
              <span className="msd-option-label">{o.label}</span>
            </label>
          ))}
        </div>
      )}
    </div>
  )
}

import { useEffect } from 'react'

export default function ConfirmDialog({ title, message, onConfirm, onCancel }) {
  useEffect(() => {
    const handleKey = e => { if (e.key === 'Escape') onCancel() }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [onCancel])

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onCancel()}>
      <div className="modal confirm-modal">
        <div className="confirm-body">
          <div className="confirm-icon">⚠️</div>
          <div className="confirm-title">{title}</div>
          <div className="confirm-message">{message}</div>
          <div className="modal-actions modal-actions-center">
            <button className="btn-secondary" onClick={onCancel}>Cancel</button>
            <button className="btn-danger"    onClick={onConfirm}>Delete</button>
          </div>
        </div>
      </div>
    </div>
  )
}

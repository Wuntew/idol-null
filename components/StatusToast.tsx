'use client'

export default function StatusToast({
  tone,
  message,
  onDismiss,
}: {
  tone: 'success' | 'error' | 'info'
  message: string
  onDismiss?: () => void
}) {
  return (
    <div className={`status-toast status-toast-${tone}`} role={tone === 'error' ? 'alert' : 'status'}>
      <span>{message}</span>
      {onDismiss && (
        <button type="button" onClick={onDismiss} aria-label="Dismiss notification">×</button>
      )}
    </div>
  )
}

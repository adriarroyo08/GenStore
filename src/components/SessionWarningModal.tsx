import { useEffect, useState } from 'react'
import { useAuth } from '@/hooks/useAuth'

/**
 * Modal que avisa al usuario que su sesión está por expirar por inactividad.
 * Le da la opción de continuar o cerrar sesión.
 */
export function SessionWarningModal() {
  const { sessionWarning, remainingSessionMs, refreshSession, logout } = useAuth()
  const [countdown, setCountdown] = useState(Math.ceil(remainingSessionMs / 1000))

  useEffect(() => {
    if (!sessionWarning) return

    setCountdown(Math.ceil(remainingSessionMs / 1000))
    const interval = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(interval)
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(interval)
  }, [sessionWarning, remainingSessionMs])

  if (!sessionWarning) return null

  const minutes = Math.floor(countdown / 60)
  const seconds = countdown % 60
  const timeLabel = minutes > 0 ? `${minutes}:${String(seconds).padStart(2, '0')} min` : `${seconds} seg`

  return (
    <div style={styles.overlay} role="dialog" aria-modal="true" aria-labelledby="session-warning-title">
      <div style={styles.modal}>
        <div style={styles.iconWrapper}>
          <span style={styles.icon}>⚠️</span>
        </div>
        <h2 id="session-warning-title" style={styles.title}>
          Sesión a punto de expirar
        </h2>
        <p style={styles.message}>
          Tu sesión cerrará por inactividad en{' '}
          <strong style={styles.countdown}>{timeLabel}</strong>.
        </p>
        <p style={styles.subMessage}>
          ¿Deseas continuar trabajando?
        </p>
        <div style={styles.buttons}>
          <button
            onClick={logout}
            style={styles.btnSecondary}
            type="button"
          >
            Cerrar sesión
          </button>
          <button
            onClick={refreshSession}
            style={styles.btnPrimary}
            type="button"
            autoFocus
          >
            Continuar sesión
          </button>
        </div>
      </div>
    </div>
  )
}

const styles: Record<string, React.CSSProperties> = {
  overlay: {
    position: 'fixed',
    inset: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 9999,
    backdropFilter: 'blur(4px)',
  },
  modal: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: '2rem',
    maxWidth: 400,
    width: '90%',
    textAlign: 'center',
    boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
  },
  iconWrapper: {
    marginBottom: 12,
  },
  icon: {
    fontSize: 48,
  },
  title: {
    fontSize: 20,
    fontWeight: 700,
    color: '#1e293b',
    margin: '0 0 12px',
  },
  message: {
    fontSize: 15,
    color: '#475569',
    margin: '0 0 8px',
    lineHeight: 1.5,
  },
  subMessage: {
    fontSize: 14,
    color: '#64748b',
    margin: '0 0 24px',
  },
  countdown: {
    color: '#dc2626',
    fontWeight: 700,
    fontSize: 17,
  },
  buttons: {
    display: 'flex',
    gap: 12,
    justifyContent: 'center',
    flexWrap: 'wrap' as const,
  },
  btnPrimary: {
    backgroundColor: '#3b82f6',
    color: '#ffffff',
    border: 'none',
    borderRadius: 8,
    padding: '10px 24px',
    fontSize: 14,
    fontWeight: 600,
    cursor: 'pointer',
    flex: 1,
  },
  btnSecondary: {
    backgroundColor: '#f1f5f9',
    color: '#475569',
    border: '1px solid #e2e8f0',
    borderRadius: 8,
    padding: '10px 24px',
    fontSize: 14,
    fontWeight: 600,
    cursor: 'pointer',
    flex: 1,
  },
}

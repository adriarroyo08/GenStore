import { useState, useRef } from 'react'
import type { FormEvent } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { validateLoginForm } from '@/utils/validation'
import { evaluatePasswordStrength } from '@/utils/security'

interface LoginFormProps {
  onSuccess?: () => void
}

/**
 * Formulario de login con:
 * - Validación de campos
 * - Indicador de intentos restantes
 * - Feedback de bloqueo por rate limiting
 * - Opción "Recordarme"
 * - Accesibilidad (aria-*)
 */
export function LoginForm({ onSuccess }: LoginFormProps) {
  const { login, isLoading } = useAuth()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [recordarme, setRecordarme] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [serverError, setServerError] = useState('')
  const [successMessage, setSuccessMessage] = useState('')

  const emailRef = useRef<HTMLInputElement>(null)

  const remainingAttempts = 5
  const lockTimeMs: number | null = null
  const isLocked = false

  const passwordStrength = password.length > 0 ? evaluatePasswordStrength(password) : null

  const strengthColors = ['#dc2626', '#f97316', '#eab308', '#22c55e', '#16a34a']
  const strengthColor = passwordStrength ? strengthColors[passwordStrength.score] : '#e2e8f0'

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setServerError('')
    setSuccessMessage('')

    const validation = validateLoginForm({ email, password })
    if (!validation.isValid) {
      setErrors(validation.errors)
      return
    }

    setErrors({})

    try {
      await login({ email, password, recordarme })
      setSuccessMessage('¡Bienvenido! Iniciando sesión...')
      onSuccess?.()
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error al iniciar sesión'
      setServerError(message)
    }
  }

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        {/* Header */}
        <div style={styles.header}>
          <div style={styles.logo}>🛍️</div>
          <h1 style={styles.title}>GenStore</h1>
          <p style={styles.subtitle}>Tienda Online</p>
        </div>

        {/* Mensaje de bloqueo */}
        {isLocked && lockTimeMs !== null && (
          <div style={styles.alertError} role="alert">
            <strong>Cuenta temporalmente bloqueada.</strong>
            <br />
            Demasiados intentos fallidos. Intenta en{' '}
            {Math.ceil(lockTimeMs / 60000)} minuto(s).
          </div>
        )}

        {/* Error del servidor */}
        {serverError && !isLocked && (
          <div style={styles.alertError} role="alert">
            {serverError}
            {email && remainingAttempts < 5 && remainingAttempts > 0 && (
              <div style={styles.attemptsWarning}>
                Intentos restantes: <strong>{remainingAttempts}</strong>
              </div>
            )}
          </div>
        )}

        {/* Éxito */}
        {successMessage && (
          <div style={styles.alertSuccess} role="status">
            {successMessage}
          </div>
        )}

        <form onSubmit={handleSubmit} noValidate style={styles.form}>
          {/* Campo Email */}
          <div style={styles.fieldGroup}>
            <label htmlFor="email" style={styles.label}>
              Correo electrónico
            </label>
            <input
              ref={emailRef}
              id="email"
              type="email"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value)
                setErrors((prev) => ({ ...prev, email: '' }))
              }}
              style={{
                ...styles.input,
                ...(errors.email ? styles.inputError : {}),
              }}
              placeholder="usuario@ejemplo.com"
              autoComplete="email"
              autoFocus
              disabled={isLocked || isLoading}
              aria-required="true"
              aria-invalid={!!errors.email}
              aria-describedby={errors.email ? 'email-error' : undefined}
              maxLength={254}
            />
            {errors.email && (
              <span id="email-error" style={styles.fieldError} role="alert">
                {errors.email}
              </span>
            )}
          </div>

          {/* Campo Contraseña */}
          <div style={styles.fieldGroup}>
            <label htmlFor="password" style={styles.label}>
              Contraseña
            </label>
            <div style={styles.passwordWrapper}>
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value)
                  setErrors((prev) => ({ ...prev, password: '' }))
                }}
                style={{
                  ...styles.input,
                  ...styles.passwordInput,
                  ...(errors.password ? styles.inputError : {}),
                }}
                placeholder="Tu contraseña"
                autoComplete="current-password"
                disabled={isLocked || isLoading}
                aria-required="true"
                aria-invalid={!!errors.password}
                aria-describedby={errors.password ? 'password-error' : undefined}
                maxLength={128}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={styles.showPasswordBtn}
                aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                tabIndex={-1}
              >
                {showPassword ? '🙈' : '👁'}
              </button>
            </div>
            {errors.password && (
              <span id="password-error" style={styles.fieldError} role="alert">
                {errors.password}
              </span>
            )}

            {/* Indicador de fortaleza */}
            {passwordStrength && (
              <div style={styles.strengthContainer}>
                <div style={styles.strengthBars}>
                  {[0, 1, 2, 3, 4].map((i) => (
                    <div
                      key={i}
                      style={{
                        ...styles.strengthBar,
                        backgroundColor:
                          i <= passwordStrength.score ? strengthColor : '#e2e8f0',
                      }}
                    />
                  ))}
                </div>
                <span style={{ ...styles.strengthLabel, color: strengthColor }}>
                  {passwordStrength.label}
                </span>
              </div>
            )}
          </div>

          {/* Recordarme */}
          <div style={styles.checkboxGroup}>
            <input
              id="recordarme"
              type="checkbox"
              checked={recordarme}
              onChange={(e) => setRecordarme(e.target.checked)}
              disabled={isLocked || isLoading}
              style={styles.checkbox}
            />
            <label htmlFor="recordarme" style={styles.checkboxLabel}>
              Recordarme en este dispositivo
            </label>
          </div>

          {/* Botón de submit */}
          <button
            type="submit"
            disabled={isLocked || isLoading}
            style={{
              ...styles.submitBtn,
              ...(isLocked || isLoading ? styles.submitBtnDisabled : {}),
            }}
            aria-busy={isLoading}
          >
            {isLoading ? 'Verificando...' : 'Iniciar sesión'}
          </button>
        </form>

        {/* Info de demo */}
        <div style={styles.demoInfo}>
          <p style={styles.demoTitle}>Credenciales de demo:</p>
          <code style={styles.demoCode}>admin@genstore.com / Admin123!</code>
          <br />
          <code style={styles.demoCode}>user@genstore.com / User123!</code>
        </div>
      </div>
    </div>
  )
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f0f9ff',
    padding: '1rem',
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 'clamp(1.25rem, 5vw, 2.5rem)',
    width: '100%',
    maxWidth: 420,
    boxShadow: '0 10px 40px rgba(0,0,0,0.12)',
  },
  header: {
    textAlign: 'center',
    marginBottom: '1.5rem',
  },
  logo: {
    fontSize: 48,
    marginBottom: 8,
  },
  title: {
    fontSize: 28,
    fontWeight: 700,
    color: '#1e293b',
    margin: '0 0 4px',
  },
  subtitle: {
    fontSize: 14,
    color: '#64748b',
    margin: 0,
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '1rem',
  },
  fieldGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: 6,
  },
  label: {
    fontSize: 14,
    fontWeight: 600,
    color: '#374151',
  },
  input: {
    padding: '10px 14px',
    border: '1.5px solid #e2e8f0',
    borderRadius: 8,
    fontSize: 15,
    color: '#1e293b',
    outline: 'none',
    transition: 'border-color 0.2s',
    width: '100%',
    boxSizing: 'border-box',
  },
  inputError: {
    borderColor: '#dc2626',
  },
  passwordWrapper: {
    position: 'relative',
  },
  passwordInput: {
    paddingRight: 44,
  },
  showPasswordBtn: {
    position: 'absolute',
    right: 12,
    top: '50%',
    transform: 'translateY(-50%)',
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    fontSize: 18,
    padding: 0,
    lineHeight: 1,
  },
  fieldError: {
    fontSize: 12,
    color: '#dc2626',
    marginTop: 2,
  },
  strengthContainer: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    marginTop: 6,
  },
  strengthBars: {
    display: 'flex',
    gap: 4,
    flex: 1,
  },
  strengthBar: {
    height: 4,
    flex: 1,
    borderRadius: 2,
    transition: 'background-color 0.3s',
  },
  strengthLabel: {
    fontSize: 11,
    fontWeight: 600,
    whiteSpace: 'nowrap',
  },
  checkboxGroup: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
  },
  checkbox: {
    width: 16,
    height: 16,
    cursor: 'pointer',
  },
  checkboxLabel: {
    fontSize: 14,
    color: '#475569',
    cursor: 'pointer',
  },
  submitBtn: {
    backgroundColor: '#3b82f6',
    color: '#ffffff',
    border: 'none',
    borderRadius: 8,
    padding: '12px',
    fontSize: 15,
    fontWeight: 600,
    cursor: 'pointer',
    marginTop: 4,
    transition: 'background-color 0.2s',
  },
  submitBtnDisabled: {
    backgroundColor: '#93c5fd',
    cursor: 'not-allowed',
  },
  alertError: {
    backgroundColor: '#fef2f2',
    border: '1px solid #fecaca',
    borderRadius: 8,
    padding: '12px 14px',
    fontSize: 14,
    color: '#dc2626',
    marginBottom: '1rem',
    lineHeight: 1.5,
  },
  alertSuccess: {
    backgroundColor: '#f0fdf4',
    border: '1px solid #bbf7d0',
    borderRadius: 8,
    padding: '12px 14px',
    fontSize: 14,
    color: '#16a34a',
    marginBottom: '1rem',
  },
  attemptsWarning: {
    marginTop: 6,
    fontSize: 13,
    color: '#9b1c1c',
  },
  demoInfo: {
    marginTop: '1.5rem',
    padding: '12px',
    backgroundColor: '#f8fafc',
    borderRadius: 8,
    fontSize: 12,
    color: '#64748b',
    textAlign: 'center',
  },
  demoTitle: {
    margin: '0 0 6px',
    fontWeight: 600,
  },
  demoCode: {
    fontSize: 11,
    color: '#475569',
    fontFamily: 'monospace',
  },
}

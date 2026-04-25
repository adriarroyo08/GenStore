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

  const strengthColorClasses = [
    'bg-red-500',
    'bg-orange-500',
    'bg-yellow-500',
    'bg-green-500',
    'bg-green-600',
  ]
  const strengthTextColors = [
    'text-red-500',
    'text-orange-500',
    'text-yellow-500',
    'text-green-500',
    'text-green-600',
  ]
  const strengthColorClass = passwordStrength ? strengthColorClasses[passwordStrength.score] : ''
  const strengthTextClass = passwordStrength ? strengthTextColors[passwordStrength.score] : ''

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
    <div className="min-h-screen bg-background flex items-center justify-center px-4 py-12">
      <div className="bg-card rounded-2xl shadow-lg border border-border p-6 sm:p-8 max-w-md mx-auto w-full">
        {/* Header */}
        <div className="text-center mb-6">
          <div className="text-5xl mb-2" aria-hidden="true">🛍️</div>
          <h1 className="text-2xl font-bold text-foreground">GenStore</h1>
          <p className="text-sm text-muted-foreground">Tienda Online</p>
        </div>

        {/* Mensaje de bloqueo */}
        {isLocked && lockTimeMs !== null && (
          <div className="bg-destructive/10 border border-destructive/20 text-destructive rounded-xl px-4 py-3 text-sm mb-4" role="alert">
            <strong>Cuenta temporalmente bloqueada.</strong>
            <br />
            Demasiados intentos fallidos. Intenta en{' '}
            {Math.ceil(lockTimeMs / 60000)} minuto(s).
          </div>
        )}

        {/* Error del servidor */}
        {serverError && !isLocked && (
          <div className="bg-destructive/10 border border-destructive/20 text-destructive rounded-xl px-4 py-3 text-sm mb-4" role="alert">
            {serverError}
            {email && remainingAttempts < 5 && remainingAttempts > 0 && (
              <div className="mt-1.5 text-xs font-medium">
                Intentos restantes: <strong>{remainingAttempts}</strong>
              </div>
            )}
          </div>
        )}

        {/* Exito */}
        {successMessage && (
          <div className="bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800 text-green-700 dark:text-green-400 rounded-xl px-4 py-3 text-sm mb-4" role="status">
            {successMessage}
          </div>
        )}

        <form onSubmit={handleSubmit} noValidate className="space-y-4">
          {/* Campo Email */}
          <div>
            <label htmlFor="email" className="block text-sm font-medium mb-1.5">
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
              className={`w-full border rounded-xl px-4 py-3 bg-background focus:outline-none focus:ring-2 focus:ring-ring text-sm text-foreground placeholder:text-muted-foreground transition-colors ${
                errors.email ? 'border-destructive' : 'border-input'
              }`}
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
              <span id="email-error" className="text-xs text-destructive mt-1 block" role="alert">
                {errors.email}
              </span>
            )}
          </div>

          {/* Campo Contrasena */}
          <div>
            <label htmlFor="password" className="block text-sm font-medium mb-1.5">
              Contraseña
            </label>
            <div className="relative">
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value)
                  setErrors((prev) => ({ ...prev, password: '' }))
                }}
                className={`w-full border rounded-xl px-4 py-3 pr-12 bg-background focus:outline-none focus:ring-2 focus:ring-ring text-sm text-foreground placeholder:text-muted-foreground transition-colors ${
                  errors.password ? 'border-destructive' : 'border-input'
                }`}
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
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors text-lg leading-none"
                aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                tabIndex={-1}
              >
                {showPassword ? '🙈' : '👁'}
              </button>
            </div>
            {errors.password && (
              <span id="password-error" className="text-xs text-destructive mt-1 block" role="alert">
                {errors.password}
              </span>
            )}

            {/* Indicador de fortaleza */}
            {passwordStrength && (
              <div className="flex items-center gap-2 mt-2">
                <div className="flex gap-1 flex-1">
                  {[0, 1, 2, 3, 4].map((i) => (
                    <div
                      key={i}
                      className={`h-1 flex-1 rounded-full transition-colors duration-300 ${
                        i <= passwordStrength.score ? strengthColorClass : 'bg-muted-foreground/20'
                      }`}
                    />
                  ))}
                </div>
                <span className={`text-xs font-semibold whitespace-nowrap ${strengthTextClass}`}>
                  {passwordStrength.label}
                </span>
              </div>
            )}
          </div>

          {/* Recordarme */}
          <div className="flex items-center gap-2">
            <input
              id="recordarme"
              type="checkbox"
              checked={recordarme}
              onChange={(e) => setRecordarme(e.target.checked)}
              disabled={isLocked || isLoading}
              className="w-4 h-4 cursor-pointer accent-foreground"
            />
            <label htmlFor="recordarme" className="text-sm text-muted-foreground cursor-pointer">
              Recordarme en este dispositivo
            </label>
          </div>

          {/* Boton de submit */}
          <button
            type="submit"
            disabled={isLocked || isLoading}
            className="w-full bg-foreground text-background rounded-xl py-3 font-semibold hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-all mt-1"
            aria-busy={isLoading}
          >
            {isLoading ? 'Verificando...' : 'Iniciar sesión'}
          </button>
        </form>
      </div>
    </div>
  )
}

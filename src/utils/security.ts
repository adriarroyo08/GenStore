/**
 * Utilidades de seguridad para la aplicación GenStore.
 * Proporciona funciones para sanitización de inputs, validación y protección XSS.
 */

/**
 * Escapa caracteres HTML peligrosos para prevenir ataques XSS.
 */
export function escapeHtml(unsafe: string): string {
  return unsafe
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')
}

/**
 * Sanitiza un string eliminando caracteres potencialmente peligrosos.
 * Útil para inputs de usuario antes de procesarlos.
 */
export function sanitizeInput(input: string): string {
  return input.trim().replace(/[<>'"`;]/g, '')
}

/**
 * Valida el formato de un email.
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/
  return emailRegex.test(email) && email.length <= 254
}

/**
 * Evalúa la fortaleza de una contraseña.
 * Retorna un puntaje de 0-4 y una descripción.
 */
export interface PasswordStrength {
  score: 0 | 1 | 2 | 3 | 4
  label: 'Muy débil' | 'Débil' | 'Regular' | 'Fuerte' | 'Muy fuerte'
  suggestions: string[]
}

export function evaluatePasswordStrength(password: string): PasswordStrength {
  const suggestions: string[] = []
  let score = 0

  if (password.length >= 8) score++
  else suggestions.push('Usa al menos 8 caracteres')

  if (password.length >= 12) score++
  else suggestions.push('Usa 12 o más caracteres para mayor seguridad')

  if (/[a-z]/.test(password) && /[A-Z]/.test(password)) score++
  else suggestions.push('Combina letras mayúsculas y minúsculas')

  if (/[0-9]/.test(password)) score++
  else suggestions.push('Incluye al menos un número')

  if (/[^a-zA-Z0-9]/.test(password)) score++
  else suggestions.push('Incluye caracteres especiales (!@#$%^&*)')

  const clampedScore = Math.min(score, 4) as 0 | 1 | 2 | 3 | 4
  const labels: PasswordStrength['label'][] = [
    'Muy débil',
    'Débil',
    'Regular',
    'Fuerte',
    'Muy fuerte',
  ]

  return {
    score: clampedScore,
    label: labels[clampedScore],
    suggestions,
  }
}

/**
 * Genera un token CSRF aleatorio y seguro.
 */
export function generateCsrfToken(): string {
  const array = new Uint8Array(32)
  crypto.getRandomValues(array)
  return Array.from(array, (byte) => byte.toString(16).padStart(2, '0')).join('')
}

/**
 * Genera un ID único seguro.
 */
export function generateSecureId(): string {
  const array = new Uint8Array(16)
  crypto.getRandomValues(array)
  return Array.from(array, (byte) => byte.toString(16).padStart(2, '0')).join('')
}

/**
 * Compara dos strings de forma segura (tiempo constante) para prevenir timing attacks.
 */
export function secureCompare(a: string, b: string): boolean {
  if (a.length !== b.length) return false
  let result = 0
  for (let i = 0; i < a.length; i++) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i)
  }
  return result === 0
}

/**
 * Crea un hash simple del email para logging sin exponer datos sensibles.
 */
export async function hashForLogging(value: string): Promise<string> {
  const encoder = new TextEncoder()
  const data = encoder.encode(value)
  const hashBuffer = await crypto.subtle.digest('SHA-256', data)
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  return hashArray
    .slice(0, 8)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')
}

/**
 * Valida que una URL sea segura (no JavaScript: ni data: URIs maliciosas).
 */
export function isSafeUrl(url: string): boolean {
  try {
    const parsed = new URL(url, window.location.origin)
    return parsed.protocol === 'https:' || parsed.protocol === 'http:'
  } catch {
    return false
  }
}

/**
 * Limpia datos sensibles de un objeto antes de loggear.
 */
export function redactSensitiveData<T extends Record<string, unknown>>(
  obj: T,
  sensitiveKeys: string[] = ['password', 'token', 'secret', 'key']
): Record<string, unknown> {
  const result: Record<string, unknown> = {}
  for (const [key, value] of Object.entries(obj)) {
    if (sensitiveKeys.some((k) => key.toLowerCase().includes(k))) {
      result[key] = '[REDACTADO]'
    } else {
      result[key] = value
    }
  }
  return result
}

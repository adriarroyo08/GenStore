import { isValidEmail } from './security'

export interface ValidationResult {
  isValid: boolean
  errors: Record<string, string>
}

export interface LoginFormData {
  email: string
  password: string
}

/**
 * Valida el formulario de login.
 */
export function validateLoginForm(data: LoginFormData): ValidationResult {
  const errors: Record<string, string> = {}

  // Validar email
  if (!data.email) {
    errors.email = 'El email es obligatorio'
  } else if (!isValidEmail(data.email)) {
    errors.email = 'Ingresa un email válido'
  }

  // Validar contraseña
  if (!data.password) {
    errors.password = 'La contraseña es obligatoria'
  } else if (data.password.length < 8) {
    errors.password = 'La contraseña debe tener al menos 8 caracteres'
  } else if (data.password.length > 128) {
    errors.password = 'La contraseña es demasiado larga'
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  }
}

/**
 * Valida que un campo no esté vacío ni contenga solo espacios.
 */
export function isNotEmpty(value: string): boolean {
  return value.trim().length > 0
}

/**
 * Valida que un string tenga una longitud dentro del rango permitido.
 */
export function isValidLength(value: string, min: number, max: number): boolean {
  const len = value.trim().length
  return len >= min && len <= max
}

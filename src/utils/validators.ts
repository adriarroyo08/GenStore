export function validateEmail(email: string): boolean {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return re.test(email)
}

export function validatePhone(phone: string): boolean {
  // Accepts Spanish phone formats: 9 digits, optionally with +34 prefix
  const re = /^(\+34)?[6789]\d{8}$/
  return re.test(phone.replace(/\s/g, ''))
}

export function validateRequired(value: string): boolean {
  return value.trim().length > 0
}

export function validateMinLength(value: string, min: number): boolean {
  return value.trim().length >= min
}

export function validateMaxLength(value: string, max: number): boolean {
  return value.trim().length <= max
}

export function validateAge(fechaNacimiento: Date): boolean {
  const hoy = new Date()
  const edad = hoy.getFullYear() - fechaNacimiento.getFullYear()
  return edad >= 0 && edad <= 120
}

export function validatePositiveNumber(value: number): boolean {
  return !isNaN(value) && value > 0
}

export function validateDateNotInPast(date: Date): boolean {
  return date >= new Date()
}

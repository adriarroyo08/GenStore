import { useState, useCallback } from 'react'
import {
  validateEmail,
  validatePhone,
  validateRequired,
  validateMinLength,
  validateMaxLength,
  validatePositiveNumber,
  validateDateNotInPast,
} from '../utils/validators'

export type ValidationRule =
  | { type: 'required' }
  | { type: 'email' }
  | { type: 'phone' }
  | { type: 'minLength'; min: number }
  | { type: 'maxLength'; max: number }
  | { type: 'positiveNumber' }
  | { type: 'futureDate' }
  | { type: 'custom'; validator: (value: string) => boolean; message: string }

export type ValidationSchema = Record<string, ValidationRule[]>

export type FormErrors = Record<string, string | null>
export type FormValues = Record<string, string>

function applyRule(value: string, rule: ValidationRule): string | null {
  switch (rule.type) {
    case 'required':
      return validateRequired(value) ? null : 'Este campo es requerido'
    case 'email':
      return validateEmail(value) ? null : 'El email no es válido'
    case 'phone':
      return validatePhone(value) ? null : 'El teléfono no es válido'
    case 'minLength':
      return validateMinLength(value, rule.min) ? null : `Mínimo ${rule.min} caracteres`
    case 'maxLength':
      return validateMaxLength(value, rule.max) ? null : `Máximo ${rule.max} caracteres`
    case 'positiveNumber':
      return validatePositiveNumber(Number(value)) ? null : 'Debe ser un número positivo'
    case 'futureDate':
      return validateDateNotInPast(new Date(value)) ? null : 'La fecha no puede ser en el pasado'
    case 'custom':
      return rule.validator(value) ? null : rule.message
    default:
      return null
  }
}

function validateField(value: string, rules: ValidationRule[]): string | null {
  for (const rule of rules) {
    const error = applyRule(value, rule)
    if (error) return error
  }
  return null
}

export interface UseFormValidationReturn {
  values: FormValues
  errors: FormErrors
  isValid: boolean
  isDirty: boolean
  setValue: (field: string, value: string) => void
  setValues: (values: FormValues) => void
  validateAllFields: () => boolean
  validateSingleField: (field: string) => string | null
  resetForm: () => void
  resetErrors: () => void
}

export function useFormValidation(
  initialValues: FormValues,
  schema: ValidationSchema
): UseFormValidationReturn {
  const [values, setValuesState] = useState<FormValues>(initialValues)
  const [errors, setErrors] = useState<FormErrors>({})
  const [isDirty, setIsDirty] = useState(false)

  const isValid = Object.keys(schema).every(field => {
    const rules = schema[field] || []
    return validateField(values[field] ?? '', rules) === null
  })

  const setValue = useCallback((field: string, value: string) => {
    setValuesState(prev => ({ ...prev, [field]: value }))
    setIsDirty(true)
    setErrors(prev => {
      const rules = schema[field] || []
      const error = validateField(value, rules)
      return { ...prev, [field]: error }
    })
  }, [schema])

  const setValues = useCallback((newValues: FormValues) => {
    setValuesState(newValues)
    setIsDirty(true)
  }, [])

  const validateSingleField = useCallback((field: string): string | null => {
    const rules = schema[field] || []
    const error = validateField(values[field] ?? '', rules)
    setErrors(prev => ({ ...prev, [field]: error }))
    return error
  }, [schema, values])

  const validateAllFields = useCallback((): boolean => {
    const newErrors: FormErrors = {}
    let valid = true
    for (const field of Object.keys(schema)) {
      const rules = schema[field]
      const error = validateField(values[field] ?? '', rules)
      newErrors[field] = error
      if (error) valid = false
    }
    setErrors(newErrors)
    return valid
  }, [schema, values])

  const resetForm = useCallback(() => {
    setValuesState(initialValues)
    setErrors({})
    setIsDirty(false)
  }, [initialValues])

  const resetErrors = useCallback(() => {
    setErrors({})
  }, [])

  return {
    values,
    errors,
    isValid,
    isDirty,
    setValue,
    setValues,
    validateAllFields,
    validateSingleField,
    resetForm,
    resetErrors,
  }
}

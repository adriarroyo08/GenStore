import { describe, it, expect } from 'vitest'
import { validateLoginForm, isNotEmpty, isValidLength } from './validation'

describe('validateLoginForm', () => {
  it('returns valid for correct credentials', () => {
    const result = validateLoginForm({ email: 'user@example.com', password: 'SecurePass1' })
    expect(result.isValid).toBe(true)
    expect(result.errors).toEqual({})
  })

  it('requires email', () => {
    const result = validateLoginForm({ email: '', password: 'SecurePass1' })
    expect(result.isValid).toBe(false)
    expect(result.errors.email).toBeTruthy()
  })

  it('rejects invalid email format', () => {
    const result = validateLoginForm({ email: 'not-an-email', password: 'SecurePass1' })
    expect(result.isValid).toBe(false)
    expect(result.errors.email).toBeTruthy()
  })

  it('requires password', () => {
    const result = validateLoginForm({ email: 'user@example.com', password: '' })
    expect(result.isValid).toBe(false)
    expect(result.errors.password).toBeTruthy()
  })

  it('rejects password shorter than 8 characters', () => {
    const result = validateLoginForm({ email: 'user@example.com', password: 'short' })
    expect(result.isValid).toBe(false)
    expect(result.errors.password).toBeTruthy()
  })

  it('rejects password longer than 128 characters', () => {
    const longPassword = 'a'.repeat(129)
    const result = validateLoginForm({ email: 'user@example.com', password: longPassword })
    expect(result.isValid).toBe(false)
    expect(result.errors.password).toBeTruthy()
  })

  it('accepts password of exactly 8 characters', () => {
    const result = validateLoginForm({ email: 'user@example.com', password: 'Exact8Ch' })
    expect(result.isValid).toBe(true)
  })

  it('accepts password of exactly 128 characters', () => {
    const maxPassword = 'a'.repeat(128)
    const result = validateLoginForm({ email: 'user@example.com', password: maxPassword })
    expect(result.isValid).toBe(true)
  })

  it('returns multiple errors when both fields are invalid', () => {
    const result = validateLoginForm({ email: '', password: '' })
    expect(result.isValid).toBe(false)
    expect(result.errors.email).toBeTruthy()
    expect(result.errors.password).toBeTruthy()
  })
})

describe('isNotEmpty', () => {
  it('returns true for a non-empty string', () => {
    expect(isNotEmpty('hello')).toBe(true)
  })

  it('returns false for an empty string', () => {
    expect(isNotEmpty('')).toBe(false)
  })

  it('returns false for whitespace-only string', () => {
    expect(isNotEmpty('   ')).toBe(false)
  })

  it('returns true for a string with content and spaces', () => {
    expect(isNotEmpty('  hello  ')).toBe(true)
  })
})

describe('isValidLength', () => {
  it('returns true when length is within range', () => {
    expect(isValidLength('hello', 3, 10)).toBe(true)
  })

  it('returns true when length equals min', () => {
    expect(isValidLength('abc', 3, 10)).toBe(true)
  })

  it('returns true when length equals max', () => {
    expect(isValidLength('abcdefghij', 3, 10)).toBe(true)
  })

  it('returns false when length is below min', () => {
    expect(isValidLength('ab', 3, 10)).toBe(false)
  })

  it('returns false when length exceeds max', () => {
    expect(isValidLength('abcdefghijk', 3, 10)).toBe(false)
  })

  it('trims whitespace before checking length', () => {
    expect(isValidLength('  ab  ', 3, 10)).toBe(false)
  })
})

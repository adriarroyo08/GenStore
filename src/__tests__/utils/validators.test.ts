import { describe, it, expect } from 'vitest'
import {
  validateEmail,
  validatePhone,
  validateRequired,
  validateMinLength,
  validateMaxLength,
  validateAge,
  validatePositiveNumber,
  validateDateNotInPast,
} from '../../utils/validators'

describe('validators', () => {
  describe('validateEmail', () => {
    it('validates correct email formats', () => {
      expect(validateEmail('user@example.com')).toBe(true)
      expect(validateEmail('user.name@domain.co')).toBe(true)
      expect(validateEmail('user+tag@example.org')).toBe(true)
    })

    it('rejects invalid email formats', () => {
      expect(validateEmail('not-an-email')).toBe(false)
      expect(validateEmail('@example.com')).toBe(false)
      expect(validateEmail('user@')).toBe(false)
      expect(validateEmail('')).toBe(false)
    })
  })

  describe('validatePhone', () => {
    it('validates Spanish mobile numbers', () => {
      expect(validatePhone('612345678')).toBe(true)
      expect(validatePhone('698765432')).toBe(true)
      expect(validatePhone('712345678')).toBe(true)
    })

    it('validates with +34 prefix', () => {
      expect(validatePhone('+34612345678')).toBe(true)
    })

    it('rejects invalid phones', () => {
      expect(validatePhone('123456789')).toBe(false) // starts with 1
      expect(validatePhone('12345')).toBe(false) // too short
      expect(validatePhone('abc')).toBe(false) // not a number
    })
  })

  describe('validateRequired', () => {
    it('returns true for non-empty strings', () => {
      expect(validateRequired('hello')).toBe(true)
      expect(validateRequired('  hello  ')).toBe(true)
    })

    it('returns false for empty or whitespace strings', () => {
      expect(validateRequired('')).toBe(false)
      expect(validateRequired('   ')).toBe(false)
    })
  })

  describe('validateMinLength', () => {
    it('returns true when length meets minimum', () => {
      expect(validateMinLength('hello', 3)).toBe(true)
      expect(validateMinLength('hi', 2)).toBe(true)
    })

    it('returns false when length is below minimum', () => {
      expect(validateMinLength('hi', 5)).toBe(false)
      expect(validateMinLength('', 1)).toBe(false)
    })
  })

  describe('validateMaxLength', () => {
    it('returns true when length is within max', () => {
      expect(validateMaxLength('hello', 10)).toBe(true)
      expect(validateMaxLength('hello', 5)).toBe(true)
    })

    it('returns false when length exceeds max', () => {
      expect(validateMaxLength('hello world', 5)).toBe(false)
    })
  })

  describe('validateAge', () => {
    it('validates realistic ages', () => {
      const adultBirth = new Date()
      adultBirth.setFullYear(adultBirth.getFullYear() - 35)
      expect(validateAge(adultBirth)).toBe(true)
    })

    it('validates newborn', () => {
      expect(validateAge(new Date())).toBe(true)
    })

    it('rejects future birth date', () => {
      const future = new Date()
      future.setFullYear(future.getFullYear() + 1)
      expect(validateAge(future)).toBe(false)
    })
  })

  describe('validatePositiveNumber', () => {
    it('returns true for positive numbers', () => {
      expect(validatePositiveNumber(1)).toBe(true)
      expect(validatePositiveNumber(100)).toBe(true)
      expect(validatePositiveNumber(0.5)).toBe(true)
    })

    it('returns false for zero and negative numbers', () => {
      expect(validatePositiveNumber(0)).toBe(false)
      expect(validatePositiveNumber(-1)).toBe(false)
    })

    it('returns false for NaN', () => {
      expect(validatePositiveNumber(NaN)).toBe(false)
    })
  })

  describe('validateDateNotInPast', () => {
    it('returns true for future date', () => {
      const future = new Date()
      future.setDate(future.getDate() + 1)
      expect(validateDateNotInPast(future)).toBe(true)
    })

    it('returns false for past date', () => {
      const past = new Date('2020-01-01')
      expect(validateDateNotInPast(past)).toBe(false)
    })
  })
})

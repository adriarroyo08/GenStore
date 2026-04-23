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

describe('validators - edge cases y lógica de negocio', () => {
  describe('validateEmail - casos límite', () => {
    it('acepta email con subdominio', () => {
      expect(validateEmail('user@mail.example.com')).toBe(true)
    })

    it('acepta email con números en nombre de usuario', () => {
      expect(validateEmail('user123@example.com')).toBe(true)
    })

    it('rechaza email con espacios', () => {
      expect(validateEmail('user @example.com')).toBe(false)
    })

    it('rechaza email sin TLD', () => {
      expect(validateEmail('user@example')).toBe(false)
    })

    it('rechaza email con doble arroba', () => {
      expect(validateEmail('user@@example.com')).toBe(false)
    })
  })

  describe('validatePhone - formatos españoles', () => {
    it('acepta números de teléfono fijo (8xx)', () => {
      expect(validatePhone('812345678')).toBe(true)
    })

    it('acepta números de teléfono fijo (9xx)', () => {
      expect(validatePhone('912345678')).toBe(true)
    })

    it('acepta número con prefijo +34 y fijo', () => {
      expect(validatePhone('+34912345678')).toBe(true)
    })

    it('elimina espacios antes de validar', () => {
      expect(validatePhone('612 345 678')).toBe(true)
    })

    it('rechaza número con 8 dígitos (muy corto)', () => {
      expect(validatePhone('61234567')).toBe(false)
    })

    it('rechaza número con 10 dígitos (muy largo)', () => {
      expect(validatePhone('6123456789')).toBe(false)
    })

    it('rechaza número que empieza con 1', () => {
      expect(validatePhone('112345678')).toBe(false)
    })

    it('rechaza número que empieza con 0', () => {
      expect(validatePhone('012345678')).toBe(false)
    })
  })

  describe('validateRequired - casos límite', () => {
    it('acepta string con un solo carácter', () => {
      expect(validateRequired('a')).toBe(true)
    })

    it('rechaza string con solo tabulaciones', () => {
      expect(validateRequired('\t')).toBe(false)
    })

    it('rechaza string con solo saltos de línea', () => {
      expect(validateRequired('\n')).toBe(false)
    })
  })

  describe('validateMinLength - límites exactos', () => {
    it('acepta cuando longitud es exactamente igual al mínimo', () => {
      expect(validateMinLength('abc', 3)).toBe(true)
    })

    it('rechaza cuando longitud es menor en uno', () => {
      expect(validateMinLength('ab', 3)).toBe(false)
    })

    it('ignora espacios en los extremos al medir longitud', () => {
      // trim hace que '  a  ' tenga longitud 1
      expect(validateMinLength('  a  ', 1)).toBe(true)
      expect(validateMinLength('  a  ', 2)).toBe(false)
    })
  })

  describe('validateMaxLength - límites exactos', () => {
    it('acepta cuando longitud es exactamente igual al máximo', () => {
      expect(validateMaxLength('hello', 5)).toBe(true)
    })

    it('rechaza cuando longitud excede en uno', () => {
      expect(validateMaxLength('hello!', 5)).toBe(false)
    })

    it('acepta string vacío con cualquier máximo', () => {
      expect(validateMaxLength('', 0)).toBe(true)
      expect(validateMaxLength('', 100)).toBe(true)
    })
  })

  describe('validateAge - casos límite', () => {
    it('acepta exactamente 120 años', () => {
      const nacimiento = new Date()
      nacimiento.setFullYear(nacimiento.getFullYear() - 120)
      expect(validateAge(nacimiento)).toBe(true)
    })

    it('rechaza más de 120 años', () => {
      const nacimiento = new Date()
      nacimiento.setFullYear(nacimiento.getFullYear() - 121)
      expect(validateAge(nacimiento)).toBe(false)
    })

    it('acepta nacido exactamente hoy (0 años)', () => {
      expect(validateAge(new Date())).toBe(true)
    })

    it('acepta adulto mayor de 90 años', () => {
      const nacimiento = new Date()
      nacimiento.setFullYear(nacimiento.getFullYear() - 90)
      expect(validateAge(nacimiento)).toBe(true)
    })
  })

  describe('validatePositiveNumber - casos límite', () => {
    it('acepta el número más pequeño positivo', () => {
      expect(validatePositiveNumber(Number.MIN_VALUE)).toBe(true)
    })

    it('rechaza exactamente cero', () => {
      expect(validatePositiveNumber(0)).toBe(false)
    })

    it('rechaza Infinity negativo', () => {
      expect(validatePositiveNumber(-Infinity)).toBe(false)
    })

    it('acepta precio típico de sesión', () => {
      expect(validatePositiveNumber(45)).toBe(true)
      expect(validatePositiveNumber(60.5)).toBe(true)
    })
  })

  describe('validateDateNotInPast - casos límite', () => {
    it('acepta fecha en un año futuro', () => {
      const futuro = new Date()
      futuro.setFullYear(futuro.getFullYear() + 1)
      expect(validateDateNotInPast(futuro)).toBe(true)
    })

    it('rechaza fecha de ayer', () => {
      const ayer = new Date()
      ayer.setDate(ayer.getDate() - 1)
      expect(validateDateNotInPast(ayer)).toBe(false)
    })

    it('rechaza fecha de hace 5 años', () => {
      const hace5 = new Date()
      hace5.setFullYear(hace5.getFullYear() - 5)
      expect(validateDateNotInPast(hace5)).toBe(false)
    })

    it('acepta fecha de mañana', () => {
      const manana = new Date()
      manana.setDate(manana.getDate() + 1)
      expect(validateDateNotInPast(manana)).toBe(true)
    })
  })
})

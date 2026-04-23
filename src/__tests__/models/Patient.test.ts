import { describe, it, expect } from 'vitest'
import { calcularEdad, getNombreCompleto, Patient } from '../../models/Patient'

describe('Patient model', () => {
  const mockPatient: Patient = {
    id: '1',
    nombre: 'Juan',
    apellidos: 'García López',
    email: 'juan@example.com',
    telefono: '612345678',
    fechaNacimiento: new Date('1990-05-15'),
    genero: 'masculino',
    fechaRegistro: new Date(),
    activo: true,
  }

  describe('getNombreCompleto', () => {
    it('returns full name combining nombre and apellidos', () => {
      expect(getNombreCompleto(mockPatient)).toBe('Juan García López')
    })

    it('handles single word apellidos', () => {
      const patient = { ...mockPatient, apellidos: 'García' }
      expect(getNombreCompleto(patient)).toBe('Juan García')
    })
  })

  describe('calcularEdad', () => {
    it('calculates correct age', () => {
      const birthDate = new Date()
      birthDate.setFullYear(birthDate.getFullYear() - 30)
      expect(calcularEdad(birthDate)).toBe(30)
    })

    it('accounts for birthday not yet reached this year', () => {
      const today = new Date()
      // birthday is tomorrow
      const birthDate = new Date(today)
      birthDate.setFullYear(today.getFullYear() - 25)
      birthDate.setDate(today.getDate() + 1)
      expect(calcularEdad(birthDate)).toBe(24)
    })

    it('returns 0 for newborn', () => {
      expect(calcularEdad(new Date())).toBe(0)
    })
  })
})

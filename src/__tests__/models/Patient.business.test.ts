import { describe, it, expect } from 'vitest'
import { calcularEdad, getNombreCompleto, Patient } from '../../models/Patient'

describe('Patient model - lógica de negocio', () => {
  const basePatient: Patient = {
    id: 'p1',
    nombre: 'Ana',
    apellidos: 'García López',
    email: 'ana@example.com',
    telefono: '612345678',
    fechaNacimiento: new Date('1990-01-01'),
    genero: 'femenino',
    fechaRegistro: new Date(),
    activo: true,
  }

  describe('calcularEdad - casos de límite', () => {
    it('calcula correctamente cuando el cumpleaños fue ayer', () => {
      const today = new Date()
      const yesterday = new Date(today)
      yesterday.setDate(today.getDate() - 1)
      const birthDate = new Date(yesterday)
      birthDate.setFullYear(today.getFullYear() - 30)
      // cumpleaños fue ayer: ya tiene 30 años
      expect(calcularEdad(birthDate)).toBe(30)
    })

    it('calcula correctamente cuando el cumpleaños es hoy', () => {
      const today = new Date()
      const birthDate = new Date(today)
      birthDate.setFullYear(today.getFullYear() - 40)
      // cumpleaños es hoy: tiene exactamente 40 años
      expect(calcularEdad(birthDate)).toBe(40)
    })

    it('retorna número entero (no fracciones)', () => {
      const birthDate = new Date()
      birthDate.setFullYear(birthDate.getFullYear() - 25)
      const result = calcularEdad(birthDate)
      expect(Number.isInteger(result)).toBe(true)
    })

    it('calcula correctamente para persona anciana de 80 años', () => {
      const birthDate = new Date()
      birthDate.setFullYear(birthDate.getFullYear() - 80)
      expect(calcularEdad(birthDate)).toBe(80)
    })

    it('calcula 1 año justo después del primer cumpleaños', () => {
      const today = new Date()
      const birthDate = new Date(today)
      birthDate.setDate(today.getDate() - 1) // ayer
      birthDate.setFullYear(today.getFullYear() - 1) // hace 1 año menos 1 día
      expect(calcularEdad(birthDate)).toBe(1)
    })
  })

  describe('getNombreCompleto - combinaciones', () => {
    it('combina nombre y apellidos con un espacio', () => {
      const result = getNombreCompleto(basePatient)
      expect(result).toBe('Ana García López')
      expect(result.split(' ').length).toBeGreaterThanOrEqual(2)
    })

    it('respeta acentos y caracteres especiales', () => {
      const patient = { ...basePatient, nombre: 'María José', apellidos: 'Martínez Pérez' }
      expect(getNombreCompleto(patient)).toBe('María José Martínez Pérez')
    })

    it('el resultado empieza con el nombre', () => {
      const result = getNombreCompleto(basePatient)
      expect(result.startsWith('Ana')).toBe(true)
    })

    it('el resultado termina con el último apellido', () => {
      const result = getNombreCompleto(basePatient)
      expect(result.endsWith('López')).toBe(true)
    })
  })

  describe('Patient interface - campos opcionales', () => {
    it('permite crear paciente sin diagnóstico', () => {
      const patient: Patient = { ...basePatient }
      expect(patient.diagnostico).toBeUndefined()
    })

    it('permite crear paciente con diagnóstico y historial médico', () => {
      const patient: Patient = {
        ...basePatient,
        diagnostico: 'Lumbalgia crónica',
        historialMedico: 'Sin alergias conocidas',
      }
      expect(patient.diagnostico).toBe('Lumbalgia crónica')
      expect(patient.historialMedico).toBe('Sin alergias conocidas')
    })

    it('paciente activo por defecto tiene activo=true', () => {
      expect(basePatient.activo).toBe(true)
    })

    it('paciente acepta todos los géneros', () => {
      const masculino: Patient = { ...basePatient, genero: 'masculino' }
      const femenino: Patient = { ...basePatient, genero: 'femenino' }
      const otro: Patient = { ...basePatient, genero: 'otro' }
      expect(masculino.genero).toBe('masculino')
      expect(femenino.genero).toBe('femenino')
      expect(otro.genero).toBe('otro')
    })
  })
})

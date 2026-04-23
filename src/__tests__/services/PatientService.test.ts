import { describe, it, expect, beforeEach } from 'vitest'
import { PatientService } from '../../services/PatientService'
import { CreatePatientDTO } from '../../models/Patient'

describe('PatientService', () => {
  let service: PatientService
  let validPatientDTO: CreatePatientDTO

  beforeEach(() => {
    service = new PatientService()
    validPatientDTO = {
      nombre: 'María',
      apellidos: 'Martínez Ruiz',
      email: 'maria@example.com',
      telefono: '612345678',
      fechaNacimiento: new Date('1985-03-20'),
      genero: 'femenino',
    }
  })

  describe('createPatient', () => {
    it('creates a patient with valid data', () => {
      const patient = service.createPatient(validPatientDTO)
      expect(patient.id).toBeDefined()
      expect(patient.nombre).toBe('María')
      expect(patient.apellidos).toBe('Martínez Ruiz')
      expect(patient.email).toBe('maria@example.com')
      expect(patient.activo).toBe(true)
      expect(patient.fechaRegistro).toBeInstanceOf(Date)
    })

    it('throws error when nombre is empty', () => {
      expect(() => service.createPatient({ ...validPatientDTO, nombre: '' }))
        .toThrow('El nombre es requerido')
    })

    it('throws error when apellidos is empty', () => {
      expect(() => service.createPatient({ ...validPatientDTO, apellidos: '' }))
        .toThrow('Los apellidos son requeridos')
    })

    it('throws error with invalid email', () => {
      expect(() => service.createPatient({ ...validPatientDTO, email: 'invalid-email' }))
        .toThrow('El email no es válido')
    })

    it('throws error with invalid phone', () => {
      expect(() => service.createPatient({ ...validPatientDTO, telefono: '123' }))
        .toThrow('El teléfono no es válido')
    })

    it('assigns unique ids to each patient', () => {
      const patient1 = service.createPatient(validPatientDTO)
      const patient2 = service.createPatient({ ...validPatientDTO, email: 'other@example.com' })
      expect(patient1.id).not.toBe(patient2.id)
    })
  })

  describe('getPatient', () => {
    it('returns patient by id', () => {
      const created = service.createPatient(validPatientDTO)
      const found = service.getPatient(created.id)
      expect(found).toEqual(created)
    })

    it('returns undefined for non-existent id', () => {
      expect(service.getPatient('non-existent')).toBeUndefined()
    })
  })

  describe('getAllPatients', () => {
    it('returns empty array when no patients', () => {
      expect(service.getAllPatients()).toEqual([])
    })

    it('returns all created patients', () => {
      service.createPatient(validPatientDTO)
      service.createPatient({ ...validPatientDTO, email: 'other@example.com' })
      expect(service.getAllPatients()).toHaveLength(2)
    })
  })

  describe('getActivePatients', () => {
    it('returns only active patients', () => {
      const patient1 = service.createPatient(validPatientDTO)
      const patient2 = service.createPatient({ ...validPatientDTO, email: 'other@example.com' })
      service.deactivatePatient(patient1.id)
      const active = service.getActivePatients()
      expect(active).toHaveLength(1)
      expect(active[0].id).toBe(patient2.id)
    })
  })

  describe('updatePatient', () => {
    it('updates patient fields', () => {
      const patient = service.createPatient(validPatientDTO)
      const updated = service.updatePatient(patient.id, { nombre: 'Ana' })
      expect(updated.nombre).toBe('Ana')
      expect(updated.apellidos).toBe(validPatientDTO.apellidos)
    })

    it('throws error for non-existent patient', () => {
      expect(() => service.updatePatient('non-existent', { nombre: 'Test' }))
        .toThrow('no encontrado')
    })

    it('throws error with invalid email update', () => {
      const patient = service.createPatient(validPatientDTO)
      expect(() => service.updatePatient(patient.id, { email: 'bad-email' }))
        .toThrow('El email no es válido')
    })
  })

  describe('deactivatePatient', () => {
    it('sets patient as inactive', () => {
      const patient = service.createPatient(validPatientDTO)
      const deactivated = service.deactivatePatient(patient.id)
      expect(deactivated.activo).toBe(false)
    })

    it('throws error for non-existent patient', () => {
      expect(() => service.deactivatePatient('non-existent'))
        .toThrow('no encontrado')
    })
  })

  describe('searchPatients', () => {
    beforeEach(() => {
      service.createPatient(validPatientDTO)
      service.createPatient({
        nombre: 'Carlos',
        apellidos: 'Fernández',
        email: 'carlos@example.com',
        telefono: '698765432',
        fechaNacimiento: new Date('1992-07-10'),
        genero: 'masculino',
      })
    })

    it('finds patients by name', () => {
      const results = service.searchPatients('María')
      expect(results).toHaveLength(1)
      expect(results[0].nombre).toBe('María')
    })

    it('finds patients by email', () => {
      const results = service.searchPatients('carlos@example.com')
      expect(results).toHaveLength(1)
      expect(results[0].nombre).toBe('Carlos')
    })

    it('is case insensitive', () => {
      const results = service.searchPatients('maría')
      expect(results).toHaveLength(1)
    })

    it('returns empty array when no match', () => {
      const results = service.searchPatients('xyz-not-found')
      expect(results).toHaveLength(0)
    })
  })
})

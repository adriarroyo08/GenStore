import { describe, it, expect, beforeEach } from 'vitest'
import { PatientService } from '../../services/PatientService'
import { CreatePatientDTO } from '../../models/Patient'

describe('PatientService - lógica de negocio extendida', () => {
  let service: PatientService
  let validDTO: CreatePatientDTO

  beforeEach(() => {
    service = new PatientService()
    validDTO = {
      nombre: 'Carlos',
      apellidos: 'Sánchez Martín',
      email: 'carlos@example.com',
      telefono: '612345678',
      fechaNacimiento: new Date('1980-06-20'),
      genero: 'masculino',
    }
  })

  describe('createPatient - campos opcionales y datos completos', () => {
    it('crea paciente con diagnóstico opcional', () => {
      const patient = service.createPatient({
        ...validDTO,
        diagnostico: 'Contractura cervical',
      })
      expect(patient.diagnostico).toBe('Contractura cervical')
    })

    it('crea paciente con historial médico', () => {
      const patient = service.createPatient({
        ...validDTO,
        historialMedico: 'Sin alergias. Hipertensión controlada.',
      })
      expect(patient.historialMedico).toBe('Sin alergias. Hipertensión controlada.')
    })

    it('establece fechaRegistro con la fecha actual', () => {
      const before = new Date()
      const patient = service.createPatient(validDTO)
      const after = new Date()
      expect(patient.fechaRegistro.getTime()).toBeGreaterThanOrEqual(before.getTime())
      expect(patient.fechaRegistro.getTime()).toBeLessThanOrEqual(after.getTime())
    })

    it('lanza error cuando nombre tiene solo espacios', () => {
      expect(() => service.createPatient({ ...validDTO, nombre: '   ' }))
        .toThrow('El nombre es requerido')
    })

    it('lanza error cuando apellidos tienen solo espacios', () => {
      expect(() => service.createPatient({ ...validDTO, apellidos: '   ' }))
        .toThrow('Los apellidos son requeridos')
    })

    it('crea paciente con teléfono fijo español', () => {
      const patient = service.createPatient({ ...validDTO, telefono: '912345678' })
      expect(patient.telefono).toBe('912345678')
    })

    it('crea paciente con teléfono con prefijo +34', () => {
      const patient = service.createPatient({ ...validDTO, telefono: '+34612345678' })
      expect(patient.telefono).toBe('+34612345678')
    })

    it('lanza error con teléfono inválido', () => {
      expect(() => service.createPatient({ ...validDTO, telefono: '123456' }))
        .toThrow('El teléfono no es válido')
    })

    it('el id generado tiene el prefijo correcto', () => {
      const patient = service.createPatient(validDTO)
      expect(patient.id).toMatch(/^patient_/)
    })
  })

  describe('updatePatient - validaciones en actualización', () => {
    it('actualiza solo el campo nombre', () => {
      const patient = service.createPatient(validDTO)
      const updated = service.updatePatient(patient.id, { nombre: 'Pedro' })
      expect(updated.nombre).toBe('Pedro')
      expect(updated.email).toBe(validDTO.email) // no cambia
    })

    it('actualiza teléfono con valor válido', () => {
      const patient = service.createPatient(validDTO)
      const updated = service.updatePatient(patient.id, { telefono: '698765432' })
      expect(updated.telefono).toBe('698765432')
    })

    it('lanza error al actualizar con teléfono inválido', () => {
      const patient = service.createPatient(validDTO)
      expect(() => service.updatePatient(patient.id, { telefono: '123' }))
        .toThrow('El teléfono no es válido')
    })

    it('actualiza diagnóstico', () => {
      const patient = service.createPatient(validDTO)
      const updated = service.updatePatient(patient.id, { diagnostico: 'Escoliosis leve' })
      expect(updated.diagnostico).toBe('Escoliosis leve')
    })

    it('preserva el id después de la actualización', () => {
      const patient = service.createPatient(validDTO)
      const updated = service.updatePatient(patient.id, { nombre: 'Nuevo nombre' })
      expect(updated.id).toBe(patient.id)
    })

    it('preserva fechaRegistro después de la actualización', () => {
      const patient = service.createPatient(validDTO)
      const updated = service.updatePatient(patient.id, { nombre: 'Otro nombre' })
      expect(updated.fechaRegistro.getTime()).toBe(patient.fechaRegistro.getTime())
    })
  })

  describe('searchPatients - búsqueda por teléfono', () => {
    it('encuentra paciente por número de teléfono exacto', () => {
      service.createPatient(validDTO)
      const results = service.searchPatients('612345678')
      expect(results).toHaveLength(1)
      expect(results[0].telefono).toBe('612345678')
    })

    it('encuentra paciente por parte del apellido', () => {
      service.createPatient(validDTO)
      const results = service.searchPatients('Sánchez')
      expect(results).toHaveLength(1)
    })

    it('la búsqueda por email es insensible a mayúsculas', () => {
      service.createPatient(validDTO)
      const results = service.searchPatients('CARLOS@EXAMPLE.COM')
      expect(results).toHaveLength(1)
    })

    it('retorna todos los pacientes cuando el query coincide con varios', () => {
      service.createPatient(validDTO)
      service.createPatient({
        ...validDTO,
        email: 'carlos2@example.com',
        telefono: '698765432',
      })
      // Ambos tienen "Carlos" en el nombre
      const results = service.searchPatients('Carlos')
      expect(results).toHaveLength(2)
    })

    it('búsqueda vacía retorna todos los pacientes', () => {
      service.createPatient(validDTO)
      service.createPatient({ ...validDTO, email: 'otro@example.com', telefono: '698765432' })
      // empty string matches everything via includes
      const results = service.searchPatients('')
      expect(results).toHaveLength(2)
    })
  })

  describe('deactivatePatient - comportamiento', () => {
    it('el paciente inactivado no aparece en getActivePatients', () => {
      const patient = service.createPatient(validDTO)
      service.deactivatePatient(patient.id)
      const actives = service.getActivePatients()
      expect(actives.find(p => p.id === patient.id)).toBeUndefined()
    })

    it('el paciente inactivado sigue en getAllPatients', () => {
      const patient = service.createPatient(validDTO)
      service.deactivatePatient(patient.id)
      const all = service.getAllPatients()
      expect(all.find(p => p.id === patient.id)).toBeDefined()
    })

    it('deactivatePatient dos veces no lanza error', () => {
      const patient = service.createPatient(validDTO)
      service.deactivatePatient(patient.id)
      const result = service.deactivatePatient(patient.id)
      expect(result.activo).toBe(false)
    })
  })

  describe('getActivePatients - escenarios múltiples', () => {
    it('retorna array vacío cuando no hay pacientes', () => {
      expect(service.getActivePatients()).toEqual([])
    })

    it('retorna todos cuando todos están activos', () => {
      service.createPatient(validDTO)
      service.createPatient({ ...validDTO, email: 'otro@example.com', telefono: '698765432' })
      expect(service.getActivePatients()).toHaveLength(2)
    })

    it('retorna array vacío cuando todos están inactivos', () => {
      const p1 = service.createPatient(validDTO)
      const p2 = service.createPatient({ ...validDTO, email: 'otro@example.com', telefono: '698765432' })
      service.deactivatePatient(p1.id)
      service.deactivatePatient(p2.id)
      expect(service.getActivePatients()).toHaveLength(0)
    })
  })
})

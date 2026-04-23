import { describe, it, expect, beforeEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { PatientService } from '../../services/PatientService'
import { CreatePatientDTO } from '../../models/Patient'
import { usePatients } from '../../hooks/usePatients'

const validDTO: CreatePatientDTO = {
  nombre: 'María',
  apellidos: 'González López',
  email: 'maria@example.com',
  telefono: '612345678',
  fechaNacimiento: new Date('1985-03-20'),
  genero: 'femenino',
}

describe('usePatients', () => {
  let service: PatientService

  beforeEach(() => {
    service = new PatientService()
  })

  describe('estado inicial', () => {
    it('inicia con array de pacientes vacío', () => {
      const { result } = renderHook(() => usePatients(service))
      expect(result.current.patients).toEqual([])
    })

    it('inicia con loading en false', () => {
      const { result } = renderHook(() => usePatients(service))
      expect(result.current.loading).toBe(false)
    })

    it('inicia con error en null', () => {
      const { result } = renderHook(() => usePatients(service))
      expect(result.current.error).toBeNull()
    })
  })

  describe('createPatient', () => {
    it('crea un paciente y actualiza la lista', () => {
      const { result } = renderHook(() => usePatients(service))

      let patient: any
      act(() => {
        patient = result.current.createPatient(validDTO)
      })

      expect(patient).toBeDefined()
      expect(patient.nombre).toBe('María')
      expect(result.current.patients).toHaveLength(1)
    })

    it('establece error cuando la creación falla por nombre vacío', () => {
      const { result } = renderHook(() => usePatients(service))

      act(() => {
        expect(() => result.current.createPatient({ ...validDTO, nombre: '' })).toThrow('El nombre es requerido')
      })

      expect(result.current.error).toBe('El nombre es requerido')
    })

    it('establece error cuando el email es inválido', () => {
      const { result } = renderHook(() => usePatients(service))

      act(() => {
        expect(() => result.current.createPatient({ ...validDTO, email: 'no-es-email' })).toThrow()
      })

      expect(result.current.error).toBe('El email no es válido')
    })

    it('loading vuelve a false después de crear', () => {
      const { result } = renderHook(() => usePatients(service))

      act(() => {
        result.current.createPatient(validDTO)
      })

      expect(result.current.loading).toBe(false)
    })

    it('loading vuelve a false aunque falle la creación', () => {
      const { result } = renderHook(() => usePatients(service))

      act(() => {
        expect(() => result.current.createPatient({ ...validDTO, nombre: '' })).toThrow()
      })

      expect(result.current.loading).toBe(false)
    })

    it('múltiples pacientes se agregan correctamente', () => {
      const { result } = renderHook(() => usePatients(service))

      act(() => {
        result.current.createPatient(validDTO)
      })
      act(() => {
        result.current.createPatient({ ...validDTO, email: 'otro@example.com' })
      })

      expect(result.current.patients).toHaveLength(2)
    })

    it('el paciente creado tiene activo=true y fechaRegistro', () => {
      const { result } = renderHook(() => usePatients(service))

      let patient: any
      act(() => {
        patient = result.current.createPatient(validDTO)
      })

      expect(patient.activo).toBe(true)
      expect(patient.fechaRegistro).toBeInstanceOf(Date)
    })
  })

  describe('updatePatient', () => {
    it('actualiza un paciente existente', () => {
      const { result } = renderHook(() => usePatients(service))

      let patient: any
      act(() => {
        patient = result.current.createPatient(validDTO)
      })

      let updated: any
      act(() => {
        updated = result.current.updatePatient(patient.id, { nombre: 'Carmen' })
      })

      expect(updated.nombre).toBe('Carmen')
    })

    it('preserva los campos no actualizados', () => {
      const { result } = renderHook(() => usePatients(service))

      let patient: any
      act(() => {
        patient = result.current.createPatient(validDTO)
      })

      let updated: any
      act(() => {
        updated = result.current.updatePatient(patient.id, { nombre: 'Carmen' })
      })

      expect(updated.email).toBe(validDTO.email)
      expect(updated.id).toBe(patient.id)
    })

    it('establece error cuando se actualiza id inexistente', () => {
      const { result } = renderHook(() => usePatients(service))

      act(() => {
        expect(() => result.current.updatePatient('id-inexistente', { nombre: 'Test' })).toThrow()
      })

      expect(result.current.error).not.toBeNull()
    })

    it('establece error al actualizar con email inválido', () => {
      const { result } = renderHook(() => usePatients(service))

      let patient: any
      act(() => {
        patient = result.current.createPatient(validDTO)
      })

      act(() => {
        expect(() => result.current.updatePatient(patient.id, { email: 'bad-email' })).toThrow()
      })

      expect(result.current.error).toBe('El email no es válido')
    })
  })

  describe('deactivatePatient', () => {
    it('desactiva un paciente existente', () => {
      const { result } = renderHook(() => usePatients(service))

      let patient: any
      act(() => {
        patient = result.current.createPatient(validDTO)
      })

      let deactivated: any
      act(() => {
        deactivated = result.current.deactivatePatient(patient.id)
      })

      expect(deactivated.activo).toBe(false)
    })

    it('el paciente desactivado sale de la lista activa', () => {
      const { result } = renderHook(() => usePatients(service))

      let patient: any
      act(() => {
        patient = result.current.createPatient(validDTO)
      })

      act(() => {
        result.current.deactivatePatient(patient.id)
      })

      let active: any[]
      act(() => {
        active = result.current.getActivePatients()
      })

      expect(active!).toHaveLength(0)
    })

    it('establece error al desactivar id inexistente', () => {
      const { result } = renderHook(() => usePatients(service))

      act(() => {
        expect(() => result.current.deactivatePatient('no-existe')).toThrow()
      })

      expect(result.current.error).not.toBeNull()
    })
  })

  describe('searchPatients', () => {
    it('busca pacientes por nombre', () => {
      const { result } = renderHook(() => usePatients(service))

      act(() => {
        result.current.createPatient(validDTO)
      })
      act(() => {
        result.current.createPatient({ ...validDTO, nombre: 'Carlos', email: 'carlos@example.com' })
      })

      let found: any[]
      act(() => {
        found = result.current.searchPatients('María')
      })

      expect(found!).toHaveLength(1)
      expect(found![0].nombre).toBe('María')
    })

    it('busca pacientes por email', () => {
      const { result } = renderHook(() => usePatients(service))

      act(() => {
        result.current.createPatient(validDTO)
      })

      let found: any[]
      act(() => {
        found = result.current.searchPatients('maria@example.com')
      })

      expect(found!).toHaveLength(1)
    })

    it('retorna array vacío cuando no hay coincidencias', () => {
      const { result } = renderHook(() => usePatients(service))

      act(() => {
        result.current.createPatient(validDTO)
      })

      let found: any[]
      act(() => {
        found = result.current.searchPatients('zzz-no-existe')
      })

      expect(found!).toHaveLength(0)
    })
  })

  describe('getActivePatients', () => {
    it('retorna solo pacientes activos', () => {
      const { result } = renderHook(() => usePatients(service))

      let p1: any, p2: any
      act(() => {
        p1 = result.current.createPatient(validDTO)
      })
      act(() => {
        p2 = result.current.createPatient({ ...validDTO, email: 'otro@example.com' })
      })

      act(() => {
        result.current.deactivatePatient(p1.id)
      })

      let active: any[]
      act(() => {
        active = result.current.getActivePatients()
      })

      expect(active!).toHaveLength(1)
      expect(active![0].id).toBe(p2.id)
    })

    it('retorna todos cuando todos están activos', () => {
      const { result } = renderHook(() => usePatients(service))

      act(() => {
        result.current.createPatient(validDTO)
        result.current.createPatient({ ...validDTO, email: 'otro@example.com' })
      })

      let active: any[]
      act(() => {
        active = result.current.getActivePatients()
      })

      expect(active!).toHaveLength(2)
    })
  })

  describe('clearError', () => {
    it('limpia el error existente', () => {
      const { result } = renderHook(() => usePatients(service))

      act(() => {
        expect(() => result.current.createPatient({ ...validDTO, nombre: '' })).toThrow()
      })

      expect(result.current.error).not.toBeNull()

      act(() => {
        result.current.clearError()
      })

      expect(result.current.error).toBeNull()
    })
  })

  describe('refreshPatients', () => {
    it('refresca la lista de pacientes después de crear', () => {
      const { result } = renderHook(() => usePatients(service))

      act(() => {
        result.current.createPatient(validDTO)
      })

      act(() => {
        result.current.refreshPatients()
      })

      expect(result.current.patients).toHaveLength(1)
    })

    it('refleja cambios externos al servicio', () => {
      const { result } = renderHook(() => usePatients(service))

      // Create directly on the service (bypassing the hook)
      service.createPatient(validDTO)

      act(() => {
        result.current.refreshPatients()
      })

      expect(result.current.patients).toHaveLength(1)
    })
  })
})

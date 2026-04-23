import { describe, it, expect, beforeEach, vi } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { CreateAppointmentDTO, AppointmentStatus } from '../../models/Appointment'

vi.mock('../../services/AppointmentService', () => {
  const AppointmentServiceMock = vi.fn().mockImplementation(() => {
    const store = new Map()
    let counter = 0
    const generateId = () => `appointment_${++counter}`

    return {
      createAppointment: vi.fn((dto: CreateAppointmentDTO) => {
        if (!dto.pacienteId) throw new Error('El ID del paciente es requerido')
        if (dto.duracionMinutos <= 0) throw new Error('La duración debe ser mayor a 0 minutos')
        if (dto.fecha < new Date()) throw new Error('La fecha de la cita no puede ser en el pasado')
        const appt = { id: generateId(), ...dto, estado: 'programada', pagado: false }
        store.set(appt.id, appt)
        return appt
      }),
      cancelAppointment: vi.fn((id: string) => {
        const appt = store.get(id)
        if (!appt) throw new Error(`Cita con id ${id} no encontrada`)
        const updated = { ...appt, estado: 'cancelada' }
        store.set(id, updated)
        return updated
      }),
      updateStatus: vi.fn((id: string, estado: AppointmentStatus) => {
        const appt = store.get(id)
        if (!appt) throw new Error(`Cita con id ${id} no encontrada`)
        const updated = { ...appt, estado }
        store.set(id, updated)
        return updated
      }),
      markAsPaid: vi.fn((id: string) => {
        const appt = store.get(id)
        if (!appt) throw new Error(`Cita con id ${id} no encontrada`)
        const updated = { ...appt, pagado: true }
        store.set(id, updated)
        return updated
      }),
      getAppointmentsByPatient: vi.fn((pacienteId: string) =>
        Array.from(store.values()).filter((a: any) => a.pacienteId === pacienteId)
      ),
      getAppointmentsByDate: vi.fn((date: Date) =>
        Array.from(store.values()).filter((a: any) => {
          const d = new Date(a.fecha)
          return (
            d.getDate() === date.getDate() &&
            d.getMonth() === date.getMonth() &&
            d.getFullYear() === date.getFullYear()
          )
        })
      ),
      getUpcomingAppointments: vi.fn(() => {
        const now = new Date()
        return Array.from(store.values())
          .filter((a: any) => new Date(a.fecha) > now && a.estado === 'programada')
          .sort((a: any, b: any) => new Date(a.fecha).getTime() - new Date(b.fecha).getTime())
      }),
    }
  })
  return { AppointmentService: AppointmentServiceMock }
})

import { useAppointments } from '../../hooks/useAppointments'

function getFutureDate(daysAhead = 7): Date {
  const d = new Date()
  d.setDate(d.getDate() + daysAhead)
  return d
}

const validDTO: CreateAppointmentDTO = {
  pacienteId: 'patient_1',
  fecha: getFutureDate(7),
  duracionMinutos: 60,
  tipo: 'tratamiento',
}

describe('useAppointments', () => {
  describe('estado inicial', () => {
    it('inicia con array de citas vacío', () => {
      const { result } = renderHook(() => useAppointments())
      expect(result.current.appointments).toEqual([])
    })

    it('inicia con loading en false', () => {
      const { result } = renderHook(() => useAppointments())
      expect(result.current.loading).toBe(false)
    })

    it('inicia con error en null', () => {
      const { result } = renderHook(() => useAppointments())
      expect(result.current.error).toBeNull()
    })
  })

  describe('createAppointment', () => {
    it('crea una cita y actualiza la lista', () => {
      const { result } = renderHook(() => useAppointments())

      let appt: any
      act(() => {
        appt = result.current.createAppointment({ ...validDTO, fecha: getFutureDate(7) })
      })

      expect(appt).toBeDefined()
      expect(appt.estado).toBe('programada')
      expect(appt.pagado).toBe(false)
      expect(result.current.appointments).toHaveLength(1)
    })

    it('establece error cuando falta pacienteId', () => {
      const { result } = renderHook(() => useAppointments())

      act(() => {
        expect(() => result.current.createAppointment({ ...validDTO, pacienteId: '', fecha: getFutureDate(7) })).toThrow()
      })

      expect(result.current.error).toBe('El ID del paciente es requerido')
    })

    it('establece error cuando duración es 0', () => {
      const { result } = renderHook(() => useAppointments())

      act(() => {
        expect(() => result.current.createAppointment({ ...validDTO, duracionMinutos: 0, fecha: getFutureDate(7) })).toThrow()
      })

      expect(result.current.error).toBe('La duración debe ser mayor a 0 minutos')
    })

    it('establece error cuando la fecha es pasada', () => {
      const { result } = renderHook(() => useAppointments())

      act(() => {
        expect(() => result.current.createAppointment({ ...validDTO, fecha: new Date('2020-01-01') })).toThrow()
      })

      expect(result.current.error).toBe('La fecha de la cita no puede ser en el pasado')
    })

    it('loading vuelve a false después de crear', () => {
      const { result } = renderHook(() => useAppointments())

      act(() => {
        result.current.createAppointment({ ...validDTO, fecha: getFutureDate(7) })
      })

      expect(result.current.loading).toBe(false)
    })
  })

  describe('cancelAppointment', () => {
    it('cancela una cita y la elimina de upcoming', () => {
      const { result } = renderHook(() => useAppointments())

      let appt: any
      act(() => {
        appt = result.current.createAppointment({ ...validDTO, fecha: getFutureDate(7) })
      })

      act(() => {
        result.current.cancelAppointment(appt.id)
      })

      expect(result.current.appointments).toHaveLength(0)
    })

    it('establece error al cancelar id inexistente', () => {
      const { result } = renderHook(() => useAppointments())

      act(() => {
        expect(() => result.current.cancelAppointment('no-existe')).toThrow()
      })

      expect(result.current.error).not.toBeNull()
    })
  })

  describe('updateStatus', () => {
    it('actualiza estado a completada', () => {
      const { result } = renderHook(() => useAppointments())

      let appt: any
      act(() => {
        appt = result.current.createAppointment({ ...validDTO, fecha: getFutureDate(7) })
      })

      let updated: any
      act(() => {
        updated = result.current.updateStatus(appt.id, 'completada')
      })

      expect(updated.estado).toBe('completada')
    })

    it('actualiza estado a no_asistio', () => {
      const { result } = renderHook(() => useAppointments())

      let appt: any
      act(() => {
        appt = result.current.createAppointment({ ...validDTO, fecha: getFutureDate(7) })
      })

      let updated: any
      act(() => {
        updated = result.current.updateStatus(appt.id, 'no_asistio')
      })

      expect(updated.estado).toBe('no_asistio')
    })
  })

  describe('markAsPaid', () => {
    it('marca la cita como pagada', () => {
      const { result } = renderHook(() => useAppointments())

      let appt: any
      act(() => {
        appt = result.current.createAppointment({ ...validDTO, fecha: getFutureDate(7) })
      })

      let paid: any
      act(() => {
        paid = result.current.markAsPaid(appt.id)
      })

      expect(paid.pagado).toBe(true)
    })

    it('establece error al marcar id inexistente', () => {
      const { result } = renderHook(() => useAppointments())

      act(() => {
        expect(() => result.current.markAsPaid('no-existe')).toThrow()
      })

      expect(result.current.error).not.toBeNull()
    })
  })

  describe('getByPatient', () => {
    it('retorna citas del paciente correcto', () => {
      const { result } = renderHook(() => useAppointments())

      act(() => {
        result.current.createAppointment({ ...validDTO, pacienteId: 'p1', fecha: getFutureDate(5) })
        result.current.createAppointment({ ...validDTO, pacienteId: 'p2', fecha: getFutureDate(6) })
        result.current.createAppointment({ ...validDTO, pacienteId: 'p1', fecha: getFutureDate(7) })
      })

      let byP1: any[]
      act(() => {
        byP1 = result.current.getByPatient('p1')
      })

      expect(byP1!).toHaveLength(2)
      byP1!.forEach(a => expect(a.pacienteId).toBe('p1'))
    })

    it('retorna vacío para paciente sin citas', () => {
      const { result } = renderHook(() => useAppointments())

      let results: any[]
      act(() => {
        results = result.current.getByPatient('sin-citas')
      })

      expect(results!).toHaveLength(0)
    })
  })

  describe('getByDate', () => {
    it('retorna citas de una fecha específica', () => {
      const { result } = renderHook(() => useAppointments())

      const targetDate = getFutureDate(3)
      targetDate.setHours(10, 0, 0, 0)
      const otherDate = getFutureDate(5)

      act(() => {
        result.current.createAppointment({ ...validDTO, fecha: targetDate })
        result.current.createAppointment({ ...validDTO, fecha: otherDate })
      })

      let byDate: any[]
      act(() => {
        byDate = result.current.getByDate(targetDate)
      })

      expect(byDate!).toHaveLength(1)
    })
  })

  describe('getUpcoming', () => {
    it('retorna citas futuras programadas ordenadas por fecha', () => {
      const { result } = renderHook(() => useAppointments())

      const date1 = getFutureDate(10)
      const date2 = getFutureDate(3)

      act(() => {
        result.current.createAppointment({ ...validDTO, fecha: date1 })
        result.current.createAppointment({ ...validDTO, fecha: date2 })
      })

      let upcoming: any[]
      act(() => {
        upcoming = result.current.getUpcoming()
      })

      expect(upcoming!).toHaveLength(2)
      expect(new Date(upcoming![0].fecha).getTime()).toBeLessThan(
        new Date(upcoming![1].fecha).getTime()
      )
    })
  })

  describe('clearError', () => {
    it('limpia el error establecido', () => {
      const { result } = renderHook(() => useAppointments())

      expect(() => {
        act(() => {
          result.current.createAppointment({ ...validDTO, pacienteId: '', fecha: getFutureDate(7) })
        })
      }).toThrow()

      act(() => {
        result.current.clearError()
      })

      expect(result.current.error).toBeNull()
    })
  })

  describe('refreshAppointments', () => {
    it('refresca la lista de citas', () => {
      const { result } = renderHook(() => useAppointments())

      act(() => {
        result.current.createAppointment({ ...validDTO, fecha: getFutureDate(7) })
      })

      act(() => {
        result.current.refreshAppointments()
      })

      expect(result.current.appointments).toHaveLength(1)
    })
  })
})

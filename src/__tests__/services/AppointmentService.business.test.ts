import { describe, it, expect, beforeEach } from 'vitest'
import { AppointmentService } from '../../services/AppointmentService'
import { CreateAppointmentDTO } from '../../models/Appointment'

describe('AppointmentService - lógica de negocio extendida', () => {
  let service: AppointmentService
  let futureDate: Date
  let validDTO: CreateAppointmentDTO

  beforeEach(() => {
    service = new AppointmentService()
    futureDate = new Date()
    futureDate.setDate(futureDate.getDate() + 7)
    validDTO = {
      pacienteId: 'patient_1',
      fecha: futureDate,
      duracionMinutos: 45,
      tipo: 'evaluacion',
    }
  })

  describe('createAppointment - campos opcionales y validaciones', () => {
    it('crea cita con precio', () => {
      const appt = service.createAppointment({ ...validDTO, precio: 50 })
      expect(appt.precio).toBe(50)
    })

    it('crea cita con notas', () => {
      const appt = service.createAppointment({ ...validDTO, notas: 'Primera visita' })
      expect(appt.notas).toBe('Primera visita')
    })

    it('el id generado tiene el prefijo correcto', () => {
      const appt = service.createAppointment(validDTO)
      expect(appt.id).toMatch(/^appointment_/)
    })

    it('estado inicial es programada', () => {
      const appt = service.createAppointment(validDTO)
      expect(appt.estado).toBe('programada')
    })

    it('pagado inicial es false', () => {
      const appt = service.createAppointment(validDTO)
      expect(appt.pagado).toBe(false)
    })

    it('crea citas con todos los tipos válidos', () => {
      const tipos: Array<CreateAppointmentDTO['tipo']> = ['evaluacion', 'tratamiento', 'seguimiento', 'alta']
      tipos.forEach(tipo => {
        const appt = service.createAppointment({ ...validDTO, tipo })
        expect(appt.tipo).toBe(tipo)
      })
    })
  })

  describe('getAppointment - recuperación individual', () => {
    it('retorna la cita por su id', () => {
      const created = service.createAppointment(validDTO)
      const found = service.getAppointment(created.id)
      expect(found).toBeDefined()
      expect(found?.id).toBe(created.id)
    })

    it('retorna undefined para id inexistente', () => {
      expect(service.getAppointment('non-existent-id')).toBeUndefined()
    })

    it('retorna la cita con todos sus campos', () => {
      const dto = { ...validDTO, precio: 60, notas: 'Nota de prueba' }
      const created = service.createAppointment(dto)
      const found = service.getAppointment(created.id)
      expect(found?.precio).toBe(60)
      expect(found?.notas).toBe('Nota de prueba')
      expect(found?.pacienteId).toBe(validDTO.pacienteId)
    })
  })

  describe('getAppointmentsByDate - filtrado por fecha', () => {
    it('retorna citas de una fecha específica', () => {
      const targetDate = new Date()
      targetDate.setDate(targetDate.getDate() + 3)
      targetDate.setHours(10, 0, 0, 0)

      const otherDate = new Date()
      otherDate.setDate(otherDate.getDate() + 5)

      service.createAppointment({ ...validDTO, fecha: targetDate })
      service.createAppointment({ ...validDTO, fecha: otherDate })

      const results = service.getAppointmentsByDate(targetDate)
      expect(results).toHaveLength(1)
    })

    it('retorna array vacío cuando no hay citas en esa fecha', () => {
      const noApptDate = new Date('2030-12-25')
      const results = service.getAppointmentsByDate(noApptDate)
      expect(results).toEqual([])
    })

    it('retorna múltiples citas del mismo día a diferentes horas', () => {
      const day = new Date()
      day.setDate(day.getDate() + 3)

      const morning = new Date(day)
      morning.setHours(9, 0, 0, 0)
      const afternoon = new Date(day)
      afternoon.setHours(15, 0, 0, 0)

      service.createAppointment({ ...validDTO, fecha: morning })
      service.createAppointment({ ...validDTO, fecha: afternoon })

      const results = service.getAppointmentsByDate(day)
      expect(results).toHaveLength(2)
    })

    it('filtra correctamente por año diferente mismo día-mes', () => {
      const date2026 = new Date('2026-06-15T10:00:00')
      const date2027 = new Date('2027-06-15T10:00:00')

      service.createAppointment({ ...validDTO, fecha: date2026 })
      service.createAppointment({ ...validDTO, fecha: date2027 })

      const results2026 = service.getAppointmentsByDate(date2026)
      const results2027 = service.getAppointmentsByDate(date2027)

      expect(results2026).toHaveLength(1)
      expect(results2027).toHaveLength(1)
    })
  })

  describe('updateStatus - todos los estados', () => {
    it('actualiza a completada', () => {
      const appt = service.createAppointment(validDTO)
      const updated = service.updateStatus(appt.id, 'completada')
      expect(updated.estado).toBe('completada')
    })

    it('actualiza a no_asistio', () => {
      const appt = service.createAppointment(validDTO)
      const updated = service.updateStatus(appt.id, 'no_asistio')
      expect(updated.estado).toBe('no_asistio')
    })

    it('permite cambiar de cancelada a programada (corrección)', () => {
      const appt = service.createAppointment(validDTO)
      service.updateStatus(appt.id, 'cancelada')
      const reprogrammed = service.updateStatus(appt.id, 'programada')
      expect(reprogrammed.estado).toBe('programada')
    })

    it('preserva otros campos al actualizar estado', () => {
      const appt = service.createAppointment({ ...validDTO, precio: 45 })
      const updated = service.updateStatus(appt.id, 'completada')
      expect(updated.precio).toBe(45)
      expect(updated.pagado).toBe(false)
    })
  })

  describe('markAsPaid - comportamiento', () => {
    it('marca como pagada y preserva otros campos', () => {
      const appt = service.createAppointment({ ...validDTO, precio: 60 })
      const updated = service.markAsPaid(appt.id)
      expect(updated.pagado).toBe(true)
      expect(updated.precio).toBe(60)
      expect(updated.estado).toBe('programada')
    })

    it('marcar como pagada dos veces mantiene pagado=true', () => {
      const appt = service.createAppointment(validDTO)
      service.markAsPaid(appt.id)
      const secondTime = service.markAsPaid(appt.id)
      expect(secondTime.pagado).toBe(true)
    })
  })

  describe('getUpcomingAppointments - lógica de filtrado', () => {
    it('excluye citas completadas', () => {
      const appt = service.createAppointment(validDTO)
      service.updateStatus(appt.id, 'completada')
      expect(service.getUpcomingAppointments()).toHaveLength(0)
    })

    it('excluye citas no_asistio', () => {
      const appt = service.createAppointment(validDTO)
      service.updateStatus(appt.id, 'no_asistio')
      expect(service.getUpcomingAppointments()).toHaveLength(0)
    })

    it('incluye solo citas programadas futuras', () => {
      service.createAppointment(validDTO) // programada futura
      service.createAppointment({ ...validDTO, pacienteId: 'p2' }) // programada futura
      const upcoming = service.getUpcomingAppointments()
      expect(upcoming).toHaveLength(2)
      upcoming.forEach(a => expect(a.estado).toBe('programada'))
    })

    it('ordena por fecha ascendente', () => {
      const date1 = new Date()
      date1.setDate(date1.getDate() + 10)
      const date2 = new Date()
      date2.setDate(date2.getDate() + 3)
      const date3 = new Date()
      date3.setDate(date3.getDate() + 7)

      const appt1 = service.createAppointment({ ...validDTO, fecha: date1 })
      const appt2 = service.createAppointment({ ...validDTO, fecha: date2 })
      const appt3 = service.createAppointment({ ...validDTO, fecha: date3 })

      const upcoming = service.getUpcomingAppointments()
      expect(upcoming[0].id).toBe(appt2.id) // date2 es la más cercana
      expect(upcoming[1].id).toBe(appt3.id)
      expect(upcoming[2].id).toBe(appt1.id)
    })
  })

  describe('cancelAppointment - flujo completo', () => {
    it('cancela correctamente y no aparece en upcoming', () => {
      const appt = service.createAppointment(validDTO)
      service.cancelAppointment(appt.id)
      const upcoming = service.getUpcomingAppointments()
      expect(upcoming.find(a => a.id === appt.id)).toBeUndefined()
    })

    it('la cita cancelada sigue en getAppointmentsByPatient', () => {
      const appt = service.createAppointment(validDTO)
      service.cancelAppointment(appt.id)
      const byPatient = service.getAppointmentsByPatient(validDTO.pacienteId)
      expect(byPatient.find(a => a.id === appt.id)).toBeDefined()
      expect(byPatient.find(a => a.id === appt.id)?.estado).toBe('cancelada')
    })

    it('lanza error al cancelar cita inexistente', () => {
      expect(() => service.cancelAppointment('non-existent'))
        .toThrow('no encontrada')
    })
  })

  describe('getAppointmentsByPatient - filtrado correcto', () => {
    it('retorna citas de múltiples estados para un paciente', () => {
      const appt1 = service.createAppointment(validDTO)
      const appt2 = service.createAppointment(validDTO)
      service.updateStatus(appt1.id, 'completada')
      service.cancelAppointment(appt2.id)

      const results = service.getAppointmentsByPatient(validDTO.pacienteId)
      // Should now have 3 total: appt1 completed, appt2 cancelled, plus the new one
      expect(results.length).toBeGreaterThanOrEqual(2)
    })

    it('no mezcla citas de diferentes pacientes', () => {
      service.createAppointment({ ...validDTO, pacienteId: 'patient_A' })
      service.createAppointment({ ...validDTO, pacienteId: 'patient_B' })
      service.createAppointment({ ...validDTO, pacienteId: 'patient_A' })

      const resultsA = service.getAppointmentsByPatient('patient_A')
      const resultsB = service.getAppointmentsByPatient('patient_B')

      expect(resultsA).toHaveLength(2)
      expect(resultsB).toHaveLength(1)
      resultsA.forEach(a => expect(a.pacienteId).toBe('patient_A'))
    })
  })
})

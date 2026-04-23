import { describe, it, expect, beforeEach } from 'vitest'
import { AppointmentService } from '../../services/AppointmentService'
import { CreateAppointmentDTO } from '../../models/Appointment'

describe('AppointmentService', () => {
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
      duracionMinutos: 60,
      tipo: 'tratamiento',
    }
  })

  describe('createAppointment', () => {
    it('creates appointment with valid data', () => {
      const appt = service.createAppointment(validDTO)
      expect(appt.id).toBeDefined()
      expect(appt.estado).toBe('programada')
      expect(appt.pagado).toBe(false)
    })

    it('throws error when pacienteId is empty', () => {
      expect(() => service.createAppointment({ ...validDTO, pacienteId: '' }))
        .toThrow('El ID del paciente es requerido')
    })

    it('throws error when duration is 0', () => {
      expect(() => service.createAppointment({ ...validDTO, duracionMinutos: 0 }))
        .toThrow('La duración debe ser mayor a 0 minutos')
    })

    it('throws error when duration is negative', () => {
      expect(() => service.createAppointment({ ...validDTO, duracionMinutos: -30 }))
        .toThrow('La duración debe ser mayor a 0 minutos')
    })

    it('throws error when date is in the past', () => {
      const past = new Date('2020-01-01')
      expect(() => service.createAppointment({ ...validDTO, fecha: past }))
        .toThrow('La fecha de la cita no puede ser en el pasado')
    })
  })

  describe('getAppointmentsByPatient', () => {
    it('returns appointments for specific patient', () => {
      service.createAppointment(validDTO)
      service.createAppointment({ ...validDTO, pacienteId: 'other_patient' })
      const results = service.getAppointmentsByPatient('patient_1')
      expect(results).toHaveLength(1)
      expect(results[0].pacienteId).toBe('patient_1')
    })

    it('returns empty array for patient with no appointments', () => {
      expect(service.getAppointmentsByPatient('no_appointments')).toEqual([])
    })
  })

  describe('updateStatus', () => {
    it('updates appointment status', () => {
      const appt = service.createAppointment(validDTO)
      const updated = service.updateStatus(appt.id, 'completada')
      expect(updated.estado).toBe('completada')
    })

    it('throws error for non-existent appointment', () => {
      expect(() => service.updateStatus('non-existent', 'completada'))
        .toThrow('no encontrada')
    })
  })

  describe('markAsPaid', () => {
    it('marks appointment as paid', () => {
      const appt = service.createAppointment(validDTO)
      const updated = service.markAsPaid(appt.id)
      expect(updated.pagado).toBe(true)
    })

    it('throws error for non-existent appointment', () => {
      expect(() => service.markAsPaid('non-existent'))
        .toThrow('no encontrada')
    })
  })

  describe('getUpcomingAppointments', () => {
    it('returns scheduled future appointments sorted by date', () => {
      const date1 = new Date()
      date1.setDate(date1.getDate() + 5)
      const date2 = new Date()
      date2.setDate(date2.getDate() + 10)

      const appt1 = service.createAppointment({ ...validDTO, fecha: date2 })
      const appt2 = service.createAppointment({ ...validDTO, fecha: date1 })

      const upcoming = service.getUpcomingAppointments()
      expect(upcoming[0].id).toBe(appt2.id)
      expect(upcoming[1].id).toBe(appt1.id)
    })

    it('excludes cancelled appointments', () => {
      const appt = service.createAppointment(validDTO)
      service.cancelAppointment(appt.id)
      expect(service.getUpcomingAppointments()).toHaveLength(0)
    })
  })

  describe('cancelAppointment', () => {
    it('cancels an appointment', () => {
      const appt = service.createAppointment(validDTO)
      const cancelled = service.cancelAppointment(appt.id)
      expect(cancelled.estado).toBe('cancelada')
    })
  })
})

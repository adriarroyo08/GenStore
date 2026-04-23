import { describe, it, expect, beforeEach } from 'vitest'
import {
  Appointment,
  getFechaFormateada,
  getHoraFormateada,
  isAppointmentToday,
} from '../../models/Appointment'

describe('Appointment model', () => {
  let mockAppointment: Appointment

  beforeEach(() => {
    mockAppointment = {
      id: 'appt_1',
      pacienteId: 'patient_1',
      fecha: new Date('2026-06-15T10:30:00'),
      duracionMinutos: 60,
      tipo: 'tratamiento',
      estado: 'programada',
      pagado: false,
    }
  })

  describe('getFechaFormateada', () => {
    it('returns formatted date in Spanish', () => {
      const result = getFechaFormateada(mockAppointment)
      expect(result).toContain('2026')
      expect(result).toContain('junio')
    })
  })

  describe('getHoraFormateada', () => {
    it('returns formatted time', () => {
      const result = getHoraFormateada(mockAppointment)
      expect(result).toContain('10')
      expect(result).toContain('30')
    })
  })

  describe('isAppointmentToday', () => {
    it('returns true for today appointment', () => {
      const today = new Date()
      today.setHours(14, 0, 0, 0)
      const todayAppointment = { ...mockAppointment, fecha: today }
      expect(isAppointmentToday(todayAppointment)).toBe(true)
    })

    it('returns false for past appointment', () => {
      const past = new Date('2020-01-01')
      const pastAppointment = { ...mockAppointment, fecha: past }
      expect(isAppointmentToday(pastAppointment)).toBe(false)
    })

    it('returns false for future appointment', () => {
      const future = new Date('2030-12-31')
      const futureAppointment = { ...mockAppointment, fecha: future }
      expect(isAppointmentToday(futureAppointment)).toBe(false)
    })
  })
})

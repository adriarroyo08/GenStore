import { describe, it, expect } from 'vitest'
import {
  Appointment,
  getFechaFormateada,
  getHoraFormateada,
  isAppointmentToday,
} from '../../models/Appointment'

describe('Appointment model - lógica de negocio', () => {
  const baseAppointment: Appointment = {
    id: 'appt_1',
    pacienteId: 'patient_1',
    fecha: new Date('2026-06-15T10:30:00'),
    duracionMinutos: 60,
    tipo: 'tratamiento',
    estado: 'programada',
    pagado: false,
  }

  describe('getFechaFormateada - formato completo en español', () => {
    it('incluye el nombre del día de la semana en español', () => {
      // 2026-06-15 es un lunes
      const result = getFechaFormateada(baseAppointment)
      expect(result.toLowerCase()).toContain('lunes')
    })

    it('incluye el nombre del mes en español', () => {
      const result = getFechaFormateada(baseAppointment)
      expect(result.toLowerCase()).toContain('junio')
    })

    it('incluye el número del día', () => {
      const result = getFechaFormateada(baseAppointment)
      expect(result).toContain('15')
    })

    it('incluye el año', () => {
      const result = getFechaFormateada(baseAppointment)
      expect(result).toContain('2026')
    })

    it('formatea correctamente para diferentes tipos de cita', () => {
      const tipos: Array<Appointment['tipo']> = ['evaluacion', 'tratamiento', 'seguimiento', 'alta']
      tipos.forEach(tipo => {
        const appt = { ...baseAppointment, tipo }
        const result = getFechaFormateada(appt)
        expect(result).toContain('2026')
      })
    })
  })

  describe('getHoraFormateada - formato HH:mm', () => {
    it('incluye la hora y minutos separados por dos puntos', () => {
      const result = getHoraFormateada(baseAppointment)
      expect(result).toMatch(/\d{2}.\d{2}/)
    })

    it('formatea hora de madrugada correctamente', () => {
      const earlyAppt = { ...baseAppointment, fecha: new Date('2026-06-15T08:00:00') }
      const result = getHoraFormateada(earlyAppt)
      expect(result).toContain('08')
    })

    it('formatea hora al final del día correctamente', () => {
      const lateAppt = { ...baseAppointment, fecha: new Date('2026-06-15T19:45:00') }
      const result = getHoraFormateada(lateAppt)
      expect(result).toContain('19')
      expect(result).toContain('45')
    })

    it('formatea hora en punto (minutos 00)', () => {
      const appt = { ...baseAppointment, fecha: new Date('2026-06-15T11:00:00') }
      const result = getHoraFormateada(appt)
      expect(result).toContain('00')
    })
  })

  describe('isAppointmentToday - casos de límite', () => {
    it('retorna true para cita a primera hora de hoy', () => {
      const today = new Date()
      today.setHours(8, 0, 0, 0)
      expect(isAppointmentToday({ ...baseAppointment, fecha: today })).toBe(true)
    })

    it('retorna true para cita a última hora de hoy', () => {
      const today = new Date()
      today.setHours(20, 0, 0, 0)
      expect(isAppointmentToday({ ...baseAppointment, fecha: today })).toBe(true)
    })

    it('retorna false para cita de ayer', () => {
      const yesterday = new Date()
      yesterday.setDate(yesterday.getDate() - 1)
      expect(isAppointmentToday({ ...baseAppointment, fecha: yesterday })).toBe(false)
    })

    it('retorna false para cita de mañana', () => {
      const tomorrow = new Date()
      tomorrow.setDate(tomorrow.getDate() + 1)
      expect(isAppointmentToday({ ...baseAppointment, fecha: tomorrow })).toBe(false)
    })
  })

  describe('Appointment interface - campos opcionales y estados', () => {
    it('permite cita sin precio', () => {
      const appt: Appointment = { ...baseAppointment }
      expect(appt.precio).toBeUndefined()
    })

    it('permite cita con precio', () => {
      const appt: Appointment = { ...baseAppointment, precio: 45.0 }
      expect(appt.precio).toBe(45.0)
    })

    it('permite cita sin notas', () => {
      const appt: Appointment = { ...baseAppointment }
      expect(appt.notas).toBeUndefined()
    })

    it('permite cita con notas', () => {
      const appt: Appointment = { ...baseAppointment, notas: 'Paciente refiere dolor lumbar' }
      expect(appt.notas).toBe('Paciente refiere dolor lumbar')
    })

    it('acepta todos los estados posibles', () => {
      const estados: Array<Appointment['estado']> = ['programada', 'completada', 'cancelada', 'no_asistio']
      estados.forEach(estado => {
        const appt: Appointment = { ...baseAppointment, estado }
        expect(appt.estado).toBe(estado)
      })
    })

    it('acepta todos los tipos de cita', () => {
      const tipos: Array<Appointment['tipo']> = ['evaluacion', 'tratamiento', 'seguimiento', 'alta']
      tipos.forEach(tipo => {
        const appt: Appointment = { ...baseAppointment, tipo }
        expect(appt.tipo).toBe(tipo)
      })
    })
  })
})

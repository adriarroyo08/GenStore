import { describe, it, expect } from 'vitest'
import {
  formatDate,
  formatDateTime,
  formatTime,
  addMinutes,
  addDays,
  isSameDay,
  isWeekend,
  getStartOfDay,
  getEndOfDay,
  getDifferenceInDays,
  isInPast,
  isInFuture,
} from '../../utils/dateUtils'

describe('dateUtils - cobertura extendida', () => {
  describe('formatDateTime', () => {
    it('incluye fecha y hora en formato español', () => {
      const date = new Date('2026-06-15T14:30:00')
      const result = formatDateTime(date)
      // debe incluir el año y la hora
      expect(result).toContain('2026')
      expect(result).toMatch(/14.?30/)
    })

    it('tiene formato dd/mm/yyyy HH:mm', () => {
      const date = new Date('2026-03-01T09:05:00')
      const result = formatDateTime(date)
      expect(result).toMatch(/\d{2}\/\d{2}\/\d{4}/)
    })
  })

  describe('formatTime', () => {
    it('formatea hora en formato HH:mm', () => {
      const date = new Date('2026-06-15T09:05:00')
      const result = formatTime(date)
      expect(result).toMatch(/\d{2}.\d{2}/)
    })

    it('formatea medianoche correctamente', () => {
      const date = new Date('2026-06-15T00:00:00')
      const result = formatTime(date)
      expect(result).toContain('00')
    })

    it('formatea mediodia correctamente', () => {
      const date = new Date('2026-06-15T12:00:00')
      const result = formatTime(date)
      expect(result).toContain('12')
    })
  })

  describe('formatDate - casos adicionales', () => {
    it('formatea primer día del año', () => {
      const date = new Date('2026-01-01')
      const result = formatDate(date)
      expect(result).toContain('2026')
      expect(result).toMatch(/\d{2}\/\d{2}\/\d{4}/)
    })

    it('formatea último día del año', () => {
      const date = new Date('2026-12-31')
      const result = formatDate(date)
      expect(result).toContain('2026')
    })
  })

  describe('addMinutes - casos adicionales', () => {
    it('añadir 0 minutos devuelve misma hora', () => {
      const date = new Date('2026-03-16T10:00:00')
      const result = addMinutes(date, 0)
      expect(result.getTime()).toBe(date.getTime())
    })

    it('añadir 60 minutos equivale a una hora', () => {
      const date = new Date('2026-03-16T10:00:00')
      const result = addMinutes(date, 60)
      expect(result.getHours()).toBe(11)
      expect(result.getMinutes()).toBe(0)
    })

    it('añadir minutos que cruzan medianoche', () => {
      const date = new Date('2026-03-16T23:30:00')
      const result = addMinutes(date, 60)
      expect(result.getDate()).toBe(17)
      expect(result.getHours()).toBe(0)
      expect(result.getMinutes()).toBe(30)
    })

    it('no modifica la fecha original', () => {
      const date = new Date('2026-03-16T10:00:00')
      const originalTime = date.getTime()
      addMinutes(date, 30)
      expect(date.getTime()).toBe(originalTime)
    })

    it('acepta minutos negativos (resta tiempo)', () => {
      const date = new Date('2026-03-16T10:30:00')
      const result = addMinutes(date, -30)
      expect(result.getHours()).toBe(10)
      expect(result.getMinutes()).toBe(0)
    })
  })

  describe('addDays - casos adicionales', () => {
    it('añadir días negativos resta días', () => {
      const date = new Date('2026-03-16')
      const result = addDays(date, -5)
      expect(result.getDate()).toBe(11)
    })

    it('añadir 0 días devuelve la misma fecha', () => {
      const date = new Date('2026-03-16')
      const result = addDays(date, 0)
      expect(result.getDate()).toBe(date.getDate())
    })

    it('cruza cambio de año correctamente', () => {
      const date = new Date('2026-12-30')
      const result = addDays(date, 5)
      expect(result.getFullYear()).toBe(2027)
      expect(result.getMonth()).toBe(0) // enero
    })
  })

  describe('isSameDay - casos adicionales', () => {
    it('retorna false para mismo mes diferente año', () => {
      const date1 = new Date('2026-03-16')
      const date2 = new Date('2025-03-16')
      expect(isSameDay(date1, date2)).toBe(false)
    })

    it('retorna false para mismo día diferente mes', () => {
      const date1 = new Date('2026-03-16')
      const date2 = new Date('2026-04-16')
      expect(isSameDay(date1, date2)).toBe(false)
    })

    it('retorna true para mismo día con horas muy diferentes', () => {
      const date1 = new Date('2026-03-16T00:01:00')
      const date2 = new Date('2026-03-16T23:59:00')
      expect(isSameDay(date1, date2)).toBe(true)
    })
  })

  describe('isWeekend - todos los días de la semana', () => {
    it('retorna false para martes', () => {
      const tuesday = new Date('2026-03-17') // Tuesday
      expect(isWeekend(tuesday)).toBe(false)
    })

    it('retorna false para miércoles', () => {
      const wednesday = new Date('2026-03-18')
      expect(isWeekend(wednesday)).toBe(false)
    })

    it('retorna false para jueves', () => {
      const thursday = new Date('2026-03-19')
      expect(isWeekend(thursday)).toBe(false)
    })
  })

  describe('getStartOfDay - casos adicionales', () => {
    it('preserva la fecha al limpiar la hora', () => {
      const date = new Date('2026-06-15T18:45:30')
      const result = getStartOfDay(date)
      expect(result.getFullYear()).toBe(2026)
      expect(result.getMonth()).toBe(5) // junio
      expect(result.getDate()).toBe(15)
    })

    it('no modifica la fecha original', () => {
      const date = new Date('2026-03-16T14:30:00')
      const originalTime = date.getTime()
      getStartOfDay(date)
      expect(date.getTime()).toBe(originalTime)
    })
  })

  describe('getEndOfDay - casos adicionales', () => {
    it('establece milisegundos en 999', () => {
      const date = new Date('2026-03-16T14:30:00')
      const result = getEndOfDay(date)
      expect(result.getMilliseconds()).toBe(999)
    })

    it('preserva la fecha al fijar fin del día', () => {
      const date = new Date('2026-06-15T08:00:00')
      const result = getEndOfDay(date)
      expect(result.getDate()).toBe(15)
      expect(result.getMonth()).toBe(5)
    })

    it('no modifica la fecha original', () => {
      const date = new Date('2026-03-16T14:30:00')
      const originalTime = date.getTime()
      getEndOfDay(date)
      expect(date.getTime()).toBe(originalTime)
    })
  })

  describe('getDifferenceInDays - casos adicionales', () => {
    it('calcula diferencia de exactamente 30 días', () => {
      const date1 = new Date('2026-01-01')
      const date2 = new Date('2026-01-31')
      expect(getDifferenceInDays(date1, date2)).toBe(30)
    })

    it('calcula diferencia de un año completo', () => {
      const date1 = new Date('2026-01-01')
      const date2 = new Date('2027-01-01')
      expect(getDifferenceInDays(date1, date2)).toBe(365)
    })
  })

  describe('isInPast e isInFuture - consistencia', () => {
    it('una fecha pasada es isInPast=true e isInFuture=false', () => {
      const past = new Date('2020-01-01')
      expect(isInPast(past)).toBe(true)
      expect(isInFuture(past)).toBe(false)
    })

    it('una fecha futura es isInPast=false e isInFuture=true', () => {
      const future = new Date('2030-01-01')
      expect(isInPast(future)).toBe(false)
      expect(isInFuture(future)).toBe(true)
    })
  })
})

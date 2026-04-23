import { describe, it, expect } from 'vitest'
import {
  formatDate,
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

describe('dateUtils', () => {
  describe('formatDate', () => {
    it('formats date in Spanish format', () => {
      const date = new Date('2026-03-16')
      const result = formatDate(date)
      expect(result).toMatch(/\d{2}\/\d{2}\/\d{4}/)
    })
  })

  describe('addMinutes', () => {
    it('adds minutes to a date', () => {
      const date = new Date('2026-03-16T10:00:00')
      const result = addMinutes(date, 30)
      expect(result.getMinutes()).toBe(30)
      expect(result.getHours()).toBe(10)
    })

    it('handles overflow to next hour', () => {
      const date = new Date('2026-03-16T10:45:00')
      const result = addMinutes(date, 30)
      expect(result.getHours()).toBe(11)
      expect(result.getMinutes()).toBe(15)
    })
  })

  describe('addDays', () => {
    it('adds days to a date', () => {
      const date = new Date('2026-03-16')
      const result = addDays(date, 5)
      expect(result.getDate()).toBe(21)
      expect(result.getMonth()).toBe(2) // March = 2
    })

    it('handles month overflow', () => {
      const date = new Date('2026-03-30')
      const result = addDays(date, 5)
      expect(result.getMonth()).toBe(3) // April = 3
    })

    it('does not modify original date', () => {
      const date = new Date('2026-03-16')
      const original = date.getTime()
      addDays(date, 5)
      expect(date.getTime()).toBe(original)
    })
  })

  describe('isSameDay', () => {
    it('returns true for same day', () => {
      const date1 = new Date('2026-03-16T10:00:00')
      const date2 = new Date('2026-03-16T15:30:00')
      expect(isSameDay(date1, date2)).toBe(true)
    })

    it('returns false for different days', () => {
      const date1 = new Date('2026-03-16')
      const date2 = new Date('2026-03-17')
      expect(isSameDay(date1, date2)).toBe(false)
    })
  })

  describe('isWeekend', () => {
    it('returns true for Sunday', () => {
      const sunday = new Date('2026-03-15') // Sunday
      expect(isWeekend(sunday)).toBe(true)
    })

    it('returns true for Saturday', () => {
      const saturday = new Date('2026-03-14') // Saturday
      expect(isWeekend(saturday)).toBe(true)
    })

    it('returns false for Monday', () => {
      const monday = new Date('2026-03-16') // Monday
      expect(isWeekend(monday)).toBe(false)
    })

    it('returns false for Friday', () => {
      const friday = new Date('2026-03-20') // Friday
      expect(isWeekend(friday)).toBe(false)
    })
  })

  describe('getStartOfDay', () => {
    it('returns date with time set to 00:00:00', () => {
      const date = new Date('2026-03-16T14:30:00')
      const result = getStartOfDay(date)
      expect(result.getHours()).toBe(0)
      expect(result.getMinutes()).toBe(0)
      expect(result.getSeconds()).toBe(0)
    })
  })

  describe('getEndOfDay', () => {
    it('returns date with time set to 23:59:59', () => {
      const date = new Date('2026-03-16T14:30:00')
      const result = getEndOfDay(date)
      expect(result.getHours()).toBe(23)
      expect(result.getMinutes()).toBe(59)
      expect(result.getSeconds()).toBe(59)
    })
  })

  describe('getDifferenceInDays', () => {
    it('returns difference in days', () => {
      const date1 = new Date('2026-03-16')
      const date2 = new Date('2026-03-21')
      expect(getDifferenceInDays(date1, date2)).toBe(5)
    })

    it('returns absolute difference', () => {
      const date1 = new Date('2026-03-21')
      const date2 = new Date('2026-03-16')
      expect(getDifferenceInDays(date1, date2)).toBe(5)
    })

    it('returns 0 for same day', () => {
      const date = new Date('2026-03-16')
      expect(getDifferenceInDays(date, date)).toBe(0)
    })
  })

  describe('isInPast', () => {
    it('returns true for past date', () => {
      expect(isInPast(new Date('2020-01-01'))).toBe(true)
    })

    it('returns false for future date', () => {
      expect(isInPast(new Date('2030-01-01'))).toBe(false)
    })
  })

  describe('isInFuture', () => {
    it('returns true for future date', () => {
      expect(isInFuture(new Date('2030-01-01'))).toBe(true)
    })

    it('returns false for past date', () => {
      expect(isInFuture(new Date('2020-01-01'))).toBe(false)
    })
  })
})

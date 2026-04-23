import { describe, it, expect } from 'vitest';
import { getVatRate, calculateVat } from '../../src/services/vatService.js';

describe('vatService', () => {
  describe('getVatRate', () => {
    it('returns 21 for Spain', () => {
      expect(getVatRate('ES')).toBe(21);
    });

    it('returns 19 for Germany', () => {
      expect(getVatRate('DE')).toBe(19);
    });

    it('returns 20 for France', () => {
      expect(getVatRate('FR')).toBe(20);
    });

    it('returns 22 for Italy', () => {
      expect(getVatRate('IT')).toBe(22);
    });

    it('returns 21 for unknown country (default)', () => {
      expect(getVatRate('XX')).toBe(21);
    });

    it('is case-insensitive', () => {
      expect(getVatRate('es')).toBe(21);
    });
  });

  describe('calculateVat', () => {
    it('calculates VAT for Spain (21%)', () => {
      const result = calculateVat(100, 'ES');
      expect(result.rate).toBe(21);
      expect(result.amount).toBe(21);
      expect(result.total).toBe(121);
    });

    it('calculates VAT for Germany (19%)', () => {
      const result = calculateVat(100, 'DE');
      expect(result.rate).toBe(19);
      expect(result.amount).toBe(19);
      expect(result.total).toBe(119);
    });

    it('rounds to 2 decimal places', () => {
      const result = calculateVat(33.33, 'ES');
      expect(result.amount).toBe(7);
      expect(result.total).toBe(40.33);
    });
  });
});

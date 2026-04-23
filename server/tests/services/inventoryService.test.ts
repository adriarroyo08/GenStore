import { describe, it, expect } from 'vitest';
import { parseCsvRow, validateCsvRow } from '../../src/services/inventoryService.js';

describe('inventoryService', () => {
  describe('parseCsvRow', () => {
    it('parses a valid CSV row', () => {
      const row = { sku: 'FIS-001', nombre: 'Test Product', precio: '29.99', stock: '50', categoria: 'masaje', marca: 'TestBrand' };
      const result = parseCsvRow(row);
      expect(result.sku).toBe('FIS-001');
      expect(result.precio).toBe(29.99);
      expect(result.stock).toBe(50);
    });
  });

  describe('validateCsvRow', () => {
    it('returns null for valid row', () => {
      const row = { sku: 'FIS-001', nombre: 'Test', precio: 29.99, stock: 50 };
      expect(validateCsvRow(row)).toBeNull();
    });

    it('returns error for missing SKU', () => {
      const row = { sku: '', nombre: 'Test', precio: 29.99, stock: 50 };
      expect(validateCsvRow(row)).toBe('SKU es requerido');
    });

    it('returns error for negative price', () => {
      const row = { sku: 'FIS-001', nombre: 'Test', precio: -5, stock: 50 };
      expect(validateCsvRow(row)).toBe('Precio debe ser mayor a 0');
    });

    it('returns error for negative stock', () => {
      const row = { sku: 'FIS-001', nombre: 'Test', precio: 29.99, stock: -1 };
      expect(validateCsvRow(row)).toBe('Stock no puede ser negativo');
    });
  });
});

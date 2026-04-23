import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock emailService
vi.mock('../../src/services/emailService.js', () => ({
  sendStockAlertImmediate: vi.fn(),
  sendStockAlertDigest: vi.fn(),
}));

// Mock Supabase
const mockFrom = vi.fn();
vi.mock('../../src/config/supabase.js', () => {
  return {
    supabaseAdmin: {
      from: (...args: any[]) => mockFrom(...args),
    },
  };
});

import { checkAndAlertImmediate, sendDailyDigest } from '../../src/services/stockAlertService.js';
import * as emailService from '../../src/services/emailService.js';

function createChain(data: any = null, error: any = null) {
  const chain: any = {
    select: vi.fn().mockReturnThis(),
    insert: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    single: vi.fn().mockResolvedValue({ data, error }),
  };
  return chain;
}

describe('stockAlertService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('checkAndAlertImmediate', () => {
    it('sends alert when stock is below minimum', async () => {
      const productData = {
        id: 'p1', nombre: 'Test Product', sku: 'SKU-1',
        stock: 2, stock_minimo: 5,
      };

      // First call: products table (select product)
      const productChain = createChain(productData);
      // Second call: stock_alerts_log (insert — success)
      const insertChain: any = {
        insert: vi.fn().mockResolvedValue({ data: null, error: null }),
      };

      mockFrom
        .mockReturnValueOnce(productChain)
        .mockReturnValueOnce(insertChain);

      await checkAndAlertImmediate('p1');

      expect(emailService.sendStockAlertImmediate).toHaveBeenCalledWith({
        productName: 'Test Product',
        sku: 'SKU-1',
        currentStock: 2,
        stockMinimo: 5,
      });
    });

    it('skips when stock is above minimum', async () => {
      const productData = {
        id: 'p1', nombre: 'Test Product', sku: 'SKU-1',
        stock: 10, stock_minimo: 5,
      };

      mockFrom.mockReturnValueOnce(createChain(productData));

      await checkAndAlertImmediate('p1');

      expect(emailService.sendStockAlertImmediate).not.toHaveBeenCalled();
    });

    it('skips duplicate alerts (23505 error)', async () => {
      const productData = {
        id: 'p1', nombre: 'Test Product', sku: 'SKU-1',
        stock: 2, stock_minimo: 5,
      };

      const productChain = createChain(productData);
      // insert returns a promise directly (no chaining after it)
      const insertChain: any = {
        insert: vi.fn().mockResolvedValue({ data: null, error: { code: '23505', message: 'duplicate' } }),
      };

      mockFrom
        .mockReturnValueOnce(productChain)
        .mockReturnValueOnce(insertChain);

      await checkAndAlertImmediate('p1');

      expect(emailService.sendStockAlertImmediate).not.toHaveBeenCalled();
    });
  });

  describe('sendDailyDigest', () => {
    it('sends digest for products below minimum', async () => {
      const products = [
        { nombre: 'A', sku: 'A1', stock: 1, stock_minimo: 5, activo: true },
        { nombre: 'B', sku: 'B1', stock: 10, stock_minimo: 3, activo: true },
        { nombre: 'C', sku: 'C1', stock: 0, stock_minimo: 2, activo: true },
      ];

      const chain: any = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockResolvedValue({ data: products, error: null }),
      };

      mockFrom.mockReturnValueOnce(chain);

      await sendDailyDigest();

      expect(emailService.sendStockAlertDigest).toHaveBeenCalledWith([
        { nombre: 'A', sku: 'A1', stock: 1, stock_minimo: 5, activo: true },
        { nombre: 'C', sku: 'C1', stock: 0, stock_minimo: 2, activo: true },
      ]);
    });
  });
});

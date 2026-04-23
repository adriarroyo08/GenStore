import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock emailService
vi.mock('../../src/services/emailService.js', () => ({
  sendOrderShipped: vi.fn(),
  sendOrderDelivered: vi.fn(),
}));

// Mock env
vi.mock('../../src/config/env.js', () => ({
  env: {
    SEUR_USER: undefined,
    SEUR_PASSWORD: undefined,
    CORREOS_EXPRESS_USER: undefined,
    CORREOS_EXPRESS_PASSWORD: undefined,
    MRW_USER: undefined,
    MRW_PASSWORD: undefined,
  },
}));

// Mock Supabase
const mockFrom = vi.fn();
vi.mock('../../src/config/supabase.js', () => ({
  supabaseAdmin: {
    from: (...args: any[]) => mockFrom(...args),
    auth: {
      admin: {
        getUserById: vi.fn().mockResolvedValue({ data: { user: null } }),
      },
    },
  },
}));

import { getAvailableCarriers, getShipmentByOrderId } from '../../src/services/shippingService.js';

describe('shippingService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getAvailableCarriers', () => {
    it('returns empty array when no credentials configured', () => {
      const carriers = getAvailableCarriers();
      expect(carriers).toEqual([]);
    });
  });

  describe('getShipmentByOrderId', () => {
    it('returns null when no shipment exists', async () => {
      const chain: any = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: null, error: null }),
      };
      mockFrom.mockReturnValueOnce(chain);

      const result = await getShipmentByOrderId('ord-nonexistent');
      expect(result).toBeNull();
    });

    it('returns shipment with events when exists', async () => {
      const shipmentData = {
        id: 'ship-1', order_id: 'ord-1', carrier: 'seur',
        tracking_number: 'TR123', estado: 'en_transito',
      };
      const shipmentChain: any = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: shipmentData, error: null }),
      };

      const eventsChain: any = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockResolvedValue({
          data: [
            { id: 'ev-1', estado: 'recogido', descripcion: 'Recogido', occurred_at: '2026-01-01' },
          ],
          error: null,
        }),
      };

      mockFrom
        .mockReturnValueOnce(shipmentChain)
        .mockReturnValueOnce(eventsChain);

      const result = await getShipmentByOrderId('ord-1');
      expect(result).not.toBeNull();
      expect(result!.carrier).toBe('seur');
      expect(result!.events).toHaveLength(1);
      expect(result!.events[0].estado).toBe('recogido');
    });
  });
});

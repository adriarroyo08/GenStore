import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock Resend
const mockSend = vi.fn().mockResolvedValue({ id: 'email_123' });
vi.mock('resend', () => ({
  Resend: vi.fn().mockImplementation(() => ({
    emails: { send: mockSend },
  })),
}));

// Mock supabase to prevent module load errors (businessSettingsService imports it)
vi.mock('../../src/config/supabase.js', () => ({
  supabaseAdmin: {
    from: vi.fn().mockReturnValue({
      select: vi.fn().mockReturnValue({
        single: vi.fn().mockResolvedValue({ data: {}, error: null }),
      }),
    }),
  },
}));

// Mock env
vi.mock('../../src/config/env.js', () => ({
  env: {
    RESEND_API_KEY: 're_test_fake',
    EMAIL_FROM: 'Test <test@test.com>',
    STOCK_ALERT_ADMIN_EMAIL: 'admin@test.com',
    BUSINESS_NAME: 'Test Business S.L.',
    BUSINESS_NIF: 'B12345678',
    BUSINESS_ADDRESS: 'Calle Test 1, 28001 Madrid',
    BUSINESS_EMAIL: 'test@test.com',
    BUSINESS_PHONE: '+34 600 000 000',
  },
}));

import {
  sendPaymentConfirmation,
  sendStockAlertImmediate,
  sendStockAlertDigest,
} from '../../src/services/emailService.js';

describe('emailService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('sendPaymentConfirmation', () => {
    it('sends email with correct to/subject and order details', async () => {
      await sendPaymentConfirmation({
        order: {
          id: 'ord-1', numero_pedido: 'PED-001', user_id: 'u1',
          shipping_address_id: null, billing_address_id: null,
          estado: 'pagado', subtotal: 100, impuestos: 21,
          gastos_envio: 5, total: 126, pais_impuesto: 'ES',
          tipo_iva: 21, metodo_pago: 'stripe', payment_intent_id: null,
          paypal_order_id: null, notas: null,
          created_at: '2026-01-01', updated_at: '2026-01-01',
        },
        items: [
          {
            id: 'item-1', order_id: 'ord-1', product_id: 'p1',
            cantidad: 2, precio_unitario: 50, subtotal: 100,
            opciones: {}, product: { nombre: 'Producto Test' },
          },
        ],
        customerName: 'Juan Test',
        customerEmail: 'juan@test.com',
      });

      expect(mockSend).toHaveBeenCalledTimes(1);
      const call = mockSend.mock.calls[0][0];
      expect(call.to).toBe('juan@test.com');
      expect(call.subject).toContain('PED-001');
      expect(call.html).toContain('Producto Test');
      expect(call.html).toContain('126.00');
    });
  });

  describe('sendStockAlertImmediate', () => {
    it('sends alert to admin email', async () => {
      await sendStockAlertImmediate({
        productName: 'Producto Bajo',
        sku: 'SKU-001',
        currentStock: 2,
        stockMinimo: 5,
      });

      expect(mockSend).toHaveBeenCalledTimes(1);
      const call = mockSend.mock.calls[0][0];
      expect(call.to).toBe('admin@test.com');
      expect(call.subject).toContain('Producto Bajo');
      expect(call.html).toContain('SKU-001');
    });
  });

  describe('sendStockAlertDigest', () => {
    it('sends digest with multiple products', async () => {
      await sendStockAlertDigest([
        { nombre: 'Prod A', sku: 'A1', stock: 1, stock_minimo: 5 },
        { nombre: 'Prod B', sku: 'B1', stock: 0, stock_minimo: 3 },
      ]);

      expect(mockSend).toHaveBeenCalledTimes(1);
      const call = mockSend.mock.calls[0][0];
      expect(call.subject).toContain('2 producto(s)');
      expect(call.html).toContain('Prod A');
      expect(call.html).toContain('Prod B');
    });

    it('skips sending when product list is empty', async () => {
      await sendStockAlertDigest([]);
      expect(mockSend).not.toHaveBeenCalled();
    });
  });
});

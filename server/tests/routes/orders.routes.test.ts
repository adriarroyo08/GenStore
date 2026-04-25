import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock Stripe before importing services
vi.mock('../../src/config/stripe.js', () => ({
  stripe: {
    refunds: {
      create: vi.fn(),
    },
    paymentIntents: {
      create: vi.fn(),
      retrieve: vi.fn(),
    },
  },
}));

// Mock Supabase before importing services
vi.mock('../../src/config/supabase.js', () => {
  const mockChain = () => {
    const chain: any = {
      select: vi.fn().mockReturnThis(),
      insert: vi.fn().mockReturnThis(),
      update: vi.fn().mockReturnThis(),
      delete: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: null, error: null }),
      maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
    };
    return chain;
  };
  return {
    supabaseAdmin: {
      from: vi.fn().mockReturnValue(mockChain()),
      rpc: vi.fn().mockResolvedValue({ data: null, error: null }),
    },
  };
});

// Mock vatService
vi.mock('../../src/services/vatService.js', () => ({
  calculateVat: vi.fn().mockReturnValue({ amount: 4.2, rate: 21, total: 24.19 }),
}));

// Mock notificationService
vi.mock('../../src/services/notificationService.js', () => ({
  create: vi.fn().mockResolvedValue(undefined),
}));

// Mock emailService
vi.mock('../../src/services/emailService.js', () => ({
  sendEmailVerification: vi.fn().mockResolvedValue(undefined),
  sendOrderCancelled: vi.fn().mockResolvedValue(undefined),
  sendPaymentConfirmation: vi.fn().mockResolvedValue(undefined),
  sendInvoiceReady: vi.fn().mockResolvedValue(undefined),
  sendNewOrderAdminAlert: vi.fn().mockResolvedValue(undefined),
}));

describe('orderService', () => {
  beforeEach(async () => {
    // resetAllMocks clears the mockReturnValueOnce queue (clearAllMocks does not)
    vi.resetAllMocks();

    // Re-apply default implementations wiped by resetAllMocks
    const vat = await import('../../src/services/vatService.js');
    vi.mocked(vat.calculateVat).mockReturnValue({ amount: 4.2, rate: 21, total: 24.19 } as any);

    const notif = await import('../../src/services/notificationService.js');
    vi.mocked(notif.create).mockResolvedValue(undefined as any);

    const email = await import('../../src/services/emailService.js');
    vi.mocked(email.sendOrderCancelled).mockResolvedValue(undefined as any);

    const { stripe } = await import('../../src/config/stripe.js');
    const supabase = await import('../../src/config/supabase.js');
    vi.mocked(supabase.supabaseAdmin.rpc).mockResolvedValue({ data: null, error: null } as any);
  });

  describe('createOrder', () => {
    it('creates order from non-empty cart', async () => {
      const { supabaseAdmin } = await import('../../src/config/supabase.js');
      const fromMock = vi.mocked(supabaseAdmin.from);

      const cartItems = [
        {
          id: 'ci-1',
          user_id: 'user-1',
          product_id: 'prod-1',
          cantidad: 2,
          opciones: {},
          product: { id: 'prod-1', nombre: 'Producto A', precio: 10.0, stock: 5 },
        },
      ];

      // 1. Fetch cart items
      fromMock.mockReturnValueOnce({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockResolvedValue({ data: cartItems, error: null }),
      } as any);

      const newOrder = {
        id: 'order-new',
        numero_pedido: 'PED-001',
        user_id: 'user-1',
        estado: 'pendiente',
        subtotal: 20.0,
        impuestos: 4.2,
        gastos_envio: 9.99,
        total: 34.19,
      };

      // 2. Insert order
      fromMock.mockReturnValueOnce({
        insert: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: newOrder, error: null }),
      } as any);

      // 3. Insert order_items
      fromMock.mockReturnValueOnce({
        insert: vi.fn().mockReturnThis(),
        select: vi.fn().mockResolvedValue({
          data: [{ id: 'oi-1', order_id: 'order-new', product_id: 'prod-1', cantidad: 2, precio_unitario: 10 }],
          error: null,
        }),
      } as any);

      const { createOrder } = await import('../../src/services/orderService.js');
      const result = await createOrder({
        userId: 'user-1',
        shippingAddressId: 'addr-1',
        paisImpuesto: 'ES',
      });

      expect(result.id).toBe('order-new');
      expect(result.estado).toBe('pendiente');
      expect(result.items).toBeDefined();
    });

    it('throws when cart is empty', async () => {
      const { supabaseAdmin } = await import('../../src/config/supabase.js');
      const fromMock = vi.mocked(supabaseAdmin.from);

      // Empty cart
      fromMock.mockReturnValueOnce({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockResolvedValue({ data: [], error: null }),
      } as any);

      const { createOrder } = await import('../../src/services/orderService.js');

      await expect(
        createOrder({
          userId: 'user-empty',
          shippingAddressId: 'addr-1',
          paisImpuesto: 'ES',
        })
      ).rejects.toThrow('El carrito está vacío');
    });

    it('throws when a product has insufficient stock', async () => {
      const { supabaseAdmin } = await import('../../src/config/supabase.js');
      const fromMock = vi.mocked(supabaseAdmin.from);

      // Cart with product having stock < cantidad
      const cartItems = [
        {
          id: 'ci-1',
          user_id: 'user-1',
          product_id: 'prod-out',
          cantidad: 10,
          opciones: {},
          product: { id: 'prod-out', nombre: 'Producto Agotado', precio: 5.0, stock: 2 },
        },
      ];

      fromMock.mockReturnValueOnce({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockResolvedValue({ data: cartItems, error: null }),
      } as any);

      const { createOrder } = await import('../../src/services/orderService.js');

      await expect(
        createOrder({
          userId: 'user-1',
          shippingAddressId: 'addr-1',
          paisImpuesto: 'ES',
        })
      ).rejects.toThrow('Stock insuficiente');
    });

    it('applies free shipping when subtotal >= 50', async () => {
      const { supabaseAdmin } = await import('../../src/config/supabase.js');
      const fromMock = vi.mocked(supabaseAdmin.from);

      // Cart total = 60
      const cartItems = [
        {
          id: 'ci-1',
          user_id: 'user-1',
          product_id: 'prod-1',
          cantidad: 3,
          opciones: {},
          product: { id: 'prod-1', nombre: 'Producto', precio: 20.0, stock: 10 },
        },
      ];

      fromMock.mockReturnValueOnce({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockResolvedValue({ data: cartItems, error: null }),
      } as any);

      const insertedOrder = {
        id: 'order-free-ship',
        numero_pedido: 'PED-002',
        estado: 'pendiente',
        subtotal: 60.0,
        gastos_envio: 0,
        total: 72.6,
      };

      fromMock.mockReturnValueOnce({
        insert: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: insertedOrder, error: null }),
      } as any);

      fromMock.mockReturnValueOnce({
        insert: vi.fn().mockReturnThis(),
        select: vi.fn().mockResolvedValue({ data: [], error: null }),
      } as any);

      const { createOrder } = await import('../../src/services/orderService.js');
      const result = await createOrder({
        userId: 'user-1',
        shippingAddressId: 'addr-1',
        paisImpuesto: 'ES',
      });

      expect(result.gastos_envio).toBe(0);
    });
  });

  describe('getOrders', () => {
    it('returns list of orders for user, ordered by date descending', async () => {
      const { supabaseAdmin } = await import('../../src/config/supabase.js');
      const fromMock = vi.mocked(supabaseAdmin.from);

      const fakeOrders = [
        { id: 'order-2', numero_pedido: 'PED-002', estado: 'pendiente', total: 50 },
        { id: 'order-1', numero_pedido: 'PED-001', estado: 'pagado', total: 30 },
      ];

      fromMock.mockReturnValueOnce({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockResolvedValue({ data: fakeOrders, error: null }),
      } as any);

      const { getOrders } = await import('../../src/services/orderService.js');
      const result = await getOrders('user-123');

      expect(result).toHaveLength(2);
      expect(result[0].id).toBe('order-2');
    });

    it('returns empty array when user has no orders', async () => {
      const { supabaseAdmin } = await import('../../src/config/supabase.js');
      const fromMock = vi.mocked(supabaseAdmin.from);

      fromMock.mockReturnValueOnce({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockResolvedValue({ data: [], error: null }),
      } as any);

      const { getOrders } = await import('../../src/services/orderService.js');
      const result = await getOrders('user-no-orders');

      expect(result).toHaveLength(0);
    });
  });

  describe('cancelOrder', () => {
    it('cancels a pending order (no refund needed)', async () => {
      const { supabaseAdmin } = await import('../../src/config/supabase.js');
      const fromMock = vi.mocked(supabaseAdmin.from);

      const pendingOrder = {
        id: 'order-1',
        user_id: 'user-1',
        estado: 'pendiente',
        numero_pedido: 'PED-001',
        payment_intent_id: null,
        order_items: [{ id: 'oi-1', product_id: 'prod-1', cantidad: 2 }],
      };

      // Select order
      fromMock.mockReturnValueOnce({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: pendingOrder, error: null }),
      } as any);

      // Update to cancelado
      fromMock.mockReturnValueOnce({
        update: vi.fn().mockReturnThis(),
        eq: vi.fn().mockResolvedValue({ error: null }),
      } as any);

      // Profile for email/notification
      fromMock.mockReturnValueOnce({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: { nombre: 'Juan', email: 'juan@test.com' },
          error: null,
        }),
      } as any);

      const { cancelOrder } = await import('../../src/services/orderService.js');
      const result = await cancelOrder('user-1', 'order-1');

      expect(result.refunded).toBe(false);
    });

    it('only cancels orders in cancellable states', async () => {
      const { supabaseAdmin } = await import('../../src/config/supabase.js');
      const fromMock = vi.mocked(supabaseAdmin.from);

      // Order already delivered — not cancellable
      const deliveredOrder = {
        id: 'order-delivered',
        user_id: 'user-1',
        estado: 'entregado',
        numero_pedido: 'PED-003',
        payment_intent_id: null,
        order_items: [],
      };

      fromMock.mockReturnValueOnce({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: deliveredOrder, error: null }),
      } as any);

      const { cancelOrder } = await import('../../src/services/orderService.js');

      await expect(cancelOrder('user-1', 'order-delivered')).rejects.toThrow(
        'Este pedido no se puede cancelar en su estado actual'
      );
    });

    it('throws 404 when order not found or does not belong to user', async () => {
      const { supabaseAdmin } = await import('../../src/config/supabase.js');
      const fromMock = vi.mocked(supabaseAdmin.from);

      fromMock.mockReturnValueOnce({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: null,
          error: { message: 'Not found', code: 'PGRST116' },
        }),
      } as any);

      const { cancelOrder } = await import('../../src/services/orderService.js');

      await expect(cancelOrder('user-1', 'order-other-user')).rejects.toThrow('Pedido no encontrado');
    });

    it('processes Stripe refund when order is already paid', async () => {
      const { supabaseAdmin } = await import('../../src/config/supabase.js');
      const { stripe } = await import('../../src/config/stripe.js');
      const fromMock = vi.mocked(supabaseAdmin.from);

      const paidOrder = {
        id: 'order-paid',
        user_id: 'user-1',
        estado: 'pagado',
        numero_pedido: 'PED-004',
        payment_intent_id: 'pi_test_123',
        order_items: [],
      };

      // Select order
      fromMock.mockReturnValueOnce({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: paidOrder, error: null }),
      } as any);

      vi.mocked(stripe.refunds.create).mockResolvedValueOnce({
        id: 'refund-123',
        amount: 3000,
        status: 'succeeded',
      } as any);

      // Update order
      fromMock.mockReturnValueOnce({
        update: vi.fn().mockReturnThis(),
        eq: vi.fn().mockResolvedValue({ error: null }),
      } as any);

      // Profile for email/notification
      fromMock.mockReturnValueOnce({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: { nombre: 'Juan', email: 'juan@test.com' },
          error: null,
        }),
      } as any);

      const { cancelOrder } = await import('../../src/services/orderService.js');
      const result = await cancelOrder('user-1', 'order-paid');

      expect(result.refunded).toBe(true);
      expect(result.refundAmount).toBe(30); // 3000 cents / 100
      expect(stripe.refunds.create).toHaveBeenCalledWith({ payment_intent: 'pi_test_123' });
    });
  });

  describe('getOrderById', () => {
    it('returns order when found for user', async () => {
      const { supabaseAdmin } = await import('../../src/config/supabase.js');
      const fromMock = vi.mocked(supabaseAdmin.from);

      const fakeOrder = {
        id: 'order-abc',
        user_id: 'user-1',
        estado: 'pendiente',
        total: 25.99,
        order_items: [],
      };

      fromMock.mockReturnValueOnce({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: fakeOrder, error: null }),
      } as any);

      const { getOrderById } = await import('../../src/services/orderService.js');
      const result = await getOrderById('user-1', 'order-abc');

      expect(result?.id).toBe('order-abc');
    });

    it('returns null when order not found (PGRST116)', async () => {
      const { supabaseAdmin } = await import('../../src/config/supabase.js');
      const fromMock = vi.mocked(supabaseAdmin.from);

      fromMock.mockReturnValueOnce({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: null,
          error: { message: 'No rows found', code: 'PGRST116' },
        }),
      } as any);

      const { getOrderById } = await import('../../src/services/orderService.js');
      const result = await getOrderById('user-1', 'nonexistent');

      expect(result).toBeNull();
    });
  });
});

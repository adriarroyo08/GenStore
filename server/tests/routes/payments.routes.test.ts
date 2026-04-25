import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock Stripe before importing services
vi.mock('../../src/config/stripe.js', () => ({
  stripe: {
    customers: {
      create: vi.fn(),
    },
    paymentIntents: {
      create: vi.fn(),
      retrieve: vi.fn(),
    },
    refunds: {
      create: vi.fn(),
    },
    webhooks: {
      constructEvent: vi.fn(),
    },
  },
}));

// Mock Supabase before importing services
vi.mock('../../src/config/supabase.js', () => {
  return {
    supabaseAdmin: {
      from: vi.fn(),
      rpc: vi.fn().mockResolvedValue({ data: null, error: null }),
      auth: {
        admin: {
          getUserById: vi.fn(),
        },
      },
    },
  };
});

// Mock vatService
vi.mock('../../src/services/vatService.js', () => ({
  calculateVat: vi.fn().mockReturnValue({ amount: 4.2, rate: 21, total: 24.19 }),
}));

// Mock cartService
vi.mock('../../src/services/cartService.js', () => ({
  clearCart: vi.fn().mockResolvedValue(undefined),
}));

// Mock emailService
vi.mock('../../src/services/emailService.js', () => ({
  sendEmailVerification: vi.fn().mockResolvedValue(undefined),
  sendOrderCancelled: vi.fn().mockResolvedValue(undefined),
  sendPaymentConfirmation: vi.fn().mockResolvedValue(undefined),
  sendInvoiceReady: vi.fn().mockResolvedValue(undefined),
  sendNewOrderAdminAlert: vi.fn().mockResolvedValue(undefined),
}));

vi.mock('../../src/services/stockAlertService.js', () => ({
  checkAndAlertImmediate: vi.fn().mockResolvedValue(undefined),
}));

vi.mock('../../src/services/invoiceService.js', () => ({
  generateInvoice: vi.fn().mockResolvedValue({ numeroFactura: 'FAC-001' }),
  getInvoiceDownloadUrl: vi.fn().mockResolvedValue('https://storage/invoice.pdf'),
}));

vi.mock('../../src/services/couponService.js', () => ({
  validateCoupon: vi.fn().mockResolvedValue({ valid: false, error: 'No coupon' }),
  applyCoupon: vi.fn().mockResolvedValue(undefined),
}));

vi.mock('../../src/services/pointsService.js', () => ({
  awardPoints: vi.fn().mockResolvedValue(undefined),
}));

vi.mock('../../src/services/businessSettingsService.js', () => ({
  getSetting: vi.fn().mockResolvedValue(false),
}));

vi.mock('../../src/services/notificationService.js', () => ({
  create: vi.fn().mockResolvedValue(undefined),
}));

/** Build a select chain: from().select().eq().single() */
function makeSelectChain(value: any, terminal: 'single' | 'maybeSingle' = 'single') {
  const termFn = vi.fn().mockResolvedValue(value);
  const eqFn: any = vi.fn().mockReturnValue({ [terminal]: termFn, eq: vi.fn().mockReturnValue({ [terminal]: termFn }) });
  const selectFn = vi.fn().mockReturnValue({ eq: eqFn });
  return { select: selectFn };
}

/** Build an update chain: from().update().eq().eq()...select().single() */
function makeUpdateChain(value: any) {
  const singleFn = vi.fn().mockResolvedValue(value);
  const selectFn = vi.fn().mockReturnValue({ single: singleFn });
  // Support multiple .eq() chaining then .select()
  const eqDeep: any = vi.fn();
  eqDeep.mockReturnValue({ eq: eqDeep, select: selectFn, mockResolvedValue: undefined });
  // terminal eq for simple update().eq() that just resolves
  const eqSimple = vi.fn().mockResolvedValue(value);
  const updateFn = vi.fn().mockReturnValue({ eq: eqDeep });
  return { update: updateFn, _selectFn: selectFn, _eqDeep: eqDeep };
}

describe('paymentService', () => {
  beforeEach(async () => {
    // resetAllMocks clears the mockReturnValueOnce queue (clearAllMocks does not)
    vi.resetAllMocks();

    // Re-apply default implementations wiped by resetAllMocks
    const supabase = await import('../../src/config/supabase.js');
    vi.mocked(supabase.supabaseAdmin.rpc).mockResolvedValue({ data: null, error: null } as any);
    vi.mocked(supabase.supabaseAdmin.auth.admin.getUserById).mockResolvedValue({
      data: { user: { id: 'user-1', email: 'user@test.com' } },
      error: null,
    } as any);

    const cart = await import('../../src/services/cartService.js');
    vi.mocked(cart.clearCart).mockResolvedValue(undefined as any);

    const vat = await import('../../src/services/vatService.js');
    vi.mocked(vat.calculateVat).mockReturnValue({ amount: 4.2, rate: 21, total: 24.19 } as any);

    const invoice = await import('../../src/services/invoiceService.js');
    vi.mocked(invoice.generateInvoice).mockResolvedValue({ numeroFactura: 'FAC-001' } as any);
    vi.mocked(invoice.getInvoiceDownloadUrl).mockResolvedValue('https://storage/invoice.pdf' as any);

    const biz = await import('../../src/services/businessSettingsService.js');
    vi.mocked(biz.getSetting).mockResolvedValue(false as any);

    const notif = await import('../../src/services/notificationService.js');
    vi.mocked(notif.create).mockResolvedValue(undefined as any);

    const email = await import('../../src/services/emailService.js');
    vi.mocked(email.sendPaymentConfirmation).mockResolvedValue(undefined as any);
    vi.mocked(email.sendInvoiceReady).mockResolvedValue(undefined as any);
    vi.mocked(email.sendNewOrderAdminAlert).mockResolvedValue(undefined as any);

    const stock = await import('../../src/services/stockAlertService.js');
    vi.mocked(stock.checkAndAlertImmediate).mockResolvedValue(undefined as any);

    const coupon = await import('../../src/services/couponService.js');
    vi.mocked(coupon.validateCoupon).mockResolvedValue({ valid: false, error: 'No coupon' } as any);
    vi.mocked(coupon.applyCoupon).mockResolvedValue(undefined as any);

    const points = await import('../../src/services/pointsService.js');
    vi.mocked(points.awardPoints).mockResolvedValue(undefined as any);
  });

  describe('createPaymentIntent', () => {
    it('creates Stripe PaymentIntent from cart and returns client secret', async () => {
      const { supabaseAdmin } = await import('../../src/config/supabase.js');
      const { stripe } = await import('../../src/config/stripe.js');
      const fromMock = vi.mocked(supabaseAdmin.from);

      const cartItems = [
        {
          id: 'ci-1',
          user_id: 'user-1',
          product_id: 'prod-1',
          cantidad: 1,
          opciones: {},
          product: { id: 'prod-1', nombre: 'Producto', precio: 20.0, stock: 5 },
        },
      ];

      // 1. Fetch cart: select().eq() resolves
      fromMock.mockReturnValueOnce({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockResolvedValue({ data: cartItems, error: null }),
      } as any);

      // 2. Get Stripe customer — profile has existing ID
      fromMock.mockReturnValueOnce(
        makeSelectChain({ data: { stripe_customer_id: 'cus_test_123' }, error: null }) as any
      );

      const newOrder = {
        id: 'order-pi-1',
        numero_pedido: 'PED-PI-001',
        user_id: 'user-1',
        estado: 'pendiente',
        subtotal: 20.0,
        total: 34.19,
      };

      // 3. Insert order: insert().select().single()
      fromMock.mockReturnValueOnce({
        insert: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({ data: newOrder, error: null }),
          }),
        }),
      } as any);

      // 4. Insert order_items
      fromMock.mockReturnValueOnce({
        insert: vi.fn().mockResolvedValue({ error: null }),
      } as any);

      vi.mocked(stripe.paymentIntents.create).mockResolvedValueOnce({
        id: 'pi_test_abc',
        client_secret: 'pi_test_abc_secret_xyz',
        amount: 3419,
        currency: 'eur',
        status: 'requires_payment_method',
      } as any);

      // 5. Update order with payment_intent_id
      fromMock.mockReturnValueOnce({
        update: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({ error: null }),
        }),
      } as any);

      const { createPaymentIntent } = await import('../../src/services/paymentService.js');
      const result = await createPaymentIntent({
        userId: 'user-1',
        email: 'user@test.com',
        shippingAddressId: 'addr-1',
        paisImpuesto: 'ES',
        saveCard: false,
      });

      expect(result.clientSecret).toBe('pi_test_abc_secret_xyz');
      expect(result.orderId).toBe('order-pi-1');
      expect(result.numeroPedido).toBe('PED-PI-001');
      expect(stripe.paymentIntents.create).toHaveBeenCalledWith(
        expect.objectContaining({ currency: 'eur', customer: 'cus_test_123' })
      );
    });

    it('throws when cart is empty', async () => {
      const { supabaseAdmin } = await import('../../src/config/supabase.js');
      const fromMock = vi.mocked(supabaseAdmin.from);

      fromMock.mockReturnValueOnce({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockResolvedValue({ data: [], error: null }),
      } as any);

      const { createPaymentIntent } = await import('../../src/services/paymentService.js');

      await expect(
        createPaymentIntent({
          userId: 'user-empty',
          email: 'user@test.com',
          shippingAddressId: 'addr-1',
          paisImpuesto: 'ES',
          saveCard: false,
        })
      ).rejects.toThrow('El carrito está vacío');
    });

    it('throws when product has insufficient stock', async () => {
      const { supabaseAdmin } = await import('../../src/config/supabase.js');
      const fromMock = vi.mocked(supabaseAdmin.from);

      const cartItems = [
        {
          id: 'ci-1',
          product_id: 'prod-out',
          cantidad: 5,
          opciones: {},
          product: { id: 'prod-out', nombre: 'Sin Stock', precio: 10.0, stock: 1 },
        },
      ];

      fromMock.mockReturnValueOnce({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockResolvedValue({ data: cartItems, error: null }),
      } as any);

      const { createPaymentIntent } = await import('../../src/services/paymentService.js');

      await expect(
        createPaymentIntent({
          userId: 'user-1',
          email: 'user@test.com',
          shippingAddressId: 'addr-1',
          paisImpuesto: 'ES',
          saveCard: false,
        })
      ).rejects.toThrow('Stock insuficiente');
    });

    it('sets setup_future_usage when saveCard is true', async () => {
      const { supabaseAdmin } = await import('../../src/config/supabase.js');
      const { stripe } = await import('../../src/config/stripe.js');
      const fromMock = vi.mocked(supabaseAdmin.from);

      const cartItems = [
        {
          id: 'ci-1',
          product_id: 'prod-1',
          cantidad: 1,
          opciones: {},
          product: { id: 'prod-1', nombre: 'Producto', precio: 20.0, stock: 5 },
        },
      ];

      fromMock.mockReturnValueOnce({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockResolvedValue({ data: cartItems, error: null }),
      } as any);

      fromMock.mockReturnValueOnce(
        makeSelectChain({ data: { stripe_customer_id: 'cus_456' }, error: null }) as any
      );

      const order = { id: 'order-sc', numero_pedido: 'PED-SC', user_id: 'user-1', estado: 'pendiente', subtotal: 20, total: 34.19 };

      fromMock.mockReturnValueOnce({
        insert: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({ data: order, error: null }),
          }),
        }),
      } as any);

      fromMock.mockReturnValueOnce({
        insert: vi.fn().mockResolvedValue({ error: null }),
      } as any);

      vi.mocked(stripe.paymentIntents.create).mockResolvedValueOnce({
        id: 'pi_sc',
        client_secret: 'pi_sc_secret',
      } as any);

      fromMock.mockReturnValueOnce({
        update: vi.fn().mockReturnValue({ eq: vi.fn().mockResolvedValue({ error: null }) }),
      } as any);

      const { createPaymentIntent } = await import('../../src/services/paymentService.js');
      await createPaymentIntent({
        userId: 'user-1',
        email: 'user@test.com',
        shippingAddressId: 'addr-1',
        paisImpuesto: 'ES',
        saveCard: true,
      });

      expect(stripe.paymentIntents.create).toHaveBeenCalledWith(
        expect.objectContaining({ setup_future_usage: 'off_session' })
      );
    });
  });

  describe('handlePaymentSuccess — webhook marks order as paid', () => {
    it('updates order estado to pagado and clears cart', async () => {
      const { supabaseAdmin } = await import('../../src/config/supabase.js');
      const { clearCart } = await import('../../src/services/cartService.js');
      const fromMock = vi.mocked(supabaseAdmin.from);

      const updatedOrder = { id: 'order-1', user_id: 'user-1', estado: 'pagado' };

      // 1. Update order to pagado — chain: update().eq().eq().select().single()
      const singleUpdate = vi.fn().mockResolvedValue({ data: updatedOrder, error: null });
      const selectAfterEq = vi.fn().mockReturnValue({ single: singleUpdate });
      const eq2 = vi.fn().mockReturnValue({ select: selectAfterEq });
      const eq1 = vi.fn().mockReturnValue({ eq: eq2 });
      fromMock.mockReturnValueOnce({ update: vi.fn().mockReturnValue({ eq: eq1 }) } as any);

      // 2. Get order_items: select().eq() resolves
      fromMock.mockReturnValueOnce({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockResolvedValue({
          data: [{ product_id: 'prod-1', cantidad: 2 }],
          error: null,
        }),
      } as any);

      // 3. inventory_movements insert
      fromMock.mockReturnValueOnce({
        insert: vi.fn().mockResolvedValue({ error: null }),
      } as any);

      // 4. orders select for points subtotal
      fromMock.mockReturnValueOnce(
        makeSelectChain({ data: { subtotal: 20 }, error: null }) as any
      );

      // 5. orders select for coupon_id
      fromMock.mockReturnValueOnce(
        makeSelectChain({ data: { coupon_id: null }, error: null }) as any
      );

      // 6. orders select for email (fullOrder)
      fromMock.mockReturnValueOnce(
        makeSelectChain({ data: updatedOrder, error: null }) as any
      );

      // 7. order_items for email: select().eq() resolves
      fromMock.mockReturnValueOnce({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockResolvedValue({
          data: [{ id: 'oi-1', product: { nombre: 'Producto' } }],
          error: null,
        }),
      } as any);

      // 8. profile for email
      fromMock.mockReturnValueOnce(
        makeSelectChain({ data: { nombre: 'Juan', apellidos: 'Garcia' }, error: null }) as any
      );

      vi.mocked(supabaseAdmin.auth.admin.getUserById).mockResolvedValue({
        data: { user: { id: 'user-1', email: 'juan@test.com' } },
        error: null,
      } as any);

      // 9. orders select for invoice
      fromMock.mockReturnValueOnce(
        makeSelectChain({ data: updatedOrder, error: null }) as any
      );

      // 10. admin alert — orders select
      fromMock.mockReturnValueOnce(
        makeSelectChain({
          data: { ...updatedOrder, shipping_address_id: 'addr-1', total: 34.19, gastos_envio: 9.99, numero_pedido: 'PED-001' },
          error: null,
        }) as any
      );

      // 11. admin alert — order_items: select().eq() resolves
      fromMock.mockReturnValueOnce({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockResolvedValue({ data: [], error: null }),
      } as any);

      // 12. admin alert — address: select().eq().single()
      fromMock.mockReturnValueOnce(
        makeSelectChain({ data: null, error: null }) as any
      );

      const { handlePaymentSuccess } = await import('../../src/services/paymentService.js');
      await handlePaymentSuccess({
        id: 'pi_test_123',
        metadata: { orderId: 'order-1', numeroPedido: 'PED-001', userId: 'user-1' },
      } as any);

      expect(clearCart).toHaveBeenCalledWith('user-1');
    });

    it('is idempotent — does nothing if order already processed', async () => {
      const { supabaseAdmin } = await import('../../src/config/supabase.js');
      const { clearCart } = await import('../../src/services/cartService.js');
      const fromMock = vi.mocked(supabaseAdmin.from);

      // Update returns null — order already processed (not in pendiente state)
      const singleFn = vi.fn().mockResolvedValue({ data: null, error: { code: 'PGRST116' } });
      const selectFn = vi.fn().mockReturnValue({ single: singleFn });
      const eq2 = vi.fn().mockReturnValue({ select: selectFn });
      const eq1 = vi.fn().mockReturnValue({ eq: eq2 });
      fromMock.mockReturnValueOnce({ update: vi.fn().mockReturnValue({ eq: eq1 }) } as any);

      const { handlePaymentSuccess } = await import('../../src/services/paymentService.js');
      await handlePaymentSuccess({
        id: 'pi_already_done',
        metadata: { orderId: 'order-already-processed', numeroPedido: 'PED-OLD', userId: 'user-1' },
      } as any);

      expect(clearCart).not.toHaveBeenCalled();
    });

    it('skips processing when orderId is missing from metadata', async () => {
      const { clearCart } = await import('../../src/services/cartService.js');

      const { handlePaymentSuccess } = await import('../../src/services/paymentService.js');
      await handlePaymentSuccess({
        id: 'pi_no_order',
        metadata: {},
      } as any);

      expect(clearCart).not.toHaveBeenCalled();
    });
  });

  describe('handlePaymentFailure', () => {
    it('marks order as fallido when payment fails', async () => {
      const { supabaseAdmin } = await import('../../src/config/supabase.js');
      const fromMock = vi.mocked(supabaseAdmin.from);

      // Select order: select().eq().single()
      fromMock.mockReturnValueOnce(
        makeSelectChain({ data: { id: 'order-fail', estado: 'pendiente' }, error: null }) as any
      );

      // Update to fallido: update().eq()
      fromMock.mockReturnValueOnce({
        update: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({ error: null }),
        }),
      } as any);

      const { handlePaymentFailure } = await import('../../src/services/paymentService.js');
      await handlePaymentFailure({
        id: 'pi_failed',
        metadata: { orderId: 'order-fail' },
      } as any);

      expect(fromMock).toHaveBeenCalledWith('orders');
    });

    it('does nothing when order is not pendiente', async () => {
      const { supabaseAdmin } = await import('../../src/config/supabase.js');
      const fromMock = vi.mocked(supabaseAdmin.from);

      // Select — returns paid order
      fromMock.mockReturnValueOnce(
        makeSelectChain({ data: { id: 'order-paid', estado: 'pagado' }, error: null }) as any
      );

      const { handlePaymentFailure } = await import('../../src/services/paymentService.js');
      await handlePaymentFailure({
        id: 'pi_already_paid',
        metadata: { orderId: 'order-paid' },
      } as any);

      // Only 1 from() call (the select) — no update
      expect(fromMock).toHaveBeenCalledTimes(1);
    });
  });

  describe('getOrCreateStripeCustomer', () => {
    it('returns existing Stripe customer ID from profile', async () => {
      const { supabaseAdmin } = await import('../../src/config/supabase.js');
      const { stripe } = await import('../../src/config/stripe.js');
      const fromMock = vi.mocked(supabaseAdmin.from);

      fromMock.mockReturnValueOnce(
        makeSelectChain({ data: { stripe_customer_id: 'cus_existing_abc' }, error: null }) as any
      );

      const { getOrCreateStripeCustomer } = await import('../../src/services/paymentService.js');
      const result = await getOrCreateStripeCustomer('user-1', 'user@test.com');

      expect(result).toBe('cus_existing_abc');
      // stripe.customers.create should NOT have been called
      expect(stripe.customers.create).not.toHaveBeenCalled();
    });

    it('creates new Stripe customer and stores ID when not present', async () => {
      const { supabaseAdmin } = await import('../../src/config/supabase.js');
      const { stripe } = await import('../../src/config/stripe.js');
      const fromMock = vi.mocked(supabaseAdmin.from);

      // Profile with no stripe_customer_id
      fromMock.mockReturnValueOnce(
        makeSelectChain({ data: { stripe_customer_id: null }, error: null }) as any
      );

      // Update profile after creating customer
      fromMock.mockReturnValueOnce({
        update: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({ error: null }),
        }),
      } as any);

      vi.mocked(stripe.customers.create).mockResolvedValueOnce({
        id: 'cus_brand_new',
      } as any);

      const { getOrCreateStripeCustomer } = await import('../../src/services/paymentService.js');
      const result = await getOrCreateStripeCustomer('user-new', 'new@test.com');

      expect(result).toBe('cus_brand_new');
      expect(stripe.customers.create).toHaveBeenCalledWith({
        email: 'new@test.com',
        metadata: { userId: 'user-new' },
      });
    });
  });
});

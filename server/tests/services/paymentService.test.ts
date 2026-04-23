import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock Stripe before importing the service
vi.mock('../../src/config/stripe.js', () => ({
  stripe: {
    customers: {
      create: vi.fn(),
    },
    paymentIntents: {
      create: vi.fn(),
    },
    refunds: {
      create: vi.fn(),
    },
    webhooks: {
      constructEvent: vi.fn(),
    },
  },
}));

// Mock Supabase
vi.mock('../../src/config/supabase.js', () => {
  const mockChain = () => {
    const chain: any = {
      select: vi.fn().mockReturnThis(),
      insert: vi.fn().mockReturnThis(),
      update: vi.fn().mockReturnThis(),
      delete: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: null, error: null }),
      maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
    };
    return chain;
  };
  return {
    supabaseAdmin: {
      from: vi.fn().mockReturnValue(mockChain()),
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

describe('paymentService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getOrCreateStripeCustomer', () => {
    it('returns existing customer ID if present in profile', async () => {
      const { supabaseAdmin } = await import('../../src/config/supabase.js');
      const fromMock = vi.mocked(supabaseAdmin.from);
      fromMock.mockReturnValueOnce({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: { stripe_customer_id: 'cus_existing123' },
          error: null,
        }),
      } as any);

      const { getOrCreateStripeCustomer } = await import('../../src/services/paymentService.js');
      const result = await getOrCreateStripeCustomer('user-1', 'test@test.com');
      expect(result).toBe('cus_existing123');
    });

    it('creates new Stripe customer if not present', async () => {
      const { supabaseAdmin } = await import('../../src/config/supabase.js');
      const { stripe } = await import('../../src/config/stripe.js');

      const fromMock = vi.mocked(supabaseAdmin.from);
      // First call: select profile — no stripe_customer_id
      fromMock.mockReturnValueOnce({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: { stripe_customer_id: null },
          error: null,
        }),
      } as any);
      // Second call: update profile
      fromMock.mockReturnValueOnce({
        update: vi.fn().mockReturnThis(),
        eq: vi.fn().mockResolvedValue({ error: null }),
      } as any);

      vi.mocked(stripe.customers.create).mockResolvedValueOnce({
        id: 'cus_new456',
      } as any);

      const { getOrCreateStripeCustomer } = await import('../../src/services/paymentService.js');
      const result = await getOrCreateStripeCustomer('user-2', 'new@test.com');
      expect(result).toBe('cus_new456');
      expect(stripe.customers.create).toHaveBeenCalledWith({
        email: 'new@test.com',
        metadata: { userId: 'user-2' },
      });
    });
  });

  describe('handlePaymentFailure', () => {
    it('marks order as fallido when payment fails', async () => {
      const { supabaseAdmin } = await import('../../src/config/supabase.js');
      const fromMock = vi.mocked(supabaseAdmin.from);

      // Select order
      fromMock.mockReturnValueOnce({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: { id: 'order-1', estado: 'pendiente' },
          error: null,
        }),
      } as any);

      // Update order
      fromMock.mockReturnValueOnce({
        update: vi.fn().mockReturnThis(),
        eq: vi.fn().mockResolvedValue({ error: null }),
      } as any);

      const { handlePaymentFailure } = await import('../../src/services/paymentService.js');
      await handlePaymentFailure({
        metadata: { orderId: 'order-1' },
      } as any);

      expect(fromMock).toHaveBeenCalledWith('orders');
    });
  });
});

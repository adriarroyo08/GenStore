import { describe, it, expect, vi, beforeEach } from 'vitest';

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
    },
  };
});

describe('cartService', () => {
  beforeEach(() => {
    // resetAllMocks clears the mockReturnValueOnce queue (clearAllMocks does not)
    vi.resetAllMocks();
  });

  describe('getCart', () => {
    it('returns cart items for user', async () => {
      const { supabaseAdmin } = await import('../../src/config/supabase.js');
      const fromMock = vi.mocked(supabaseAdmin.from);

      const fakeItems = [
        {
          id: 'item-1',
          user_id: 'user-123',
          product_id: 'prod-1',
          cantidad: 2,
          opciones: {},
          product: { id: 'prod-1', nombre: 'Producto Test', precio: 19.99, stock: 10 },
        },
      ];

      fromMock.mockReturnValueOnce({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockResolvedValue({ data: fakeItems, error: null }),
      } as any);

      const { getCart } = await import('../../src/services/cartService.js');
      const result = await getCart('user-123');

      expect(fromMock).toHaveBeenCalledWith('cart_items');
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('item-1');
    });

    it('returns empty array when cart is empty', async () => {
      const { supabaseAdmin } = await import('../../src/config/supabase.js');
      const fromMock = vi.mocked(supabaseAdmin.from);

      fromMock.mockReturnValueOnce({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockResolvedValue({ data: [], error: null }),
      } as any);

      const { getCart } = await import('../../src/services/cartService.js');
      const result = await getCart('user-empty');

      expect(result).toHaveLength(0);
    });

    it('throws when database returns an error', async () => {
      const { supabaseAdmin } = await import('../../src/config/supabase.js');
      const fromMock = vi.mocked(supabaseAdmin.from);

      fromMock.mockReturnValueOnce({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockResolvedValue({ data: null, error: { message: 'DB error' } }),
      } as any);

      const { getCart } = await import('../../src/services/cartService.js');

      await expect(getCart('user-123')).rejects.toThrow('DB error');
    });
  });

  describe('addToCart', () => {
    it('validates stock before adding — throws when insufficient', async () => {
      const { supabaseAdmin } = await import('../../src/config/supabase.js');
      const fromMock = vi.mocked(supabaseAdmin.from);

      // Product lookup — stock=1, request cantidad=5
      fromMock.mockReturnValueOnce({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: { stock: 1, activo: true },
          error: null,
        }),
      } as any);

      const { addToCart } = await import('../../src/services/cartService.js');

      await expect(addToCart('user-123', 'prod-1', 5)).rejects.toThrow('Stock insuficiente');
    });

    it('throws when product does not exist', async () => {
      const { supabaseAdmin } = await import('../../src/config/supabase.js');
      const fromMock = vi.mocked(supabaseAdmin.from);

      fromMock.mockReturnValueOnce({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: null,
          error: { message: 'Not found' },
        }),
      } as any);

      const { addToCart } = await import('../../src/services/cartService.js');

      await expect(addToCart('user-123', 'nonexistent-prod', 1)).rejects.toThrow('Producto no encontrado');
    });

    it('throws when product is inactive', async () => {
      const { supabaseAdmin } = await import('../../src/config/supabase.js');
      const fromMock = vi.mocked(supabaseAdmin.from);

      fromMock.mockReturnValueOnce({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: { stock: 10, activo: false },
          error: null,
        }),
      } as any);

      const { addToCart } = await import('../../src/services/cartService.js');

      await expect(addToCart('user-123', 'inactive-prod', 1)).rejects.toThrow('Producto no disponible');
    });

    it('inserts new cart item when product has sufficient stock', async () => {
      const { supabaseAdmin } = await import('../../src/config/supabase.js');
      const fromMock = vi.mocked(supabaseAdmin.from);

      // Product lookup — enough stock
      fromMock.mockReturnValueOnce({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: { stock: 10, activo: true },
          error: null,
        }),
      } as any);

      // Check existing item — none
      fromMock.mockReturnValueOnce({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
      } as any);

      const newItem = {
        id: 'item-new',
        user_id: 'user-123',
        product_id: 'prod-1',
        cantidad: 2,
        opciones: {},
        product: { id: 'prod-1', nombre: 'Producto Test', precio: 19.99 },
      };

      // Insert
      fromMock.mockReturnValueOnce({
        insert: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: newItem, error: null }),
      } as any);

      const { addToCart } = await import('../../src/services/cartService.js');
      const result = await addToCart('user-123', 'prod-1', 2);

      expect(result.id).toBe('item-new');
      expect(result.cantidad).toBe(2);
    });

    it('increments quantity when same product+options already in cart', async () => {
      const { supabaseAdmin } = await import('../../src/config/supabase.js');
      const fromMock = vi.mocked(supabaseAdmin.from);

      // Product — enough stock
      fromMock.mockReturnValueOnce({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: { stock: 10, activo: true },
          error: null,
        }),
      } as any);

      // Existing item — cantidad=2
      fromMock.mockReturnValueOnce({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        maybeSingle: vi.fn().mockResolvedValue({
          data: { id: 'item-existing', cantidad: 2 },
          error: null,
        }),
      } as any);

      const updatedItem = {
        id: 'item-existing',
        cantidad: 5,
        product: { nombre: 'Test', precio: 9.99 },
      };

      // Update
      fromMock.mockReturnValueOnce({
        update: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: updatedItem, error: null }),
      } as any);

      const { addToCart } = await import('../../src/services/cartService.js');
      const result = await addToCart('user-123', 'prod-1', 3);

      // 2 existing + 3 new = 5
      expect(result.cantidad).toBe(5);
    });
  });

  describe('removeCartItem', () => {
    it('deletes item matching both id and user_id (ownership check)', async () => {
      const { supabaseAdmin } = await import('../../src/config/supabase.js');
      const fromMock = vi.mocked(supabaseAdmin.from);

      // removeCartItem does: delete().eq(itemId).eq(userId)
      // The second .eq() call is the terminal one — must resolve
      const eqFinal = vi.fn().mockResolvedValue({ error: null });
      const eqFirst = vi.fn().mockReturnValue({ eq: eqFinal });
      fromMock.mockReturnValueOnce({
        delete: vi.fn().mockReturnValue({ eq: eqFirst }),
      } as any);

      const { removeCartItem } = await import('../../src/services/cartService.js');
      await expect(removeCartItem('user-123', 'item-1')).resolves.toBeUndefined();
    });

    it('throws when delete fails', async () => {
      const { supabaseAdmin } = await import('../../src/config/supabase.js');
      const fromMock = vi.mocked(supabaseAdmin.from);

      const eqFinal = vi.fn().mockResolvedValue({ error: { message: 'Delete failed' } });
      const eqFirst = vi.fn().mockReturnValue({ eq: eqFinal });
      fromMock.mockReturnValueOnce({
        delete: vi.fn().mockReturnValue({ eq: eqFirst }),
      } as any);

      const { removeCartItem } = await import('../../src/services/cartService.js');
      await expect(removeCartItem('user-123', 'item-1')).rejects.toThrow('Delete failed');
    });
  });

  describe('updateCartItem', () => {
    it('throws when item does not belong to user', async () => {
      const { supabaseAdmin } = await import('../../src/config/supabase.js');
      const fromMock = vi.mocked(supabaseAdmin.from);

      // Item ownership check — not found for this user
      fromMock.mockReturnValueOnce({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: null,
          error: { message: 'Not found', code: 'PGRST116' },
        }),
      } as any);

      const { updateCartItem } = await import('../../src/services/cartService.js');
      await expect(updateCartItem('user-other', 'item-1', 2)).rejects.toThrow('Item no encontrado');
    });

    it('throws when update would exceed stock', async () => {
      const { supabaseAdmin } = await import('../../src/config/supabase.js');
      const fromMock = vi.mocked(supabaseAdmin.from);

      // Item ownership — found
      fromMock.mockReturnValueOnce({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: { product_id: 'prod-1' },
          error: null,
        }),
      } as any);

      // Product stock — only 2
      fromMock.mockReturnValueOnce({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: { stock: 2 },
          error: null,
        }),
      } as any);

      const { updateCartItem } = await import('../../src/services/cartService.js');
      await expect(updateCartItem('user-123', 'item-1', 10)).rejects.toThrow('Stock insuficiente');
    });
  });

  describe('clearCart', () => {
    it('deletes all items for user', async () => {
      const { supabaseAdmin } = await import('../../src/config/supabase.js');
      const fromMock = vi.mocked(supabaseAdmin.from);

      fromMock.mockReturnValueOnce({
        delete: vi.fn().mockReturnThis(),
        eq: vi.fn().mockResolvedValue({ error: null }),
      } as any);

      const { clearCart } = await import('../../src/services/cartService.js');
      await expect(clearCart('user-123')).resolves.toBeUndefined();

      expect(fromMock).toHaveBeenCalledWith('cart_items');
    });
  });
});

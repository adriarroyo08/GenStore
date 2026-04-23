import { useState, useEffect, useCallback } from 'react';
import { apiClient } from '../lib/apiClient';
import { useAuthContext } from '../contexts/AuthContext';

interface CartProduct {
  id: string;
  nombre: string;
  slug: string;
  precio: number;
  imagenes: string[];
  stock: number;
  marca?: string;
  descripcion?: string;
  categories?: { nombre: string } | null;
}

interface ServerCartItem {
  id: string;
  product_id: string;
  cantidad: number;
  opciones: Record<string, unknown>;
  product: CartProduct;
}

export function useCart() {
  const { isAuthenticated } = useAuthContext();
  const [cart, setCart] = useState<ServerCartItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const loadCart = useCallback(async () => {
    if (!isAuthenticated) { setCart([]); return; }
    setIsLoading(true);
    try {
      const items = await apiClient.get<ServerCartItem[]>('/cart');
      setCart(items);
    } catch { setCart([]); }
    finally { setIsLoading(false); }
  }, [isAuthenticated]);

  useEffect(() => { loadCart(); }, [loadCart]);

  const addToCart = useCallback(async (productOrId: any, selectedColor?: string, selectedColorName?: string) => {
    const productId = typeof productOrId === 'string' ? productOrId : productOrId?.id;
    if (!productId) throw new Error('Producto no válido');
    const opciones: Record<string, unknown> = {};
    if (selectedColor) opciones.color = selectedColor;
    if (selectedColorName) opciones.colorName = selectedColorName;
    await apiClient.post('/cart', { productId, cantidad: 1, opciones });
    await loadCart();
  }, [loadCart]);

  const updateQuantity = useCallback(async (itemId: string, cantidad: number) => {
    if (cantidad < 1) { await removeFromCart(itemId); return; }
    await apiClient.put(`/cart/${itemId}`, { cantidad });
    await loadCart();
  }, [loadCart]);

  const removeFromCart = useCallback(async (itemId: string) => {
    await apiClient.delete(`/cart/${itemId}`);
    await loadCart();
  }, [loadCart]);

  const clearCart = useCallback(async () => {
    await apiClient.delete('/cart');
    setCart([]);
  }, []);

  // Map server items to CartItem format (English field names for frontend)
  const mappedCart = cart.map((item) => ({
    id: item.id,
    productId: item.product_id,
    name: item.product.nombre,
    price: item.product.precio,
    image: item.product.imagenes?.[0] || '',
    category: item.product.categories?.nombre ?? '',
    brand: item.product.marca ?? '',
    rating: 0,
    reviews: 0,
    description: item.product.descripcion ?? '',
    stock: item.product.stock,
    quantity: item.cantidad,
    selectedColor: (item.opciones?.color as string) || undefined,
    selectedColorName: (item.opciones?.colorName as string) || undefined,
  }));

  const cartTotal = mappedCart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const cartCount = mappedCart.reduce((sum, item) => sum + item.quantity, 0);

  return { cart: mappedCart as any, cartTotal, cartCount, cartItemsCount: cartCount, isLoading, addToCart, updateQuantity, removeFromCart, clearCart, loadCart };
}

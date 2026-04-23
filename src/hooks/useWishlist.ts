import { useState, useEffect, useCallback, useMemo } from 'react';
import { apiClient } from '../lib/apiClient';
import { useAuthContext } from '../contexts/AuthContext';

interface WishlistEntry {
  id: string;
  product_id: string;
  product: { id: string; nombre: string; slug: string; precio: number; imagenes: string[]; rating: number };
}

export function useWishlist() {
  const { isAuthenticated } = useAuthContext();
  const [entries, setEntries] = useState<WishlistEntry[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Expose product IDs as string[] for downstream components
  const wishlist = useMemo(() => entries.map(e => e.product_id), [entries]);

  const loadWishlist = useCallback(async () => {
    if (!isAuthenticated) { setEntries([]); return; }
    setIsLoading(true);
    try {
      const data = await apiClient.get<WishlistEntry[]>('/wishlist');
      setEntries(Array.isArray(data) ? data : []);
    } catch { setEntries([]); }
    finally { setIsLoading(false); }
  }, [isAuthenticated]);

  useEffect(() => { loadWishlist(); }, [loadWishlist]);

  // Accept both a product ID string or a Product object (with .id)
  const toggleWishlist = useCallback(async (productOrId: string | { id: string }) => {
    const productId = typeof productOrId === 'string' ? productOrId : productOrId.id;
    const exists = entries.some(w => w.product_id === productId);
    try {
      if (exists) {
        // Optimistic removal
        setEntries(prev => prev.filter(w => w.product_id !== productId));
        await apiClient.delete(`/wishlist/${productId}`);
      } else {
        // Optimistic addition (minimal entry for the ID list)
        setEntries(prev => [...prev, { id: '', product_id: productId, product: {} as any }]);
        await apiClient.post(`/wishlist/${productId}`);
      }
      // Reload for accurate data
      await loadWishlist();
    } catch {
      // Revert on error
      await loadWishlist();
    }
  }, [entries, loadWishlist]);

  const isInWishlist = useCallback((productId: string) => {
    return entries.some(w => w.product_id === productId);
  }, [entries]);

  const clearWishlist = useCallback(async () => {
    const ids = entries.map(e => e.product_id);
    setEntries([]);
    try {
      await Promise.all(ids.map(id => apiClient.delete(`/wishlist/${id}`)));
    } catch {
      await loadWishlist();
    }
  }, [entries, loadWishlist]);

  // setWishlist is used by App.tsx — allow setting product IDs directly
  const setWishlist = useCallback((ids: string[]) => {
    setEntries(ids.map(id => ({ id: '', product_id: id, product: {} as any })));
  }, []);

  return { wishlist, entries, isLoading, toggleWishlist, isInWishlist, clearWishlist, loadWishlist, setWishlist };
}

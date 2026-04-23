import { useMemo, useState, useRef, useEffect } from 'react';
import { useLanguage } from '../contexts/LanguageContext';
const staticProducts: any[] = [];
import { apiClient } from '../lib/apiClient';

export function useTranslatedProductsSafe() {
  const { t } = useLanguage();
  const [adminProducts, setAdminProducts] = useState([]);
  const [isLoadingAdminProducts, setIsLoadingAdminProducts] = useState(false);
  const hasAttemptedFetch = useRef(false);
  
  const fetchAdminProducts = async () => {
    if (hasAttemptedFetch.current || isLoadingAdminProducts) return;
    hasAttemptedFetch.current = true;

    setIsLoadingAdminProducts(true);

    try {
      const result = await apiClient.get<any>('/products');
      const raw = Array.isArray(result.data) ? result.data : Array.isArray(result.products) ? result.products : [];
      if (raw.length > 0) {
        const mapped = raw.map((p: any) => ({
          ...p,
          name: p.nombre ?? p.name ?? '',
          description: p.descripcion ?? p.description ?? '',
          price: p.precio ?? p.price ?? 0,
          originalPrice: p.precio_original ?? p.originalPrice ?? null,
          onSale: p.en_oferta ?? p.onSale ?? false,
          discount: p.porcentaje_descuento ?? p.discount ?? 0,
          brand: p.marca ?? p.brand ?? '',
          category: p.categories?.nombre ?? p.category ?? '',
          categorySlug: p.categories?.slug ?? '',
          image: p.imagenes?.[0] ?? p.images?.[0] ?? p.image ?? '',
          images: p.imagenes ?? p.images ?? [],
          rating: p.rating ?? 0,
          reviews: p.review_count ?? p.reviews ?? 0,
          stock: p.stock ?? 0,
          features: p.features ?? [],
          colors: p.colors ?? [],
          tags: p.tags ?? [],
        }));
        console.log(`✅ Loaded ${mapped.length} products`);
        setAdminProducts(mapped);
      }
    } catch (error: any) {
      console.log('⚠️ Products fetch failed:', error.message);
    } finally {
      setIsLoadingAdminProducts(false);
    }
  };

  // Auto-fetch on mount
  useEffect(() => {
    if (!hasAttemptedFetch.current) {
      fetchAdminProducts();
    }
  }, []);

  const triggerAdminProductsFetch = () => {
    if (!hasAttemptedFetch.current && !isLoadingAdminProducts) {
      fetchAdminProducts();
    }
  };
  
  return useMemo(() => {
    // Always process static products first for reliable startup
    const processedStaticProducts = staticProducts?.map(product => {
      if (!product) return null;
      
      try {
        return {
          ...product,
          name: product.nameKey ? t(product.nameKey) : (product.name || 'Producto'),
          description: product.descriptionKey ? t(product.descriptionKey) : (product.description || ''),
          category: product.category || 'general',
          brand: product.brand || '',
          id: product.id || `static_${Math.random().toString(36).substr(2, 9)}`,
          price: product.price || 0,
          rating: product.rating || 0,
          reviews: product.reviews || 0,
          image: product.image || '',
          source: 'static' // Mark as static product
        };
      } catch (error) {
        console.warn('Error processing static product:', error);
        return null;
      }
    }).filter(Boolean) || [];

    // Only process admin products if they loaded successfully
    const processedAdminProducts = adminProducts?.length > 0 ? adminProducts.map(product => {
      if (!product) return null;
      
      try {
        const imageUrl = (product.images && product.images[0]) || product.image || '';
        
        return {
          ...product,
          name: product.name || 'Admin Product',
          description: product.description || product.shortDescription || '',
          category: product.category || 'general',
          brand: product.brand || '',
          id: product.id || `admin_${Math.random().toString(36).substr(2, 9)}`,
          price: product.price || 0,
          rating: product.rating || 0,
          reviews: product.reviews || 0,
          image: imageUrl,
          additionalImages: product.images && product.images.length > 1 ? product.images.slice(1) : [],
          colors: product.colors || [],
          features: product.features || [],
          source: 'admin' // Mark as admin product
        };
      } catch (error) {
        console.warn('Error processing admin product:', error);
        return null;
      }
    }).filter(Boolean) : [];

    // Combine products - static products are always available
    const allProducts = [...processedStaticProducts, ...processedAdminProducts];
    
    // Add helper functions to the array
    (allProducts as any).triggerAdminProductsFetch = triggerAdminProductsFetch;
    (allProducts as any).isLoadingAdminProducts = isLoadingAdminProducts;
    (allProducts as any).hasAttemptedAdminFetch = hasAttemptedFetch.current;
    
    console.log(`📊 Products ready: ${processedStaticProducts.length} static, ${processedAdminProducts.length} admin`);
    
    return allProducts;
  }, [t, adminProducts, isLoadingAdminProducts, triggerAdminProductsFetch]);
}
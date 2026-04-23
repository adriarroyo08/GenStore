import { useMemo, useState, useEffect } from 'react';
import { useLanguage } from '../contexts/LanguageContext';
const staticProducts: any[] = [];
import { apiClient } from '../lib/apiClient';

export function useTranslatedProducts() {
  const { t } = useLanguage();
  const [adminProducts, setAdminProducts] = useState([]);
  const [isLoadingAdminProducts, setIsLoadingAdminProducts] = useState(true);
  
  // Fetch admin products on component mount with error handling and fallbacks
  useEffect(() => {
    const fetchAdminProducts = async () => {
      try {
        const result = await apiClient.get<any>('/products?pageSize=500');

        // API returns { data: [...], total, page, ... }
        const raw = Array.isArray(result.data) ? result.data : Array.isArray(result.products) ? result.products : [];
        // Map Spanish DB fields to English UI fields
        const mapped = raw.map((p: any) => ({
          ...p,
          name: p.nombre ?? p.name ?? '',
          description: p.descripcion ?? p.description ?? '',
          price: p.precio ?? p.price ?? 0,
          originalPrice: p.precio_original ?? p.originalPrice ?? null,
          onSale: p.en_oferta ?? p.onSale ?? false,
          discount: p.porcentaje_descuento ?? p.discount ?? 0,
          salePercentage: p.porcentaje_descuento ?? p.salePercentage ?? null,
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
        if (mapped.length > 0) {
          setAdminProducts(mapped);
        } else {
          setAdminProducts([]);
        }
      } catch (error) {
        setAdminProducts([]);
      } finally {
        setIsLoadingAdminProducts(false);
      }
    };

    fetchAdminProducts();
  }, []);
  
  return useMemo(() => {
    // Process static products
    const processedStaticProducts = staticProducts?.map(product => {
      if (!product) return null;
      
      return {
        ...product,
        name: product.nameKey ? t(product.nameKey) : (product.name || ''),
        description: product.descriptionKey ? t(product.descriptionKey) : (product.description || ''),
        category: product.category || '',
        brand: product.brand || '',
        id: product.id || '',
        price: product.price || 0,
        rating: product.rating || 0,
        reviews: product.reviews || 0,
        image: product.image || '',
        source: 'static' // Mark as static product
      };
    }).filter(Boolean) || [];

    // Process admin products
    const processedAdminProducts = adminProducts?.map(product => {
      if (!product) return null;
      
      const imageUrl = (product.images && product.images[0]) || product.image || '';
      
      return {
        ...product,
        // Admin products should already have the correct name/description
        name: product.name || '',
        description: product.description || product.shortDescription || '',
        category: product.category || '',
        brand: product.brand || '',
        id: product.id || '',
        price: product.price || 0,
        rating: product.rating || 0,
        reviews: product.reviews || 0,
        image: imageUrl,
        additionalImages: product.images && product.images.length > 1 ? product.images.slice(1) : [],
        colors: product.colors || [],
        features: product.features || [],
        source: 'admin' // Mark as admin product
      };
    }).filter(Boolean) || [];

    // Combine both arrays
    const allProducts = [...processedStaticProducts, ...processedAdminProducts];

    return allProducts;
  }, [t, adminProducts, isLoadingAdminProducts]);
}
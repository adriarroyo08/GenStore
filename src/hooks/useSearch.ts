import { useState, useCallback } from 'react';
import { apiClient } from '../lib/apiClient';

interface ProductResult {
  id: string;
  nombre: string;
  slug: string;
  precio: number;
  precio_original: number | null;
  en_oferta: boolean;
  imagenes: string[];
  rating: number;
  review_count: number;
  marca: string | null;
  category_id: string | null;
}

interface SearchResult {
  data: ProductResult[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export function useSearch() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [results, setResults] = useState<SearchResult>({ data: [], total: 0, page: 1, pageSize: 20, totalPages: 0 });
  const [isLoading, setIsLoading] = useState(false);

  const search = useCallback(async (params?: { q?: string; category?: string; page?: number }) => {
    setIsLoading(true);
    try {
      const queryParams = new URLSearchParams();
      const q = params?.q ?? searchQuery;
      const cat = params?.category ?? selectedCategory;
      if (q) queryParams.set('q', q);
      if (cat) queryParams.set('category', cat);
      if (params?.page) queryParams.set('page', String(params.page));

      const data = await apiClient.get<SearchResult>(`/products?${queryParams}`);
      setResults(data);
    } catch { setResults({ data: [], total: 0, page: 1, pageSize: 20, totalPages: 0 }); }
    finally { setIsLoading(false); }
  }, [searchQuery, selectedCategory]);

  const clearFilters = useCallback(() => {
    setSearchQuery('');
    setSelectedCategory(null);
  }, []);

  return {
    searchQuery, setSearchQuery,
    selectedCategory, setSelectedCategory,
    results, isLoading,
    search, clearFilters,
    filteredProducts: results.data,
  };
}

import React, { useState, useEffect } from 'react';
import { Loader2, Package, Search, Eye, Trash2, RefreshCw, Database } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import { useCurrency } from '../contexts/CurrencyContext';
import { Product } from '../types';
import { apiClient } from '../lib/apiClient';

interface ProductDatabaseViewerProps {
  onBack: () => void;
}

export function ProductDatabaseViewer({ onBack }: ProductDatabaseViewerProps) {
  const { t } = useLanguage();
  const { currency, convertPrice } = useCurrency();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [refreshing, setRefreshing] = useState(false);

  const loadProducts = async () => {
    try {
      setLoading(true);
      setError('');

      const data = await apiClient.get<any>('/admin/products');
      
      if (data.success && Array.isArray(data.products)) {
        setProducts(data.products);
      } else {
        setProducts([]);
      }
      
    } catch (err: any) {
      console.error('Error loading products:', err);
      setError(`Error al cargar productos: ${err.message}`);
      setProducts([]);
    } finally {
      setLoading(false);
    }
  };

  const refreshProducts = async () => {
    setRefreshing(true);
    await loadProducts();
    setRefreshing(false);
  };

  useEffect(() => {
    loadProducts();
  }, []);

  // Get unique categories
  const categories = React.useMemo(() => {
    const cats = new Set(products.map(p => p.category));
    return Array.from(cats).sort();
  }, [products]);

  // Filter products
  const filteredProducts = React.useMemo(() => {
    return products.filter(product => {
      const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           product.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           product.id.toString().includes(searchTerm);
      
      const matchesCategory = selectedCategory === 'all' || product.category === selectedCategory;
      
      return matchesSearch && matchesCategory;
    });
  }, [products, searchTerm, selectedCategory]);

  // Get statistics
  const stats = React.useMemo(() => {
    return {
      total: products.length,
      inStock: products.filter(p => p.stock > 0).length,
      outOfStock: products.filter(p => p.stock === 0).length,
      categories: categories.length,
      averagePrice: products.length > 0 ? products.reduce((sum, p) => sum + p.price, 0) / products.length : 0
    };
  }, [products, categories]);

  const deleteProduct = async (productId: string) => {
    // Find the product to get its name
    const product = products.find(p => p.id.toString() === productId);
    const productName = product ? product.name : 'Producto';
    
    if (!confirm(`¿Estás seguro de que quieres eliminar el producto "${productName}"?\n\nEsta acción no se puede deshacer.`)) {
      return;
    }

    try {
      const result = await apiClient.delete<any>(`/admin/products/${productId}`);

      if (result.success) {
        await refreshProducts();
      } else {
        throw new Error(result.error || 'Failed to delete product');
      }
    } catch (err: any) {
      console.error('Error deleting product:', err);
      setError(`Error al eliminar producto: ${err.message}`);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen w-full bg-background flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Cargando productos de la base de datos...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full bg-background">
      {/* Header */}
      <div className="bg-card border-b border-border sticky top-0 z-10">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button
                onClick={onBack}
                className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 20 20" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.67} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
                <span className="hidden sm:block">Volver</span>
              </button>
              <Database className="w-6 h-6 text-primary" />
              <h1 className="font-bold text-xl text-foreground">
                Productos en Base de Datos
              </h1>
            </div>
            
            <button
              onClick={refreshProducts}
              disabled={refreshing}
              className="flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-lg hover:bg-primary/90 transition-colors"
            >
              <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
              <span className="hidden sm:block">Actualizar</span>
            </button>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {error && (
          <div className="bg-destructive/10 border border-destructive/20 text-destructive px-4 py-3 rounded-lg mb-6">
            {error}
          </div>
        )}

        {/* Statistics */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
          <div className="bg-card border border-border rounded-lg p-4 text-center">
            <div className="text-2xl font-bold text-foreground">{stats.total}</div>
            <div className="text-sm text-muted-foreground">Total Productos</div>
          </div>
          <div className="bg-card border border-border rounded-lg p-4 text-center">
            <div className="text-2xl font-bold text-green-600">{stats.inStock}</div>
            <div className="text-sm text-muted-foreground">En Stock</div>
          </div>
          <div className="bg-card border border-border rounded-lg p-4 text-center">
            <div className="text-2xl font-bold text-red-600">{stats.outOfStock}</div>
            <div className="text-sm text-muted-foreground">Sin Stock</div>
          </div>
          <div className="bg-card border border-border rounded-lg p-4 text-center">
            <div className="text-2xl font-bold text-blue-600">{stats.categories}</div>
            <div className="text-sm text-muted-foreground">Categorías</div>
          </div>
          <div className="bg-card border border-border rounded-lg p-4 text-center">
            <div className="text-2xl font-bold text-purple-600">
              {currency === 'EUR' ? '€' : '$'}{convertPrice(stats.averagePrice).toFixed(0)}
            </div>
            <div className="text-sm text-muted-foreground">Precio Promedio</div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-card border border-border rounded-lg p-4 mb-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                <input
                  type="text"
                  placeholder="Buscar productos por nombre, descripción o ID..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-border rounded-lg bg-input-background text-foreground placeholder:text-muted-foreground focus:border-ring outline-none"
                />
              </div>
            </div>
            <div className="sm:w-48">
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="w-full px-3 py-2 border border-border rounded-lg bg-input-background text-foreground focus:border-ring outline-none"
              >
                <option value="all">Todas las categorías</option>
                {categories.map(category => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Products List */}
        {filteredProducts.length === 0 ? (
          <div className="text-center py-12">
            <Package className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
            <p className="text-xl font-medium text-foreground mb-2">
              {products.length === 0 ? 'No hay productos en la base de datos' : 'No se encontraron productos'}
            </p>
            <p className="text-muted-foreground">
              {products.length === 0 
                ? 'La base de datos está vacía o hay un error en la conexión.'
                : 'Intenta cambiar los filtros de búsqueda.'
              }
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredProducts.map((product) => (
              <div key={product.id} className="bg-card border border-border rounded-lg p-4 hover:shadow-md transition-shadow">
                <div className="flex items-start gap-4">
                  {/* Product Image */}
                  <div className="w-20 h-20 bg-muted rounded-lg overflow-hidden flex-shrink-0">
                    {product.images && product.images[0] ? (
                      <img
                        src={product.images[0]}
                        alt={product.name}
                        className="w-full h-full object-contain"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.style.display = 'none';
                        }}
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Package className="w-8 h-8 text-muted-foreground" />
                      </div>
                    )}
                  </div>

                  {/* Product Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h3 className="font-medium text-foreground truncate">
                          {product.name}
                        </h3>
                        <p className="text-sm text-muted-foreground mt-1">
                          ID: {product.id}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          Categoría: <span className="font-medium">{product.category}</span>
                        </p>
                        <p className="text-sm text-muted-foreground line-clamp-2 mt-1">
                          {product.description}
                        </p>
                      </div>
                      
                      <div className="text-right ml-4">
                        <div className="text-lg font-bold text-foreground">
                          {currency === 'EUR' ? '€' : '$'}{convertPrice(product.price).toFixed(2)}
                        </div>
                        <div className={`text-sm font-medium ${product.stock > 0 ? 'text-green-600' : 'text-red-600'}`}>
                          Stock: {product.stock}
                        </div>
                        {product.rating && (
                          <div className="text-sm text-muted-foreground">
                            ⭐ {product.rating.toFixed(1)}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Additional Info */}
                    <div className="flex items-center justify-between mt-3">
                      <div className="flex items-center gap-4 text-xs text-muted-foreground">
                        {product.colors && product.colors.length > 0 && (
                          <span>Colores: {product.colors.length}</span>
                        )}
                        {product.images && product.images.length > 0 && (
                          <span>Imágenes: {product.images.length}</span>
                        )}
                        {product.originalPrice && product.originalPrice > product.price && (
                          <span className="text-green-600 font-medium">
                            Descuento: {Math.round((1 - product.price / product.originalPrice) * 100)}%
                          </span>
                        )}
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => console.log('Product details:', product)}
                          className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800 transition-colors"
                        >
                          <Eye className="w-3 h-3" />
                          Ver detalles
                        </button>
                        <button
                          onClick={() => deleteProduct(product.id.toString())}
                          className="flex items-center gap-1 text-xs text-red-600 hover:text-red-800 transition-colors"
                        >
                          <Trash2 className="w-3 h-3" />
                          Eliminar
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Results Summary */}
        {filteredProducts.length > 0 && (
          <div className="text-center mt-6 py-4 border-t border-border">
            <p className="text-sm text-muted-foreground">
              Mostrando {filteredProducts.length} de {products.length} productos
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
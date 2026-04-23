import React, { useState, useEffect, useCallback } from 'react';
import {
  Package,
  Plus,
  Search,
  RefreshCw,
  Edit2,
  Trash2,
  ChevronLeft,
  ChevronRight,
  Upload,
} from 'lucide-react';
import { apiClient } from '../../lib/apiClient';
import type { AdminProduct } from './types';
import { AdminProductForm } from './AdminProductForm';
import { AdminProductImport } from './AdminProductImport';

const LIMIT = 15;

export function AdminProducts() {
  const [products, setProducts] = useState<AdminProduct[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [activeFilter, setActiveFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Product form
  const [showForm, setShowForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState<AdminProduct | null>(null);

  // Import modal
  const [showImport, setShowImport] = useState(false);

  // Delete confirmation
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const loadProducts = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      params.set('page', String(page));
      params.set('limit', String(LIMIT));
      if (search.trim()) params.set('search', search.trim());
      if (activeFilter === 'active') params.set('active', 'true');
      if (activeFilter === 'inactive') params.set('active', 'false');

      const data = await apiClient.get<{ products: AdminProduct[]; total: number }>(
        `/admin/products?${params.toString()}`
      );
      setProducts(data.products ?? []);
      setTotal(data.total ?? 0);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cargar productos');
    } finally {
      setIsLoading(false);
    }
  }, [page, search, activeFilter]);

  useEffect(() => {
    loadProducts();
  }, [loadProducts]);

  const totalPages = Math.max(1, Math.ceil(total / LIMIT));

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearch(e.target.value);
    setPage(1);
  };

  const handleFilterChange = (filter: 'all' | 'active' | 'inactive') => {
    setActiveFilter(filter);
    setPage(1);
  };

  const handleCreate = () => {
    setEditingProduct(null);
    setShowForm(true);
  };

  const handleEdit = (product: AdminProduct) => {
    setEditingProduct(product);
    setShowForm(true);
  };

  const handleFormClose = () => {
    setShowForm(false);
    setEditingProduct(null);
  };

  const handleFormSaved = () => {
    setShowForm(false);
    setEditingProduct(null);
    loadProducts();
  };

  const handleDelete = async (id: number) => {
    try {
      await apiClient.delete(`/admin/products/${id}`);
      setDeletingId(null);
      loadProducts();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al eliminar producto');
      setDeletingId(null);
    }
  };

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(value);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-white">Productos</h2>
          <p className="text-gray-400 mt-1">Gestión del catálogo de productos</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={loadProducts}
            disabled={isLoading}
            className="flex items-center gap-2 px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            Recargar
          </button>
          <button
            onClick={() => setShowImport(true)}
            className="flex items-center gap-2 px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors"
          >
            <Upload className="w-4 h-4" />
            Importar catalogo
          </button>
          <button
            onClick={handleCreate}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
          >
            <Plus className="w-4 h-4" />
            Nuevo producto
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            value={search}
            onChange={handleSearch}
            placeholder="Buscar por nombre..."
            aria-label="Buscar productos por nombre"
            className="w-full pl-10 pr-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-blue-500"
          />
        </div>
        <div className="flex rounded-lg overflow-hidden border border-gray-700" role="group" aria-label="Filtrar por estado">
          {(['all', 'active', 'inactive'] as const).map((filter) => (
            <button
              key={filter}
              onClick={() => handleFilterChange(filter)}
              aria-pressed={activeFilter === filter}
              className={`px-4 py-2 text-sm font-medium transition-colors ${
                activeFilter === filter
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
              }`}
            >
              {filter === 'all' ? 'Todos' : filter === 'active' ? 'Activos' : 'Inactivos'}
            </button>
          ))}
        </div>
      </div>

      {/* Error */}
      {error && (
        <div role="alert" className="bg-red-900/20 border border-red-700 text-red-400 rounded-lg p-4">
          {error}
        </div>
      )}

      {/* Table */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <RefreshCw className="w-6 h-6 animate-spin text-blue-400 mr-2" />
          <span className="text-gray-400">Cargando productos...</span>
        </div>
      ) : (
        <div className="bg-gray-800 rounded-lg border border-gray-700 overflow-hidden">
          {products.length === 0 ? (
            <div className="text-center py-12">
              <Package className="w-12 h-12 text-gray-600 mx-auto mb-4" />
              <p className="text-gray-400">No se encontraron productos</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full" aria-label="Lista de productos">
                <thead>
                  <tr className="border-b border-gray-700 bg-gray-900/50">
                    <th scope="col" className="text-left py-3 px-4 text-xs font-semibold text-gray-400 uppercase tracking-wide">
                      Nombre
                    </th>
                    <th scope="col" className="text-left py-3 px-4 text-xs font-semibold text-gray-400 uppercase tracking-wide">
                      SKU
                    </th>
                    <th scope="col" className="text-left py-3 px-4 text-xs font-semibold text-gray-400 uppercase tracking-wide">
                      Precio
                    </th>
                    <th scope="col" className="text-left py-3 px-4 text-xs font-semibold text-gray-400 uppercase tracking-wide">
                      Stock
                    </th>
                    <th scope="col" className="text-left py-3 px-4 text-xs font-semibold text-gray-400 uppercase tracking-wide">
                      Estado
                    </th>
                    <th scope="col" className="text-right py-3 px-4 text-xs font-semibold text-gray-400 uppercase tracking-wide">
                      Acciones
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-700">
                  {products.map((product) => (
                    <tr key={product.id} className="hover:bg-gray-700/30 transition-colors">
                      <td className="py-3 px-4">
                        <div>
                          <p className="text-white font-medium text-sm">{product.nombre}</p>
                          {product.categoria_nombre && (
                            <p className="text-gray-500 text-xs mt-0.5">{product.categoria_nombre}</p>
                          )}
                        </div>
                      </td>
                      <td className="py-3 px-4 text-gray-400 text-sm font-mono">
                        {product.sku}
                      </td>
                      <td className="py-3 px-4 text-gray-300 text-sm">
                        {formatCurrency(product.precio)}
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={`text-sm font-medium ${
                            product.stock <= product.stock_minimo
                              ? 'text-red-400'
                              : 'text-gray-300'
                          }`}
                        >
                          {product.stock}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border ${
                            product.activo
                              ? 'bg-green-900/30 text-green-400 border-green-700'
                              : 'bg-gray-900/30 text-gray-400 border-gray-600'
                          }`}
                        >
                          {product.activo ? 'Activo' : 'Inactivo'}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleEdit(product)}
                            className="p-1.5 text-gray-400 hover:text-blue-400 hover:bg-gray-700 rounded transition-colors"
                            title="Editar"
                            aria-label={`Editar ${product.nombre}`}
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          {deletingId === product.id ? (
                            <div className="flex items-center gap-1">
                              <button
                                onClick={() => handleDelete(product.id)}
                                className="px-2 py-1 text-xs bg-red-600 hover:bg-red-700 text-white rounded transition-colors"
                                aria-label={`Confirmar eliminar ${product.nombre}`}
                              >
                                Confirmar
                              </button>
                              <button
                                onClick={() => setDeletingId(null)}
                                className="px-2 py-1 text-xs bg-gray-600 hover:bg-gray-500 text-white rounded transition-colors"
                                aria-label={`Cancelar eliminar ${product.nombre}`}
                              >
                                Cancelar
                              </button>
                            </div>
                          ) : (
                            <button
                              onClick={() => setDeletingId(product.id)}
                              className="p-1.5 text-gray-400 hover:text-red-400 hover:bg-gray-700 rounded transition-colors"
                              title="Eliminar"
                              aria-label={`Eliminar ${product.nombre}`}
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-gray-400">
            Mostrando {(page - 1) * LIMIT + 1}–{Math.min(page * LIMIT, total)} de {total} productos
          </p>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1}
              aria-label="Página anterior"
              className="p-2 bg-gray-800 border border-gray-700 rounded-lg text-gray-300 hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="text-sm text-gray-400">
              Página {page} de {totalPages}
            </span>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages}
              aria-label="Página siguiente"
              className="p-2 bg-gray-800 border border-gray-700 rounded-lg text-gray-300 hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Total count */}
      <div className="text-sm text-gray-500">
        {total} producto{total !== 1 ? 's' : ''} en total
      </div>

      {/* Product Form Modal */}
      {showForm && (
        <AdminProductForm
          product={editingProduct}
          onClose={handleFormClose}
          onSaved={handleFormSaved}
        />
      )}

      {/* Product Import Modal */}
      {showImport && (
        <AdminProductImport
          onClose={() => setShowImport(false)}
          onImported={() => {
            loadProducts();
          }}
        />
      )}
    </div>
  );
}

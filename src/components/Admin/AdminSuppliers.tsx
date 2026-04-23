import React, { useState, useEffect, useCallback } from 'react';
import {
  Truck,
  Plus,
  Search,
  RefreshCw,
  Edit2,
  Trash2,
  ChevronLeft,
  ChevronRight,
  Mail,
  Phone,
  Globe,
} from 'lucide-react';
import { apiClient } from '../../lib/apiClient';
import type { AdminSupplier } from './types';
import { AdminSupplierForm } from './AdminSupplierForm';

const LIMIT = 15;

export function AdminSuppliers() {
  const [suppliers, setSuppliers] = useState<AdminSupplier[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [activeFilter, setActiveFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Supplier form
  const [showForm, setShowForm] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState<AdminSupplier | null>(null);

  // Delete confirmation
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const loadSuppliers = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      params.set('page', String(page));
      params.set('limit', String(LIMIT));
      if (search.trim()) params.set('search', search.trim());
      if (activeFilter === 'active') params.set('active', 'true');
      if (activeFilter === 'inactive') params.set('active', 'false');

      const data = await apiClient.get<{ suppliers: AdminSupplier[]; total: number }>(
        `/admin/suppliers?${params.toString()}`
      );
      setSuppliers(data.suppliers ?? []);
      setTotal(data.total ?? 0);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cargar proveedores');
    } finally {
      setIsLoading(false);
    }
  }, [page, search, activeFilter]);

  useEffect(() => {
    loadSuppliers();
  }, [loadSuppliers]);

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
    setEditingSupplier(null);
    setShowForm(true);
  };

  const handleEdit = (supplier: AdminSupplier) => {
    setEditingSupplier(supplier);
    setShowForm(true);
  };

  const handleFormClose = () => {
    setShowForm(false);
    setEditingSupplier(null);
  };

  const handleFormSaved = () => {
    setShowForm(false);
    setEditingSupplier(null);
    loadSuppliers();
  };

  const handleDelete = async (id: string) => {
    try {
      await apiClient.delete(`/admin/suppliers/${id}`);
      setDeletingId(null);
      loadSuppliers();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al eliminar proveedor');
      setDeletingId(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-white">Proveedores</h2>
          <p className="text-gray-400 mt-1">Gestión de proveedores</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={loadSuppliers}
            disabled={isLoading}
            className="flex items-center gap-2 px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            Recargar
          </button>
          <button
            onClick={handleCreate}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
          >
            <Plus className="w-4 h-4" />
            Nuevo proveedor
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
            aria-label="Buscar proveedores por nombre"
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
          <span className="text-gray-400">Cargando proveedores...</span>
        </div>
      ) : (
        <div className="bg-gray-800 rounded-lg border border-gray-700 overflow-hidden">
          {suppliers.length === 0 ? (
            <div className="text-center py-12">
              <Truck className="w-12 h-12 text-gray-600 mx-auto mb-4" />
              <p className="text-gray-400">No se encontraron proveedores</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full" aria-label="Lista de proveedores">
                <thead>
                  <tr className="border-b border-gray-700 bg-gray-900/50">
                    <th scope="col" className="text-left py-3 px-4 text-xs font-semibold text-gray-400 uppercase tracking-wide">
                      Nombre
                    </th>
                    <th scope="col" className="text-left py-3 px-4 text-xs font-semibold text-gray-400 uppercase tracking-wide">
                      Pais
                    </th>
                    <th scope="col" className="text-left py-3 px-4 text-xs font-semibold text-gray-400 uppercase tracking-wide">
                      Contacto
                    </th>
                    <th scope="col" className="text-left py-3 px-4 text-xs font-semibold text-gray-400 uppercase tracking-wide">
                      Margen
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
                  {suppliers.map((supplier) => (
                    <tr key={supplier.id} className="hover:bg-gray-700/30 transition-colors">
                      <td className="py-3 px-4">
                        <div>
                          <p className="text-white font-medium text-sm">{supplier.nombre}</p>
                          {supplier.product_count !== undefined && (
                            <p className="text-gray-500 text-xs mt-0.5">
                              {supplier.product_count} producto{supplier.product_count !== 1 ? 's' : ''}
                            </p>
                          )}
                        </div>
                      </td>
                      <td className="py-3 px-4 text-gray-400 text-sm">
                        {supplier.pais ?? '—'}
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          {supplier.email && (
                            <a
                              href={`mailto:${supplier.email}`}
                              className="text-gray-400 hover:text-blue-400 transition-colors"
                              title={supplier.email}
                              aria-label={`Enviar email a ${supplier.nombre}`}
                            >
                              <Mail className="w-4 h-4" />
                            </a>
                          )}
                          {supplier.telefono && (
                            <a
                              href={`tel:${supplier.telefono}`}
                              className="text-gray-400 hover:text-blue-400 transition-colors"
                              title={supplier.telefono}
                              aria-label={`Llamar a ${supplier.nombre}`}
                            >
                              <Phone className="w-4 h-4" />
                            </a>
                          )}
                          {supplier.web && (
                            <a
                              href={supplier.web}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-gray-400 hover:text-blue-400 transition-colors"
                              title={supplier.web}
                              aria-label={`Visitar web de ${supplier.nombre}`}
                            >
                              <Globe className="w-4 h-4" />
                            </a>
                          )}
                          {!supplier.email && !supplier.telefono && !supplier.web && (
                            <span className="text-gray-600 text-xs">Sin contacto</span>
                          )}
                        </div>
                      </td>
                      <td className="py-3 px-4 text-gray-300 text-sm">
                        {supplier.margen_defecto}%
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border ${
                            supplier.activo
                              ? 'bg-green-900/30 text-green-400 border-green-700'
                              : 'bg-gray-900/30 text-gray-400 border-gray-600'
                          }`}
                        >
                          {supplier.activo ? 'Activo' : 'Inactivo'}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleEdit(supplier)}
                            className="p-1.5 text-gray-400 hover:text-blue-400 hover:bg-gray-700 rounded transition-colors"
                            title="Editar"
                            aria-label={`Editar ${supplier.nombre}`}
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          {deletingId === supplier.id ? (
                            <div className="flex items-center gap-1">
                              <button
                                onClick={() => handleDelete(supplier.id)}
                                className="px-2 py-1 text-xs bg-red-600 hover:bg-red-700 text-white rounded transition-colors"
                                aria-label={`Confirmar eliminar ${supplier.nombre}`}
                              >
                                Confirmar
                              </button>
                              <button
                                onClick={() => setDeletingId(null)}
                                className="px-2 py-1 text-xs bg-gray-600 hover:bg-gray-500 text-white rounded transition-colors"
                                aria-label={`Cancelar eliminar ${supplier.nombre}`}
                              >
                                Cancelar
                              </button>
                            </div>
                          ) : (
                            <button
                              onClick={() => setDeletingId(supplier.id)}
                              className="p-1.5 text-gray-400 hover:text-red-400 hover:bg-gray-700 rounded transition-colors"
                              title="Eliminar"
                              aria-label={`Eliminar ${supplier.nombre}`}
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
            Mostrando {(page - 1) * LIMIT + 1}–{Math.min(page * LIMIT, total)} de {total} proveedores
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
        {total} proveedor{total !== 1 ? 'es' : ''} en total
      </div>

      {/* Supplier Form Modal */}
      {showForm && (
        <AdminSupplierForm
          supplier={editingSupplier}
          onClose={handleFormClose}
          onSaved={handleFormSaved}
        />
      )}
    </div>
  );
}

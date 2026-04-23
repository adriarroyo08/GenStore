import React, { useState, useEffect } from 'react';
import {
  FolderTree,
  Plus,
  RefreshCw,
  Edit2,
  Trash2,
  X,
  Save,
} from 'lucide-react';
import { apiClient } from '../../lib/apiClient';
import type { AdminCategory } from './types';

interface CategoryFormData {
  nombre: string;
  slug: string;
  descripcion: string;
  imagen_url: string;
  activo: boolean;
}

const emptyForm: CategoryFormData = {
  nombre: '',
  slug: '',
  descripcion: '',
  imagen_url: '',
  activo: true,
};

export function AdminCategories() {
  const [categories, setCategories] = useState<AdminCategory[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form state
  const [showForm, setShowForm] = useState(false);
  const [editingCategory, setEditingCategory] = useState<AdminCategory | null>(null);
  const [form, setForm] = useState<CategoryFormData>(emptyForm);
  const [isSaving, setIsSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Delete confirmation
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const loadCategories = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await apiClient.get<{ categories: AdminCategory[] }>('/admin/categories');
      setCategories(data.categories ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cargar categorías');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadCategories();
  }, []);

  const generateSlug = (name: string) =>
    name
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');

  const handleCreate = () => {
    setEditingCategory(null);
    setForm(emptyForm);
    setFormError(null);
    setShowForm(true);
  };

  const handleEdit = (category: AdminCategory) => {
    setEditingCategory(category);
    setForm({
      nombre: category.nombre,
      slug: category.slug,
      descripcion: category.descripcion ?? '',
      imagen_url: category.imagen_url ?? '',
      activo: category.activo,
    });
    setFormError(null);
    setShowForm(true);
  };

  const handleFormClose = () => {
    setShowForm(false);
    setEditingCategory(null);
    setForm(emptyForm);
    setFormError(null);
  };

  const handleNameChange = (value: string) => {
    setForm((prev) => ({
      ...prev,
      nombre: value,
      slug: editingCategory ? prev.slug : generateSlug(value),
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!form.nombre.trim()) {
      setFormError('El nombre es obligatorio');
      return;
    }
    if (!form.slug.trim()) {
      setFormError('El slug es obligatorio');
      return;
    }

    const payload = {
      nombre: form.nombre.trim(),
      slug: form.slug.trim(),
      descripcion: form.descripcion.trim() || null,
      imagen_url: form.imagen_url.trim() || null,
      activo: form.activo,
    };

    setIsSaving(true);
    try {
      if (editingCategory) {
        await apiClient.put(`/admin/categories/${editingCategory.id}`, payload);
      } else {
        await apiClient.post('/admin/categories', payload);
      }
      handleFormClose();
      loadCategories();
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Error al guardar la categoría');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await apiClient.delete(`/admin/categories/${id}`);
      setDeletingId(null);
      loadCategories();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al eliminar categoría');
      setDeletingId(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white">Categorías</h2>
          <p className="text-gray-400 mt-1">Gestión de categorías de productos</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={loadCategories}
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
            Nueva categoría
          </button>
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
          <span className="text-gray-400">Cargando categorías...</span>
        </div>
      ) : (
        <div className="bg-gray-800 rounded-lg border border-gray-700 overflow-hidden">
          {categories.length === 0 ? (
            <div className="text-center py-12">
              <FolderTree className="w-12 h-12 text-gray-600 mx-auto mb-4" />
              <p className="text-gray-400">No hay categorías registradas</p>
            </div>
          ) : (
            <table className="w-full" aria-label="Lista de categorías">
              <thead>
                <tr className="border-b border-gray-700 bg-gray-900/50">
                  <th scope="col" className="text-left py-3 px-4 text-xs font-semibold text-gray-400 uppercase tracking-wide">
                    Nombre
                  </th>
                  <th scope="col" className="text-left py-3 px-4 text-xs font-semibold text-gray-400 uppercase tracking-wide">
                    Slug
                  </th>
                  <th scope="col" className="text-left py-3 px-4 text-xs font-semibold text-gray-400 uppercase tracking-wide">
                    Productos
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
                {categories.map((category) => (
                  <tr key={category.id} className="hover:bg-gray-700/30 transition-colors">
                    <td className="py-3 px-4 text-white font-medium text-sm">
                      {category.nombre}
                    </td>
                    <td className="py-3 px-4 text-gray-400 text-sm font-mono">
                      {category.slug}
                    </td>
                    <td className="py-3 px-4 text-gray-300 text-sm">
                      {category.product_count ?? 0}
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border ${
                          category.activo
                            ? 'bg-green-900/30 text-green-400 border-green-700'
                            : 'bg-gray-900/30 text-gray-400 border-gray-600'
                        }`}
                      >
                        {category.activo ? 'Activa' : 'Inactiva'}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleEdit(category)}
                          className="p-1.5 text-gray-400 hover:text-blue-400 hover:bg-gray-700 rounded transition-colors"
                          title="Editar"
                          aria-label={`Editar ${category.nombre}`}
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        {deletingId === category.id ? (
                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => handleDelete(category.id)}
                              className="px-2 py-1 text-xs bg-red-600 hover:bg-red-700 text-white rounded transition-colors"
                              aria-label={`Confirmar eliminar ${category.nombre}`}
                            >
                              Confirmar
                            </button>
                            <button
                              onClick={() => setDeletingId(null)}
                              className="px-2 py-1 text-xs bg-gray-600 hover:bg-gray-500 text-white rounded transition-colors"
                              aria-label={`Cancelar eliminar ${category.nombre}`}
                            >
                              Cancelar
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => setDeletingId(category.id)}
                            className="p-1.5 text-gray-400 hover:text-red-400 hover:bg-gray-700 rounded transition-colors"
                            title="Eliminar"
                            aria-label={`Eliminar ${category.nombre}`}
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
          )}
        </div>
      )}

      {/* Total count */}
      <div className="text-sm text-gray-500">
        {categories.length} categoría{categories.length !== 1 ? 's' : ''} registrada{categories.length !== 1 ? 's' : ''}
      </div>

      {/* Category Form Modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70" role="dialog" aria-modal="true" aria-labelledby="category-form-title">
          <div className="bg-gray-800 rounded-xl border border-gray-700 w-full max-w-lg mx-4">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-700">
              <h3 id="category-form-title" className="text-lg font-semibold text-white">
                {editingCategory ? 'Editar categoría' : 'Nueva categoría'}
              </h3>
              <button
                onClick={handleFormClose}
                className="text-gray-400 hover:text-white transition-colors"
                aria-label="Cerrar"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {formError && (
                <div role="alert" className="bg-red-900/20 border border-red-700 text-red-400 rounded-lg p-3 text-sm">
                  {formError}
                </div>
              )}

              {/* Nombre */}
              <div>
                <label htmlFor="field-admin-cat-nombre" className="block text-sm font-medium text-gray-300 mb-1">
                  Nombre <span className="text-red-400">*</span>
                </label>
                <input
                  id="field-admin-cat-nombre"
                  type="text"
                  value={form.nombre}
                  onChange={(e) => handleNameChange(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-900 border border-gray-600 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-blue-500"
                  placeholder="Nombre de la categoría"
                  required
                  aria-required="true"
                />
              </div>

              {/* Slug */}
              <div>
                <label htmlFor="field-admin-cat-slug" className="block text-sm font-medium text-gray-300 mb-1">
                  Slug <span className="text-red-400">*</span>
                </label>
                <input
                  id="field-admin-cat-slug"
                  type="text"
                  value={form.slug}
                  onChange={(e) => setForm((prev) => ({ ...prev, slug: e.target.value }))}
                  className="w-full px-3 py-2 bg-gray-900 border border-gray-600 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-blue-500"
                  placeholder="nombre-de-la-categoria"
                  required
                  aria-required="true"
                />
              </div>

              {/* Descripción */}
              <div>
                <label htmlFor="field-admin-cat-descripcion" className="block text-sm font-medium text-gray-300 mb-1">
                  Descripción
                </label>
                <textarea
                  id="field-admin-cat-descripcion"
                  value={form.descripcion}
                  onChange={(e) => setForm((prev) => ({ ...prev, descripcion: e.target.value }))}
                  rows={3}
                  className="w-full px-3 py-2 bg-gray-900 border border-gray-600 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 resize-none"
                  placeholder="Descripción de la categoría..."
                />
              </div>

              {/* Imagen URL */}
              <div>
                <label htmlFor="field-admin-cat-imagen" className="block text-sm font-medium text-gray-300 mb-1">
                  URL de imagen
                </label>
                <input
                  id="field-admin-cat-imagen"
                  type="text"
                  value={form.imagen_url}
                  onChange={(e) => setForm((prev) => ({ ...prev, imagen_url: e.target.value }))}
                  className="w-full px-3 py-2 bg-gray-900 border border-gray-600 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-blue-500"
                  placeholder="https://ejemplo.com/imagen.jpg"
                />
              </div>

              {/* Activo */}
              <div className="flex items-center gap-3">
                <label htmlFor="field-admin-cat-activo" className="text-sm font-medium text-gray-300">Activa</label>
                <button
                  id="field-admin-cat-activo"
                  type="button"
                  role="switch"
                  aria-checked={form.activo}
                  aria-label={form.activo ? 'Categoría activa' : 'Categoría inactiva'}
                  onClick={() => setForm((prev) => ({ ...prev, activo: !prev.activo }))}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    form.activo ? 'bg-blue-600' : 'bg-gray-600'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      form.activo ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>

              {/* Actions */}
              <div className="flex justify-end gap-3 pt-2 border-t border-gray-700">
                <button
                  type="button"
                  onClick={handleFormClose}
                  className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors disabled:opacity-50"
                >
                  <Save className="w-4 h-4" />
                  {isSaving ? 'Guardando...' : 'Guardar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

import React, { useState, useEffect } from 'react';
import { X, Save } from 'lucide-react';
import { apiClient } from '../../lib/apiClient';
import type { AdminSupplier } from './types';

interface AdminSupplierFormProps {
  supplier: AdminSupplier | null;
  onClose: () => void;
  onSaved: () => void;
}

interface SupplierFormData {
  nombre: string;
  email: string;
  telefono: string;
  web: string;
  pais: string;
  condiciones_pago: string;
  plazo_envio_estimado: string;
  margen_defecto: number;
  notas: string;
  activo: boolean;
}

const emptyForm: SupplierFormData = {
  nombre: '',
  email: '',
  telefono: '',
  web: '',
  pais: 'España',
  condiciones_pago: '',
  plazo_envio_estimado: '',
  margen_defecto: 40,
  notas: '',
  activo: true,
};

export function AdminSupplierForm({ supplier, onClose, onSaved }: AdminSupplierFormProps) {
  const [form, setForm] = useState<SupplierFormData>(emptyForm);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (supplier) {
      setForm({
        nombre: supplier.nombre,
        email: supplier.email ?? '',
        telefono: supplier.telefono ?? '',
        web: supplier.web ?? '',
        pais: supplier.pais ?? 'España',
        condiciones_pago: supplier.condiciones_pago ?? '',
        plazo_envio_estimado: supplier.plazo_envio_estimado ?? '',
        margen_defecto: supplier.margen_defecto,
        notas: supplier.notas ?? '',
        activo: supplier.activo,
      });
    } else {
      setForm(emptyForm);
    }
  }, [supplier]);

  const handleChange = <K extends keyof SupplierFormData>(
    field: K,
    value: SupplierFormData[K]
  ) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!form.nombre.trim()) {
      setError('El nombre es obligatorio');
      return;
    }

    const payload = {
      nombre: form.nombre.trim(),
      email: form.email.trim() || null,
      telefono: form.telefono.trim() || null,
      web: form.web.trim() || null,
      pais: form.pais.trim() || null,
      condiciones_pago: form.condiciones_pago.trim() || null,
      plazo_envio_estimado: form.plazo_envio_estimado.trim() || null,
      margen_defecto: form.margen_defecto,
      notas: form.notas.trim() || null,
      activo: form.activo,
    };

    setIsSaving(true);
    try {
      if (supplier) {
        await apiClient.put(`/admin/suppliers/${supplier.id}`, payload);
      } else {
        await apiClient.post('/admin/suppliers', payload);
      }
      onSaved();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al guardar el proveedor');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70" role="dialog" aria-modal="true" aria-labelledby="supplier-form-title">
      <div className="bg-gray-800 rounded-xl border border-gray-700 w-full max-w-2xl max-h-[90vh] overflow-y-auto mx-4">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-700">
          <h3 id="supplier-form-title" className="text-lg font-semibold text-white">
            {supplier ? 'Editar proveedor' : 'Nuevo proveedor'}
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
            aria-label="Cerrar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div role="alert" className="bg-red-900/20 border border-red-700 text-red-400 rounded-lg p-3 text-sm">
              {error}
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Nombre */}
            <div className="sm:col-span-2">
              <label htmlFor="field-supplier-nombre" className="block text-sm font-medium text-gray-300 mb-1">
                Nombre <span className="text-red-400">*</span>
              </label>
              <input
                id="field-supplier-nombre"
                type="text"
                value={form.nombre}
                onChange={(e) => handleChange('nombre', e.target.value)}
                className="w-full px-3 py-2 bg-gray-900 border border-gray-600 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-blue-500"
                placeholder="Nombre del proveedor"
                required
                aria-required="true"
              />
            </div>

            {/* Email */}
            <div>
              <label htmlFor="field-supplier-email" className="block text-sm font-medium text-gray-300 mb-1">
                Email
              </label>
              <input
                id="field-supplier-email"
                type="email"
                value={form.email}
                onChange={(e) => handleChange('email', e.target.value)}
                className="w-full px-3 py-2 bg-gray-900 border border-gray-600 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-blue-500"
                placeholder="proveedor@ejemplo.com"
              />
            </div>

            {/* Telefono */}
            <div>
              <label htmlFor="field-supplier-telefono" className="block text-sm font-medium text-gray-300 mb-1">
                Telefono
              </label>
              <input
                id="field-supplier-telefono"
                type="tel"
                value={form.telefono}
                onChange={(e) => handleChange('telefono', e.target.value)}
                className="w-full px-3 py-2 bg-gray-900 border border-gray-600 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-blue-500"
                placeholder="+34 600 000 000"
              />
            </div>

            {/* Web */}
            <div>
              <label htmlFor="field-supplier-web" className="block text-sm font-medium text-gray-300 mb-1">
                Web
              </label>
              <input
                id="field-supplier-web"
                type="url"
                value={form.web}
                onChange={(e) => handleChange('web', e.target.value)}
                className="w-full px-3 py-2 bg-gray-900 border border-gray-600 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-blue-500"
                placeholder="https://proveedor.com"
              />
            </div>

            {/* Pais */}
            <div>
              <label htmlFor="field-supplier-pais" className="block text-sm font-medium text-gray-300 mb-1">
                Pais
              </label>
              <input
                id="field-supplier-pais"
                type="text"
                value={form.pais}
                onChange={(e) => handleChange('pais', e.target.value)}
                className="w-full px-3 py-2 bg-gray-900 border border-gray-600 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-blue-500"
                placeholder="España"
              />
            </div>

            {/* Margen defecto */}
            <div>
              <label htmlFor="field-supplier-margen" className="block text-sm font-medium text-gray-300 mb-1">
                Margen por defecto (%)
              </label>
              <input
                id="field-supplier-margen"
                type="number"
                step="0.1"
                min="0"
                max="100"
                value={form.margen_defecto}
                onChange={(e) => handleChange('margen_defecto', parseFloat(e.target.value) || 0)}
                className="w-full px-3 py-2 bg-gray-900 border border-gray-600 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-blue-500"
              />
            </div>

            {/* Plazo envio estimado */}
            <div>
              <label htmlFor="field-supplier-plazo" className="block text-sm font-medium text-gray-300 mb-1">
                Plazo de envio estimado
              </label>
              <input
                id="field-supplier-plazo"
                type="text"
                value={form.plazo_envio_estimado}
                onChange={(e) => handleChange('plazo_envio_estimado', e.target.value)}
                className="w-full px-3 py-2 bg-gray-900 border border-gray-600 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-blue-500"
                placeholder="3-5 dias laborables"
              />
            </div>

            {/* Condiciones de pago */}
            <div className="sm:col-span-2">
              <label htmlFor="field-supplier-condiciones" className="block text-sm font-medium text-gray-300 mb-1">
                Condiciones de pago
              </label>
              <input
                id="field-supplier-condiciones"
                type="text"
                value={form.condiciones_pago}
                onChange={(e) => handleChange('condiciones_pago', e.target.value)}
                className="w-full px-3 py-2 bg-gray-900 border border-gray-600 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-blue-500"
                placeholder="Pago a 30 dias"
              />
            </div>

            {/* Notas */}
            <div className="sm:col-span-2">
              <label htmlFor="field-supplier-notas" className="block text-sm font-medium text-gray-300 mb-1">
                Notas
              </label>
              <textarea
                id="field-supplier-notas"
                value={form.notas}
                onChange={(e) => handleChange('notas', e.target.value)}
                rows={3}
                className="w-full px-3 py-2 bg-gray-900 border border-gray-600 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 resize-none"
                placeholder="Notas internas sobre el proveedor..."
              />
            </div>

            {/* Activo */}
            <div className="flex items-center gap-3">
              <label htmlFor="field-supplier-activo" className="text-sm font-medium text-gray-300">Activo</label>
              <button
                id="field-supplier-activo"
                type="button"
                role="switch"
                aria-checked={form.activo}
                aria-label={form.activo ? 'Proveedor activo' : 'Proveedor inactivo'}
                onClick={() => handleChange('activo', !form.activo)}
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
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-2 border-t border-gray-700">
            <button
              type="button"
              onClick={onClose}
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
  );
}

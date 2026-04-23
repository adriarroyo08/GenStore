import React, { useState, useEffect, useCallback } from 'react';
import {
  Warehouse,
  AlertTriangle,
  RefreshCw,
  Download,
  Upload,
  Plus,
  ChevronLeft,
  ChevronRight,
  ArrowDownCircle,
  ArrowUpCircle,
  RotateCw,
} from 'lucide-react';
import { apiClient } from '../../lib/apiClient';
import { supabase } from '../../lib/supabase';
import type { InventoryAlert, InventoryMovement, AdminProduct } from './types';
import { AdminInventoryImport } from './AdminInventoryImport';

const MOVEMENTS_LIMIT = 15;

export function AdminInventory() {
  // Alerts
  const [alerts, setAlerts] = useState<InventoryAlert[]>([]);
  const [alertsLoading, setAlertsLoading] = useState(false);

  // Movements
  const [movements, setMovements] = useState<InventoryMovement[]>([]);
  const [movementsTotal, setMovementsTotal] = useState(0);
  const [movementsPage, setMovementsPage] = useState(1);
  const [movementsLoading, setMovementsLoading] = useState(false);

  const [error, setError] = useState<string | null>(null);

  // Import modal
  const [showImport, setShowImport] = useState(false);

  // Adjustment form
  const [showAdjustment, setShowAdjustment] = useState(false);
  const [adjustForm, setAdjustForm] = useState({
    producto_id: '' as string | number,
    cantidad: 0,
    tipo: 'entrada' as 'entrada' | 'salida' | 'ajuste',
    motivo: '',
  });
  const [products, setProducts] = useState<AdminProduct[]>([]);
  const [isAdjusting, setIsAdjusting] = useState(false);

  const loadAlerts = async () => {
    setAlertsLoading(true);
    try {
      const data = await apiClient.get<{ alerts: InventoryAlert[] }>('/admin/inventory/alerts');
      setAlerts(data.alerts ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cargar alertas');
    } finally {
      setAlertsLoading(false);
    }
  };

  const loadMovements = useCallback(async () => {
    setMovementsLoading(true);
    try {
      const params = new URLSearchParams();
      params.set('page', String(movementsPage));
      params.set('limit', String(MOVEMENTS_LIMIT));
      const data = await apiClient.get<{ movements: InventoryMovement[]; total?: number }>(
        `/admin/inventory/movements?${params.toString()}`
      );
      setMovements(data.movements ?? []);
      setMovementsTotal(data.total ?? 0);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cargar movimientos');
    } finally {
      setMovementsLoading(false);
    }
  }, [movementsPage]);

  const loadProducts = async () => {
    try {
      const data = await apiClient.get<{ products: AdminProduct[] }>(
        '/admin/products?limit=500&active=true'
      );
      setProducts(data.products ?? []);
    } catch {
      // Silently fail — product list is optional for the adjustment form
    }
  };

  useEffect(() => {
    loadAlerts();
    loadProducts();
  }, []);

  useEffect(() => {
    loadMovements();
  }, [loadMovements]);

  const movementsTotalPages = Math.max(1, Math.ceil(movementsTotal / MOVEMENTS_LIMIT));

  const refreshAll = () => {
    setError(null);
    loadAlerts();
    loadMovements();
  };

  const handleExport = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const headers: HeadersInit = {};
      if (session?.access_token) {
        headers['Authorization'] = `Bearer ${session.access_token}`;
      }
      const res = await fetch('/api/v1/admin/inventory/export', { headers });
      if (!res.ok) throw new Error('Error al exportar');
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `inventario_${new Date().toISOString().slice(0, 10)}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al exportar CSV');
    }
  };

  const handleAdjustSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!adjustForm.producto_id) {
      setError('Selecciona un producto');
      return;
    }
    if (adjustForm.cantidad <= 0) {
      setError('La cantidad debe ser mayor que 0');
      return;
    }

    setIsAdjusting(true);
    try {
      const cantidad = adjustForm.tipo === 'salida' ? -adjustForm.cantidad : adjustForm.cantidad;
      await apiClient.post('/admin/inventory/adjust', {
        productId: Number(adjustForm.producto_id),
        cantidad,
        motivo: adjustForm.motivo.trim() || null,
      });
      setShowAdjustment(false);
      setAdjustForm({ producto_id: '', cantidad: 0, tipo: 'entrada', motivo: '' });
      refreshAll();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al ajustar inventario');
    } finally {
      setIsAdjusting(false);
    }
  };

  const handleImported = () => {
    setShowImport(false);
    refreshAll();
  };

  const formatDate = (dateStr: string) =>
    new Date(dateStr).toLocaleDateString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });

  const getMovementIcon = (tipo: string) => {
    switch (tipo) {
      case 'entrada':
        return <ArrowDownCircle className="w-4 h-4 text-green-400" />;
      case 'salida':
        return <ArrowUpCircle className="w-4 h-4 text-red-400" />;
      default:
        return <RotateCw className="w-4 h-4 text-yellow-400" />;
    }
  };

  const getMovementLabel = (tipo: string) => {
    const labels: Record<string, string> = {
      entrada: 'Entrada',
      salida: 'Salida',
      ajuste: 'Ajuste',
    };
    return labels[tipo] ?? tipo;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-white">Inventario</h2>
          <p className="text-gray-400 mt-1">Gestión de stock y movimientos</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={refreshAll}
            disabled={alertsLoading || movementsLoading}
            className="flex items-center gap-2 px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors disabled:opacity-50"
          >
            <RefreshCw
              className={`w-4 h-4 ${alertsLoading || movementsLoading ? 'animate-spin' : ''}`}
            />
            Recargar
          </button>
          <button
            onClick={() => setShowAdjustment(true)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
          >
            <Plus className="w-4 h-4" />
            Ajuste manual
          </button>
          <button
            onClick={() => setShowImport(true)}
            className="flex items-center gap-2 px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors"
          >
            <Upload className="w-4 h-4" />
            Importar CSV
          </button>
          <button
            onClick={handleExport}
            className="flex items-center gap-2 px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors"
          >
            <Download className="w-4 h-4" />
            Exportar CSV
          </button>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div role="alert" className="bg-red-900/20 border border-red-700 text-red-400 rounded-lg p-4">
          {error}
        </div>
      )}

      {/* Stock Alerts */}
      <div className="bg-gray-800 rounded-lg border border-gray-700 overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-700 flex items-center gap-2">
          <AlertTriangle className="w-5 h-5 text-yellow-400" />
          <h3 className="font-semibold text-white">
            Alertas de stock bajo ({alerts.length})
          </h3>
        </div>
        {alertsLoading ? (
          <div className="flex items-center justify-center py-8">
            <RefreshCw className="w-5 h-5 animate-spin text-blue-400 mr-2" />
            <span className="text-gray-400">Cargando alertas...</span>
          </div>
        ) : alerts.length === 0 ? (
          <div className="text-center py-8">
            <Warehouse className="w-10 h-10 text-gray-600 mx-auto mb-2" />
            <p className="text-gray-400 text-sm">No hay alertas de stock bajo</p>
          </div>
        ) : (
          <table className="w-full" aria-label="Alertas de stock bajo">
            <thead>
              <tr className="bg-gray-900/50">
                <th scope="col" className="text-left py-2 px-4 text-xs text-gray-400 uppercase tracking-wide">
                  Producto
                </th>
                <th scope="col" className="text-left py-2 px-4 text-xs text-gray-400 uppercase tracking-wide">
                  SKU
                </th>
                <th scope="col" className="text-left py-2 px-4 text-xs text-gray-400 uppercase tracking-wide">
                  Stock actual
                </th>
                <th scope="col" className="text-left py-2 px-4 text-xs text-gray-400 uppercase tracking-wide">
                  Stock mínimo
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-700">
              {alerts.map((alert) => (
                <tr key={alert.id} className="hover:bg-gray-700/30 transition-colors">
                  <td className="py-3 px-4 text-white text-sm">{alert.nombre}</td>
                  <td className="py-3 px-4 text-gray-400 text-sm font-mono">{alert.sku}</td>
                  <td className="py-3 px-4">
                    <span className="text-red-400 font-medium text-sm">
                      {alert.stock_actual}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-gray-400 text-sm">{alert.stock_minimo}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Recent movements */}
      <div className="bg-gray-800 rounded-lg border border-gray-700 overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-700">
          <h3 className="font-semibold text-white">Movimientos recientes</h3>
        </div>
        {movementsLoading ? (
          <div className="flex items-center justify-center py-8">
            <RefreshCw className="w-5 h-5 animate-spin text-blue-400 mr-2" />
            <span className="text-gray-400">Cargando movimientos...</span>
          </div>
        ) : movements.length === 0 ? (
          <div className="text-center py-8">
            <Warehouse className="w-10 h-10 text-gray-600 mx-auto mb-2" />
            <p className="text-gray-400 text-sm">No hay movimientos registrados</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full" aria-label="Movimientos de inventario">
              <thead>
                <tr className="bg-gray-900/50">
                  <th scope="col" className="text-left py-2 px-4 text-xs text-gray-400 uppercase tracking-wide">
                    Tipo
                  </th>
                  <th scope="col" className="text-left py-2 px-4 text-xs text-gray-400 uppercase tracking-wide">
                    Producto
                  </th>
                  <th scope="col" className="text-right py-2 px-4 text-xs text-gray-400 uppercase tracking-wide">
                    Cantidad
                  </th>
                  <th scope="col" className="text-right py-2 px-4 text-xs text-gray-400 uppercase tracking-wide">
                    Stock anterior
                  </th>
                  <th scope="col" className="text-right py-2 px-4 text-xs text-gray-400 uppercase tracking-wide">
                    Stock nuevo
                  </th>
                  <th scope="col" className="text-left py-2 px-4 text-xs text-gray-400 uppercase tracking-wide">
                    Motivo
                  </th>
                  <th scope="col" className="text-left py-2 px-4 text-xs text-gray-400 uppercase tracking-wide">
                    Fecha
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-700">
                {movements.map((mv) => (
                  <tr key={mv.id} className="hover:bg-gray-700/30 transition-colors">
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        {getMovementIcon(mv.tipo)}
                        <span className="text-sm text-gray-300">{getMovementLabel(mv.tipo)}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-white text-sm">{mv.producto_nombre}</td>
                    <td className="py-3 px-4 text-right">
                      <span
                        className={`text-sm font-medium ${
                          mv.tipo === 'entrada'
                            ? 'text-green-400'
                            : mv.tipo === 'salida'
                              ? 'text-red-400'
                              : 'text-yellow-400'
                        }`}
                      >
                        {mv.tipo === 'entrada' ? '+' : mv.tipo === 'salida' ? '-' : ''}
                        {mv.cantidad}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-gray-400 text-sm text-right">
                      {mv.stock_anterior}
                    </td>
                    <td className="py-3 px-4 text-gray-300 text-sm text-right font-medium">
                      {mv.stock_nuevo}
                    </td>
                    <td className="py-3 px-4 text-gray-400 text-sm">
                      {mv.motivo ?? '—'}
                    </td>
                    <td className="py-3 px-4 text-gray-400 text-sm whitespace-nowrap">
                      {formatDate(mv.creado_en)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Movements pagination */}
      {movementsTotalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-gray-400">
            Página {movementsPage} de {movementsTotalPages}
          </p>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setMovementsPage((p) => Math.max(1, p - 1))}
              disabled={movementsPage <= 1}
              aria-label="Página anterior"
              className="p-2 bg-gray-800 border border-gray-700 rounded-lg text-gray-300 hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={() => setMovementsPage((p) => Math.min(movementsTotalPages, p + 1))}
              disabled={movementsPage >= movementsTotalPages}
              aria-label="Página siguiente"
              className="p-2 bg-gray-800 border border-gray-700 rounded-lg text-gray-300 hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Manual adjustment modal */}
      {showAdjustment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70" role="dialog" aria-modal="true" aria-labelledby="adjust-stock-title">
          <div className="bg-gray-800 rounded-xl border border-gray-700 w-full max-w-md mx-4">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-700">
              <h3 id="adjust-stock-title" className="text-lg font-semibold text-white">Ajuste manual de stock</h3>
              <button
                onClick={() => setShowAdjustment(false)}
                className="text-gray-400 hover:text-white transition-colors text-xl leading-none"
                aria-label="Cerrar"
              >
                &times;
              </button>
            </div>
            <form onSubmit={handleAdjustSubmit} className="p-6 space-y-4">
              {/* Producto */}
              <div>
                <label htmlFor="field-admin-adjust-producto" className="block text-sm font-medium text-gray-300 mb-1">
                  Producto <span className="text-red-400">*</span>
                </label>
                <select
                  id="field-admin-adjust-producto"
                  value={adjustForm.producto_id}
                  onChange={(e) =>
                    setAdjustForm((prev) => ({ ...prev, producto_id: e.target.value }))
                  }
                  className="w-full px-3 py-2 bg-gray-900 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-blue-500"
                  required
                  aria-required="true"
                >
                  <option value="">Seleccionar producto...</option>
                  {products.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.nombre} ({p.sku}) — Stock: {p.stock}
                    </option>
                  ))}
                </select>
              </div>

              {/* Tipo */}
              <div>
                <label htmlFor="field-admin-adjust-tipo" className="block text-sm font-medium text-gray-300 mb-1">
                  Tipo <span className="text-red-400">*</span>
                </label>
                <select
                  id="field-admin-adjust-tipo"
                  value={adjustForm.tipo}
                  onChange={(e) =>
                    setAdjustForm((prev) => ({
                      ...prev,
                      tipo: e.target.value as 'entrada' | 'salida' | 'ajuste',
                    }))
                  }
                  className="w-full px-3 py-2 bg-gray-900 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-blue-500"
                  aria-required="true"
                >
                  <option value="entrada">Entrada</option>
                  <option value="salida">Salida</option>
                  <option value="ajuste">Ajuste</option>
                </select>
              </div>

              {/* Cantidad */}
              <div>
                <label htmlFor="field-admin-adjust-cantidad" className="block text-sm font-medium text-gray-300 mb-1">
                  Cantidad <span className="text-red-400">*</span>
                </label>
                <input
                  id="field-admin-adjust-cantidad"
                  type="number"
                  min="1"
                  value={adjustForm.cantidad}
                  onChange={(e) =>
                    setAdjustForm((prev) => ({ ...prev, cantidad: parseInt(e.target.value) || 0 }))
                  }
                  className="w-full px-3 py-2 bg-gray-900 border border-gray-600 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-blue-500"
                  required
                  aria-required="true"
                />
              </div>

              {/* Motivo */}
              <div>
                <label htmlFor="field-admin-adjust-motivo" className="block text-sm font-medium text-gray-300 mb-1">Motivo</label>
                <input
                  id="field-admin-adjust-motivo"
                  type="text"
                  value={adjustForm.motivo}
                  onChange={(e) =>
                    setAdjustForm((prev) => ({ ...prev, motivo: e.target.value }))
                  }
                  className="w-full px-3 py-2 bg-gray-900 border border-gray-600 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-blue-500"
                  placeholder="Motivo del ajuste..."
                />
              </div>

              {/* Actions */}
              <div className="flex justify-end gap-3 pt-2 border-t border-gray-700">
                <button
                  type="button"
                  onClick={() => setShowAdjustment(false)}
                  className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isAdjusting}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors disabled:opacity-50"
                >
                  {isAdjusting ? 'Aplicando...' : 'Aplicar ajuste'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Import modal */}
      {showImport && (
        <AdminInventoryImport
          onClose={() => setShowImport(false)}
          onImported={handleImported}
        />
      )}
    </div>
  );
}

import React, { useState, useEffect, useCallback } from 'react';
import {
  ShoppingCart,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  Eye,
} from 'lucide-react';
import { apiClient } from '../../lib/apiClient';
import type { AdminOrder } from './types';
import { AdminOrderDetail } from './AdminOrderDetail';

const LIMIT = 15;

const ORDER_STATUSES = [
  { value: '', label: 'Todos' },
  { value: 'pendiente', label: 'Pendiente' },
  { value: 'confirmado', label: 'Confirmado' },
  { value: 'procesando', label: 'Procesando' },
  { value: 'enviado', label: 'Enviado' },
  { value: 'entregado', label: 'Entregado' },
  { value: 'cancelado', label: 'Cancelado' },
];

function getOrderStatusLabel(estado: string): string {
  const labels: Record<string, string> = {
    pendiente: 'Pendiente',
    confirmado: 'Confirmado',
    procesando: 'Procesando',
    enviado: 'Enviado',
    entregado: 'Entregado',
    cancelado: 'Cancelado',
  };
  return labels[estado] ?? estado;
}

function getOrderStatusColor(estado: string): string {
  const colors: Record<string, string> = {
    pendiente: 'bg-yellow-900/30 text-yellow-400 border-yellow-700',
    confirmado: 'bg-blue-900/30 text-blue-400 border-blue-700',
    procesando: 'bg-purple-900/30 text-purple-400 border-purple-700',
    enviado: 'bg-cyan-900/30 text-cyan-400 border-cyan-700',
    entregado: 'bg-green-900/30 text-green-400 border-green-700',
    cancelado: 'bg-red-900/30 text-red-400 border-red-700',
  };
  return colors[estado] ?? 'bg-gray-900/30 text-gray-400 border-gray-700';
}

export function AdminOrders() {
  const [orders, setOrders] = useState<AdminOrder[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Detail view
  const [selectedOrder, setSelectedOrder] = useState<AdminOrder | null>(null);

  const loadOrders = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      params.set('page', String(page));
      params.set('limit', String(LIMIT));
      if (statusFilter) params.set('estado', statusFilter);

      const data = await apiClient.get<{ orders: AdminOrder[]; total: number }>(
        `/admin/orders?${params.toString()}`
      );
      setOrders(data.orders ?? []);
      setTotal(data.total ?? 0);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cargar pedidos');
    } finally {
      setIsLoading(false);
    }
  }, [page, statusFilter]);

  useEffect(() => {
    loadOrders();
  }, [loadOrders]);

  const totalPages = Math.max(1, Math.ceil(total / LIMIT));

  const handleStatusFilterChange = (value: string) => {
    setStatusFilter(value);
    setPage(1);
  };

  const handleViewOrder = async (order: AdminOrder) => {
    try {
      const detail = await apiClient.get<AdminOrder>(`/admin/orders/${order.id}`);
      setSelectedOrder(detail);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cargar detalle del pedido');
    }
  };

  const handleStatusChange = async (orderId: number, newStatus: string) => {
    try {
      await apiClient.put(`/admin/orders/${orderId}/status`, { estado: newStatus });
      // Refresh the selected order detail
      const updated = await apiClient.get<AdminOrder>(`/admin/orders/${orderId}`);
      setSelectedOrder(updated);
      loadOrders();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cambiar estado del pedido');
    }
  };

  const handleBack = () => {
    setSelectedOrder(null);
  };

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(value);

  const formatDate = (dateStr: string) =>
    new Date(dateStr).toLocaleDateString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });

  // Show order detail view
  if (selectedOrder) {
    return (
      <AdminOrderDetail
        order={selectedOrder}
        onBack={handleBack}
        onStatusChange={handleStatusChange}
      />
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-white">Pedidos</h2>
          <p className="text-gray-400 mt-1">Gestión de pedidos de clientes</p>
        </div>
        <button
          onClick={loadOrders}
          disabled={isLoading}
          className="flex items-center gap-2 px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          Recargar
        </button>
      </div>

      {/* Status filter */}
      <div>
        <select
          value={statusFilter}
          onChange={(e) => handleStatusFilterChange(e.target.value)}
          aria-label="Filtrar pedidos por estado"
          className="px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-blue-500"
        >
          {ORDER_STATUSES.map((s) => (
            <option key={s.value} value={s.value}>
              {s.label}
            </option>
          ))}
        </select>
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
          <span className="text-gray-400">Cargando pedidos...</span>
        </div>
      ) : (
        <div className="bg-gray-800 rounded-lg border border-gray-700 overflow-hidden">
          {orders.length === 0 ? (
            <div className="text-center py-12">
              <ShoppingCart className="w-12 h-12 text-gray-600 mx-auto mb-4" />
              <p className="text-gray-400">No se encontraron pedidos</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full" aria-label="Lista de pedidos">
                <thead>
                  <tr className="border-b border-gray-700 bg-gray-900/50">
                    <th scope="col" className="text-left py-3 px-4 text-xs font-semibold text-gray-400 uppercase tracking-wide">
                      N.° Pedido
                    </th>
                    <th scope="col" className="text-left py-3 px-4 text-xs font-semibold text-gray-400 uppercase tracking-wide">
                      Cliente
                    </th>
                    <th scope="col" className="text-left py-3 px-4 text-xs font-semibold text-gray-400 uppercase tracking-wide">
                      Total
                    </th>
                    <th scope="col" className="text-left py-3 px-4 text-xs font-semibold text-gray-400 uppercase tracking-wide">
                      Estado
                    </th>
                    <th scope="col" className="text-left py-3 px-4 text-xs font-semibold text-gray-400 uppercase tracking-wide">
                      Fecha
                    </th>
                    <th scope="col" className="text-right py-3 px-4 text-xs font-semibold text-gray-400 uppercase tracking-wide">
                      Acciones
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-700">
                  {orders.map((order) => (
                    <tr
                      key={order.id}
                      className="hover:bg-gray-700/30 transition-colors cursor-pointer"
                      onClick={() => handleViewOrder(order)}
                    >
                      <td className="py-3 px-4 text-white text-sm font-medium">
                        {order.numero_pedido}
                      </td>
                      <td className="py-3 px-4">
                        <div>
                          <p className="text-gray-300 text-sm">
                            {order.usuario_nombre ?? '—'}
                          </p>
                          {order.usuario_email && (
                            <p className="text-gray-500 text-xs">{order.usuario_email}</p>
                          )}
                        </div>
                      </td>
                      <td className="py-3 px-4 text-gray-300 text-sm">
                        {formatCurrency(order.total)}
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border ${getOrderStatusColor(order.estado)}`}
                        >
                          {getOrderStatusLabel(order.estado)}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-gray-400 text-sm">
                        {formatDate(order.creado_en)}
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center justify-end">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleViewOrder(order);
                            }}
                            className="p-1.5 text-gray-400 hover:text-blue-400 hover:bg-gray-700 rounded transition-colors"
                            title="Ver detalle"
                            aria-label={`Ver detalle del pedido ${order.numero_pedido}`}
                          >
                            <Eye className="w-4 h-4" />
                          </button>
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
            Mostrando {(page - 1) * LIMIT + 1}–{Math.min(page * LIMIT, total)} de {total} pedidos
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
        {total} pedido{total !== 1 ? 's' : ''} en total
      </div>
    </div>
  );
}

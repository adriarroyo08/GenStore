import React, { useState, useEffect } from 'react';
import {
  TrendingUp,
  ShoppingCart,
  AlertTriangle,
  Users,
  RefreshCw,
  Package,
  Truck,
  DollarSign,
  Percent,
  Building2,
} from 'lucide-react';
import { apiClient } from '../../lib/apiClient';
import type { DashboardStats, AdminOrder, InventoryAlert } from './types';

interface StatCardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  color: string;
}

function StatCard({ title, value, icon, color }: StatCardProps) {
  return (
    <div className="bg-gray-800 rounded-lg border border-gray-700 p-5" role="group" aria-label={title}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-400">{title}</p>
          <p className="text-2xl font-bold text-white mt-1">{value}</p>
        </div>
        <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${color}`}>
          {icon}
        </div>
      </div>
    </div>
  );
}

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

export function AdminDashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadDashboard = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await apiClient.get<DashboardStats>('/admin/inventory/dashboard');
      setStats(data);

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cargar el dashboard');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadDashboard();
  }, []);

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(value);

  const formatDate = (dateStr: string) =>
    new Date(dateStr).toLocaleDateString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });

  return (
    <section aria-labelledby="admin-dashboard-heading" className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 id="admin-dashboard-heading" className="text-2xl font-bold text-white">Dashboard</h2>
          <p className="text-gray-400 mt-1">Resumen general del sistema</p>
        </div>
        <button
          onClick={loadDashboard}
          disabled={isLoading}
          className="flex items-center gap-2 px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          Actualizar
        </button>
      </div>

      {error && (
        <div role="alert" className="bg-red-900/20 border border-red-700 text-red-400 rounded-lg p-4">
          {error}
        </div>
      )}

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <RefreshCw className="w-6 h-6 animate-spin text-blue-400 mr-2" />
          <span className="text-gray-400">Cargando estadísticas...</span>
        </div>
      ) : (
        <>
          {/* Stat Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard
              title="Ventas del mes"
              value={stats?.ventas_mes != null ? formatCurrency(stats.ventas_mes) : '—'}
              icon={<TrendingUp className="w-6 h-6 text-white" />}
              color="bg-blue-600"
            />
            <StatCard
              title="Pedidos activos"
              value={stats?.pedidos_activos ?? '—'}
              icon={<ShoppingCart className="w-6 h-6 text-white" />}
              color="bg-purple-600"
            />
            <StatCard
              title="Productos con stock bajo"
              value={stats?.stock_bajo ?? '—'}
              icon={<AlertTriangle className="w-6 h-6 text-white" />}
              color="bg-yellow-600"
            />
            <StatCard
              title="Usuarios activos"
              value={stats?.usuarios_activos ?? '—'}
              icon={<Users className="w-6 h-6 text-white" />}
              color="bg-green-600"
            />
          </div>

          {/* Dropshipping KPI Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard
              title="Pedidos pendientes proveedor"
              value="Pr\u00f3ximamente"
              icon={<Truck className="w-6 h-6 text-white" />}
              color="bg-orange-600"
            />
            <StatCard
              title="Beneficio bruto del mes"
              value="Pr\u00f3ximamente"
              icon={<DollarSign className="w-6 h-6 text-white" />}
              color="bg-emerald-600"
            />
            <StatCard
              title="Margen medio"
              value="Pr\u00f3ximamente"
              icon={<Percent className="w-6 h-6 text-white" />}
              color="bg-gray-600"
            />
            <StatCard
              title="Proveedores activos"
              value="Pr\u00f3ximamente"
              icon={<Building2 className="w-6 h-6 text-white" />}
              color="bg-gray-600"
            />
          </div>

          {/* Recent Orders */}
          <div className="bg-gray-800 rounded-lg border border-gray-700 overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-700">
              <h3 className="font-semibold text-white">Pedidos recientes</h3>
            </div>
            {!stats?.pedidos_recientes || stats.pedidos_recientes.length === 0 ? (
              <div className="text-center py-8">
                <ShoppingCart className="w-10 h-10 text-gray-600 mx-auto mb-2" />
                <p className="text-gray-400 text-sm">No hay pedidos recientes</p>
              </div>
            ) : (
              <table className="w-full" aria-label="Pedidos recientes">
                <thead>
                  <tr className="bg-gray-900/50">
                    <th scope="col" className="text-left py-2 px-4 text-xs text-gray-400 uppercase tracking-wide">
                      Pedido
                    </th>
                    <th scope="col" className="text-left py-2 px-4 text-xs text-gray-400 uppercase tracking-wide">
                      Total
                    </th>
                    <th scope="col" className="text-left py-2 px-4 text-xs text-gray-400 uppercase tracking-wide">
                      Estado
                    </th>
                    <th scope="col" className="text-left py-2 px-4 text-xs text-gray-400 uppercase tracking-wide">
                      Fecha
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-700">
                  {stats.pedidos_recientes.slice(0, 5).map((order: AdminOrder) => (
                    <tr key={order.id} className="hover:bg-gray-700/30 transition-colors">
                      <td className="py-3 px-4 text-white text-sm font-medium">
                        {order.numero_pedido}
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
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          {/* Low Stock Alerts */}
          <div className="bg-gray-800 rounded-lg border border-gray-700 overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-700">
              <h3 className="font-semibold text-white">Alertas de stock bajo</h3>
            </div>
            {!stats?.alertas_stock || stats.alertas_stock.length === 0 ? (
              <div className="text-center py-8">
                <Package className="w-10 h-10 text-gray-600 mx-auto mb-2" />
                <p className="text-gray-400 text-sm">No hay alertas de stock</p>
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
                  {stats.alertas_stock.map((alert: InventoryAlert) => (
                    <tr key={alert.id} className="hover:bg-gray-700/30 transition-colors">
                      <td className="py-3 px-4 text-white text-sm">{alert.nombre}</td>
                      <td className="py-3 px-4 text-gray-400 text-sm">{alert.sku}</td>
                      <td className="py-3 px-4">
                        <span className="text-red-400 font-medium text-sm">{alert.stock_actual}</span>
                      </td>
                      <td className="py-3 px-4 text-gray-400 text-sm">{alert.stock_minimo}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </>
      )}
    </section>
  );
}

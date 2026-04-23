import React, { useState, useEffect } from 'react';
import {
  ArrowLeft,
  Save,
  Package,
  MapPin,
  RotateCcw,
  FileText,
  Truck,
  Copy,
  ExternalLink,
  TrendingUp,
} from 'lucide-react';
import type { AdminOrder, AdminRefund, AdminShipment } from './types';
import { AdminRefundModal } from './AdminRefundModal';
import { apiClient } from '../../lib/apiClient';

interface AdminOrderDetailProps {
  order: AdminOrder;
  onBack: () => void;
  onStatusChange: (orderId: number, newStatus: string) => void;
}

const ORDER_STATUSES = [
  { value: 'pendiente', label: 'Pendiente' },
  { value: 'pagado', label: 'Pagado' },
  { value: 'confirmado', label: 'Confirmado' },
  { value: 'procesando', label: 'Procesando' },
  { value: 'enviado', label: 'Enviado' },
  { value: 'entregado', label: 'Entregado' },
  { value: 'cancelado', label: 'Cancelado' },
  { value: 'devuelto', label: 'Devuelto' },
  { value: 'fallido', label: 'Fallido' },
];

function getOrderStatusLabel(estado: string): string {
  const labels: Record<string, string> = {
    pendiente: 'Pendiente',
    pagado: 'Pagado',
    confirmado: 'Confirmado',
    procesando: 'Procesando',
    enviado: 'Enviado',
    entregado: 'Entregado',
    cancelado: 'Cancelado',
    devuelto: 'Devuelto',
    fallido: 'Fallido',
  };
  return labels[estado] ?? estado;
}

function getOrderStatusColor(estado: string): string {
  const colors: Record<string, string> = {
    pendiente: 'bg-yellow-900/30 text-yellow-400 border-yellow-700',
    pagado: 'bg-emerald-900/30 text-emerald-400 border-emerald-700',
    confirmado: 'bg-blue-900/30 text-blue-400 border-blue-700',
    procesando: 'bg-purple-900/30 text-purple-400 border-purple-700',
    enviado: 'bg-cyan-900/30 text-cyan-400 border-cyan-700',
    entregado: 'bg-green-900/30 text-green-400 border-green-700',
    cancelado: 'bg-red-900/30 text-red-400 border-red-700',
    devuelto: 'bg-orange-900/30 text-orange-400 border-orange-700',
    fallido: 'bg-red-900/30 text-red-400 border-red-700',
  };
  return colors[estado] ?? 'bg-gray-900/30 text-gray-400 border-gray-700';
}

function getRefundStatusColor(estado: string): string {
  const colors: Record<string, string> = {
    pendiente: 'text-yellow-400',
    completado: 'text-green-400',
    fallido: 'text-red-400',
  };
  return colors[estado] ?? 'text-gray-400';
}

export function AdminOrderDetail({ order, onBack, onStatusChange }: AdminOrderDetailProps) {
  const [newStatus, setNewStatus] = useState(order.estado);
  const [isSaving, setIsSaving] = useState(false);
  const [showRefundModal, setShowRefundModal] = useState(false);
  const [refunds, setRefunds] = useState<AdminRefund[]>([]);
  const [invoiceUrl, setInvoiceUrl] = useState<string | null>(null);
  const [shipment, setShipment] = useState<AdminShipment | null>(null);
  const [availableCarriers, setAvailableCarriers] = useState<string[]>([]);
  const [selectedCarrier, setSelectedCarrier] = useState('');
  const [isCreatingShipment, setIsCreatingShipment] = useState(false);
  const [addressCopied, setAddressCopied] = useState(false);

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(value);

  const formatDate = (dateStr: string) =>
    new Date(dateStr).toLocaleDateString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });

  useEffect(() => {
    loadRefunds();
    loadInvoice();
    loadShipment();
    loadCarriers();
  }, [order.id]);

  const loadShipment = async () => {
    try {
      const result = await apiClient.get<AdminShipment>(`/admin/shipping/orders/${order.id}/shipment`);
      setShipment(result);
    } catch {
      // No shipment yet
    }
  };

  const loadCarriers = async () => {
    try {
      const result = await apiClient.get<{ carriers: string[] }>('/admin/shipping/carriers');
      setAvailableCarriers(result.carriers);
      if (result.carriers.length > 0) setSelectedCarrier(result.carriers[0]);
    } catch {
      // Shipping not configured
    }
  };

  const handleCreateShipment = async () => {
    if (!selectedCarrier) return;
    setIsCreatingShipment(true);
    try {
      const result = await apiClient.post<AdminShipment>(`/admin/shipping/orders/${order.id}/ship`, {
        carrier: selectedCarrier,
      });
      setShipment({ ...result, events: [] });
    } catch (e) {
      console.error('Error creating shipment:', e);
    } finally {
      setIsCreatingShipment(false);
    }
  };

  const loadInvoice = async () => {
    try {
      const result = await apiClient.get<{ url: string }>(`/admin/orders/${order.id}/invoice`);
      setInvoiceUrl(result.url);
    } catch {
      // Invoice may not exist yet
    }
  };

  const loadRefunds = async () => {
    try {
      const result = await apiClient.get<{ refunds: AdminRefund[] }>(`/admin/orders/${order.id}/refunds`);
      setRefunds(result.refunds || []);
    } catch {
      // May not have refunds
    }
  };

  const totalRefunded = refunds
    .filter((r) => r.estado === 'completado')
    .reduce((sum, r) => sum + r.amount, 0);

  const canRefund =
    ['pagado', 'enviado', 'entregado'].includes(order.estado) &&
    order.metodo_pago &&
    totalRefunded < order.total;

  const handleSaveStatus = async () => {
    if (newStatus === order.estado) return;
    setIsSaving(true);
    try {
      await onStatusChange(order.id, newStatus);
    } finally {
      setIsSaving(false);
    }
  };

  const handleRefunded = () => {
    setShowRefundModal(false);
    loadRefunds();
  };

  const handleCopyAddress = async () => {
    if (!order.direccion_envio) return;
    const addr = order.direccion_envio;
    const lines = [
      `${addr.nombre} ${addr.apellidos}`,
      addr.linea1,
      addr.linea2,
      `${addr.codigo_postal} ${addr.ciudad}${addr.provincia ? `, ${addr.provincia}` : ''}`,
      addr.pais,
      addr.telefono ? `Tel: ${addr.telefono}` : null,
    ].filter(Boolean).join('\n');
    try {
      await navigator.clipboard.writeText(lines);
      setAddressCopied(true);
      setTimeout(() => setAddressCopied(false), 2000);
    } catch {
      // Clipboard not available
    }
  };

  // Supplier info: items that have supplier data
  const itemsWithSupplier = (order.items ?? []).filter((item) => item.supplier);

  // Profit summary calculations
  const revenue = order.total;
  const totalCost = (order.items ?? []).reduce(
    (sum, item) => sum + (item.precio_coste ?? 0) * item.cantidad,
    0,
  );
  const hasCostData = (order.items ?? []).some((item) => item.precio_coste != null);

  const paymentMethod = (order.metodo_pago ?? '').toLowerCase();
  let gatewayFee = 0;
  let gatewayLabel = 'Comisión pasarela';
  // Legacy: standalone PayPal orders (before Stripe integration)
  if (paymentMethod.includes('paypal')) {
    gatewayFee = revenue * 0.0349 + 0.49;
    gatewayLabel = 'Comisión PayPal (~3.49% + 0,49 €)';
  } else if (paymentMethod.includes('stripe') || paymentMethod.includes('tarjeta') || paymentMethod.includes('card')) {
    gatewayFee = revenue * 0.029 + 0.25;
    gatewayLabel = 'Comisión Stripe (~2.9% + 0,25 €)';
  }

  const netProfit = revenue - totalCost - gatewayFee;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button
          onClick={onBack}
          className="p-2 bg-gray-800 border border-gray-700 rounded-lg text-gray-300 hover:bg-gray-700 transition-colors"
          aria-label="Volver a la lista de pedidos"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="flex-1">
          <h2 className="text-2xl font-bold text-white">
            Pedido {order.numero_pedido}
          </h2>
          <p className="text-gray-400 mt-1">
            Creado el {formatDate(order.creado_en)}
          </p>
        </div>
        <div className="flex items-center gap-3">
          {invoiceUrl && (
            <a
              href={invoiceUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600/20 border border-blue-700 text-blue-400 hover:bg-blue-600/30 rounded-lg transition-colors text-sm"
            >
              <FileText className="w-4 h-4" />
              Factura
            </a>
          )}
          {canRefund && (
            <button
              onClick={() => setShowRefundModal(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-red-600/20 border border-red-700 text-red-400 hover:bg-red-600/30 rounded-lg transition-colors text-sm"
            >
              <RotateCcw className="w-4 h-4" />
              Reembolsar
            </button>
          )}
          <span
            className={`inline-flex items-center px-3 py-1 rounded text-sm font-medium border ${getOrderStatusColor(order.estado)}`}
            aria-label={`Estado del pedido: ${getOrderStatusLabel(order.estado)}`}
          >
            {getOrderStatusLabel(order.estado)}
          </span>
        </div>
      </div>

      {/* Order info cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Customer info */}
        <div className="bg-gray-800 rounded-lg border border-gray-700 p-4">
          <h4 className="text-sm font-semibold text-gray-400 uppercase tracking-wide mb-3">
            Cliente
          </h4>
          <p className="text-white font-medium">{order.usuario_nombre ?? '—'}</p>
          {order.usuario_email && (
            <p className="text-gray-400 text-sm mt-1">{order.usuario_email}</p>
          )}
        </div>

        {/* Payment summary */}
        <div className="bg-gray-800 rounded-lg border border-gray-700 p-4">
          <h4 className="text-sm font-semibold text-gray-400 uppercase tracking-wide mb-3">
            Resumen
          </h4>
          <div className="space-y-1 text-sm">
            {order.subtotal != null && (
              <div className="flex justify-between">
                <span className="text-gray-400">Subtotal</span>
                <span className="text-gray-300">{formatCurrency(order.subtotal)}</span>
              </div>
            )}
            {order.iva != null && (
              <div className="flex justify-between">
                <span className="text-gray-400">IVA</span>
                <span className="text-gray-300">{formatCurrency(order.iva)}</span>
              </div>
            )}
            <div className="flex justify-between pt-1 border-t border-gray-700">
              <span className="text-white font-medium">Total</span>
              <span className="text-white font-bold">{formatCurrency(order.total)}</span>
            </div>
            {totalRefunded > 0 && (
              <div className="flex justify-between text-red-400">
                <span>Reembolsado</span>
                <span>-{formatCurrency(totalRefunded)}</span>
              </div>
            )}
          </div>
          {order.metodo_pago && (
            <p className="text-gray-500 text-xs mt-2">
              Pago: {order.metodo_pago}
            </p>
          )}
        </div>

        {/* Status change */}
        <div className="bg-gray-800 rounded-lg border border-gray-700 p-4">
          <h4 className="text-sm font-semibold text-gray-400 uppercase tracking-wide mb-3">
            Cambiar estado
          </h4>
          <div className="flex gap-2">
            <select
              value={newStatus}
              onChange={(e) => setNewStatus(e.target.value)}
              aria-label="Nuevo estado del pedido"
              className="flex-1 px-3 py-2 bg-gray-900 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-blue-500 text-sm"
            >
              {ORDER_STATUSES.map((s) => (
                <option key={s.value} value={s.value}>
                  {s.label}
                </option>
              ))}
            </select>
            <button
              onClick={handleSaveStatus}
              disabled={isSaving || newStatus === order.estado}
              className="flex items-center gap-1.5 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors disabled:opacity-50 text-sm"
            >
              <Save className="w-4 h-4" />
              {isSaving ? 'Guardando...' : 'Guardar'}
            </button>
          </div>
        </div>
      </div>

      {/* Order items */}
      <div className="bg-gray-800 rounded-lg border border-gray-700 overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-700">
          <h3 className="font-semibold text-white flex items-center gap-2">
            <Package className="w-4 h-4" />
            Artículos del pedido
          </h3>
        </div>
        {!order.items || order.items.length === 0 ? (
          <div className="text-center py-8">
            <Package className="w-10 h-10 text-gray-600 mx-auto mb-2" />
            <p className="text-gray-400 text-sm">No hay artículos en este pedido</p>
          </div>
        ) : (
          <table className="w-full" aria-label="Artículos del pedido">
            <thead>
              <tr className="bg-gray-900/50">
                <th scope="col" className="text-left py-2 px-4 text-xs text-gray-400 uppercase tracking-wide">
                  Producto
                </th>
                <th scope="col" className="text-left py-2 px-4 text-xs text-gray-400 uppercase tracking-wide">
                  SKU
                </th>
                <th scope="col" className="text-right py-2 px-4 text-xs text-gray-400 uppercase tracking-wide">
                  Cantidad
                </th>
                <th scope="col" className="text-right py-2 px-4 text-xs text-gray-400 uppercase tracking-wide">
                  Precio unitario
                </th>
                <th scope="col" className="text-right py-2 px-4 text-xs text-gray-400 uppercase tracking-wide">
                  Subtotal
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-700">
              {order.items.map((item) => (
                <tr key={item.id} className="hover:bg-gray-700/30 transition-colors">
                  <td className="py-3 px-4 text-white text-sm font-medium">
                    {item.producto_nombre}
                  </td>
                  <td className="py-3 px-4 text-gray-400 text-sm font-mono">
                    {item.sku ?? '—'}
                  </td>
                  <td className="py-3 px-4 text-gray-300 text-sm text-right">
                    {item.cantidad}
                  </td>
                  <td className="py-3 px-4 text-gray-300 text-sm text-right">
                    {formatCurrency(item.precio_unitario)}
                  </td>
                  <td className="py-3 px-4 text-white text-sm text-right font-medium">
                    {formatCurrency(item.subtotal)}
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="border-t border-gray-600">
                <td colSpan={4} className="py-3 px-4 text-right text-sm font-medium text-gray-300">
                  Total
                </td>
                <td className="py-3 px-4 text-right text-sm font-bold text-white">
                  {formatCurrency(order.total)}
                </td>
              </tr>
            </tfoot>
          </table>
        )}
      </div>

      {/* Supplier info */}
      {itemsWithSupplier.length > 0 && (
        <div className="bg-gray-800 rounded-lg border border-gray-700 overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-700">
            <h3 className="font-semibold text-white flex items-center gap-2">
              <Package className="w-4 h-4" />
              Información de proveedores
            </h3>
          </div>
          <div className="divide-y divide-gray-700">
            {itemsWithSupplier.map((item) => (
              <div key={item.id} className="px-5 py-4 flex flex-col sm:flex-row sm:items-start gap-3">
                <div className="flex-1 min-w-0">
                  <p className="text-white text-sm font-medium">{item.producto_nombre}</p>
                  <p className="text-gray-300 text-sm mt-1">
                    Proveedor: <span className="text-white font-medium">{item.supplier!.nombre}</span>
                  </p>
                  {item.supplier_sku && (
                    <p className="text-gray-400 text-xs mt-1">
                      SKU proveedor: <span className="font-mono">{item.supplier_sku}</span>
                    </p>
                  )}
                </div>
                <div className="flex flex-wrap gap-3 text-xs text-gray-400 shrink-0">
                  {item.supplier!.email && (
                    <a
                      href={`mailto:${item.supplier!.email}`}
                      className="hover:text-blue-400 transition-colors"
                    >
                      {item.supplier!.email}
                    </a>
                  )}
                  {item.supplier!.telefono && (
                    <span>{item.supplier!.telefono}</span>
                  )}
                  {item.supplier!.web && (
                    <a
                      href={item.supplier!.web}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1 hover:text-blue-400 transition-colors"
                    >
                      Web <ExternalLink className="w-3 h-3" />
                    </a>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Profit summary */}
      {hasCostData && (
        <div className="bg-gray-800 rounded-lg border border-gray-700 p-5">
          <h3 className="font-semibold text-white flex items-center gap-2 mb-4">
            <TrendingUp className="w-4 h-4" />
            Resumen de rentabilidad
          </h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-400">Ingresos (PVP)</span>
              <span className="text-gray-300">{formatCurrency(revenue)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Coste de producto</span>
              <span className="text-gray-300">-{formatCurrency(totalCost)}</span>
            </div>
            {gatewayFee > 0 && (
              <div className="flex justify-between">
                <span className="text-gray-400">{gatewayLabel}</span>
                <span className="text-gray-300">-{formatCurrency(gatewayFee)}</span>
              </div>
            )}
            <div className="flex justify-between pt-2 border-t border-gray-700">
              <span className="text-white font-medium">Beneficio neto</span>
              <span className={`font-bold ${netProfit >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                {formatCurrency(netProfit)}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Refund History */}
      {refunds.length > 0 && (
        <div className="bg-gray-800 rounded-lg border border-gray-700 overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-700">
            <h3 className="font-semibold text-white flex items-center gap-2">
              <RotateCcw className="w-4 h-4" />
              Historial de reembolsos
            </h3>
          </div>
          <table className="w-full" aria-label="Historial de reembolsos">
            <thead>
              <tr className="bg-gray-900/50">
                <th scope="col" className="text-left py-2 px-4 text-xs text-gray-400 uppercase tracking-wide">Fecha</th>
                <th scope="col" className="text-left py-2 px-4 text-xs text-gray-400 uppercase tracking-wide">Monto</th>
                <th scope="col" className="text-left py-2 px-4 text-xs text-gray-400 uppercase tracking-wide">Motivo</th>
                <th scope="col" className="text-left py-2 px-4 text-xs text-gray-400 uppercase tracking-wide">Admin</th>
                <th scope="col" className="text-left py-2 px-4 text-xs text-gray-400 uppercase tracking-wide">Estado</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-700">
              {refunds.map((refund) => (
                <tr key={refund.id} className="hover:bg-gray-700/30 transition-colors">
                  <td className="py-3 px-4 text-gray-300 text-sm">
                    {formatDate(refund.created_at)}
                  </td>
                  <td className="py-3 px-4 text-red-400 text-sm font-medium">
                    -{formatCurrency(refund.amount)}
                  </td>
                  <td className="py-3 px-4 text-gray-300 text-sm">
                    {refund.motivo || '—'}
                  </td>
                  <td className="py-3 px-4 text-gray-400 text-sm">
                    {refund.admin ? `${refund.admin.nombre} ${refund.admin.apellidos}` : '—'}
                  </td>
                  <td className={`py-3 px-4 text-sm font-medium ${getRefundStatusColor(refund.estado)}`}>
                    {refund.estado === 'completado' ? 'Completado' : refund.estado === 'pendiente' ? 'Pendiente' : 'Fallido'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Shipping address */}
      {order.direccion_envio && (
        <div className="bg-gray-800 rounded-lg border border-gray-700 p-5">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-white flex items-center gap-2">
              <MapPin className="w-4 h-4" />
              Dirección de envío
            </h3>
            <button
              onClick={handleCopyAddress}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-700 border border-gray-600 text-gray-300 hover:bg-gray-600 rounded-lg transition-colors text-xs"
              aria-label="Copiar dirección de envio"
            >
              <Copy className="w-3.5 h-3.5" />
              {addressCopied ? 'Copiado!' : 'Copiar dirección'}
            </button>
          </div>
          <div className="text-sm space-y-1">
            <p className="text-white font-medium">
              {order.direccion_envio.nombre} {order.direccion_envio.apellidos}
            </p>
            <p className="text-gray-300">{order.direccion_envio.linea1}</p>
            {order.direccion_envio.linea2 && (
              <p className="text-gray-300">{order.direccion_envio.linea2}</p>
            )}
            <p className="text-gray-300">
              {order.direccion_envio.codigo_postal} {order.direccion_envio.ciudad}
              {order.direccion_envio.provincia ? `, ${order.direccion_envio.provincia}` : ''}
            </p>
            <p className="text-gray-400">{order.direccion_envio.pais}</p>
            {order.direccion_envio.telefono && (
              <p className="text-gray-400">Tel: {order.direccion_envio.telefono}</p>
            )}
          </div>
        </div>
      )}

      {/* Shipping */}
      <div className="bg-gray-800 rounded-lg border border-gray-700 p-5">
        <h3 className="font-semibold text-white flex items-center gap-2 mb-3">
          <Truck className="w-4 h-4" />
          Envío
        </h3>

        {shipment ? (
          <div className="space-y-4">
            <div className="grid grid-cols-3 gap-4 text-sm">
              <div>
                <span className="text-gray-400">Transportista</span>
                <p className="text-white font-medium">{shipment.carrier.toUpperCase()}</p>
              </div>
              <div>
                <span className="text-gray-400">Seguimiento</span>
                <p className="text-white font-mono">{shipment.tracking_number ?? '—'}</p>
              </div>
              <div>
                <span className="text-gray-400">Estado</span>
                <p className="text-white font-medium capitalize">{shipment.estado.replace('_', ' ')}</p>
              </div>
            </div>

            {shipment.events && shipment.events.length > 0 && (
              <div className="mt-4">
                <h4 className="text-sm text-gray-400 mb-2">Historial de seguimiento</h4>
                <div className="space-y-2">
                  {shipment.events.map((event) => (
                    <div key={event.id} className="flex items-start gap-3 text-sm">
                      <div className="w-2 h-2 mt-1.5 rounded-full bg-blue-500 shrink-0" />
                      <div className="flex-1">
                        <p className="text-white capitalize">{event.estado.replace('_', ' ')}</p>
                        {event.descripcion && <p className="text-gray-400">{event.descripcion}</p>}
                        {event.ubicacion && <p className="text-gray-500 text-xs">{event.ubicacion}</p>}
                      </div>
                      <span className="text-gray-500 text-xs shrink-0">
                        {new Date(event.occurred_at).toLocaleString('es-ES')}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : order.estado === 'pagado' && availableCarriers.length > 0 ? (
          <div className="flex items-center gap-3">
            <select
              value={selectedCarrier}
              onChange={(e) => setSelectedCarrier(e.target.value)}
              aria-label="Seleccionar transportista"
              className="px-3 py-2 bg-gray-900 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-blue-500 text-sm"
            >
              {availableCarriers.map((c) => (
                <option key={c} value={c}>{c.toUpperCase()}</option>
              ))}
            </select>
            <button
              onClick={handleCreateShipment}
              disabled={isCreatingShipment}
              className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors disabled:opacity-50 text-sm"
            >
              <Truck className="w-4 h-4" />
              {isCreatingShipment ? 'Creando...' : 'Crear envío'}
            </button>
          </div>
        ) : (
          <p className="text-gray-400 text-sm">
            {order.estado === 'pagado'
              ? 'No hay transportistas configurados'
              : 'El pedido debe estar pagado para crear un envío'}
          </p>
        )}
      </div>

      {/* Refund Modal */}
      {showRefundModal && (
        <AdminRefundModal
          orderId={order.id}
          orderTotal={order.total}
          previousRefunds={totalRefunded}
          onClose={() => setShowRefundModal(false)}
          onRefunded={handleRefunded}
        />
      )}
    </div>
  );
}

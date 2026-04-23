import { Resend } from 'resend';
import { env } from '../config/env.js';
import type { Order, OrderItem, Product, Shipment } from '../types/index.js';
import * as businessSettingsService from './businessSettingsService.js';

function escapeHtml(str: string): string {
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

let resend: Resend | null = null;

function getResend(): Resend {
  if (!resend) {
    if (!env.RESEND_API_KEY) {
      throw new Error('RESEND_API_KEY is not configured');
    }
    resend = new Resend(env.RESEND_API_KEY);
  }
  return resend;
}

// ── Shared layout ──

function layout(title: string, body: string): string {
  return `<!DOCTYPE html>
<html lang="es">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"></head>
<body style="margin:0;padding:0;background:#f4f4f5;font-family:Arial,Helvetica,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f5;padding:32px 0;">
<tr><td align="center">
<table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:8px;overflow:hidden;">
  <tr><td style="background:#2563eb;padding:24px 32px;">
    <h1 style="margin:0;color:#ffffff;font-size:20px;">${env.BUSINESS_NAME}</h1>
  </td></tr>
  <tr><td style="padding:32px;">
    <h2 style="margin:0 0 16px;color:#18181b;font-size:18px;">${title}</h2>
    ${body}
  </td></tr>
  <tr><td style="padding:16px 32px;background:#f4f4f5;text-align:center;color:#71717a;font-size:12px;">
    ${env.BUSINESS_NAME} &middot; ${env.BUSINESS_ADDRESS}<br>
    ${env.BUSINESS_EMAIL} &middot; ${env.BUSINESS_PHONE}
  </td></tr>
</table>
</td></tr>
</table>
</body>
</html>`;
}

// ── 0. Email verification ──

interface EmailVerificationData {
  customerName: string;
  customerEmail: string;
  confirmationUrl: string;
}

export async function sendEmailVerification(data: EmailVerificationData): Promise<void> {
  const { customerName, customerEmail, confirmationUrl } = data;

  const body = `
    <p style="color:#3f3f46;">Hola ${escapeHtml(customerName)},</p>
    <p style="color:#3f3f46;">Gracias por registrarte en <strong>${escapeHtml(env.BUSINESS_NAME)}</strong>. Para activar tu cuenta, confirma tu direccion de correo electronico haciendo clic en el boton de abajo:</p>
    <p style="text-align:center;margin:32px 0;">
      <a href="${escapeHtml(confirmationUrl)}" style="display:inline-block;padding:14px 32px;background:linear-gradient(135deg,#10b981,#2563eb);color:#ffffff;text-decoration:none;border-radius:8px;font-weight:bold;font-size:16px;">Verificar mi email</a>
    </p>
    <p style="color:#71717a;font-size:13px;">Si no creaste esta cuenta, puedes ignorar este mensaje.</p>
    <p style="color:#71717a;font-size:13px;">Este enlace expira en 24 horas.</p>
    <hr style="border:none;border-top:1px solid #e4e4e7;margin:24px 0;" />
    <p style="color:#a1a1aa;font-size:12px;">Si el boton no funciona, copia y pega este enlace en tu navegador:</p>
    <p style="color:#a1a1aa;font-size:11px;word-break:break-all;">${escapeHtml(confirmationUrl)}</p>`;

  await getResend().emails.send({
    from: env.EMAIL_FROM,
    to: customerEmail,
    subject: `Confirma tu email — ${env.BUSINESS_NAME}`,
    html: layout('Verifica tu cuenta', body),
  });
}

// ── 1. Payment confirmation ──

interface PaymentConfirmationData {
  order: Order;
  items: (OrderItem & { product?: Pick<Product, 'nombre'> })[];
  customerName: string;
  customerEmail: string;
}

export async function sendPaymentConfirmation(data: PaymentConfirmationData): Promise<void> {
  const { order, items, customerName, customerEmail } = data;

  const itemRows = items
    .map(
      (item) => `
    <tr>
      <td style="padding:8px;border-bottom:1px solid #e4e4e7;">${escapeHtml(item.product?.nombre ?? 'Producto')}</td>
      <td style="padding:8px;border-bottom:1px solid #e4e4e7;text-align:center;">${item.cantidad}</td>
      <td style="padding:8px;border-bottom:1px solid #e4e4e7;text-align:right;">${item.precio_unitario.toFixed(2)} &euro;</td>
      <td style="padding:8px;border-bottom:1px solid #e4e4e7;text-align:right;">${item.subtotal.toFixed(2)} &euro;</td>
    </tr>`
    )
    .join('');

  const body = `
    <p style="color:#3f3f46;">Hola ${escapeHtml(customerName)},</p>
    <p style="color:#3f3f46;">Tu pago ha sido confirmado. Aqui tienes el resumen de tu pedido:</p>
    <table width="100%" style="margin:16px 0;font-size:14px;border-collapse:collapse;">
      <tr style="background:#f4f4f5;">
        <th style="padding:8px;text-align:left;">Producto</th>
        <th style="padding:8px;text-align:center;">Cant.</th>
        <th style="padding:8px;text-align:right;">Precio</th>
        <th style="padding:8px;text-align:right;">Subtotal</th>
      </tr>
      ${itemRows}
    </table>
    <table width="100%" style="font-size:14px;">
      <tr><td style="padding:4px 8px;color:#71717a;">Subtotal</td><td style="padding:4px 8px;text-align:right;">${order.subtotal.toFixed(2)} &euro;</td></tr>
      <tr><td style="padding:4px 8px;color:#71717a;">IVA (${order.tipo_iva ?? 21}%)</td><td style="padding:4px 8px;text-align:right;">${order.impuestos.toFixed(2)} &euro;</td></tr>
      <tr><td style="padding:4px 8px;color:#71717a;">Envio</td><td style="padding:4px 8px;text-align:right;">${order.gastos_envio.toFixed(2)} &euro;</td></tr>
      <tr><td style="padding:4px 8px;font-weight:bold;">Total</td><td style="padding:4px 8px;text-align:right;font-weight:bold;">${order.total.toFixed(2)} &euro;</td></tr>
    </table>
    <p style="color:#71717a;font-size:13px;margin-top:16px;">Pedido: <strong>${escapeHtml(order.numero_pedido)}</strong></p>`;

  await getResend().emails.send({
    from: env.EMAIL_FROM,
    to: customerEmail,
    subject: `Confirmacion de pago — Pedido ${order.numero_pedido}`,
    html: layout('Pago confirmado', body),
  });
}

// ── 2. Order shipped ──

interface OrderShippedData {
  order: Order;
  customerName: string;
  customerEmail: string;
  carrier: string;
  trackingNumber: string | null;
}

export async function sendOrderShipped(data: OrderShippedData): Promise<void> {
  const { order, customerName, customerEmail, carrier, trackingNumber } = data;

  const trackingLine = trackingNumber
    ? `<p style="color:#3f3f46;">Numero de seguimiento: <strong>${escapeHtml(trackingNumber)}</strong></p>`
    : '';

  const body = `
    <p style="color:#3f3f46;">Hola ${escapeHtml(customerName)},</p>
    <p style="color:#3f3f46;">Tu pedido <strong>${escapeHtml(order.numero_pedido)}</strong> ha sido enviado con <strong>${escapeHtml(carrier.toUpperCase())}</strong>.</p>
    ${trackingLine}
    <p style="color:#71717a;font-size:13px;">Te notificaremos cuando se entregue.</p>`;

  await getResend().emails.send({
    from: env.EMAIL_FROM,
    to: customerEmail,
    subject: `Pedido enviado — ${order.numero_pedido}`,
    html: layout('Pedido enviado', body),
  });
}

// ── 3. Order delivered ──

interface OrderDeliveredData {
  order: Order;
  customerName: string;
  customerEmail: string;
}

export async function sendOrderDelivered(data: OrderDeliveredData): Promise<void> {
  const { order, customerName, customerEmail } = data;

  const body = `
    <p style="color:#3f3f46;">Hola ${escapeHtml(customerName)},</p>
    <p style="color:#3f3f46;">Tu pedido <strong>${escapeHtml(order.numero_pedido)}</strong> ha sido entregado.</p>
    <p style="color:#3f3f46;">Esperamos que disfrutes de tu compra. Si tienes alguna pregunta, no dudes en contactarnos.</p>`;

  await getResend().emails.send({
    from: env.EMAIL_FROM,
    to: customerEmail,
    subject: `Pedido entregado — ${order.numero_pedido}`,
    html: layout('Pedido entregado', body),
  });
}

// ── 4. Order cancelled ──

interface OrderCancelledData {
  order: Order;
  customerName: string;
  customerEmail: string;
}

export async function sendOrderCancelled(data: OrderCancelledData): Promise<void> {
  const { order, customerName, customerEmail } = data;
  if (!customerEmail) return;

  const body = `
    <h2>Pedido Cancelado</h2>
    <p>Hola ${escapeHtml(customerName || 'cliente')},</p>
    <p>Tu pedido <strong>#${escapeHtml(order.numero_pedido)}</strong> ha sido cancelado.</p>
    <p>Si se realizó un cargo, el reembolso se procesará en los próximos 5-10 días hábiles.</p>
    <p>Si tienes alguna pregunta, no dudes en contactarnos.</p>
  `;

  try {
    await getResend().emails.send({
      from: env.EMAIL_FROM,
      to: customerEmail,
      subject: `Pedido cancelado — #${order.numero_pedido}`,
      html: layout('Pedido Cancelado', body),
    });
  } catch (err) {
    console.error('Failed to send cancellation email:', err);
  }
}

// ── 5. Return request update ──

interface ReturnRequestUpdateData {
  numeroPedido: string;
  customerName: string;
  customerEmail: string;
  estado: 'aprobado' | 'rechazado';
  adminNotes?: string;
}

export async function sendReturnRequestUpdate(data: ReturnRequestUpdateData): Promise<void> {
  const { numeroPedido, customerName, customerEmail, estado, adminNotes } = data;
  if (!customerEmail) return;

  const isApproved = estado === 'aprobado';
  const body = `
    <h2>Actualización de Devolución</h2>
    <p>Hola ${escapeHtml(customerName || 'cliente')},</p>
    <p>Tu solicitud de devolución para el pedido <strong>#${escapeHtml(numeroPedido)}</strong> ha sido <strong>${isApproved ? 'aprobada' : 'rechazada'}</strong>.</p>
    ${isApproved ? '<p>El reembolso se procesará en los próximos 5-10 días hábiles.</p>' : ''}
    ${adminNotes ? `<p><strong>Nota:</strong> ${escapeHtml(adminNotes)}</p>` : ''}
  `;

  try {
    await getResend().emails.send({
      from: env.EMAIL_FROM,
      to: customerEmail,
      subject: `Devolución ${isApproved ? 'aprobada' : 'rechazada'} — Pedido #${numeroPedido}`,
      html: layout('Actualización de Devolución', body),
    });
  } catch (err) {
    console.error('Failed to send return update email:', err);
  }
}

// ── 6. Invoice ready ──

interface InvoiceReadyData {
  order: Order;
  customerName: string;
  customerEmail: string;
  invoiceUrl: string;
  numeroFactura: string;
}

export async function sendInvoiceReady(data: InvoiceReadyData): Promise<void> {
  const { order, customerName, customerEmail, invoiceUrl, numeroFactura } = data;

  const body = `
    <p style="color:#3f3f46;">Hola ${escapeHtml(customerName)},</p>
    <p style="color:#3f3f46;">Tu factura <strong>${escapeHtml(numeroFactura)}</strong> para el pedido <strong>${escapeHtml(order.numero_pedido)}</strong> esta disponible.</p>
    <p style="text-align:center;margin:24px 0;">
      <a href="${escapeHtml(invoiceUrl)}" style="display:inline-block;padding:12px 24px;background:#2563eb;color:#ffffff;text-decoration:none;border-radius:6px;font-weight:bold;">Descargar factura</a>
    </p>
    <p style="color:#71717a;font-size:13px;">El enlace de descarga expira en 1 hora.</p>`;

  await getResend().emails.send({
    from: env.EMAIL_FROM,
    to: customerEmail,
    subject: `Factura ${numeroFactura} — Pedido ${order.numero_pedido}`,
    html: layout('Factura disponible', body),
  });
}

// ── 5. Stock alert (immediate) ──

interface StockAlertImmediateData {
  productName: string;
  sku: string;
  currentStock: number;
  stockMinimo: number;
}

export async function sendStockAlertImmediate(data: StockAlertImmediateData): Promise<void> {
  if (!env.STOCK_ALERT_ADMIN_EMAIL) return;

  const { productName, sku, currentStock, stockMinimo } = data;

  const body = `
    <p style="color:#3f3f46;">El siguiente producto tiene stock bajo:</p>
    <table width="100%" style="font-size:14px;border-collapse:collapse;margin:16px 0;">
      <tr><td style="padding:8px;color:#71717a;">Producto</td><td style="padding:8px;font-weight:bold;">${productName}</td></tr>
      <tr><td style="padding:8px;color:#71717a;">SKU</td><td style="padding:8px;">${sku}</td></tr>
      <tr><td style="padding:8px;color:#71717a;">Stock actual</td><td style="padding:8px;color:#dc2626;font-weight:bold;">${currentStock}</td></tr>
      <tr><td style="padding:8px;color:#71717a;">Stock minimo</td><td style="padding:8px;">${stockMinimo}</td></tr>
    </table>`;

  await getResend().emails.send({
    from: env.EMAIL_FROM,
    to: env.STOCK_ALERT_ADMIN_EMAIL,
    subject: `Alerta stock bajo — ${productName} (${currentStock} uds)`,
    html: layout('Alerta de stock bajo', body),
  });
}

// ── 6. Stock alert digest ──

interface StockAlertDigestProduct {
  nombre: string;
  sku: string;
  stock: number;
  stock_minimo: number;
}

export async function sendStockAlertDigest(products: StockAlertDigestProduct[]): Promise<void> {
  if (!env.STOCK_ALERT_ADMIN_EMAIL) return;
  if (products.length === 0) return;

  const rows = products
    .map(
      (p) => `
    <tr>
      <td style="padding:8px;border-bottom:1px solid #e4e4e7;">${p.nombre}</td>
      <td style="padding:8px;border-bottom:1px solid #e4e4e7;">${p.sku}</td>
      <td style="padding:8px;border-bottom:1px solid #e4e4e7;text-align:center;color:#dc2626;font-weight:bold;">${p.stock}</td>
      <td style="padding:8px;border-bottom:1px solid #e4e4e7;text-align:center;">${p.stock_minimo}</td>
    </tr>`
    )
    .join('');

  const body = `
    <p style="color:#3f3f46;">Hay <strong>${products.length}</strong> producto(s) con stock por debajo del minimo:</p>
    <table width="100%" style="font-size:14px;border-collapse:collapse;margin:16px 0;">
      <tr style="background:#f4f4f5;">
        <th style="padding:8px;text-align:left;">Producto</th>
        <th style="padding:8px;text-align:left;">SKU</th>
        <th style="padding:8px;text-align:center;">Stock</th>
        <th style="padding:8px;text-align:center;">Minimo</th>
      </tr>
      ${rows}
    </table>`;

  await getResend().emails.send({
    from: env.EMAIL_FROM,
    to: env.STOCK_ALERT_ADMIN_EMAIL,
    subject: `Resumen diario de stock bajo — ${products.length} producto(s)`,
    html: layout('Resumen de stock bajo', body),
  });
}

// ── 7. New order admin alert ──

interface NewOrderAdminAlertData {
  numeroPedido: string;
  customerName: string;
  customerEmail: string;
  shippingAddress: string;
  items: Array<{
    nombre: string;
    cantidad: number;
    precio: number;
    supplierName: string | null;
    supplierSku: string | null;
  }>;
  total: number;
  estimatedProfit: number;
  orderAdminUrl: string;
}

export async function sendNewOrderAdminAlert(data: NewOrderAdminAlertData): Promise<void> {
  const settings = await businessSettingsService.getAllSettings();
  const adminEmail = (settings.email_contacto as string) || env.STOCK_ALERT_ADMIN_EMAIL;
  if (!adminEmail) return;

  const itemsHtml = data.items.map((item) => `
    <tr>
      <td style="padding:8px;border-bottom:1px solid #eee;">${item.nombre}</td>
      <td style="padding:8px;border-bottom:1px solid #eee;">${item.cantidad}</td>
      <td style="padding:8px;border-bottom:1px solid #eee;">${item.precio.toFixed(2)} EUR</td>
      <td style="padding:8px;border-bottom:1px solid #eee;">${item.supplierName ?? '-'}</td>
      <td style="padding:8px;border-bottom:1px solid #eee;">${item.supplierSku ?? '-'}</td>
    </tr>
  `).join('');

  const html = layout('Nuevo Pedido', `
    <h2 style="color:#16a34a;">Nuevo pedido recibido</h2>
    <p><strong>Pedido:</strong> ${data.numeroPedido}</p>
    <p><strong>Cliente:</strong> ${data.customerName} (${data.customerEmail})</p>
    <p><strong>Dirección de envío:</strong><br/>${data.shippingAddress.replace(/\n/g, '<br/>')}</p>
    <table style="width:100%;border-collapse:collapse;margin:16px 0;">
      <thead>
        <tr style="background:#f8f9fa;">
          <th style="padding:8px;text-align:left;">Producto</th>
          <th style="padding:8px;text-align:left;">Cant.</th>
          <th style="padding:8px;text-align:left;">Precio</th>
          <th style="padding:8px;text-align:left;">Proveedor</th>
          <th style="padding:8px;text-align:left;">SKU Proveedor</th>
        </tr>
      </thead>
      <tbody>${itemsHtml}</tbody>
    </table>
    <p><strong>Total:</strong> ${data.total.toFixed(2)} EUR</p>
    <p><strong>Beneficio estimado:</strong> ${data.estimatedProfit.toFixed(2)} EUR</p>
    <a href="${data.orderAdminUrl}" style="display:inline-block;padding:12px 24px;background:#3b82f6;color:white;text-decoration:none;border-radius:8px;margin-top:16px;">Ver pedido en admin</a>
  `);

  await getResend().emails.send({
    from: env.EMAIL_FROM,
    to: adminEmail,
    subject: `Nuevo pedido ${data.numeroPedido}`,
    html,
  });
}

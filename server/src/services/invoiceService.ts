import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';
import { supabaseAdmin } from '../config/supabase.js';
import { env } from '../config/env.js';
import type { Order, OrderItem, Product, Address } from '../types/index.js';

// ── Sequential invoice number ──

async function getNextInvoiceNumber(year: number): Promise<string> {
  // Atomic increment via DB function — safe under concurrency
  const { data, error } = await supabaseAdmin.rpc('next_invoice_number', {
    p_year: year,
  });

  if (error) throw new Error(`Failed to get next invoice number: ${error.message}`);

  const nextNumber = data as number;
  return `FIS-${year}-${String(nextNumber).padStart(5, '0')}`;
}

// ── PDF generation ──

interface InvoiceData {
  numeroFactura: string;
  fecha: string;
  order: Order;
  items: (OrderItem & { product?: Pick<Product, 'nombre'> })[];
  billingAddress: Address;
  profile: { nombre: string; apellidos: string };
}

async function buildInvoicePdf(data: InvoiceData): Promise<Uint8Array> {
  const { numeroFactura, fecha, order, items, billingAddress, profile } = data;

  const doc = await PDFDocument.create();
  const page = doc.addPage([595.28, 841.89]); // A4
  const font = await doc.embedFont(StandardFonts.Helvetica);
  const fontBold = await doc.embedFont(StandardFonts.HelveticaBold);
  const { height } = page.getSize();

  const darkColor = rgb(0.1, 0.1, 0.1);
  const grayColor = rgb(0.4, 0.4, 0.4);
  const blueColor = rgb(0.145, 0.388, 0.922);

  let y = height - 50;

  // Helper
  const drawText = (text: string, x: number, yPos: number, size: number, f = font, color = darkColor) => {
    page.drawText(text, { x, y: yPos, size, font: f, color });
  };

  // ── Header ──
  drawText('FACTURA', 50, y, 24, fontBold, blueColor);
  drawText(numeroFactura, 50, y - 28, 12, font, grayColor);
  drawText(`Fecha: ${fecha}`, 400, y, 10, font, grayColor);
  y -= 60;

  // ── Business info (emisor) ──
  drawText('Emisor:', 50, y, 9, fontBold, grayColor);
  y -= 14;
  drawText(env.BUSINESS_NAME, 50, y, 10, fontBold);
  y -= 14;
  drawText(`NIF: ${env.BUSINESS_NIF}`, 50, y, 9);
  y -= 12;
  if (env.BUSINESS_ADDRESS) {
    drawText(env.BUSINESS_ADDRESS, 50, y, 9);
    y -= 12;
  }
  if (env.BUSINESS_EMAIL) {
    drawText(`${env.BUSINESS_EMAIL} | ${env.BUSINESS_PHONE}`, 50, y, 9);
    y -= 12;
  }
  y -= 10;

  // ── Customer info (receptor) ──
  drawText('Cliente:', 350, height - 110, 9, fontBold, grayColor);
  let cy = height - 124;
  drawText(`${profile.nombre} ${profile.apellidos}`, 350, cy, 10, fontBold);
  cy -= 14;
  drawText(`${billingAddress.calle}`, 350, cy, 9);
  cy -= 12;
  drawText(`${billingAddress.codigo_postal} ${billingAddress.ciudad}, ${billingAddress.provincia}`, 350, cy, 9);
  cy -= 12;
  drawText(billingAddress.pais, 350, cy, 9);
  cy -= 12;
  if (billingAddress.nif) {
    drawText(`NIF: ${billingAddress.nif}`, 350, cy, 9);
  }

  // ── Line items table ──
  y -= 10;
  // Table header
  page.drawRectangle({ x: 50, y: y - 4, width: 495, height: 20, color: rgb(0.95, 0.95, 0.95) });
  drawText('Producto', 55, y, 9, fontBold);
  drawText('Cant.', 340, y, 9, fontBold);
  drawText('Precio', 390, y, 9, fontBold);
  drawText('Subtotal', 470, y, 9, fontBold);
  y -= 20;

  for (const item of items) {
    const nombre = item.product?.nombre ?? 'Producto';
    const displayName = nombre.length > 45 ? nombre.substring(0, 42) + '...' : nombre;
    drawText(displayName, 55, y, 9);
    drawText(String(item.cantidad), 345, y, 9);
    drawText(`${item.precio_unitario.toFixed(2)} EUR`, 385, y, 9);
    drawText(`${item.subtotal.toFixed(2)} EUR`, 465, y, 9);
    y -= 16;
  }

  // ── Totals ──
  y -= 10;
  page.drawLine({ start: { x: 350, y: y + 5 }, end: { x: 545, y: y + 5 }, thickness: 0.5, color: grayColor });

  drawText('Base imponible:', 355, y - 8, 9, font, grayColor);
  drawText(`${order.subtotal.toFixed(2)} EUR`, 465, y - 8, 9);

  drawText(`IVA (${order.tipo_iva ?? 21}%):`, 355, y - 24, 9, font, grayColor);
  drawText(`${order.impuestos.toFixed(2)} EUR`, 465, y - 24, 9);

  drawText('Gastos de envio:', 355, y - 40, 9, font, grayColor);
  drawText(`${order.gastos_envio.toFixed(2)} EUR`, 465, y - 40, 9);

  y -= 56;
  page.drawLine({ start: { x: 350, y: y + 5 }, end: { x: 545, y: y + 5 }, thickness: 1, color: darkColor });
  drawText('TOTAL:', 355, y - 8, 11, fontBold);
  drawText(`${order.total.toFixed(2)} EUR`, 460, y - 8, 11, fontBold);

  // ── Footer ──
  drawText(
    `${env.BUSINESS_NAME} — NIF ${env.BUSINESS_NIF}`,
    50,
    30,
    8,
    font,
    grayColor
  );

  return doc.save();
}

// ── Public API ──

interface GenerateInvoiceResult {
  invoiceId: string;
  numeroFactura: string;
  filePath: string;
}

export async function generateInvoice(orderId: string): Promise<GenerateInvoiceResult> {
  // Idempotent — return existing if already generated
  const { data: existing } = await supabaseAdmin
    .from('invoices')
    .select('id, numero_factura, file_path')
    .eq('order_id', orderId)
    .single();

  if (existing) {
    return {
      invoiceId: existing.id,
      numeroFactura: existing.numero_factura,
      filePath: existing.file_path,
    };
  }

  // Fetch order data
  const { data: order, error: orderError } = await supabaseAdmin
    .from('orders')
    .select('*')
    .eq('id', orderId)
    .single();

  if (orderError || !order) throw new Error('Order not found');

  const { data: items } = await supabaseAdmin
    .from('order_items')
    .select('*, product:products(nombre)')
    .eq('order_id', orderId);

  if (!items) throw new Error('Order items not found');

  const { data: billingAddress } = await supabaseAdmin
    .from('addresses')
    .select('*')
    .eq('id', order.billing_address_id)
    .single();

  if (!billingAddress) throw new Error('Billing address not found');

  const { data: profile } = await supabaseAdmin
    .from('profiles')
    .select('nombre, apellidos')
    .eq('id', order.user_id)
    .single();

  if (!profile) throw new Error('Profile not found');

  // Generate sequential number
  const year = new Date().getFullYear();
  const numeroFactura = await getNextInvoiceNumber(year);
  const fecha = new Date().toLocaleDateString('es-ES', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });

  // Build PDF
  const pdfBytes = await buildInvoicePdf({
    numeroFactura,
    fecha,
    order,
    items,
    billingAddress,
    profile,
  });

  // Upload to Supabase Storage
  const filePath = `invoices/${year}/${numeroFactura}.pdf`;
  const { error: uploadError } = await supabaseAdmin.storage
    .from('invoices')
    .upload(filePath, pdfBytes, {
      contentType: 'application/pdf',
      upsert: false,
    });

  if (uploadError) throw new Error(`Upload failed: ${uploadError.message}`);

  // Store in invoices table
  const { data: invoice, error: insertError } = await supabaseAdmin
    .from('invoices')
    .insert({
      order_id: orderId,
      numero_factura: numeroFactura,
      file_path: filePath,
    })
    .select()
    .single();

  if (insertError) throw new Error(insertError.message);

  return {
    invoiceId: invoice.id,
    numeroFactura,
    filePath,
  };
}

export async function getInvoiceDownloadUrl(orderId: string): Promise<string | null> {
  const { data: invoice } = await supabaseAdmin
    .from('invoices')
    .select('file_path')
    .eq('order_id', orderId)
    .single();

  if (!invoice) return null;

  const { data: signedUrl } = await supabaseAdmin.storage
    .from('invoices')
    .createSignedUrl(invoice.file_path, 3600); // 1 hour

  return signedUrl?.signedUrl ?? null;
}

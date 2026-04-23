// ── Database row types ──

export interface Profile {
  id: string;
  nombre: string;
  apellidos: string;
  telefono: string | null;
  role: 'customer' | 'admin';
  created_at: string;
  updated_at: string;
}

export interface Category {
  id: string;
  nombre: string;
  slug: string;
  descripcion: string | null;
  imagen_url: string | null;
  parent_id: string | null;
  orden: number;
  activo: boolean;
  created_at: string;
}

export interface Product {
  id: string;
  category_id: string | null;
  nombre: string;
  slug: string;
  descripcion: string | null;
  sku: string;
  precio: number;
  precio_original: number | null;
  en_oferta: boolean;
  porcentaje_descuento: number;
  marca: string | null;
  modelo: string | null;
  stock: number;
  stock_minimo: number;
  imagenes: string[];
  specs: Record<string, unknown>;
  features: string[];
  colors: Array<{ name: string; value: string; hex: string }>;
  tags: string[];
  rating: number;
  review_count: number;
  supplier_id: string | null;
  precio_coste: number | null;
  supplier_sku: string | null;
  supplier_url: string | null;
  origen: string | null;
  peso_gramos: number | null;
  largo_cm: number | null;
  ancho_cm: number | null;
  alto_cm: number | null;
  tiempo_envio_min: number | null;
  tiempo_envio_max: number | null;
  notas_internas: string | null;
  meta_title: string | null;
  meta_description: string | null;
  activo: boolean;
  created_at: string;
  updated_at: string;
}

export interface Supplier {
  id: string;
  nombre: string;
  email: string | null;
  telefono: string | null;
  web: string | null;
  pais: string | null;
  condiciones_pago: string | null;
  plazo_envio_estimado: string | null;
  margen_defecto: number;
  notas: string | null;
  activo: boolean;
  created_at: string;
  updated_at: string;
}

export interface BusinessSetting {
  key: string;
  value: unknown;
  updated_at: string;
}

export interface Order {
  id: string;
  numero_pedido: string;
  user_id: string;
  shipping_address_id: string | null;
  billing_address_id: string | null;
  estado: 'pendiente' | 'pagado' | 'enviado' | 'entregado' | 'cancelado' | 'devuelto' | 'fallido';
  subtotal: number;
  impuestos: number;
  gastos_envio: number;
  total: number;
  pais_impuesto: string | null;
  tipo_iva: number | null;
  metodo_pago: 'stripe' | 'paypal' | null; // 'paypal' is legacy — new orders always use 'stripe' (PayPal is processed via Stripe PaymentElement)
  payment_intent_id: string | null;
  paypal_order_id: string | null;
  notas: string | null;
  created_at: string;
  updated_at: string;
}

export interface OrderItem {
  id: string;
  order_id: string;
  product_id: string;
  cantidad: number;
  precio_unitario: number;
  subtotal: number;
  opciones: Record<string, unknown>;
}

export interface CartItem {
  id: string;
  user_id: string;
  product_id: string;
  cantidad: number;
  opciones: Record<string, unknown>;
  created_at: string;
  updated_at: string;
  product?: Product; // joined
}

export interface WishlistItem {
  id: string;
  user_id: string;
  product_id: string;
  created_at: string;
  product?: Product; // joined
}

export interface Review {
  id: string;
  user_id: string;
  product_id: string;
  order_id: string | null;
  rating: number;
  titulo: string | null;
  comentario: string | null;
  verificada: boolean;
  created_at: string;
  profile?: Pick<Profile, 'nombre' | 'apellidos'>; // joined
}

export interface InventoryMovement {
  id: string;
  product_id: string;
  order_id: string | null;
  tipo: 'entrada' | 'salida' | 'ajuste';
  cantidad: number;
  motivo: string | null;
  created_at: string;
  created_by: string | null;
}

export interface Address {
  id: string;
  user_id: string;
  tipo: 'shipping' | 'billing';
  nombre: string;
  calle: string;
  ciudad: string;
  codigo_postal: string;
  provincia: string;
  pais: string;
  nif: string | null;
  is_default: boolean;
  created_at: string;
}

export interface Refund {
  id: string;
  order_id: string;
  provider_refund_id: string | null;
  amount: number;
  motivo: string | null;
  estado: 'pendiente' | 'completado' | 'fallido';
  created_by: string | null;
  created_at: string;
}

export interface Invoice {
  id: string;
  order_id: string;
  numero_factura: string;
  file_path: string;
  created_at: string;
}

export interface StockAlertLog {
  id: string;
  product_id: string;
  alert_date: string;
  created_at: string;
}

export interface Shipment {
  id: string;
  order_id: string;
  carrier: 'seur' | 'correos_express' | 'mrw';
  tracking_number: string | null;
  label_url: string | null;
  estado: 'preparando' | 'recogido' | 'en_transito' | 'en_reparto' | 'entregado' | 'incidencia';
  created_at: string;
  updated_at: string;
}

export interface ShipmentEvent {
  id: string;
  shipment_id: string;
  estado: string;
  descripcion: string | null;
  ubicacion: string | null;
  occurred_at: string;
  created_at: string;
}

// ── API request/response types ──

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface ProductFilters {
  q?: string;
  category?: string;
  minPrice?: number;
  maxPrice?: number;
  onSale?: boolean;
  inStock?: boolean;
  page?: number;
  pageSize?: number;
  sortBy?: 'precio' | 'rating' | 'nombre' | 'created_at';
  sortOrder?: 'asc' | 'desc';
}

export interface CsvImportResult {
  created: number;
  updated: number;
  errors: Array<{ row: number; sku: string; message: string }>;
}

export interface DashboardStats {
  ventasMes: number;
  pedidosActivos: number;
  stockBajo: number;
  usuariosActivos: number;
  pedidosRecientes: Order[];
  alertasStock: Array<Pick<Product, 'id' | 'nombre' | 'sku' | 'stock' | 'stock_minimo'>>;
}

export interface Notification {
  id: string;
  user_id: string;
  type: string;
  title: string;
  body: string;
  data: Record<string, unknown>;
  read: boolean;
  created_at: string;
}

export interface ReturnRequest {
  id: string;
  order_id: string;
  user_id: string;
  motivo: 'defectuoso' | 'no_coincide' | 'no_deseado' | 'otro';
  descripcion: string | null;
  fotos: string[];
  estado: 'pendiente' | 'aprobado' | 'rechazado' | 'completado';
  admin_notes: string | null;
  refund_amount: number | null;
  created_at: string;
  updated_at: string;
}

// Shared types for Admin components

export interface AdminProduct {
  id: number;
  nombre: string;
  sku: string;
  precio: number;
  precio_original?: number;
  stock: number;
  stock_minimo: number;
  categoria_id?: number;
  categoria_nombre?: string;
  marca?: string;
  descripcion?: string;
  imagenes?: string[];
  tags?: string[];
  activo: boolean;
  creado_en?: string;
  actualizado_en?: string;
  supplier_id?: string;
  precio_coste?: number;
  supplier_sku?: string;
  supplier_nombre?: string;
  supplier_url?: string;
  origen?: string;
  peso_gramos?: number;
  largo_cm?: number;
  ancho_cm?: number;
  alto_cm?: number;
  tiempo_envio_min?: number;
  tiempo_envio_max?: number;
  notas_internas?: string;
  meta_title?: string;
  meta_description?: string;
  en_oferta?: boolean;
  porcentaje_descuento?: number;
  modelo?: string;
  features?: string[];
  colors?: any[];
  specs?: Record<string, any>;
}

export interface AdminCategory {
  id: number;
  nombre: string;
  slug: string;
  descripcion?: string;
  imagen_url?: string;
  product_count?: number;
  activo: boolean;
  creado_en?: string;
}

export interface AdminSupplier {
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
  product_count?: number;
  created_at: string;
}

export interface AdminOrder {
  id: number;
  numero_pedido: string;
  usuario_id?: number;
  usuario_nombre?: string;
  usuario_email?: string;
  total: number;
  subtotal?: number;
  iva?: number;
  estado: 'pendiente' | 'pagado' | 'confirmado' | 'procesando' | 'enviado' | 'entregado' | 'cancelado' | 'devuelto' | 'fallido';
  metodo_pago?: string;
  creado_en: string;
  actualizado_en?: string;
  items?: AdminOrderItem[];
  direccion_envio?: AdminAddress;
}

export interface AdminOrderItem {
  id: number;
  producto_id: number;
  producto_nombre: string;
  sku?: string;
  cantidad: number;
  precio_unitario: number;
  subtotal: number;
  precio_coste?: number;
  supplier_sku?: string;
  supplier?: {
    id: string;
    nombre: string;
    email: string | null;
    web: string | null;
    telefono: string | null;
  } | null;
}

export interface AdminAddress {
  nombre: string;
  apellidos: string;
  linea1: string;
  linea2?: string;
  ciudad: string;
  provincia?: string;
  codigo_postal: string;
  pais: string;
  telefono?: string;
}

export interface AdminUser {
  id: number;
  nombre?: string;
  apellidos?: string;
  email: string;
  role: 'customer' | 'admin';
  order_count?: number;
  creado_en: string;
}

export interface InventoryAlert {
  id: number;
  producto_id: number;
  nombre: string;
  sku: string;
  stock_actual: number;
  stock_minimo: number;
}

export interface InventoryMovement {
  id: number;
  producto_id: number;
  producto_nombre: string;
  tipo: 'entrada' | 'salida' | 'ajuste';
  cantidad: number;
  stock_anterior: number;
  stock_nuevo: number;
  motivo?: string;
  creado_en: string;
}

export interface AdminRefund {
  id: string;
  order_id: string;
  provider_refund_id: string | null;
  amount: number;
  motivo: string | null;
  estado: 'pendiente' | 'completado' | 'fallido';
  created_by: string | null;
  admin?: { nombre: string; apellidos: string };
  created_at: string;
}

export interface AdminShipment {
  id: string;
  order_id: string;
  carrier: 'seur' | 'correos_express' | 'mrw';
  tracking_number: string | null;
  label_url: string | null;
  estado: 'preparando' | 'recogido' | 'en_transito' | 'en_reparto' | 'entregado' | 'incidencia';
  created_at: string;
  updated_at: string;
  events: AdminShipmentEvent[];
}

export interface AdminShipmentEvent {
  id: string;
  shipment_id: string;
  estado: string;
  descripcion: string | null;
  ubicacion: string | null;
  occurred_at: string;
  created_at: string;
}

export interface DashboardStats {
  ventas_mes?: number;
  pedidos_activos?: number;
  stock_bajo?: number;
  usuarios_activos?: number;
  pedidos_recientes?: AdminOrder[];
  alertas_stock?: InventoryAlert[];
}

export interface ProductFormData {
  nombre: string;
  sku: string;
  precio: number;
  precio_original: number;
  stock: number;
  stock_minimo: number;
  categoria_id: number | '';
  marca: string;
  descripcion: string;
  imagenes: string;
  tags: string;
  activo: boolean;
  supplier_id: string;
  precio_coste: number;
  supplier_sku: string;
  supplier_url: string;
  origen: string;
  peso_gramos: number;
  largo_cm: number;
  ancho_cm: number;
  alto_cm: number;
  tiempo_envio_min: number;
  tiempo_envio_max: number;
  notas_internas: string;
  meta_title: string;
  meta_description: string;
  en_oferta: boolean;
  porcentaje_descuento: number;
  modelo: string;
  features: string;
  colors: string;
  specs: string;
}

# P0: Sistema de Variantes de Producto + Upload de Imagenes

**Fecha:** 2026-06-16
**Estado:** Aprobado
**Enfoque elegido:** Tabla `product_variants` plana (Enfoque A)

## Contexto

GenStore es un e-commerce generico donde un administrador debe poder gestionar productos con variantes (color, talla, material, etc.), cada una con su propio stock, precio, SKU e imagenes. Actualmente los productos solo soportan colores como JSONB decorativo y las imagenes se introducen como URLs manuales sin upload real.

## Requisitos

- Tienda generica adaptable a cualquier tipo de producto
- Atributos libres por producto (sin catalogo global)
- Cada combinacion de variantes tiene su propio stock, precio y SKU
- Imagenes subidas via drag & drop a Supabase Storage
- Max 5 imagenes por producto/variante
- Productos sin variantes siguen funcionando como ahora (retrocompatibilidad)

---

## Seccion 1: Base de Datos

### Nueva tabla `product_variants`

```sql
CREATE TABLE product_variants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  sku TEXT NOT NULL UNIQUE,
  attributes JSONB NOT NULL DEFAULT '{}',
  precio DECIMAL(10,2) NOT NULL CHECK (precio >= 0),
  precio_coste DECIMAL(10,2),
  stock INT NOT NULL DEFAULT 0 CHECK (stock >= 0),
  stock_minimo INT NOT NULL DEFAULT 5,
  imagenes TEXT[] DEFAULT '{}',
  activo BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_variants_product ON product_variants(product_id);
CREATE INDEX idx_variants_attributes ON product_variants USING GIN(attributes);
CREATE INDEX idx_variants_stock ON product_variants(stock) WHERE activo = true;
```

`attributes` almacena pares clave-valor libres:
```json
{"Color": "Roja", "Talla": "L"}
```

### Funciones atomicas

```sql
CREATE OR REPLACE FUNCTION decrement_variant_stock(vid UUID, qty INT)
RETURNS BOOLEAN ...;

CREATE OR REPLACE FUNCTION increment_variant_stock(vid UUID, qty INT)
RETURNS VOID ...;
```

Misma logica que las funciones existentes de producto pero operando sobre `product_variants`.

### Cambios en tablas existentes

- `products`: Se anade `has_variants BOOLEAN DEFAULT false`
- `cart_items`: Se anade `variant_id UUID REFERENCES product_variants(id)` (nullable)
- `order_items`: Se anade `variant_id UUID REFERENCES product_variants(id)` (nullable)

### Compatibilidad

- `has_variants = false` -> precio/stock del producto padre (comportamiento actual)
- `has_variants = true` -> precio/stock de la variante seleccionada
- Productos existentes no se rompen (campos nullable con defaults)

---

## Seccion 2: Supabase Storage - Upload de Imagenes

### Bucket

- Nombre: `product-images` (publico)
- Creacion: `INSERT INTO storage.buckets (id, name, public) VALUES ('product-images', 'product-images', true);`

### Estructura de archivos

```
product-images/
  {product_id}/
    main-{timestamp}-{random6}.{ext}
    variants/
      {variant_id}-{timestamp}-{random6}.{ext}
```

### Restricciones

- Formatos: JPG, PNG, WebP
- Tamano maximo: 5MB por imagen
- Maximo 5 imagenes por producto y 5 por variante

### Endpoints

```
POST   /api/v1/admin/products/:id/images        -> Upload imagen producto (multipart)
DELETE /api/v1/admin/products/:id/images/:index   -> Eliminar imagen producto
PUT    /api/v1/admin/products/:id/images/reorder  -> Reordenar imagenes
POST   /api/v1/admin/variants/:id/images          -> Upload imagen variante
DELETE /api/v1/admin/variants/:id/images/:index    -> Eliminar imagen variante
```

### Flujo de upload

1. Admin selecciona archivo(s) via drag & drop o file picker
2. Frontend valida tipo y tamano
3. POST multipart/form-data al backend
4. Backend valida, genera nombre unico, sube a Supabase Storage
5. Obtiene URL publica, la anade al array `imagenes`
6. Devuelve URL al frontend para preview inmediato

### Eliminacion

1. Admin click en X sobre imagen
2. DELETE al backend con indice
3. Backend extrae path de la URL, elimina del bucket
4. Elimina URL del array `imagenes` en DB

---

## Seccion 3: Admin - Formulario de Producto con Variantes

### Galeria de Imagenes (reemplaza campo URLs)

- Zona drag & drop + boton "Seleccionar archivos"
- Grid de thumbnails con previews
- Cada imagen: boton X para eliminar, drag handle para reordenar
- Indicador de progreso durante upload
- Primera imagen marcada como principal (estrella)
- Contador visual "3/5"

### Seccion Variantes (toggle "Este producto tiene variantes")

**Paso 1 - Definir atributos:**
- Boton "+ Anadir atributo" -> input libre (ej: "Color", "Talla")
- Por cada atributo, anadir valores con boton "+"
- Para atributos tipo color: selector hex junto al nombre
- Eliminar atributos/valores con X

**Paso 2 - Tabla de variantes (autogenerada):**

La tabla combinatoria se genera automaticamente:

```
| Color | Talla | SKU            | Precio | Stock | Imgs | Activo |
|-------|-------|----------------|--------|-------|------|--------|
| Roja  | S     | [auto/editable]| 29.99  | 0     | 0    | on     |
| Roja  | M     | [auto/editable]| 29.99  | 0     | 0    | on     |
| Azul  | S     | [auto/editable]| 29.99  | 0     | 0    | on     |
| Azul  | M     | [auto/editable]| 29.99  | 0     | 0    | on     |
```

- SKU: Auto-generado `{producto_sku}-{valor1}-{valor2}`, editable
- Precio: Hereda del padre por defecto, editable individualmente
- Stock: Editable por variante
- Imgs: Boton que abre mini-uploader para esa variante
- Activo: Toggle por variante
- Acciones rapidas: "Aplicar precio a todas", "Aplicar stock a todas"

**Comportamiento del toggle:**
- ON: campos precio/stock del padre se ocultan, admin gestiona via tabla
- OFF: funciona como ahora, variantes se mantienen en DB pero se ignoran

---

## Seccion 4: Frontend Tienda - Seleccion de Variantes

### ProductDetailPage

**Selectores dinamicos:**
- Atributos tipo "Color": swatches circulares con hex y borde animado
- Otros atributos: botones pill seleccionables (ej: "S", "M", "L")
- Orden segun lo definido por el admin

**Logica de seleccion:**
1. Usuario selecciona valores de cada atributo
2. Se busca la variante que coincide con la combinacion
3. Valores sin stock se muestran tachados/grisados
4. Combinacion completa actualiza: precio, stock, imagenes (variante o padre), SKU
5. Combinacion inexistente/inactiva -> boton deshabilitado

**Carrito:**
- POST /cart envia `{ productId, variantId, cantidad }`
- Si `has_variants=true` y no hay `variantId` -> 400
- Carrito muestra atributos: "Camiseta Basica - Roja / M"
- Stock check contra la variante

**Checkout y pedidos:**
- `order_items` almacena `variant_id` + snapshot de atributos en `opciones`
- Detalle de pedido muestra atributos de cada variante
- Decrement usa `decrement_variant_stock()`

---

## Seccion 5: API Backend - Endpoints

### Variantes CRUD (admin, requiere auth + admin middleware)

```
GET    /api/v1/admin/products/:id/variants         -> Lista variantes del producto
POST   /api/v1/admin/products/:id/variants          -> Crear variante(s) (acepta array)
PUT    /api/v1/admin/variants/:id                    -> Actualizar variante
DELETE /api/v1/admin/variants/:id                    -> Soft delete
POST   /api/v1/admin/products/:id/variants/bulk      -> Generar combinatoria
PUT    /api/v1/admin/products/:id/variants/bulk       -> Update masivo (precio/stock)
```

### Endpoints publicos modificados

- `GET /products/:slug` -> incluye array `variants` (activas, con atributos/precio/stock/imagenes)
- `GET /products` -> muestra "Desde X.XX" si tiene variantes con precios diferentes

### Cart modificado

- `POST /cart` -> acepta `variant_id` opcional
- Si `has_variants=true` sin `variant_id` -> 400
- Stock check usa variante o producto segun corresponda

### Order creation modificado

- Decrementa stock de variante o producto
- `order_items` almacena `variant_id` + snapshot atributos

### Validaciones

- No crear variantes en producto con `has_variants=false`
- No crear variantes duplicadas (misma combinacion de atributos)
- Al activar `has_variants`, stock/precio del padre dejan de usarse en tienda
- Al desactivar, variantes se mantienen pero se ignoran

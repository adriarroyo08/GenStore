# GenStore

Tienda online genérica. Permite a los usuarios explorar el catálogo, gestionar su cuenta y realizar compras.

## URL del producto

**Frontend**: `http://localhost:3000` (desarrollo) | `http://<IP_SERVIDOR>:3001` (producción)
**API**: `http://localhost:3002/api/v1` (desarrollo)

> Producción se gestiona con PM2 y sirve el build estático en el puerto **3001**.

---

## Funcionalidades principales

### Tienda
- Catálogo de productos con búsqueda full-text (español), filtros por categoría/precio/oferta/stock y ordenación
- Ficha de producto con imágenes, especificaciones, colores, características y reseñas
- Carrito de compra persistente (backend)
- Lista de deseos (wishlist) con sincronización en backend
- Sistema de reseñas verificadas (solo compradores)
- Productos destacados y carrusel de ofertas

### Pagos y pedidos
- Checkout con Stripe (tarjeta, PayPal, Google Pay, Apple Pay, Klarna, SEPA, etc.)
- Gestión de métodos de pago guardados
- Historial de pedidos con seguimiento de estado
- Facturas PDF generadas automáticamente
- Cupones de descuento y programa de puntos/recompensas
- Solicitudes de devolución

### Cuenta de usuario
- Registro, inicio de sesión y verificación de email
- Perfil de usuario con gestión de direcciones
- Historial y seguimiento de pedidos
- Configuración de cuenta (2FA, sesiones activas)
- Selector de recompensas (programa de puntos)

### Internacionalización y accesibilidad
- Soporte multiidioma (selector de idioma)
- Selector de moneda
- Selector de tema (claro/oscuro)

### Panel de administración
- Gestión completa de productos y categorías
- Gestión de usuarios administradores
- Gestión de inventario y proveedores
- Suite de pruebas de sistema

---

## Tech Stack

### Frontend

| Tecnología | Versión |
|---|---|
| React | 18 |
| TypeScript | 5 (strict) |
| Vite | 5 |
| Tailwind CSS | 4 |
| Radix UI + shadcn/ui | varios |
| Supabase | 2 |
| Stripe | 9 |
| Recharts | 2 |

### Backend

| Tecnología | Versión |
|---|---|
| Hono | 4 |
| Supabase (PostgreSQL) | 2 |
| Stripe SDK | 22 |
| Resend | 6 |
| Zod | 3 |

---

## Instalación y uso

```bash
# Frontend
npm install
npm run dev          # Servidor de desarrollo (puerto 3000)
npm run build        # Compilar para producción

# Backend
cd server
npm install
npm run dev          # API en puerto 3002
```

## Tests

```bash
# Frontend
npm run test
npm run test:watch

# Backend
cd server
npm run test
```

---

## Despliegue

GitHub Actions en la rama `main`:

1. SSH al servidor de producción
2. `git pull origin main`
3. `npm ci && npm run build` (frontend + backend)
4. Reinicio con PM2 (`ecosystem.config.cjs`)

# P1: UI Redesign — Minimal Premium Experience

**Fecha:** 2026-06-16
**Estado:** Aprobado
**Enfoque:** Progressive Enhancement (mejora incremental sobre estructura existente)

## Contexto

GenStore tiene un frontend funcional con 25+ paginas, pero el diseno visual es generico. El objetivo es transformar la experiencia del usuario final en algo espectacular, fluido y premium, siguiendo una estetica minimal tipo Apple Store / Zara. La funcionalidad no se toca — solo se mejora la capa visual y las interacciones.

## Requisitos

- Estetica minimal premium: mucho espacio blanco, tipografia elegante, fotos grandes
- Micro-interacciones completas: page transitions, hover effects, flying item, mini-cart drawer
- Light mode por defecto con toggle dark mode
- Foco en las 5 paginas principales: Home, Catalogo, Producto, Carrito, Checkout
- No romper funcionalidad existente

---

## Seccion 1: Design Tokens

### Tipografia

- Headings: Inter, font-weight 600-700, tracking tight (-0.02em), h1: 3rem, h2: 2rem
- Body: font-weight 400, line-height 1.6, color #1A1A1A (light) / #E5E5E5 (dark)
- Captions: font-weight 500, text-xs/sm, uppercase tracking-wide para categorias

### Paleta Light Mode (default)

- Background: #FAFAFA
- Surface/cards: #FFFFFF con shadow-sm
- Texto primario: #1A1A1A
- Texto secundario: #6B7280
- Acento/CTAs: #111111 (negro, no azul generico)
- Acento hover: #333333
- Exito: #16A34A
- Oferta: #DC2626

### Paleta Dark Mode

- Background: #0A0A0A
- Surface: #141414
- Texto: #E5E5E5 / #9CA3AF
- Acento: #FFFFFF

### Spacing y Layout

- Max-width: 1280px con px-6
- Secciones: py-16 md:py-24 (mucho aire)
- Cards: rounded-2xl
- Imagenes producto: aspect-[4/5]

### Botones CTA

- Primario: fondo negro, texto blanco, rounded-full, px-8 py-3, hover scale-[1.02]
- Secundario: borde negro, fondo transparente, rounded-full
- Transicion: 200ms background + scale

---

## Seccion 2: Page Transitions

### Sistema

Framer Motion AnimatePresence + motion.div envolviendo el contenido de PageRouter:

- Salida: opacity 0, y: -8, 200ms
- Entrada: opacity 0->1, y: 12->0, 300ms ease-out
- Key: currentPage (para que AnimatePresence detecte cambio)

### Wrapper PageTransition

Componente que envuelve children con motion.div + AnimatePresence mode="wait".

### Skeleton Loaders

- ProductCard skeleton: rectangulo aspect-[4/5] + 2 lineas texto + 1 linea precio, animate-pulse
- Transicion skeleton -> contenido: fade 200ms

---

## Seccion 3: Homepage

### Hero

- Full-width, 80vh, gradiente/imagen fondo con overlay
- Titulo centrado 3rem/4.5rem, stagger word-by-word (delay 0.05s)
- Subtitulo fade in delay 0.3s
- CTA rounded-full negro, fade in + scale delay 0.5s
- Scroll indicator: chevron bounce

### Categorias

- Grid tarjetas con imagen fondo + overlay gradiente + nombre blanco
- Hover: imagen scale 1.05, overlay se aclara
- Stagger al entrar en viewport (IntersectionObserver)
- 2 cols mobile, 3 tablet, 4 desktop

### Productos Destacados

- Carousel Embla horizontal
- Cards aspect-[4/5] con hover zoom
- Flechas circulares minimalistas + dots

### Trust Badges

- Barra horizontal: envio gratuito, devolucion 14 dias, pago seguro
- Iconos lucide linea fina, separados con borders verticales
- Fondo bg-muted/30

### Newsletter

- Input + boton en linea, centrado, fondo contrastado

---

## Seccion 4: Catalogo

### Product Cards

- Imagen aspect-[4/5], rounded-2xl, overflow hidden
- Hover: imagen scale 1.05 (500ms), overlay con boton "Vista rapida" + "Anadir"
- Info: categoria uppercase xs muted, nombre font-medium, precio font-semibold
- Variantes: "Desde XX.XX"
- Badge oferta: rounded-full rojo absolute top-3 left-3
- Sin stock: opacity-60 + badge gris "Agotado"

### Quick View Modal

- Dialog desktop / drawer mobile
- Imagen grande izquierda + info derecha (nombre, precio, variantes, CTA)
- Animacion: scale 0.95->1 + fade in 200ms

### Filtros

- Desktop: sidebar colapsable con transicion
- Mobile: drawer desde abajo + boton flotante "Filtros (N)"
- Chips de filtros activos con X, transicion al anadir/quitar

### Paginacion

- "Cargar mas" con stagger fade-in de nuevos productos (delay 0.04s/card)
- Barra progreso fina "Mostrando 12 de 48"

### Grid/List transition

- Framer Motion layout animation al cambiar vista

---

## Seccion 5: Producto

### Galeria

- Desktop: 2 columnas (55% galeria sticky / 45% info)
- Imagen principal: rounded-2xl, zoom hover mejorado
- Thumbnails: fila horizontal, rounded-xl, borde activo con transicion
- Cambio imagen: crossfade 200ms
- Lightbox: transicion scale desde thumbnail
- Mobile: carousel swipeable full-width con dots

### Info

- Breadcrumb discreto text-xs muted
- Nombre: text-2xl md:text-3xl font-semibold tracking-tight
- Precio: text-xl font-bold, oferta con tachado + badge
- Rating: estrellas pequenas, "(N resenas)" clickeable scroll a reviews

### Variant Selector

- Ajustar estilos del VariantSelector de P0:
  - Swatches: w-8 h-8, borde fino, sombra interna en seleccionado
  - Pills: rounded-full, transicion background 150ms

### Add to Cart

- CTA negro rounded-full ancho completo, py-4 text-base font-medium
- Cantidad: controles minimalistas (- num +) bordes finos
- Feedback: boton cambia a verde + check + "Anadido" durante 2s
- Mobile sticky: blur backdrop + precio + CTA

### Trust Badges bajo CTA

- Tres iconos fila: envio, garantia, devoluciones
- Icono 20px + texto xs muted

### Tabs

- Underline animada con motion.div layoutId
- Fade transition al cambiar contenido

### Productos Relacionados

- "Tambien te puede gustar"
- Carousel mobile, grid 4 cols desktop
- Stagger al entrar en viewport

---

## Seccion 6: Carrito y Checkout

### Mini-Cart Drawer (nuevo)

- Sheet lateral derecho, se abre al anadir producto (3s auto-close) o click icono
- Slide desde derecha 300ms + backdrop blur
- Items: thumbnail 64x64 rounded-xl + nombre + variante + cantidad + precio
- Botones: "Ver carrito" + "Finalizar compra"
- Badge header: bounce al anadir (scale 1->1.3->1, 400ms)

### Flying Item Animation (nuevo)

- Imagen producto se clona, reduce y vuela en arco hacia icono carrito header
- position: fixed, Framer Motion animate x,y, scale 1->0.2, opacity fade
- 600ms ease-in-out
- Al terminar: badge bounce + mini-cart drawer abre

### Cart Page (mejora)

- Layout: items 70% izquierda, resumen sticky 30% derecha
- Items: thumbnail rounded-xl 80x80, info, controles cantidad, subtotal, X sutil
- Eliminacion: fade izquierda + colapso altura 300ms
- Resumen: card rounded-2xl surface, CTA negro rounded-full
- Empty state: icono grande + texto + CTA "Explorar productos"

### Checkout (mejora visual)

- Stepper: circulos numerados + linea conectora, activo con acento, completados con check
- Inputs: rounded-xl, labels limpios, focus ring sutil
- Resumen pedido: card sticky desktop, colapsable mobile, con thumbnails
- Boton pagar: negro rounded-full, icono candado, "Pagar XX.XX"

---

## Seccion 7: Header y Navegacion

### Header

- Altura 64px, fondo blanco + backdrop-blur-xl al scroll
- Logo izquierda, nav links centro (underline animada hover), actions derecha
- Hide-on-scroll: ocultar scroll down, reaparecer scroll up (translateY transition)
- Mobile: logo + iconos (carrito + hamburger), menu sheet derecha

### Search

- Desktop: click lupa expande input overlay full-width (width 0->100%, 250ms)
- Mobile: pantalla search full-screen
- Dropdown resultados: 5 sugerencias con thumbnail + nombre + precio, stagger fade-in

### Footer

- 4 columnas minimal, separador fino, padding generoso
- Alinear tipografia y spacing al nuevo sistema

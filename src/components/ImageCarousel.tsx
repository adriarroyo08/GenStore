import React, { useState, useEffect, useCallback } from 'react'

interface Slide {
  id: number
  titulo: string
  descripcion: string
  imagenUrl: string
  altText: string
}

const SLIDES: Slide[] = [
  {
    id: 1,
    titulo: 'Productos Destacados',
    descripcion: 'Descubre nuestra selección de productos destacados con la mejor calidad y precios competitivos.',
    imagenUrl: 'https://picsum.photos/seed/featured/800/400',
    altText: 'Productos destacados de la tienda',
  },
  {
    id: 2,
    titulo: 'Nuevas Llegadas',
    descripcion: 'Las últimas novedades ya disponibles. Explora nuestra colección actualizada con los productos más recientes.',
    imagenUrl: 'https://picsum.photos/seed/arrivals/800/400',
    altText: 'Nuevas llegadas a la tienda',
  },
  {
    id: 3,
    titulo: 'Ofertas Especiales',
    descripcion: 'Aprovecha nuestras ofertas exclusivas con descuentos en productos seleccionados por tiempo limitado.',
    imagenUrl: 'https://picsum.photos/seed/offers/800/400',
    altText: 'Ofertas especiales',
  },
  {
    id: 4,
    titulo: 'Mejor Valorados',
    descripcion: 'Los productos favoritos de nuestros clientes. Calidad garantizada respaldada por cientos de opiniones positivas.',
    imagenUrl: 'https://picsum.photos/seed/toprated/800/400',
    altText: 'Productos mejor valorados',
  },
  {
    id: 5,
    titulo: 'Accesorios Premium',
    descripcion: 'Amplio catálogo de accesorios de alta calidad para complementar tus compras y mejorar tu experiencia.',
    imagenUrl: 'https://picsum.photos/seed/accessories/800/400',
    altText: 'Accesorios premium de la tienda',
  },
]

const AUTO_ADVANCE_INTERVAL_MS = 4000

const ImageCarousel: React.FC = () => {
  const [indiceActual, setIndiceActual] = useState<number>(0)
  const [transicionando, setTransicionando] = useState<boolean>(false)

  const irASlide = useCallback((indice: number) => {
    setTransicionando(true)
    setTimeout(() => {
      setIndiceActual(indice)
      setTransicionando(false)
    }, 300)
  }, [])

  const irAlAnterior = useCallback(() => {
    const nuevoIndice = (indiceActual - 1 + SLIDES.length) % SLIDES.length
    irASlide(nuevoIndice)
  }, [indiceActual, irASlide])

  const irAlSiguiente = useCallback(() => {
    const nuevoIndice = (indiceActual + 1) % SLIDES.length
    irASlide(nuevoIndice)
  }, [indiceActual, irASlide])

  useEffect(() => {
    const intervalo = setInterval(() => {
      setIndiceActual((prev) => (prev + 1) % SLIDES.length)
    }, AUTO_ADVANCE_INTERVAL_MS)

    return () => clearInterval(intervalo)
  }, [])

  const slideActual = SLIDES[indiceActual]

  return (
    <section
      data-testid="image-carousel"
      aria-label="Carrusel de productos destacados"
      style={{
        position: 'relative',
        width: '100%',
        overflow: 'hidden',
        borderRadius: '8px',
        boxShadow: '0 2px 12px rgba(0,0,0,0.15)',
        backgroundColor: '#1a1a2e',
      }}
    >
      {/* Slide principal */}
      <div
        data-testid="carousel-slide"
        style={{
          position: 'relative',
          width: '100%',
          opacity: transicionando ? 0 : 1,
          transition: 'opacity 0.3s ease-in-out',
        }}
      >
        <img
          src={slideActual.imagenUrl}
          alt={slideActual.altText}
          data-testid="carousel-image"
          style={{
            width: '100%',
            height: '400px',
            objectFit: 'cover',
            display: 'block',
          }}
        />
        <div
          data-testid="carousel-caption"
          style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            padding: '24px',
            background: 'linear-gradient(transparent, rgba(0,0,0,0.75))',
            color: '#ffffff',
          }}
        >
          <h3
            data-testid="carousel-titulo"
            style={{ margin: '0 0 8px 0', fontSize: '1.5rem', fontWeight: 700 }}
          >
            {slideActual.titulo}
          </h3>
          <p
            data-testid="carousel-descripcion"
            style={{ margin: 0, fontSize: '0.95rem', lineHeight: 1.5 }}
          >
            {slideActual.descripcion}
          </p>
        </div>
      </div>

      {/* Botón anterior */}
      <button
        data-testid="btn-anterior"
        onClick={irAlAnterior}
        aria-label="Diapositiva anterior"
        style={{
          position: 'absolute',
          top: '50%',
          left: '12px',
          transform: 'translateY(-50%)',
          background: 'rgba(255,255,255,0.85)',
          border: 'none',
          borderRadius: '50%',
          width: '40px',
          height: '40px',
          fontSize: '1.1rem',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 10,
        }}
      >
        &#8249;
      </button>

      {/* Botón siguiente */}
      <button
        data-testid="btn-siguiente"
        onClick={irAlSiguiente}
        aria-label="Diapositiva siguiente"
        style={{
          position: 'absolute',
          top: '50%',
          right: '12px',
          transform: 'translateY(-50%)',
          background: 'rgba(255,255,255,0.85)',
          border: 'none',
          borderRadius: '50%',
          width: '40px',
          height: '40px',
          fontSize: '1.1rem',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 10,
        }}
      >
        &#8250;
      </button>

      {/* Indicadores de punto */}
      <div
        data-testid="carousel-dots"
        role="tablist"
        aria-label="Indicadores de diapositiva"
        style={{
          position: 'absolute',
          bottom: '12px',
          right: '16px',
          display: 'flex',
          gap: '8px',
          zIndex: 10,
        }}
      >
        {SLIDES.map((slide, indice) => (
          <button
            key={slide.id}
            data-testid={`dot-${indice}`}
            role="tab"
            aria-selected={indice === indiceActual}
            aria-label={`Ir a diapositiva ${indice + 1}: ${slide.titulo}`}
            onClick={() => irASlide(indice)}
            style={{
              width: '10px',
              height: '10px',
              borderRadius: '50%',
              border: '2px solid #ffffff',
              background: indice === indiceActual ? '#ffffff' : 'transparent',
              cursor: 'pointer',
              padding: 0,
              transition: 'background 0.3s ease',
            }}
          />
        ))}
      </div>
    </section>
  )
}

export default ImageCarousel

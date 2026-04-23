import React from 'react'
import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import ImageCarousel from '../components/ImageCarousel'

describe('ImageCarousel', () => {
  it('renders the carousel container', () => {
    render(<ImageCarousel />)
    expect(screen.getByTestId('image-carousel')).toBeInTheDocument()
  })

  it('renders the first slide with title and description', () => {
    render(<ImageCarousel />)
    expect(screen.getByTestId('carousel-titulo')).toHaveTextContent('Camilla de Productos')
    expect(screen.getByTestId('carousel-descripcion')).toBeInTheDocument()
  })

  it('renders the previous navigation button', () => {
    render(<ImageCarousel />)
    const btnAnterior = screen.getByTestId('btn-anterior')
    expect(btnAnterior).toBeInTheDocument()
    expect(btnAnterior).toHaveAttribute('aria-label', 'Diapositiva anterior')
  })

  it('renders the next navigation button', () => {
    render(<ImageCarousel />)
    const btnSiguiente = screen.getByTestId('btn-siguiente')
    expect(btnSiguiente).toBeInTheDocument()
    expect(btnSiguiente).toHaveAttribute('aria-label', 'Diapositiva siguiente')
  })

  it('renders dot indicators for each slide', () => {
    render(<ImageCarousel />)
    const dotsContainer = screen.getByTestId('carousel-dots')
    expect(dotsContainer).toBeInTheDocument()

    // Should have 5 dots (one per slide)
    for (let i = 0; i < 5; i++) {
      expect(screen.getByTestId(`dot-${i}`)).toBeInTheDocument()
    }
  })

  it('first dot is selected by default', () => {
    render(<ImageCarousel />)
    const firstDot = screen.getByTestId('dot-0')
    expect(firstDot).toHaveAttribute('aria-selected', 'true')
  })

  it('other dots are not selected by default', () => {
    render(<ImageCarousel />)
    for (let i = 1; i < 5; i++) {
      expect(screen.getByTestId(`dot-${i}`)).toHaveAttribute('aria-selected', 'false')
    }
  })

  it('renders the slide image with alt text', () => {
    render(<ImageCarousel />)
    const img = screen.getByTestId('carousel-image')
    expect(img).toBeInTheDocument()
    expect(img).toHaveAttribute('alt', 'Camilla de productos profesional')
  })

  it('has accessible aria-label on the carousel section', () => {
    render(<ImageCarousel />)
    const section = screen.getByTestId('image-carousel')
    expect(section).toHaveAttribute('aria-label', 'Carrusel de productos destacados de productos')
  })
})

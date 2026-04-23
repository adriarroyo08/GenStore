import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import Navbar, { NavSection } from '../components/Navbar'

describe('Navbar', () => {
  it('renders the app name', () => {
    render(<Navbar onNavegar={vi.fn()} />)
    expect(screen.getByText('GenStore')).toBeInTheDocument()
  })

  it('renders all navigation sections', () => {
    render(<Navbar onNavegar={vi.fn()} />)
    expect(screen.getByRole('button', { name: 'Inicio' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Pacientes' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Citas' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Configuración' })).toBeInTheDocument()
  })

  it('calls onNavegar with the correct section when a nav button is clicked', () => {
    const handleNavegar = vi.fn()
    render(<Navbar onNavegar={handleNavegar} />)
    fireEvent.click(screen.getByRole('button', { name: 'Pacientes' }))
    expect(handleNavegar).toHaveBeenCalledWith('pacientes')
  })

  it('marks active section with aria-current="page"', () => {
    render(<Navbar onNavegar={vi.fn()} seccionActiva="citas" />)
    expect(screen.getByRole('button', { name: 'Citas' })).toHaveAttribute('aria-current', 'page')
    expect(screen.getByRole('button', { name: 'Inicio' })).not.toHaveAttribute('aria-current')
  })

  it('defaults active section to inicio', () => {
    render(<Navbar onNavegar={vi.fn()} />)
    expect(screen.getByRole('button', { name: 'Inicio' })).toHaveAttribute('aria-current', 'page')
  })

  it('renders menu toggle button', () => {
    render(<Navbar onNavegar={vi.fn()} />)
    expect(screen.getByRole('button', { name: 'Menú' })).toBeInTheDocument()
  })

  it('toggles aria-expanded on menu button click', () => {
    render(<Navbar onNavegar={vi.fn()} />)
    const menuBtn = screen.getByRole('button', { name: 'Menú' })
    expect(menuBtn).toHaveAttribute('aria-expanded', 'false')
    fireEvent.click(menuBtn)
    expect(menuBtn).toHaveAttribute('aria-expanded', 'true')
    fireEvent.click(menuBtn)
    expect(menuBtn).toHaveAttribute('aria-expanded', 'false')
  })

  it('calls onNavegar with each valid section', () => {
    const handleNavegar = vi.fn()
    render(<Navbar onNavegar={handleNavegar} />)
    const secciones: NavSection[] = ['inicio', 'pacientes', 'citas', 'configuracion']
    const labels = ['Inicio', 'Pacientes', 'Citas', 'Configuración']
    labels.forEach((label, i) => {
      fireEvent.click(screen.getByRole('button', { name: label }))
      expect(handleNavegar).toHaveBeenNthCalledWith(i + 1, secciones[i])
    })
  })
})

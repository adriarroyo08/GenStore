import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import Button from '../components/Button'

describe('Button', () => {
  it('renders with the given label', () => {
    render(<Button label="Guardar" />)
    expect(screen.getByRole('button', { name: 'Guardar' })).toBeInTheDocument()
  })

  it('calls onClick when clicked', () => {
    const handleClick = vi.fn()
    render(<Button label="Enviar" onClick={handleClick} />)
    fireEvent.click(screen.getByRole('button'))
    expect(handleClick).toHaveBeenCalledTimes(1)
  })

  it('does not call onClick when disabled', () => {
    const handleClick = vi.fn()
    render(<Button label="Enviar" onClick={handleClick} disabled />)
    fireEvent.click(screen.getByRole('button'))
    expect(handleClick).not.toHaveBeenCalled()
  })

  it('renders as disabled when disabled prop is true', () => {
    render(<Button label="Eliminar" disabled />)
    expect(screen.getByRole('button')).toBeDisabled()
  })

  it('sets data-variant attribute for each variant', () => {
    const { rerender } = render(<Button label="Btn" variant="primary" />)
    expect(screen.getByRole('button')).toHaveAttribute('data-variant', 'primary')

    rerender(<Button label="Btn" variant="secondary" />)
    expect(screen.getByRole('button')).toHaveAttribute('data-variant', 'secondary')

    rerender(<Button label="Btn" variant="danger" />)
    expect(screen.getByRole('button')).toHaveAttribute('data-variant', 'danger')
  })

  it('defaults to type="button"', () => {
    render(<Button label="Btn" />)
    expect(screen.getByRole('button')).toHaveAttribute('type', 'button')
  })

  it('renders as submit type when specified', () => {
    render(<Button label="Enviar" type="submit" />)
    expect(screen.getByRole('button')).toHaveAttribute('type', 'submit')
  })
})

import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import AppointmentForm from '../components/AppointmentForm'

describe('AppointmentForm', () => {
  it('renders the form title', () => {
    render(<AppointmentForm onSubmit={vi.fn()} />)
    expect(screen.getByText('Nueva Cita')).toBeInTheDocument()
  })

  it('renders all form fields', () => {
    render(<AppointmentForm onSubmit={vi.fn()} />)
    expect(screen.getByLabelText('ID Paciente')).toBeInTheDocument()
    expect(screen.getByLabelText('Fecha')).toBeInTheDocument()
    expect(screen.getByLabelText('Hora')).toBeInTheDocument()
    expect(screen.getByLabelText('Motivo')).toBeInTheDocument()
  })

  it('shows error when submitting empty form', () => {
    render(<AppointmentForm onSubmit={vi.fn()} />)
    fireEvent.click(screen.getByRole('button', { name: 'Guardar Cita' }))
    expect(screen.getByRole('alert')).toHaveTextContent('Todos los campos son obligatorios')
  })

  it('does not call onSubmit when form is incomplete', () => {
    const handleSubmit = vi.fn()
    render(<AppointmentForm onSubmit={handleSubmit} />)
    fireEvent.click(screen.getByRole('button', { name: 'Guardar Cita' }))
    expect(handleSubmit).not.toHaveBeenCalled()
  })

  it('calls onSubmit with correct data when form is complete', () => {
    const handleSubmit = vi.fn()
    render(<AppointmentForm onSubmit={handleSubmit} />)

    fireEvent.change(screen.getByLabelText('ID Paciente'), { target: { value: 'pac-001' } })
    fireEvent.change(screen.getByLabelText('Fecha'), { target: { value: '2026-04-01' } })
    fireEvent.change(screen.getByLabelText('Hora'), { target: { value: '10:00' } })
    fireEvent.change(screen.getByLabelText('Motivo'), { target: { value: 'Revisión mensual' } })

    fireEvent.click(screen.getByRole('button', { name: 'Guardar Cita' }))

    expect(handleSubmit).toHaveBeenCalledWith({
      pacienteId: 'pac-001',
      fecha: '2026-04-01',
      hora: '10:00',
      motivo: 'Revisión mensual',
    })
  })

  it('clears error after successful submission', () => {
    const handleSubmit = vi.fn()
    render(<AppointmentForm onSubmit={handleSubmit} />)

    // trigger error first
    fireEvent.click(screen.getByRole('button', { name: 'Guardar Cita' }))
    expect(screen.getByRole('alert')).toBeInTheDocument()

    // fill form and submit
    fireEvent.change(screen.getByLabelText('ID Paciente'), { target: { value: 'pac-002' } })
    fireEvent.change(screen.getByLabelText('Fecha'), { target: { value: '2026-04-02' } })
    fireEvent.change(screen.getByLabelText('Hora'), { target: { value: '11:00' } })
    fireEvent.change(screen.getByLabelText('Motivo'), { target: { value: 'Dolor de espalda' } })
    fireEvent.click(screen.getByRole('button', { name: 'Guardar Cita' }))

    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
  })

  it('renders cancel button and calls onCancelar when clicked', () => {
    const handleCancelar = vi.fn()
    render(<AppointmentForm onSubmit={vi.fn()} onCancelar={handleCancelar} />)
    const cancelBtn = screen.getByRole('button', { name: 'Cancelar' })
    expect(cancelBtn).toBeInTheDocument()
    fireEvent.click(cancelBtn)
    expect(handleCancelar).toHaveBeenCalledTimes(1)
  })

  it('does not render cancel button when onCancelar is not provided', () => {
    render(<AppointmentForm onSubmit={vi.fn()} />)
    expect(screen.queryByRole('button', { name: 'Cancelar' })).not.toBeInTheDocument()
  })

  it('updates field values on user input', () => {
    render(<AppointmentForm onSubmit={vi.fn()} />)
    const pacienteInput = screen.getByLabelText('ID Paciente')
    fireEvent.change(pacienteInput, { target: { value: 'pac-999' } })
    expect(pacienteInput).toHaveValue('pac-999')
  })
})

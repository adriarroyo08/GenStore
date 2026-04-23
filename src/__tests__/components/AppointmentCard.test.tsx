import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { AppointmentCard } from '../../components/AppointmentCard'
import { Appointment } from '../../models/Appointment'

const mockAppointment: Appointment = {
  id: 'appt_1',
  pacienteId: 'patient_1',
  fecha: new Date('2026-06-15T10:30:00'),
  duracionMinutos: 60,
  tipo: 'tratamiento',
  estado: 'programada',
  pagado: false,
  precio: 50,
}

describe('AppointmentCard', () => {
  it('renders appointment card', () => {
    render(<AppointmentCard appointment={mockAppointment} />)
    expect(screen.getByTestId('appointment-card')).toBeInTheDocument()
  })

  it('displays appointment type', () => {
    render(<AppointmentCard appointment={mockAppointment} />)
    expect(screen.getByText('Tratamiento')).toBeInTheDocument()
  })

  it('displays appointment status', () => {
    render(<AppointmentCard appointment={mockAppointment} />)
    expect(screen.getByText('Programada')).toBeInTheDocument()
  })

  it('displays duration', () => {
    render(<AppointmentCard appointment={mockAppointment} />)
    expect(screen.getByText('60 min')).toBeInTheDocument()
  })

  it('displays price when provided', () => {
    render(<AppointmentCard appointment={mockAppointment} />)
    expect(screen.getByText('Precio: 50€')).toBeInTheDocument()
  })

  it('shows mark as paid button when not paid', () => {
    const onMarkPaid = vi.fn()
    render(<AppointmentCard appointment={mockAppointment} onMarkPaid={onMarkPaid} />)
    expect(screen.getByText('Marcar como pagado')).toBeInTheDocument()
  })

  it('calls onMarkPaid when button is clicked', async () => {
    const user = userEvent.setup()
    const onMarkPaid = vi.fn()
    render(<AppointmentCard appointment={mockAppointment} onMarkPaid={onMarkPaid} />)
    await user.click(screen.getByText('Marcar como pagado'))
    expect(onMarkPaid).toHaveBeenCalledWith('appt_1')
  })

  it('shows paid indicator when appointment is paid', () => {
    const paidAppointment = { ...mockAppointment, pagado: true }
    render(<AppointmentCard appointment={paidAppointment} />)
    expect(screen.getByText('✓ Pagado')).toBeInTheDocument()
  })

  it('shows action buttons for scheduled appointments', () => {
    const onStatusChange = vi.fn()
    render(<AppointmentCard appointment={mockAppointment} onStatusChange={onStatusChange} />)
    expect(screen.getByText('Completar')).toBeInTheDocument()
    expect(screen.getByText('Cancelar')).toBeInTheDocument()
  })

  it('calls onStatusChange with correct status', async () => {
    const user = userEvent.setup()
    const onStatusChange = vi.fn()
    render(<AppointmentCard appointment={mockAppointment} onStatusChange={onStatusChange} />)
    await user.click(screen.getByText('Completar'))
    expect(onStatusChange).toHaveBeenCalledWith('appt_1', 'completada')
  })

  it('does not show actions for cancelled appointments', () => {
    const cancelled = { ...mockAppointment, estado: 'cancelada' as const }
    render(<AppointmentCard appointment={cancelled} onStatusChange={vi.fn()} />)
    expect(screen.queryByText('Completar')).not.toBeInTheDocument()
  })

  it('displays notes when provided', () => {
    const withNotes = { ...mockAppointment, notas: 'Paciente con dolor lumbar' }
    render(<AppointmentCard appointment={withNotes} />)
    expect(screen.getByText('Paciente con dolor lumbar')).toBeInTheDocument()
  })
})

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, act } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { PatientForm } from '../../components/PatientForm'

describe('PatientForm', () => {
  const mockOnSubmit = vi.fn()

  beforeEach(() => {
    mockOnSubmit.mockClear()
  })

  it('renders the form', () => {
    render(<PatientForm onSubmit={mockOnSubmit} />)
    expect(screen.getByTestId('patient-form')).toBeInTheDocument()
  })

  it('has all required fields', () => {
    render(<PatientForm onSubmit={mockOnSubmit} />)
    expect(screen.getByLabelText('Nombre')).toBeInTheDocument()
    expect(screen.getByLabelText('Apellidos')).toBeInTheDocument()
    expect(screen.getByLabelText('Email')).toBeInTheDocument()
    expect(screen.getByLabelText('Teléfono')).toBeInTheDocument()
    expect(screen.getByLabelText('Fecha de Nacimiento')).toBeInTheDocument()
    expect(screen.getByLabelText('Género')).toBeInTheDocument()
  })

  it('shows validation errors when submitting empty form', async () => {
    const user = userEvent.setup()
    render(<PatientForm onSubmit={mockOnSubmit} />)
    await user.click(screen.getByText('Guardar Paciente'))
    expect(screen.getAllByRole('alert').length).toBeGreaterThan(0)
    expect(mockOnSubmit).not.toHaveBeenCalled()
  })

  it('submits form with valid data', async () => {
    const user = userEvent.setup()
    render(<PatientForm onSubmit={mockOnSubmit} />)

    await user.type(screen.getByLabelText('Nombre'), 'María')
    await user.type(screen.getByLabelText('Apellidos'), 'García López')
    await user.type(screen.getByLabelText('Email'), 'maria@example.com')
    await user.type(screen.getByLabelText('Teléfono'), '612345678')
    fireEvent.change(screen.getByLabelText('Fecha de Nacimiento'), {
      target: { value: '1990-05-15' }
    })

    await user.click(screen.getByText('Guardar Paciente'))
    expect(mockOnSubmit).toHaveBeenCalledTimes(1)
    const submittedPatient = mockOnSubmit.mock.calls[0][0]
    expect(submittedPatient.nombre).toBe('María')
    expect(submittedPatient.apellidos).toBe('García López')
    expect(submittedPatient.email).toBe('maria@example.com')
  })

  it('shows error for invalid email', async () => {
    const user = userEvent.setup()
    render(<PatientForm onSubmit={mockOnSubmit} />)

    await user.type(screen.getByLabelText('Nombre'), 'María')
    await user.type(screen.getByLabelText('Apellidos'), 'García')
    await user.type(screen.getByLabelText('Email'), 'invalid-email')
    await user.type(screen.getByLabelText('Teléfono'), '612345678')
    fireEvent.change(screen.getByLabelText('Fecha de Nacimiento'), { target: { value: '1990-05-15' } })

    await user.click(screen.getByText('Guardar Paciente'))
    expect(screen.getByText('El email no es válido')).toBeInTheDocument()
    expect(mockOnSubmit).not.toHaveBeenCalled()
  })

  it('calls onCancel when cancel button is clicked', async () => {
    const user = userEvent.setup()
    const onCancel = vi.fn()
    render(<PatientForm onSubmit={mockOnSubmit} onCancel={onCancel} />)
    await user.click(screen.getByText('Cancelar'))
    expect(onCancel).toHaveBeenCalled()
  })

  it('does not show cancel button when onCancel is not provided', () => {
    render(<PatientForm onSubmit={mockOnSubmit} />)
    expect(screen.queryByText('Cancelar')).not.toBeInTheDocument()
  })
})

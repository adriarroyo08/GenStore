import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import PatientCard, { Patient } from '../components/PatientCard'

const pacienteMock: Patient = {
  id: '1',
  nombre: 'Juan',
  apellido: 'García',
  edad: 35,
  telefono: '600123456',
  diagnostico: 'Lumbalgia crónica',
}

describe('PatientCard', () => {
  it('renders patient name and surname', () => {
    render(<PatientCard paciente={pacienteMock} />)
    expect(screen.getByText('Juan García')).toBeInTheDocument()
  })

  it('renders patient age', () => {
    render(<PatientCard paciente={pacienteMock} />)
    expect(screen.getByTestId('edad')).toHaveTextContent('35')
  })

  it('renders patient phone', () => {
    render(<PatientCard paciente={pacienteMock} />)
    expect(screen.getByTestId('telefono')).toHaveTextContent('600123456')
  })

  it('renders diagnosis when present', () => {
    render(<PatientCard paciente={pacienteMock} />)
    expect(screen.getByTestId('diagnostico')).toHaveTextContent('Lumbalgia crónica')
  })

  it('does not render diagnosis when absent', () => {
    const sinDiagnostico = { ...pacienteMock, diagnostico: undefined }
    render(<PatientCard paciente={sinDiagnostico} />)
    expect(screen.queryByTestId('diagnostico')).not.toBeInTheDocument()
  })

  it('calls onEditar with patient id when edit button clicked', () => {
    const handleEditar = vi.fn()
    render(<PatientCard paciente={pacienteMock} onEditar={handleEditar} />)
    fireEvent.click(screen.getByRole('button', { name: 'Editar' }))
    expect(handleEditar).toHaveBeenCalledWith('1')
  })

  it('calls onEliminar with patient id when delete button clicked', () => {
    const handleEliminar = vi.fn()
    render(<PatientCard paciente={pacienteMock} onEliminar={handleEliminar} />)
    fireEvent.click(screen.getByRole('button', { name: 'Eliminar' }))
    expect(handleEliminar).toHaveBeenCalledWith('1')
  })

  it('does not render edit button when onEditar is not provided', () => {
    render(<PatientCard paciente={pacienteMock} />)
    expect(screen.queryByRole('button', { name: 'Editar' })).not.toBeInTheDocument()
  })

  it('does not render delete button when onEliminar is not provided', () => {
    render(<PatientCard paciente={pacienteMock} />)
    expect(screen.queryByRole('button', { name: 'Eliminar' })).not.toBeInTheDocument()
  })

  it('has accessible label with patient name', () => {
    render(<PatientCard paciente={pacienteMock} />)
    expect(screen.getByRole('article', { name: /Juan García/i })).toBeInTheDocument()
  })
})

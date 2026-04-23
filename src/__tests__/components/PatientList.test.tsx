import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { PatientList } from '../../components/PatientList'
import { Patient } from '../../models/Patient'

const mockPatients: Patient[] = [
  {
    id: '1',
    nombre: 'Ana',
    apellidos: 'García',
    email: 'ana@example.com',
    telefono: '612345678',
    fechaNacimiento: new Date('1990-01-01'),
    genero: 'femenino',
    fechaRegistro: new Date(),
    activo: true,
  },
  {
    id: '2',
    nombre: 'Pedro',
    apellidos: 'López',
    email: 'pedro@example.com',
    telefono: '698765432',
    fechaNacimiento: new Date('1985-06-15'),
    genero: 'masculino',
    fechaRegistro: new Date(),
    activo: false,
  },
]

describe('PatientList', () => {
  it('shows message when no patients', () => {
    render(<PatientList patients={[]} />)
    expect(screen.getByTestId('no-patients')).toBeInTheDocument()
    expect(screen.getByText('No hay pacientes registrados')).toBeInTheDocument()
  })

  it('renders list of patients', () => {
    render(<PatientList patients={mockPatients} />)
    expect(screen.getByTestId('patient-list')).toBeInTheDocument()
    expect(screen.getByText('Ana García')).toBeInTheDocument()
    expect(screen.getByText('Pedro López')).toBeInTheDocument()
  })

  it('displays patient emails', () => {
    render(<PatientList patients={mockPatients} />)
    expect(screen.getByText('ana@example.com')).toBeInTheDocument()
  })

  it('shows active/inactive status', () => {
    render(<PatientList patients={mockPatients} />)
    expect(screen.getByText('Activo')).toBeInTheDocument()
    expect(screen.getByText('Inactivo')).toBeInTheDocument()
  })

  it('calls onSelectPatient when patient is clicked', async () => {
    const user = userEvent.setup()
    const onSelect = vi.fn()
    render(<PatientList patients={mockPatients} onSelectPatient={onSelect} />)
    await user.click(screen.getByTestId('patient-item-1'))
    expect(onSelect).toHaveBeenCalledWith(mockPatients[0])
  })
})

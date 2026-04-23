import React, { useState } from 'react'
import { Patient } from '../models/Patient'

export interface PatientListProps {
  patients: Patient[]
  onSelectPatient?: (patient: Patient) => void
}

const PatientList: React.FC<PatientListProps> = ({ patients, onSelectPatient }) => {
  const [busqueda, setBusqueda] = useState('')

  const filtrados = patients.filter((p) =>
    `${p.nombre} ${p.apellidos}`.toLowerCase().includes(busqueda.toLowerCase())
  )

  return (
    <section aria-label="Lista de pacientes">
      <h2>Pacientes</h2>
      <input
        type="search"
        placeholder="Buscar paciente..."
        value={busqueda}
        onChange={(e) => setBusqueda(e.target.value)}
        aria-label="Buscar paciente"
      />
      {filtrados.length === 0 ? (
        <p data-testid="no-patients">No hay pacientes registrados</p>
      ) : (
        <ul data-testid="patient-list">
          {filtrados.map((patient) => (
            <li
              key={patient.id}
              data-testid={`patient-item-${patient.id}`}
              onClick={() => onSelectPatient?.(patient)}
              style={{ cursor: onSelectPatient ? 'pointer' : 'default' }}
            >
              <strong>{patient.nombre} {patient.apellidos}</strong>
              <span>{patient.email}</span>
              <span>{patient.activo ? 'Activo' : 'Inactivo'}</span>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}

export default PatientList
export { PatientList }

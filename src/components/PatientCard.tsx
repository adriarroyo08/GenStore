import React from 'react'

export interface Patient {
  id: string
  nombre: string
  apellido: string
  edad: number
  telefono: string
  diagnostico?: string
}

export interface PatientCardProps {
  paciente: Patient
  onEditar?: (id: string) => void
  onEliminar?: (id: string) => void
}

const PatientCard: React.FC<PatientCardProps> = ({ paciente, onEditar, onEliminar }) => {
  return (
    <article aria-label={`Paciente ${paciente.nombre} ${paciente.apellido}`}>
      <h3>{paciente.nombre} {paciente.apellido}</h3>
      <p data-testid="edad">Edad: {paciente.edad} años</p>
      <p data-testid="telefono">Teléfono: {paciente.telefono}</p>
      {paciente.diagnostico && (
        <p data-testid="diagnostico">Diagnóstico: {paciente.diagnostico}</p>
      )}
      <div>
        {onEditar && (
          <button onClick={() => onEditar(paciente.id)}>Editar</button>
        )}
        {onEliminar && (
          <button onClick={() => onEliminar(paciente.id)}>Eliminar</button>
        )}
      </div>
    </article>
  )
}

export default PatientCard

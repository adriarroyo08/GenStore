import React, { useState } from 'react'

export interface AppointmentData {
  pacienteId: string
  fecha: string
  hora: string
  motivo: string
}

export interface AppointmentFormProps {
  onSubmit: (data: AppointmentData) => void
  onCancelar?: () => void
}

const AppointmentForm: React.FC<AppointmentFormProps> = ({ onSubmit, onCancelar }) => {
  const [pacienteId, setPacienteId] = useState('')
  const [fecha, setFecha] = useState('')
  const [hora, setHora] = useState('')
  const [motivo, setMotivo] = useState('')
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!pacienteId || !fecha || !hora || !motivo) {
      setError('Todos los campos son obligatorios')
      return
    }
    setError(null)
    onSubmit({ pacienteId, fecha, hora, motivo })
  }

  return (
    <form onSubmit={handleSubmit} aria-label="Formulario de cita">
      <h2>Nueva Cita</h2>
      {error && <p role="alert">{error}</p>}
      <div>
        <label htmlFor="pacienteId">ID Paciente</label>
        <input
          id="pacienteId"
          type="text"
          value={pacienteId}
          onChange={(e) => setPacienteId(e.target.value)}
          placeholder="ID del paciente"
        />
      </div>
      <div>
        <label htmlFor="fecha">Fecha</label>
        <input
          id="fecha"
          type="date"
          value={fecha}
          onChange={(e) => setFecha(e.target.value)}
        />
      </div>
      <div>
        <label htmlFor="hora">Hora</label>
        <input
          id="hora"
          type="time"
          value={hora}
          onChange={(e) => setHora(e.target.value)}
        />
      </div>
      <div>
        <label htmlFor="motivo">Motivo</label>
        <textarea
          id="motivo"
          value={motivo}
          onChange={(e) => setMotivo(e.target.value)}
          placeholder="Motivo de la consulta"
        />
      </div>
      <div>
        <button type="submit">Guardar Cita</button>
        {onCancelar && (
          <button type="button" onClick={onCancelar}>Cancelar</button>
        )}
      </div>
    </form>
  )
}

export default AppointmentForm

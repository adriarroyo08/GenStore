import { useState } from 'react'
import { Gender, Patient } from '../models/Patient'
import { validateEmail, validatePhone, validateRequired } from '../utils/validators'

interface PatientFormProps {
  onSubmit: (patient: Patient) => void
  onCancel?: () => void
}

export function PatientForm({ onSubmit, onCancel }: PatientFormProps) {
  const [nombre, setNombre] = useState('')
  const [apellidos, setApellidos] = useState('')
  const [email, setEmail] = useState('')
  const [telefono, setTelefono] = useState('')
  const [fechaNacimiento, setFechaNacimiento] = useState('')
  const [genero, setGenero] = useState<Gender>('masculino')
  const [diagnostico, setDiagnostico] = useState('')
  const [errors, setErrors] = useState<Record<string, string>>({})

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {}
    if (!validateRequired(nombre)) newErrors.nombre = 'El nombre es requerido'
    if (!validateRequired(apellidos)) newErrors.apellidos = 'Los apellidos son requeridos'
    if (!validateEmail(email)) newErrors.email = 'El email no es válido'
    if (!validatePhone(telefono)) newErrors.telefono = 'El teléfono no es válido'
    if (!fechaNacimiento) newErrors.fechaNacimiento = 'La fecha de nacimiento es requerida'
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!validate()) return

    const patient: Patient = {
      id: `patient_${Date.now()}`,
      nombre,
      apellidos,
      email,
      telefono,
      fechaNacimiento: new Date(fechaNacimiento),
      genero,
      diagnostico: diagnostico || undefined,
      fechaRegistro: new Date(),
      activo: true,
    }
    onSubmit(patient)
  }

  return (
    <form onSubmit={handleSubmit} data-testid="patient-form">
      <h2>Nuevo Paciente</h2>
      <div>
        <label htmlFor="nombre">Nombre</label>
        <input
          id="nombre"
          value={nombre}
          onChange={e => setNombre(e.target.value)}
          placeholder="Nombre"
        />
        {errors.nombre && <span role="alert">{errors.nombre}</span>}
      </div>
      <div>
        <label htmlFor="apellidos">Apellidos</label>
        <input
          id="apellidos"
          value={apellidos}
          onChange={e => setApellidos(e.target.value)}
          placeholder="Apellidos"
        />
        {errors.apellidos && <span role="alert">{errors.apellidos}</span>}
      </div>
      <div>
        <label htmlFor="email">Email</label>
        <input
          id="email"
          type="text"
          value={email}
          onChange={e => setEmail(e.target.value)}
          placeholder="Email"
        />
        {errors.email && <span role="alert">{errors.email}</span>}
      </div>
      <div>
        <label htmlFor="telefono">Teléfono</label>
        <input
          id="telefono"
          value={telefono}
          onChange={e => setTelefono(e.target.value)}
          placeholder="Teléfono"
        />
        {errors.telefono && <span role="alert">{errors.telefono}</span>}
      </div>
      <div>
        <label htmlFor="fechaNacimiento">Fecha de Nacimiento</label>
        <input
          id="fechaNacimiento"
          type="date"
          value={fechaNacimiento}
          onChange={e => setFechaNacimiento(e.target.value)}
        />
        {errors.fechaNacimiento && <span role="alert">{errors.fechaNacimiento}</span>}
      </div>
      <div>
        <label htmlFor="genero">Género</label>
        <select
          id="genero"
          value={genero}
          onChange={e => setGenero(e.target.value as Gender)}
        >
          <option value="masculino">Masculino</option>
          <option value="femenino">Femenino</option>
          <option value="otro">Otro</option>
        </select>
      </div>
      <div>
        <label htmlFor="diagnostico">Diagnóstico</label>
        <textarea
          id="diagnostico"
          value={diagnostico}
          onChange={e => setDiagnostico(e.target.value)}
          placeholder="Diagnóstico inicial (opcional)"
        />
      </div>
      <button type="submit">Guardar Paciente</button>
      {onCancel && <button type="button" onClick={onCancel}>Cancelar</button>}
    </form>
  )
}

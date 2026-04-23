export interface Patient {
  id: string
  nombre: string
  apellido: string
  telefono: string
  email: string
  fechaNacimiento: string
  diagnostico: string
  activo: boolean
}

export interface Cita {
  id: string
  pacienteId: string
  fecha: string
  hora: string
  duracion: number
  notas: string
  estado: 'pendiente' | 'confirmada' | 'completada' | 'cancelada'
}

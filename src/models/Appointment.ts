export type AppointmentStatus = 'programada' | 'completada' | 'cancelada' | 'no_asistio'
export type AppointmentType = 'evaluacion' | 'tratamiento' | 'seguimiento' | 'alta'

export interface Appointment {
  id: string
  pacienteId: string
  fecha: Date
  duracionMinutos: number
  tipo: AppointmentType
  estado: AppointmentStatus
  notas?: string
  precio?: number
  pagado: boolean
}

export interface CreateAppointmentDTO {
  pacienteId: string
  fecha: Date
  duracionMinutos: number
  tipo: AppointmentType
  notas?: string
  precio?: number
}

export function getFechaFormateada(appointment: Appointment): string {
  return appointment.fecha.toLocaleDateString('es-ES', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}

export function getHoraFormateada(appointment: Appointment): string {
  return appointment.fecha.toLocaleTimeString('es-ES', {
    hour: '2-digit',
    minute: '2-digit',
  })
}

export function isAppointmentToday(appointment: Appointment): boolean {
  const hoy = new Date()
  const fecha = new Date(appointment.fecha)
  return (
    fecha.getDate() === hoy.getDate() &&
    fecha.getMonth() === hoy.getMonth() &&
    fecha.getFullYear() === hoy.getFullYear()
  )
}

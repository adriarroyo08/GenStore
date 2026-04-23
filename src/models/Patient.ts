export type Gender = 'masculino' | 'femenino' | 'otro'

export interface Patient {
  id: string
  nombre: string
  apellidos: string
  email: string
  telefono: string
  fechaNacimiento: Date
  genero: Gender
  diagnostico?: string
  historialMedico?: string
  fechaRegistro: Date
  activo: boolean
}

export interface CreatePatientDTO {
  nombre: string
  apellidos: string
  email: string
  telefono: string
  fechaNacimiento: Date
  genero: Gender
  diagnostico?: string
  historialMedico?: string
}

export function calcularEdad(fechaNacimiento: Date): number {
  const hoy = new Date()
  const nacimiento = new Date(fechaNacimiento)
  let edad = hoy.getFullYear() - nacimiento.getFullYear()
  const mes = hoy.getMonth() - nacimiento.getMonth()
  if (mes < 0 || (mes === 0 && hoy.getDate() < nacimiento.getDate())) {
    edad--
  }
  return edad
}

export function getNombreCompleto(patient: Patient): string {
  return `${patient.nombre} ${patient.apellidos}`
}

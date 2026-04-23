import { Appointment, CreateAppointmentDTO, AppointmentStatus } from '../models/Appointment'

export class AppointmentService {
  private appointments: Map<string, Appointment> = new Map()

  createAppointment(dto: CreateAppointmentDTO): Appointment {
    if (!dto.pacienteId) {
      throw new Error('El ID del paciente es requerido')
    }
    if (dto.duracionMinutos <= 0) {
      throw new Error('La duración debe ser mayor a 0 minutos')
    }
    if (dto.fecha < new Date()) {
      throw new Error('La fecha de la cita no puede ser en el pasado')
    }

    const appointment: Appointment = {
      id: this.generateId(),
      ...dto,
      estado: 'programada',
      pagado: false,
    }

    this.appointments.set(appointment.id, appointment)
    return appointment
  }

  getAppointment(id: string): Appointment | undefined {
    return this.appointments.get(id)
  }

  getAppointmentsByPatient(pacienteId: string): Appointment[] {
    return Array.from(this.appointments.values()).filter(
      a => a.pacienteId === pacienteId
    )
  }

  updateStatus(id: string, estado: AppointmentStatus): Appointment {
    const appointment = this.appointments.get(id)
    if (!appointment) {
      throw new Error(`Cita con id ${id} no encontrada`)
    }
    const updated: Appointment = { ...appointment, estado }
    this.appointments.set(id, updated)
    return updated
  }

  markAsPaid(id: string): Appointment {
    const appointment = this.appointments.get(id)
    if (!appointment) {
      throw new Error(`Cita con id ${id} no encontrada`)
    }
    const updated: Appointment = { ...appointment, pagado: true }
    this.appointments.set(id, updated)
    return updated
  }

  getAppointmentsByDate(date: Date): Appointment[] {
    return Array.from(this.appointments.values()).filter(a => {
      const apptDate = new Date(a.fecha)
      return (
        apptDate.getDate() === date.getDate() &&
        apptDate.getMonth() === date.getMonth() &&
        apptDate.getFullYear() === date.getFullYear()
      )
    })
  }

  getUpcomingAppointments(): Appointment[] {
    const now = new Date()
    return Array.from(this.appointments.values())
      .filter(a => new Date(a.fecha) > now && a.estado === 'programada')
      .sort((a, b) => new Date(a.fecha).getTime() - new Date(b.fecha).getTime())
  }

  cancelAppointment(id: string): Appointment {
    return this.updateStatus(id, 'cancelada')
  }

  private generateId(): string {
    return `appointment_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }
}

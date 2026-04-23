import { useState, useCallback, useRef } from 'react'
import { Appointment, CreateAppointmentDTO, AppointmentStatus } from '../models/Appointment'
import { AppointmentService } from '../services/AppointmentService'

export interface UseAppointmentsReturn {
  appointments: Appointment[]
  loading: boolean
  error: string | null
  createAppointment: (dto: CreateAppointmentDTO) => Appointment
  cancelAppointment: (id: string) => Appointment
  updateStatus: (id: string, estado: AppointmentStatus) => Appointment
  markAsPaid: (id: string) => Appointment
  getByPatient: (pacienteId: string) => Appointment[]
  getByDate: (date: Date) => Appointment[]
  getUpcoming: () => Appointment[]
  refreshAppointments: () => void
  clearError: () => void
}

export function useAppointments(injectedService?: AppointmentService): UseAppointmentsReturn {
  const serviceRef = useRef<AppointmentService>(injectedService ?? new AppointmentService())
  const service = serviceRef.current

  const [appointments, setAppointments] = useState<Appointment[]>(() =>
    service.getUpcomingAppointments()
  )
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const refreshAppointments = useCallback(() => {
    setAppointments(service.getUpcomingAppointments())
  }, [service])

  const clearError = useCallback(() => {
    setError(null)
  }, [])

  const createAppointment = useCallback((dto: CreateAppointmentDTO): Appointment => {
    setLoading(true)
    setError(null)
    try {
      const appointment = service.createAppointment(dto)
      setAppointments(service.getUpcomingAppointments())
      return appointment
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error al crear cita'
      setError(message)
      throw err
    } finally {
      setLoading(false)
    }
  }, [service])

  const cancelAppointment = useCallback((id: string): Appointment => {
    setLoading(true)
    setError(null)
    try {
      const cancelled = service.cancelAppointment(id)
      setAppointments(service.getUpcomingAppointments())
      return cancelled
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error al cancelar cita'
      setError(message)
      throw err
    } finally {
      setLoading(false)
    }
  }, [service])

  const updateStatus = useCallback((id: string, estado: AppointmentStatus): Appointment => {
    setLoading(true)
    setError(null)
    try {
      const updated = service.updateStatus(id, estado)
      setAppointments(service.getUpcomingAppointments())
      return updated
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error al actualizar estado'
      setError(message)
      throw err
    } finally {
      setLoading(false)
    }
  }, [service])

  const markAsPaid = useCallback((id: string): Appointment => {
    setLoading(true)
    setError(null)
    try {
      const paid = service.markAsPaid(id)
      setAppointments(service.getUpcomingAppointments())
      return paid
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error al marcar como pagada'
      setError(message)
      throw err
    } finally {
      setLoading(false)
    }
  }, [service])

  const getByPatient = useCallback((pacienteId: string): Appointment[] => {
    return service.getAppointmentsByPatient(pacienteId)
  }, [service])

  const getByDate = useCallback((date: Date): Appointment[] => {
    return service.getAppointmentsByDate(date)
  }, [service])

  const getUpcoming = useCallback((): Appointment[] => {
    return service.getUpcomingAppointments()
  }, [service])

  return {
    appointments,
    loading,
    error,
    createAppointment,
    cancelAppointment,
    updateStatus,
    markAsPaid,
    getByPatient,
    getByDate,
    getUpcoming,
    refreshAppointments,
    clearError,
  }
}

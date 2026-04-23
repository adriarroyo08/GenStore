import { useState, useCallback, useRef } from 'react'
import { Patient, CreatePatientDTO } from '../models/Patient'
import { PatientService } from '../services/PatientService'

export interface UsePatientsReturn {
  patients: Patient[]
  loading: boolean
  error: string | null
  createPatient: (dto: CreatePatientDTO) => Patient
  updatePatient: (id: string, updates: Partial<CreatePatientDTO>) => Patient
  deactivatePatient: (id: string) => Patient
  searchPatients: (query: string) => Patient[]
  getActivePatients: () => Patient[]
  refreshPatients: () => void
  clearError: () => void
}

export function usePatients(injectedService?: PatientService): UsePatientsReturn {
  const serviceRef = useRef<PatientService>(injectedService ?? new PatientService())
  const service = serviceRef.current

  const [patients, setPatients] = useState<Patient[]>(() => service.getAllPatients())
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const refreshPatients = useCallback(() => {
    setPatients(service.getAllPatients())
  }, [service])

  const clearError = useCallback(() => {
    setError(null)
  }, [])

  const createPatient = useCallback((dto: CreatePatientDTO): Patient => {
    setLoading(true)
    setError(null)
    try {
      const patient = service.createPatient(dto)
      setPatients(service.getAllPatients())
      return patient
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error al crear paciente'
      setError(message)
      throw err
    } finally {
      setLoading(false)
    }
  }, [service])

  const updatePatient = useCallback((id: string, updates: Partial<CreatePatientDTO>): Patient => {
    setLoading(true)
    setError(null)
    try {
      const updated = service.updatePatient(id, updates)
      setPatients(service.getAllPatients())
      return updated
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error al actualizar paciente'
      setError(message)
      throw err
    } finally {
      setLoading(false)
    }
  }, [service])

  const deactivatePatient = useCallback((id: string): Patient => {
    setLoading(true)
    setError(null)
    try {
      const deactivated = service.deactivatePatient(id)
      setPatients(service.getAllPatients())
      return deactivated
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error al desactivar paciente'
      setError(message)
      throw err
    } finally {
      setLoading(false)
    }
  }, [service])

  const searchPatients = useCallback((query: string): Patient[] => {
    return service.searchPatients(query)
  }, [service])

  const getActivePatients = useCallback((): Patient[] => {
    return service.getActivePatients()
  }, [service])

  return {
    patients,
    loading,
    error,
    createPatient,
    updatePatient,
    deactivatePatient,
    searchPatients,
    getActivePatients,
    refreshPatients,
    clearError,
  }
}

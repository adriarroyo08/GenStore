import { Patient, CreatePatientDTO, getNombreCompleto } from '../models/Patient'
import { validateEmail, validatePhone } from '../utils/validators'

export class PatientService {
  private patients: Map<string, Patient> = new Map()

  createPatient(dto: CreatePatientDTO): Patient {
    if (!dto.nombre.trim()) {
      throw new Error('El nombre es requerido')
    }
    if (!dto.apellidos.trim()) {
      throw new Error('Los apellidos son requeridos')
    }
    if (!validateEmail(dto.email)) {
      throw new Error('El email no es válido')
    }
    if (!validatePhone(dto.telefono)) {
      throw new Error('El teléfono no es válido')
    }

    const patient: Patient = {
      id: this.generateId(),
      ...dto,
      fechaRegistro: new Date(),
      activo: true,
    }

    this.patients.set(patient.id, patient)
    return patient
  }

  getPatient(id: string): Patient | undefined {
    return this.patients.get(id)
  }

  getAllPatients(): Patient[] {
    return Array.from(this.patients.values())
  }

  getActivePatients(): Patient[] {
    return this.getAllPatients().filter(p => p.activo)
  }

  updatePatient(id: string, updates: Partial<CreatePatientDTO>): Patient {
    const patient = this.patients.get(id)
    if (!patient) {
      throw new Error(`Paciente con id ${id} no encontrado`)
    }

    if (updates.email && !validateEmail(updates.email)) {
      throw new Error('El email no es válido')
    }
    if (updates.telefono && !validatePhone(updates.telefono)) {
      throw new Error('El teléfono no es válido')
    }

    const updated: Patient = { ...patient, ...updates }
    this.patients.set(id, updated)
    return updated
  }

  deactivatePatient(id: string): Patient {
    const patient = this.patients.get(id)
    if (!patient) {
      throw new Error(`Paciente con id ${id} no encontrado`)
    }
    const updated: Patient = { ...patient, activo: false }
    this.patients.set(id, updated)
    return updated
  }

  searchPatients(query: string): Patient[] {
    const lowerQuery = query.toLowerCase()
    return this.getAllPatients().filter(p =>
      getNombreCompleto(p).toLowerCase().includes(lowerQuery) ||
      p.email.toLowerCase().includes(lowerQuery) ||
      p.telefono.includes(query)
    )
  }

  private generateId(): string {
    return `patient_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }
}

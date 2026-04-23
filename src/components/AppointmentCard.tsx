import { Appointment, AppointmentStatus, getFechaFormateada, getHoraFormateada } from '../models/Appointment'

interface AppointmentCardProps {
  appointment: Appointment
  onStatusChange?: (id: string, status: AppointmentStatus) => void
  onMarkPaid?: (id: string) => void
}

const statusLabels: Record<AppointmentStatus, string> = {
  programada: 'Programada',
  completada: 'Completada',
  cancelada: 'Cancelada',
  no_asistio: 'No asistió',
}

const tipoLabels: Record<string, string> = {
  evaluacion: 'Evaluación',
  tratamiento: 'Tratamiento',
  seguimiento: 'Seguimiento',
  alta: 'Alta',
}

export function AppointmentCard({ appointment, onStatusChange, onMarkPaid }: AppointmentCardProps) {
  return (
    <div data-testid="appointment-card" className={`appointment-card status-${appointment.estado}`}>
      <div className="appointment-header">
        <span className="appointment-date">{getFechaFormateada(appointment)}</span>
        <span className="appointment-time">{getHoraFormateada(appointment)}</span>
      </div>
      <div className="appointment-details">
        <span className="appointment-type">{tipoLabels[appointment.tipo]}</span>
        <span className="appointment-status">{statusLabels[appointment.estado]}</span>
        <span className="appointment-duration">{appointment.duracionMinutos} min</span>
      </div>
      {appointment.notas && (
        <p className="appointment-notes">{appointment.notas}</p>
      )}
      {appointment.precio !== undefined && (
        <div className="appointment-price">
          <span>Precio: {appointment.precio}€</span>
          {!appointment.pagado && onMarkPaid && (
            <button onClick={() => onMarkPaid(appointment.id)}>Marcar como pagado</button>
          )}
          {appointment.pagado && <span>✓ Pagado</span>}
        </div>
      )}
      {onStatusChange && appointment.estado === 'programada' && (
        <div className="appointment-actions">
          <button onClick={() => onStatusChange(appointment.id, 'completada')}>
            Completar
          </button>
          <button onClick={() => onStatusChange(appointment.id, 'cancelada')}>
            Cancelar
          </button>
        </div>
      )}
    </div>
  )
}

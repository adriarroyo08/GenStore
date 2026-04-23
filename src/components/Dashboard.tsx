import React from 'react'
import type { Patient, Cita } from '../types'

interface DashboardProps {
  pacientes: Patient[]
  citas: Cita[]
  onNuevaCita?: () => void
  onNuevoPaciente?: () => void
}

interface StatCardProps {
  titulo: string
  valor: number | string
  testId: string
}

const StatCard: React.FC<StatCardProps> = ({ titulo, valor, testId }) => (
  <div className="stat-card" data-testid={testId}>
    <span className="stat-titulo">{titulo}</span>
    <span className="stat-valor">{valor}</span>
  </div>
)

const Dashboard: React.FC<DashboardProps> = ({
  pacientes,
  citas,
  onNuevaCita,
  onNuevoPaciente,
}) => {
  const pacientesActivos = pacientes.filter((p) => p.activo).length
  const citasHoy = citas.filter((c) => c.fecha === new Date().toISOString().split('T')[0]).length
  const citasPendientes = citas.filter((c) => c.estado === 'pendiente').length
  const citasCompletadas = citas.filter((c) => c.estado === 'completada').length

  return (
    <div data-testid="dashboard">
      <h2>Panel de Control</h2>

      <div className="stats-grid">
        <StatCard
          titulo="Total Pacientes"
          valor={pacientes.length}
          testId="stat-total-pacientes"
        />
        <StatCard
          titulo="Pacientes Activos"
          valor={pacientesActivos}
          testId="stat-pacientes-activos"
        />
        <StatCard
          titulo="Citas Hoy"
          valor={citasHoy}
          testId="stat-citas-hoy"
        />
        <StatCard
          titulo="Citas Pendientes"
          valor={citasPendientes}
          testId="stat-citas-pendientes"
        />
        <StatCard
          titulo="Citas Completadas"
          valor={citasCompletadas}
          testId="stat-citas-completadas"
        />
      </div>

      <div className="dashboard-actions">
        {onNuevoPaciente && (
          <button onClick={onNuevoPaciente} data-testid="btn-nuevo-paciente">
            Nuevo Paciente
          </button>
        )}
        {onNuevaCita && (
          <button onClick={onNuevaCita} data-testid="btn-nueva-cita">
            Nueva Cita
          </button>
        )}
      </div>

      {citas.length > 0 && (
        <section data-testid="proximas-citas">
          <h3>Próximas Citas</h3>
          <ul>
            {citas
              .filter((c) => c.estado === 'pendiente' || c.estado === 'confirmada')
              .slice(0, 5)
              .map((cita) => {
                const paciente = pacientes.find((p) => p.id === cita.pacienteId)
                return (
                  <li key={cita.id} data-testid={`cita-item-${cita.id}`}>
                    <span>{cita.fecha} {cita.hora}</span>
                    {paciente && (
                      <span> - {paciente.nombre} {paciente.apellido}</span>
                    )}
                    <span className={`estado-badge estado-${cita.estado}`}>
                      {cita.estado}
                    </span>
                  </li>
                )
              })}
          </ul>
        </section>
      )}
    </div>
  )
}

export default Dashboard

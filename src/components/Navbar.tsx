import React, { useState } from 'react'

export type NavSection = 'inicio' | 'pacientes' | 'citas' | 'configuracion'

export interface NavbarProps {
  onNavegar: (seccion: NavSection) => void
  seccionActiva?: NavSection
}

const SECCIONES: { id: NavSection; label: string }[] = [
  { id: 'inicio', label: 'Inicio' },
  { id: 'pacientes', label: 'Pacientes' },
  { id: 'citas', label: 'Citas' },
  { id: 'configuracion', label: 'Configuración' },
]

const Navbar: React.FC<NavbarProps> = ({ onNavegar, seccionActiva = 'inicio' }) => {
  const [menuAbierto, setMenuAbierto] = useState(false)

  return (
    <nav aria-label="Navegación principal">
      <div>
        <span>GenStore</span>
        <button
          aria-label="Menú"
          aria-expanded={menuAbierto}
          onClick={() => setMenuAbierto((prev) => !prev)}
        >
          ☰
        </button>
      </div>
      <ul aria-hidden={!menuAbierto && undefined}>
        {SECCIONES.map(({ id, label }) => (
          <li key={id}>
            <button
              onClick={() => onNavegar(id)}
              aria-current={seccionActiva === id ? 'page' : undefined}
            >
              {label}
            </button>
          </li>
        ))}
      </ul>
    </nav>
  )
}

export default Navbar

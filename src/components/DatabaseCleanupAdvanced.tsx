// ⚠️ COMPONENTE DE DEBUG ELIMINADO EN LIMPIEZA DE PRODUCCIÓN ⚠️
// Este componente de cleanup de database ha sido eliminado para el lanzamiento en producción.
// Las operaciones de limpieza de base de datos deben ser manejadas por administradores con acceso directo.

import React from 'react';

export function DatabaseCleanupAdvanced() {
  if (process.env.NODE_ENV === 'production') {
    return null;
  }
  
  return (
    <div className="text-center text-red-500 p-4">
      <p>Funciones de cleanup de base de datos no disponibles en producción</p>
    </div>
  );
}
// ⚠️ COMPONENTE DE MONITOREO ELIMINADO EN LIMPIEZA DE PRODUCCIÓN ⚠️
// Este componente de health check ha sido eliminado para el lanzamiento en producción.

import React from 'react';

export function ServerHealthCheck() {
  if (process.env.NODE_ENV === 'production') {
    return null;
  }
  
  return (
    <div className="text-center text-red-500 p-4">
      <p>Health check no disponible en producción</p>
    </div>
  );
}
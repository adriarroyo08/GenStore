// ⚠️ COMPONENTE DE INICIALIZACIÓN ELIMINADO EN LIMPIEZA DE PRODUCCIÓN ⚠️
// Este componente de inicialización ha sido eliminado para el lanzamiento en producción.
// La inicialización de base de datos debe ser manejada por scripts de deployment.

import React from 'react';

export function DatabaseInitializer() {
  if (process.env.NODE_ENV === 'production') {
    return null;
  }
  
  return (
    <div className="text-center text-red-500 p-4">
      <p>Inicializador de base de datos no disponible en producción</p>
    </div>
  );
}
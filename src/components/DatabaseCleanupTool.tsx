// ⚠️ COMPONENTE DE DEBUG ELIMINADO EN LIMPIEZA DE PRODUCCIÓN ⚠️
// Este componente de cleanup de database ha sido eliminado para el lanzamiento en producción.

import React from 'react';

export function DatabaseCleanupTool() {
  if (process.env.NODE_ENV === 'production') {
    return null;
  }
  
  return (
    <div className="text-center text-red-500 p-4">
      <p>Herramientas de cleanup no disponibles en producción</p>
    </div>
  );
}
// ⚠️ COMPONENTE DE MONITOREO ELIMINADO EN LIMPIEZA DE PRODUCCIÓN ⚠️
// Este componente de monitoreo de performance ha sido eliminado para el lanzamiento en producción.

import React from 'react';

export function KVPerformanceMonitor() {
  if (process.env.NODE_ENV === 'production') {
    return null;
  }
  
  return (
    <div className="text-center text-red-500 p-4">
      <p>Monitor de performance no disponible en producción</p>
    </div>
  );
}
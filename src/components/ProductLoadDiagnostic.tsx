// ⚠️ COMPONENTE DE DIAGNÓSTICO ELIMINADO EN LIMPIEZA DE PRODUCCIÓN ⚠️
// Este componente de diagnóstico de carga ha sido eliminado para el lanzamiento en producción.

import React from 'react';

export function ProductLoadDiagnostic() {
  if (process.env.NODE_ENV === 'production') {
    return null;
  }
  
  return (
    <div className="text-center text-red-500 p-4">
      <p>Diagnóstico de carga no disponible en producción</p>
    </div>
  );
}
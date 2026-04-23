// ⚠️ COMPONENTE DE DIAGNÓSTICO ELIMINADO EN LIMPIEZA DE PRODUCCIÓN ⚠️
// Este componente de diagnóstico ha sido eliminado para el lanzamiento en producción.

import React from 'react';

export function DatabaseDiagnosticTool() {
  if (process.env.NODE_ENV === 'production') {
    return null;
  }
  
  return (
    <div className="text-center text-red-500 p-4">
      <p>Herramientas de diagnóstico no disponibles en producción</p>
    </div>
  );
}
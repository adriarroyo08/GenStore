// ⚠️ COMPONENTE DE DIAGNÓSTICO ELIMINADO EN LIMPIEZA DE PRODUCCIÓN ⚠️
// Este componente de diagnóstico de imágenes ha sido eliminado para el lanzamiento en producción.

import React from 'react';

export function ProductImagesDiagnostic() {
  if (process.env.NODE_ENV === 'production') {
    return null;
  }
  
  return (
    <div className="text-center text-red-500 p-4">
      <p>Diagnóstico de imágenes no disponible en producción</p>
    </div>
  );
}
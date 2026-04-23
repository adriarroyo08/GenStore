// ⚠️ COMPONENTE DE DEBUG ELIMINADO EN LIMPIEZA DE PRODUCCIÓN ⚠️
// Este componente de quick fix ha sido eliminado para el lanzamiento en producción.

import React from 'react';

export function ImageQuickFix() {
  if (process.env.NODE_ENV === 'production') {
    return null;
  }
  
  return (
    <div className="text-center text-red-500 p-4">
      <p>Quick fix tools no disponibles en producción</p>
    </div>
  );
}
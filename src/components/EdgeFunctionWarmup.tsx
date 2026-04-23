// ⚠️ COMPONENTE DE WARMUP ELIMINADO EN LIMPIEZA DE PRODUCCIÓN ⚠️
// Este componente de warmup ha sido eliminado para el lanzamiento en producción.

import React from 'react';

export function EdgeFunctionWarmup() {
  if (process.env.NODE_ENV === 'production') {
    return null;
  }
  
  return (
    <div className="text-center text-red-500 p-4">
      <p>Warmup de funciones no disponible en producción</p>
    </div>
  );
}
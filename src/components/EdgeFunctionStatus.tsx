// ⚠️ COMPONENTE DE MONITOREO ELIMINADO EN LIMPIEZA DE PRODUCCIÓN ⚠️
// Este componente de status de edge functions ha sido eliminado para el lanzamiento en producción.

import React from 'react';

export function EdgeFunctionStatus() {
  if (process.env.NODE_ENV === 'production') {
    return null;
  }
  
  return (
    <div className="text-center text-red-500 p-4">
      <p>Status de edge functions no disponible en producción</p>
    </div>
  );
}
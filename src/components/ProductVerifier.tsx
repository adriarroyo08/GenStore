// ⚠️ COMPONENTE DE VERIFICACIÓN ELIMINADO EN LIMPIEZA DE PRODUCCIÓN ⚠️
// Este componente de verificación ha sido eliminado para el lanzamiento en producción.

import React from 'react';

export function ProductVerifier() {
  if (process.env.NODE_ENV === 'production') {
    return null;
  }
  
  return (
    <div className="text-center text-red-500 p-4">
      <p>Verificador de productos no disponible en producción</p>
    </div>
  );
}
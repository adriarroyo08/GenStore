// ⚠️ COMPONENTE DE TESTING ELIMINADO EN LIMPIEZA DE PRODUCCIÓN ⚠️
// Este componente de testing simple ha sido eliminado para el lanzamiento en producción.

import React from 'react';

export function SimpleServerTest() {
  if (process.env.NODE_ENV === 'production') {
    return null;
  }
  
  return (
    <div className="text-center text-red-500 p-4">
      <p>Testing simple no disponible en producción</p>
    </div>
  );
}
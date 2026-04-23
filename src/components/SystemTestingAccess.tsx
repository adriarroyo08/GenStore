// ⚠️ COMPONENTE DE ACCESO DE TESTING ELIMINADO EN LIMPIEZA DE PRODUCCIÓN ⚠️
// Este componente de acceso al sistema de testing ha sido eliminado para el lanzamiento en producción.

import React from 'react';

export function SystemTestingAccess() {
  if (process.env.NODE_ENV === 'production') {
    return null;
  }
  
  return (
    <div className="text-center text-red-500 p-4">
      <p>Acceso al sistema de testing no disponible en producción</p>
    </div>
  );
}
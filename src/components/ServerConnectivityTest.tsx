// ⚠️ COMPONENTE DE TESTING ELIMINADO EN LIMPIEZA DE PRODUCCIÓN ⚠️
// Este componente de testing de conectividad ha sido eliminado para el lanzamiento en producción.

import React from 'react';

export function ServerConnectivityTest() {
  if (process.env.NODE_ENV === 'production') {
    return null;
  }
  
  return (
    <div className="text-center text-red-500 p-4">
      <p>Test de conectividad no disponible en producción</p>
    </div>
  );
}
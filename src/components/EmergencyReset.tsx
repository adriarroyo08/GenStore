// ⚠️ COMPONENTE DE DEBUG ELIMINADO EN LIMPIEZA DE PRODUCCIÓN ⚠️
// Este componente de emergency reset ha sido eliminado para el lanzamiento en producción.
// Las funciones de reset deben ser manejadas de manera segura por administradores autenticados.

import React from 'react';

export function EmergencyReset() {
  if (process.env.NODE_ENV === 'production') {
    return null;
  }
  
  return (
    <div className="text-center text-red-500 p-4">
      <p>Funciones de emergency reset no disponibles en producción</p>
    </div>
  );
}
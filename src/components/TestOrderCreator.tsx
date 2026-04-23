// ⚠️ COMPONENTE DE TESTING ELIMINADO EN LIMPIEZA DE PRODUCCIÓN ⚠️
// Este componente de creación de órdenes de prueba ha sido eliminado para el lanzamiento en producción.

import React from 'react';

export function TestOrderCreator() {
  if (process.env.NODE_ENV === 'production') {
    return null;
  }
  
  return (
    <div className="text-center text-red-500 p-4">
      <p>Creador de órdenes de prueba no disponible en producción</p>
    </div>
  );
}
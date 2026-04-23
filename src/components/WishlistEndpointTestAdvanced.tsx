// ⚠️ COMPONENTE DE TESTING ELIMINADO EN LIMPIEZA DE PRODUCCIÓN ⚠️
// Este componente de testing avanzado de wishlist ha sido eliminado para el lanzamiento en producción.

import React from 'react';

export function WishlistEndpointTestAdvanced() {
  if (process.env.NODE_ENV === 'production') {
    return null;
  }
  
  return (
    <div className="text-center text-red-500 p-4">
      <p>Testing avanzado de wishlist no disponible en producción</p>
    </div>
  );
}
// ⚠️ COMPONENTE DE DEBUG ELIMINADO EN LIMPIEZA DE PRODUCCIÓN ⚠️
// Este componente de debug de traducciones ha sido eliminado para el lanzamiento en producción.

import React from 'react';

interface TranslationDebugPanelProps {
  isDevelopment?: boolean;
}

export function TranslationDebugPanel({ isDevelopment = false }: TranslationDebugPanelProps) {
  // Completely disabled in production
  if (process.env.NODE_ENV === 'production' || !isDevelopment) {
    return null;
  }
  
  return (
    <div className="text-center text-red-500 p-4">
      
    </div>
  );
}
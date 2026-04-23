// ⚠️ HOOK DE DEBUG ELIMINADO EN LIMPIEZA DE PRODUCCIÓN ⚠️
// Este hook de debugging de traducciones ha sido eliminado para el lanzamiento en producción.

/**
 * Hook for debugging translation coverage - DISABLED IN PRODUCTION
 */
export function useTranslationDebug() {
  // Return empty functions in production to prevent errors
  const noop = () => ({});
  const noopArray = () => [];
  const noopBoolean = () => true;
  
  if (process.env.NODE_ENV === 'production') {
    return {
      checkTranslationCoverage: noop,
      findUnusedKeys: noopArray,
      validateTranslationStructure: noopBoolean,
      getAllKeys: noopArray
    };
  }

  // In development, return disabled functions
  return {
    checkTranslationCoverage: () => {
      console.warn('🚫 Translation debug tools disabled for production readiness');
      return {};
    },
    findUnusedKeys: () => {
      console.warn('🚫 Translation debug tools disabled for production readiness');
      return [];
    },
    validateTranslationStructure: () => {
      console.warn('🚫 Translation debug tools disabled for production readiness');
      return true;
    },
    getAllKeys: () => {
      console.warn('🚫 Translation debug tools disabled for production readiness');
      return [];
    }
  };
}
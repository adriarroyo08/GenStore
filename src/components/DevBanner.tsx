export function DevBanner() {
  const isDev = import.meta.env.VITE_APP_ENV === 'development' || import.meta.env.DEV;
  if (!isDev) return null;

  return (
    <div className="fixed top-0 left-0 right-0 z-[60] bg-amber-500 text-amber-950 text-center py-1.5 text-sm font-semibold" role="status">
      ENTORNO DE PRUEBAS — Los pagos no son reales
    </div>
  );
}

import React from 'react';
import { Alert, AlertDescription } from './ui/alert';
import { WifiOff, AlertTriangle } from 'lucide-react';

export function OfflineMode() {
  return (
    <Alert variant="destructive" className="mb-4">
      <WifiOff className="h-4 w-4" />
      <AlertDescription>
        <div className="space-y-1">
          <div className="font-medium">Modo Sin Conexión</div>
          <div className="text-sm">
            El servidor no está disponible. La aplicación funciona con datos locales.
            Algunas funciones como el panel de administración pueden estar limitadas.
          </div>
        </div>
      </AlertDescription>
    </Alert>
  );
}
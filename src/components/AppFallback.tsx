import React from 'react';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { AlertTriangle, RefreshCw, Home, Settings } from 'lucide-react';

interface AppFallbackProps {
  error?: Error;
  resetError?: () => void;
}

export function AppFallback({ error, resetError }: AppFallbackProps) {
  const isServerError = error?.message?.includes('timeout') || 
                       error?.message?.includes('fetch') ||
                       error?.message?.includes('Network') ||
                       error?.message?.includes('Failed to fetch');

  const handleGoHome = () => {
    window.location.href = '/';
  };

  const handleGoToAdmin = () => {
    window.location.href = '/create-admin';
  };

  const handleRefresh = () => {
    window.location.reload();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-emerald-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 flex items-center justify-center p-4">
      <Card className="max-w-lg w-full">
        <CardHeader className="text-center">
          <div className="mx-auto w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mb-4">
            <AlertTriangle className="w-8 h-8 text-red-600 dark:text-red-400" />
          </div>
          <CardTitle className="text-2xl text-red-700 dark:text-red-300">
            {isServerError ? 'Problema de Conectividad' : 'Error de la Aplicación'}
          </CardTitle>
        </CardHeader>
        
        <CardContent className="space-y-6">
          {isServerError ? (
            <div className="space-y-4">
              <div className="text-center text-muted-foreground">
                <p>El servidor no está respondiendo en este momento.</p>
                <p className="text-sm mt-2">
                  La aplicación puede funcionar con datos locales, pero algunas funciones pueden estar limitadas.
                </p>
              </div>

              <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                <h3 className="font-semibold text-blue-900 dark:text-blue-100 mb-2">
                  💡 Sugerencias:
                </h3>
                <ul className="text-sm text-blue-800 dark:text-blue-200 space-y-1">
                  <li>• Verifica tu conexión a internet</li>
                  <li>• El servidor puede estar iniciándose</li>
                  <li>• Intenta refrescar la página en unos segundos</li>
                </ul>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="text-center text-muted-foreground">
                <p>La aplicación encontró un error inesperado.</p>
                <p className="text-sm mt-2">Por favor intenta refrescar la página.</p>
              </div>

              {process.env.NODE_ENV === 'development' && error && (
                <details className="text-left">
                  <summary className="cursor-pointer text-sm text-muted-foreground mb-2">
                    Detalles del Error (Desarrollo)
                  </summary>
                  <pre className="text-xs bg-muted p-3 rounded overflow-auto border">
                    {error.toString()}
                    {error.stack}
                  </pre>
                </details>
              )}
            </div>
          )}

          <div className="space-y-3">
            <Button
              onClick={handleRefresh}
              className="w-full"
              variant="default"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Refrescar Página
            </Button>
            
            <div className="grid grid-cols-2 gap-3">
              <Button
                onClick={handleGoHome}
                variant="outline"
                className="flex items-center justify-center gap-2"
              >
                <Home className="w-4 h-4" />
                Inicio
              </Button>
              
              <Button
                onClick={handleGoToAdmin}
                variant="outline"
                className="flex items-center justify-center gap-2"
              >
                <Settings className="w-4 h-4" />
                Admin
              </Button>
            </div>

            {resetError && (
              <Button
                onClick={resetError}
                variant="secondary"
                className="w-full"
              >
                Intentar de Nuevo
              </Button>
            )}
          </div>

          <div className="text-center">
            <p className="text-xs text-muted-foreground">
              Si el problema persiste, contacta al administrador del sistema.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
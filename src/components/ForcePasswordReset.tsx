import React, { useState } from 'react';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Alert, AlertDescription } from './ui/alert';
import { Loader2, RotateCcw, CheckCircle, AlertTriangle, Copy } from 'lucide-react';
import { apiClient } from '../lib/apiClient';

interface ForcePasswordResetProps {
  onSuccess?: () => void;
}

export function ForcePasswordReset({ onSuccess }: ForcePasswordResetProps) {
  const [isResetting, setIsResetting] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [copied, setCopied] = useState(false);

  const forcePasswordReset = async () => {
    setIsResetting(true);
    setResult(null);

    try {
      const data = await apiClient.post<any>('/admin/reset-admin-password', {});

      if (data.success) {
        setResult({
          success: true,
          message: data.message,
          credentials: data.credentials,
          user: data.user
        });
        
        if (onSuccess) {
          setTimeout(() => onSuccess(), 2000);
        }
      } else {
        setResult({
          success: false,
          message: data.error || 'Error al forzar el reset de contraseña'
        });
      }
    } catch (error: any) {
      console.error('Force password reset error:', error);
      setResult({
        success: false,
        message: `Error de conexión: ${error.message}`
      });
    } finally {
      setIsResetting(false);
    }
  };

  const copyCredentials = () => {
    if (result?.credentials) {
      const text = `Email: ${result.credentials.email}\nPassword: ${result.credentials.password}`;
      navigator.clipboard.writeText(text).then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      });
    }
  };

  return (
    <Card className="max-w-md w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <RotateCcw className="w-5 h-5 text-red-600" />
          Forzar Reset de Contraseña
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="text-sm text-muted-foreground">
          <p>Si el login sigue fallando, este botón fuerza el reset de la contraseña del usuario admin existente.</p>
        </div>

        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            ⚠️ Este proceso sobrescribe la contraseña actual del administrador.
          </AlertDescription>
        </Alert>

        {result && (
          <Alert variant={result.success ? "default" : "destructive"}>
            {result.success ? (
              <CheckCircle className="h-4 w-4" />
            ) : (
              <AlertTriangle className="h-4 w-4" />
            )}
            <AlertDescription className="space-y-2">
              <div>{result.message}</div>
              {result.success && result.credentials && (
                <div className="space-y-2">
                  <div className="font-mono text-xs bg-background p-2 rounded border">
                    <div>📧 Email: {result.credentials.email}</div>
                    <div>🔑 Password: {result.credentials.password}</div>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={copyCredentials}
                    className="text-xs"
                  >
                    <Copy className="w-3 h-3 mr-1" />
                    {copied ? 'Copiado!' : 'Copiar Credenciales'}
                  </Button>
                </div>
              )}
            </AlertDescription>
          </Alert>
        )}

        <Button
          onClick={forcePasswordReset}
          disabled={isResetting}
          variant="destructive"
          className="w-full"
        >
          {isResetting ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Forzando Reset...
            </>
          ) : (
            <>
              <RotateCcw className="w-4 h-4 mr-2" />
              Forzar Reset de Contraseña
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  );
}
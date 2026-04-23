import React from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';

interface ServerErrorFallbackProps {
  message?: string;
  onRetry?: () => void;
  showRetryButton?: boolean;
}

export function ServerErrorFallback({ 
  message, 
  onRetry, 
  showRetryButton = false 
}: ServerErrorFallbackProps) {
  const { t } = useLanguage();

  return (
    <div className="flex flex-col items-center justify-center p-6 text-center bg-muted/50 rounded-lg border border-border">
      <AlertTriangle className="w-8 h-8 text-muted-foreground mb-3" />
      <h3 className="font-medium mb-2">
        {message || t('errors.serverUnavailable') || 'Servicio temporalmente no disponible'}
      </h3>
      <p className="text-sm text-muted-foreground mb-4">
        {t('errors.workingWithLocalData') || 'Trabajando con datos locales disponibles'}
      </p>
      {showRetryButton && onRetry && (
        <button
          onClick={onRetry}
          className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
        >
          <RefreshCw className="w-4 h-4" />
          {t('common.retry') || 'Reintentar'}
        </button>
      )}
    </div>
  );
}
import React from 'react';

interface StagedLoadingScreenProps {
  stage: 'loading' | 'basic' | 'full';
  message?: string;
}

export function StagedLoadingScreen({ stage, message }: StagedLoadingScreenProps) {
  const getStageMessage = () => {
    switch (stage) {
      case 'loading':
        return message || 'Iniciando GenStore...';
      case 'basic':
        return 'Cargando componentes...';
      case 'full':
        return 'Finalizando carga...';
      default:
        return 'Cargando...';
    }
  };

  const getProgressPercentage = () => {
    switch (stage) {
      case 'loading':
        return 25;
      case 'basic':
        return 60;
      case 'full':
        return 90;
      default:
        return 0;
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background">
      <div className="text-center space-y-6">
        {/* Logo placeholder */}
        <div className="w-16 h-16 mx-auto mb-8 rounded-full bg-primary/10 flex items-center justify-center">
          <div className="w-8 h-8 rounded-full bg-primary animate-pulse"></div>
        </div>
        
        {/* Spinner */}
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary border-t-transparent mx-auto"></div>
        
        {/* Message */}
        <div className="space-y-2">
          <h2 className="text-xl font-medium text-foreground">{getStageMessage()}</h2>
          
          {/* Progress bar */}
          <div className="w-64 mx-auto">
            <div className="w-full bg-muted rounded-full h-2">
              <div 
                className="bg-primary h-2 rounded-full transition-all duration-500 ease-out"
                style={{ width: `${getProgressPercentage()}%` }}
              ></div>
            </div>
            <p className="text-sm text-muted-foreground mt-2">{getProgressPercentage()}%</p>
          </div>
        </div>
        
        {/* Tips */}
        <div className="text-sm text-muted-foreground max-w-md">
          {stage === 'loading' && <p>Inicializando la aplicación...</p>}
          {stage === 'basic' && <p>Preparando la interfaz de usuario...</p>}
          {stage === 'full' && <p>Casi listo para comenzar...</p>}
        </div>
      </div>
    </div>
  );
}
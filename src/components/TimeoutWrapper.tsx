import React, { useState, useEffect, useRef } from 'react';
import { SimpleLoadingScreen } from './SimpleLoadingScreen';

interface TimeoutWrapperProps {
  children: React.ReactNode;
  timeout?: number;
  fallbackMessage?: string;
}

export function TimeoutWrapper({ 
  children, 
  timeout = 10000, // 10 seconds default
  fallbackMessage = "La aplicación está tardando más de lo esperado..." 
}: TimeoutWrapperProps) {
  const [hasTimedOut, setHasTimedOut] = useState(false);
  const [isInitializing, setIsInitializing] = useState(true);
  const timeoutRef = useRef<NodeJS.Timeout>();
  const mountedRef = useRef(false);

  useEffect(() => {
    mountedRef.current = true;
    
    // Start timeout immediately
    timeoutRef.current = setTimeout(() => {
      if (mountedRef.current) {
        console.warn('⚠️ App initialization timeout after', timeout, 'ms');
        setHasTimedOut(true);
      }
    }, timeout);

    // Mark as ready after brief delay
    const readyTimeout = setTimeout(() => {
      if (mountedRef.current) {
        setIsInitializing(false);
        // Clear timeout once we're ready
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current);
        }
      }
    }, 500); // Shorter delay

    return () => {
      mountedRef.current = false;
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      clearTimeout(readyTimeout);
    };
  }, [timeout]);

  // Auto-clear timeout when children are rendered successfully
  useEffect(() => {
    if (!isInitializing && children && !hasTimedOut) {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    }
  }, [children, isInitializing, hasTimedOut]);

  if (hasTimedOut) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center p-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <h2 className="text-xl font-medium mb-2">Cargando GenStore</h2>
          <p className="text-muted-foreground mb-4">{fallbackMessage}</p>
          <button 
            onClick={() => window.location.reload()} 
            className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
          >
            Recargar página
          </button>
        </div>
      </div>
    );
  }

  if (isInitializing) {
    return <SimpleLoadingScreen message="Inicializando aplicación..." />;
  }

  return <>{children}</>;
}
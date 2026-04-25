import React from 'react';
import { GenStoreLogo } from './GenStoreLogo';

interface SimpleLoadingScreenProps {
  message?: string;
}

export function SimpleLoadingScreen({ message = 'Loading...' }: SimpleLoadingScreenProps) {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="text-center space-y-4">
        <div className="mx-auto flex items-center justify-center animate-pulse">
          <GenStoreLogo size={56} />
        </div>

        <div>
          <h2 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-blue-400 bg-clip-text text-transparent mb-2">
            GenStore
          </h2>
          <p className="text-muted-foreground">{message}</p>
        </div>
      </div>
    </div>
  );
}

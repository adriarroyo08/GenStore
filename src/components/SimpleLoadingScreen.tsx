import React from 'react';

interface SimpleLoadingScreenProps {
  message?: string;
}

export function SimpleLoadingScreen({ message = 'Loading...' }: SimpleLoadingScreenProps) {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="text-center space-y-4">
        <div className="mx-auto w-16 h-16 bg-emerald-100 dark:bg-emerald-900/30 rounded-full flex items-center justify-center">
          <div className="w-8 h-8 border-2 border-emerald-600 dark:border-emerald-400 border-t-transparent rounded-full animate-spin"></div>
        </div>
        
        <div>
          <h2 className="text-xl font-bold text-foreground mb-2">GenStore</h2>
          <p className="text-muted-foreground">{message}</p>
        </div>
      </div>
    </div>
  );
}
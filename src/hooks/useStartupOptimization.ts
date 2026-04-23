import { useState, useEffect } from 'react';

/**
 * Hook to optimize app startup by deferring non-critical operations
 */
export function useStartupOptimization() {
  const [isStartupComplete, setIsStartupComplete] = useState(false);
  const [canLoadSecondaryData, setCanLoadSecondaryData] = useState(false);

  useEffect(() => {
    // Mark startup as complete after minimal delay
    const startupTimeout = setTimeout(() => {
      setIsStartupComplete(true);
    }, 200);

    // Allow secondary data loading after longer delay
    const secondaryTimeout = setTimeout(() => {
      setCanLoadSecondaryData(true);
    }, 1000);

    return () => {
      clearTimeout(startupTimeout);
      clearTimeout(secondaryTimeout);
    };
  }, []);

  return {
    isStartupComplete,
    canLoadSecondaryData
  };
}
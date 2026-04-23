import { useState, useEffect } from 'react';
import { apiClient } from '../lib/apiClient';

export function useServerHealth() {
  const [isServerHealthy, setIsServerHealthy] = useState(true); // Assume healthy by default
  const [lastChecked, setLastChecked] = useState<Date | null>(null);

  const checkServerHealth = async () => {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => {
        controller.abort();
      }, 2000); // 2 second timeout

      const result = await apiClient.get<{ status: string }>('/health');

      clearTimeout(timeoutId);

      const healthy = result.status === 'ok';
      setIsServerHealthy(healthy);
      setLastChecked(new Date());

      if (healthy) {
        console.log('✅ Server health check passed');
      } else {
        console.log('⚠️ Server reports unhealthy status');
      }
    } catch (error: any) {
      if (error.name === 'AbortError') {
        console.log('⏰ Server health check timeout');
      } else {
        console.log('⚠️ Server health check error:', error.message);
      }
      setIsServerHealthy(false);
      setLastChecked(new Date());
    }
  };

  // Check server health on mount, but don't block app startup
  useEffect(() => {
    const timer = setTimeout(() => {
      checkServerHealth();
    }, 5000); // Check after 5 seconds to not block startup

    return () => clearTimeout(timer);
  }, []);

  return {
    isServerHealthy,
    lastChecked,
    checkServerHealth
  };
}
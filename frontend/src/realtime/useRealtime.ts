import { useEffect } from 'react';
import { useAuthStore } from '../stores/authStore';
import { realtimeClient } from './websocket';
import { useRealtimeStore } from '../stores/realtimeStore';

export const useRealtime = () => {
  const { isAuthenticated, token } = useAuthStore();
  const status = useRealtimeStore((state) => state.status);

  useEffect(() => {
    if (isAuthenticated && token) {
      realtimeClient.connect();
    } else {
      realtimeClient.disconnect();
    }

    return () => {
      // We don't disconnect on unmount of a single component,
      // this hook should be used at the AppShell level.
    };
  }, [isAuthenticated, token]);

  return {
    status
  };
};

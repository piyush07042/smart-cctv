import React, { useEffect, useState } from 'react';
import { CameraHealthHistoryResponse } from '../../types/camera';
import { camerasApi } from '../../api/cameras';
import { format } from 'date-fns';
import { Activity, AlertTriangle, CheckCircle, XCircle } from 'lucide-react';

interface Props {
  cameraId: string;
}

export const CameraHealthHistory: React.FC<Props> = ({ cameraId }) => {
  const [history, setHistory] = useState<CameraHealthHistoryResponse[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const data = await camerasApi.getHealthHistory(cameraId);
        setHistory(data);
      } catch (e) {
        console.error("Failed to load health history", e);
      } finally {
        setIsLoading(false);
      }
    };
    fetchHistory();
  }, [cameraId]);

  if (isLoading) {
    return <div className="p-4 text-sm text-green-600">Loading history...</div>;
  }

  if (history.length === 0) {
    return <div className="p-4 text-sm text-green-600">No health transitions recorded.</div>;
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'ONLINE': return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'DEGRADED': return <AlertTriangle className="w-4 h-4 text-yellow-500" />;
      case 'OFFLINE': return <XCircle className="w-4 h-4 text-red-500" />;
      default: return <Activity className="w-4 h-4 text-green-600" />;
    }
  };

  return (
    <div className="space-y-4">
      <h3 className="text-sm font-semibold text-green-800 flex items-center gap-2">
        <Activity className="w-4 h-4" />
        Health History
      </h3>
      <div className="space-y-3 relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-green-800 before:to-transparent">
        {history.map((event) => (
          <div key={event.id} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
            {/* Icon */}
            <div className="flex items-center justify-center w-10 h-10 rounded-full border border-green-200 bg-white shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 z-10">
              {getStatusIcon(event.status)}
            </div>
            {/* Card */}
            <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] bg-white border border-green-200 p-3 rounded shadow">
              <div className="flex justify-between items-center mb-1">
                <span className="font-bold text-green-900 text-sm">
                  {event.previous_status || 'UNKNOWN'} → {event.status}
                </span>
                <time className="text-xs text-green-600">{format(new Date(event.timestamp), 'MMM d, HH:mm:ss')}</time>
              </div>
              <div className="text-xs text-green-700">
                Source: {event.source || 'N/A'}
                {event.fps && ` • FPS: ${event.fps.toFixed(1)}`}
                {event.latency_ms && ` • Ping: ${event.latency_ms}ms`}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

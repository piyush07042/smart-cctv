import { apiClient } from './client';

export interface OverviewStats {
  cameras: {
    total: number;
    online: number;
    degraded: number;
    offline: number;
    disabled: number;
  };
  alerts: {
    active: number;
    by_severity: { critical: number; high: number; medium: number; low: number };
    by_status: Record<string, number>;
  };
  events: {
    last_hour: number;
    events_per_minute: number;
    last_24h_series: { bucket: string; count: number }[];
  };
  top_cameras: { camera_id: string; camera_name: string; event_count: number }[];
  generated_at: string;
}

export const getOverviewStats = async (): Promise<OverviewStats> => {
  const resp = await apiClient.get('/stats/overview');
  return resp.data;
};

import { apiClient } from './client';

export interface EntitySighting {
  id: string;
  timestamp: string;
  camera_id: string;
  camera_name: string;
  latitude: number | null;
  longitude: number | null;
  vehicle_number: string;
  vehicle_type: string | null;
  event_type: string;
  confidence: number;
}

export interface EntitySearchResponse {
  query: string;
  total: number;
  page: number;
  page_size: number;
  pages: number;
  sightings: EntitySighting[];
}

export interface VehicleTraceResponse {
  plate: string;
  from: string;
  to: string;
  total_sightings: number;
  route_note: string;
  sightings: Array<{
    seq: number;
    timestamp: string;
    event_id: string;
    camera_id: string;
    camera_name: string;
    latitude: number | null;
    longitude: number | null;
    confidence: number;
    event_type: string;
    vehicle_type: string | null;
    hop: {
      from_camera: string;
      elapsed_seconds: number;
      elapsed_minutes: number;
      distance_km: number | null;
      speed_kmh: number | null;
      implausible_speed: boolean;
      note: string | null;
    } | null;
  }>;
}

export const searchEntities = async (params: {
  q: string;
  page?: number;
  page_size?: number;
  from_ts?: string;
  to_ts?: string;
  camera_id?: string;
  event_type?: string;
}): Promise<EntitySearchResponse> => {
  const resp = await apiClient.get('/entities/search', { params });
  return resp.data;
};

export const getVehicleTrace = async (
  plate: string,
  params?: { from_ts?: string; to_ts?: string }
): Promise<VehicleTraceResponse> => {
  const resp = await apiClient.get(`/entities/vehicles/${plate}/trace`, { params });
  return resp.data;
};

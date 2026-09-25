export type CameraType = 'FIXED' | 'PTZ' | 'ANPR' | 'DASHCAM';
export type SourceProtocol = 'RTSP' | 'ONVIF' | 'HLS' | 'WEBRTC' | 'VENDOR_API' | 'FILE';
export type CameraStatus = 'ONLINE' | 'OFFLINE' | 'DEGRADED';

export interface Camera {
  id: string;
  camera_id: string;
  name: string;
  department: string | null;
  latitude: number | null;
  longitude: number | null;
  camera_type: CameraType | null;
  source_protocol: SourceProtocol | null;
  stream_endpoint_ref: string | null;
  has_credentials: boolean;
  status: CameraStatus;
  last_heartbeat: string | null;
  zone: string | null;
  storage_metadata: Record<string, any> | null;
  is_enabled: boolean;
  created_at: string;
  updated_at: string;
}

export interface PaginatedCameraResponse {
  items: Camera[];
  page: number;
  page_size: number;
  total: number;
  pages: number;
}

export interface CameraAuditEntry {
  id: string;
  camera_id: string;
  user_id: string | null;
  action: string;
  old_value: Record<string, any> | null;
  new_value: Record<string, any> | null;
  timestamp: string;
}

export interface CameraHealthHistoryResponse {
  id: string;
  camera_id: string;
  timestamp: string;
  status: CameraStatus;
  previous_status: CameraStatus | null;
  fps: number | null;
  bitrate: number | null;
  latency_ms: number | null;
  packet_loss: number | null;
  failure_count: number;
  source: string | null;
  created_at: string;
}

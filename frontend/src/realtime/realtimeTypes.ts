export interface RealtimeEnvelope {
  type: string;
  version: number;
  timestamp: string;
  payload: any;
}

export type ConnectionStatus = 'Connected' | 'Reconnecting' | 'Disconnected';

export interface CameraHealthPayload {
  camera_id: string;
  old: string;
  new: string;
  at: string;
}

export interface AlertRealtimePayload {
  alert_id: string;
  camera_id: string;
  matched_identifier: string;
  severity: string;
  status: string;
}

export interface EventRealtimePayload {
  event_id: string | null;
  internal_id: string;
  camera_id: string;
  timestamp: string;
  event_type: string;
  vehicle_number: string | null;
  vehicle_type: string | null;
  confidence: number | null;
}

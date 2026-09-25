export interface Alert {
  id: string;
  detection_id: string | null;
  watchlist_entry_id: string | null;
  camera_id: string | null;
  camera_name: string | null;
  latitude: number | null;
  longitude: number | null;
  matched_identifier: string | null;
  confidence: number | null;
  severity: string;
  status: 'new' | 'acknowledged' | 'resolved' | 'false_positive' | string;
  repeat_count: number;
  notes: string | null;
  created_at: string;
  acknowledged_by: string | null;
  acknowledged_at: string | null;
  resolved_by: string | null;
  resolved_at: string | null;
}

export interface AlertAction {
  id: string;
  alert_id: string;
  user_id: string | null;
  action: string;
  notes: string | null;
  timestamp: string;
}

export interface AlertListResponse {
  items: Alert[];
  page: number;
  page_size: number;
  total: number;
  pages: number;
}

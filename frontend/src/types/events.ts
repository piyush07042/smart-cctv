export interface Event {
  id: string;
  event_id: string | null;
  camera_id: string;
  timestamp: string;
  event_type: string;
  vehicle_number: string | null;
  vehicle_type: string | null;
  confidence: number | null;
  bounding_box: {
    x: number;
    y: number;
    width: number;
    height: number;
  } | null;
  image_ref: string | null;
  extra_metadata: Record<string, any> | null;
}

export interface EventListResponse {
  items: Event[];
  page: number;
  page_size: number;
  total: number;
  pages: number;
}

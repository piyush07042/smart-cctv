export interface WatchlistEntry {
  id: string;
  entity_type: string;
  identifier: string;
  category: string;
  severity: string | null;
  description: string | null;
  reference_case_no: string | null;
  added_by: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string | null;
  expires_at: string | null;
}

export interface WatchlistCreate {
  entity_type: string;
  identifier: string;
  category: string;
  severity?: string | null;
  description?: string | null;
  reference_case_no?: string | null;
  expires_at?: string | null;
}

export interface WatchlistUpdate {
  category?: string;
  severity?: string | null;
  description?: string | null;
  reference_case_no?: string | null;
  is_active?: boolean;
  expires_at?: string | null;
}

export interface WatchlistListResponse {
  items: WatchlistEntry[];
  page: number;
  page_size: number;
  total: number;
  pages: number;
}

export interface WatchlistImportResult {
  created: number;
  updated: number;
  skipped: number;
  errors: { row: number; error: string }[];
}

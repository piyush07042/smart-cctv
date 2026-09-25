import { apiClient } from './client';
import { Camera, PaginatedCameraResponse, CameraAuditEntry } from '../types/camera';

export interface CameraFilters {
  page?: number;
  page_size?: number;
  search?: string;
  status?: string;
  department?: string;
  zone?: string;
  source_protocol?: string;
  is_enabled?: boolean;
}

export const camerasApi = {
  list: async (filters: CameraFilters = {}): Promise<PaginatedCameraResponse> => {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        params.append(key, value.toString());
      }
    });
    const response = await apiClient.get<PaginatedCameraResponse>(`/cameras?${params.toString()}`);
    return response.data;
  },

  get: async (id: string): Promise<Camera> => {
    const response = await apiClient.get<Camera>(`/cameras/${id}`);
    return response.data;
  },

  create: async (data: any): Promise<Camera> => {
    const response = await apiClient.post<Camera>('/cameras', data);
    return response.data;
  },

  getPlayback: async (id: string): Promise<{ camera_id: string; protocol: string; playback_url: string; expires_at: string }> => {
    const response = await apiClient.get(`cameras/${id}/playback`);
    return response.data;
  },

  getHealthHistory: async (id: string): Promise<any[]> => {
    const response = await apiClient.get(`cameras/${id}/health`);
    return response.data;
  },

  update: async (id: string, data: any): Promise<Camera> => {
    const response = await apiClient.patch<Camera>(`/cameras/${id}`, data);
    return response.data;
  },

  enable: async (id: string): Promise<Camera> => {
    const response = await apiClient.post<Camera>(`/cameras/${id}/enable`);
    return response.data;
  },

  disable: async (id: string): Promise<Camera> => {
    const response = await apiClient.post<Camera>(`/cameras/${id}/disable`);
    return response.data;
  },

  getAudit: async (id: string): Promise<CameraAuditEntry[]> => {
    const response = await apiClient.get<CameraAuditEntry[]>(`/cameras/${id}/audit`);
    return response.data;
  },
};

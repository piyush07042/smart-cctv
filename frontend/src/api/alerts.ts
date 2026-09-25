import { apiClient } from './client';
import type { Alert, AlertListResponse, AlertAction } from '../types/alerts';

export const getAlerts = async (params?: any): Promise<AlertListResponse> => {
  const { data } = await apiClient.get<AlertListResponse>('/alerts', { params });
  return data;
};

export const getAlert = async (alertId: string): Promise<Alert> => {
  const { data } = await apiClient.get<Alert>(`/alerts/${alertId}`);
  return data;
};

export const acknowledgeAlert = async (alertId: string, notes?: string): Promise<Alert> => {
  const { data } = await apiClient.post<Alert>(`/alerts/${alertId}/acknowledge`, { notes });
  return data;
};

export const resolveAlert = async (alertId: string, notes?: string): Promise<Alert> => {
  const { data } = await apiClient.post<Alert>(`/alerts/${alertId}/resolve`, { notes });
  return data;
};

export const markFalsePositive = async (alertId: string, notes?: string): Promise<Alert> => {
  const { data } = await apiClient.post<Alert>(`/alerts/${alertId}/false-positive`, { notes });
  return data;
};

export const getAlertActions = async (alertId: string): Promise<AlertAction[]> => {
  const { data } = await apiClient.get<AlertAction[]>(`/alerts/${alertId}/actions`);
  return data;
};

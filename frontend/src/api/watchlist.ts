import { apiClient } from './client';
import type { WatchlistEntry, WatchlistListResponse, WatchlistCreate, WatchlistUpdate, WatchlistImportResult } from '../types/watchlist';

export const getWatchlist = async (params?: any): Promise<WatchlistListResponse> => {
  const { data } = await apiClient.get<WatchlistListResponse>('/watchlist', { params });
  return data;
};

export const getWatchlistEntry = async (id: string): Promise<WatchlistEntry> => {
  const { data } = await apiClient.get<WatchlistEntry>(`/watchlist/${id}`);
  return data;
};

export const createWatchlistEntry = async (entry: WatchlistCreate): Promise<WatchlistEntry> => {
  const { data } = await apiClient.post<WatchlistEntry>('/watchlist', entry);
  return data;
};

export const updateWatchlistEntry = async (id: string, updates: WatchlistUpdate): Promise<WatchlistEntry> => {
  const { data } = await apiClient.patch<WatchlistEntry>(`/watchlist/${id}`, updates);
  return data;
};

export const deactivateWatchlistEntry = async (id: string): Promise<WatchlistEntry> => {
  const { data } = await apiClient.delete<WatchlistEntry>(`/watchlist/${id}`);
  return data;
};

export const importWatchlistCsv = async (file: File): Promise<WatchlistImportResult> => {
  const formData = new FormData();
  formData.append('file', file);
  const { data } = await apiClient.post<WatchlistImportResult>('/watchlist/import', formData, {
    headers: {
      'Content-Type': 'multipart/form-data'
    }
  });
  return data;
};

import { apiClient } from './client';
import { User, AuthResponse } from '../types/auth';

export const authApi = {
  login: async (credentials: URLSearchParams): Promise<AuthResponse> => {
    const response = await apiClient.post<AuthResponse>('/auth/login', credentials, {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    });
    return response.data;
  },

  getMe: async (): Promise<User> => {
    const response = await apiClient.get<User>('/auth/me');
    return response.data;
  },
};

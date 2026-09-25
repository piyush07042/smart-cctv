import { apiClient } from './client';
import type { Event, EventListResponse } from '../types/events';

export const getEvents = async (params?: any): Promise<EventListResponse> => {
  const { data } = await apiClient.get<EventListResponse>('/events', { params });
  return data;
};

export const getEvent = async (eventId: string): Promise<Event> => {
  const { data } = await apiClient.get<Event>(`/events/${eventId}`);
  return data;
};

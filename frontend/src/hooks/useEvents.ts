import { useState, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getEvents } from '../api/events';

export interface EventFilters {
  page: number;
  page_size: number;
  camera_id?: string;
  event_type?: string;
  vehicle_number?: string;
  from_ts?: string;
  to_ts?: string;
  min_confidence?: number;
}

export const useEvents = (initialFilters: EventFilters) => {
  const [filters, setFilters] = useState<EventFilters>(initialFilters);

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['events', filters],
    queryFn: () => getEvents(filters),
  });

  const updateFilters = useCallback((newFilters: Partial<EventFilters>) => {
    setFilters((prev) => ({ ...prev, ...newFilters }));
  }, []);

  return {
    events: data?.items || [],
    pagination: data ? { page: data.page, page_size: data.page_size, total: data.total, pages: data.pages } : null,
    isLoading,
    error,
    filters,
    updateFilters,
    refetch,
  };
};

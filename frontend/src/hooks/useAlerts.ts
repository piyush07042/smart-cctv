import { useState, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  getAlerts,
  getAlertActions,
  acknowledgeAlert,
  resolveAlert,
  markFalsePositive
} from '../api/alerts';

export interface AlertFilters {
  page: number;
  page_size: number;
  status?: string;
  severity?: string;
  camera_id?: string;
  matched_identifier?: string;
  from_ts?: string;
  to_ts?: string;
}

export const useAlerts = (initialFilters: AlertFilters) => {
  const [filters, setFilters] = useState<AlertFilters>(initialFilters);
  const queryClient = useQueryClient();

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['alerts', filters],
    queryFn: () => getAlerts(filters),
  });

  const updateFilters = useCallback((newFilters: Partial<AlertFilters>) => {
    setFilters((prev) => ({ ...prev, ...newFilters }));
  }, []);

  const acknowledgeMutation = useMutation({
    mutationFn: ({ id, notes }: { id: string, notes?: string }) => acknowledgeAlert(id, notes),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['alerts'] }),
  });

  const resolveMutation = useMutation({
    mutationFn: ({ id, notes }: { id: string, notes?: string }) => resolveAlert(id, notes),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['alerts'] }),
  });

  const fpMutation = useMutation({
    mutationFn: ({ id, notes }: { id: string, notes?: string }) => markFalsePositive(id, notes),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['alerts'] }),
  });

  return {
    alerts: data?.items || [],
    pagination: data ? { page: data.page, page_size: data.page_size, total: data.total, pages: data.pages } : null,
    isLoading,
    error,
    filters,
    updateFilters,
    refetch,
    acknowledge: acknowledgeMutation.mutateAsync,
    resolve: resolveMutation.mutateAsync,
    markFP: fpMutation.mutateAsync,
  };
};

export const useAlertActions = (alertId?: string) => {
  return useQuery({
    queryKey: ['alertActions', alertId],
    queryFn: () => alertId ? getAlertActions(alertId) : Promise.resolve([]),
    enabled: !!alertId,
  });
};

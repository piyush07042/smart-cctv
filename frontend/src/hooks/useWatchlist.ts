import { useState, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  getWatchlist, 
  createWatchlistEntry, 
  updateWatchlistEntry, 
  deactivateWatchlistEntry,
  importWatchlistCsv
} from '../api/watchlist';
import { WatchlistCreate, WatchlistUpdate } from '../types/watchlist';

export interface WatchlistFilters {
  page: number;
  page_size: number;
  search?: string;
  entity_type?: string;
  category?: string;
  severity?: string;
  is_active?: boolean;
}

export const useWatchlist = (initialFilters: WatchlistFilters) => {
  const [filters, setFilters] = useState<WatchlistFilters>(initialFilters);
  const queryClient = useQueryClient();

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['watchlist', filters],
    queryFn: () => getWatchlist(filters),
  });

  const updateFilters = useCallback((newFilters: Partial<WatchlistFilters>) => {
    setFilters((prev) => ({ ...prev, ...newFilters }));
  }, []);

  const createMutation = useMutation({
    mutationFn: (entry: WatchlistCreate) => createWatchlistEntry(entry),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['watchlist'] });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: WatchlistUpdate }) => updateWatchlistEntry(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['watchlist'] });
    },
  });

  const deactivateMutation = useMutation({
    mutationFn: (id: string) => deactivateWatchlistEntry(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['watchlist'] });
    },
  });

  const importCsvMutation = useMutation({
    mutationFn: (file: File) => importWatchlistCsv(file),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['watchlist'] });
    },
  });

  return {
    watchlist: data?.items || [],
    pagination: data ? { page: data.page, page_size: data.page_size, total: data.total, pages: data.pages } : null,
    isLoading,
    error,
    filters,
    updateFilters,
    refetch,
    createEntry: createMutation.mutateAsync,
    updateEntry: updateMutation.mutateAsync,
    deactivateEntry: deactivateMutation.mutateAsync,
    importCsv: importCsvMutation.mutateAsync,
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
    isDeactivating: deactivateMutation.isPending,
    isImporting: importCsvMutation.isPending,
  };
};

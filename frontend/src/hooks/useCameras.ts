import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { camerasApi, CameraFilters } from '../api/cameras';

export const useCameras = (filters: CameraFilters) => {
  const queryClient = useQueryClient();

  const {
    data: paginatedData,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ['cameras', filters],
    queryFn: () => camerasApi.list(filters),
    placeholderData: (previousData) => previousData, // keep previous data while fetching new page
  });

  const createMutation = useMutation({
    mutationFn: camerasApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cameras'] });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => camerasApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cameras'] });
    },
  });

  const enableMutation = useMutation({
    mutationFn: camerasApi.enable,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['cameras'] });
      queryClient.invalidateQueries({ queryKey: ['camera-audit', data.id] });
    },
  });

  const disableMutation = useMutation({
    mutationFn: camerasApi.disable,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['cameras'] });
      queryClient.invalidateQueries({ queryKey: ['camera-audit', data.id] });
    },
  });

  return {
    cameras: paginatedData?.items || [],
    pagination: paginatedData ? {
      page: paginatedData.page,
      page_size: paginatedData.page_size,
      total: paginatedData.total,
      pages: paginatedData.pages,
    } : null,
    isLoading,
    error,
    refetch,
    createCamera: createMutation.mutateAsync,
    isCreating: createMutation.isPending,
    updateCamera: updateMutation.mutateAsync,
    isUpdating: updateMutation.isPending,
    enableCamera: enableMutation.mutateAsync,
    disableCamera: disableMutation.mutateAsync,
  };
};

import React, { useState } from 'react';
import { useCameras } from '../hooks/useCameras';
import { CameraFilters } from '../components/cameras/CameraFilters';
import { CameraTable } from '../components/cameras/CameraTable';
import { CameraForm } from '../components/cameras/CameraForm';
import { CameraAuditDrawer } from '../components/cameras/CameraAuditDrawer';
import { CameraFilters as FilterType } from '../api/cameras';
import { Camera } from '../types/camera';
import { Plus, RefreshCw } from 'lucide-react';
import { useAuthStore } from '../stores/authStore';
import { useRealtimeStore } from '../stores/realtimeStore';

export const CamerasPage: React.FC = () => {
  const { user } = useAuthStore();
  const isAdmin = user?.role === 'ADMIN';

  const [filters, setFilters] = useState<FilterType>({ page: 1, page_size: 10 });
  const [showForm, setShowForm] = useState(false);
  const [editingCamera, setEditingCamera] = useState<Camera | null>(null);
  const [auditCameraId, setAuditCameraId] = useState<string | null>(null);
  
  const [confirmStatusToggle, setConfirmStatusToggle] = useState<Camera | null>(null);

  const { 
    cameras, 
    pagination, 
    isLoading, 
    error, 
    refetch,
    createCamera,
    isCreating,
    updateCamera,
    isUpdating,
    enableCamera,
    disableCamera
  } = useCameras(filters);

  const handleFilterChange = (newFilters: Partial<FilterType>) => {
    setFilters(prev => ({ ...prev, ...newFilters, page: 1 }));
  };

  const handlePageChange = (newPage: number) => {
    setFilters(prev => ({ ...prev, page: newPage }));
  };

  const { cameraHealth } = useRealtimeStore();

  const displayCameras = React.useMemo(() => {
    return cameras.map(c => {
      const health = cameraHealth[c.camera_id];
      if (health) {
        return { ...c, status: health.new as any, last_heartbeat: health.at };
      }
      return c;
    });
  }, [cameras, cameraHealth]);

  const handleFormSubmit = async (data: any) => {
    if (editingCamera) {
      await updateCamera({ id: editingCamera.id, data });
    } else {
      await createCamera(data);
    }
    setShowForm(false);
    setEditingCamera(null);
  };

  const handleStatusToggle = async () => {
    if (!confirmStatusToggle) return;
    try {
      if (confirmStatusToggle.is_enabled) {
        await disableCamera(confirmStatusToggle.id);
      } else {
        await enableCamera(confirmStatusToggle.id);
      }
    } finally {
      setConfirmStatusToggle(null);
    }
  };

  return (
    <div className="p-6 h-full flex flex-col min-h-0">
      <div className="flex items-center justify-between mb-6 shrink-0">
        <div>
          <h1 className="text-2xl font-bold text-white">Camera Registry</h1>
          <p className="text-gray-400 mt-1">Manage and monitor all CCTV devices</p>
        </div>
        
        <div className="flex gap-3">
          <button 
            onClick={() => refetch()} 
            className="flex items-center gap-2 px-3 py-2 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-md transition-colors"
            title="Refresh"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
          
          {isAdmin && (
            <button
              onClick={() => setShowForm(true)}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-md transition-colors shadow-lg shadow-blue-900/20"
            >
              <Plus className="w-5 h-5" />
              Add Camera
            </button>
          )}
        </div>
      </div>

      <div className="shrink-0">
        <CameraFilters filters={filters} onChange={handleFilterChange} />
      </div>

      <div className="flex-1 overflow-auto min-h-0 relative">
        {error ? (
          <div className="p-6 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400">
            <h3 className="text-lg font-medium mb-1">Failed to load cameras</h3>
            <p>Please check your connection or try again later.</p>
            <button onClick={() => refetch()} className="mt-4 px-4 py-2 bg-gray-800 rounded hover:bg-gray-700 text-gray-300">Retry</button>
          </div>
        ) : (
          <div className="h-full flex flex-col">
            <CameraTable 
              cameras={displayCameras} 
              onEdit={(cam) => { setEditingCamera(cam); setShowForm(true); }}
              onToggleStatus={setConfirmStatusToggle}
              onViewAudit={(cam) => setAuditCameraId(cam.id)}
            />
            
            {/* Pagination Controls */}
            {pagination && pagination.pages > 1 && (
              <div className="flex items-center justify-between px-4 py-3 bg-gray-900 border-t border-gray-800 shrink-0 mt-auto rounded-b-lg">
                <div className="text-sm text-gray-400">
                  Showing <span className="font-medium text-white">{((pagination.page - 1) * pagination.page_size) + 1}</span> to <span className="font-medium text-white">{Math.min(pagination.page * pagination.page_size, pagination.total)}</span> of <span className="font-medium text-white">{pagination.total}</span> results
                </div>
                <div className="flex items-center gap-2">
                  <button
                    disabled={pagination.page <= 1}
                    onClick={() => handlePageChange(pagination.page - 1)}
                    className="px-3 py-1 bg-gray-800 text-gray-300 rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-700"
                  >
                    Previous
                  </button>
                  <span className="text-sm text-gray-400 mx-2">
                    Page {pagination.page} of {pagination.pages}
                  </span>
                  <button
                    disabled={pagination.page >= pagination.pages}
                    onClick={() => handlePageChange(pagination.page + 1)}
                    className="px-3 py-1 bg-gray-800 text-gray-300 rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-700"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Forms & Modals */}
      {showForm && (
        <CameraForm
          initialData={editingCamera}
          onSubmit={handleFormSubmit}
          onCancel={() => { setShowForm(false); setEditingCamera(null); }}
          isLoading={isCreating || isUpdating}
        />
      )}

      {auditCameraId && (
        <CameraAuditDrawer 
          cameraId={auditCameraId} 
          onClose={() => setAuditCameraId(null)} 
        />
      )}

      {confirmStatusToggle && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-gray-900 border border-gray-800 rounded-xl shadow-2xl w-full max-w-md p-6">
            <h2 className="text-xl font-bold text-white mb-2">Confirm Action</h2>
            <p className="text-gray-400 mb-6">
              Are you sure you want to <strong>{confirmStatusToggle.is_enabled ? 'disable' : 'enable'}</strong> camera <span className="text-white font-mono">{confirmStatusToggle.camera_id}</span> ({confirmStatusToggle.name})?
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setConfirmStatusToggle(null)}
                className="px-4 py-2 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-md transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleStatusToggle}
                className={`px-4 py-2 text-white rounded-md transition-colors ${
                  confirmStatusToggle.is_enabled 
                    ? 'bg-red-600 hover:bg-red-700' 
                    : 'bg-green-600 hover:bg-green-700'
                }`}
              >
                {confirmStatusToggle.is_enabled ? 'Disable' : 'Enable'} Camera
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

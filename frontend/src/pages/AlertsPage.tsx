import React, { useState, useEffect } from 'react';
import { useAlerts } from '../hooks/useAlerts';
import { AlertFiltersBar } from '../components/alerts/AlertFiltersBar';
import { AlertTable } from '../components/alerts/AlertTable';
import { AlertDetailDrawer } from '../components/alerts/AlertDetailDrawer';
import { RefreshCw } from 'lucide-react';
import { Alert } from '../types/alerts';
import { useRealtimeStore } from '../stores/realtimeStore';

export const AlertsPage: React.FC = () => {
  const { 
    alerts, 
    pagination, 
    isLoading, 
    error, 
    filters, 
    updateFilters, 
    refetch,
    acknowledge,
    resolve,
    markFP
  } = useAlerts({ page: 1, page_size: 20 });

  const liveAlerts = useRealtimeStore(state => state.liveAlerts);
  const [selectedEvent, setSelectedAlert] = useState<Alert | null>(null);

  // Merge live alerts updates
  const displayAlerts = React.useMemo(() => {
    // 1. Update existing alerts
    let combined = alerts.map(a => {
      const live = liveAlerts[a.id];
      if (live) {
        return { ...a, status: live.status, severity: live.severity };
      }
      return a;
    });

    // 2. Prepend new live alerts if on page 1
    if (filters.page === 1) {
      const existingIds = new Set(combined.map(a => a.id));
      const newLiveAlerts = Object.values(liveAlerts)
        .filter(la => !existingIds.has(la.alert_id))
        .filter(la => {
          if (filters.status && la.status !== filters.status) return false;
          if (filters.severity && la.severity !== filters.severity) return false;
          if (filters.camera_id && la.camera_id !== filters.camera_id) return false;
          if (filters.matched_identifier && la.matched_identifier !== filters.matched_identifier) return false;
          return true;
        })
        .map(la => ({
          id: la.alert_id,
          detection_id: null,
          watchlist_entry_id: null,
          camera_id: la.camera_id,
          camera_name: null,
          latitude: null,
          longitude: null,
          matched_identifier: la.matched_identifier,
          confidence: null,
          severity: la.severity,
          status: la.status,
          repeat_count: 0,
          notes: null,
          created_at: new Date().toISOString(),
          acknowledged_by: null,
          acknowledged_at: null,
          resolved_by: null,
          resolved_at: null,
        } as Alert));
      
      combined = [...newLiveAlerts, ...combined];
    }
    return combined;
  }, [alerts, liveAlerts, filters]);

  // If the selected alert updates via refetch or live update, update the drawer
  useEffect(() => {
    if (selectedEvent) {
      const updated = displayAlerts.find(a => a.id === selectedEvent.id);
      if (updated && updated.status !== selectedEvent.status) {
        setSelectedAlert(updated);
      }
    }
  }, [displayAlerts]);

  const handlePageChange = (newPage: number) => {
    updateFilters({ page: newPage });
  };

  return (
    <div className="p-6 h-full flex flex-col min-h-0">
      <div className="flex items-center justify-between mb-6 shrink-0">
        <div>
          <h1 className="text-2xl font-bold text-white">Active Alerts</h1>
          <p className="text-gray-400 mt-1">Review and manage watchlist detections</p>
        </div>
        
        <button 
          onClick={() => refetch()} 
          className="flex items-center gap-2 px-3 py-2 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-md transition-colors"
        >
          <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      <div className="shrink-0">
        <AlertFiltersBar filters={filters} onChange={updateFilters} />
      </div>

      <div className="flex-1 overflow-auto min-h-0 relative">
        {error ? (
          <div className="p-6 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400">
            <h3 className="text-lg font-medium mb-1">Failed to load alerts</h3>
            <p>Please check your connection or try again later.</p>
          </div>
        ) : (
          <div className="h-full flex flex-col">
            <AlertTable 
              alerts={displayAlerts} 
              onViewDetails={setSelectedAlert}
            />
            
            {pagination && pagination.pages > 1 && (
              <div className="flex items-center justify-between px-4 py-3 bg-gray-900 border border-t-0 border-gray-800 shrink-0 mt-auto rounded-b-lg">
                <div className="text-sm text-gray-400">
                  Showing <span className="font-medium text-white">{((pagination.page - 1) * pagination.page_size) + 1}</span> to <span className="font-medium text-white">{Math.min(pagination.page * pagination.page_size, pagination.total)}</span> of <span className="font-medium text-white">{pagination.total}</span> results
                </div>
                <div className="flex items-center gap-2">
                  <button
                    disabled={pagination.page <= 1}
                    onClick={() => handlePageChange(pagination.page - 1)}
                    className="px-3 py-1 bg-gray-800 text-gray-300 rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-700 text-sm"
                  >
                    Previous
                  </button>
                  <span className="text-sm text-gray-400 mx-2">
                    Page {pagination.page} of {pagination.pages}
                  </span>
                  <button
                    disabled={pagination.page >= pagination.pages}
                    onClick={() => handlePageChange(pagination.page + 1)}
                    className="px-3 py-1 bg-gray-800 text-gray-300 rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-700 text-sm"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      <AlertDetailDrawer 
        alert={selectedEvent} 
        onClose={() => setSelectedAlert(null)} 
        onAcknowledge={async (id, notes) => { await acknowledge({ id, notes }); }}
        onResolve={async (id, notes) => { await resolve({ id, notes }); }}
        onFalsePositive={async (id, notes) => { await markFP({ id, notes }); }}
      />
    </div>
  );
};

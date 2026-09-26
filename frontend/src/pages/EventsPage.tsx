import React, { useState } from 'react';
import { useEvents } from '../hooks/useEvents';
import { EventFiltersBar } from '../components/events/EventFiltersBar';
import { EventTable } from '../components/events/EventTable';
import { EventDetailDrawer } from '../components/events/EventDetailDrawer';
import { RefreshCw } from 'lucide-react';
import { Event } from '../types/events';
import { useRealtimeStore } from '../stores/realtimeStore';

export const EventsPage: React.FC = () => {
  const { 
    events, 
    pagination, 
    isLoading, 
    error, 
    filters, 
    updateFilters, 
    refetch 
  } = useEvents({ page: 1, page_size: 20 });

  const liveEvents = useRealtimeStore((state) => state.liveEvents);
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);

  const handlePageChange = (newPage: number) => {
    updateFilters({ page: newPage });
  };

  // Merge live events
  const displayEvents = React.useMemo(() => {
    let combined = [...events];
    if (filters.page === 1) {
      const filteredLive = liveEvents.filter(le => {
        if (filters.camera_id && le.camera_id !== filters.camera_id) return false;
        if (filters.event_type && le.event_type !== filters.event_type) return false;
        if (filters.vehicle_number && le.vehicle_number !== filters.vehicle_number) return false;
        if (filters.min_confidence && (le.confidence || 0) < filters.min_confidence) return false;
        return true;
      });

      // Avoid duplicates
      const existingIds = new Set(combined.map(e => e.id));
      const newItems = filteredLive
        .filter(le => !existingIds.has(le.internal_id))
        .map(le => ({
          id: le.internal_id,
          event_id: le.event_id,
          camera_id: le.camera_id,
          timestamp: le.timestamp,
          event_type: le.event_type,
          vehicle_number: le.vehicle_number,
          vehicle_type: le.vehicle_type,
          confidence: le.confidence,
          bounding_box: null,
          image_ref: null,
          extra_metadata: null
        } as Event));

      combined = [...newItems, ...combined];
    }
    return combined;
  }, [events, liveEvents, filters]);

  return (
    <div className="p-6 h-full flex flex-col min-h-0">
      <div className="flex items-center justify-between mb-6 shrink-0">
        <div>
          <h1 className="text-2xl font-bold text-green-900">Analytics Events</h1>
          <p className="text-green-700 mt-1">Raw detection logs from edge devices</p>
        </div>
        
        <button 
          onClick={() => refetch()} 
          className="flex items-center gap-2 px-3 py-2 bg-green-100 hover:bg-green-700 text-green-800 rounded-md transition-colors"
        >
          <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      <div className="shrink-0">
        <EventFiltersBar filters={filters} onChange={updateFilters} />
      </div>

      <div className="flex-1 overflow-auto min-h-0 relative">
        {error ? (
          <div className="p-6 bg-red-100 border border-red-300 rounded-lg text-red-700">
            <h3 className="text-lg font-medium mb-1">Failed to load events</h3>
            <p>Please check your connection or try again later.</p>
          </div>
        ) : (
          <div className="h-full flex flex-col">
            <EventTable 
              events={displayEvents} 
              onViewDetails={setSelectedEvent}
            />
            
            {pagination && pagination.pages > 1 && (
              <div className="flex items-center justify-between px-4 py-3 bg-white border border-t-0 border-green-200 shrink-0 mt-auto rounded-b-lg">
                <div className="text-sm text-green-700">
                  Showing <span className="font-medium text-green-900">{((pagination.page - 1) * pagination.page_size) + 1}</span> to <span className="font-medium text-green-900">{Math.min(pagination.page * pagination.page_size, pagination.total)}</span> of <span className="font-medium text-green-900">{pagination.total}</span> results
                </div>
                <div className="flex items-center gap-2">
                  <button
                    disabled={pagination.page <= 1}
                    onClick={() => handlePageChange(pagination.page - 1)}
                    className="px-3 py-1 bg-green-100 text-green-800 rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-green-700 text-sm"
                  >
                    Previous
                  </button>
                  <span className="text-sm text-green-700 mx-2">
                    Page {pagination.page} of {pagination.pages}
                  </span>
                  <button
                    disabled={pagination.page >= pagination.pages}
                    onClick={() => handlePageChange(pagination.page + 1)}
                    className="px-3 py-1 bg-green-100 text-green-800 rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-green-700 text-sm"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      <EventDetailDrawer 
        event={selectedEvent} 
        onClose={() => setSelectedEvent(null)} 
      />
    </div>
  );
};

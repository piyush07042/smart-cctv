import React from 'react';
import { EventFilters } from '../../hooks/useEvents';
import { Search } from 'lucide-react';

interface Props {
  filters: EventFilters;
  onChange: (filters: Partial<EventFilters>) => void;
}

export const EventFiltersBar: React.FC<Props> = ({ filters, onChange }) => {
  return (
    <div className="bg-white border border-green-200 rounded-t-lg p-4 flex flex-wrap gap-4 items-end">
      <div className="flex-1 min-w-[200px]">
        <label className="block text-xs font-medium text-green-700 mb-1">Camera ID</label>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-green-600" />
          <input
            type="text"
            className="w-full bg-green-100 border border-green-300 rounded-md py-1.5 pl-9 pr-3 text-sm text-green-900 focus:outline-none focus:border-green-500 transition-colors"
            placeholder="e.g. CAM-001"
            value={filters.camera_id || ''}
            onChange={(e) => onChange({ camera_id: e.target.value })}
          />
        </div>
      </div>
      
      <div className="w-40">
        <label className="block text-xs font-medium text-green-700 mb-1">Event Type</label>
        <select
          className="w-full bg-green-100 border border-green-300 rounded-md py-1.5 px-3 text-sm text-green-900 focus:outline-none focus:border-green-500 transition-colors"
          value={filters.event_type || ''}
          onChange={(e) => onChange({ event_type: e.target.value })}
        >
          <option value="">All Types</option>
          <option value="anpr">ANPR</option>
          <option value="person">Person</option>
        </select>
      </div>

      <div className="flex-1 min-w-[200px]">
        <label className="block text-xs font-medium text-green-700 mb-1">Vehicle Number</label>
        <input
          type="text"
          className="w-full bg-green-100 border border-green-300 rounded-md py-1.5 px-3 text-sm text-green-900 focus:outline-none focus:border-green-500 transition-colors"
          placeholder="e.g. GJ01XX0001"
          value={filters.vehicle_number || ''}
          onChange={(e) => onChange({ vehicle_number: e.target.value })}
        />
      </div>

      <div className="w-40">
        <label className="block text-xs font-medium text-green-700 mb-1">Min Confidence</label>
        <input
          type="number"
          step="0.01"
          min="0"
          max="1"
          className="w-full bg-green-100 border border-green-300 rounded-md py-1.5 px-3 text-sm text-green-900 focus:outline-none focus:border-green-500 transition-colors"
          placeholder="0.80"
          value={filters.min_confidence || ''}
          onChange={(e) => onChange({ min_confidence: e.target.value ? parseFloat(e.target.value) : undefined })}
        />
      </div>
      
      <button 
        onClick={() => onChange({ camera_id: '', event_type: '', vehicle_number: '', from_ts: '', to_ts: '', min_confidence: undefined, page: 1 })}
        className="px-4 py-1.5 bg-green-100 hover:bg-green-700 text-green-800 rounded-md transition-colors text-sm font-medium"
      >
        Clear
      </button>
    </div>
  );
};

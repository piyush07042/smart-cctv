import React from 'react';
import { AlertFilters } from '../../hooks/useAlerts';
import { Search } from 'lucide-react';

interface Props {
  filters: AlertFilters;
  onChange: (filters: Partial<AlertFilters>) => void;
}

export const AlertFiltersBar: React.FC<Props> = ({ filters, onChange }) => {
  return (
    <div className="bg-white border border-green-200 rounded-t-lg p-4 flex flex-wrap gap-4 items-end">
      <div className="w-40">
        <label className="block text-xs font-medium text-green-700 mb-1">Status</label>
        <select
          className="w-full bg-green-100 border border-green-300 rounded-md py-1.5 px-3 text-sm text-green-900 focus:outline-none focus:border-green-500 transition-colors"
          value={filters.status || ''}
          onChange={(e) => onChange({ status: e.target.value })}
        >
          <option value="">All Statuses</option>
          <option value="new">New</option>
          <option value="acknowledged">Acknowledged</option>
          <option value="resolved">Resolved</option>
          <option value="false_positive">False Positive</option>
        </select>
      </div>

      <div className="w-40">
        <label className="block text-xs font-medium text-green-700 mb-1">Severity</label>
        <select
          className="w-full bg-green-100 border border-green-300 rounded-md py-1.5 px-3 text-sm text-green-900 focus:outline-none focus:border-green-500 transition-colors"
          value={filters.severity || ''}
          onChange={(e) => onChange({ severity: e.target.value })}
        >
          <option value="">All Severities</option>
          <option value="critical">Critical</option>
          <option value="high">High</option>
          <option value="medium">Medium</option>
          <option value="low">Low</option>
        </select>
      </div>

      <div className="flex-1 min-w-[150px]">
        <label className="block text-xs font-medium text-green-700 mb-1">Matched ID</label>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-green-600" />
          <input
            type="text"
            className="w-full bg-green-100 border border-green-300 rounded-md py-1.5 pl-9 pr-3 text-sm text-green-900 focus:outline-none focus:border-green-500 transition-colors"
            placeholder="e.g. GJ01XX0001"
            value={filters.matched_identifier || ''}
            onChange={(e) => onChange({ matched_identifier: e.target.value })}
          />
        </div>
      </div>
      
      <div className="flex-1 min-w-[150px]">
        <label className="block text-xs font-medium text-green-700 mb-1">Camera ID</label>
        <input
          type="text"
          className="w-full bg-green-100 border border-green-300 rounded-md py-1.5 px-3 text-sm text-green-900 focus:outline-none focus:border-green-500 transition-colors"
          placeholder="e.g. CAM-001"
          value={filters.camera_id || ''}
          onChange={(e) => onChange({ camera_id: e.target.value })}
        />
      </div>
      
      <button 
        onClick={() => onChange({ status: '', severity: '', matched_identifier: '', camera_id: '', from_ts: '', to_ts: '', page: 1 })}
        className="px-4 py-1.5 bg-green-100 hover:bg-green-700 text-green-800 rounded-md transition-colors text-sm font-medium"
      >
        Clear
      </button>
    </div>
  );
};

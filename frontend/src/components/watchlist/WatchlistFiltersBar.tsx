import React from 'react';
import { WatchlistFilters } from '../../hooks/useWatchlist';
import { Search } from 'lucide-react';

interface Props {
  filters: WatchlistFilters;
  onChange: (filters: Partial<WatchlistFilters>) => void;
}

export const WatchlistFiltersBar: React.FC<Props> = ({ filters, onChange }) => {
  return (
    <div className="bg-gray-900 border border-gray-800 rounded-t-lg p-4 flex flex-wrap gap-4 items-end">
      <div className="flex-1 min-w-[200px]">
        <label className="block text-xs font-medium text-gray-400 mb-1">Search Identifier</label>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
          <input
            type="text"
            className="w-full bg-gray-800 border border-gray-700 rounded-md py-1.5 pl-9 pr-3 text-sm text-white focus:outline-none focus:border-blue-500 transition-colors"
            placeholder="e.g. GJ01XX0001"
            value={filters.search || ''}
            onChange={(e) => onChange({ search: e.target.value })}
          />
        </div>
      </div>
      
      <div className="w-40">
        <label className="block text-xs font-medium text-gray-400 mb-1">Entity Type</label>
        <select
          className="w-full bg-gray-800 border border-gray-700 rounded-md py-1.5 px-3 text-sm text-white focus:outline-none focus:border-blue-500 transition-colors"
          value={filters.entity_type || ''}
          onChange={(e) => onChange({ entity_type: e.target.value })}
        >
          <option value="">All Entities</option>
          <option value="vehicle">Vehicle</option>
          <option value="person">Person</option>
          <option value="other">Other</option>
        </select>
      </div>

      <div className="w-40">
        <label className="block text-xs font-medium text-gray-400 mb-1">Category</label>
        <select
          className="w-full bg-gray-800 border border-gray-700 rounded-md py-1.5 px-3 text-sm text-white focus:outline-none focus:border-blue-500 transition-colors"
          value={filters.category || ''}
          onChange={(e) => onChange({ category: e.target.value })}
        >
          <option value="">All Categories</option>
          <option value="blacklisted">Blacklisted</option>
          <option value="stolen">Stolen</option>
          <option value="wanted">Wanted</option>
          <option value="missing">Missing</option>
        </select>
      </div>

      <div className="w-32">
        <label className="block text-xs font-medium text-gray-400 mb-1">Status</label>
        <select
          className="w-full bg-gray-800 border border-gray-700 rounded-md py-1.5 px-3 text-sm text-white focus:outline-none focus:border-blue-500 transition-colors"
          value={filters.is_active === undefined ? '' : filters.is_active ? 'true' : 'false'}
          onChange={(e) => {
            const val = e.target.value;
            onChange({ is_active: val === '' ? undefined : val === 'true' });
          }}
        >
          <option value="">All Statuses</option>
          <option value="true">Active</option>
          <option value="false">Inactive</option>
        </select>
      </div>
      
      <button 
        onClick={() => onChange({ search: '', entity_type: '', category: '', severity: '', is_active: undefined, page: 1 })}
        className="px-4 py-1.5 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-md transition-colors text-sm font-medium"
      >
        Clear
      </button>
    </div>
  );
};

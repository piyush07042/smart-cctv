import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { searchEntities } from '../api/entities';
import { 
  Search, 
  Car, 
  MapPin, 
  Calendar, 
  Activity, 
  Loader2, 
  ChevronLeft, 
  ChevronRight,
  Filter,
  Download,
  Clock
} from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { useAuthStore } from '../stores/authStore';
import { apiClient } from '../api/client';

export const EntitySearchPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  
  const [query, setQuery] = useState(searchParams.get('q') || '');
  const [page, setPage] = useState(parseInt(searchParams.get('page') || '1', 10));
  
  // Update local state when URL changes
  useEffect(() => {
    setQuery(searchParams.get('q') || '');
    setPage(parseInt(searchParams.get('page') || '1', 10));
  }, [searchParams]);

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['entity-search', searchParams.toString()],
    queryFn: () => searchEntities({
      q: searchParams.get('q') || '',
      page: parseInt(searchParams.get('page') || '1', 10),
    }),
    enabled: !!searchParams.get('q'),
  });

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      setSearchParams({ q: query.trim(), page: '1' });
    }
  };

  const handleExport = async () => {
    try {
      const q = searchParams.get('q');
      if (!q) return;
      const resp = await apiClient.get('/entities/export/events.csv', {
        params: { vehicle_number: q },
        responseType: 'blob'
      });
      const url = window.URL.createObjectURL(new Blob([resp.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `events_export_${q}.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      console.error('Export failed', err);
      alert('Failed to export CSV. Note that Viewers cannot export data.');
    }
  };

  return (
    <div className="h-full flex flex-col bg-green-50">
      <div className="p-4 border-b border-green-200 bg-white shrink-0 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-xl font-bold text-green-900 flex items-center gap-3">
            <Search className="w-5 h-5 text-green-600" />
            Entity Search
          </h1>
          <p className="text-sm text-green-700 mt-1">Search for vehicle sightings across all cameras</p>
        </div>
        
        {user?.role !== 'VIEWER' && searchParams.get('q') && (
          <button 
            onClick={handleExport}
            className="flex items-center gap-2 px-3 py-1.5 bg-green-100 hover:bg-green-700 text-green-800 rounded-md text-sm transition-colors border border-green-300"
          >
            <Download className="w-4 h-4" /> Export CSV
          </button>
        )}
      </div>

      <div className="p-4 shrink-0 bg-green-50 border-b border-green-200">
        <form onSubmit={handleSearch} className="max-w-3xl flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-green-600" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Enter license plate (e.g. MH01* or MH01AB1234)"
              className="w-full pl-10 pr-4 py-2 bg-white border border-green-200 rounded-lg text-green-900 placeholder-green-500 focus:outline-none focus:border-green-500 focus:ring-1 focus:ring-green-500"
            />
          </div>
          <button 
            type="submit"
            className="px-6 py-2 bg-green-600 hover:bg-green-700 text-white font-medium rounded-lg transition-colors flex items-center gap-2"
          >
            Search
          </button>
        </form>
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        {isLoading && (
          <div className="flex flex-col items-center justify-center h-48 text-green-600">
            <Loader2 className="w-8 h-8 animate-spin mb-4" />
            <span>Searching...</span>
          </div>
        )}

        {error && (
          <div className="bg-red-100 border border-red-300 text-red-700 p-4 rounded-lg flex items-start gap-3 max-w-3xl">
            <Activity className="w-5 h-5 mt-0.5 shrink-0" />
            <div>
              <p className="font-medium">Search Failed</p>
              <p className="text-sm opacity-80">Make sure to provide a valid search query.</p>
            </div>
          </div>
        )}

        {!isLoading && !error && data && data.sightings.length === 0 && (
          <div className="flex flex-col items-center justify-center h-48 text-green-600 max-w-3xl">
            <Search className="w-12 h-12 mb-4 opacity-50" />
            <p className="text-lg font-medium">No results found</p>
            <p className="text-sm">Try using wildcards (e.g. MH01*) for partial matches.</p>
          </div>
        )}

        {!isLoading && !error && data && data.sightings.length > 0 && (
          <div className="max-w-5xl space-y-4">
            <div className="flex items-center justify-between text-sm text-green-700">
              <span>Found {data.total} {data.total === 1 ? 'sighting' : 'sightings'}</span>
            </div>

            <div className="bg-white border border-green-200 rounded-lg overflow-hidden">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-green-100/50 text-green-700 text-xs uppercase tracking-wider border-b border-green-200">
                    <th className="px-4 py-3 font-medium">Plate</th>
                    <th className="px-4 py-3 font-medium">Time</th>
                    <th className="px-4 py-3 font-medium">Camera</th>
                    <th className="px-4 py-3 font-medium">Event Type</th>
                    <th className="px-4 py-3 font-medium text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-green-800/50">
                  {data.sightings.map((sighting) => (
                    <tr key={sighting.id} className="hover:bg-green-100/20 transition-colors">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2 text-green-900 font-medium">
                          <Car className="w-4 h-4 text-green-600" />
                          {sighting.vehicle_number}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-green-800 text-sm">
                        <div className="flex items-center gap-1.5">
                          <Clock className="w-3.5 h-3.5 text-green-600" />
                          {format(parseISO(sighting.timestamp), 'PP HH:mm:ss')}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1.5 text-green-800 text-sm">
                          <MapPin className="w-3.5 h-3.5 text-green-700" />
                          <span title={sighting.camera_id}>{sighting.camera_name || sighting.camera_id}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full font-medium uppercase tracking-wider">
                          {sighting.event_type}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <button 
                          onClick={() => navigate(`/trace/${sighting.vehicle_number}`)}
                          className="px-3 py-1.5 bg-green-600/10 hover:bg-green-600/20 text-green-700 text-xs font-medium rounded transition-colors"
                        >
                          View Trace
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {data.pages > 1 && (
              <div className="flex items-center justify-between pt-4">
                <span className="text-sm text-green-700">
                  Page {data.page} of {data.pages}
                </span>
                <div className="flex gap-2">
                  <button
                    disabled={data.page === 1}
                    onClick={() => setSearchParams({ q: searchParams.get('q') || '', page: (data.page - 1).toString() })}
                    className="p-1.5 rounded bg-green-100 text-green-800 disabled:opacity-50 hover:bg-green-700 transition-colors"
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </button>
                  <button
                    disabled={data.page === data.pages}
                    onClick={() => setSearchParams({ q: searchParams.get('q') || '', page: (data.page + 1).toString() })}
                    className="p-1.5 rounded bg-green-100 text-green-800 disabled:opacity-50 hover:bg-green-700 transition-colors"
                  >
                    <ChevronRight className="w-5 h-5" />
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

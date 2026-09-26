import React from 'react';
import { CameraFilters as FiltersType } from '../../api/cameras';
import { Search } from 'lucide-react';

interface CameraFiltersProps {
  filters: FiltersType;
  onChange: (newFilters: Partial<FiltersType>) => void;
  availableDepartments?: string[];
  availableZones?: string[];
}

export const CameraFilters: React.FC<CameraFiltersProps> = ({ 
  filters, 
  onChange,
  availableDepartments = ['Traffic', 'Transport', 'Railway', 'Aviation Security', 'Secretariat'],
  availableZones = ['Zone-A', 'Zone-B', 'Zone-C', 'Zone-D', 'Zone-X', 'Gandhinagar-North', 'Gandhinagar-South', 'Vadodara-Central', 'Mobile']
}) => {
  return (
    <div className="bg-white border border-green-200 rounded-lg p-4 mb-6 space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        
        {/* Search */}
        <div className="lg:col-span-2 relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-4 w-4 text-green-600" />
          </div>
          <input
            type="text"
            className="block w-full pl-10 pr-3 py-2 border border-green-300 rounded-md leading-5 bg-green-50 text-green-800 placeholder-green-500 focus:outline-none focus:ring-1 focus:ring-green-500 focus:border-green-500 sm:text-sm transition-colors"
            placeholder="Search by ID or Name..."
            value={filters.search || ''}
            onChange={(e) => onChange({ search: e.target.value })}
          />
        </div>

        {/* Status */}
        <div>
          <select
            className="block w-full pl-3 pr-10 py-2 text-base border border-green-300 bg-green-50 text-green-800 focus:outline-none focus:ring-1 focus:ring-green-500 focus:border-green-500 sm:text-sm rounded-md transition-colors appearance-none"
            value={filters.status || ''}
            onChange={(e) => onChange({ status: e.target.value || undefined })}
          >
            <option value="">All Statuses</option>
            <option value="ONLINE">Online</option>
            <option value="DEGRADED">Degraded</option>
            <option value="OFFLINE">Offline</option>
          </select>
        </div>

        {/* Department */}
        <div>
          <select
            className="block w-full pl-3 pr-10 py-2 text-base border border-green-300 bg-green-50 text-green-800 focus:outline-none focus:ring-1 focus:ring-green-500 focus:border-green-500 sm:text-sm rounded-md transition-colors appearance-none"
            value={filters.department || ''}
            onChange={(e) => onChange({ department: e.target.value || undefined })}
          >
            <option value="">All Departments</option>
            {availableDepartments.map(dep => (
              <option key={dep} value={dep}>{dep}</option>
            ))}
          </select>
        </div>

        {/* Zone */}
        <div>
          <select
            className="block w-full pl-3 pr-10 py-2 text-base border border-green-300 bg-green-50 text-green-800 focus:outline-none focus:ring-1 focus:ring-green-500 focus:border-green-500 sm:text-sm rounded-md transition-colors appearance-none"
            value={filters.zone || ''}
            onChange={(e) => onChange({ zone: e.target.value || undefined })}
          >
            <option value="">All Zones</option>
            {availableZones.map(zone => (
              <option key={zone} value={zone}>{zone}</option>
            ))}
          </select>
        </div>

        {/* Protocol */}
        <div>
          <select
            className="block w-full pl-3 pr-10 py-2 text-base border border-green-300 bg-green-50 text-green-800 focus:outline-none focus:ring-1 focus:ring-green-500 focus:border-green-500 sm:text-sm rounded-md transition-colors appearance-none"
            value={filters.source_protocol || ''}
            onChange={(e) => onChange({ source_protocol: e.target.value || undefined })}
          >
            <option value="">All Protocols</option>
            <option value="RTSP">RTSP</option>
            <option value="ONVIF">ONVIF</option>
            <option value="HLS">HLS</option>
            <option value="WEBRTC">WebRTC</option>
            <option value="VENDOR_API">Vendor API</option>
            <option value="FILE">File</option>
          </select>
        </div>
        
        {/* Enabled */}
        <div>
          <select
            className="block w-full pl-3 pr-10 py-2 text-base border border-green-300 bg-green-50 text-green-800 focus:outline-none focus:ring-1 focus:ring-green-500 focus:border-green-500 sm:text-sm rounded-md transition-colors appearance-none"
            value={filters.is_enabled === undefined ? '' : String(filters.is_enabled)}
            onChange={(e) => {
              const val = e.target.value;
              onChange({ is_enabled: val === '' ? undefined : val === 'true' });
            }}
          >
            <option value="">All States</option>
            <option value="true">Enabled</option>
            <option value="false">Disabled</option>
          </select>
        </div>

      </div>
    </div>
  );
};

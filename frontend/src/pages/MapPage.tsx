import React, { useState } from 'react';
import { CameraMap } from '../components/map/CameraMap';
import { useCameras } from '../hooks/useCameras';
import { Loader2 } from 'lucide-react';

export const MapPage: React.FC = () => {
  const [zoneFilter, setZoneFilter] = useState<string>('');
  const [deptFilter, setDeptFilter] = useState<string>('');
  
  // For the map, we want to fetch all cameras or a large unpaginated set if possible.
  // We'll use a large page_size to get most/all cameras for map display.
  // In a real prod environment with 10k cameras, we'd need vector tiles or server-side clustering.
  const { cameras, isLoading } = useCameras({
    page: 1,
    page_size: 1000,
    zone: zoneFilter || undefined,
    department: deptFilter || undefined
  });

  const availableZones = ['Zone-A', 'Zone-B', 'Zone-C', 'Zone-D', 'Zone-X', 'Gandhinagar-North', 'Gandhinagar-South', 'Vadodara-Central', 'Mobile'];
  const availableDepts = ['Traffic', 'Transport', 'Railway', 'Aviation Security', 'Secretariat'];

  return (
    <div className="h-full flex flex-col">
      <div className="p-4 border-b border-gray-800 bg-gray-900 shrink-0 flex items-center justify-between">
        <h1 className="text-xl font-bold text-white flex items-center gap-3">
          GIS Map
          {isLoading && <Loader2 className="w-4 h-4 animate-spin text-gray-500" />}
        </h1>

        <div className="flex gap-4">
          <select
            className="bg-gray-950 border border-gray-700 rounded-md px-3 py-1.5 text-sm text-gray-300 focus:outline-none focus:border-blue-500"
            value={deptFilter}
            onChange={(e) => setDeptFilter(e.target.value)}
          >
            <option value="">All Departments</option>
            {availableDepts.map(d => (
              <option key={d} value={d}>{d}</option>
            ))}
          </select>
          <select
            className="bg-gray-950 border border-gray-700 rounded-md px-3 py-1.5 text-sm text-gray-300 focus:outline-none focus:border-blue-500"
            value={zoneFilter}
            onChange={(e) => setZoneFilter(e.target.value)}
          >
            <option value="">All Zones</option>
            {availableZones.map(z => (
              <option key={z} value={z}>{z}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="flex-1 min-h-0 bg-gray-950 p-4">
        <CameraMap cameras={cameras} />
      </div>
    </div>
  );
};

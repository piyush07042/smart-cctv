import React, { useState } from 'react';
import { useCameras } from '../hooks/useCameras';
import { CameraVideoTile } from '../components/cameras/CameraVideoTile';
import { Loader2, LayoutGrid, MonitorPlay } from 'lucide-react';

export const CamerasLivePage: React.FC = () => {
  // Use a slightly larger page size for the grid demo (e.g., 9 cameras max)
  const { cameras, isLoading, error } = useCameras({
    page: 1,
    page_size: 9,
    // Only fetch enabled cameras with streams? Or show all and let the tile handle disabled states.
    // For now we fetch all to show status handling.
  });

  const [layout, setLayout] = useState<'1x1' | '2x2' | '3x3'>('2x2');

  const getGridClass = () => {
    switch (layout) {
      case '1x1': return 'grid-cols-1';
      case '2x2': return 'grid-cols-1 md:grid-cols-2';
      case '3x3': return 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3';
      default: return 'grid-cols-1 md:grid-cols-2';
    }
  };

  return (
    <div className="h-full flex flex-col">
      <div className="p-4 border-b border-gray-800 bg-gray-900 shrink-0 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-white flex items-center gap-3">
            <MonitorPlay className="w-5 h-5 text-blue-500" />
            Live View Grid
            {isLoading && <Loader2 className="w-4 h-4 animate-spin text-gray-500" />}
          </h1>
          <p className="text-sm text-gray-400 mt-1">Real-time video monitoring</p>
        </div>

        <div className="flex items-center gap-2 bg-gray-950 p-1 rounded-lg border border-gray-800">
          <button
            onClick={() => setLayout('1x1')}
            className={`px-3 py-1.5 text-xs font-medium rounded ${layout === '1x1' ? 'bg-gray-800 text-white' : 'text-gray-400 hover:text-gray-200'}`}
          >
            1x1
          </button>
          <button
            onClick={() => setLayout('2x2')}
            className={`px-3 py-1.5 text-xs font-medium rounded ${layout === '2x2' ? 'bg-gray-800 text-white' : 'text-gray-400 hover:text-gray-200'}`}
          >
            2x2
          </button>
          <button
            onClick={() => setLayout('3x3')}
            className={`px-3 py-1.5 text-xs font-medium rounded ${layout === '3x3' ? 'bg-gray-800 text-white' : 'text-gray-400 hover:text-gray-200'}`}
          >
            3x3
          </button>
        </div>
      </div>

      <div className="flex-1 bg-gray-950 p-4 overflow-y-auto">
        {error ? (
          <div className="flex items-center justify-center h-full text-red-400 bg-red-500/10 rounded-lg p-6">
            Failed to load cameras for live view.
          </div>
        ) : cameras.length === 0 && !isLoading ? (
          <div className="flex flex-col items-center justify-center h-full text-gray-500">
            <LayoutGrid className="w-12 h-12 mb-4 opacity-50" />
            <p>No cameras available in the registry.</p>
          </div>
        ) : (
          <div className={`grid gap-4 ${getGridClass()}`}>
            {cameras.map(camera => (
              <CameraVideoTile key={camera.camera_id} camera={camera} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

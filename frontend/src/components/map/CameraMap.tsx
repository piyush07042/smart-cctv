import React, { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import MarkerClusterGroup from 'react-leaflet-cluster';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Camera } from '../../types/camera';
import { Video } from 'lucide-react';
import { useRealtimeStore } from '../../stores/realtimeStore';

// Custom icons based on status
const createIcon = (color: string) => new L.Icon({
  iconUrl: `https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-${color}.png`,
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

const icons = {
  ONLINE: createIcon('green'),
  DEGRADED: createIcon('gold'),
  OFFLINE: createIcon('grey'),
  DISABLED: createIcon('black'),
  CRITICAL_ALERT: createIcon('red'),
};

const MapBounds: React.FC<{ cameras: Camera[] }> = ({ cameras }) => {
  const map = useMap();

  useEffect(() => {
    if (cameras.length === 0) return;
    
    const validCameras = cameras.filter(c => c.latitude !== null && c.longitude !== null);
    if (validCameras.length === 0) return;

    const bounds = L.latLngBounds(
      validCameras.map(c => [c.latitude as number, c.longitude as number])
    );
    
    map.fitBounds(bounds, { padding: [50, 50] });
  }, [cameras, map]);

  return null;
};

interface CameraMapProps {
  cameras: Camera[];
}

export const CameraMap: React.FC<CameraMapProps> = ({ cameras }) => {
  const defaultCenter: [number, number] = [22.309425, 72.136230];
  const { cameraHealth, liveAlerts } = useRealtimeStore();

  const activeAlertCameras = new Set(
    Object.values(liveAlerts)
      .filter(a => a.status === 'new' && a.severity === 'critical')
      .map(a => a.camera_id)
  );

  const mergedCameras = cameras.map(c => {
    const health = cameraHealth[c.camera_id];
    if (health) {
      return { ...c, status: health.new as any, last_heartbeat: health.at };
    }
    return c;
  });

  const validCameras = mergedCameras.filter(c => c.latitude !== null && c.longitude !== null);

  const getMarkerIcon = (camera: Camera) => {
    if (activeAlertCameras.has(camera.camera_id)) return icons.CRITICAL_ALERT;
    if (!camera.is_enabled) return icons.DISABLED;
    if (camera.status === 'ONLINE') return icons.ONLINE;
    if (camera.status === 'DEGRADED') return icons.DEGRADED;
    return icons.OFFLINE;
  };

  return (
    <div className="relative w-full h-full rounded-xl overflow-hidden border border-gray-800 shadow-lg">
      <MapContainer 
        center={defaultCenter} 
        zoom={7} 
        style={{ height: '100%', width: '100%', zIndex: 1, backgroundColor: '#0f172a' }} // Slate 900 background for dark map feel initially
      >
        <TileLayer
          attribution='&copy; OpenStreetMap contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          className="map-tiles-dark" // We'll add a CSS filter in index.css to darken OSM tiles
        />
        
        <MapBounds cameras={validCameras} />

        <MarkerClusterGroup
          chunkedLoading
          maxClusterRadius={50}
        >
          {validCameras.map(camera => (
            <Marker 
              key={camera.id} 
              position={[camera.latitude as number, camera.longitude as number]}
              icon={getMarkerIcon(camera)}
            >
              <Popup className="camera-popup">
                <div className="p-1 min-w-[200px]">
                  <div className="flex items-center justify-between border-b pb-2 mb-2">
                    <h3 className="font-bold text-gray-900 m-0 leading-tight">{camera.name}</h3>
                    <span className="text-xs font-mono bg-gray-100 text-gray-600 px-1 py-0.5 rounded">{camera.camera_id}</span>
                  </div>
                  
                  <div className="space-y-1 mb-3 text-sm text-gray-700">
                    <div className="flex justify-between">
                      <span className="text-gray-500">Dept:</span>
                      <span className="font-medium">{camera.department || 'N/A'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Zone:</span>
                      <span className="font-medium">{camera.zone || 'N/A'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Status:</span>
                      <span className={`font-bold ${
                        camera.status === 'ONLINE' ? 'text-green-600' : 
                        camera.status === 'DEGRADED' ? 'text-amber-600' : 'text-gray-600'
                      }`}>
                        {!camera.is_enabled ? 'DISABLED' : camera.status}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Last Seen:</span>
                      <span className="font-medium">{camera.last_heartbeat ? new Date(camera.last_heartbeat).toLocaleTimeString() : 'N/A'}</span>
                    </div>
                  </div>

                  <button 
                    disabled
                    className="w-full flex items-center justify-center gap-2 bg-gray-100 text-gray-400 py-1.5 rounded cursor-not-allowed border border-gray-200 text-sm font-medium"
                    title="Video playback available in Phase 5"
                  >
                    <Video className="w-4 h-4" /> View Feed
                  </button>
                </div>
              </Popup>
            </Marker>
          ))}
        </MarkerClusterGroup>
      </MapContainer>
      
      {validCameras.length === 0 && (
        <div className="absolute inset-0 z-[400] flex items-center justify-center pointer-events-none bg-black/20 backdrop-blur-[1px]">
          <div className="bg-gray-900/90 border border-gray-700 text-white px-6 py-4 rounded-lg shadow-xl pointer-events-auto">
            <h3 className="text-lg font-medium mb-1">No Cameras with Coordinates</h3>
            <p className="text-sm text-gray-400">Add coordinates to cameras to see them on the map.</p>
          </div>
        </div>
      )}
    </div>
  );
};

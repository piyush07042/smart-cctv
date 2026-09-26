import React, { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { getVehicleTrace } from '../api/entities';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet';
import L from 'leaflet';
import { 
  ArrowLeft,
  Car, 
  MapPin, 
  Clock, 
  AlertTriangle,
  Loader2,
  Calendar
} from 'lucide-react';
import { format, parseISO, subDays } from 'date-fns';

// Map fix for default marker icon
import 'leaflet/dist/leaflet.css';
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

// Component to fit map bounds to trace
const TraceBounds: React.FC<{ coordinates: [number, number][] }> = ({ coordinates }) => {
  const map = useMap();
  React.useEffect(() => {
    if (coordinates.length > 0) {
      const bounds = L.latLngBounds(coordinates);
      map.fitBounds(bounds, { padding: [50, 50] });
    }
  }, [coordinates, map]);
  return null;
};

export const VehicleTracePage: React.FC = () => {
  const { plate } = useParams<{ plate: string }>();
  const navigate = useNavigate();
  
  // Default to last 7 days for trace to see more history
  const [dateRange, setDateRange] = useState({
    from: subDays(new Date(), 7).toISOString(),
    to: new Date().toISOString()
  });

  const { data, isLoading, error } = useQuery({
    queryKey: ['vehicle-trace', plate, dateRange],
    queryFn: () => getVehicleTrace(plate!, { from_ts: dateRange.from, to_ts: dateRange.to }),
    enabled: !!plate,
  });

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center bg-green-50">
        <Loader2 className="w-8 h-8 animate-spin text-green-600" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-red-700 bg-green-50">
        <AlertTriangle className="w-12 h-12 mb-4" />
        <h2 className="text-xl font-semibold mb-2">Failed to load vehicle trace</h2>
        <button 
          onClick={() => navigate(-1)}
          className="mt-4 px-4 py-2 bg-green-100 hover:bg-green-700 text-green-900 rounded-md transition-colors flex items-center gap-2"
        >
          <ArrowLeft className="w-4 h-4" /> Go Back
        </button>
      </div>
    );
  }

  const hasSightings = data.sightings.length > 0;
  
  // Extract coordinates for map
  const coordinates: [number, number][] = data.sightings
    .filter(s => s.latitude !== null && s.longitude !== null)
    .map(s => [s.latitude!, s.longitude!]);

  return (
    <div className="h-full flex flex-col bg-green-50 overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b border-green-200 bg-white shrink-0 flex items-center gap-4">
        <button 
          onClick={() => navigate(-1)}
          className="p-2 hover:bg-green-100 text-green-700 hover:text-green-900 rounded-full transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-xl font-bold text-green-900 flex items-center gap-3">
            <Car className="w-5 h-5 text-green-600" />
            Vehicle Trace: {data.plate}
          </h1>
          <p className="text-sm text-green-700 mt-1">
            {hasSightings 
              ? `${data.total_sightings} sightings recorded`
              : 'No sightings found in selected time range'}
          </p>
        </div>
      </div>

      <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
        
        {/* Map View */}
        <div className="flex-1 bg-white border-r border-green-200 relative z-0 min-h-[300px]">
          {hasSightings && coordinates.length > 0 ? (
            <MapContainer
              center={coordinates[0]}
              zoom={13}
              className="w-full h-full"
              zoomControl={false}
            >
              <TileLayer
                url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a>'
              />
              <TraceBounds coordinates={coordinates} />
              
              {/* Route Polyline */}
              <Polyline 
                positions={coordinates} 
                pathOptions={{ color: '#3B82F6', weight: 4, opacity: 0.7, dashArray: '10, 10' }} 
              />

              {/* Markers for Sightings */}
              {data.sightings.map((sighting) => {
                if (sighting.latitude === null || sighting.longitude === null) return null;
                
                // Color code: Green for first, Red for last, Blue for intermediate
                const isFirst = sighting.seq === 1;
                const isLast = sighting.seq === data.total_sightings;
                const colorClass = isFirst ? 'bg-green-500' : isLast ? 'bg-red-500' : 'bg-blue-500';

                // Custom marker icon
                const customIcon = L.divIcon({
                  className: 'bg-transparent',
                  html: `<div class="relative w-6 h-6">
                          <div class="absolute inset-0 rounded-full ${colorClass} opacity-20 animate-ping"></div>
                          <div class="absolute inset-1 rounded-full border-2 border-white ${colorClass} flex items-center justify-center text-[10px] text-green-900 font-bold">${sighting.seq}</div>
                        </div>`,
                  iconSize: [24, 24],
                  iconAnchor: [12, 12],
                });

                return (
                  <Marker 
                    key={sighting.event_id} 
                    position={[sighting.latitude, sighting.longitude]}
                    icon={customIcon}
                  >
                    <Popup className="custom-popup">
                      <div className="text-sm font-sans p-1">
                        <p className="font-bold border-b border-green-200 pb-1 mb-1">Stop #{sighting.seq}</p>
                        <p className="flex items-center gap-1"><Clock className="w-3 h-3"/> {format(parseISO(sighting.timestamp), 'PP HH:mm')}</p>
                        <p className="flex items-center gap-1 mt-1"><MapPin className="w-3 h-3"/> {sighting.camera_name || sighting.camera_id}</p>
                      </div>
                    </Popup>
                  </Marker>
                );
              })}
            </MapContainer>
          ) : (
            <div className="flex items-center justify-center h-full text-green-600 bg-white">
              <MapPin className="w-12 h-12 opacity-20 mb-4" />
              <p>Map data not available</p>
            </div>
          )}
          
          {/* Note Overlay */}
          {hasSightings && (
            <div className="absolute bottom-4 left-4 right-4 bg-green-50/80 backdrop-blur border border-green-200 text-green-800 text-xs p-3 rounded shadow-lg pointer-events-none">
              <AlertTriangle className="w-4 h-4 text-amber-500 inline mr-1 -mt-0.5" />
              {data.route_note}
            </div>
          )}
        </div>

        {/* Timeline View */}
        <div className="w-full md:w-[400px] bg-green-50 overflow-y-auto shrink-0 flex flex-col">
          <div className="p-4 border-b border-green-200 bg-white sticky top-0 z-10 font-medium text-green-900 flex items-center justify-between">
            Timeline
          </div>
          
          <div className="p-4 flex-1">
            {!hasSightings ? (
              <p className="text-green-600 text-center mt-10">No sightings to display.</p>
            ) : (
              <div className="relative border-l border-green-200 ml-3 space-y-8 pb-8">
                {data.sightings.map((sighting) => (
                  <div key={sighting.event_id} className="relative pl-6">
                    {/* Timeline Node */}
                    <div className={`absolute -left-1.5 top-1.5 w-3 h-3 rounded-full border-2 border-green-950 ${sighting.seq === 1 ? 'bg-green-500' : sighting.seq === data.total_sightings ? 'bg-red-500' : 'bg-blue-500'}`}></div>
                    
                    {/* Content */}
                    <div className="bg-white border border-green-200 rounded-lg p-3 shadow-sm hover:border-green-300 transition-colors">
                      <div className="flex items-start justify-between">
                        <div className="text-xs font-bold text-green-600 mb-1">#{sighting.seq}</div>
                        <div className="text-xs font-medium bg-green-100 px-2 py-0.5 rounded text-green-700">
                          {sighting.event_type}
                        </div>
                      </div>
                      
                      <div className="text-sm font-medium text-green-900 mb-2 flex items-center gap-1.5">
                        <MapPin className="w-4 h-4 text-green-700" />
                        {sighting.camera_name || sighting.camera_id}
                      </div>
                      
                      <div className="text-xs text-green-700 flex items-center gap-1.5 mb-3">
                        <Clock className="w-3.5 h-3.5" />
                        {format(parseISO(sighting.timestamp), 'MMM d, yyyy - HH:mm:ss')}
                      </div>

                      {/* Hop Analysis */}
                      {sighting.hop && (
                        <div className="mt-3 pt-3 border-t border-green-200 text-xs">
                          <div className="grid grid-cols-2 gap-2 text-green-700">
                            <div>
                              <span className="block text-green-600 mb-0.5">Time since prev:</span>
                              {sighting.hop.elapsed_minutes >= 60 
                                ? `${Math.floor(sighting.hop.elapsed_minutes / 60)}h ${Math.round(sighting.hop.elapsed_minutes % 60)}m`
                                : `${Math.round(sighting.hop.elapsed_minutes)}m`}
                            </div>
                            {sighting.hop.distance_km !== null && (
                              <div>
                                <span className="block text-green-600 mb-0.5">Est. Distance:</span>
                                {sighting.hop.distance_km} km
                              </div>
                            )}
                            {sighting.hop.speed_kmh !== null && (
                              <div className={sighting.hop.implausible_speed ? "col-span-2 text-red-700" : ""}>
                                <span className="block text-green-600 mb-0.5">Avg Speed:</span>
                                {sighting.hop.speed_kmh} km/h
                                {sighting.hop.implausible_speed && " (Implausible)"}
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
};

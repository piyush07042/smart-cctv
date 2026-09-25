import React from 'react';
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix Leaflet's default icon path issues in React
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

interface MapLocationPickerProps {
  initialLat?: number;
  initialLng?: number;
  onLocationSelect: (lat: number, lng: number) => void;
}

const LocationMarker: React.FC<{
  position: [number, number] | null;
  setPosition: (pos: [number, number]) => void;
  onSelect: (lat: number, lng: number) => void;
}> = ({ position, setPosition, onSelect }) => {
  useMapEvents({
    click(e) {
      setPosition([e.latlng.lat, e.latlng.lng]);
      onSelect(e.latlng.lat, e.latlng.lng);
    },
  });

  return position === null ? null : (
    <Marker position={position}></Marker>
  );
};

export const MapLocationPicker: React.FC<MapLocationPickerProps> = ({ 
  initialLat, 
  initialLng, 
  onLocationSelect 
}) => {
  const [position, setPosition] = React.useState<[number, number] | null>(
    initialLat !== undefined && initialLng !== undefined 
      ? [initialLat, initialLng] 
      : null
  );

  const defaultCenter: [number, number] = [22.309425, 72.136230]; // Gujarat center approx

  return (
    <MapContainer 
      center={position || defaultCenter} 
      zoom={position ? 15 : 7} 
      style={{ height: '100%', width: '100%', zIndex: 1 }}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <LocationMarker position={position} setPosition={setPosition} onSelect={onLocationSelect} />
    </MapContainer>
  );
};

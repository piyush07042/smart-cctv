import React, { useState, useEffect } from 'react';
import { Camera, CameraType, SourceProtocol, CameraStatus } from '../../types/camera';
import { X, Save, MapPin } from 'lucide-react';
import { MapLocationPicker } from '../map/MapLocationPicker';

interface CameraFormProps {
  initialData?: Camera | null;
  onSubmit: (data: any) => Promise<void>;
  onCancel: () => void;
  isLoading: boolean;
}

export const CameraForm: React.FC<CameraFormProps> = ({ 
  initialData, 
  onSubmit, 
  onCancel,
  isLoading
}) => {
  const isEdit = !!initialData;
  const [showMapPicker, setShowMapPicker] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const [formData, setFormData] = useState({
    camera_id: '',
    name: '',
    department: '',
    latitude: '',
    longitude: '',
    camera_type: 'FIXED' as CameraType,
    source_protocol: 'RTSP' as SourceProtocol,
    stream_endpoint_ref: '',
    username: '',
    password: '',
    status: 'OFFLINE' as CameraStatus,
    zone: '',
    is_enabled: true,
  });

  useEffect(() => {
    if (initialData) {
      setFormData({
        camera_id: initialData.camera_id,
        name: initialData.name,
        department: initialData.department || '',
        latitude: initialData.latitude ? initialData.latitude.toString() : '',
        longitude: initialData.longitude ? initialData.longitude.toString() : '',
        camera_type: initialData.camera_type || 'FIXED',
        source_protocol: initialData.source_protocol || 'RTSP',
        stream_endpoint_ref: initialData.stream_endpoint_ref || '',
        username: '', // Do not populate passwords
        password: '', // Do not populate passwords
        status: initialData.status,
        zone: initialData.zone || '',
        is_enabled: initialData.is_enabled,
      });
    }
  }, [initialData]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value
    }));
  };

  const handleMapSelect = (lat: number, lng: number) => {
    setFormData(prev => ({
      ...prev,
      latitude: lat.toFixed(6),
      longitude: lng.toFixed(6)
    }));
    setShowMapPicker(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    // Transform for backend
    const payload: any = {
      name: formData.name,
      department: formData.department || null,
      latitude: formData.latitude ? parseFloat(formData.latitude) : null,
      longitude: formData.longitude ? parseFloat(formData.longitude) : null,
      camera_type: formData.camera_type,
      source_protocol: formData.source_protocol,
      stream_endpoint_ref: formData.stream_endpoint_ref || null,
      status: formData.status,
      zone: formData.zone || null,
      is_enabled: formData.is_enabled,
    };

    if (!isEdit) {
      payload.camera_id = formData.camera_id;
    }

    if (formData.username || formData.password) {
      payload.stream_credentials = {
        username: formData.username || null,
        password: formData.password || null,
      };
    }

    try {
      await onSubmit(payload);
    } catch (error: any) {
      if (error.response?.data?.detail) {
        let detail = error.response.data.detail;
        if (Array.isArray(detail)) {
          detail = detail.map((d: any) => `${d.loc.join('.')}: ${d.msg}`).join(', ');
        }
        setErrorMsg(detail);
      } else {
        setErrorMsg('An unexpected error occurred saving the camera.');
      }
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-gray-900 border border-gray-800 rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between p-6 border-b border-gray-800 shrink-0">
          <h2 className="text-xl font-bold text-white">
            {isEdit ? `Edit Camera: ${initialData.camera_id}` : 'Register New Camera'}
          </h2>
          <button 
            onClick={onCancel}
            className="text-gray-400 hover:text-white transition-colors p-1 rounded-md hover:bg-gray-800"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto flex-1 custom-scrollbar">
          {errorMsg && (
            <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-md text-red-400 text-sm">
              {errorMsg}
            </div>
          )}

          <form id="camera-form" onSubmit={handleSubmit} className="space-y-8">
            {/* Identity Section */}
            <div>
              <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-4 border-b border-gray-800 pb-2">Identity</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {!isEdit && (
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">Camera ID *</label>
                    <input
                      type="text"
                      name="camera_id"
                      value={formData.camera_id}
                      onChange={handleChange}
                      required
                      pattern="^[A-Za-z0-9\-]{1,64}$"
                      title="Letters, digits, and hyphens only"
                      className="w-full bg-gray-950 border border-gray-700 rounded-md px-3 py-2 text-white focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="e.g. C001, CAM-01"
                    />
                  </div>
                )}
                <div className={isEdit ? "md:col-span-2" : ""}>
                  <label className="block text-sm font-medium text-gray-300 mb-1">Name *</label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    required
                    className="w-full bg-gray-950 border border-gray-700 rounded-md px-3 py-2 text-white focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="e.g. Main Gate Camera"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">Department</label>
                  <input
                    type="text"
                    name="department"
                    value={formData.department}
                    onChange={handleChange}
                    className="w-full bg-gray-950 border border-gray-700 rounded-md px-3 py-2 text-white focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="e.g. Traffic"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">Zone</label>
                  <input
                    type="text"
                    name="zone"
                    value={formData.zone}
                    onChange={handleChange}
                    className="w-full bg-gray-950 border border-gray-700 rounded-md px-3 py-2 text-white focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="e.g. Zone-A"
                  />
                </div>
              </div>
            </div>

            {/* Hardware & Stream Section */}
            <div>
              <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-4 border-b border-gray-800 pb-2">Hardware & Stream</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">Camera Type</label>
                  <select
                    name="camera_type"
                    value={formData.camera_type}
                    onChange={handleChange}
                    className="w-full bg-gray-950 border border-gray-700 rounded-md px-3 py-2 text-white focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="FIXED">FIXED</option>
                    <option value="PTZ">PTZ</option>
                    <option value="ANPR">ANPR</option>
                    <option value="DASHCAM">DASHCAM</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">Source Protocol</label>
                  <select
                    name="source_protocol"
                    value={formData.source_protocol}
                    onChange={handleChange}
                    className="w-full bg-gray-950 border border-gray-700 rounded-md px-3 py-2 text-white focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="RTSP">RTSP</option>
                    <option value="ONVIF">ONVIF</option>
                    <option value="HLS">HLS</option>
                    <option value="WEBRTC">WEBRTC</option>
                    <option value="VENDOR_API">VENDOR_API</option>
                    <option value="FILE">FILE</option>
                  </select>
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-300 mb-1">Stream Endpoint Reference</label>
                  <input
                    type="text"
                    name="stream_endpoint_ref"
                    value={formData.stream_endpoint_ref}
                    onChange={handleChange}
                    className="w-full bg-gray-950 border border-gray-700 rounded-md px-3 py-2 text-white focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="e.g. rtsp://camera.local/stream1"
                  />
                  <p className="mt-1 text-xs text-gray-500">Do not include credentials in the URL. Use the fields below.</p>
                </div>
                
                {/* Credentials */}
                <div className="md:col-span-2 bg-gray-950/50 p-4 rounded-md border border-gray-800">
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="text-sm font-medium text-gray-300">Stream Credentials</h4>
                    {isEdit && initialData?.has_credentials && (
                      <span className="text-xs bg-green-500/10 text-green-400 px-2 py-1 rounded border border-green-500/20">Credentials Configured</span>
                    )}
                  </div>
                  <p className="text-xs text-gray-500 mb-4">
                    {isEdit ? 'Leave blank to keep existing credentials.' : 'Optional. Stored encrypted.'}
                  </p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-medium text-gray-400 mb-1">Username</label>
                      <input
                        type="text"
                        name="username"
                        value={formData.username}
                        onChange={handleChange}
                        className="w-full bg-gray-900 border border-gray-700 rounded-md px-3 py-1.5 text-white focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                        autoComplete="off"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-400 mb-1">Password</label>
                      <input
                        type="password"
                        name="password"
                        value={formData.password}
                        onChange={handleChange}
                        className="w-full bg-gray-900 border border-gray-700 rounded-md px-3 py-1.5 text-white focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                        autoComplete="new-password"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Location Section */}
            <div>
              <div className="flex items-center justify-between mb-4 border-b border-gray-800 pb-2">
                <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider">Location</h3>
                <button 
                  type="button"
                  onClick={() => setShowMapPicker(!showMapPicker)}
                  className="text-xs flex items-center gap-1 bg-gray-800 hover:bg-gray-700 text-gray-300 px-2 py-1 rounded transition-colors"
                >
                  <MapPin className="w-3 h-3" />
                  {showMapPicker ? 'Close Map Picker' : 'Pick on Map'}
                </button>
              </div>
              
              {showMapPicker && (
                <div className="mb-4 h-64 border border-gray-700 rounded-md overflow-hidden">
                  <MapLocationPicker 
                    initialLat={formData.latitude ? parseFloat(formData.latitude) : undefined}
                    initialLng={formData.longitude ? parseFloat(formData.longitude) : undefined}
                    onLocationSelect={handleMapSelect}
                  />
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">Latitude</label>
                  <input
                    type="number"
                    step="any"
                    name="latitude"
                    value={formData.latitude}
                    onChange={handleChange}
                    min="-90"
                    max="90"
                    className="w-full bg-gray-950 border border-gray-700 rounded-md px-3 py-2 text-white focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">Longitude</label>
                  <input
                    type="number"
                    step="any"
                    name="longitude"
                    value={formData.longitude}
                    onChange={handleChange}
                    min="-180"
                    max="180"
                    className="w-full bg-gray-950 border border-gray-700 rounded-md px-3 py-2 text-white focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>
            </div>

            {/* Status Section */}
            <div>
              <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-4 border-b border-gray-800 pb-2">Status & Enablement</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">Initial Status</label>
                  <select
                    name="status"
                    value={formData.status}
                    onChange={handleChange}
                    className="w-full bg-gray-950 border border-gray-700 rounded-md px-3 py-2 text-white focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="ONLINE">ONLINE</option>
                    <option value="DEGRADED">DEGRADED</option>
                    <option value="OFFLINE">OFFLINE</option>
                  </select>
                </div>
                <div className="flex items-center h-full pt-6">
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      name="is_enabled"
                      checked={formData.is_enabled}
                      onChange={handleChange}
                      className="w-5 h-5 bg-gray-950 border-gray-700 rounded text-blue-500 focus:ring-blue-500 focus:ring-offset-gray-900"
                    />
                    <span className="text-sm font-medium text-gray-300">Camera Enabled</span>
                  </label>
                </div>
              </div>
            </div>

          </form>
        </div>

        <div className="p-6 border-t border-gray-800 flex justify-end gap-3 shrink-0 bg-gray-900 rounded-b-xl">
          <button
            type="button"
            onClick={onCancel}
            disabled={isLoading}
            className="px-4 py-2 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-md font-medium transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            form="camera-form"
            disabled={isLoading}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md font-medium transition-colors flex items-center gap-2 disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            {isLoading ? 'Saving...' : 'Save Camera'}
          </button>
        </div>
      </div>
    </div>
  );
};

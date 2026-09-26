import React from 'react';
import { X } from 'lucide-react';
import { Event } from '../../types/events';

interface Props {
  event: Event | null;
  onClose: () => void;
}

export const EventDetailDrawer: React.FC<Props> = ({ event, onClose }) => {
  if (!event) return null;

  return (
    <>
      <div className="fixed inset-0 bg-black/50 z-40" onClick={onClose} />
      <div className="fixed right-0 top-0 bottom-0 w-[500px] bg-white shadow-2xl z-50 flex flex-col border-l border-green-200">
        <div className="flex items-center justify-between p-4 border-b border-green-200">
          <h2 className="text-lg font-semibold text-green-900">Event Details</h2>
          <button onClick={onClose} className="p-1 hover:bg-green-100 rounded-md text-green-700 hover:text-green-900 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto flex-1 space-y-6">
          <div>
            <h3 className="text-sm font-medium text-green-700 mb-4 uppercase tracking-wider">General Information</h3>
            <div className="space-y-3 bg-green-100/50 p-4 rounded-lg">
              <div className="grid grid-cols-3 gap-2">
                <span className="text-sm text-green-700">Event ID:</span>
                <span className="col-span-2 text-sm text-green-900 font-mono break-all">{event.event_id || event.id}</span>
              </div>
              <div className="grid grid-cols-3 gap-2">
                <span className="text-sm text-green-700">Camera:</span>
                <span className="col-span-2 text-sm text-green-900 font-mono">{event.camera_id}</span>
              </div>
              <div className="grid grid-cols-3 gap-2">
                <span className="text-sm text-green-700">Timestamp:</span>
                <span className="col-span-2 text-sm text-green-900">{new Date(event.timestamp).toLocaleString()}</span>
              </div>
            </div>
          </div>

          <div>
            <h3 className="text-sm font-medium text-green-700 mb-4 uppercase tracking-wider">Detection Details</h3>
            <div className="space-y-3 bg-green-100/50 p-4 rounded-lg">
              <div className="grid grid-cols-3 gap-2">
                <span className="text-sm text-green-700">Type:</span>
                <span className="col-span-2 text-sm text-green-900 uppercase">{event.event_type}</span>
              </div>
              <div className="grid grid-cols-3 gap-2">
                <span className="text-sm text-green-700">Identifier:</span>
                <span className="col-span-2 text-sm text-green-900 font-mono">{event.vehicle_number || 'N/A'}</span>
              </div>
              <div className="grid grid-cols-3 gap-2">
                <span className="text-sm text-green-700">Vehicle Type:</span>
                <span className="col-span-2 text-sm text-green-900 capitalize">{event.vehicle_type || 'N/A'}</span>
              </div>
              <div className="grid grid-cols-3 gap-2">
                <span className="text-sm text-green-700">Confidence:</span>
                <span className="col-span-2 text-sm text-green-900">
                  {event.confidence ? `${(event.confidence * 100).toFixed(1)}%` : 'N/A'}
                </span>
              </div>
            </div>
          </div>

          <div>
            <h3 className="text-sm font-medium text-green-700 mb-4 uppercase tracking-wider">Visual Evidence</h3>
            <div className="bg-green-100/50 p-4 rounded-lg flex items-center justify-center min-h-[200px] border border-green-300">
              {event.image_ref ? (
                <img src={event.image_ref} alt="Event Capture" className="max-w-full rounded-md" />
              ) : (
                <span className="text-sm text-green-600 text-center">
                  No image evidence available.
                  {event.bounding_box && (
                    <div className="mt-2 text-xs font-mono text-green-600">
                      BBox: {JSON.stringify(event.bounding_box)}
                    </div>
                  )}
                </span>
              )}
            </div>
          </div>

          {event.extra_metadata && Object.keys(event.extra_metadata).length > 0 && (
            <div>
              <h3 className="text-sm font-medium text-green-700 mb-4 uppercase tracking-wider">Metadata</h3>
              <div className="bg-green-100/50 p-4 rounded-lg overflow-x-auto">
                <pre className="text-xs text-green-800 font-mono">
                  {JSON.stringify(event.extra_metadata, null, 2)}
                </pre>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

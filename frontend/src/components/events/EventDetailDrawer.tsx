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
      <div className="fixed right-0 top-0 bottom-0 w-[500px] bg-gray-900 shadow-2xl z-50 flex flex-col border-l border-gray-800">
        <div className="flex items-center justify-between p-4 border-b border-gray-800">
          <h2 className="text-lg font-semibold text-white">Event Details</h2>
          <button onClick={onClose} className="p-1 hover:bg-gray-800 rounded-md text-gray-400 hover:text-white transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto flex-1 space-y-6">
          <div>
            <h3 className="text-sm font-medium text-gray-400 mb-4 uppercase tracking-wider">General Information</h3>
            <div className="space-y-3 bg-gray-800/50 p-4 rounded-lg">
              <div className="grid grid-cols-3 gap-2">
                <span className="text-sm text-gray-400">Event ID:</span>
                <span className="col-span-2 text-sm text-white font-mono break-all">{event.event_id || event.id}</span>
              </div>
              <div className="grid grid-cols-3 gap-2">
                <span className="text-sm text-gray-400">Camera:</span>
                <span className="col-span-2 text-sm text-white font-mono">{event.camera_id}</span>
              </div>
              <div className="grid grid-cols-3 gap-2">
                <span className="text-sm text-gray-400">Timestamp:</span>
                <span className="col-span-2 text-sm text-white">{new Date(event.timestamp).toLocaleString()}</span>
              </div>
            </div>
          </div>

          <div>
            <h3 className="text-sm font-medium text-gray-400 mb-4 uppercase tracking-wider">Detection Details</h3>
            <div className="space-y-3 bg-gray-800/50 p-4 rounded-lg">
              <div className="grid grid-cols-3 gap-2">
                <span className="text-sm text-gray-400">Type:</span>
                <span className="col-span-2 text-sm text-white uppercase">{event.event_type}</span>
              </div>
              <div className="grid grid-cols-3 gap-2">
                <span className="text-sm text-gray-400">Identifier:</span>
                <span className="col-span-2 text-sm text-white font-mono">{event.vehicle_number || 'N/A'}</span>
              </div>
              <div className="grid grid-cols-3 gap-2">
                <span className="text-sm text-gray-400">Vehicle Type:</span>
                <span className="col-span-2 text-sm text-white capitalize">{event.vehicle_type || 'N/A'}</span>
              </div>
              <div className="grid grid-cols-3 gap-2">
                <span className="text-sm text-gray-400">Confidence:</span>
                <span className="col-span-2 text-sm text-white">
                  {event.confidence ? `${(event.confidence * 100).toFixed(1)}%` : 'N/A'}
                </span>
              </div>
            </div>
          </div>

          <div>
            <h3 className="text-sm font-medium text-gray-400 mb-4 uppercase tracking-wider">Visual Evidence</h3>
            <div className="bg-gray-800/50 p-4 rounded-lg flex items-center justify-center min-h-[200px] border border-gray-700">
              {event.image_ref ? (
                <img src={event.image_ref} alt="Event Capture" className="max-w-full rounded-md" />
              ) : (
                <span className="text-sm text-gray-500 text-center">
                  No image evidence available.
                  {event.bounding_box && (
                    <div className="mt-2 text-xs font-mono text-gray-600">
                      BBox: {JSON.stringify(event.bounding_box)}
                    </div>
                  )}
                </span>
              )}
            </div>
          </div>

          {event.extra_metadata && Object.keys(event.extra_metadata).length > 0 && (
            <div>
              <h3 className="text-sm font-medium text-gray-400 mb-4 uppercase tracking-wider">Metadata</h3>
              <div className="bg-gray-800/50 p-4 rounded-lg overflow-x-auto">
                <pre className="text-xs text-gray-300 font-mono">
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

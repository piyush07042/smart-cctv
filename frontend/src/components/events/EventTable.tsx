import React from 'react';
import { Event } from '../../types/events';

interface Props {
  events: Event[];
  onViewDetails: (event: Event) => void;
}

export const EventTable: React.FC<Props> = ({ events, onViewDetails }) => {
  return (
    <div className="bg-white border-x border-green-200">
      <table className="w-full text-left border-collapse">
        <thead>
          <tr className="bg-green-100/50 text-green-700 text-xs uppercase tracking-wider">
            <th className="px-4 py-3 font-medium">Timestamp</th>
            <th className="px-4 py-3 font-medium">Type</th>
            <th className="px-4 py-3 font-medium">Identifier</th>
            <th className="px-4 py-3 font-medium">Camera</th>
            <th className="px-4 py-3 font-medium">Confidence</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-green-800">
          {events.length === 0 ? (
            <tr>
              <td colSpan={5} className="px-4 py-8 text-center text-green-600">
                No analytics events found.
              </td>
            </tr>
          ) : (
            events.map((evt) => (
              <tr 
                key={evt.id} 
                onClick={() => onViewDetails(evt)}
                className="hover:bg-green-100/50 transition-colors cursor-pointer group"
              >
                <td className="px-4 py-3 text-sm text-green-800 whitespace-nowrap">
                  {new Date(evt.timestamp).toLocaleString()}
                </td>
                <td className="px-4 py-3 text-sm">
                  <span className={`px-2 py-0.5 rounded text-xs font-medium uppercase ${
                    evt.event_type === 'anpr' ? 'bg-blue-500/20 text-green-700' : 'bg-purple-500/20 text-purple-400'
                  }`}>
                    {evt.event_type}
                  </span>
                </td>
                <td className="px-4 py-3 text-sm text-green-900 font-mono">
                  {evt.vehicle_number || '-'}
                </td>
                <td className="px-4 py-3 text-sm text-green-800">
                  {evt.camera_id}
                </td>
                <td className="px-4 py-3 text-sm">
                  {evt.confidence ? (
                    <span className="text-green-700">{(evt.confidence * 100).toFixed(1)}%</span>
                  ) : (
                    <span className="text-green-600">-</span>
                  )}
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
};

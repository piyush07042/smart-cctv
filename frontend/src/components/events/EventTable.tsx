import React from 'react';
import { Event } from '../../types/events';

interface Props {
  events: Event[];
  onViewDetails: (event: Event) => void;
}

export const EventTable: React.FC<Props> = ({ events, onViewDetails }) => {
  return (
    <div className="bg-gray-900 border-x border-gray-800">
      <table className="w-full text-left border-collapse">
        <thead>
          <tr className="bg-gray-800/50 text-gray-400 text-xs uppercase tracking-wider">
            <th className="px-4 py-3 font-medium">Timestamp</th>
            <th className="px-4 py-3 font-medium">Type</th>
            <th className="px-4 py-3 font-medium">Identifier</th>
            <th className="px-4 py-3 font-medium">Camera</th>
            <th className="px-4 py-3 font-medium">Confidence</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-800">
          {events.length === 0 ? (
            <tr>
              <td colSpan={5} className="px-4 py-8 text-center text-gray-500">
                No analytics events found.
              </td>
            </tr>
          ) : (
            events.map((evt) => (
              <tr 
                key={evt.id} 
                onClick={() => onViewDetails(evt)}
                className="hover:bg-gray-800/50 transition-colors cursor-pointer group"
              >
                <td className="px-4 py-3 text-sm text-gray-300 whitespace-nowrap">
                  {new Date(evt.timestamp).toLocaleString()}
                </td>
                <td className="px-4 py-3 text-sm">
                  <span className={`px-2 py-0.5 rounded text-xs font-medium uppercase ${
                    evt.event_type === 'anpr' ? 'bg-blue-500/20 text-blue-400' : 'bg-purple-500/20 text-purple-400'
                  }`}>
                    {evt.event_type}
                  </span>
                </td>
                <td className="px-4 py-3 text-sm text-white font-mono">
                  {evt.vehicle_number || '-'}
                </td>
                <td className="px-4 py-3 text-sm text-gray-300">
                  {evt.camera_id}
                </td>
                <td className="px-4 py-3 text-sm">
                  {evt.confidence ? (
                    <span className="text-green-400">{(evt.confidence * 100).toFixed(1)}%</span>
                  ) : (
                    <span className="text-gray-500">-</span>
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

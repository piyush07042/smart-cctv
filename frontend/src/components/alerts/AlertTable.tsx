import React from 'react';
import { Alert } from '../../types/alerts';
import { AlertTriangle, AlertCircle, ShieldAlert, CheckCircle } from 'lucide-react';

interface Props {
  alerts: Alert[];
  onViewDetails: (alert: Alert) => void;
}

export const AlertTable: React.FC<Props> = ({ alerts, onViewDetails }) => {
  return (
    <div className="bg-gray-900 border-x border-gray-800">
      <table className="w-full text-left border-collapse">
        <thead>
          <tr className="bg-gray-800/50 text-gray-400 text-xs uppercase tracking-wider">
            <th className="px-4 py-3 font-medium">Timestamp</th>
            <th className="px-4 py-3 font-medium">Status</th>
            <th className="px-4 py-3 font-medium">Severity</th>
            <th className="px-4 py-3 font-medium">Match</th>
            <th className="px-4 py-3 font-medium">Camera</th>
            <th className="px-4 py-3 font-medium">Repeats</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-800">
          {alerts.length === 0 ? (
            <tr>
              <td colSpan={6} className="px-4 py-8 text-center text-gray-500">
                No alerts found.
              </td>
            </tr>
          ) : (
            alerts.map((alert) => (
              <tr 
                key={alert.id} 
                onClick={() => onViewDetails(alert)}
                className="hover:bg-gray-800/50 transition-colors cursor-pointer group"
              >
                <td className="px-4 py-3 text-sm text-gray-300 whitespace-nowrap">
                  {new Date(alert.created_at).toLocaleString()}
                </td>
                <td className="px-4 py-3 text-sm">
                  <span className={`px-2 py-0.5 rounded text-xs font-medium capitalize flex items-center gap-1.5 w-max ${
                    alert.status === 'new' ? 'bg-red-500/20 text-red-400' :
                    alert.status === 'acknowledged' ? 'bg-yellow-500/20 text-yellow-400' :
                    alert.status === 'resolved' ? 'bg-green-500/20 text-green-400' :
                    'bg-gray-500/20 text-gray-400'
                  }`}>
                    {alert.status === 'new' && <AlertCircle className="w-3 h-3" />}
                    {alert.status === 'acknowledged' && <AlertTriangle className="w-3 h-3" />}
                    {alert.status === 'resolved' && <CheckCircle className="w-3 h-3" />}
                    {alert.status === 'false_positive' && <ShieldAlert className="w-3 h-3" />}
                    {alert.status.replace('_', ' ')}
                  </span>
                </td>
                <td className="px-4 py-3 text-sm">
                  <span className={`px-2 py-0.5 rounded text-xs font-medium uppercase ${
                    alert.severity === 'critical' ? 'text-red-400' :
                    alert.severity === 'high' ? 'text-orange-400' :
                    alert.severity === 'medium' ? 'text-yellow-400' :
                    'text-gray-400'
                  }`}>
                    {alert.severity}
                  </span>
                </td>
                <td className="px-4 py-3 text-sm text-white font-mono">
                  {alert.matched_identifier || '-'}
                </td>
                <td className="px-4 py-3 text-sm text-gray-300">
                  {alert.camera_id}
                </td>
                <td className="px-4 py-3 text-sm text-gray-400">
                  {alert.repeat_count}
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
};

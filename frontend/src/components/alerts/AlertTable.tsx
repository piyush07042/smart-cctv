import React from 'react';
import { Alert } from '../../types/alerts';
import { AlertTriangle, AlertCircle, ShieldAlert, CheckCircle } from 'lucide-react';

interface Props {
  alerts: Alert[];
  onViewDetails: (alert: Alert) => void;
}

export const AlertTable: React.FC<Props> = ({ alerts, onViewDetails }) => {
  return (
    <div className="bg-white border-x border-green-200">
      <table className="w-full text-left border-collapse">
        <thead>
          <tr className="bg-green-100/50 text-green-700 text-xs uppercase tracking-wider">
            <th className="px-4 py-3 font-medium">Timestamp</th>
            <th className="px-4 py-3 font-medium">Status</th>
            <th className="px-4 py-3 font-medium">Severity</th>
            <th className="px-4 py-3 font-medium">Match</th>
            <th className="px-4 py-3 font-medium">Camera</th>
            <th className="px-4 py-3 font-medium">Repeats</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-green-800">
          {alerts.length === 0 ? (
            <tr>
              <td colSpan={6} className="px-4 py-8 text-center text-green-600">
                No alerts found.
              </td>
            </tr>
          ) : (
            alerts.map((alert) => (
              <tr 
                key={alert.id} 
                onClick={() => onViewDetails(alert)}
                className="hover:bg-green-100/50 transition-colors cursor-pointer group"
              >
                <td className="px-4 py-3 text-sm text-green-800 whitespace-nowrap">
                  {new Date(alert.created_at).toLocaleString()}
                </td>
                <td className="px-4 py-3 text-sm">
                  <span className={`px-2 py-0.5 rounded text-xs font-medium capitalize flex items-center gap-1.5 w-max ${
                    alert.status === 'new' ? 'bg-red-500/20 text-red-700' :
                    alert.status === 'acknowledged' ? 'bg-yellow-500/20 text-yellow-700' :
                    alert.status === 'resolved' ? 'bg-green-500/20 text-green-700' :
                    'bg-green-500/20 text-green-700'
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
                    alert.severity === 'critical' ? 'text-red-700' :
                    alert.severity === 'high' ? 'text-orange-400' :
                    alert.severity === 'medium' ? 'text-yellow-700' :
                    'text-green-700'
                  }`}>
                    {alert.severity}
                  </span>
                </td>
                <td className="px-4 py-3 text-sm text-green-900 font-mono">
                  {alert.matched_identifier || '-'}
                </td>
                <td className="px-4 py-3 text-sm text-green-800">
                  {alert.camera_id}
                </td>
                <td className="px-4 py-3 text-sm text-green-700">
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

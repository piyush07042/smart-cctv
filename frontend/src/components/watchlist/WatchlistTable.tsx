import React from 'react';
import { WatchlistEntry } from '../../types/watchlist';

interface Props {
  watchlist: WatchlistEntry[];
  onEdit: (entry: WatchlistEntry) => void;
  canManage: boolean;
}

export const WatchlistTable: React.FC<Props> = ({ watchlist, onEdit, canManage }) => {
  return (
    <div className="bg-white border-x border-green-200">
      <table className="w-full text-left border-collapse">
        <thead>
          <tr className="bg-green-100/50 text-green-700 text-xs uppercase tracking-wider">
            <th className="px-4 py-3 font-medium">Identifier</th>
            <th className="px-4 py-3 font-medium">Type</th>
            <th className="px-4 py-3 font-medium">Category</th>
            <th className="px-4 py-3 font-medium">Severity</th>
            <th className="px-4 py-3 font-medium">Description</th>
            <th className="px-4 py-3 font-medium">Status</th>
            {canManage && <th className="px-4 py-3 font-medium text-right">Actions</th>}
          </tr>
        </thead>
        <tbody className="divide-y divide-green-800">
          {watchlist.length === 0 ? (
            <tr>
              <td colSpan={canManage ? 7 : 6} className="px-4 py-8 text-center text-green-600">
                No watchlist entries found.
              </td>
            </tr>
          ) : (
            watchlist.map((entry) => (
              <tr key={entry.id} className="hover:bg-green-100/50 transition-colors">
                <td className="px-4 py-3 text-sm text-green-900 font-mono">
                  {entry.identifier}
                </td>
                <td className="px-4 py-3 text-sm text-green-800 capitalize">
                  {entry.entity_type}
                </td>
                <td className="px-4 py-3 text-sm capitalize">
                  {entry.category}
                </td>
                <td className="px-4 py-3 text-sm">
                  <span className={`px-2 py-0.5 rounded text-xs font-medium uppercase ${
                    entry.severity === 'critical' ? 'bg-red-500/20 text-red-700' :
                    entry.severity === 'high' ? 'bg-orange-500/20 text-orange-400' :
                    entry.severity === 'medium' ? 'bg-yellow-500/20 text-yellow-700' :
                    'bg-green-500/20 text-green-700'
                  }`}>
                    {entry.severity || 'UNKNOWN'}
                  </span>
                </td>
                <td className="px-4 py-3 text-sm text-green-700 max-w-xs truncate" title={entry.description || ''}>
                  {entry.description || '-'}
                </td>
                <td className="px-4 py-3 text-sm">
                  {entry.is_active ? (
                    <span className="text-green-700 flex items-center gap-1.5"><div className="w-1.5 h-1.5 rounded-full bg-green-400"></div>Active</span>
                  ) : (
                    <span className="text-green-600 flex items-center gap-1.5"><div className="w-1.5 h-1.5 rounded-full bg-green-500"></div>Inactive</span>
                  )}
                </td>
                {canManage && (
                  <td className="px-4 py-3 text-sm text-right">
                    <button 
                      onClick={() => onEdit(entry)}
                      className="text-green-700 hover:text-blue-300 transition-colors px-2 py-1"
                    >
                      Edit
                    </button>
                  </td>
                )}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
};

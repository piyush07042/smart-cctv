import React from 'react';
import { WatchlistEntry } from '../../types/watchlist';

interface Props {
  watchlist: WatchlistEntry[];
  onEdit: (entry: WatchlistEntry) => void;
  canManage: boolean;
}

export const WatchlistTable: React.FC<Props> = ({ watchlist, onEdit, canManage }) => {
  return (
    <div className="bg-gray-900 border-x border-gray-800">
      <table className="w-full text-left border-collapse">
        <thead>
          <tr className="bg-gray-800/50 text-gray-400 text-xs uppercase tracking-wider">
            <th className="px-4 py-3 font-medium">Identifier</th>
            <th className="px-4 py-3 font-medium">Type</th>
            <th className="px-4 py-3 font-medium">Category</th>
            <th className="px-4 py-3 font-medium">Severity</th>
            <th className="px-4 py-3 font-medium">Description</th>
            <th className="px-4 py-3 font-medium">Status</th>
            {canManage && <th className="px-4 py-3 font-medium text-right">Actions</th>}
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-800">
          {watchlist.length === 0 ? (
            <tr>
              <td colSpan={canManage ? 7 : 6} className="px-4 py-8 text-center text-gray-500">
                No watchlist entries found.
              </td>
            </tr>
          ) : (
            watchlist.map((entry) => (
              <tr key={entry.id} className="hover:bg-gray-800/50 transition-colors">
                <td className="px-4 py-3 text-sm text-white font-mono">
                  {entry.identifier}
                </td>
                <td className="px-4 py-3 text-sm text-gray-300 capitalize">
                  {entry.entity_type}
                </td>
                <td className="px-4 py-3 text-sm capitalize">
                  {entry.category}
                </td>
                <td className="px-4 py-3 text-sm">
                  <span className={`px-2 py-0.5 rounded text-xs font-medium uppercase ${
                    entry.severity === 'critical' ? 'bg-red-500/20 text-red-400' :
                    entry.severity === 'high' ? 'bg-orange-500/20 text-orange-400' :
                    entry.severity === 'medium' ? 'bg-yellow-500/20 text-yellow-400' :
                    'bg-gray-500/20 text-gray-400'
                  }`}>
                    {entry.severity || 'UNKNOWN'}
                  </span>
                </td>
                <td className="px-4 py-3 text-sm text-gray-400 max-w-xs truncate" title={entry.description || ''}>
                  {entry.description || '-'}
                </td>
                <td className="px-4 py-3 text-sm">
                  {entry.is_active ? (
                    <span className="text-green-400 flex items-center gap-1.5"><div className="w-1.5 h-1.5 rounded-full bg-green-400"></div>Active</span>
                  ) : (
                    <span className="text-gray-500 flex items-center gap-1.5"><div className="w-1.5 h-1.5 rounded-full bg-gray-500"></div>Inactive</span>
                  )}
                </td>
                {canManage && (
                  <td className="px-4 py-3 text-sm text-right">
                    <button 
                      onClick={() => onEdit(entry)}
                      className="text-blue-400 hover:text-blue-300 transition-colors px-2 py-1"
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

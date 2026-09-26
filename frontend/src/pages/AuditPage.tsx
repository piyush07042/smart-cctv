import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '../api/client';
import { Shield, Clock, User, Activity } from 'lucide-react';
import { format, parseISO } from 'date-fns';

export const AuditPage: React.FC = () => {
  const { data, isLoading, error } = useQuery({
    queryKey: ['audit-logs'],
    queryFn: async () => {
      const resp = await apiClient.get('/audit/');
      return resp.data;
    }
  });

  return (
    <div className="h-full flex flex-col bg-green-50 text-green-800 overflow-auto">
      <div className="p-4 border-b border-green-200 bg-white shrink-0">
        <h1 className="text-xl font-bold text-green-900 flex items-center gap-3">
          <Shield className="w-5 h-5 text-green-600" />
          System Audit Logs
        </h1>
        <p className="text-sm text-green-700 mt-1">Read-only view of central system actions</p>
      </div>
      <div className="p-4">
        {isLoading && <div>Loading...</div>}
        {data && (
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-green-100/50 text-xs uppercase tracking-wider">
                <th className="px-4 py-3 font-medium">Time</th>
                <th className="px-4 py-3 font-medium">Actor</th>
                <th className="px-4 py-3 font-medium">Action</th>
                <th className="px-4 py-3 font-medium">Resource</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-green-800/50">
              {data.logs.map((log: any) => (
                <tr key={log.id} className="hover:bg-green-100/20">
                  <td className="px-4 py-3"><Clock className="inline w-3 h-3 mr-1"/> {format(parseISO(log.timestamp), 'PP HH:mm:ss')}</td>
                  <td className="px-4 py-3"><User className="inline w-3 h-3 mr-1"/> {log.actor} ({log.role})</td>
                  <td className="px-4 py-3"><span className="text-green-700">{log.action}</span></td>
                  <td className="px-4 py-3">{log.resource_type}: {log.resource_id}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

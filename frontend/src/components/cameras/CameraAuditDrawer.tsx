import React, { useEffect, useState } from 'react';
import { X, Clock, User, AlertCircle, Activity, FileText } from 'lucide-react';
import { format } from 'date-fns';
import { useQuery } from '@tanstack/react-query';
import { camerasApi } from '../../api/cameras';
import { CameraHealthHistory } from './CameraHealthHistory';

interface CameraAuditDrawerProps {
  cameraId: string;
  onClose: () => void;
}

export const CameraAuditDrawer: React.FC<CameraAuditDrawerProps> = ({ cameraId, onClose }) => {
  const [activeTab, setActiveTab] = useState<'audit' | 'health'>('audit');
  
  const { data: auditLogs, isLoading, error } = useQuery({
    queryKey: ['camera-audit', cameraId],
    queryFn: () => camerasApi.getAudit(cameraId)
  });

  // Prevent background scrolling
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = 'auto';
    };
  }, []);

  const getActionColor = (action: string) => {
    switch (action) {
      case 'CREATE': return 'text-green-400 bg-green-500/10 border-green-500/20';
      case 'UPDATE': return 'text-blue-400 bg-blue-500/10 border-blue-500/20';
      case 'ENABLE': return 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20';
      case 'DISABLE': return 'text-red-400 bg-red-500/10 border-red-500/20';
      default: return 'text-gray-400 bg-gray-500/10 border-gray-500/20';
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Drawer */}
      <div className="relative w-full max-w-md h-full bg-gray-900 border-l border-gray-800 shadow-2xl flex flex-col animate-slide-in-right">
        <div className="flex items-center justify-between p-6 pb-4 border-b border-gray-800 shrink-0">
          <div>
            <h2 className="text-lg font-bold text-white">Camera Details</h2>
            <p className="text-sm text-gray-400 font-mono mt-1">{cameraId}</p>
          </div>
          <button 
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors p-2 rounded-md hover:bg-gray-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex px-6 pt-2 border-b border-gray-800 shrink-0 gap-6">
          <button 
            onClick={() => setActiveTab('audit')}
            className={`pb-3 text-sm font-medium border-b-2 flex items-center gap-2 transition-colors ${activeTab === 'audit' ? 'border-blue-500 text-blue-400' : 'border-transparent text-gray-400 hover:text-gray-200'}`}
          >
            <FileText className="w-4 h-4" />
            Config Audit
          </button>
          <button 
            onClick={() => setActiveTab('health')}
            className={`pb-3 text-sm font-medium border-b-2 flex items-center gap-2 transition-colors ${activeTab === 'health' ? 'border-blue-500 text-blue-400' : 'border-transparent text-gray-400 hover:text-gray-200'}`}
          >
            <Activity className="w-4 h-4" />
            Health History
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">
          {activeTab === 'health' ? (
            <CameraHealthHistory cameraId={cameraId} />
          ) : isLoading ? (
            <div className="flex justify-center p-8 text-gray-500">Loading audit history...</div>
          ) : error ? (
            <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-md text-red-400 flex items-start gap-3">
              <AlertCircle className="w-5 h-5 shrink-0" />
              <p className="text-sm">Failed to load audit history. You may not have sufficient permissions.</p>
            </div>
          ) : auditLogs?.length === 0 ? (
            <div className="text-center p-8 text-gray-500">
              No audit logs found for this camera.
            </div>
          ) : (
            <div className="space-y-6 relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-gray-800 before:to-transparent">
              {auditLogs?.map((log) => (
                <div key={log.id} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
                  <div className="flex items-center justify-center w-10 h-10 rounded-full border border-gray-700 bg-gray-900 text-gray-500 shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 relative z-10">
                    <Clock className="w-4 h-4" />
                  </div>
                  
                  <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] bg-gray-950 p-4 rounded border border-gray-800">
                    <div className="flex items-center justify-between mb-2">
                      <span className={`text-xs font-bold px-2 py-0.5 rounded border ${getActionColor(log.action)}`}>
                        {log.action}
                      </span>
                      <time className="text-xs text-gray-500 font-mono">
                        {format(new Date(log.timestamp), 'MMM d, yyyy HH:mm:ss')}
                      </time>
                    </div>
                    
                    <div className="text-xs text-gray-400 mb-3 flex items-center gap-1">
                      <User className="w-3 h-3" />
                      {log.user_id ? 'Authenticated User' : 'System'}
                    </div>

                    {/* Diff display */}
                    {(log.old_value || log.new_value) && (
                      <div className="mt-3 text-xs bg-gray-900 p-3 rounded border border-gray-800 font-mono overflow-x-auto">
                        {log.action === 'UPDATE' && log.old_value && log.new_value ? (
                          <div className="space-y-1">
                            {Object.keys(log.new_value).map(key => {
                              if (key === 'credentials_changed') {
                                return <div key={key} className="text-yellow-400">* Stream credentials updated</div>;
                              }
                              // @ts-ignore
                              const oldV = log.old_value[key];
                              // @ts-ignore
                              const newV = log.new_value[key];
                              if (oldV !== newV) {
                                return (
                                  <div key={key} className="grid grid-cols-[auto_1fr] gap-x-2">
                                    <span className="text-gray-500">{key}:</span>
                                    <div>
                                      <span className="text-red-400 line-through mr-1">{String(oldV)}</span>
                                      <span className="text-green-400">{String(newV)}</span>
                                    </div>
                                  </div>
                                );
                              }
                              return null;
                            })}
                          </div>
                        ) : (
                          <pre className="text-gray-300">
                            {JSON.stringify(log.new_value || log.old_value, null, 2)}
                          </pre>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

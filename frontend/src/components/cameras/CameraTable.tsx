import React, { useState } from 'react';
import { Camera } from '../../types/camera';
import { CameraStatusChip } from './CameraStatusChip';
import { format } from 'date-fns';
import { MoreVertical, Edit, Power, PowerOff, FileText, Video } from 'lucide-react';
import { useAuthStore } from '../../stores/authStore';

interface CameraTableProps {
  cameras: Camera[];
  onEdit?: (camera: Camera) => void;
  onToggleStatus?: (camera: Camera) => void;
  onViewAudit?: (camera: Camera) => void;
}

export const CameraTable: React.FC<CameraTableProps> = ({ 
  cameras, 
  onEdit, 
  onToggleStatus, 
  onViewAudit 
}) => {
  const { user } = useAuthStore();
  const isAdmin = user?.role === 'ADMIN';
  const isOperator = user?.role === 'OPERATOR';
  const canAudit = isAdmin || isOperator;

  const [openMenuId, setOpenMenuId] = useState<string | null>(null);

  const toggleMenu = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setOpenMenuId(openMenuId === id ? null : id);
  };

  if (cameras.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-64 bg-gray-900 border border-gray-800 rounded-lg">
        <Video className="w-12 h-12 text-gray-700 mb-4" />
        <h3 className="text-lg font-medium text-gray-300">No cameras found</h3>
        <p className="text-gray-500 mt-1">Try adjusting your search or filters.</p>
      </div>
    );
  }

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-lg overflow-visible w-full">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm text-gray-400">
          <thead className="text-xs uppercase bg-gray-950/50 text-gray-500 border-b border-gray-800">
            <tr>
              <th scope="col" className="px-6 py-4 font-medium">ID</th>
              <th scope="col" className="px-6 py-4 font-medium">Name</th>
              <th scope="col" className="px-6 py-4 font-medium">Location</th>
              <th scope="col" className="px-6 py-4 font-medium">Protocol</th>
              <th scope="col" className="px-6 py-4 font-medium">State</th>
              <th scope="col" className="px-6 py-4 font-medium">Status</th>
              <th scope="col" className="px-6 py-4 font-medium">Last Heartbeat</th>
              <th scope="col" className="px-6 py-4 font-medium text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-800">
            {cameras.map((camera) => (
              <tr key={camera.id} className="hover:bg-gray-800/50 transition-colors">
                <td className="px-6 py-4 font-mono text-gray-300">{camera.camera_id}</td>
                <td className="px-6 py-4 text-white font-medium">{camera.name}</td>
                <td className="px-6 py-4">
                  <div className="flex flex-col">
                    <span>{camera.department || '—'}</span>
                    <span className="text-xs text-gray-500">{camera.zone || '—'}</span>
                  </div>
                </td>
                <td className="px-6 py-4">{camera.source_protocol || '—'}</td>
                <td className="px-6 py-4">
                  {camera.is_enabled ? (
                    <span className="text-green-400 text-xs font-medium px-2 py-1 bg-green-500/10 rounded-md border border-green-500/20">ENABLED</span>
                  ) : (
                    <span className="text-gray-500 text-xs font-medium px-2 py-1 bg-gray-500/10 rounded-md border border-gray-500/20">DISABLED</span>
                  )}
                </td>
                <td className="px-6 py-4">
                  <CameraStatusChip status={camera.status} />
                </td>
                <td className="px-6 py-4">
                  {camera.last_heartbeat ? format(new Date(camera.last_heartbeat), 'MMM d, HH:mm') : '—'}
                </td>
                <td className="px-6 py-4 text-right relative">
                  <button 
                    onClick={(e) => toggleMenu(camera.id, e)}
                    className="p-1.5 text-gray-400 hover:text-white rounded-md hover:bg-gray-700 transition-colors"
                  >
                    <MoreVertical className="w-5 h-5" />
                  </button>
                  
                  {openMenuId === camera.id && (
                    <>
                      <div className="fixed inset-0 z-10" onClick={() => setOpenMenuId(null)} />
                      <div className="absolute right-8 top-10 z-20 w-48 bg-gray-800 border border-gray-700 rounded-md shadow-xl py-1 overflow-hidden">
                        
                        {isAdmin && (
                          <>
                            <button 
                              onClick={() => { setOpenMenuId(null); onEdit?.(camera); }}
                              className="w-full text-left px-4 py-2 text-sm text-gray-300 hover:bg-gray-700 hover:text-white flex items-center gap-2"
                            >
                              <Edit className="w-4 h-4" /> Edit Configuration
                            </button>
                            <button 
                              onClick={() => { setOpenMenuId(null); onToggleStatus?.(camera); }}
                              className={`w-full text-left px-4 py-2 text-sm flex items-center gap-2 hover:bg-gray-700 ${camera.is_enabled ? 'text-red-400 hover:text-red-300' : 'text-green-400 hover:text-green-300'}`}
                            >
                              {camera.is_enabled ? (
                                <><PowerOff className="w-4 h-4" /> Disable Camera</>
                              ) : (
                                <><Power className="w-4 h-4" /> Enable Camera</>
                              )}
                            </button>
                            <div className="h-px bg-gray-700 my-1"></div>
                          </>
                        )}
                        
                        {canAudit && (
                          <button 
                            onClick={() => { setOpenMenuId(null); onViewAudit?.(camera); }}
                            className="w-full text-left px-4 py-2 text-sm text-gray-300 hover:bg-gray-700 hover:text-white flex items-center gap-2"
                          >
                            <FileText className="w-4 h-4" /> View Audit Trail
                          </button>
                        )}
                        
                        {/* Placeholder for video playback (Phase 5) */}
                        <button 
                          disabled
                          className="w-full text-left px-4 py-2 text-sm text-gray-600 flex items-center gap-2 cursor-not-allowed"
                          title="Available in Phase 5"
                        >
                          <Video className="w-4 h-4" /> View Live Feed
                        </button>
                      </div>
                    </>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

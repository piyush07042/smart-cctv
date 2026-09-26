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
      <div className="flex flex-col items-center justify-center h-64 bg-white border border-green-200 rounded-lg">
        <Video className="w-12 h-12 text-green-700 mb-4" />
        <h3 className="text-lg font-medium text-green-800">No cameras found</h3>
        <p className="text-green-600 mt-1">Try adjusting your search or filters.</p>
      </div>
    );
  }

  return (
    <div className="bg-white border border-green-200 rounded-lg overflow-visible w-full">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm text-green-700">
          <thead className="text-xs uppercase bg-green-50/50 text-green-600 border-b border-green-200">
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
          <tbody className="divide-y divide-green-800">
            {cameras.map((camera) => (
              <tr key={camera.id} className="hover:bg-green-100/50 transition-colors">
                <td className="px-6 py-4 font-mono text-green-800">{camera.camera_id}</td>
                <td className="px-6 py-4 text-green-900 font-medium">{camera.name}</td>
                <td className="px-6 py-4">
                  <div className="flex flex-col">
                    <span>{camera.department || '—'}</span>
                    <span className="text-xs text-green-600">{camera.zone || '—'}</span>
                  </div>
                </td>
                <td className="px-6 py-4">{camera.source_protocol || '—'}</td>
                <td className="px-6 py-4">
                  {camera.is_enabled ? (
                    <span className="text-green-700 text-xs font-medium px-2 py-1 bg-green-100 rounded-md border border-green-300">ENABLED</span>
                  ) : (
                    <span className="text-green-600 text-xs font-medium px-2 py-1 bg-green-100 rounded-md border border-green-300">DISABLED</span>
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
                    className="p-1.5 text-green-700 hover:text-green-900 rounded-md hover:bg-green-700 transition-colors"
                  >
                    <MoreVertical className="w-5 h-5" />
                  </button>
                  
                  {openMenuId === camera.id && (
                    <>
                      <div className="fixed inset-0 z-10" onClick={() => setOpenMenuId(null)} />
                      <div className="absolute right-8 top-10 z-20 w-48 bg-green-100 border border-green-300 rounded-md shadow-xl py-1 overflow-hidden">
                        
                        {isAdmin && (
                          <>
                            <button 
                              onClick={() => { setOpenMenuId(null); onEdit?.(camera); }}
                              className="w-full text-left px-4 py-2 text-sm text-green-800 hover:bg-green-700 hover:text-green-900 flex items-center gap-2"
                            >
                              <Edit className="w-4 h-4" /> Edit Configuration
                            </button>
                            <button 
                              onClick={() => { setOpenMenuId(null); onToggleStatus?.(camera); }}
                              className={`w-full text-left px-4 py-2 text-sm flex items-center gap-2 hover:bg-green-700 ${camera.is_enabled ? 'text-red-700 hover:text-red-300' : 'text-green-700 hover:text-green-300'}`}
                            >
                              {camera.is_enabled ? (
                                <><PowerOff className="w-4 h-4" /> Disable Camera</>
                              ) : (
                                <><Power className="w-4 h-4" /> Enable Camera</>
                              )}
                            </button>
                            <div className="h-px bg-green-700 my-1"></div>
                          </>
                        )}
                        
                        {canAudit && (
                          <button 
                            onClick={() => { setOpenMenuId(null); onViewAudit?.(camera); }}
                            className="w-full text-left px-4 py-2 text-sm text-green-800 hover:bg-green-700 hover:text-green-900 flex items-center gap-2"
                          >
                            <FileText className="w-4 h-4" /> View Audit Trail
                          </button>
                        )}
                        
                        {/* Placeholder for video playback (Phase 5) */}
                        <button 
                          disabled
                          className="w-full text-left px-4 py-2 text-sm text-green-600 flex items-center gap-2 cursor-not-allowed"
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

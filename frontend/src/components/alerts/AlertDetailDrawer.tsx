import React, { useState } from 'react';
import { X, ExternalLink } from 'lucide-react';
import { Alert } from '../../types/alerts';
import { useAlertActions } from '../../hooks/useAlerts';
import { useAuthStore } from '../../stores/authStore';

interface Props {
  alert: Alert | null;
  onClose: () => void;
  onAcknowledge: (id: string, notes?: string) => Promise<void>;
  onResolve: (id: string, notes?: string) => Promise<void>;
  onFalsePositive: (id: string, notes?: string) => Promise<void>;
}

export const AlertDetailDrawer: React.FC<Props> = ({ 
  alert, onClose, onAcknowledge, onResolve, onFalsePositive 
}) => {
  const { user } = useAuthStore();
  const canManage = user?.role === 'ADMIN' || user?.role === 'OPERATOR';
  const { data: actions = [], isLoading: isLoadingActions } = useAlertActions(alert?.id);
  
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!alert) return null;

  const handleAction = async (actionFn: (id: string, n?: string) => Promise<void>, confirmMsg: string) => {
    if (!confirm(confirmMsg)) return;
    setIsSubmitting(true);
    try {
      await actionFn(alert.id, notes);
      setNotes('');
    } catch (err) {
      console.error(err);
      window.alert('Action failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <div className="fixed inset-0 bg-black/50 z-40" onClick={onClose} />
      <div className="fixed right-0 top-0 bottom-0 w-[500px] bg-white shadow-2xl z-50 flex flex-col border-l border-green-200">
        <div className="flex items-center justify-between p-4 border-b border-green-200 shrink-0">
          <h2 className="text-lg font-semibold text-green-900 flex items-center gap-2">
            Alert Details
            <span className={`px-2 py-0.5 rounded text-xs font-medium uppercase border ${
              alert.severity === 'critical' ? 'border-red-500/50 text-red-700 bg-red-100' :
              alert.severity === 'high' ? 'border-orange-500/50 text-orange-400 bg-orange-500/10' :
              alert.severity === 'medium' ? 'border-yellow-500/50 text-yellow-700 bg-yellow-100' :
              'border-green-500/50 text-green-700 bg-green-100'
            }`}>
              {alert.severity}
            </span>
          </h2>
          <button onClick={onClose} className="p-1 hover:bg-green-100 rounded-md text-green-700 hover:text-green-900 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto flex-1 space-y-6">
          
          <div className="bg-green-100/50 p-4 rounded-lg space-y-3">
            <div className="grid grid-cols-3 gap-2">
              <span className="text-sm text-green-700">Status:</span>
              <span className="col-span-2 text-sm text-green-900 capitalize font-medium">{alert.status.replace('_', ' ')}</span>
            </div>
            <div className="grid grid-cols-3 gap-2">
              <span className="text-sm text-green-700">Identifier:</span>
              <span className="col-span-2 text-sm text-green-900 font-mono">{alert.matched_identifier}</span>
            </div>
            <div className="grid grid-cols-3 gap-2">
              <span className="text-sm text-green-700">Camera:</span>
              <span className="col-span-2 text-sm text-green-700 hover:underline cursor-pointer flex items-center gap-1" onClick={() => window.location.href='/cameras'}>
                {alert.camera_name || alert.camera_id} <ExternalLink className="w-3 h-3" />
              </span>
            </div>
            <div className="grid grid-cols-3 gap-2">
              <span className="text-sm text-green-700">Repeats:</span>
              <span className="col-span-2 text-sm text-green-900">{alert.repeat_count}</span>
            </div>
            <div className="grid grid-cols-3 gap-2">
              <span className="text-sm text-green-700">Confidence:</span>
              <span className="col-span-2 text-sm text-green-900">{alert.confidence ? `${(alert.confidence*100).toFixed(1)}%` : '-'}</span>
            </div>
            <div className="grid grid-cols-3 gap-2">
              <span className="text-sm text-green-700">Time:</span>
              <span className="col-span-2 text-sm text-green-800">{new Date(alert.created_at).toLocaleString()}</span>
            </div>
          </div>

          <div>
            <h3 className="text-sm font-medium text-green-700 mb-3 uppercase tracking-wider">Lifecycle</h3>
            <div className="space-y-3 bg-green-100/50 p-4 rounded-lg">
              {alert.acknowledged_by && (
                <div className="text-sm">
                  <span className="text-green-700">Acknowledged by: </span>
                  <span className="text-green-900">{alert.acknowledged_by}</span>
                  <span className="text-green-600 text-xs ml-2">({new Date(alert.acknowledged_at!).toLocaleString()})</span>
                </div>
              )}
              {alert.resolved_by && (
                <div className="text-sm">
                  <span className="text-green-700">Resolved by: </span>
                  <span className="text-green-900">{alert.resolved_by}</span>
                  <span className="text-green-600 text-xs ml-2">({new Date(alert.resolved_at!).toLocaleString()})</span>
                </div>
              )}
              {!alert.acknowledged_by && !alert.resolved_by && (
                <div className="text-sm text-green-600">Awaiting acknowledgment.</div>
              )}
            </div>
          </div>

          <div>
            <h3 className="text-sm font-medium text-green-700 mb-3 uppercase tracking-wider">Action History</h3>
            <div className="bg-green-100/50 p-4 rounded-lg">
              {isLoadingActions ? (
                <div className="text-sm text-green-600">Loading history...</div>
              ) : actions.length === 0 ? (
                <div className="text-sm text-green-600">No actions recorded.</div>
              ) : (
                <div className="space-y-4">
                  {actions.map((act) => (
                    <div key={act.id} className="relative pl-4 border-l-2 border-green-300">
                      <div className="absolute -left-[5px] top-1.5 w-2 h-2 rounded-full bg-blue-500" />
                      <div className="text-sm font-medium text-green-900 capitalize">{act.action.replace('_', ' ')}</div>
                      <div className="text-xs text-green-700">{new Date(act.timestamp).toLocaleString()}</div>
                      {act.notes && <div className="text-sm text-green-800 mt-1 italic">"{act.notes}"</div>}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
          
          <div className="text-xs text-green-600 font-mono space-y-1">
            <p>Alert ID: {alert.id}</p>
            <p>Event ID: {alert.detection_id}</p>
            <p>Watchlist ID: {alert.watchlist_entry_id}</p>
          </div>

        </div>

        {/* Action Bar */}
        {canManage && (alert.status === 'new' || alert.status === 'acknowledged') && (
          <div className="p-4 border-t border-green-200 bg-white/50">
            <input 
              type="text" 
              placeholder="Action notes (optional)..."
              value={notes}
              onChange={e => setNotes(e.target.value)}
              className="w-full bg-green-100 border border-green-300 rounded-md py-2 px-3 text-sm text-green-900 mb-3"
            />
            <div className="flex gap-2 justify-end">
              {alert.status === 'new' && (
                <>
                  <button 
                    onClick={() => handleAction(onFalsePositive, 'Mark as false positive?')}
                    disabled={isSubmitting}
                    className="px-3 py-1.5 bg-green-100 hover:bg-green-700 text-green-800 rounded text-sm transition-colors disabled:opacity-50"
                  >
                    False Positive
                  </button>
                  <button 
                    onClick={() => handleAction(onAcknowledge, 'Acknowledge this alert?')}
                    disabled={isSubmitting}
                    className="px-4 py-1.5 bg-green-600 hover:bg-green-700 text-white rounded text-sm font-medium transition-colors disabled:opacity-50"
                  >
                    Acknowledge
                  </button>
                </>
              )}
              {alert.status === 'acknowledged' && (
                <>
                  <button 
                    onClick={() => handleAction(onFalsePositive, 'Mark as false positive?')}
                    disabled={isSubmitting}
                    className="px-3 py-1.5 bg-green-100 hover:bg-green-700 text-green-800 rounded text-sm transition-colors disabled:opacity-50"
                  >
                    False Positive
                  </button>
                  <button 
                    onClick={() => handleAction(onResolve, 'Resolve this alert?')}
                    disabled={isSubmitting}
                    className="px-4 py-1.5 bg-green-600 hover:bg-green-700 text-white rounded text-sm font-medium transition-colors disabled:opacity-50"
                  >
                    Resolve
                  </button>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </>
  );
};

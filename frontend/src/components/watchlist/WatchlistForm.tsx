import React, { useState } from 'react';
import { X } from 'lucide-react';
import { WatchlistEntry } from '../../types/watchlist';

interface Props {
  initialData: WatchlistEntry | null;
  onSubmit: (data: any) => Promise<void>;
  onCancel: () => void;
  isLoading: boolean;
}

export const WatchlistForm: React.FC<Props> = ({ initialData, onSubmit, onCancel, isLoading }) => {
  const [formData, setFormData] = useState({
    entity_type: initialData?.entity_type || 'vehicle',
    identifier: initialData?.identifier || '',
    category: initialData?.category || 'stolen',
    severity: initialData?.severity || 'medium',
    description: initialData?.description || '',
    reference_case_no: initialData?.reference_case_no || '',
    expires_at: initialData?.expires_at ? new Date(initialData.expires_at).toISOString().slice(0, 16) : '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Simple frontend normalization for vehicle plates
    let identifier = formData.identifier.trim();
    if (formData.entity_type === 'vehicle') {
      identifier = identifier.toUpperCase().replace(/[\s-]/g, '');
    }

    const payload = {
      ...formData,
      identifier,
      expires_at: formData.expires_at ? new Date(formData.expires_at).toISOString() : null,
    };
    
    await onSubmit(payload);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-gray-900 border border-gray-800 rounded-xl shadow-2xl w-full max-w-lg flex flex-col max-h-[90vh]">
        <div className="flex items-center justify-between p-6 border-b border-gray-800 shrink-0">
          <h2 className="text-xl font-bold text-white">
            {initialData ? 'Edit Watchlist Entry' : 'Add Watchlist Entry'}
          </h2>
          <button 
            onClick={onCancel}
            className="text-gray-400 hover:text-white transition-colors p-1"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto flex-1">
          <form id="watchlistForm" onSubmit={handleSubmit} className="space-y-4">
            
            {!initialData && (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">Entity Type</label>
                  <select
                    required
                    value={formData.entity_type}
                    onChange={e => setFormData({ ...formData, entity_type: e.target.value })}
                    className="w-full bg-gray-800 border border-gray-700 rounded-md py-2 px-3 text-white focus:outline-none focus:border-blue-500"
                  >
                    <option value="vehicle">Vehicle</option>
                    <option value="person">Person</option>
                    <option value="other">Other</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">Identifier (Plate / ID)</label>
                  <input
                    type="text"
                    required
                    value={formData.identifier}
                    onChange={e => setFormData({ ...formData, identifier: e.target.value })}
                    className="w-full bg-gray-800 border border-gray-700 rounded-md py-2 px-3 text-white focus:outline-none focus:border-blue-500 font-mono"
                    placeholder="e.g. GJ 01 XX 0001"
                  />
                  {formData.entity_type === 'vehicle' && (
                    <p className="text-xs text-gray-500 mt-1">Will be normalized to uppercase without spaces (e.g., GJ01XX0001).</p>
                  )}
                </div>
              </>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">Category</label>
              <select
                required
                value={formData.category}
                onChange={e => setFormData({ ...formData, category: e.target.value })}
                className="w-full bg-gray-800 border border-gray-700 rounded-md py-2 px-3 text-white focus:outline-none focus:border-blue-500"
              >
                <option value="blacklisted">Blacklisted</option>
                <option value="stolen">Stolen</option>
                <option value="wanted">Wanted</option>
                <option value="missing">Missing</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">Severity</label>
              <select
                required
                value={formData.severity}
                onChange={e => setFormData({ ...formData, severity: e.target.value })}
                className="w-full bg-gray-800 border border-gray-700 rounded-md py-2 px-3 text-white focus:outline-none focus:border-blue-500"
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="critical">Critical</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">Reference Case No. (Optional)</label>
              <input
                type="text"
                value={formData.reference_case_no}
                onChange={e => setFormData({ ...formData, reference_case_no: e.target.value })}
                className="w-full bg-gray-800 border border-gray-700 rounded-md py-2 px-3 text-white focus:outline-none focus:border-blue-500"
                placeholder="e.g. FIR-2026-001"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">Expires At (Optional)</label>
              <input
                type="datetime-local"
                value={formData.expires_at}
                onChange={e => setFormData({ ...formData, expires_at: e.target.value })}
                className="w-full bg-gray-800 border border-gray-700 rounded-md py-2 px-3 text-white focus:outline-none focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">Description</label>
              <textarea
                value={formData.description}
                onChange={e => setFormData({ ...formData, description: e.target.value })}
                className="w-full bg-gray-800 border border-gray-700 rounded-md py-2 px-3 text-white focus:outline-none focus:border-blue-500"
                rows={3}
                placeholder="Details about the entry..."
              />
            </div>

          </form>
        </div>

        <div className="p-6 border-t border-gray-800 shrink-0 flex justify-between gap-3 bg-gray-900/50 rounded-b-xl">
          <div>
            {initialData && initialData.is_active && (
              <button
                type="button"
                onClick={async () => {
                  if (confirm("Are you sure you want to deactivate this entry? Historical events and alerts are preserved.")) {
                    await onSubmit({ ...formData, identifier: initialData.identifier, is_active: false });
                  }
                }}
                disabled={isLoading}
                className="px-4 py-2 bg-red-900/30 hover:bg-red-900/50 text-red-400 rounded-md transition-colors font-medium disabled:opacity-50"
              >
                Deactivate
              </button>
            )}
          </div>
          <div className="flex gap-3">
            <button
              type="button"
              onClick={onCancel}
              disabled={isLoading}
              className="px-4 py-2 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-md transition-colors font-medium disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              form="watchlistForm"
              disabled={isLoading}
              className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md transition-colors font-medium disabled:opacity-50 shadow-lg shadow-blue-900/20"
            >
              {isLoading ? 'Saving...' : 'Save Entry'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

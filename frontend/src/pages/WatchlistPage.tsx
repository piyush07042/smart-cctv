import React, { useRef, useState } from 'react';
import { useWatchlist } from '../hooks/useWatchlist';
import { WatchlistFiltersBar } from '../components/watchlist/WatchlistFiltersBar';
import { WatchlistTable } from '../components/watchlist/WatchlistTable';
import { WatchlistForm } from '../components/watchlist/WatchlistForm';
import { RefreshCw, Plus, Upload, X } from 'lucide-react';
import { useAuthStore } from '../stores/authStore';
import { WatchlistEntry } from '../types/watchlist';

export const WatchlistPage: React.FC = () => {
  const { user } = useAuthStore();
  const isAdmin = user?.role === 'ADMIN';

  const { 
    watchlist, 
    pagination, 
    isLoading, 
    error, 
    filters, 
    updateFilters, 
    refetch,
    createEntry,
    updateEntry,
    importCsv,
    isCreating,
    isUpdating,
    isImporting
  } = useWatchlist({ page: 1, page_size: 20 });

  const [showForm, setShowForm] = useState(false);
  const [editingEntry, setEditingEntry] = useState<WatchlistEntry | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [importResult, setImportResult] = useState<any>(null);

  const handlePageChange = (newPage: number) => {
    updateFilters({ page: newPage });
  };

  const handleFormSubmit = async (data: any) => {
    if (editingEntry) {
      await updateEntry({ id: editingEntry.id, data });
    } else {
      await createEntry(data);
    }
    setShowForm(false);
    setEditingEntry(null);
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const result = await importCsv(file);
      setImportResult(result);
    } catch (err) {
      console.error('Failed to import CSV', err);
      alert('CSV import failed');
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  return (
    <div className="p-6 h-full flex flex-col min-h-0">
      <div className="flex items-center justify-between mb-6 shrink-0">
        <div>
          <h1 className="text-2xl font-bold text-green-900">Watchlist</h1>
          <p className="text-green-700 mt-1">Manage vehicles and persons of interest</p>
        </div>
        
        <div className="flex gap-3">
          <button 
            onClick={() => refetch()} 
            className="flex items-center gap-2 px-3 py-2 bg-green-100 hover:bg-green-700 text-green-800 rounded-md transition-colors"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </button>

          {isAdmin && (
            <>
              <input 
                type="file" 
                accept=".csv" 
                className="hidden" 
                ref={fileInputRef} 
                onChange={handleFileChange} 
              />
              <button 
                onClick={() => fileInputRef.current?.click()} 
                disabled={isImporting}
                className="flex items-center gap-2 px-4 py-2 bg-green-100 hover:bg-green-700 text-green-800 rounded-md transition-colors disabled:opacity-50"
              >
                <Upload className="w-5 h-5" />
                {isImporting ? 'Importing...' : 'Import CSV'}
              </button>
              
              <button
                onClick={() => setShowForm(true)}
                className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white font-medium rounded-md transition-colors shadow-lg shadow-blue-900/20"
              >
                <Plus className="w-5 h-5" />
                Add Entry
              </button>
            </>
          )}
        </div>
      </div>

      {importResult && (
        <div className="mb-6 p-4 bg-green-100 rounded-lg border border-green-300 shrink-0">
          <div className="flex justify-between items-start">
            <div>
              <h3 className="text-lg font-medium text-green-900 mb-2">Import Results</h3>
              <p className="text-sm text-green-700 mb-1">Created: <span className="text-green-900">{importResult.created}</span></p>
              <p className="text-sm text-green-700 mb-1">Updated: <span className="text-green-900">{importResult.updated}</span></p>
              <p className="text-sm text-green-700">Skipped: <span className="text-green-900">{importResult.skipped}</span></p>
            </div>
            <button onClick={() => setImportResult(null)} className="text-green-700 hover:text-green-900">
              <X className="w-5 h-5" />
            </button>
          </div>
          {importResult.errors?.length > 0 && (
            <div className="mt-4 p-3 bg-red-900/20 border border-red-900/50 rounded text-sm text-red-700 max-h-32 overflow-y-auto">
              <p className="font-semibold mb-1">Errors:</p>
              <ul className="list-disc pl-5">
                {importResult.errors.map((err: any, i: number) => (
                  <li key={i}>Row {err.row}: {err.error}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      <div className="shrink-0">
        <WatchlistFiltersBar filters={filters} onChange={updateFilters} />
      </div>

      <div className="flex-1 overflow-auto min-h-0 relative">
        {error ? (
          <div className="p-6 bg-red-100 border border-red-300 rounded-lg text-red-700">
            <h3 className="text-lg font-medium mb-1">Failed to load watchlist</h3>
            <p>Please check your connection or try again later.</p>
          </div>
        ) : (
          <div className="h-full flex flex-col">
            <WatchlistTable 
              watchlist={watchlist} 
              canManage={isAdmin}
              onEdit={(entry) => { setEditingEntry(entry); setShowForm(true); }}
            />
            
            {pagination && pagination.pages > 1 && (
              <div className="flex items-center justify-between px-4 py-3 bg-white border border-t-0 border-green-200 shrink-0 mt-auto rounded-b-lg">
                <div className="text-sm text-green-700">
                  Showing <span className="font-medium text-green-900">{((pagination.page - 1) * pagination.page_size) + 1}</span> to <span className="font-medium text-green-900">{Math.min(pagination.page * pagination.page_size, pagination.total)}</span> of <span className="font-medium text-green-900">{pagination.total}</span> results
                </div>
                <div className="flex items-center gap-2">
                  <button
                    disabled={pagination.page <= 1}
                    onClick={() => handlePageChange(pagination.page - 1)}
                    className="px-3 py-1 bg-green-100 text-green-800 rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-green-700 text-sm"
                  >
                    Previous
                  </button>
                  <span className="text-sm text-green-700 mx-2">
                    Page {pagination.page} of {pagination.pages}
                  </span>
                  <button
                    disabled={pagination.page >= pagination.pages}
                    onClick={() => handlePageChange(pagination.page + 1)}
                    className="px-3 py-1 bg-green-100 text-green-800 rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-green-700 text-sm"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {showForm && (
        <WatchlistForm
          initialData={editingEntry}
          onSubmit={handleFormSubmit}
          onCancel={() => { setShowForm(false); setEditingEntry(null); }}
          isLoading={isCreating || isUpdating}
        />
      )}

      {/* Since editing happens via the form, we provide a deactivate button inside the edit form or a separate confirmation.
          Let's just add it inside the form if editing, or we can use deactivateConfirm. 
          Actually, I'll add a 'Deactivate' button inside the WatchlistForm. */}
    </div>
  );
};

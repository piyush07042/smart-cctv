import React from 'react';
import { LogOut, User, Bell, Wifi, WifiOff, RefreshCw } from 'lucide-react';
import { useAuthStore } from '../../stores/authStore';
import { useRealtimeStore } from '../../stores/realtimeStore';

export const TopBar: React.FC = () => {
  const { user, logout } = useAuthStore();
  const { status, liveAlerts } = useRealtimeStore();

  const newAlertsCount = Object.values(liveAlerts).filter(a => a.status === 'new').length;

  const renderStatus = () => {
    switch (status) {
      case 'Connected':
        return (
          <div className="flex items-center gap-2 text-xs font-medium px-2 py-1 bg-green-500/10 text-green-400 rounded-full border border-green-500/20">
            <Wifi className="w-3 h-3" />
            Live
          </div>
        );
      case 'Reconnecting':
        return (
          <div className="flex items-center gap-2 text-xs font-medium px-2 py-1 bg-yellow-500/10 text-yellow-400 rounded-full border border-yellow-500/20">
            <RefreshCw className="w-3 h-3 animate-spin" />
            Reconnecting
          </div>
        );
      case 'Disconnected':
        return (
          <div className="flex items-center gap-2 text-xs font-medium px-2 py-1 bg-red-500/10 text-red-400 rounded-full border border-red-500/20">
            <WifiOff className="w-3 h-3" />
            Disconnected
          </div>
        );
    }
  };

  return (
    <header className="h-16 bg-gray-900 border-b border-gray-800 flex items-center justify-between px-6 shrink-0">
      <div className="flex items-center gap-4">
        {renderStatus()}
      </div>
      
      <div className="flex items-center gap-6 text-gray-300">
        <button className="relative hover:text-white transition-colors" title="Alerts">
          <Bell className="w-5 h-5" />
          {newAlertsCount > 0 && (
            <span className="absolute -top-1 -right-1 flex items-center justify-center w-4 h-4 bg-red-500 text-[9px] font-bold text-white rounded-full">
              {newAlertsCount > 9 ? '9+' : newAlertsCount}
            </span>
          )}
        </button>
        
        <div className="flex items-center gap-3 pl-6 border-l border-gray-800">
          <div className="flex flex-col items-end">
            <span className="text-sm font-medium text-white">{user?.username}</span>
            <span className="text-xs text-gray-500 uppercase tracking-wider">{user?.role}</span>
          </div>
          <div className="w-9 h-9 rounded-full bg-gray-800 flex items-center justify-center border border-gray-700 text-gray-400">
            <User className="w-5 h-5" />
          </div>
          <button 
            onClick={() => logout()}
            className="p-2 ml-2 hover:bg-gray-800 rounded-md text-gray-400 hover:text-white transition-colors"
            title="Logout"
          >
            <LogOut className="w-5 h-5" />
          </button>
        </div>
      </div>
    </header>
  );
};

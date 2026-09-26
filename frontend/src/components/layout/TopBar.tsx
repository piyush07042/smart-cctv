import React from 'react';
import { useNavigate } from 'react-router-dom';
import { LogOut, User, Bell, Wifi, WifiOff, RefreshCw } from 'lucide-react';
import { useAuthStore } from '../../stores/authStore';
import { useRealtimeStore } from '../../stores/realtimeStore';

export const TopBar: React.FC = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();
  const { status, liveAlerts } = useRealtimeStore();

  const newAlertsCount = Object.values(liveAlerts).filter(a => a.status === 'new').length;

  const renderStatus = () => {
    switch (status) {
      case 'Connected':
        return (
          <div className="flex items-center gap-2 text-xs font-medium px-2 py-1 bg-red-100 text-red-700 rounded-full border border-red-300">
            <Wifi className="w-3 h-3" />
            Live
          </div>
        );
      case 'Reconnecting':
        return (
          <div className="flex items-center gap-2 text-xs font-medium px-2 py-1 bg-yellow-100 text-yellow-700 rounded-full border border-yellow-300">
            <RefreshCw className="w-3 h-3 animate-spin" />
            Reconnecting
          </div>
        );
      case 'Disconnected':
        return (
          <div className="flex items-center gap-2 text-xs font-medium px-2 py-1 bg-red-100 text-red-700 rounded-full border border-red-300">
            <WifiOff className="w-3 h-3" />
            Disconnected
          </div>
        );
    }
  };

  return (
    <header className="h-16 bg-white border-b border-green-200 flex items-center justify-between px-6 shrink-0">
      <div className="flex items-center gap-4">
        {renderStatus()}
      </div>
      
      <div className="flex items-center gap-6 text-green-800">
        <button 
          onClick={() => navigate('/alerts')}
          className="relative hover:text-green-900 transition-colors p-1" 
          title="View Active Alerts"
        >
          <Bell className="w-5 h-5 text-green-700 hover:text-green-900" />
          {newAlertsCount > 0 && (
            <span className="absolute -top-1 -right-1 flex items-center justify-center w-4 h-4 bg-red-500 text-[9px] font-bold text-white rounded-full">
              {newAlertsCount > 9 ? '9+' : newAlertsCount}
            </span>
          )}
        </button>
        
        <div className="flex items-center gap-3 pl-6 border-l border-green-200">
          <div className="flex flex-col items-end">
            <span className="text-sm font-medium text-green-900">{user?.username}</span>
            <span className="text-xs text-green-600 uppercase tracking-wider">{user?.role}</span>
          </div>
          <div className="w-9 h-9 rounded-full bg-green-100 flex items-center justify-center border border-green-300 text-green-700">
            <User className="w-5 h-5" />
          </div>
          <button 
            onClick={() => logout()}
            className="p-2 ml-2 hover:bg-green-100 rounded-md text-green-700 hover:text-green-900 transition-colors"
            title="Logout"
          >
            <LogOut className="w-5 h-5" />
          </button>
        </div>
      </div>
    </header>
  );
};

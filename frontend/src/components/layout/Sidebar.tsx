import React from 'react';
import { NavLink } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Video, 
  Map as MapIcon, 
  Activity, 
  Bell, 
  ShieldAlert, 
  Search, 
  FileText, 
  Settings,
  MonitorPlay
} from 'lucide-react';
import clsx from 'clsx';
import { useAuthStore } from '../../stores/authStore';

const navItems = [
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/cameras', label: 'Cameras', icon: Video },
  { to: '/cameras/live', label: 'Live Grid', icon: MonitorPlay },
  { to: '/map', label: 'Map', icon: MapIcon },
  { to: '/events', label: 'Events', icon: Activity },
  { to: '/alerts', label: 'Alerts', icon: Bell },
  { to: '/watchlist', label: 'Watchlist', icon: ShieldAlert },
  { to: '/search', label: 'Entity Search', icon: Search },
  { to: '/audit', label: 'Audit', icon: FileText, roles: ['ADMIN', 'OPERATOR'] },
  { to: '/settings', label: 'Settings', icon: Settings, roles: ['ADMIN'] },
];

export const Sidebar: React.FC = () => {
  const { user } = useAuthStore();

  return (
    <aside className="w-64 bg-gray-900 text-gray-300 flex flex-col h-full shrink-0 border-r border-gray-800">
      <div className="h-16 flex items-center px-6 border-b border-gray-800 shrink-0">
        <h1 className="text-xl font-bold text-white tracking-wider flex items-center gap-2">
          <ShieldAlert className="text-blue-500" />
          okDriver CCTV
        </h1>
      </div>
      <nav className="flex-1 overflow-y-auto py-4">
        <ul className="space-y-1 px-3">
          {navItems.map((item) => {
            if (item.roles && user && !item.roles.includes(user.role)) return null;
            
            return (
              <li key={item.to}>
                <NavLink
                  to={item.to}
                  className={({ isActive }) =>
                    clsx(
                      'flex items-center gap-3 px-3 py-2.5 rounded-md transition-colors text-sm font-medium',
                      isActive 
                        ? 'bg-blue-600/10 text-blue-400' 
                        : 'hover:bg-gray-800 hover:text-white'
                    )
                  }
                >
                  <item.icon className="w-5 h-5" />
                  {item.label}
                </NavLink>
              </li>
            );
          })}
        </ul>
      </nav>
    </aside>
  );
};

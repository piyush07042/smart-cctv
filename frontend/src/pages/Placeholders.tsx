import { 
  LayoutDashboard, 
  Activity, 
  Bell, 
  ShieldAlert, 
  Search, 
  FileText, 
  Settings 
} from 'lucide-react';

const PlaceholderPage = ({ title, icon: Icon, phase }: { title: string, icon: any, phase: number }) => (
  <div className="h-full flex flex-col items-center justify-center text-green-700 p-8 text-center">
    <div className="w-24 h-24 bg-white rounded-full flex items-center justify-center mb-6 border border-green-200">
      <Icon className="w-12 h-12 text-green-600" />
    </div>
    <h2 className="text-2xl font-bold text-green-900 mb-2">{title}</h2>
    <p className="max-w-md text-green-600">
      This module is scheduled for implementation in Phase {phase} of the okDriver CCTV platform roadmap.
    </p>
  </div>
);

export const DashboardPlaceholder = () => <PlaceholderPage title="Dashboard" icon={LayoutDashboard} phase={6} />;
export const EventsPlaceholder = () => <PlaceholderPage title="Events" icon={Activity} phase={5} />;
export const AlertsPlaceholder = () => <PlaceholderPage title="Alerts" icon={Bell} phase={5} />;
export const WatchlistPlaceholder = () => <PlaceholderPage title="Watchlist" icon={ShieldAlert} phase={6} />;
export const EntitySearchPlaceholder = () => <PlaceholderPage title="Entity Search" icon={Search} phase={6} />;
export const AuditPlaceholder = () => <PlaceholderPage title="System Audit Logs" icon={FileText} phase={7} />;
export const SettingsPlaceholder = () => <PlaceholderPage title="System Settings" icon={Settings} phase={7} />;

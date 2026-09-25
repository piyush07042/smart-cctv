import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getOverviewStats } from '../api/stats';
import { 
  LayoutDashboard, 
  Video, 
  AlertTriangle, 
  Activity, 
  Camera, 
  MapPin, 
  ShieldAlert,
  Loader2,
  RefreshCw
} from 'lucide-react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip as RechartsTooltip, 
  ResponsiveContainer 
} from 'recharts';
import { format, parseISO } from 'date-fns';

export const DashboardPage: React.FC = () => {
  const { data, isLoading, error, refetch, isFetching } = useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: getOverviewStats,
    refetchInterval: 30000, // Refresh every 30s
  });

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-red-400">
        <AlertTriangle className="w-12 h-12 mb-4" />
        <h2 className="text-xl font-semibold mb-2">Error Loading Dashboard</h2>
        <p className="text-gray-400">Unable to retrieve system statistics.</p>
        <button 
          onClick={() => refetch()}
          className="mt-4 px-4 py-2 bg-gray-800 hover:bg-gray-700 text-white rounded-md transition-colors"
        >
          Try Again
        </button>
      </div>
    );
  }

  // Format timeseries for chart
  const chartData = data.events.last_24h_series.map(d => ({
    time: format(parseISO(d.bucket), 'HH:mm'),
    count: d.count
  }));

  return (
    <div className="h-full flex flex-col bg-gray-950 overflow-y-auto">
      {/* Header */}
      <div className="p-6 border-b border-gray-800 flex justify-between items-center bg-gray-900 sticky top-0 z-10">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-3">
            <LayoutDashboard className="w-6 h-6 text-blue-500" />
            Operations Dashboard
          </h1>
          <p className="text-gray-400 mt-1">System overview and real-time statistics</p>
        </div>
        <button 
          onClick={() => refetch()}
          disabled={isFetching}
          className="flex items-center gap-2 px-4 py-2 bg-gray-800 hover:bg-gray-700 text-white rounded-md transition-colors disabled:opacity-50 text-sm font-medium border border-gray-700"
        >
          <RefreshCw className={`w-4 h-4 ${isFetching ? 'animate-spin' : ''}`} />
          {isFetching ? 'Refreshing...' : 'Refresh'}
        </button>
      </div>

      <div className="p-6 space-y-6 max-w-7xl mx-auto w-full">
        
        {/* Top KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-5 shadow-sm">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm font-medium text-gray-400">Total Cameras</p>
                <h3 className="text-3xl font-bold text-white mt-1">{data.cameras.total}</h3>
              </div>
              <div className="p-2 bg-blue-500/10 rounded-lg">
                <Video className="w-6 h-6 text-blue-500" />
              </div>
            </div>
            <div className="mt-4 flex items-center gap-4 text-xs font-medium">
              <span className="flex items-center gap-1 text-green-400">
                <span className="w-2 h-2 rounded-full bg-green-500"></span>
                {data.cameras.online} Online
              </span>
              <span className="flex items-center gap-1 text-amber-400">
                <span className="w-2 h-2 rounded-full bg-amber-500"></span>
                {data.cameras.degraded} Degraded
              </span>
              <span className="flex items-center gap-1 text-red-400">
                <span className="w-2 h-2 rounded-full bg-red-500"></span>
                {data.cameras.offline} Offline
              </span>
            </div>
          </div>

          <div className="bg-gray-900 border border-gray-800 rounded-xl p-5 shadow-sm">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm font-medium text-gray-400">Active Alerts</p>
                <h3 className="text-3xl font-bold text-white mt-1">{data.alerts.active}</h3>
              </div>
              <div className="p-2 bg-red-500/10 rounded-lg">
                <AlertTriangle className="w-6 h-6 text-red-500" />
              </div>
            </div>
            <div className="mt-4 flex items-center gap-3 text-xs font-medium">
              <span className="text-red-400 bg-red-500/10 px-2 py-0.5 rounded">
                Crit: {data.alerts.by_severity.critical || 0}
              </span>
              <span className="text-orange-400 bg-orange-500/10 px-2 py-0.5 rounded">
                High: {data.alerts.by_severity.high || 0}
              </span>
              <span className="text-yellow-400 bg-yellow-500/10 px-2 py-0.5 rounded">
                Med: {data.alerts.by_severity.medium || 0}
              </span>
            </div>
          </div>

          <div className="bg-gray-900 border border-gray-800 rounded-xl p-5 shadow-sm">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm font-medium text-gray-400">Events (Last Hour)</p>
                <h3 className="text-3xl font-bold text-white mt-1">{data.events.last_hour.toLocaleString()}</h3>
              </div>
              <div className="p-2 bg-purple-500/10 rounded-lg">
                <Activity className="w-6 h-6 text-purple-500" />
              </div>
            </div>
            <div className="mt-4 text-xs font-medium text-gray-400">
              <span className="text-white">{data.events.events_per_minute}</span> events / minute average
            </div>
          </div>

          <div className="bg-gray-900 border border-gray-800 rounded-xl p-5 shadow-sm">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm font-medium text-gray-400">System Status</p>
                <h3 className="text-xl font-bold text-green-400 mt-2">Operational</h3>
              </div>
              <div className="p-2 bg-green-500/10 rounded-lg">
                <ShieldAlert className="w-6 h-6 text-green-500" />
              </div>
            </div>
            <div className="mt-5 text-xs font-medium text-gray-500">
              Updated: {format(parseISO(data.generated_at), 'HH:mm:ss')}
            </div>
          </div>

        </div>

        {/* Charts & Lists */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Main Chart */}
          <div className="lg:col-span-2 bg-gray-900 border border-gray-800 rounded-xl p-5 shadow-sm flex flex-col">
            <h3 className="text-lg font-semibold text-white mb-4">Event Volume (Last 24h)</h3>
            <div className="flex-1 min-h-[300px]">
              {chartData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#374151" vertical={false} />
                    <XAxis 
                      dataKey="time" 
                      stroke="#9CA3AF" 
                      fontSize={12} 
                      tickLine={false} 
                      axisLine={false} 
                    />
                    <YAxis 
                      stroke="#9CA3AF" 
                      fontSize={12} 
                      tickLine={false} 
                      axisLine={false} 
                    />
                    <RechartsTooltip 
                      contentStyle={{ backgroundColor: '#1F2937', borderColor: '#374151', color: '#F9FAFB' }}
                      itemStyle={{ color: '#60A5FA' }}
                    />
                    <Bar dataKey="count" fill="#3B82F6" radius={[4, 4, 0, 0]} name="Events" />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center text-gray-500">
                  No event data available for the last 24 hours
                </div>
              )}
            </div>
          </div>

          {/* Top Cameras List */}
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-5 shadow-sm flex flex-col">
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <Camera className="w-5 h-5 text-gray-400" />
              Most Active Cameras
            </h3>
            <div className="flex-1">
              {data.top_cameras.length > 0 ? (
                <ul className="space-y-4">
                  {data.top_cameras.map((cam, i) => (
                    <li key={cam.camera_id} className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-6 text-center text-xs font-bold text-gray-500">{i + 1}</div>
                        <div>
                          <div className="text-sm font-medium text-white truncate max-w-[150px]" title={cam.camera_name}>
                            {cam.camera_name}
                          </div>
                          <div className="text-xs text-gray-500 flex items-center gap-1">
                            <MapPin className="w-3 h-3" /> {cam.camera_id}
                          </div>
                        </div>
                      </div>
                      <div className="text-sm font-bold text-blue-400 bg-blue-500/10 px-2 py-1 rounded">
                        {cam.event_count.toLocaleString()}
                      </div>
                    </li>
                  ))}
                </ul>
              ) : (
                <div className="h-full flex items-center justify-center text-gray-500 text-sm">
                  No activity recorded
                </div>
              )}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

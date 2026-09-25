import React from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { TopBar } from './TopBar';
import { useRealtime } from '../../realtime/useRealtime';

export const AppShell: React.FC = () => {
  useRealtime();
  
  return (
    <div className="flex h-screen w-screen bg-gray-950 text-gray-200 overflow-hidden font-sans">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <TopBar />
        <main className="flex-1 overflow-auto bg-gray-950">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

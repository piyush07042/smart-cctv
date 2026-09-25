import { createBrowserRouter, Navigate } from 'react-router-dom';
import { AppShell } from '../components/layout/AppShell';
import { ProtectedRoute } from '../components/auth/ProtectedRoute';
import { LoginPage } from '../pages/LoginPage';
import { CamerasPage } from '../pages/CamerasPage';
import { MapPage } from '../pages/MapPage';
import { CamerasLivePage } from '../pages/CamerasLivePage';
import { EventsPage } from '../pages/EventsPage';
import { AlertsPage } from '../pages/AlertsPage';
import { WatchlistPage } from '../pages/WatchlistPage';
import { DashboardPage } from '../pages/DashboardPage';
import { EntitySearchPage } from '../pages/EntitySearchPage';
import { VehicleTracePage } from '../pages/VehicleTracePage';
import {
  AuditPlaceholder,
  SettingsPlaceholder
} from '../pages/Placeholders';

export const router = createBrowserRouter([
  {
    path: '/login',
    element: <LoginPage />,
  },
  {
    path: '/',
    element: <ProtectedRoute />,
    children: [
      {
        path: '/',
        element: <AppShell />,
        children: [
          { index: true, element: <Navigate to="/dashboard" replace /> },
          { path: 'dashboard', element: <DashboardPage /> },
          { path: 'cameras', element: <CamerasPage /> },
          { path: 'cameras/live', element: <CamerasLivePage /> },
          { path: 'map', element: <MapPage /> },
          { path: 'events', element: <EventsPage /> },
          { path: 'alerts', element: <AlertsPage /> },
          { path: 'watchlist', element: <WatchlistPage /> },
          { path: 'search', element: <EntitySearchPage /> },
          { path: 'trace/:plate', element: <VehicleTracePage /> },
          {
            path: 'audit',
            element: <ProtectedRoute allowedRoles={['ADMIN', 'OPERATOR']} />,
            children: [{ index: true, element: <AuditPage /> }]
          },
          {
            path: 'settings',
            element: <ProtectedRoute allowedRoles={['ADMIN']} />,
            children: [{ index: true, element: <SettingsPlaceholder /> }]
          },
        ],
      },
    ],
  },
  {
    path: '*',
    element: <Navigate to="/" replace />,
  }
]);

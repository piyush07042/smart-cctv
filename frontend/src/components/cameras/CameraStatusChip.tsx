import React from 'react';
import clsx from 'clsx';
import { CameraStatus } from '../../types/camera';

export const CameraStatusChip: React.FC<{ status: CameraStatus }> = ({ status }) => {
  const getStyles = () => {
    switch (status) {
      case 'ONLINE':
        return 'bg-green-500/10 text-green-400 border-green-500/20';
      case 'DEGRADED':
        return 'bg-amber-500/10 text-amber-400 border-amber-500/20';
      case 'OFFLINE':
      default:
        return 'bg-gray-500/10 text-gray-400 border-gray-500/20';
    }
  };

  const getDotStyles = () => {
    switch (status) {
      case 'ONLINE':
        return 'bg-green-500';
      case 'DEGRADED':
        return 'bg-amber-500';
      case 'OFFLINE':
      default:
        return 'bg-gray-500';
    }
  };

  return (
    <div className={clsx("inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-xs font-medium uppercase tracking-wider", getStyles())}>
      <span className={clsx("w-1.5 h-1.5 rounded-full", getDotStyles())} />
      {status}
    </div>
  );
};

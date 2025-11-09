'use client';

// Warranty Status Badge Component

import { WarrantyStatus } from '@/types/warranty';
import {
  CheckCircle,
  AlertCircle,
  XCircle,
  Clock,
  Ban,
  Infinity,
} from 'lucide-react';

interface Props {
  status: WarrantyStatus;
  daysRemaining?: number | null;
  size?: 'sm' | 'md' | 'lg';
  showIcon?: boolean;
}

export default function WarrantyStatusBadge({
  status,
  daysRemaining,
  size = 'md',
  showIcon = true,
}: Props) {
  const statusConfig: Record<
    WarrantyStatus,
    {
      label: string;
      color: string;
      bgColor: string;
      icon: any;
    }
  > = {
    [WarrantyStatus.ACTIVE]: {
      label: 'Active',
      color: 'text-green-700',
      bgColor: 'bg-green-100',
      icon: CheckCircle,
    },
    [WarrantyStatus.EXPIRING_SOON]: {
      label: 'Expiring Soon',
      color: 'text-yellow-700',
      bgColor: 'bg-yellow-100',
      icon: AlertCircle,
    },
    [WarrantyStatus.EXPIRED]: {
      label: 'Expired',
      color: 'text-red-700',
      bgColor: 'bg-red-100',
      icon: XCircle,
    },
    [WarrantyStatus.CLAIMED]: {
      label: 'Claimed',
      color: 'text-blue-700',
      bgColor: 'bg-blue-100',
      icon: Clock,
    },
    [WarrantyStatus.VOID]: {
      label: 'Void',
      color: 'text-gray-700',
      bgColor: 'bg-gray-100',
      icon: Ban,
    },
    [WarrantyStatus.LIFETIME]: {
      label: 'Lifetime',
      color: 'text-purple-700',
      bgColor: 'bg-purple-100',
      icon: Infinity,
    },
  };

  const config = statusConfig[status];
  const Icon = config.icon;

  const sizeClasses = {
    sm: 'px-2 py-1 text-xs',
    md: 'px-3 py-1.5 text-sm',
    lg: 'px-4 py-2 text-base',
  };

  const iconSizes = {
    sm: 'h-3 w-3',
    md: 'h-4 w-4',
    lg: 'h-5 w-5',
  };

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full font-semibold ${config.color} ${config.bgColor} ${sizeClasses[size]}`}
    >
      {showIcon && <Icon className={iconSizes[size]} />}
      <span>{config.label}</span>
      {daysRemaining !== null &&
        daysRemaining !== undefined &&
        status !== WarrantyStatus.LIFETIME &&
        status !== WarrantyStatus.EXPIRED && (
          <span className="ml-1 opacity-75">
            ({daysRemaining}d)
          </span>
        )}
    </span>
  );
}

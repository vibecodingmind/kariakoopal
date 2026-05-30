'use client';

import { cn } from '@/lib/utils';

type StatusType = 'online' | 'offline' | 'busy' | 'pending' | 'active' | 'suspended';

interface StatusBadgeProps {
  status: StatusType;
  showLabel?: boolean;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const statusConfig: Record<StatusType, { color: string; bg: string; dot: string; pulse: boolean; labelKey: string }> = {
  online: { color: 'text-emerald-700 dark:text-emerald-400', bg: 'bg-emerald-50 dark:bg-emerald-950/50', dot: 'bg-emerald-500', pulse: true, labelKey: 'online' },
  offline: { color: 'text-gray-600 dark:text-gray-400', bg: 'bg-gray-50 dark:bg-gray-900/50', dot: 'bg-gray-400', pulse: false, labelKey: 'offline' },
  busy: { color: 'text-amber-700 dark:text-amber-400', bg: 'bg-amber-50 dark:bg-amber-950/50', dot: 'bg-amber-500', pulse: false, labelKey: 'busy' },
  pending: { color: 'text-amber-700 dark:text-amber-400', bg: 'bg-amber-50 dark:bg-amber-950/50', dot: 'bg-amber-400', pulse: false, labelKey: 'pending' },
  active: { color: 'text-emerald-700 dark:text-emerald-400', bg: 'bg-emerald-50 dark:bg-emerald-950/50', dot: 'bg-emerald-500', pulse: true, labelKey: 'active' },
  suspended: { color: 'text-red-700 dark:text-red-400', bg: 'bg-red-50 dark:bg-red-950/50', dot: 'bg-red-500', pulse: false, labelKey: 'trust_suspended' },
};

const sizeMap = {
  sm: { wrapper: 'text-xs px-1.5 py-0.5 gap-1', dot: 'size-1.5' },
  md: { wrapper: 'text-xs px-2 py-1 gap-1.5', dot: 'size-2' },
  lg: { wrapper: 'text-sm px-2.5 py-1 gap-2', dot: 'size-2.5' },
};

export function StatusBadge({ status, showLabel = true, size = 'md', className }: StatusBadgeProps) {
  const config = statusConfig[status];
  const sizeStyles = sizeMap[size];

  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full font-medium',
        config.bg,
        config.color,
        sizeStyles.wrapper,
        className
      )}
      role="status"
      aria-label={status}
    >
      <span className="relative flex items-center justify-center">
        <span className={cn('rounded-full', sizeStyles.dot, config.dot)} />
        {config.pulse && (
          <span
            className={cn(
              'absolute rounded-full animate-ping opacity-75',
              sizeStyles.dot,
              config.dot
            )}
          />
        )}
      </span>
      {showLabel && <span>{config.labelKey}</span>}
    </span>
  );
}

'use client';

import { useState, useCallback } from 'react';
import { useAuthStore } from '@/lib/stores/auth-store';
import { t } from '@/lib/i18n';
import { cn } from '@/lib/utils';
import {
  MapPin,
  Clock,
  ChevronUp,
  ChevronDown,
  Navigation,
  Package,
  Zap,
  Route,
} from 'lucide-react';

export interface RouteStop {
  id: string;
  zoneId: string;
  zoneName: string;
  zoneNameKey: string;
  items: string[];
  estimatedTime: number;
  color: string;
}

export interface RouteOptimizerProps {
  stops: RouteStop[];
  totalTime: number;
  totalDistance: string;
  language?: 'sw' | 'en';
  onReorder?: (stops: RouteStop[]) => void;
  onStartRoute?: () => void;
  className?: string;
}

export function RouteOptimizer({
  stops: initialStops,
  totalTime,
  totalDistance,
  language: langProp,
  onReorder,
  onStartRoute,
  className,
}: RouteOptimizerProps) {
  const { language: storeLang } = useAuthStore();
  const language = langProp || storeLang;
  const [stops, setStops] = useState<RouteStop[]>(initialStops);
  const [activeStopId, setActiveStopId] = useState<string | null>(null);
  const [isStarted, setIsStarted] = useState(false);

  const moveStop = useCallback(
    (index: number, direction: 'up' | 'down') => {
      if (
        (direction === 'up' && index === 0) ||
        (direction === 'down' && index === stops.length - 1)
      )
        return;
      const newStops = [...stops];
      const targetIndex = direction === 'up' ? index - 1 : index + 1;
      [newStops[index], newStops[targetIndex]] = [
        newStops[targetIndex],
        newStops[index],
      ];
      setStops(newStops);
      onReorder?.(newStops);
    },
    [stops, onReorder]
  );

  const handleStart = () => {
    setIsStarted(true);
    if (stops.length > 0) setActiveStopId(stops[0].id);
    onStartRoute?.();
  };

  // Compute cumulative ETA for each stop
  const cumulativeTimes = stops.reduce((acc: number[], stop, i) => {
    acc.push((acc[i - 1] || 0) + stop.estimatedTime);
    return acc;
  }, []);

  return (
    <div className={cn('space-y-4', className)}>
      {/* Header Card */}
      <div className="glass-card p-4 gradient-border">
        <div className="flex items-center gap-2 mb-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center">
            <Route className="w-5 h-5 text-white" />
          </div>
          <h2 className="text-lg font-bold gradient-text">
            {t('route_title', language)}
          </h2>
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-3 gap-2 mb-3">
          <div className="glass p-2.5 rounded-xl text-center">
            <Clock className="w-4 h-4 mx-auto mb-1 text-amber-500" />
            <p className="text-[10px] text-muted-foreground uppercase tracking-wide">
              {t('route_total_time', language)}
            </p>
            <p className="text-sm font-bold">
              {totalTime} {t('route_min', language)}
            </p>
          </div>
          <div className="glass p-2.5 rounded-xl text-center">
            <Navigation className="w-4 h-4 mx-auto mb-1 text-emerald-500" />
            <p className="text-[10px] text-muted-foreground uppercase tracking-wide">
              {t('route_total_distance', language)}
            </p>
            <p className="text-sm font-bold">{totalDistance}</p>
          </div>
          <div className="glass p-2.5 rounded-xl text-center">
            <Zap className="w-4 h-4 mx-auto mb-1 text-orange-500" />
            <p className="text-[10px] text-muted-foreground uppercase tracking-wide">
              {t('route_estimated_completion', language)}
            </p>
            <p className="text-sm font-bold">
              {cumulativeTimes[cumulativeTimes.length - 1] || 0}{' '}
              {t('route_min', language)}
            </p>
          </div>
        </div>

        {/* Heavy first suggestion badge */}
        <div className="flex items-center gap-2 mb-3">
          <div className="glass flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium">
            <Package className="w-3.5 h-3.5 text-amber-500" />
            <span>{t('route_heavy_first', language)}</span>
          </div>
        </div>

        {/* Start Route Button */}
        {!isStarted ? (
          <button
            onClick={handleStart}
            className="glass-button w-full h-11 flex items-center justify-center gap-2 text-base"
          >
            <Navigation className="w-4 h-4" />
            {t('route_start', language)}
          </button>
        ) : (
          <div className="glass p-2.5 rounded-xl flex items-center gap-2">
            <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-gentle-pulse" />
            <span className="text-sm font-medium text-emerald-600 dark:text-emerald-400">
              {t('route_active', language)}
            </span>
          </div>
        )}
      </div>

      {/* Timeline */}
      <div className="relative">
        {stops.map((stop, index) => {
          const isActive = activeStopId === stop.id;
          const isCompleted =
            isStarted && activeStopId
              ? stops.findIndex((s) => s.id === activeStopId) > index
              : false;

          return (
            <div key={stop.id} className="relative flex gap-3">
              {/* Timeline line + dot */}
              <div className="flex flex-col items-center">
                <div
                  className={cn(
                    'w-10 h-10 rounded-full flex items-center justify-center shrink-0 transition-all duration-300 border-2',
                    isActive
                      ? 'border-amber-500 bg-amber-500/20 amber-glow-sm scale-110'
                      : isCompleted
                        ? 'border-emerald-500 bg-emerald-500/20'
                        : 'border-[var(--glass-border)] bg-[var(--glass)]'
                  )}
                >
                  {isCompleted ? (
                    <svg
                      className="w-5 h-5 text-emerald-500"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={2.5}
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                  ) : (
                    <MapPin
                      className="w-4 h-4"
                      style={{ color: stop.color }}
                    />
                  )}
                </div>

                {/* Connecting line */}
                {index < stops.length - 1 && (
                  <div
                    className={cn(
                      'w-0.5 flex-1 min-h-8 transition-colors duration-300',
                      isCompleted ? 'bg-emerald-500/50' : 'bg-[var(--glass-border)]'
                    )}
                  />
                )}
              </div>

              {/* Stop content */}
              <div
                className={cn(
                  'flex-1 mb-3 glass-card p-4 gradient-border cursor-pointer transition-all',
                  isActive && 'ring-2 ring-amber-500/40 amber-glow-sm'
                )}
                onClick={() => isStarted && setActiveStopId(stop.id)}
              >
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                        {t('route_stop', language)} {index + 1}
                      </span>
                      <div
                        className="h-1.5 w-1.5 rounded-full"
                        style={{ backgroundColor: stop.color }}
                      />
                    </div>
                    <h3 className="font-bold text-base mt-0.5">
                      {t(stop.zoneNameKey, language)}
                    </h3>
                  </div>
                  <div className="flex gap-1">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        moveStop(index, 'up');
                      }}
                      disabled={index === 0}
                      className="glass w-7 h-7 rounded-lg flex items-center justify-center hover:bg-[var(--glass-hover)] transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                      aria-label={t('route_move_up', language)}
                    >
                      <ChevronUp className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        moveStop(index, 'down');
                      }}
                      disabled={index === stops.length - 1}
                      className="glass w-7 h-7 rounded-lg flex items-center justify-center hover:bg-[var(--glass-hover)] transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                      aria-label={t('route_move_down', language)}
                    >
                      <ChevronDown className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Items list */}
                <div className="flex flex-wrap gap-1.5 mb-2">
                  {stop.items.map((item, i) => (
                    <span
                      key={i}
                      className="glass px-2 py-0.5 rounded-full text-[11px] font-medium"
                    >
                      {item}
                    </span>
                  ))}
                </div>

                {/* Time & ETA */}
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    <span>
                      {stop.estimatedTime} {t('route_min', language)}
                    </span>
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="text-[10px] uppercase tracking-wider">
                      {t('route_eta', language)}
                    </span>
                    <span className="font-semibold text-foreground">
                      {cumulativeTimes[index]} {t('route_min', language)}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

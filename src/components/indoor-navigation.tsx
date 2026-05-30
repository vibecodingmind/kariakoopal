'use client';

import { useState, useMemo, useCallback } from 'react';
import {
  Navigation,
  MapPin,
  QrCode,
  ArrowLeft,
  ArrowRight,
  ArrowUp,
  Crosshair,
  DoorOpen,
  Store,
  Flag,
  Layers,
  ChevronRight,
  ScanLine,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { t, type Language } from '@/lib/i18n';
import { useAuthStore } from '@/lib/stores/auth-store';
import { cn } from '@/lib/utils';

// ── Types ──

interface Waypoint {
  id: string;
  label: string;
  x: number; // percentage 0-100
  y: number; // percentage 0-100
  type: 'stall' | 'junction' | 'exit' | 'landmark';
  direction?: 'straight' | 'left' | 'right';
  distance?: string;
  landmark?: string;
}

interface IndoorNavigationProps {
  zoneId: string;
  waypoints: Waypoint[];
  currentWaypointId: string;
  language?: 'sw' | 'en';
  className?: string;
}

// ── Direction icon helper ──

function DirectionIcon({ direction }: { direction: string }) {
  switch (direction) {
    case 'left':
      return <ArrowLeft className="size-4 text-amber-500" />;
    case 'right':
      return <ArrowRight className="size-4 text-amber-500" />;
    case 'straight':
      return <ArrowUp className="size-4 text-amber-500" />;
    default:
      return <ArrowUp className="size-4 text-amber-500" />;
  }
}

function WaypointTypeIcon({ type }: { type: Waypoint['type'] }) {
  switch (type) {
    case 'stall':
      return <Store className="size-3" />;
    case 'exit':
      return <DoorOpen className="size-3" />;
    case 'junction':
      return <Crosshair className="size-3" />;
    case 'landmark':
      return <Flag className="size-3" />;
    default:
      return <MapPin className="size-3" />;
  }
}

// ── Component ──

export function IndoorNavigation({
  zoneId,
  waypoints,
  currentWaypointId,
  language: languageProp,
  className,
}: IndoorNavigationProps) {
  const storeLanguage = useAuthStore((s) => s.language);
  const lang = languageProp || (storeLanguage as Language) || 'sw';

  const [selectedDestination, setSelectedDestination] = useState<string | null>(null);
  const [showQRScanner, setShowQRScanner] = useState(false);

  const currentIdx = useMemo(
    () => waypoints.findIndex((wp) => wp.id === currentWaypointId),
    [waypoints, currentWaypointId]
  );

  const destinationIdx = useMemo(
    () => (selectedDestination ? waypoints.findIndex((wp) => wp.id === selectedDestination) : -1),
    [waypoints, selectedDestination]
  );

  // Steps from current to destination
  const steps = useMemo(() => {
    if (destinationIdx < 0 || currentIdx < 0) return [];
    const start = Math.min(currentIdx, destinationIdx);
    const end = Math.max(currentIdx, destinationIdx);
    return waypoints.slice(start, end + 1);
  }, [waypoints, currentIdx, destinationIdx]);

  const handleScanQR = useCallback(() => {
    setShowQRScanner(true);
    setTimeout(() => setShowQRScanner(false), 2000);
  }, []);

  return (
    <div className={cn('glass-card gradient-border p-5 space-y-5', className)}>
      {/* ── Header ── */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="size-9 rounded-xl bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center shadow-lg shadow-amber-500/20">
            <Navigation className="size-4 text-white" />
          </div>
          <div>
            <h3 className="font-semibold text-sm gradient-text">
              {t('nav_indoor_title', lang)}
            </h3>
            <p className="text-[11px] text-muted-foreground">
              {t('nav_floor_plan', lang)}
            </p>
          </div>
        </div>
        <Button
          variant="outline"
          size="sm"
          className="h-8 text-[11px] gap-1 border-amber-200 dark:border-amber-800 text-amber-700 dark:text-amber-400"
          onClick={handleScanQR}
        >
          <ScanLine className="size-3.5" />
          {t('nav_scan_qr', lang)}
        </Button>
      </div>

      {/* ── QR Scanner simulation ── */}
      {showQRScanner && (
        <div className="glass rounded-xl p-4 text-center space-y-2 border border-amber-300 dark:border-amber-700">
          <QrCode className="size-12 mx-auto text-amber-500 animate-gentle-pulse" />
          <p className="text-xs text-amber-600 dark:text-amber-400 font-medium">
            {t('nav_scan_qr', lang)}...
          </p>
        </div>
      )}

      {/* ── Current location ── */}
      <div className="glass rounded-xl p-3 flex items-center gap-3">
        <div className="size-8 rounded-full bg-blue-500/20 flex items-center justify-center shrink-0">
          <Crosshair className="size-4 text-blue-500" />
        </div>
        <div className="flex-1">
          <p className="text-[10px] text-muted-foreground">{t('nav_current_location', lang)}</p>
          <p className="text-sm font-semibold">
            {waypoints[currentIdx]?.label || '—'}
          </p>
        </div>
        <Badge variant="outline" className="text-[10px]">
          {t('nav_waypoint', lang)} {currentIdx + 1}
        </Badge>
      </div>

      {/* ── Floor plan visualization ── */}
      <div className="glass rounded-xl p-3 space-y-2">
        <div className="flex items-center gap-1.5 text-[11px] font-medium text-muted-foreground">
          <Layers className="size-3 text-amber-500" />
          {t('nav_floor_plan', lang)}
        </div>

        <div className="relative h-44 rounded-lg bg-gradient-to-br from-amber-50/80 to-orange-50/80 dark:from-amber-900/20 dark:to-orange-900/20 overflow-hidden border border-amber-100 dark:border-amber-800/50">
          {/* Grid lines */}
          <div className="absolute inset-0 opacity-10">
            {Array.from({ length: 8 }).map((_, i) => (
              <div
                key={`h-${i}`}
                className="absolute w-full h-px bg-amber-600"
                style={{ top: `${(i + 1) * 12.5}%` }}
              />
            ))}
            {Array.from({ length: 6 }).map((_, i) => (
              <div
                key={`v-${i}`}
                className="absolute h-full w-px bg-amber-600"
                style={{ left: `${(i + 1) * 16.67}%` }}
              />
            ))}
          </div>

          {/* Waypoints */}
          {waypoints.map((wp, idx) => {
            const isCurrent = wp.id === currentWaypointId;
            const isDestination = wp.id === selectedDestination;
            const isOnPath = steps.some((s) => s.id === wp.id);

            return (
              <button
                key={wp.id}
                className={cn(
                  'absolute flex items-center justify-center rounded-full transition-all duration-300 border-2',
                  isCurrent
                    ? 'size-7 bg-blue-500 border-blue-300 shadow-lg shadow-blue-500/30 z-10'
                    : isDestination
                    ? 'size-6 bg-red-500 border-red-300 shadow-lg shadow-red-500/30 z-10'
                    : isOnPath
                    ? 'size-5 bg-amber-500 border-amber-300 shadow-md shadow-amber-500/20'
                    : 'size-4 bg-muted/60 border-muted-foreground/20'
                )}
                style={{
                  left: `${wp.x}%`,
                  top: `${wp.y}%`,
                  transform: 'translate(-50%, -50%)',
                }}
                onClick={() => setSelectedDestination(wp.id)}
                title={wp.label}
              >
                <span className="text-[9px] font-bold text-white">{idx + 1}</span>
                {/* Pulse for current */}
                {isCurrent && (
                  <div className="absolute -inset-2 rounded-full bg-blue-400/20 animate-ping" />
                )}
              </button>
            );
          })}

          {/* Path line connecting steps */}
          {steps.length > 1 && (
            <svg className="absolute inset-0 w-full h-full pointer-events-none">
              <polyline
                points={steps
                  .map((s) => `${s.x}%,${s.y}%`)
                  .join(' ')
                  .replace(/%/g, '')}
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeDasharray="4 2"
                className="text-amber-500"
              />
            </svg>
          )}

          {/* Zone label */}
          <div className="absolute bottom-1.5 right-2 text-[9px] font-medium text-amber-600/60 dark:text-amber-400/60">
            Zone: {zoneId}
          </div>
        </div>
      </div>

      {/* ── Destination selector ── */}
      <div className="space-y-1.5">
        <p className="text-[11px] font-medium text-muted-foreground">
          {t('nav_destination', lang)}
        </p>
        <div className="flex flex-wrap gap-1.5 max-h-20 overflow-y-auto">
          {waypoints
            .filter((wp) => wp.id !== currentWaypointId)
            .map((wp) => (
              <button
                key={wp.id}
                className={cn(
                  'inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-medium border transition-all duration-200',
                  selectedDestination === wp.id
                    ? 'bg-amber-500 text-white border-amber-500'
                    : 'bg-muted/30 border-border/50 text-muted-foreground hover:border-amber-300 hover:text-amber-700 dark:hover:text-amber-400'
                )}
                onClick={() => setSelectedDestination(wp.id)}
              >
                <WaypointTypeIcon type={wp.type} />
                {wp.label}
              </button>
            ))}
        </div>
      </div>

      {/* ── Direction steps ── */}
      {steps.length > 1 && (
        <div className="space-y-2">
          <p className="text-[11px] font-medium text-muted-foreground flex items-center gap-1">
            {t('nav_directions', lang)}
            <Badge variant="outline" className="text-[10px] px-1.5 py-0 ml-1">
              {steps.length - 1} {t('nav_step', lang)}{steps.length - 1 !== 1 ? 's' : ''}
            </Badge>
          </p>

          <div className="max-h-48 overflow-y-auto space-y-1.5 pr-1">
            {steps.map((step, idx) => {
              const isStepCurrent = step.id === currentWaypointId;

              return (
                <div
                  key={step.id}
                  className={cn(
                    'glass rounded-lg p-2.5 flex items-center gap-2.5 transition-all',
                    isStepCurrent && 'ring-1 ring-blue-300 dark:ring-blue-700'
                  )}
                >
                  {/* Step number */}
                  <div
                    className={cn(
                      'size-6 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0',
                      isStepCurrent
                        ? 'bg-blue-500 text-white'
                        : step.id === selectedDestination
                        ? 'bg-red-500 text-white'
                        : 'bg-amber-500/20 text-amber-600 dark:text-amber-400'
                    )}
                  >
                    {idx + 1}
                  </div>

                  {/* Direction */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      {step.direction && <DirectionIcon direction={step.direction} />}
                      <span className="text-xs font-medium truncate">
                        {step.label}
                      </span>
                    </div>
                    {step.landmark && (
                      <p className="text-[10px] text-muted-foreground mt-0.5">
                        {t('nav_landmark', lang)}: {step.landmark}
                      </p>
                    )}
                  </div>

                  {/* Distance */}
                  {step.distance && (
                    <span className="text-[10px] text-muted-foreground shrink-0">
                      {step.distance}
                    </span>
                  )}

                  <ChevronRight className="size-3 text-muted-foreground/40 shrink-0" />
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

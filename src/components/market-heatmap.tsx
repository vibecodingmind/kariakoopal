'use client';

import { useState, useMemo } from 'react';
import { useAuthStore } from '@/lib/stores/auth-store';
import { t } from '@/lib/i18n';
import { cn } from '@/lib/utils';
import {
  Users,
  Clock,
  TrendingUp,
  Activity,
  ThermometerSun,
} from 'lucide-react';

export interface HeatmapZone {
  zoneId: string;
  zoneName: string;
  zoneNameKey: string;
  color: string;
  currentDensity: number; // 0-100
  bestTime: string;
  busiestTime: string;
  avgSessionDuration: number; // minutes
}

export interface MarketHeatmapProps {
  zones: HeatmapZone[];
  language?: 'sw' | 'en';
  className?: string;
}

// Mock hourly density patterns (8am-6pm = 11 hours)
const MOCK_HOURLY_PATTERNS: Record<string, number[]> = {
  vyombo: [20, 35, 55, 70, 80, 65, 50, 40, 30, 25, 20],
  electronics: [15, 25, 45, 60, 75, 85, 70, 55, 40, 30, 20],
  fabric: [25, 40, 65, 85, 95, 80, 60, 45, 35, 25, 15],
  spices: [30, 50, 70, 60, 45, 35, 40, 55, 65, 50, 30],
  wholesale: [40, 60, 80, 90, 75, 55, 40, 30, 20, 15, 10],
};

const HOURS = ['8am', '9am', '10am', '11am', '12pm', '1pm', '2pm', '3pm', '4pm', '5pm', '6pm'];

function getDensityLevel(density: number): 'quiet' | 'moderate' | 'busy' {
  if (density < 40) return 'quiet';
  if (density < 70) return 'moderate';
  return 'busy';
}

function getDensityColor(density: number): string {
  if (density < 40) return 'bg-emerald-500';
  if (density < 70) return 'bg-amber-500';
  return 'bg-red-500';
}

function getDensityTextColor(density: number): string {
  if (density < 40) return 'text-emerald-600 dark:text-emerald-400';
  if (density < 70) return 'text-amber-600 dark:text-amber-400';
  return 'text-red-600 dark:text-red-400';
}

function getDensityBgColor(density: number): string {
  if (density < 40) return 'bg-emerald-500/10 border-emerald-500/20';
  if (density < 70) return 'bg-amber-500/10 border-amber-500/20';
  return 'bg-red-500/10 border-red-500/20';
}

export function MarketHeatmap({
  zones,
  language: langProp,
  className,
}: MarketHeatmapProps) {
  const { language: storeLang } = useAuthStore();
  const language = langProp || storeLang;
  const [selectedZone, setSelectedZone] = useState<string | null>(null);

  const enrichedZones = useMemo(
    () =>
      zones.map((zone) => ({
        ...zone,
        hourlyPattern:
          MOCK_HOURLY_PATTERNS[zone.zoneId] ||
          Array.from({ length: 11 }, () => Math.floor(Math.random() * 80) + 10),
      })),
    [zones]
  );

  const selected = enrichedZones.find((z) => z.zoneId === selectedZone);

  return (
    <div className={cn('space-y-4', className)}>
      {/* Header */}
      <div className="glass-card p-4 gradient-border">
        <div className="flex items-center gap-2 mb-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-red-400 to-orange-500 flex items-center justify-center">
            <ThermometerSun className="w-5 h-5 text-white" />
          </div>
          <h2 className="text-lg font-bold gradient-text">
            {t('heatmap_title', language)}
          </h2>
        </div>

        {/* Legend */}
        <div className="flex items-center gap-4 text-xs">
          <div className="flex items-center gap-1.5">
            <div className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
            <span>{t('heatmap_quiet', language)}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-2.5 h-2.5 rounded-full bg-amber-500" />
            <span>{t('heatmap_moderate', language)}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-2.5 h-2.5 rounded-full bg-red-500" />
            <span>{t('heatmap_busy', language)}</span>
          </div>
        </div>
      </div>

      {/* Zone Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {enrichedZones.map((zone) => {
          const level = getDensityLevel(zone.currentDensity);
          const isSelected = selectedZone === zone.zoneId;
          const isHighDensity = zone.currentDensity >= 70;

          return (
            <button
              key={zone.zoneId}
              onClick={() =>
                setSelectedZone(isSelected ? null : zone.zoneId)
              }
              className={cn(
                'glass-card p-4 gradient-border text-left transition-all',
                isSelected && 'ring-2 ring-amber-500/40',
                isHighDensity && 'animate-gentle-pulse'
              )}
            >
              {/* Zone header */}
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: zone.color }}
                  />
                  <h3 className="font-bold text-sm">
                    {t(zone.zoneNameKey, language)}
                  </h3>
                </div>
                <div
                  className={cn(
                    'px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border',
                    getDensityBgColor(zone.currentDensity),
                    getDensityTextColor(zone.currentDensity)
                  )}
                >
                  {t(`heatmap_${level}`, language)}
                </div>
              </div>

              {/* Density bar */}
              <div className="w-full h-2 rounded-full bg-[var(--glass)] mb-3 overflow-hidden">
                <div
                  className={cn(
                    'h-full rounded-full transition-all duration-700',
                    getDensityColor(zone.currentDensity)
                  )}
                  style={{ width: `${zone.currentDensity}%` }}
                />
              </div>

              {/* Stats row */}
              <div className="grid grid-cols-3 gap-2 text-[10px] text-muted-foreground">
                <div className="flex items-center gap-1">
                  <Clock className="w-3 h-3 shrink-0" />
                  <span>
                    {t('heatmap_best_time', language)}: {zone.bestTime}
                  </span>
                </div>
                <div className="flex items-center gap-1">
                  <TrendingUp className="w-3 h-3 shrink-0" />
                  <span>
                    {t('heatmap_busiest', language)}: {zone.busiestTime}
                  </span>
                </div>
                <div className="flex items-center gap-1">
                  <Activity className="w-3 h-3 shrink-0" />
                  <span>
                    {zone.avgSessionDuration}{t('route_min', language)}
                  </span>
                </div>
              </div>

              {/* Mini hourly bar chart */}
              <div className="mt-3 pt-2 border-t border-[var(--glass-border)]">
                <p className="text-[9px] uppercase tracking-wider text-muted-foreground mb-1.5">
                  {t('heatmap_hourly', language)}
                </p>
                <div className="flex items-end gap-[3px] h-8">
                  {zone.hourlyPattern.map((val, i) => (
                    <div key={i} className="flex-1 flex flex-col items-center gap-0.5">
                      <div
                        className={cn(
                          'w-full rounded-sm transition-all duration-300',
                          val < 40
                            ? 'bg-emerald-500/60'
                            : val < 70
                              ? 'bg-amber-500/60'
                              : 'bg-red-500/60'
                        )}
                        style={{ height: `${(val / 100) * 100}%` }}
                      />
                    </div>
                  ))}
                </div>
                <div className="flex gap-[3px] mt-1">
                  {HOURS.filter((_, i) => i % 2 === 0).map((h, i) => (
                    <div key={i} className="flex-1 text-center">
                      <span className="text-[7px] text-muted-foreground">
                        {h}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Current density indicator */}
              <div className="mt-2 flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <Users className="w-3.5 h-3.5 text-muted-foreground" />
                  <span className="text-[10px] text-muted-foreground">
                    {t('heatmap_now', language)}
                  </span>
                </div>
                <span
                  className={cn(
                    'text-xs font-bold',
                    getDensityTextColor(zone.currentDensity)
                  )}
                >
                  {zone.currentDensity}%
                </span>
              </div>
            </button>
          );
        })}
      </div>

      {/* Expanded detail for selected zone */}
      {selected && (
        <div className="glass-card p-4 gradient-border">
          <div className="flex items-center gap-2 mb-3">
            <div
              className="w-3 h-3 rounded-full"
              style={{ backgroundColor: selected.color }}
            />
            <h3 className="font-bold">
              {t(selected.zoneNameKey, language)}
            </h3>
            <span
              className={cn(
                'px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border',
                getDensityBgColor(selected.currentDensity),
                getDensityTextColor(selected.currentDensity)
              )}
            >
              {t(`heatmap_${getDensityLevel(selected.currentDensity)}`, language)}
            </span>
          </div>

          {/* Full hourly chart */}
          <div className="flex items-end gap-1 h-16">
            {selected.hourlyPattern.map((val, i) => (
              <div key={i} className="flex-1 flex flex-col items-center gap-1">
                <span className="text-[8px] text-muted-foreground">
                  {val}
                </span>
                <div
                  className={cn(
                    'w-full rounded-sm transition-all duration-500',
                    val < 40
                      ? 'bg-emerald-500/70'
                      : val < 70
                        ? 'bg-amber-500/70'
                        : 'bg-red-500/70'
                  )}
                  style={{ height: `${(val / 100) * 100}%` }}
                />
                <span className="text-[8px] text-muted-foreground">
                  {HOURS[i]}
                </span>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-3 gap-3 mt-4">
            <div className="glass p-2.5 rounded-xl text-center">
              <Clock className="w-4 h-4 mx-auto mb-1 text-emerald-500" />
              <p className="text-[10px] text-muted-foreground">
                {t('heatmap_best_time', language)}
              </p>
              <p className="text-sm font-bold">{selected.bestTime}</p>
            </div>
            <div className="glass p-2.5 rounded-xl text-center">
              <TrendingUp className="w-4 h-4 mx-auto mb-1 text-red-500" />
              <p className="text-[10px] text-muted-foreground">
                {t('heatmap_busiest', language)}
              </p>
              <p className="text-sm font-bold">{selected.busiestTime}</p>
            </div>
            <div className="glass p-2.5 rounded-xl text-center">
              <Activity className="w-4 h-4 mx-auto mb-1 text-amber-500" />
              <p className="text-[10px] text-muted-foreground">
                {t('heatmap_duration', language)}
              </p>
              <p className="text-sm font-bold">
                {selected.avgSessionDuration} {t('route_min', language)}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

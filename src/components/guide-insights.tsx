'use client';

import { useMemo } from 'react';
import {
  BarChart3,
  Clock,
  MapPin,
  TrendingUp,
  DollarSign,
  Repeat,
  Sparkles,
  ArrowUpRight,
  Award,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { t, type Language } from '@/lib/i18n';
import { useAuthStore } from '@/lib/stores/auth-store';
import { cn } from '@/lib/utils';

// ── Types ──

interface GuideInsightsProps {
  avgDuration: number; // minutes
  percentile: number; // 0-100
  topZone: string;
  revenue: number; // TZS
  repeatRate: number; // percentage 0-100
  weeklyEarnings: number[]; // 7 values for bar chart
  growthPercent: number;
  bestCategory: string;
  suggestion: string;
  language?: 'sw' | 'en';
  className?: string;
}

// ── Helpers ──

function formatTZS(n: number): string {
  return n.toLocaleString('en-TZ');
}

// ── Component ──

export function GuideInsights({
  avgDuration,
  percentile,
  topZone,
  revenue,
  repeatRate,
  weeklyEarnings,
  growthPercent,
  bestCategory,
  suggestion,
  language: languageProp,
  className,
}: GuideInsightsProps) {
  const storeLanguage = useAuthStore((s) => s.language);
  const lang = languageProp || (storeLanguage as Language) || 'sw';

  // Find max for bar chart scaling
  const maxEarning = useMemo(
    () => Math.max(...weeklyEarnings, 1),
    [weeklyEarnings]
  );

  const dayLabels = lang === 'sw'
    ? ['J1', 'J2', 'J3', 'J4', 'J5', 'J6', 'J7']
    : ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

  // Stat cards config
  const stats = [
    {
      icon: Clock,
      labelKey: 'insights_avg_duration',
      value: `${avgDuration}${lang === 'sw' ? 'dk' : 'min'}`,
      color: 'text-amber-600 dark:text-amber-400',
      bgColor: 'bg-amber-500/10',
    },
    {
      icon: TrendingUp,
      labelKey: 'insights_percentile',
      value: `${percentile}%`,
      color: 'text-emerald-600 dark:text-emerald-400',
      bgColor: 'bg-emerald-500/10',
    },
    {
      icon: MapPin,
      labelKey: 'insights_top_zone',
      value: topZone,
      color: 'text-violet-600 dark:text-violet-400',
      bgColor: 'bg-violet-500/10',
    },
    {
      icon: DollarSign,
      labelKey: 'insights_revenue',
      value: `${formatTZS(revenue)}`,
      color: 'text-amber-600 dark:text-amber-400',
      bgColor: 'bg-amber-500/10',
    },
    {
      icon: Repeat,
      labelKey: 'insights_repeat_rate',
      value: `${repeatRate}%`,
      color: 'text-sky-600 dark:text-sky-400',
      bgColor: 'bg-sky-500/10',
    },
    {
      icon: ArrowUpRight,
      labelKey: 'insights_growth',
      value: `+${growthPercent}%`,
      color: 'text-emerald-600 dark:text-emerald-400',
      bgColor: 'bg-emerald-500/10',
    },
  ];

  return (
    <div className={cn('glass-card gradient-border p-5 space-y-5', className)}>
      {/* ── Header ── */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="size-9 rounded-xl bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center shadow-lg shadow-amber-500/20">
            <BarChart3 className="size-4 text-white" />
          </div>
          <div>
            <h3 className="font-semibold text-sm gradient-text">
              {t('insights_title', lang)}
            </h3>
            <p className="text-[11px] text-muted-foreground">
              {t('insights_last_7_days', lang)}
            </p>
          </div>
        </div>
        <Badge className="bg-gradient-to-r from-amber-500 to-orange-500 text-white border-0 text-[10px] font-bold px-2.5 py-0.5">
          <TrendingUp className="size-3 mr-0.5" />
          +{growthPercent}%
        </Badge>
      </div>

      {/* ── Stat cards grid ── */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
        {stats.map((stat) => {
          const StatIcon = stat.icon;
          return (
            <div
              key={stat.labelKey}
              className="glass rounded-xl p-3 space-y-1.5"
            >
              <div className="flex items-center gap-1.5">
                <div
                  className={cn(
                    'size-6 rounded-md flex items-center justify-center',
                    stat.bgColor
                  )}
                >
                  <StatIcon className={cn('size-3', stat.color)} />
                </div>
                <span className="text-[10px] text-muted-foreground">
                  {t(stat.labelKey, lang)}
                </span>
              </div>
              <p className={cn('text-sm font-bold', stat.color)}>
                {stat.value}
              </p>
            </div>
          );
        })}
      </div>

      {/* ── Weekly earnings bar chart ── */}
      <div className="glass rounded-xl p-4 space-y-3">
        <p className="text-[11px] font-medium text-muted-foreground flex items-center gap-1">
          <BarChart3 className="size-3 text-amber-500" />
          {t('insights_trend', lang)}
        </p>

        <div className="flex items-end gap-1.5 h-24">
          {weeklyEarnings.map((earning, idx) => {
            const height = Math.max(8, (earning / maxEarning) * 100);
            const isToday = idx === weeklyEarnings.length - 1;

            return (
              <div
                key={idx}
                className="flex-1 flex flex-col items-center gap-1"
              >
                <span className="text-[8px] text-muted-foreground">
                  {formatTZS(earning)}
                </span>
                <div
                  className={cn(
                    'w-full rounded-t-md transition-all duration-500',
                    isToday
                      ? 'bg-gradient-to-t from-amber-500 to-orange-400'
                      : 'bg-amber-500/30'
                  )}
                  style={{ height: `${height}%` }}
                />
                <span
                  className={cn(
                    'text-[9px]',
                    isToday
                      ? 'text-amber-600 dark:text-amber-400 font-bold'
                      : 'text-muted-foreground'
                  )}
                >
                  {dayLabels[idx]}
                </span>
              </div>
            );
          })}
        </div>

        <div className="flex items-center justify-between text-[10px] text-muted-foreground pt-1">
          <span>{t('insights_earnings', lang)}</span>
          <span className="font-semibold text-amber-600 dark:text-amber-400">
            {formatTZS(weeklyEarnings.reduce((a, b) => a + b, 0))} {t('insights_tzs', lang)}
          </span>
        </div>
      </div>

      {/* ── Best category ── */}
      <div className="glass rounded-xl p-3 flex items-center gap-3">
        <div className="size-8 rounded-lg bg-amber-500/20 flex items-center justify-center shrink-0">
          <Award className="size-4 text-amber-600 dark:text-amber-400" />
        </div>
        <div>
          <p className="text-[10px] text-muted-foreground">{t('insights_best_category', lang)}</p>
          <p className="text-sm font-bold">{bestCategory}</p>
        </div>
      </div>

      {/* ── Specialization suggestion ── */}
      <div className="flex items-start gap-2.5 bg-amber-50 dark:bg-amber-900/15 rounded-xl p-3.5 border border-amber-200 dark:border-amber-800">
        <Sparkles className="size-4 text-amber-500 shrink-0 mt-0.5" />
        <div>
          <p className="text-xs font-semibold text-amber-700 dark:text-amber-400">
            {t('insights_suggestion', lang)}
          </p>
          <p className="text-[11px] text-amber-600/80 dark:text-amber-400/80 leading-relaxed">
            {t('insights_specialize', lang)} <strong>{suggestion}</strong>
          </p>
        </div>
      </div>
    </div>
  );
}

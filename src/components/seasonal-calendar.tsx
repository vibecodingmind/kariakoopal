'use client';

import { useState, useCallback } from 'react';
import {
  Calendar,
  Bell,
  MapPin,
  Lightbulb,
  Sparkles,
  Gift,
  Church,
  Sun,
  ShoppingBag,
  CheckCircle2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { t, type Language } from '@/lib/i18n';
import { useAuthStore } from '@/lib/stores/auth-store';
import { cn } from '@/lib/utils';

// ── Types ──

interface MarketEvent {
  id: string;
  title: string;
  date: string;
  type: 'cultural' | 'religious' | 'seasonal' | 'commercial';
  zonesAffected: string[];
  insiderTip: string;
  dateRange?: string;
}

interface SeasonalCalendarProps {
  events: MarketEvent[];
  onSetReminder: (eventId: string) => void;
  language?: 'sw' | 'en';
  className?: string;
}

// ── Event type config ──

const eventTypeConfig = {
  cultural: {
    icon: Sparkles,
    color: 'bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-300',
    border: 'border-violet-200 dark:border-violet-800',
    badgeBg: 'bg-violet-500',
    labelKey: 'calendar_type_cultural',
  },
  religious: {
    icon: Church,
    color: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300',
    border: 'border-emerald-200 dark:border-emerald-800',
    badgeBg: 'bg-emerald-500',
    labelKey: 'calendar_type_religious',
  },
  seasonal: {
    icon: Sun,
    color: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300',
    border: 'border-amber-200 dark:border-amber-800',
    badgeBg: 'bg-amber-500',
    labelKey: 'calendar_type_seasonal',
  },
  commercial: {
    icon: ShoppingBag,
    color: 'bg-sky-100 text-sky-700 dark:bg-sky-900/30 dark:text-sky-300',
    border: 'border-sky-200 dark:border-sky-800',
    badgeBg: 'bg-sky-500',
    labelKey: 'calendar_type_commercial',
  },
} as const;

// ── Component ──

export function SeasonalCalendar({
  events,
  onSetReminder,
  language: languageProp,
  className,
}: SeasonalCalendarProps) {
  const storeLanguage = useAuthStore((s) => s.language);
  const lang = languageProp || (storeLanguage as Language) || 'sw';

  const [reminderSet, setReminderSet] = useState<Set<string>>(new Set());

  const handleSetReminder = useCallback(
    (eventId: string) => {
      setReminderSet((prev) => new Set(prev).add(eventId));
      onSetReminder(eventId);
    },
    [onSetReminder]
  );

  return (
    <div className={cn('glass-card gradient-border p-5 space-y-5', className)}>
      {/* ── Header ── */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="size-9 rounded-xl bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center shadow-lg shadow-amber-500/20">
            <Calendar className="size-4 text-white" />
          </div>
          <div>
            <h3 className="font-semibold text-sm gradient-text">
              {t('calendar_title', lang)}
            </h3>
            <p className="text-[11px] text-muted-foreground">
              {t('calendar_upcoming', lang)}
            </p>
          </div>
        </div>
        <Badge variant="outline" className="text-[11px]">
          {events.length} {lang === 'sw' ? 'matukio' : 'events'}
        </Badge>
      </div>

      {/* ── Event type legend ── */}
      <div className="flex flex-wrap gap-2">
        {Object.entries(eventTypeConfig).map(([type, config]) => {
          const TypeIcon = config.icon;
          return (
            <div
              key={type}
              className={cn(
                'inline-flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-medium border',
                config.color,
                config.border
              )}
            >
              <TypeIcon className="size-3" />
              {t(config.labelKey, lang)}
            </div>
          );
        })}
      </div>

      {/* ── Event cards ── */}
      {events.length === 0 ? (
        <div className="flex flex-col items-center gap-2 py-6 text-center">
          <Calendar className="size-8 text-muted-foreground/40" />
          <p className="text-sm text-muted-foreground">
            {t('calendar_no_events', lang)}
          </p>
        </div>
      ) : (
        <div className="space-y-3 max-h-96 overflow-y-auto pr-1">
          {events.map((event) => {
            const typeConfig = eventTypeConfig[event.type];
            const TypeIcon = typeConfig.icon;
            const hasReminder = reminderSet.has(event.id);

            return (
              <div
                key={event.id}
                className={cn(
                  'glass rounded-xl p-4 space-y-3 transition-all duration-300',
                  `border ${typeConfig.border}`
                )}
              >
                {/* Title + type badge */}
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-start gap-2.5 flex-1 min-w-0">
                    <div
                      className={cn(
                        'size-8 rounded-lg flex items-center justify-center shrink-0',
                        typeConfig.color
                      )}
                    >
                      <TypeIcon className="size-4" />
                    </div>
                    <div className="min-w-0">
                      <h4 className="text-sm font-bold truncate">{event.title}</h4>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-[11px] text-muted-foreground flex items-center gap-1">
                          <Calendar className="size-3" />
                          {event.date}
                        </span>
                        {event.dateRange && (
                          <span className="text-[10px] text-muted-foreground">
                            ({event.dateRange})
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Type badge */}
                  <Badge
                    className={cn(
                      'text-[9px] text-white border-0 px-2 py-0.5 shrink-0',
                      typeConfig.badgeBg
                    )}
                  >
                    {t(typeConfig.labelKey, lang)}
                  </Badge>
                </div>

                {/* Zones affected */}
                <div className="space-y-1.5">
                  <p className="text-[10px] font-medium text-muted-foreground flex items-center gap-1">
                    <MapPin className="size-3 text-amber-500" />
                    {t('calendar_zones_affected', lang)}
                  </p>
                  <div className="flex flex-wrap gap-1">
                    {event.zonesAffected.map((zone, idx) => (
                      <Badge
                        key={idx}
                        variant="outline"
                        className="text-[10px] px-2 py-0.5 border-amber-200 dark:border-amber-800 text-amber-700 dark:text-amber-400"
                      >
                        {zone}
                      </Badge>
                    ))}
                  </div>
                </div>

                {/* Insider tip */}
                <div className="flex items-start gap-2 bg-amber-50 dark:bg-amber-900/15 rounded-lg p-2.5">
                  <Lightbulb className="size-3.5 text-amber-500 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-[10px] font-medium text-amber-600 dark:text-amber-400">
                      {t('calendar_insider_tip', lang)}
                    </p>
                    <p className="text-[11px] text-amber-700/70 dark:text-amber-400/70 leading-relaxed">
                      {event.insiderTip}
                    </p>
                  </div>
                </div>

                {/* Reminder button */}
                {hasReminder ? (
                  <div className="flex items-center gap-1.5 text-[11px] text-emerald-600 dark:text-emerald-400">
                    <CheckCircle2 className="size-3.5" />
                    {t('calendar_reminder_set', lang)}
                  </div>
                ) : (
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full h-8 text-[11px] font-medium border-amber-200 dark:border-amber-800 text-amber-700 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-900/20"
                    onClick={() => handleSetReminder(event.id)}
                  >
                    <Bell className="size-3.5 mr-1" />
                    {t('calendar_set_reminder', lang)}
                  </Button>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

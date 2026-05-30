'use client';

import { useState, useCallback, useMemo, useEffect } from 'react';
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
  ChevronLeft,
  ChevronRight,
  Filter,
  X,
  LayoutList,
  LayoutGrid,
  Info,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { t, type Language } from '@/lib/i18n';
import { useAuthStore } from '@/lib/stores/auth-store';
import { seasonalEventsApi, zonesApi, type SeasonalEvent, type Zone } from '@/lib/api';
import { cn } from '@/lib/utils';

// ── Types ──

interface CulturalCalendarProps {
  className?: string;
}

interface CalendarDay {
  date: Date;
  isCurrentMonth: boolean;
  isToday: boolean;
  events: CalendarEvent[];
}

interface CalendarEvent {
  id: string;
  title: string;
  titleSw: string;
  type: string;
  startDate: string;
  endDate: string;
  affectedZones: string[];
  insiderTip: string | null;
  insiderTipSw: string | null;
}

// ── Event type config ──

const eventTypeConfig: Record<string, {
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  border: string;
  badgeBg: string;
  dotColor: string;
  labelKey: string;
  labelSw: string;
  labelEn: string;
}> = {
  cultural: {
    icon: Sparkles,
    color: 'bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-300',
    border: 'border-violet-200 dark:border-violet-800',
    badgeBg: 'bg-violet-500',
    dotColor: 'bg-violet-500',
    labelKey: 'calendar_type_cultural',
    labelSw: 'Kitamaduni',
    labelEn: 'Cultural',
  },
  religious: {
    icon: Church,
    color: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300',
    border: 'border-emerald-200 dark:border-emerald-800',
    badgeBg: 'bg-emerald-500',
    dotColor: 'bg-emerald-500',
    labelKey: 'calendar_type_religious',
    labelSw: 'Kidini',
    labelEn: 'Religious',
  },
  seasonal: {
    icon: Sun,
    color: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300',
    border: 'border-amber-200 dark:border-amber-800',
    badgeBg: 'bg-amber-500',
    dotColor: 'bg-amber-500',
    labelKey: 'calendar_type_seasonal',
    labelSw: 'Msimu',
    labelEn: 'Seasonal',
  },
  commercial: {
    icon: ShoppingBag,
    color: 'bg-sky-100 text-sky-700 dark:bg-sky-900/30 dark:text-sky-300',
    border: 'border-sky-200 dark:border-sky-800',
    badgeBg: 'bg-sky-500',
    dotColor: 'bg-sky-500',
    labelKey: 'calendar_type_commercial',
    labelSw: 'Kibiashara',
    labelEn: 'Commercial',
  },
};

// ── Demo events ──

const demoEvents: CalendarEvent[] = [
  {
    id: 'demo-1',
    title: 'Kariakoo Cultural Festival',
    titleSw: 'Tamasha la Kitamaduni la Kariakoo',
    type: 'cultural',
    startDate: '2026-03-15',
    endDate: '2026-03-17',
    affectedZones: ['zone-vyombo', 'zone-spices'],
    insiderTip: 'Best time for fabric deals — vendors offer festival discounts up to 30%.',
    insiderTipSw: 'Wakati mzuri wa kupata punguzo la vitambaa — wauzaji wanatoa punguzo la tamasha hadi 30%.',
  },
  {
    id: 'demo-2',
    title: 'Ramadan Market Rush',
    titleSw: 'Msongamano wa Soko wa Ramadhani',
    type: 'religious',
    startDate: '2026-03-01',
    endDate: '2026-03-30',
    affectedZones: ['zone-spices', 'zone-wholesale', 'zone-fabric'],
    insiderTip: 'Spices and dates prices spike mid-Ramadan. Buy early or wait for post-Ramadan sales.',
    insiderTipSw: 'Bei za viungo na tende huongezeka katikati ya Ramadhani. Nunua mapema au subiri uuzaji baada ya Ramadhani.',
  },
  {
    id: 'demo-3',
    title: 'Harvest Season Bulk Deals',
    titleSw: 'Mashindano ya Jumla ya Mavuno',
    type: 'seasonal',
    startDate: '2026-04-01',
    endDate: '2026-05-31',
    affectedZones: ['zone-wholesale', 'zone-spices'],
    insiderTip: 'Wholesale zone offers bulk spices at harvest prices. Perfect time for bulk buying.',
    insiderTipSw: 'Eneo la jumla linatoa viungo kwa bei ya mavuno. Wakati mzuri wa kununua jumla.',
  },
  {
    id: 'demo-4',
    title: 'Electronics Fair Week',
    titleSw: 'Wiki ya Maonyesho ya Elektroniki',
    type: 'commercial',
    startDate: '2026-03-20',
    endDate: '2026-03-25',
    affectedZones: ['zone-electronics'],
    insiderTip: 'Verified vendors offer warranty extensions during fair week. Ask for the fair discount.',
    insiderTipSw: 'Wauzaji walioidhinishwa wanatoa nyongeza ya dhamana wakati wa wiki ya maonyesho. Uliza kuhusu punguzo la maonyesho.',
  },
  {
    id: 'demo-5',
    title: 'Eid Shopping Season',
    titleSw: 'Msimu wa Ununuzi wa Idd',
    type: 'religious',
    startDate: '2026-03-28',
    endDate: '2026-04-05',
    affectedZones: ['zone-fabric', 'zone-vyombo', 'zone-wholesale'],
    insiderTip: 'Fabric and kanga prices are highest 2 days before Eid. Shop 1 week early for best deals.',
    insiderTipSw: 'Bei za vitambaa na kanga ni za juu siku 2 kabla ya Idd. Nunua wiki 1 mapema kwa bei nzuri.',
  },
  {
    id: 'demo-6',
    title: 'Independence Day Market',
    titleSw: 'Soko la Siku ya Uhuru',
    type: 'cultural',
    startDate: '2026-12-09',
    endDate: '2026-12-12',
    affectedZones: ['zone-vyombo', 'zone-fabric', 'zone-spices'],
    insiderTip: 'Special cultural items available only during this period. Great for souvenirs.',
    insiderTipSw: 'Bidhaa maalum za kitamaduni zinapatikana tu kipindi hiki. Nzuri kwa ukumbusho.',
  },
];

// ── Helpers ──

function getDaysInMonth(year: number, month: number): number {
  return new Date(year, month + 1, 0).getDate();
}

function getFirstDayOfMonth(year: number, month: number): number {
  return new Date(year, month, 1).getDay();
}

function formatDate(dateStr: string): string {
  try {
    return new Date(dateStr).toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'short',
    });
  } catch {
    return dateStr;
  }
}

function isDateInRange(date: Date, startStr: string, endStr: string): boolean {
  const start = new Date(startStr);
  const end = new Date(endStr);
  return date >= start && date <= end;
}

// ── Component ──

export function CulturalCalendar({ className }: CulturalCalendarProps) {
  const storeLanguage = useAuthStore((s) => s.language);
  const lang = (storeLanguage as Language) || 'sw';

  // ── State ──
  const [events, setEvents] = useState<CalendarEvent[]>(demoEvents);
  const [zones, setZones] = useState<Zone[]>([]);
  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth());
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  const [reminderSet, setReminderSet] = useState<Set<string>>(new Set());
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [filterZone, setFilterZone] = useState<string>('all');
  const [filterType, setFilterType] = useState<string>('all');
  const [showFilters, setShowFilters] = useState(false);

  // ── Load data ──
  useEffect(() => {
    async function loadData() {
      try {
        const [eventResult, zoneResult] = await Promise.all([
          seasonalEventsApi.list(),
          zonesApi.list(),
        ]);
        setZones(zoneResult);
        if (eventResult.length > 0) {
          const mapped: CalendarEvent[] = eventResult.map((e: SeasonalEvent) => ({
            id: e.id,
            title: e.title,
            titleSw: e.titleSw || e.title,
            type: e.type || 'cultural',
            startDate: e.startDate,
            endDate: e.endDate,
            affectedZones: e.affectedZones || [],
            insiderTip: e.insiderTip,
            insiderTipSw: e.insiderTipSw,
          }));
          setEvents(mapped);
        }
      } catch {
        // API not available, use demo data
      }
    }
    loadData();
  }, []);

  // ── Filtered events ──
  const filteredEvents = useMemo(() => {
    return events.filter((event) => {
      if (filterZone !== 'all' && !event.affectedZones.includes(filterZone)) return false;
      if (filterType !== 'all' && event.type !== filterType) return false;
      return true;
    });
  }, [events, filterZone, filterType]);

  // ── Upcoming events ──
  const upcomingEvents = useMemo(() => {
    const now = new Date();
    return filteredEvents
      .filter((e) => new Date(e.endDate) >= now)
      .sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime());
  }, [filteredEvents]);

  // ── Calendar days ──
  const calendarDays = useMemo((): CalendarDay[] => {
    const days: CalendarDay[] = [];
    const daysInMonth = getDaysInMonth(currentYear, currentMonth);
    const firstDay = getFirstDayOfMonth(currentYear, currentMonth);
    const today = new Date();

    // Previous month days
    const prevMonth = currentMonth === 0 ? 11 : currentMonth - 1;
    const prevYear = currentMonth === 0 ? currentYear - 1 : currentYear;
    const daysInPrevMonth = getDaysInMonth(prevYear, prevMonth);
    for (let i = firstDay - 1; i >= 0; i--) {
      const date = new Date(prevYear, prevMonth, daysInPrevMonth - i);
      const dayEvents = filteredEvents.filter((e) => isDateInRange(date, e.startDate, e.endDate));
      days.push({
        date,
        isCurrentMonth: false,
        isToday: false,
        events: dayEvents,
      });
    }

    // Current month days
    for (let d = 1; d <= daysInMonth; d++) {
      const date = new Date(currentYear, currentMonth, d);
      const dayEvents = filteredEvents.filter((e) => isDateInRange(date, e.startDate, e.endDate));
      days.push({
        date,
        isCurrentMonth: true,
        isToday:
          date.getDate() === today.getDate() &&
          date.getMonth() === today.getMonth() &&
          date.getFullYear() === today.getFullYear(),
        events: dayEvents,
      });
    }

    // Next month days to fill grid
    const remaining = 42 - days.length;
    const nextMonth = currentMonth === 11 ? 0 : currentMonth + 1;
    const nextYear = currentMonth === 11 ? currentYear + 1 : currentYear;
    for (let d = 1; d <= remaining; d++) {
      const date = new Date(nextYear, nextMonth, d);
      const dayEvents = filteredEvents.filter((e) => isDateInRange(date, e.startDate, e.endDate));
      days.push({
        date,
        isCurrentMonth: false,
        isToday: false,
        events: dayEvents,
      });
    }

    return days;
  }, [currentYear, currentMonth, filteredEvents]);

  // ── Handlers ──
  const handlePrevMonth = useCallback(() => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear((y) => y - 1);
    } else {
      setCurrentMonth((m) => m - 1);
    }
  }, [currentMonth]);

  const handleNextMonth = useCallback(() => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear((y) => y + 1);
    } else {
      setCurrentMonth((m) => m + 1);
    }
  }, [currentMonth]);

  const handleSetReminder = useCallback((eventId: string) => {
    setReminderSet((prev) => new Set(prev).add(eventId));
  }, []);

  const handleDayClick = useCallback((day: CalendarDay) => {
    if (day.events.length > 0) {
      setSelectedEvent(day.events[0]);
    }
  }, []);

  const getZoneName = useCallback(
    (zoneId: string): string => {
      const zone = zones.find((z) => z.id === zoneId);
      if (!zone) return zoneId;
      return lang === 'sw' ? zone.nameSw : zone.name;
    },
    [zones, lang]
  );

  // ── Month names ──
  const monthNamesSw = [
    'Januari', 'Februari', 'Machi', 'Aprili', 'Mei', 'Juni',
    'Julai', 'Agosti', 'Septemba', 'Oktoba', 'Novemba', 'Desemba',
  ];
  const monthNamesEn = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December',
  ];
  const dayNamesShort = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];
  const dayNamesShortSw = ['Jp', 'Jt', 'Jn', 'Jt', 'Al', 'Ij', 'Jm'];

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
              {lang === 'sw' ? 'Kalenda ya Kitamaduni' : 'Cultural Calendar'}
            </h3>
            <p className="text-[11px] text-muted-foreground">
              {t('calendar_upcoming', lang)} • {upcomingEvents.length} {lang === 'sw' ? 'matukio' : 'events'}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1.5">
          {/* View mode toggle */}
          <div className="flex items-center glass rounded-lg p-0.5">
            <button
              onClick={() => setViewMode('grid')}
              className={cn(
                'size-7 rounded-md flex items-center justify-center transition-colors',
                viewMode === 'grid'
                  ? 'bg-gradient-to-br from-amber-500 to-orange-500 text-white'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              <LayoutGrid className="size-3.5" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={cn(
                'size-7 rounded-md flex items-center justify-center transition-colors',
                viewMode === 'list'
                  ? 'bg-gradient-to-br from-amber-500 to-orange-500 text-white'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              <LayoutList className="size-3.5" />
            </button>
          </div>
          {/* Filter toggle */}
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={cn(
              'size-7 rounded-lg glass flex items-center justify-center transition-colors',
              showFilters && 'ring-1 ring-amber-300 dark:ring-amber-700'
            )}
          >
            <Filter className="size-3.5 text-muted-foreground" />
          </button>
        </div>
      </div>

      {/* ── Event type legend ── */}
      <div className="flex flex-wrap gap-1.5">
        {Object.entries(eventTypeConfig).map(([type, config]) => {
          const TypeIcon = config.icon;
          return (
            <button
              key={type}
              onClick={() => setFilterType(filterType === type ? 'all' : type)}
              className={cn(
                'inline-flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-medium border transition-all',
                config.color,
                config.border,
                filterType === type && 'ring-2 ring-amber-400 ring-offset-1'
              )}
            >
              <TypeIcon className="size-3" />
              {lang === 'sw' ? config.labelSw : config.labelEn}
            </button>
          );
        })}
      </div>

      {/* ── Filters ── */}
      {showFilters && (
        <div className="glass rounded-xl p-3 space-y-2.5">
          <div className="flex items-center justify-between">
            <p className="text-[11px] font-medium text-muted-foreground flex items-center gap-1">
              <Filter className="size-3 text-amber-500" />
              {t('filters', lang)}
            </p>
            <button
              onClick={() => {
                setFilterZone('all');
                setFilterType('all');
              }}
              className="text-[10px] text-amber-600 dark:text-amber-400 font-medium hover:underline"
            >
              {t('clear_filters', lang)}
            </button>
          </div>

          <div className="flex gap-2">
            <Select value={filterType} onValueChange={setFilterType}>
              <SelectTrigger className="glass-input h-8 text-xs flex-1">
                <SelectValue placeholder={lang === 'sw' ? 'Aina ya tukio' : 'Event type'} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{lang === 'sw' ? 'Aina zote' : 'All types'}</SelectItem>
                {Object.entries(eventTypeConfig).map(([type, config]) => (
                  <SelectItem key={type} value={type}>
                    {lang === 'sw' ? config.labelSw : config.labelEn}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={filterZone} onValueChange={setFilterZone}>
              <SelectTrigger className="glass-input h-8 text-xs flex-1">
                <SelectValue placeholder={lang === 'sw' ? 'Eneo' : 'Zone'} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{lang === 'sw' ? 'Maeneo yote' : 'All zones'}</SelectItem>
                {zones.map((zone) => (
                  <SelectItem key={zone.id} value={zone.id}>
                    {lang === 'sw' ? zone.nameSw : zone.name}
                  </SelectItem>
                ))}
                {zones.length === 0 && (
                  <>
                    <SelectItem value="zone-vyombo">Vyombo / Utensils</SelectItem>
                    <SelectItem value="zone-fabric">Vitambaa / Fabric</SelectItem>
                    <SelectItem value="zone-electronics">Elektroniki / Electronics</SelectItem>
                    <SelectItem value="zone-spices">Viungo / Spices</SelectItem>
                    <SelectItem value="zone-wholesale">Jumla / Wholesale</SelectItem>
                  </>
                )}
              </SelectContent>
            </Select>
          </div>
        </div>
      )}

      {/* ── Calendar Grid View ── */}
      {viewMode === 'grid' && (
        <div className="space-y-3">
          {/* Month navigation */}
          <div className="flex items-center justify-between">
            <button
              onClick={handlePrevMonth}
              className="size-8 rounded-lg glass flex items-center justify-center hover:bg-amber-100/50 dark:hover:bg-amber-900/20 transition-colors"
            >
              <ChevronLeft className="size-4" />
            </button>
            <h4 className="text-sm font-bold">
              {lang === 'sw' ? monthNamesSw[currentMonth] : monthNamesEn[currentMonth]} {currentYear}
            </h4>
            <button
              onClick={handleNextMonth}
              className="size-8 rounded-lg glass flex items-center justify-center hover:bg-amber-100/50 dark:hover:bg-amber-900/20 transition-colors"
            >
              <ChevronRight className="size-4" />
            </button>
          </div>

          {/* Day names header */}
          <div className="grid grid-cols-7 gap-1">
            {(lang === 'sw' ? dayNamesShortSw : dayNamesShort).map((name, i) => (
              <div
                key={i}
                className="text-center text-[10px] font-medium text-muted-foreground py-1"
              >
                {name}
              </div>
            ))}
          </div>

          {/* Calendar grid */}
          <div className="grid grid-cols-7 gap-1">
            {calendarDays.map((day, idx) => {
              const hasEvents = day.events.length > 0;
              const eventTypes = [...new Set(day.events.map((e) => e.type))];

              return (
                <button
                  key={idx}
                  onClick={() => hasEvents && handleDayClick(day)}
                  className={cn(
                    'relative aspect-square rounded-lg flex flex-col items-center justify-center text-[11px] transition-all duration-200',
                    day.isCurrentMonth
                      ? 'text-foreground'
                      : 'text-muted-foreground/40',
                    day.isToday && 'ring-2 ring-amber-400 ring-offset-1',
                    hasEvents && 'hover:bg-amber-50/50 dark:hover:bg-amber-900/10 cursor-pointer',
                    !hasEvents && 'cursor-default'
                  )}
                >
                  <span
                    className={cn(
                      'font-medium',
                      day.isToday && 'size-6 rounded-full bg-gradient-to-br from-amber-500 to-orange-500 text-white flex items-center justify-center'
                    )}
                  >
                    {day.date.getDate()}
                  </span>
                  {/* Event dots */}
                  {hasEvents && (
                    <div className="flex items-center gap-0.5 mt-0.5">
                      {eventTypes.slice(0, 3).map((type, ti) => {
                        const config = eventTypeConfig[type];
                        return (
                          <div
                            key={ti}
                            className={cn('size-1.5 rounded-full', config?.dotColor || 'bg-amber-500')}
                          />
                        );
                      })}
                      {eventTypes.length > 3 && (
                        <span className="text-[7px] text-muted-foreground">+</span>
                      )}
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* ── Event Detail Modal ── */}
      {selectedEvent && (
        <div className="glass rounded-xl p-4 space-y-3 relative">
          <button
            onClick={() => setSelectedEvent(null)}
            className="absolute top-3 right-3 size-6 rounded-md glass flex items-center justify-center hover:bg-red-50 dark:hover:bg-red-900/20 text-muted-foreground hover:text-red-500 transition-colors"
          >
            <X className="size-3.5" />
          </button>

          {(() => {
            const typeConfig = eventTypeConfig[selectedEvent.type] || eventTypeConfig.cultural;
            const TypeIcon = typeConfig.icon;
            const hasReminder = reminderSet.has(selectedEvent.id);

            return (
              <>
                {/* Title + type badge */}
                <div className="flex items-start gap-2.5 pr-8">
                  <div
                    className={cn(
                      'size-8 rounded-lg flex items-center justify-center shrink-0',
                      typeConfig.color
                    )}
                  >
                    <TypeIcon className="size-4" />
                  </div>
                  <div className="min-w-0">
                    <h4 className="text-sm font-bold">
                      {lang === 'sw' ? selectedEvent.titleSw : selectedEvent.title}
                    </h4>
                    {lang === 'sw' && selectedEvent.title !== selectedEvent.titleSw && (
                      <p className="text-[10px] text-muted-foreground italic">{selectedEvent.title}</p>
                    )}
                    {lang === 'en' && selectedEvent.titleSw !== selectedEvent.title && (
                      <p className="text-[10px] text-muted-foreground italic">{selectedEvent.titleSw}</p>
                    )}
                    <div className="flex items-center gap-2 mt-1">
                      <Badge
                        className={cn(
                          'text-[9px] text-white border-0 px-2 py-0.5',
                          typeConfig.badgeBg
                        )}
                      >
                        {lang === 'sw' ? typeConfig.labelSw : typeConfig.labelEn}
                      </Badge>
                      <span className="text-[11px] text-muted-foreground flex items-center gap-1">
                        <Calendar className="size-3" />
                        {formatDate(selectedEvent.startDate)} — {formatDate(selectedEvent.endDate)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Affected Zones */}
                {selectedEvent.affectedZones.length > 0 && (
                  <div className="space-y-1.5">
                    <p className="text-[10px] font-medium text-muted-foreground flex items-center gap-1">
                      <MapPin className="size-3 text-amber-500" />
                      {t('calendar_zones_affected', lang)}
                    </p>
                    <div className="flex flex-wrap gap-1">
                      {selectedEvent.affectedZones.map((zone, idx) => (
                        <Badge
                          key={idx}
                          variant="outline"
                          className="text-[10px] px-2 py-0.5 border-amber-200 dark:border-amber-800 text-amber-700 dark:text-amber-400"
                        >
                          <MapPin className="size-2.5 mr-0.5" />
                          {getZoneName(zone)}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {/* Insider Tip */}
                {(selectedEvent.insiderTip || selectedEvent.insiderTipSw) && (
                  <div className="bg-amber-50 dark:bg-amber-900/15 rounded-lg p-3 space-y-1.5">
                    <p className="text-[10px] font-medium text-amber-600 dark:text-amber-400 flex items-center gap-1">
                      <Lightbulb className="size-3" />
                      {t('calendar_insider_tip', lang)}
                    </p>
                    <p className="text-[11px] text-amber-700/80 dark:text-amber-400/80 leading-relaxed">
                      {lang === 'sw'
                        ? (selectedEvent.insiderTipSw || selectedEvent.insiderTip)
                        : (selectedEvent.insiderTip || selectedEvent.insiderTipSw)}
                    </p>
                    {lang === 'sw' && selectedEvent.insiderTip && selectedEvent.insiderTipSw !== selectedEvent.insiderTip && (
                      <p className="text-[10px] text-muted-foreground italic">EN: {selectedEvent.insiderTip}</p>
                    )}
                    {lang === 'en' && selectedEvent.insiderTipSw && selectedEvent.insiderTipSw !== selectedEvent.insiderTip && (
                      <p className="text-[10px] text-muted-foreground italic">SW: {selectedEvent.insiderTipSw}</p>
                    )}
                  </div>
                )}

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
                    onClick={() => handleSetReminder(selectedEvent.id)}
                  >
                    <Bell className="size-3.5 mr-1" />
                    {t('calendar_set_reminder', lang)}
                  </Button>
                )}
              </>
            );
          })()}
        </div>
      )}

      {/* ── List View ── */}
      {viewMode === 'list' && (
        <div className="space-y-2">
          {upcomingEvents.length === 0 ? (
            <div className="flex flex-col items-center gap-2 py-6 text-center">
              <Calendar className="size-8 text-muted-foreground/40" />
              <p className="text-sm text-muted-foreground">
                {t('calendar_no_events', lang)}
              </p>
            </div>
          ) : (
            <div className="max-h-96 overflow-y-auto space-y-2.5 pr-1">
              {upcomingEvents.map((event) => {
                const typeConfig = eventTypeConfig[event.type] || eventTypeConfig.cultural;
                const TypeIcon = typeConfig.icon;
                const hasReminder = reminderSet.has(event.id);
                const isSelected = selectedEvent?.id === event.id;

                return (
                  <div
                    key={event.id}
                    className={cn(
                      'glass rounded-xl p-3 space-y-2.5 transition-all duration-300 cursor-pointer',
                      `border ${typeConfig.border}`,
                      isSelected && 'ring-2 ring-amber-400 ring-offset-1'
                    )}
                    onClick={() => setSelectedEvent(event)}
                  >
                    {/* Title + type badge */}
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-start gap-2 flex-1 min-w-0">
                        <div
                          className={cn(
                            'size-7 rounded-lg flex items-center justify-center shrink-0',
                            typeConfig.color
                          )}
                        >
                          <TypeIcon className="size-3.5" />
                        </div>
                        <div className="min-w-0">
                          <h4 className="text-[12px] font-bold truncate">
                            {lang === 'sw' ? event.titleSw : event.title}
                          </h4>
                          <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                            <Calendar className="size-2.5" />
                            {formatDate(event.startDate)} — {formatDate(event.endDate)}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        <Badge
                          className={cn(
                            'text-[8px] text-white border-0 px-1.5 py-0',
                            typeConfig.badgeBg
                          )}
                        >
                          {lang === 'sw' ? typeConfig.labelSw : typeConfig.labelEn}
                        </Badge>
                        {hasReminder && (
                          <Bell className="size-3 text-emerald-500" />
                        )}
                      </div>
                    </div>

                    {/* Zone tags */}
                    {event.affectedZones.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {event.affectedZones.slice(0, 3).map((zone, idx) => (
                          <Badge
                            key={idx}
                            variant="outline"
                            className="text-[9px] px-1.5 py-0 border-amber-200 dark:border-amber-800 text-amber-700 dark:text-amber-400"
                          >
                            <MapPin className="size-2 mr-0.5" />
                            {getZoneName(zone)}
                          </Badge>
                        ))}
                        {event.affectedZones.length > 3 && (
                          <span className="text-[9px] text-muted-foreground">
                            +{event.affectedZones.length - 3}
                          </span>
                        )}
                      </div>
                    )}

                    {/* Insider tip preview */}
                    {(event.insiderTip || event.insiderTipSw) && (
                      <div className="flex items-start gap-1.5 bg-amber-50 dark:bg-amber-900/10 rounded-md p-2">
                        <Lightbulb className="size-3 text-amber-500 shrink-0 mt-0.5" />
                        <p className="text-[10px] text-amber-700/70 dark:text-amber-400/70 leading-relaxed line-clamp-2">
                          {lang === 'sw'
                            ? (event.insiderTipSw || event.insiderTip)
                            : (event.insiderTip || event.insiderTipSw)}
                        </p>
                      </div>
                    )}

                    {/* View details */}
                    <button
                      className="w-full flex items-center justify-center gap-1 text-[10px] text-amber-600 dark:text-amber-400 font-medium hover:underline"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedEvent(event);
                      }}
                    >
                      <Info className="size-3" />
                      {lang === 'sw' ? 'Tazama maelezo' : 'View details'}
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

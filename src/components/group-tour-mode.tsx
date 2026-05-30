'use client';

import { useState, useCallback, useMemo, useEffect } from 'react';
import {
  Users,
  UserPlus,
  Clock,
  MapPin,
  Star,
  Zap,
  CheckCircle2,
  Crown,
  Plus,
  Minus,
  Calendar,
  X,
  ChevronDown,
  ChevronUp,
  Sparkles,
  DollarSign,
  PersonStanding,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { t, type Language } from '@/lib/i18n';
import { useAuthStore } from '@/lib/stores/auth-store';
import {
  buddyMatchesApi,
  zonesApi,
  guidesApi,
  groupToursApi,
  type BuddyMatch,
  type Zone,
  type GuideWithProfile,
  type GroupTour,
} from '@/lib/api';
import { cn } from '@/lib/utils';

// ── Types ──

interface GroupTourModeProps {
  className?: string;
}

interface GroupTourItem {
  id: string;
  zoneId: string;
  zoneName: string;
  zoneNameSw: string;
  date: string;
  timeSlot: string;
  maxParticipants: number;
  currentParticipants: number;
  description: string;
  descriptionSw: string;
  guideId: string | null;
  guideName: string | null;
  pricePerPerson: number;
  soloPrice: number;
  status: 'open' | 'full' | 'in_progress' | 'completed';
  createdAt: string;
}

// ── Helpers ──

function formatTZS(n: number): string {
  return n.toLocaleString('en-TZ');
}

let tourIdCounter = 0;
function generateTourId(): string {
  return `tour-${Date.now()}-${++tourIdCounter}`;
}

// ── Demo data for initial state ──

const demoTours: GroupTourItem[] = [
  {
    id: 'demo-1',
    zoneId: 'zone-vyombo',
    zoneName: 'Utensils',
    zoneNameSw: 'Vyombo',
    date: new Date().toISOString().split('T')[0],
    timeSlot: '09:00 - 12:00',
    maxParticipants: 6,
    currentParticipants: 3,
    description: 'Explore the best utensil shops with expert guidance on quality and prices.',
    descriptionSw: 'Gunduka maduka bora ya vyombo na mwongozo wa ubora na bei.',
    guideId: 'guide-1',
    guideName: 'Mama Asha',
    pricePerPerson: 8000,
    soloPrice: 15000,
    status: 'open',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'demo-2',
    zoneId: 'zone-fabric',
    zoneName: 'Fabric',
    zoneNameSw: 'Vitambaa',
    date: new Date(Date.now() + 86400000).toISOString().split('T')[0],
    timeSlot: '14:00 - 17:00',
    maxParticipants: 4,
    currentParticipants: 4,
    description: 'Group fabric shopping tour - kanga, kitenge, and more at wholesale prices.',
    descriptionSw: 'Safari ya kununua vitambaa - kanga, kitenge, na zaidi kwa bei ya jumla.',
    guideId: 'guide-2',
    guideName: 'Uncle Juma',
    pricePerPerson: 6000,
    soloPrice: 12000,
    status: 'full',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'demo-3',
    zoneId: 'zone-spices',
    zoneName: 'Spices',
    zoneNameSw: 'Viungo',
    date: new Date(Date.now() + 172800000).toISOString().split('T')[0],
    timeSlot: '10:00 - 13:00',
    maxParticipants: 8,
    currentParticipants: 2,
    description: 'Spice market tour with tasting and bulk buying tips.',
    descriptionSw: 'Safari ya soko la viungo na kuonja na vidokezo vya kununua jumla.',
    guideId: null,
    guideName: null,
    pricePerPerson: 5000,
    soloPrice: 10000,
    status: 'open',
    createdAt: new Date().toISOString(),
  },
];

// ── Component ──

export function GroupTourMode({ className }: GroupTourModeProps) {
  const storeLanguage = useAuthStore((s) => s.language);
  const lang = (storeLanguage as Language) || 'sw';

  // ── State ──
  const userId = useAuthStore((s) => s.user?.id) || '';
  const [tours, setTours] = useState<GroupTourItem[]>(demoTours);
  const [zones, setZones] = useState<Zone[]>([]);
  const [guides, setGuides] = useState<GuideWithProfile[]>([]);
  const [buddyMatches, setBuddyMatches] = useState<BuddyMatch[]>([]);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [expandedTour, setExpandedTour] = useState<string | null>(null);
  const [joinedTours, setJoinedTours] = useState<Set<string>>(new Set());
  const [isLoadingTours, setIsLoadingTours] = useState(false);

  // Create form state
  const [formZone, setFormZone] = useState('');
  const [formDate, setFormDate] = useState('');
  const [formTime, setFormTime] = useState('');
  const [formMaxParticipants, setFormMaxParticipants] = useState('4');
  const [formDescription, setFormDescription] = useState('');
  const [formDescriptionSw, setFormDescriptionSw] = useState('');

  // Price split calculator
  const [splitCount, setSplitCount] = useState(2);

  // ── Map API tour to local type ──
  const mapApiTourToItem = useCallback((apiTour: GroupTour, zoneList: Zone[], guideList: GuideWithProfile[]): GroupTourItem => {
    const zone = zoneList.find((z) => z.id === apiTour.zoneId);
    const guide = guideList.find((g) => g.id === apiTour.guideId);
    return {
      id: apiTour.id,
      zoneId: apiTour.zoneId,
      zoneName: zone?.name || apiTour.zoneId,
      zoneNameSw: zone?.nameSw || apiTour.zoneId,
      date: apiTour.date,
      timeSlot: apiTour.timeSlot,
      maxParticipants: apiTour.maxParticipants,
      currentParticipants: apiTour.currentCount,
      description: apiTour.description,
      descriptionSw: apiTour.descriptionSw,
      guideId: apiTour.guideId,
      guideName: guide?.name || null,
      pricePerPerson: apiTour.groupPrice,
      soloPrice: apiTour.soloPrice,
      status: apiTour.status as GroupTourItem['status'],
      createdAt: apiTour.createdAt,
    };
  }, []);

  // ── Refresh tours from API ──
  const refreshTours = useCallback(async (zoneList?: Zone[], guideList?: GuideWithProfile[]) => {
    try {
      const tourResult = await groupToursApi.list();
      if (tourResult.items) {
        const zList = zoneList || zones;
        const gList = guideList || guides;
        const mappedTours: GroupTourItem[] = tourResult.items.map((t) => mapApiTourToItem(t, zList, gList));
        setTours(mappedTours.length > 0 ? mappedTours : demoTours);
        if (userId) {
          const joined = new Set<string>();
          tourResult.items.forEach((t) => {
            if (t.participantIds.includes(userId)) joined.add(t.id);
          });
          setJoinedTours(joined);
        }
      }
    } catch {
      // Keep current data on error
    }
  }, [mapApiTourToItem, userId, zones, guides]);

  // ── Load data ──
  useEffect(() => {
    async function loadData() {
      setIsLoadingTours(true);
      let zoneResult: Zone[] = [];
      let guideResult: GuideWithProfile[] = [];
      try {
        const [zResult, gResult, buddyResult] = await Promise.all([
          zonesApi.list(),
          guidesApi.list(),
          buddyMatchesApi.list(),
        ]);
        zoneResult = zResult;
        guideResult = gResult;
        setZones(zoneResult);
        setGuides(guideResult);
        setBuddyMatches(buddyResult);
      } catch {
        // API not available, use demo data
      }

      // Load group tours from API
      try {
        const tourResult = await groupToursApi.list();
        if (tourResult.items && tourResult.items.length > 0) {
          const mappedTours: GroupTourItem[] = tourResult.items.map((t) => mapApiTourToItem(t, zoneResult, guideResult));
          setTours(mappedTours);
          // Check which tours the user has already joined
          if (userId) {
            const joined = new Set<string>();
            tourResult.items.forEach((t) => {
              if (t.participantIds.includes(userId)) joined.add(t.id);
            });
            setJoinedTours(joined);
          }
        }
      } catch {
        // API not available, keep demo data
      }
      setIsLoadingTours(false);
    }
    loadData();
  }, [userId, mapApiTourToItem]);

  // ── Handlers ──
  const handleJoinTour = useCallback(async (tourId: string) => {
    // Optimistic update
    setTours((prev) =>
      prev.map((tour) => {
        if (tour.id === tourId && tour.currentParticipants < tour.maxParticipants) {
          return {
            ...tour,
            currentParticipants: tour.currentParticipants + 1,
            status: tour.currentParticipants + 1 >= tour.maxParticipants ? 'full' as const : tour.status,
          };
        }
        return tour;
      })
    );
    setJoinedTours((prev) => new Set(prev).add(tourId));

    // Persist to API
    if (userId) {
      try {
        await groupToursApi.update(tourId, { action: 'join', userId });
      } catch {
        // Revert on failure
        setTours((prev) =>
          prev.map((tour) => {
            if (tour.id === tourId) {
              return {
                ...tour,
                currentParticipants: Math.max(0, tour.currentParticipants - 1),
                status: tour.status === 'full' ? 'open' as const : tour.status,
              };
            }
            return tour;
          })
        );
        setJoinedTours((prev) => {
          const next = new Set(prev);
          next.delete(tourId);
          return next;
        });
      }
    }
  }, [userId]);

  const handleLeaveTour = useCallback(async (tourId: string) => {
    // Optimistic update
    setTours((prev) =>
      prev.map((tour) => {
        if (tour.id === tourId) {
          return {
            ...tour,
            currentParticipants: Math.max(0, tour.currentParticipants - 1),
            status: tour.status === 'full' ? 'open' as const : tour.status,
          };
        }
        return tour;
      })
    );
    setJoinedTours((prev) => {
      const next = new Set(prev);
      next.delete(tourId);
      return next;
    });

    // Persist to API
    if (userId) {
      try {
        await groupToursApi.update(tourId, { action: 'leave', userId });
      } catch {
        // Revert on failure
        refreshTours();
      }
    }
  }, [userId, refreshTours]);

  const handleCreateTour = useCallback(async () => {
    if (!formZone || !formDate || !formTime) return;

    const zone = zones.find((z) => z.id === formZone);
    const maxP = parseInt(formMaxParticipants) || 4;

    // Optimistic local add
    const newTour: GroupTourItem = {
      id: generateTourId(),
      zoneId: formZone,
      zoneName: zone?.name || formZone,
      zoneNameSw: zone?.nameSw || formZone,
      date: formDate,
      timeSlot: formTime,
      maxParticipants: maxP,
      currentParticipants: 1,
      description: formDescription || 'Group shopping tour',
      descriptionSw: formDescriptionSw || 'Safari ya kununua kwa kikundi',
      guideId: userId || null,
      guideName: null,
      pricePerPerson: 7500,
      soloPrice: 15000,
      status: 'open',
      createdAt: new Date().toISOString(),
    };

    setTours((prev) => [newTour, ...prev]);
    setShowCreateForm(false);
    setFormZone('');
    setFormDate('');
    setFormTime('');
    setFormMaxParticipants('4');
    setFormDescription('');
    setFormDescriptionSw('');

    // Persist to API
    try {
      await groupToursApi.create({
        guideId: userId || 'anonymous',
        zoneId: formZone,
        title: zone ? (lang === 'sw' ? zone.nameSw : zone.name) : formZone,
        description: formDescription || 'Group shopping tour',
        descriptionSw: formDescriptionSw || 'Safari ya kununua kwa kikundi',
        maxParticipants: maxP,
        soloPrice: 15000,
        groupPrice: 7500,
        timeSlot: formTime,
        date: formDate,
      });
      // Refresh from API to get the real ID
      refreshTours();
    } catch {
      // Keep optimistic data on failure
    }
  }, [formZone, formDate, formTime, formMaxParticipants, formDescription, formDescriptionSw, zones, userId, lang, refreshTours]);

  // ── Computed ──
  const openTours = useMemo(() => tours.filter((t) => t.status === 'open'), [tours]);
  const fullTours = useMemo(() => tours.filter((t) => t.status === 'full'), [tours]);

  // Find guide from buddy matches
  const getGuideForZone = useCallback(
    (zoneId: string): string | null => {
      const match = buddyMatches.find((b) => b.zoneId === zoneId && b.guideId);
      if (match?.guideId) {
        const guide = guides.find((g) => g.id === match.guideId);
        return guide?.name || null;
      }
      return null;
    },
    [buddyMatches, guides]
  );

  // ── Render ──
  return (
    <div className={cn('glass-card gradient-border p-5 space-y-5', className)}>
      {/* ── Header ── */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="size-9 rounded-xl bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center shadow-lg shadow-amber-500/20">
            <Users className="size-4 text-white" />
          </div>
          <div>
            <h3 className="font-semibold text-sm gradient-text">
              {t('group_tour_title', lang)}
            </h3>
            <p className="text-[11px] text-muted-foreground">
              {lang === 'sw' ? 'Safari za kikundi za Kariakoo' : 'Kariakoo group tours'}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-[11px]">
            {openTours.length} {lang === 'sw' ? 'wazi' : 'open'}
          </Badge>
          <Button
            size="sm"
            className="shrink-0 glass-button h-8 px-3 text-xs"
            onClick={() => setShowCreateForm(!showCreateForm)}
          >
            {showCreateForm ? <X className="size-3.5 mr-1" /> : <Plus className="size-3.5 mr-1" />}
            {showCreateForm
              ? lang === 'sw' ? 'Funga' : 'Close'
              : t('group_tour_create', lang)}
          </Button>
        </div>
      </div>

      {/* ── Create Tour Form ── */}
      {showCreateForm && (
        <div className="glass rounded-xl p-4 space-y-3">
          <p className="text-xs font-medium gradient-text flex items-center gap-1">
            <Sparkles className="size-3 text-amber-500" />
            {lang === 'sw' ? 'Unda Safari Mpya' : 'Create New Tour'}
          </p>

          <div className="space-y-2.5">
            {/* Zone */}
            <div>
              <label className="text-[11px] font-medium text-muted-foreground mb-1 block">
                {t('group_tour_zone', lang)}
              </label>
              <Select value={formZone} onValueChange={setFormZone}>
                <SelectTrigger className="glass-input h-9 text-xs">
                  <SelectValue placeholder={lang === 'sw' ? 'Chagua eneo' : 'Select zone'} />
                </SelectTrigger>
                <SelectContent>
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

            {/* Date & Time */}
            <div className="flex gap-2">
              <div className="flex-1">
                <label className="text-[11px] font-medium text-muted-foreground mb-1 block">
                  {t('date', lang)}
                </label>
                <Input
                  type="date"
                  value={formDate}
                  onChange={(e) => setFormDate(e.target.value)}
                  className="glass-input h-9 text-xs"
                />
              </div>
              <div className="flex-1">
                <label className="text-[11px] font-medium text-muted-foreground mb-1 block">
                  {t('group_tour_time_slot', lang)}
                </label>
                <Input
                  type="text"
                  value={formTime}
                  onChange={(e) => setFormTime(e.target.value)}
                  placeholder={lang === 'sw' ? 'Mf: 09:00 - 12:00' : 'e.g. 09:00 - 12:00'}
                  className="glass-input h-9 text-xs"
                />
              </div>
            </div>

            {/* Max Participants */}
            <div>
              <label className="text-[11px] font-medium text-muted-foreground mb-1 block">
                {lang === 'sw' ? 'Washiriki wapekee' : 'Max participants'}
              </label>
              <Select value={formMaxParticipants} onValueChange={setFormMaxParticipants}>
                <SelectTrigger className="glass-input h-9 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {[2, 3, 4, 5, 6, 8, 10].map((n) => (
                    <SelectItem key={n} value={n.toString()}>
                      {n} {lang === 'sw' ? 'watu' : 'people'}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Description */}
            <div>
              <label className="text-[11px] font-medium text-muted-foreground mb-1 block">
                {t('description', lang)}
              </label>
              <Textarea
                value={formDescription}
                onChange={(e) => setFormDescription(e.target.value)}
                placeholder={lang === 'sw' ? 'Eleza safari yako...' : 'Describe your tour...'}
                className="glass-input text-xs min-h-[60px]"
              />
              <Textarea
                value={formDescriptionSw}
                onChange={(e) => setFormDescriptionSw(e.target.value)}
                placeholder="Maelezo kwa Kiswahili..."
                className="glass-input text-xs min-h-[40px] mt-2"
              />
            </div>

            <Button
              className="w-full glass-button h-10 text-sm font-semibold"
              onClick={handleCreateTour}
              disabled={!formZone || !formDate || !formTime}
            >
              <Plus className="size-4 mr-1.5" />
              {t('group_tour_create', lang)}
            </Button>
          </div>
        </div>
      )}

      {/* ── Available Tours ── */}
      <div className="space-y-2">
        <p className="text-[11px] font-medium text-muted-foreground">
          {lang === 'sw' ? 'Safari zinazopatikana' : 'Available Tours'} ({openTours.length})
        </p>

        {tours.length === 0 ? (
          <div className="flex flex-col items-center gap-2 py-8 text-center">
            <Users className="size-10 text-muted-foreground/40" />
            <p className="text-sm text-muted-foreground">
              {lang === 'sw' ? 'Hakuna safari bado. Unda mpya!' : 'No tours yet. Create one!'}
            </p>
          </div>
        ) : (
          <div className="max-h-96 overflow-y-auto space-y-3 pr-1">
            {tours.map((tour) => {
              const spotsLeft = tour.maxParticipants - tour.currentParticipants;
              const isFull = tour.currentParticipants >= tour.maxParticipants;
              const isJoined = joinedTours.has(tour.id);
              const isExpanded = expandedTour === tour.id;
              const guideName = tour.guideName || getGuideForZone(tour.zoneId);
              const discountPercent = Math.round(
                ((tour.soloPrice - tour.pricePerPerson) / tour.soloPrice) * 100
              );

              return (
                <div
                  key={tour.id}
                  className={cn(
                    'glass rounded-xl p-4 space-y-3 transition-all duration-300',
                    isFull && 'opacity-70',
                    isJoined && 'ring-1 ring-emerald-300 dark:ring-emerald-700'
                  )}
                >
                  {/* Tour header */}
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-start gap-2.5 flex-1 min-w-0">
                      <div
                        className={cn(
                          'size-8 rounded-lg flex items-center justify-center shrink-0',
                          isFull
                            ? 'bg-muted/30 text-muted-foreground'
                            : 'bg-gradient-to-br from-amber-400 to-orange-500 text-white'
                        )}
                      >
                        <MapPin className="size-4" />
                      </div>
                      <div className="min-w-0">
                        <h4 className="text-sm font-bold truncate">
                          {lang === 'sw' ? tour.zoneNameSw : tour.zoneName}
                        </h4>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="text-[11px] text-muted-foreground flex items-center gap-1">
                            <Calendar className="size-3" />
                            {tour.date}
                          </span>
                          <span className="text-[11px] text-muted-foreground flex items-center gap-1">
                            <Clock className="size-3" />
                            {tour.timeSlot}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Save badge */}
                    {!isFull && (
                      <div className="amber-glow-sm rounded-xl">
                        <Badge className="bg-gradient-to-r from-amber-500 to-orange-500 text-white border-0 text-[10px] font-bold px-2 py-0.5">
                          <Zap className="size-2.5 mr-0.5" />
                          {discountPercent}%
                        </Badge>
                      </div>
                    )}
                    {isFull && (
                      <Badge className="bg-red-500 text-white border-0 text-[10px] font-bold px-2 py-0.5">
                        {t('group_tour_full', lang)}
                      </Badge>
                    )}
                  </div>

                  {/* Description */}
                  <p className="text-[11px] text-muted-foreground leading-relaxed">
                    {lang === 'sw' ? tour.descriptionSw : tour.description}
                  </p>

                  {/* Participants */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="text-muted-foreground flex items-center gap-1">
                        <PersonStanding className="size-3" />
                        {tour.currentParticipants}/{tour.maxParticipants} {lang === 'sw' ? 'washiriki' : 'participants'}
                      </span>
                      {!isFull && (
                        <span className="text-amber-600 dark:text-amber-400 font-medium">
                          {spotsLeft} {t('group_tour_spots_left', lang)}
                        </span>
                      )}
                    </div>
                    {/* Avatar row */}
                    <div className="flex items-center gap-1.5">
                      {Array.from({ length: tour.maxParticipants }, (_, i) => {
                        const isFilled = i < tour.currentParticipants;
                        const isYou = isJoined && i === tour.currentParticipants - 1;
                        return (
                          <div
                            key={i}
                            className={cn(
                              'size-7 rounded-full flex items-center justify-center text-[10px] font-bold border-2 transition-all',
                              isFilled
                                ? isYou
                                  ? 'bg-gradient-to-br from-amber-500 to-orange-500 border-amber-400 text-white shadow-md shadow-amber-500/20'
                                  : 'bg-gradient-to-br from-amber-400 to-orange-400 border-amber-300 text-white'
                                : 'bg-muted/30 border-dashed border-muted-foreground/25 text-muted-foreground/40'
                            )}
                          >
                            {isFilled ? (
                              isYou ? (
                                <Star className="size-3" />
                              ) : (
                                <Users className="size-2.5" />
                              )
                            ) : (
                              <UserPlus className="size-2.5" />
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Guide info */}
                  {guideName && (
                    <div className="flex items-center gap-2 text-[11px] bg-amber-50 dark:bg-amber-900/15 rounded-lg px-2.5 py-2">
                      <Crown className="size-3.5 text-amber-500" />
                      <span className="text-muted-foreground">{t('group_tour_guide', lang)}:</span>
                      <span className="font-medium">{guideName}</span>
                    </div>
                  )}

                  {/* Expand for price details */}
                  <button
                    onClick={() => setExpandedTour(isExpanded ? null : tour.id)}
                    className="w-full flex items-center justify-center gap-1 text-[10px] text-muted-foreground hover:text-foreground transition-colors py-1"
                  >
                    {isExpanded ? <ChevronUp className="size-3" /> : <ChevronDown className="size-3" />}
                    {isExpanded
                      ? lang === 'sw' ? 'Ficha maelezo' : 'Hide details'
                      : lang === 'sw' ? 'Onyesha maelezo' : 'Show details'}
                  </button>

                  {isExpanded && (
                    <div className="glass rounded-xl p-3 space-y-3">
                      {/* Price comparison */}
                      <div className="flex items-center justify-between">
                        <div className="text-center flex-1">
                          <p className="text-[10px] text-muted-foreground mb-1">
                            {t('group_tour_solo_price', lang)}
                          </p>
                          <p className="text-base font-bold text-muted-foreground line-through decoration-red-400 decoration-2">
                            {formatTZS(tour.soloPrice)}
                          </p>
                          <p className="text-[9px] text-muted-foreground">TZS</p>
                        </div>
                        <div className="flex flex-col items-center px-2">
                          <Zap className="size-4 text-amber-500" />
                        </div>
                        <div className="text-center flex-1">
                          <p className="text-[10px] text-amber-600 dark:text-amber-400 mb-1">
                            {t('group_tour_group_price', lang)}
                          </p>
                          <p className="text-xl font-bold gradient-text">
                            {formatTZS(tour.pricePerPerson)}
                          </p>
                          <p className="text-[9px] text-muted-foreground">
                            TZS / {t('group_tour_per_person', lang)}
                          </p>
                        </div>
                      </div>

                      {/* Savings bar */}
                      <div className="flex items-center gap-2">
                        <div className="flex-1 h-2 rounded-full bg-muted/30 overflow-hidden">
                          <div
                            className="h-full rounded-full bg-gradient-to-r from-amber-500 to-orange-500"
                            style={{ width: `${discountPercent}%` }}
                          />
                        </div>
                        <span className="text-[11px] font-semibold text-amber-600 dark:text-amber-400 shrink-0">
                          -{discountPercent}%
                        </span>
                      </div>
                    </div>
                  )}

                  {/* Join / Joined button */}
                  {isJoined ? (
                    <div className="flex items-center gap-2 h-10">
                      <div className="flex items-center justify-center gap-2 flex-1 glass rounded-l-xl h-10">
                        <CheckCircle2 className="size-4 text-emerald-500" />
                        <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                          {t('group_tour_joined', lang)}
                        </span>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-10 px-3 text-xs font-medium border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-r-xl"
                        onClick={() => handleLeaveTour(tour.id)}
                      >
                        <X className="size-3 mr-1" />
                        {lang === 'sw' ? 'Ondoka' : 'Leave'}
                      </Button>
                    </div>
                  ) : (
                    <Button
                      className="w-full h-10 text-xs font-semibold glass-button"
                      onClick={() => handleJoinTour(tour.id)}
                      disabled={isFull}
                    >
                      <UserPlus className="size-3.5 mr-1.5" />
                      {isFull ? t('group_tour_full', lang) : t('group_tour_join', lang)}
                    </Button>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ── Price Splitting Calculator ── */}
      <div className="glass rounded-xl p-4 space-y-3">
        <p className="text-xs font-medium gradient-text flex items-center gap-1">
          <DollarSign className="size-3 text-amber-500" />
          {lang === 'sw' ? 'Kalkuleta ya Kugawanya Bei' : 'Price Splitting Calculator'}
        </p>

        <div className="flex items-center gap-3">
          <label className="text-[11px] text-muted-foreground shrink-0">
            {lang === 'sw' ? 'Watu' : 'People'}:
          </label>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setSplitCount(Math.max(2, splitCount - 1))}
              className="size-7 rounded-md glass flex items-center justify-center hover:bg-amber-100/50 dark:hover:bg-amber-900/20 transition-colors"
            >
              <Minus className="size-3" />
            </button>
            <span className="w-8 text-center text-sm font-bold">{splitCount}</span>
            <button
              onClick={() => setSplitCount(Math.min(10, splitCount + 1))}
              className="size-7 rounded-md glass flex items-center justify-center hover:bg-amber-100/50 dark:hover:bg-amber-900/20 transition-colors"
            >
              <Plus className="size-3" />
            </button>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="glass rounded-lg p-2.5 text-center">
            <p className="text-[10px] text-muted-foreground mb-0.5">
              {t('group_tour_solo_price', lang)}
            </p>
            <p className="text-sm font-bold text-muted-foreground line-through">
              {formatTZS(15000)} TZS
            </p>
          </div>
          <div className="glass rounded-lg p-2.5 text-center">
            <p className="text-[10px] text-amber-600 dark:text-amber-400 mb-0.5">
              {lang === 'sw' ? `Kwa mtu (${splitCount})` : `Per person (${splitCount})`}
            </p>
            <p className="text-lg font-bold gradient-text">
              {formatTZS(Math.round(15000 * 0.5 / splitCount * 2))} TZS
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 text-[11px]">
          <div className="flex-1 h-2 rounded-full bg-muted/30 overflow-hidden">
            <div
              className="h-full rounded-full bg-gradient-to-r from-amber-500 to-orange-500"
              style={{ width: `${Math.min(90, 30 + splitCount * 10)}%` }}
            />
          </div>
          <span className="text-amber-600 dark:text-amber-400 font-semibold shrink-0">
            {lang === 'sw' ? 'Okoa' : 'Save'} {30 + splitCount * 10}%
          </span>
        </div>
      </div>
    </div>
  );
}

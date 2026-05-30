'use client';

import { useState, useCallback } from 'react';
import {
  Users,
  UserPlus,
  Clock,
  MapPin,
  Star,
  Zap,
  CheckCircle2,
  Crown,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { t, type Language } from '@/lib/i18n';
import { useAuthStore } from '@/lib/stores/auth-store';
import { cn } from '@/lib/utils';

// ── Types ──

interface GroupTourProps {
  sessionId?: string;
  guideName: string;
  zoneName: string;
  maxSeekers: number;
  currentSeekers: number;
  pricePerSeeker: number;
  soloPrice: number;
  discountPercent: number;
  timeSlot: string;
  language?: 'sw' | 'en';
  onJoinGroup?: () => void;
  onCreateGroup?: () => void;
  className?: string;
}

// ── Helpers ──

function formatTZS(n: number): string {
  return n.toLocaleString('en-TZ');
}

// ── Component ──

export function GroupTour({
  sessionId,
  guideName,
  zoneName,
  maxSeekers,
  currentSeekers,
  pricePerSeeker,
  soloPrice,
  discountPercent,
  timeSlot,
  language: languageProp,
  onJoinGroup,
  onCreateGroup,
  className,
}: GroupTourProps) {
  const storeLanguage = useAuthStore((s) => s.language);
  const lang = languageProp || (storeLanguage as Language) || 'sw';

  const [joined, setJoined] = useState(false);
  const spotsLeft = maxSeekers - currentSeekers;
  const isFull = currentSeekers >= maxSeekers;

  const handleJoin = useCallback(() => {
    setJoined(true);
    onJoinGroup?.();
  }, [onJoinGroup]);

  const handleCreate = useCallback(() => {
    onCreateGroup?.();
  }, [onCreateGroup]);

  // ── Seeker avatars ──
  const renderAvatars = () => {
    const avatars = [];
    for (let i = 0; i < maxSeekers; i++) {
      const isFilled = i < currentSeekers;
      const isYou = joined && i === currentSeekers - 1;

      avatars.push(
        <div
          key={i}
          className={cn(
            'size-9 rounded-full flex items-center justify-center text-xs font-bold border-2 transition-all duration-300',
            isFilled
              ? isYou
                ? 'bg-gradient-to-br from-amber-500 to-orange-500 border-amber-400 text-white shadow-md shadow-amber-500/20'
                : 'bg-gradient-to-br from-amber-400 to-orange-400 border-amber-300 text-white'
              : 'bg-muted/30 border-dashed border-muted-foreground/25 text-muted-foreground/40'
          )}
          style={{ animationDelay: `${i * 100}ms` }}
        >
          {isFilled ? (
            isYou ? (
              <Star className="size-3.5" />
            ) : (
              <Users className="size-3.5" />
            )
          ) : (
            <UserPlus className="size-3" />
          )}
        </div>
      );
    }
    return avatars;
  };

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
            <p className="text-[11px] text-muted-foreground">{zoneName}</p>
          </div>
        </div>

        {/* Save badge with amber glow */}
        <div className="amber-glow-sm rounded-xl">
          <Badge className="bg-gradient-to-r from-amber-500 to-orange-500 text-white border-0 text-xs font-bold px-3 py-1">
            <Zap className="size-3 mr-1" />
            {t('group_tour_save', lang)} {discountPercent}%
          </Badge>
        </div>
      </div>

      {/* ── Guide info ── */}
      <div className="glass rounded-xl p-3 flex items-center gap-3">
        <div className="size-10 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center">
          <Crown className="size-5 text-white" />
        </div>
        <div className="flex-1">
          <p className="text-sm font-semibold">{guideName}</p>
          <p className="text-[11px] text-muted-foreground">
            {t('group_tour_guide', lang)} • {zoneName}
          </p>
        </div>
      </div>

      {/* ── Time slot ── */}
      <div className="flex items-center gap-2 text-sm">
        <Clock className="size-4 text-amber-500" />
        <span className="text-muted-foreground">{t('group_tour_time_slot', lang)}:</span>
        <span className="font-medium">{timeSlot}</span>
      </div>

      {/* ── Seeker avatars ── */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-xs">
          <span className="text-muted-foreground">
            {t('group_tour_seekers', lang)} ({currentSeekers}/{maxSeekers})
          </span>
          {spotsLeft > 0 && !isFull && (
            <span className="text-amber-600 dark:text-amber-400 font-medium">
              {spotsLeft} {t('group_tour_spots_left', lang)}
            </span>
          )}
          {isFull && (
            <span className="text-red-500 font-medium">
              {t('group_tour_full', lang)}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {renderAvatars()}
        </div>
      </div>

      {/* ── Waiting indicator ── */}
      {currentSeekers > 0 && currentSeekers < maxSeekers && (
        <div className="flex items-center gap-2 text-xs text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 rounded-lg px-3 py-2">
          <span className="relative flex size-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75" />
            <span className="relative inline-flex rounded-full size-2 bg-amber-500" />
          </span>
          {currentSeekers - (joined ? 1 : 0)} {t('group_tour_waiting', lang)}
        </div>
      )}

      {/* ── Price comparison ── */}
      <div className="glass rounded-xl p-4 space-y-3">
        <div className="flex items-center justify-between">
          <div className="text-center flex-1">
            <p className="text-[11px] text-muted-foreground mb-1">
              {t('group_tour_solo_price', lang)}
            </p>
            <p className="text-lg font-bold text-muted-foreground line-through decoration-red-400 decoration-2">
              {formatTZS(soloPrice)}
            </p>
            <p className="text-[10px] text-muted-foreground">TZS</p>
          </div>

          <div className="flex flex-col items-center px-3">
            <Zap className="size-5 text-amber-500" />
          </div>

          <div className="text-center flex-1">
            <p className="text-[11px] text-amber-600 dark:text-amber-400 mb-1">
              {t('group_tour_group_price', lang)}
            </p>
            <p className="text-2xl font-bold gradient-text">
              {formatTZS(pricePerSeeker)}
            </p>
            <p className="text-[10px] text-muted-foreground">
              TZS / {t('group_tour_per_person', lang)}
            </p>
          </div>
        </div>

        {/* Savings bar */}
        <div className="flex items-center gap-2 pt-1">
          <div className="flex-1 h-2 rounded-full bg-muted/30 overflow-hidden">
            <div
              className="h-full rounded-full bg-gradient-to-r from-amber-500 to-orange-500 transition-all duration-700"
              style={{ width: `${discountPercent}%` }}
            />
          </div>
          <span className="text-xs font-semibold text-amber-600 dark:text-amber-400 shrink-0">
            -{discountPercent}%
          </span>
        </div>
      </div>

      {/* ── Zone map preview ── */}
      <div className="glass rounded-xl p-3 space-y-1.5">
        <div className="flex items-center gap-1.5 text-[11px] font-medium text-muted-foreground">
          <MapPin className="size-3 text-amber-500" />
          {zoneName}
        </div>
        {/* Mini map visualization */}
        <div className="relative h-16 rounded-lg bg-gradient-to-br from-amber-100/50 to-orange-100/50 dark:from-amber-900/20 dark:to-orange-900/20 overflow-hidden">
          {/* Simulated map grid */}
          <div className="absolute inset-0 opacity-20">
            <div className="absolute top-2 left-3 w-8 h-0.5 bg-amber-600 rotate-12" />
            <div className="absolute top-5 left-6 w-12 h-0.5 bg-amber-600 -rotate-6" />
            <div className="absolute top-8 left-2 w-6 h-0.5 bg-amber-600 rotate-3" />
            <div className="absolute top-3 right-4 w-10 h-0.5 bg-amber-600 -rotate-12" />
            <div className="absolute top-6 right-2 w-8 h-0.5 bg-amber-600 rotate-8" />
          </div>
          {/* Zone pin */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
            <div className="relative">
              <div className="absolute -inset-3 rounded-full bg-amber-400/20 animate-ping" />
              <div className="size-4 rounded-full bg-amber-500 border-2 border-white shadow-lg flex items-center justify-center">
                <MapPin className="size-2 text-white" />
              </div>
            </div>
          </div>
          {/* Kariakoo label */}
          <div className="absolute bottom-1.5 right-2 text-[9px] font-medium text-amber-600/60 dark:text-amber-400/60">
            Kariakoo
          </div>
        </div>
      </div>

      {/* ── Action button ── */}
      {joined ? (
        <div className="flex items-center justify-center gap-2 h-12 glass rounded-xl">
          <CheckCircle2 className="size-5 text-emerald-500" />
          <span className="text-sm font-semibold text-emerald-600 dark:text-emerald-400">
            {t('group_tour_joined', lang)}
          </span>
        </div>
      ) : (
        <Button
          className="w-full h-12 text-sm font-semibold glass-button"
          onClick={sessionId ? handleJoin : handleCreate}
          disabled={isFull}
        >
          {sessionId ? (
            <>
              <UserPlus className="size-4 mr-1.5" />
              {isFull ? t('group_tour_full', lang) : t('group_tour_join', lang)}
            </>
          ) : (
            <>
              <Users className="size-4 mr-1.5" />
              {t('group_tour_create', lang)}
            </>
          )}
        </Button>
      )}
    </div>
  );
}

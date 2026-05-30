'use client';

import { useState, useCallback } from 'react';
import {
  Users,
  Shield,
  MapPin,
  Clock,
  Star,
  UserPlus,
  Heart,
  AlertCircle,
  CheckCircle2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { t, type Language } from '@/lib/i18n';
import { useAuthStore } from '@/lib/stores/auth-store';
import { cn } from '@/lib/utils';

// ── Types ──

interface Buddy {
  id: string;
  name: string;
  avatarUrl?: string;
  rating: number;
  sessionsCompleted: number;
}

interface BuddySystemProps {
  zoneId: string;
  zoneName: string;
  timeSlot: string;
  currentBuddies: Buddy[];
  seekerRating?: number;
  onInvite: (buddyId: string) => void;
  language?: 'sw' | 'en';
  className?: string;
}

// ── Component ──

export function BuddySystem({
  zoneId,
  zoneName,
  timeSlot,
  currentBuddies,
  seekerRating,
  onInvite,
  language: languageProp,
  className,
}: BuddySystemProps) {
  const storeLanguage = useAuthStore((s) => s.language);
  const lang = languageProp || (storeLanguage as Language) || 'sw';

  const [invitedIds, setInvitedIds] = useState<Set<string>>(new Set());

  const handleInvite = useCallback(
    (buddyId: string) => {
      setInvitedIds((prev) => new Set(prev).add(buddyId));
      onInvite(buddyId);
    },
    [onInvite]
  );

  // Generate a deterministic avatar color from name
  const getAvatarColor = (name: string) => {
    const colors = [
      'from-amber-400 to-orange-500',
      'from-emerald-400 to-teal-500',
      'from-rose-400 to-pink-500',
      'from-violet-400 to-purple-500',
      'from-sky-400 to-blue-500',
    ];
    const idx = name.charCodeAt(0) % colors.length;
    return colors[idx];
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
              {t('buddy_title', lang)}
            </h3>
            <p className="text-[11px] text-muted-foreground">
              Rafiki Pamoja
            </p>
          </div>
        </div>
        <Badge variant="outline" className="text-[11px]">
          {currentBuddies.length} {lang === 'sw' ? 'wanaolingana' : 'matches'}
        </Badge>
      </div>

      {/* ── Safety message ── */}
      <div className="flex items-center gap-2.5 bg-emerald-50 dark:bg-emerald-900/20 rounded-xl px-4 py-3 border border-emerald-200 dark:border-emerald-800">
        <div className="size-8 rounded-full bg-emerald-500/20 flex items-center justify-center shrink-0">
          <Shield className="size-4 text-emerald-600 dark:text-emerald-400" />
        </div>
        <div>
          <p className="text-sm font-semibold text-emerald-700 dark:text-emerald-400">
            {t('buddy_safety_message', lang)}
          </p>
          <p className="text-[11px] text-emerald-600/70 dark:text-emerald-400/70">
            {t('buddy_join_for_safety', lang)}
          </p>
        </div>
        <Heart className="size-4 text-emerald-500 shrink-0 ml-auto" />
      </div>

      {/* ── Zone and time info ── */}
      <div className="glass rounded-xl p-3 grid grid-cols-2 gap-3">
        <div className="flex items-center gap-2 text-xs">
          <MapPin className="size-4 text-amber-500 shrink-0" />
          <div>
            <p className="text-[10px] text-muted-foreground">{t('buddy_zone_label', lang)}</p>
            <p className="font-semibold text-sm">{zoneName}</p>
          </div>
        </div>
        <div className="flex items-center gap-2 text-xs">
          <Clock className="size-4 text-amber-500 shrink-0" />
          <div>
            <p className="text-[10px] text-muted-foreground">{t('buddy_time_slot', lang)}</p>
            <p className="font-semibold text-sm">{timeSlot}</p>
          </div>
        </div>
      </div>

      {/* ── Buddy match cards ── */}
      {currentBuddies.length === 0 ? (
        <div className="flex flex-col items-center gap-2 py-6 text-center">
          <AlertCircle className="size-8 text-muted-foreground/40" />
          <p className="text-sm text-muted-foreground">
            {t('buddy_no_matches', lang)}
          </p>
        </div>
      ) : (
        <div className="space-y-2.5 max-h-72 overflow-y-auto pr-1">
          <p className="text-[11px] font-medium text-muted-foreground flex items-center gap-1">
            <Users className="size-3 text-amber-500" />
            {t('buddy_matches', lang)}
          </p>

          {currentBuddies.map((buddy) => {
            const isInvited = invitedIds.has(buddy.id);

            return (
              <div
                key={buddy.id}
                className="glass rounded-xl p-3 flex items-center gap-3 transition-all duration-300"
              >
                {/* Avatar */}
                <div
                  className={cn(
                    'size-10 rounded-full bg-gradient-to-br flex items-center justify-center text-white font-bold text-sm shrink-0',
                    getAvatarColor(buddy.name)
                  )}
                >
                  {buddy.name.charAt(0).toUpperCase()}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold truncate">{buddy.name}</p>
                  <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
                    <span className="flex items-center gap-0.5">
                      <Star className="size-3 text-amber-500" />
                      {buddy.rating.toFixed(1)}
                    </span>
                    <span className="flex items-center gap-0.5">
                      <CheckCircle2 className="size-3 text-emerald-500" />
                      {buddy.sessionsCompleted} {lang === 'sw' ? 'vikao' : 'sessions'}
                    </span>
                  </div>
                </div>

                {/* Invite button */}
                {isInvited ? (
                  <Badge className="bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 border-0 text-[10px] px-2.5 py-0.5">
                    <CheckCircle2 className="size-3 mr-0.5" />
                    {lang === 'sw' ? 'Umealika' : 'Invited'}
                  </Badge>
                ) : (
                  <Button
                    size="sm"
                    className="h-8 text-[11px] font-semibold glass-button px-3"
                    onClick={() => handleInvite(buddy.id)}
                  >
                    <UserPlus className="size-3.5 mr-1" />
                    {t('buddy_invite', lang)}
                  </Button>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* ── Rating info ── */}
      {seekerRating !== undefined && (
        <div className="flex items-center gap-2 text-xs text-muted-foreground bg-muted/30 rounded-lg px-3 py-2">
          <Star className="size-3.5 text-amber-500" />
          {t('buddy_rating_label', lang)}: {seekerRating.toFixed(1)}
        </div>
      )}
    </div>
  );
}

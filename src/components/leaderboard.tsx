'use client';

import { Trophy, Medal, Award, Crown, Star } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { RatingStars } from '@/components/rating-stars';
import { t, type Language } from '@/lib/i18n';
import { useAuthStore } from '@/lib/stores/auth-store';
import { cn } from '@/lib/utils';
import { useState, useMemo } from 'react';

interface LeaderboardGuide {
  id: string;
  name: string;
  avatarUrl?: string | null;
  rating: number;
  totalSessions: number;
  sessionsThisWeek: number;
  zones: string[];
  isVerifiedElite?: boolean;
}

interface LeaderboardProps {
  guides: LeaderboardGuide[];
  zones?: Array<{ id: string; nameKey: string }>;
  guideOfWeek?: LeaderboardGuide | null;
  language?: Language;
  isLoading?: boolean;
  className?: string;
}

function getInitials(name: string): string {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

const avatarColors = [
  'bg-emerald-600',
  'bg-sky-600',
  'bg-amber-600',
  'bg-rose-600',
  'bg-purple-600',
  'bg-teal-600',
  'bg-orange-600',
  'bg-indigo-600',
];

function getAvatarColor(id: string): string {
  const idx = id.charCodeAt(0) % avatarColors.length;
  return avatarColors[idx];
}

const positionStyles: Record<number, { border: string; bg: string; icon: React.ElementType; iconColor: string }> = {
  1: { border: 'border-amber-400 dark:border-amber-500', bg: 'bg-amber-50 dark:bg-amber-950/30', icon: Crown, iconColor: 'text-amber-500' },
  2: { border: 'border-gray-300 dark:border-gray-400', bg: 'bg-gray-50 dark:bg-gray-900/30', icon: Medal, iconColor: 'text-gray-400' },
  3: { border: 'border-orange-300 dark:border-orange-400', bg: 'bg-orange-50 dark:bg-orange-950/30', icon: Award, iconColor: 'text-orange-400' },
};

export function Leaderboard({
  guides,
  zones = [],
  guideOfWeek,
  language: propLanguage,
  isLoading = false,
  className,
}: LeaderboardProps) {
  const storeLanguage = useAuthStore((s) => s.language) as Language;
  const language = propLanguage || storeLanguage;
  const [filterZone, setFilterZone] = useState<string>('all');

  const filteredGuides = useMemo(() => {
    if (filterZone === 'all') return guides;
    return guides.filter((g) => g.zones.includes(filterZone));
  }, [guides, filterZone]);

  if (isLoading) {
    return (
      <div className={cn('space-y-4', className)}>
        <Skeleton className="h-32 rounded-xl" />
        <div className="space-y-2">
          {Array.from({ length: 5 }, (_, i) => (
            <Skeleton key={i} className="h-14 rounded-lg" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className={cn('space-y-4', className)}>
      {/* Header */}
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <h2 className="text-lg font-bold text-foreground">{t('leaderboard', language)}</h2>
        {zones.length > 0 && (
          <select
            value={filterZone}
            onChange={(e) => setFilterZone(e.target.value)}
            className="h-8 rounded-md border bg-background px-2 text-xs"
            aria-label={t('vendor_zone', language)}
          >
            <option value="all">{language === 'sw' ? 'Maeneo yote' : 'All zones'}</option>
            {zones.map((z) => (
              <option key={z.id} value={z.id}>
                {t(z.nameKey, language)}
              </option>
            ))}
          </select>
        )}
      </div>

      {/* Guide of the Week */}
      {guideOfWeek && (
        <Card className="overflow-hidden border-amber-300 dark:border-amber-600 bg-gradient-to-br from-amber-50 to-yellow-50 dark:from-amber-950/30 dark:to-yellow-950/20">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <Crown className="size-4 text-amber-500" />
              {t('guide_of_week', language)}
            </CardTitle>
          </CardHeader>
          <CardContent className="pb-4">
            <div className="flex items-center gap-3">
              {guideOfWeek.avatarUrl ? (
                <img
                  src={guideOfWeek.avatarUrl}
                  alt={guideOfWeek.name}
                  className="size-14 rounded-full object-cover border-2 border-amber-400"
                />
              ) : (
                <div
                  className={cn(
                    'size-14 rounded-full flex items-center justify-center text-white font-bold text-lg border-2 border-amber-400',
                    getAvatarColor(guideOfWeek.id)
                  )}
                >
                  {getInitials(guideOfWeek.name)}
                </div>
              )}
              <div>
                <h3 className="font-bold text-foreground">{guideOfWeek.name}</h3>
                <RatingStars rating={guideOfWeek.rating} size="sm" showNumeric />
                <p className="text-xs text-muted-foreground mt-0.5">
                  {guideOfWeek.sessionsThisWeek} {language === 'sw' ? 'vikao wiki hii' : 'sessions this week'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Ranked list */}
      {filteredGuides.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <Trophy className="size-10 mx-auto mb-2 opacity-50" />
          <p className="text-sm">{t('no_guides', language)}</p>
        </div>
      ) : (
        <div className="space-y-2">
          {filteredGuides.map((guide, idx) => {
            const position = idx + 1;
            const posStyle = positionStyles[position];
            const PosIcon = posStyle?.icon;

            return (
              <div
                key={guide.id}
                className={cn(
                  'flex items-center gap-3 rounded-lg border p-3 transition-colors',
                  posStyle ? `${posStyle.bg} ${posStyle.border}` : 'bg-background border-border hover:bg-muted/30'
                )}
              >
                {/* Position */}
                <div className="shrink-0 w-8 flex items-center justify-center">
                  {PosIcon ? (
                    <PosIcon className={cn('size-6', posStyle.iconColor)} />
                  ) : (
                    <span className="text-sm font-bold text-muted-foreground">{position}</span>
                  )}
                </div>

                {/* Avatar */}
                {guide.avatarUrl ? (
                  <img
                    src={guide.avatarUrl}
                    alt={guide.name}
                    className="size-10 rounded-full object-cover"
                  />
                ) : (
                  <div
                    className={cn(
                      'size-10 rounded-full flex items-center justify-center text-white font-semibold text-sm',
                      getAvatarColor(guide.id)
                    )}
                  >
                    {getInitials(guide.name)}
                  </div>
                )}

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <h4 className="font-medium text-sm text-foreground truncate">{guide.name}</h4>
                    {guide.isVerifiedElite && (
                      <Badge className="bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300 text-[9px] h-4 px-1">
                        <Star className="size-2.5 fill-amber-500 text-amber-500 mr-0.5" />
                        Elite
                      </Badge>
                    )}
                  </div>
                  <RatingStars rating={guide.rating} size="sm" showNumeric={false} />
                </div>

                {/* Sessions this week */}
                <div className="shrink-0 text-right">
                  <p className="text-sm font-bold text-foreground">{guide.sessionsThisWeek}</p>
                  <p className="text-[10px] text-muted-foreground">
                    {language === 'sw' ? 'vikao' : 'sessions'}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

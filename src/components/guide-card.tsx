'use client';

import { ShieldCheck, MapPin, MessageSquare } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { RatingStars } from '@/components/rating-stars';
import { StatusBadge } from '@/components/status-badge';
import { t, type Language } from '@/lib/i18n';
import { cn } from '@/lib/utils';

interface GuideCardProps {
  guide: {
    id: string;
    name: string;
    avatarUrl?: string | null;
    bio?: string;
    rating: number;
    totalSessions: number;
    status: 'pending' | 'active' | 'suspended';
    currentStatus: 'online' | 'offline' | 'busy';
    zones: string[];
    languages: string[];
    badgeTypes?: string[];
    isVerifiedElite?: boolean;
  };
  language?: Language;
  view?: 'seeker' | 'admin';
  onAccept?: (guideId: string) => void;
  onViewProfile?: (guideId: string) => void;
  className?: string;
}

const zoneColorMap: Record<string, string> = {
  zone_vyombo: 'bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300',
  zone_electronics: 'bg-sky-100 text-sky-700 dark:bg-sky-900/40 dark:text-sky-300',
  zone_fabric: 'bg-pink-100 text-pink-700 dark:bg-pink-900/40 dark:text-pink-300',
  zone_spices: 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300',
  zone_wholesale: 'bg-teal-100 text-teal-700 dark:bg-teal-900/40 dark:text-teal-300',
};

const langLabelMap: Record<string, string> = {
  sw: 'SW',
  en: 'EN',
  ar: 'AR',
  fr: 'FR',
  de: 'DE',
  zh: 'ZH',
  it: 'IT',
};

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

export function GuideCard({
  guide,
  language = 'sw',
  view = 'seeker',
  onAccept,
  onViewProfile,
  className,
}: GuideCardProps) {
  const isVerifiedElite = guide.isVerifiedElite || guide.badgeTypes?.includes('verified_elite');

  return (
    <Card
      className={cn(
        'relative overflow-hidden transition-shadow hover:shadow-md',
        isVerifiedElite && 'ring-2 ring-amber-400 dark:ring-amber-500',
        className
      )}
    >
      {isVerifiedElite && (
        <div className="absolute top-0 right-0 bg-amber-400 dark:bg-amber-500 text-amber-900 dark:text-amber-950 text-[10px] font-bold px-2 py-0.5 rounded-bl-lg flex items-center gap-1">
          <ShieldCheck className="size-3" />
          {t('badge_verified_elite', language)}
        </div>
      )}

      <CardContent className="p-4">
        <div className="flex gap-3">
          {/* Avatar */}
          <div className="shrink-0">
            {guide.avatarUrl ? (
              <img
                src={guide.avatarUrl}
                alt={guide.name}
                className="size-12 rounded-full object-cover"
              />
            ) : (
              <div
                className={cn(
                  'size-12 rounded-full flex items-center justify-center text-white font-bold text-sm',
                  getAvatarColor(guide.id)
                )}
              >
                {getInitials(guide.name)}
              </div>
            )}
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="font-semibold text-foreground text-sm truncate">{guide.name}</h3>
              <StatusBadge status={guide.currentStatus} size="sm" showLabel={false} />
            </div>

            <RatingStars rating={guide.rating} size="sm" className="mt-1" />

            <div className="flex items-center gap-3 mt-1.5 text-xs text-muted-foreground">
              <span className="flex items-center gap-1">
                <MessageSquare className="size-3" />
                {guide.totalSessions} {t('no_sessions', language).replace('Hakuna ', '').replace('No ', '')}
              </span>
            </div>
          </div>
        </div>

        {/* Zones */}
        {guide.zones.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-3">
            {guide.zones.map((zone) => (
              <Badge
                key={zone}
                variant="secondary"
                className={cn('text-[10px] px-1.5 py-0 h-5', zoneColorMap[zone] || '')}
              >
                <MapPin className="size-2.5 mr-0.5" />
                {t(zone, language)}
              </Badge>
            ))}
          </div>
        )}

        {/* Languages */}
        {guide.languages.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-2">
            {guide.languages.map((lang) => (
              <span
                key={lang}
                className="inline-flex items-center justify-center rounded-md bg-muted text-muted-foreground text-[10px] font-medium px-1.5 py-0.5"
              >
                {langLabelMap[lang] || lang.toUpperCase()}
              </span>
            ))}
          </div>
        )}

        {/* Verified badge */}
        {guide.status === 'active' && !isVerifiedElite && (
          <div className="flex items-center gap-1 mt-2 text-emerald-600 dark:text-emerald-400 text-xs">
            <ShieldCheck className="size-3.5" />
            {t('trust_verified', language)}
          </div>
        )}

        {/* Actions */}
        {view === 'seeker' && (
          <div className="flex gap-2 mt-3">
            {onAccept && guide.currentStatus === 'online' && (
              <Button
                size="sm"
                className="flex-1 h-9"
                onClick={() => onAccept(guide.id)}
              >
                {t('accept_guide', language)}
              </Button>
            )}
            {onViewProfile && (
              <Button
                variant="outline"
                size="sm"
                className="flex-1 h-9"
                onClick={() => onViewProfile(guide.id)}
              >
                {t('guide_profile', language)}
              </Button>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

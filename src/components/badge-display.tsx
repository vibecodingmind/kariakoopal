'use client';

import {
  Award,
  Zap,
  Star,
  Trophy,
  Scissors,
  Flame,
  Package,
  ShieldCheck,
  CalendarCheck,
  Crown,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { t, type Language } from '@/lib/i18n';
import type { Badge } from '@/lib/stores/auth-store';

interface BadgeDisplayProps {
  badges: Badge[];
  language?: Language;
  compact?: boolean;
  className?: string;
}

const badgeConfig: Record<string, { icon: React.ElementType; color: string; bg: string }> = {
  vyombo_specialist: { icon: Package, color: 'text-orange-600 dark:text-orange-400', bg: 'bg-orange-50 dark:bg-orange-950/50 border-orange-200 dark:border-orange-800' },
  electronics_pro: { icon: Zap, color: 'text-sky-600 dark:text-sky-400', bg: 'bg-sky-50 dark:bg-sky-950/50 border-sky-200 dark:border-sky-800' },
  top_rated: { icon: Star, color: 'text-amber-600 dark:text-amber-400', bg: 'bg-amber-50 dark:bg-amber-950/50 border-amber-200 dark:border-amber-800' },
  '100_sessions': { icon: Trophy, color: 'text-purple-600 dark:text-purple-400', bg: 'bg-purple-50 dark:bg-purple-950/50 border-purple-200 dark:border-purple-800' },
  fabric_expert: { icon: Scissors, color: 'text-pink-600 dark:text-pink-400', bg: 'bg-pink-50 dark:bg-pink-950/50 border-pink-200 dark:border-pink-800' },
  spice_master: { icon: Flame, color: 'text-red-600 dark:text-red-400', bg: 'bg-red-50 dark:bg-red-950/50 border-red-200 dark:border-red-800' },
  wholesale_guru: { icon: Package, color: 'text-teal-600 dark:text-teal-400', bg: 'bg-teal-50 dark:bg-teal-950/50 border-teal-200 dark:border-teal-800' },
  verified_elite: { icon: ShieldCheck, color: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-50 dark:bg-emerald-950/50 border-emerald-200 dark:border-emerald-800' },
  '7_day_streak': { icon: CalendarCheck, color: 'text-indigo-600 dark:text-indigo-400', bg: 'bg-indigo-50 dark:bg-indigo-950/50 border-indigo-200 dark:border-indigo-800' },
  guide_of_week: { icon: Crown, color: 'text-yellow-600 dark:text-yellow-400', bg: 'bg-yellow-50 dark:bg-yellow-950/50 border-yellow-200 dark:border-yellow-800' },
};

const defaultConfig = { icon: Award, color: 'text-gray-600 dark:text-gray-400', bg: 'bg-gray-50 dark:bg-gray-900/50 border-gray-200 dark:border-gray-700' };

export function BadgeDisplay({ badges, language = 'sw', compact = false, className }: BadgeDisplayProps) {
  if (!badges || badges.length === 0) {
    return null;
  }

  return (
    <div
      className={cn(
        compact ? 'flex flex-wrap gap-1.5' : 'grid grid-cols-2 sm:grid-cols-3 gap-3',
        className
      )}
    >
      {badges.map((badge) => {
        const config = badgeConfig[badge.badgeType] || defaultConfig;
        const Icon = config.icon;
        const name = t(`badge_${badge.badgeType}`, language);

        if (compact) {
          return (
            <div
              key={badge.id}
              className={cn(
                'inline-flex items-center justify-center rounded-md border p-1.5',
                config.bg
              )}
              title={name}
            >
              <Icon className={cn('size-4', config.color)} />
            </div>
          );
        }

        return (
          <div
            key={badge.id}
            className={cn(
              'flex items-center gap-3 rounded-lg border p-3',
              config.bg
            )}
          >
            <div className={cn('flex items-center justify-center rounded-md p-2', config.bg)}>
              <Icon className={cn('size-5', config.color)} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-foreground truncate">{name}</p>
              <p className="text-xs text-muted-foreground">
                {new Date(badge.awardedAt).toLocaleDateString(language === 'sw' ? 'sw-TZ' : 'en-US', {
                  year: 'numeric',
                  month: 'short',
                  day: 'numeric',
                })}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
}

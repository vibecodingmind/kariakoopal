'use client';

import { useState, useCallback } from 'react';
import {
  Crown,
  Zap,
  Star,
  Check,
  ArrowRight,
  Sparkles,
  Shield,
  BarChart3,
  MapPin,
  Trophy,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { t, type Language } from '@/lib/i18n';
import { useAuthStore } from '@/lib/stores/auth-store';
import { cn } from '@/lib/utils';

// ── Types ──

interface SubscriptionTiersProps {
  currentTier: 'starter' | 'pro' | 'elite';
  onUpgrade: (tier: 'pro' | 'elite') => void;
  language?: 'sw' | 'en';
  className?: string;
}

// ── Helpers ──

function formatTZS(n: number): string {
  return n.toLocaleString('en-TZ');
}

// ── Tier config ──

const tiers = [
  {
    id: 'starter' as const,
    price: 0,
    priceLabelKey: 'sub_starter_price',
    nameKey: 'sub_starter',
    icon: Shield,
    color: 'from-slate-400 to-slate-500',
    shadowColor: 'shadow-slate-400/20',
    features: [
      { key: 'sub_basic_matching', included: true },
      { key: 'sub_sessions_per_day', included: true },
      { key: 'sub_unlimited_sessions', included: false },
      { key: 'sub_priority_matching', included: false },
      { key: 'sub_analytics', included: false },
      { key: 'sub_featured_homepage', included: false },
      { key: 'sub_guide_of_week', included: false },
      { key: 'sub_exclusive_zones', included: false },
    ],
  },
  {
    id: 'pro' as const,
    price: 15000,
    priceLabelKey: 'sub_pro_price',
    nameKey: 'sub_pro',
    icon: Zap,
    color: 'from-amber-500 to-orange-500',
    shadowColor: 'shadow-amber-500/20',
    popular: true,
    features: [
      { key: 'sub_basic_matching', included: true },
      { key: 'sub_sessions_per_day', included: true },
      { key: 'sub_unlimited_sessions', included: true },
      { key: 'sub_priority_matching', included: true },
      { key: 'sub_analytics', included: true },
      { key: 'sub_featured_homepage', included: false },
      { key: 'sub_guide_of_week', included: false },
      { key: 'sub_exclusive_zones', included: false },
    ],
  },
  {
    id: 'elite' as const,
    price: 35000,
    priceLabelKey: 'sub_elite_price',
    nameKey: 'sub_elite',
    icon: Crown,
    color: 'from-amber-600 to-orange-600',
    shadowColor: 'shadow-amber-600/25',
    features: [
      { key: 'sub_basic_matching', included: true },
      { key: 'sub_sessions_per_day', included: true },
      { key: 'sub_unlimited_sessions', included: true },
      { key: 'sub_priority_matching', included: true },
      { key: 'sub_analytics', included: true },
      { key: 'sub_featured_homepage', included: true },
      { key: 'sub_guide_of_week', included: true },
      { key: 'sub_exclusive_zones', included: true },
    ],
  },
] as const;

// ── Component ──

export function SubscriptionTiers({
  currentTier,
  onUpgrade,
  language: languageProp,
  className,
}: SubscriptionTiersProps) {
  const storeLanguage = useAuthStore((s) => s.language);
  const lang = languageProp || (storeLanguage as Language) || 'sw';

  const [selectedTier, setSelectedTier] = useState<string | null>(null);

  const handleUpgrade = useCallback(
    (tierId: 'pro' | 'elite') => {
      setSelectedTier(tierId);
      onUpgrade(tierId);
    },
    [onUpgrade]
  );

  return (
    <div className={cn('glass-card gradient-border p-5 space-y-5', className)}>
      {/* ── Header ── */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="size-9 rounded-xl bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center shadow-lg shadow-amber-500/20">
            <Star className="size-4 text-white" />
          </div>
          <div>
            <h3 className="font-semibold text-sm gradient-text">
              {t('sub_choose_plan', lang)}
            </h3>
            <p className="text-[11px] text-muted-foreground">
              {t('sub_current_plan', lang)}: {t(`sub_${currentTier}`, lang)}
            </p>
          </div>
        </div>
      </div>

      {/* ── Tier cards ── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {tiers.map((tier) => {
          const TierIcon = tier.icon;
          const isCurrent = currentTier === tier.id;
          const isUpgrade = tier.price > 0 && !isCurrent && tier.id !== 'starter';

          return (
            <div
              key={tier.id}
              className={cn(
                'glass rounded-xl p-4 space-y-3 transition-all duration-300 relative',
                isCurrent && 'ring-2 ring-amber-400 dark:ring-amber-600',
                tier.popular && 'ring-1 ring-amber-300 dark:ring-amber-700'
              )}
            >
              {/* Popular badge */}
              {tier.popular && (
                <div className="absolute -top-2.5 left-1/2 -translate-x-1/2">
                  <Badge className="bg-gradient-to-r from-amber-500 to-orange-500 text-white border-0 text-[10px] font-bold px-2.5 py-0.5">
                    <Sparkles className="size-3 mr-0.5" />
                    {t('sub_most_popular', lang)}
                  </Badge>
                </div>
              )}

              {/* Icon + name */}
              <div className="flex items-center gap-2">
                <div
                  className={cn(
                    'size-8 rounded-lg bg-gradient-to-br flex items-center justify-center',
                    tier.color
                  )}
                >
                  <TierIcon className="size-4 text-white" />
                </div>
                <div>
                  <p className="text-sm font-bold">{t(tier.nameKey, lang)}</p>
                  <p className="text-[11px] text-muted-foreground">
                    {tier.price === 0
                      ? t('sub_free', lang)
                      : `TZS ${formatTZS(tier.price)}${t('sub_per_month', lang)}`}
                  </p>
                </div>
              </div>

              {/* Price display */}
              <div className="text-center py-2">
                <span className="text-2xl font-extrabold gradient-text">
                  {tier.price === 0
                    ? t('sub_starter_price', lang)
                    : formatTZS(tier.price)}
                </span>
                {tier.price > 0 && (
                  <span className="text-xs text-muted-foreground ml-1">
                    TZS{t('sub_per_month', lang)}
                  </span>
                )}
              </div>

              {/* Features */}
              <div className="space-y-1.5">
                {tier.features.map((feature) => (
                  <div
                    key={feature.key}
                    className={cn(
                      'flex items-center gap-1.5 text-xs',
                      feature.included
                        ? 'text-foreground'
                        : 'text-muted-foreground/50 line-through'
                    )}
                  >
                    <Check
                      className={cn(
                        'size-3 shrink-0',
                        feature.included
                          ? 'text-emerald-500'
                          : 'text-muted-foreground/30'
                      )}
                    />
                    {t(feature.key, lang)}
                  </div>
                ))}
              </div>

              {/* Action */}
              {isCurrent ? (
                <div className="flex items-center justify-center gap-1.5 h-9 glass rounded-lg text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                  <Check className="size-3.5" />
                  {t('sub_current_plan', lang)}
                </div>
              ) : isUpgrade ? (
                <Button
                  className="w-full h-9 text-xs font-semibold glass-button"
                  onClick={() => handleUpgrade(tier.id as 'pro' | 'elite')}
                  disabled={selectedTier === tier.id}
                >
                  {selectedTier === tier.id ? (
                    <>
                      <Check className="size-3.5 mr-1" />
                      {t('success', lang)}
                    </>
                  ) : (
                    <>
                      {t('sub_upgrade', lang)}
                      <ArrowRight className="size-3.5 ml-1" />
                    </>
                  )}
                </Button>
              ) : (
                <div className="h-9" />
              )}
            </div>
          );
        })}
      </div>

      {/* ── Feature highlights ── */}
      <div className="glass rounded-xl p-3.5 grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="flex items-center gap-2 text-xs">
          <BarChart3 className="size-4 text-amber-500 shrink-0" />
          <span className="text-muted-foreground">{t('sub_analytics', lang)}</span>
        </div>
        <div className="flex items-center gap-2 text-xs">
          <MapPin className="size-4 text-amber-500 shrink-0" />
          <span className="text-muted-foreground">{t('sub_exclusive_zones', lang)}</span>
        </div>
        <div className="flex items-center gap-2 text-xs">
          <Zap className="size-4 text-amber-500 shrink-0" />
          <span className="text-muted-foreground">{t('sub_priority_matching', lang)}</span>
        </div>
        <div className="flex items-center gap-2 text-xs">
          <Trophy className="size-4 text-amber-500 shrink-0" />
          <span className="text-muted-foreground">{t('sub_guide_of_week', lang)}</span>
        </div>
      </div>
    </div>
  );
}

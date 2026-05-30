'use client';

import { useState, useMemo, useCallback } from 'react';
import {
  Scale,
  Copy,
  Check,
  ArrowRight,
  TrendingDown,
  AlertTriangle,
  CheckCircle2,
  Minus,
  Gauge,
  Sparkles,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { t, type Language } from '@/lib/i18n';
import { useAuthStore } from '@/lib/stores/auth-store';
import { cn } from '@/lib/utils';

// ── Types ──

interface HagglingAssistantProps {
  category: string;
  vendorPrice: number;
  fairMin: number;
  fairMax: number;
  zoneName: string;
  language?: 'sw' | 'en';
  onAcceptCounter?: (price: number) => void;
  className?: string;
}

// ── Helpers ──

function formatTZS(n: number): string {
  return n.toLocaleString('en-TZ');
}

function getPriceStatus(
  vendorPrice: number,
  fairMin: number,
  fairMax: number
): 'overpriced' | 'slightly_high' | 'fair' {
  if (vendorPrice > fairMax * 1.15) return 'overpriced';
  if (vendorPrice > fairMax) return 'slightly_high';
  return 'fair';
}

function getSuggestedCounter(
  vendorPrice: number,
  fairMax: number,
  fairMin: number
): number {
  // 70-90% of vendor price, capped at fairMax, floored at fairMin
  const counter = Math.round(vendorPrice * 0.8);
  return Math.min(Math.max(counter, fairMin), fairMax);
}

function getSwahiliPhrase(
  category: string,
  counterPrice: number,
  lang: Language
): string {
  if (lang === 'sw') {
    return `Naomba bei ndogo kidogo, bei yangu ni TZS ${formatTZS(counterPrice)}`;
  }
  return `Could you lower the price a bit? My offer is TZS ${formatTZS(counterPrice)}`;
}

// ── Category config ──

const categoryConfig: Record<string, { emoji: string; color: string }> = {
  kanga: { emoji: '🧶', color: 'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-300' },
  fabric: { emoji: '👔', color: 'bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-300' },
  electronics: { emoji: '📱', color: 'bg-sky-100 text-sky-700 dark:bg-sky-900/30 dark:text-sky-300' },
  spices: { emoji: '🌶️', color: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300' },
  vyombo: { emoji: '🥘', color: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300' },
  wholesale: { emoji: '📦', color: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300' },
  default: { emoji: '🛍️', color: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300' },
};

// ── Component ──

export function HagglingAssistant({
  category,
  vendorPrice,
  fairMin,
  fairMax,
  zoneName,
  language: languageProp,
  onAcceptCounter,
  className,
}: HagglingAssistantProps) {
  const storeLanguage = useAuthStore((s) => s.language);
  const lang = languageProp || (storeLanguage as Language) || 'sw';

  const [copied, setCopied] = useState(false);
  const [accepted, setAccepted] = useState(false);

  // ── Computed values ──
  const priceStatus = useMemo(
    () => getPriceStatus(vendorPrice, fairMin, fairMax),
    [vendorPrice, fairMin, fairMax]
  );

  const suggestedCounter = useMemo(
    () => getSuggestedCounter(vendorPrice, fairMax, fairMin),
    [vendorPrice, fairMax, fairMin]
  );

  const savings = vendorPrice - suggestedCounter;

  const phrase = useMemo(
    () => getSwahiliPhrase(category, suggestedCounter, lang),
    [category, suggestedCounter, lang]
  );

  const catConfig = categoryConfig[category] || categoryConfig.default;

  // ── Gauge calculations ──
  const range = fairMax * 1.5 - fairMin * 0.5;
  const gaugeMin = fairMin * 0.5;
  const vendorPercent = Math.min(
    100,
    Math.max(0, ((vendorPrice - gaugeMin) / range) * 100)
  );
  const fairMinPercent = ((fairMin - gaugeMin) / range) * 100;
  const fairMaxPercent = ((fairMax - gaugeMin) / range) * 100;
  const counterPercent = ((suggestedCounter - gaugeMin) / range) * 100;

  // ── Handlers ──
  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(phrase);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // fallback
    }
  }, [phrase]);

  const handleAccept = useCallback(() => {
    setAccepted(true);
    onAcceptCounter?.(suggestedCounter);
  }, [suggestedCounter, onAcceptCounter]);

  // ── Status config ──
  const statusConfig = {
    overpriced: {
      color: 'text-red-600 dark:text-red-400',
      bg: 'bg-red-50 dark:bg-red-900/20',
      border: 'border-red-200 dark:border-red-800',
      barColor: 'bg-red-500',
      gaugeColor: '#ef4444',
      icon: AlertTriangle,
      labelKey: 'haggling_overpriced',
    },
    slightly_high: {
      color: 'text-amber-600 dark:text-amber-400',
      bg: 'bg-amber-50 dark:bg-amber-900/20',
      border: 'border-amber-200 dark:border-amber-800',
      barColor: 'bg-amber-500',
      gaugeColor: '#f59e0b',
      icon: Minus,
      labelKey: 'haggling_slightly_high',
    },
    fair: {
      color: 'text-emerald-600 dark:text-emerald-400',
      bg: 'bg-emerald-50 dark:bg-emerald-900/20',
      border: 'border-emerald-200 dark:border-emerald-800',
      barColor: 'bg-emerald-500',
      gaugeColor: '#22c55e',
      icon: CheckCircle2,
      labelKey: 'haggling_fair_price',
    },
  };

  const config = statusConfig[priceStatus];
  const StatusIcon = config.icon;

  return (
    <div
      className={cn(
        'glass-card gradient-border p-5 space-y-5',
        className
      )}
    >
      {/* ── Header ── */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="size-9 rounded-xl bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center shadow-lg shadow-amber-500/20">
            <Scale className="size-4 text-white" />
          </div>
          <div>
            <h3 className="font-semibold text-sm gradient-text">
              {t('haggling_title', lang)}
            </h3>
            <p className="text-[11px] text-muted-foreground">
              {t('haggling_price_analysis', lang)}
            </p>
          </div>
        </div>
        <Badge className={cn('text-[11px] font-medium px-2.5 py-0.5 border', catConfig.color)}>
          {catConfig.emoji} {category}
        </Badge>
      </div>

      {/* ── Status indicator ── */}
      <div
        className={cn(
          'flex items-center gap-2.5 rounded-xl border px-3.5 py-2.5',
          config.bg,
          config.border
        )}
      >
        <StatusIcon className={cn('size-5 shrink-0', config.color)} />
        <div className="flex-1">
          <p className={cn('text-sm font-semibold', config.color)}>
            {t(config.labelKey, lang)}
          </p>
          <p className="text-[11px] text-muted-foreground">
            {t('haggling_zone', lang)}: {zoneName}
          </p>
        </div>
        {savings > 0 && (
          <div className="text-right">
            <p className="text-[11px] text-muted-foreground">{t('haggling_your_savings', lang)}</p>
            <p className={cn('text-sm font-bold', config.color)}>
              {formatTZS(savings)} TZS
            </p>
          </div>
        )}
      </div>

      {/* ── Price gauge ── */}
      <div className="space-y-2.5">
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>{t('haggling_fair_range', lang)}</span>
          <span>{t('haggling_vendor_price', lang)}</span>
        </div>

        {/* Gauge bar */}
        <div className="relative h-3 rounded-full bg-muted/50 overflow-hidden">
          {/* Fair range highlight */}
          <div
            className="absolute top-0 h-full bg-emerald-500/20 rounded-full transition-all duration-700"
            style={{
              left: `${fairMinPercent}%`,
              width: `${fairMaxPercent - fairMinPercent}%`,
            }}
          />
          {/* Fair range borders */}
          <div
            className="absolute top-0 h-full w-0.5 bg-emerald-500/60"
            style={{ left: `${fairMinPercent}%` }}
          />
          <div
            className="absolute top-0 h-full w-0.5 bg-emerald-500/60"
            style={{ left: `${fairMaxPercent}%` }}
          />
          {/* Vendor price marker */}
          <div
            className="absolute top-1/2 -translate-y-1/2 size-4 rounded-full border-2 border-white shadow-lg transition-all duration-700"
            style={{
              left: `calc(${vendorPercent}% - 8px)`,
              backgroundColor: config.gaugeColor,
            }}
          />
          {/* Counter-offer marker */}
          <div
            className="absolute top-1/2 -translate-y-1/2 size-3.5 rounded-full border-2 border-white shadow-md bg-amber-500 transition-all duration-700 animate-gentle-pulse"
            style={{
              left: `calc(${counterPercent}% - 7px)`,
            }}
          />
        </div>

        {/* Gauge labels */}
        <div className="flex items-center justify-between text-[11px]">
          <span className="text-emerald-600 dark:text-emerald-400 font-medium">
            {formatTZS(fairMin)}
          </span>
          <span className="text-emerald-600 dark:text-emerald-400 font-medium">
            {formatTZS(fairMax)}
          </span>
        </div>
      </div>

      {/* ── Price comparison bars ── */}
      <div className="space-y-3">
        {/* Vendor price bar */}
        <div className="space-y-1">
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground">{t('haggling_vendor_price', lang)}</span>
            <span className={cn('font-semibold', config.color)}>{formatTZS(vendorPrice)} TZS</span>
          </div>
          <div className="h-2.5 rounded-full bg-muted/30 overflow-hidden">
            <div
              className={cn('h-full rounded-full transition-all duration-1000', config.barColor)}
              style={{ width: `${vendorPercent}%` }}
            />
          </div>
        </div>

        {/* Suggested counter bar */}
        <div className="space-y-1">
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground">{t('haggling_suggested_counter', lang)}</span>
            <span className="font-semibold text-amber-600 dark:text-amber-400">
              {formatTZS(suggestedCounter)} TZS
            </span>
          </div>
          <div className="h-2.5 rounded-full bg-muted/30 overflow-hidden">
            <div
              className="h-full rounded-full bg-gradient-to-r from-amber-500 to-orange-500 transition-all duration-1000"
              style={{ width: `${counterPercent}%` }}
            />
          </div>
        </div>
      </div>

      {/* ── Mini Price Radar chart ── */}
      <div className="glass rounded-xl p-3 space-y-2">
        <div className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
          <Gauge className="size-3.5" />
          Price Radar — {category}
        </div>
        <div className="flex items-end gap-1 h-12">
          {generateRadarBars(fairMin, fairMax, vendorPrice, suggestedCounter)}
        </div>
        <div className="flex items-center justify-between text-[10px] text-muted-foreground">
          <span>Low</span>
          <span>Mid</span>
          <span>High</span>
        </div>
      </div>

      {/* ── Negotiation phrase ── */}
      <div className="glass rounded-xl p-3.5 space-y-2">
        <div className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
          <Sparkles className="size-3.5 text-amber-500" />
          {t('haggling_phrase_label', lang)}
        </div>
        <div className="flex items-start gap-2">
          <p className="flex-1 text-sm font-medium leading-relaxed">
            &ldquo;{phrase}&rdquo;
          </p>
          <Button
            variant="ghost"
            size="sm"
            className="shrink-0 size-8 p-0"
            onClick={handleCopy}
          >
            {copied ? (
              <Check className="size-3.5 text-emerald-500" />
            ) : (
              <Copy className="size-3.5" />
            )}
          </Button>
        </div>
      </div>

      {/* ── Accept Counter button ── */}
      <Button
        className={cn(
          'w-full h-12 text-sm font-semibold glass-button',
          accepted && 'opacity-70 cursor-not-allowed'
        )}
        disabled={accepted}
        onClick={handleAccept}
      >
        {accepted ? (
          <>
            <CheckCircle2 className="size-4 mr-1.5" />
            {lang === 'sw' ? 'Umekubali' : 'Accepted'}
          </>
        ) : (
          <>
            <TrendingDown className="size-4 mr-1.5" />
            {t('haggling_accept_counter', lang)} — {formatTZS(suggestedCounter)} TZS
            <ArrowRight className="size-4 ml-1.5" />
          </>
        )}
      </Button>
    </div>
  );
}

// ── Radar bars generator ──

function generateRadarBars(
  fairMin: number,
  fairMax: number,
  vendorPrice: number,
  counterPrice: number
) {
  const bars = [];
  const segments = 12;
  const range = fairMax * 1.5 - fairMin * 0.3;
  const base = fairMin * 0.3;

  for (let i = 0; i < segments; i++) {
    const segValue = base + (range / segments) * (i + 0.5);
    const isInRange = segValue >= fairMin && segValue <= fairMax;
    const isVendor = Math.abs(segValue - vendorPrice) < range / segments;
    const isCounter = Math.abs(segValue - counterPrice) < range / segments;

    let height = 15 + (i / segments) * 55;
    let color = 'bg-muted/40';

    if (isInRange) {
      height = 50 + Math.random() * 25;
      color = 'bg-emerald-500/60';
    }
    if (isVendor) {
      height = 70;
      color = 'bg-red-500/70';
    }
    if (isCounter) {
      height = 60;
      color = 'bg-amber-500/70';
    }

    bars.push(
      <div
        key={i}
        className={cn('flex-1 rounded-sm transition-all duration-500', color)}
        style={{ height: `${height}%` }}
      />
    );
  }
  return bars;
}

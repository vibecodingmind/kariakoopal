'use client';

import { useState, useCallback, useMemo } from 'react';
import {
  ArrowLeftRight,
  DollarSign,
  Euro,
  Banknote,
  ChevronDown,
  ChevronUp,
  TrendingUp,
  RefreshCw,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { t, type Language } from '@/lib/i18n';
import { useAuthStore } from '@/lib/stores/auth-store';
import { cn } from '@/lib/utils';

// ── Types ──

interface MultiCurrencyProps {
  amountInTZS: number;
  onCurrencyChange: (currency: string) => void;
  showMore: boolean;
  language?: 'sw' | 'en';
  className?: string;
}

// ── Simulated exchange rates ──

const exchangeRates: Record<string, { rate: number; symbol: string; icon: React.ElementType; labelKey: string }> = {
  TZS: { rate: 1, symbol: 'TZS', icon: Banknote, labelKey: 'currency_tzs' },
  USD: { rate: 0.00039, symbol: '$', icon: DollarSign, labelKey: 'currency_usd' },
  EUR: { rate: 0.00036, symbol: '\u20ac', icon: Euro, labelKey: 'currency_eur' },
  KES: { rate: 0.050, symbol: 'KES', icon: Banknote, labelKey: 'currency_kes' },
  UGX: { rate: 1.43, symbol: 'UGX', icon: Banknote, labelKey: 'currency_ugx' },
};

// ── Helpers ──

function formatTZS(n: number): string {
  return n.toLocaleString('en-TZ');
}

function formatCurrency(amount: number, currency: string): string {
  const config = exchangeRates[currency];
  if (!config) return amount.toLocaleString();

  const converted = amount * config.rate;

  switch (currency) {
    case 'TZS':
      return formatTZS(Math.round(converted));
    case 'USD':
    case 'EUR':
      return converted.toFixed(2);
    case 'KES':
      return Math.round(converted).toLocaleString();
    case 'UGX':
      return Math.round(converted).toLocaleString();
    default:
      return converted.toLocaleString();
  }
}

// ── Component ──

export function MultiCurrency({
  amountInTZS,
  onCurrencyChange,
  showMore: showMoreProp,
  language: languageProp,
  className,
}: MultiCurrencyProps) {
  const storeLanguage = useAuthStore((s) => s.language);
  const lang = languageProp || (storeLanguage as Language) || 'sw';

  const [showMore, setShowMore] = useState(showMoreProp);
  const [selectedCurrency, setSelectedCurrency] = useState('TZS');

  const primaryCurrencies = ['TZS', 'USD', 'EUR'];
  const allCurrencies = Object.keys(exchangeRates);
  const displayedCurrencies = showMore ? allCurrencies : primaryCurrencies;

  const handleCurrencySelect = useCallback(
    (currency: string) => {
      setSelectedCurrency(currency);
      onCurrencyChange(currency);
    },
    [onCurrencyChange]
  );

  return (
    <div className={cn('glass-card gradient-border p-5 space-y-5', className)}>
      {/* ── Header ── */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="size-9 rounded-xl bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center shadow-lg shadow-amber-500/20">
            <ArrowLeftRight className="size-4 text-white" />
          </div>
          <div>
            <h3 className="font-semibold text-sm gradient-text">
              {t('currency_convert', lang)}
            </h3>
            <p className="text-[11px] text-muted-foreground">
              {t('currency_rate', lang)}: {lang === 'sw' ? 'moja kwa moja' : 'live'}
            </p>
          </div>
        </div>
        <Badge variant="outline" className="text-[11px]">
          {formatTZS(amountInTZS)} TZS
        </Badge>
      </div>

      {/* ── Main TZS display ── */}
      <div className="glass rounded-xl p-4 text-center space-y-1.5">
        <p className="text-xs text-muted-foreground">{t('currency_tzs', lang)}</p>
        <p className="text-3xl font-extrabold gradient-text">
          {formatTZS(amountInTZS)}
        </p>
        <p className="text-sm text-muted-foreground">TZS</p>
      </div>

      {/* ── Currency conversion cards ── */}
      <div className="space-y-2">
        <p className="text-[11px] font-medium text-muted-foreground flex items-center gap-1">
          <TrendingUp className="size-3 text-amber-500" />
          {t('currency_convert', lang)}
        </p>

        <div className="grid grid-cols-1 gap-2">
          {displayedCurrencies.map((currency) => {
            const config = exchangeRates[currency];
            const CurrencyIcon = config.icon;
            const isSelected = selectedCurrency === currency;
            const isTZS = currency === 'TZS';

            return (
              <button
                key={currency}
                className={cn(
                  'glass rounded-xl p-3 flex items-center gap-3 transition-all duration-200 w-full text-left',
                  isSelected && !isTZS && 'ring-1 ring-amber-300 dark:ring-amber-700'
                )}
                onClick={() => handleCurrencySelect(currency)}
              >
                {/* Icon */}
                <div
                  className={cn(
                    'size-9 rounded-lg flex items-center justify-center shrink-0',
                    isSelected
                      ? 'bg-gradient-to-br from-amber-500 to-orange-500'
                      : 'bg-muted/50'
                  )}
                >
                  <CurrencyIcon
                    className={cn(
                      'size-4',
                      isSelected ? 'text-white' : 'text-muted-foreground'
                    )}
                  />
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <p className="text-xs font-semibold">{currency}</p>
                    <span className="text-[10px] text-muted-foreground">
                      {t(config.labelKey, lang)}
                    </span>
                  </div>
                  <p className="text-[10px] text-muted-foreground">
                    {t('currency_rate', lang)}: 1 TZS = {config.rate.toFixed(config.rate < 1 ? 6 : 2)} {currency}
                  </p>
                </div>

                {/* Converted amount */}
                <div className="text-right shrink-0">
                  <p
                    className={cn(
                      'text-sm font-bold',
                      isSelected ? 'gradient-text' : 'text-foreground'
                    )}
                  >
                    {config.symbol} {formatCurrency(amountInTZS, currency)}
                  </p>
                  {!isTZS && (
                    <p className="text-[9px] text-muted-foreground">{currency}</p>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Show more/less toggle ── */}
      <Button
        variant="outline"
        size="sm"
        className="w-full h-9 text-xs font-medium border-amber-200 dark:border-amber-800 text-amber-700 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-900/20"
        onClick={() => setShowMore((prev) => !prev)}
      >
        {showMore ? (
          <>
            <ChevronUp className="size-3.5 mr-1" />
            {t('currency_show_less', lang)}
          </>
        ) : (
          <>
            <ChevronDown className="size-3.5 mr-1" />
            {t('currency_show_more', lang)}
          </>
        )}
      </Button>

      {/* ── Rate info ── */}
      <div className="flex items-center gap-2 text-[11px] text-muted-foreground bg-muted/30 rounded-lg px-3 py-2">
        <RefreshCw className="size-3.5 text-amber-500 shrink-0" />
        <span>
          {lang === 'sw'
            ? 'Viwango vya kubadilisha ni vya makisio'
            : 'Exchange rates are approximate'}
        </span>
      </div>
    </div>
  );
}

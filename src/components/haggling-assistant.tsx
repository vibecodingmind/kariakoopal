'use client';

import { useState, useMemo, useCallback, useEffect } from 'react';
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
  Search,
  ChevronDown,
  ChevronUp,
  MessageSquare,
  Calculator,
  Lightbulb,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { t, type Language } from '@/lib/i18n';
import { useAuthStore } from '@/lib/stores/auth-store';
import { priceRadarApi, zonesApi, type PriceRadarEntry, type Zone } from '@/lib/api';
import { cn } from '@/lib/utils';

// ── Types ──

interface HagglingAssistantProps {
  className?: string;
}

interface HagglingStep {
  step: number;
  sw: string;
  en: string;
  icon: React.ReactNode;
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

function getSuggestedOffer(fairMax: number, fairMin: number, step: number): number {
  // Start at 40-60% of max, gradually increase
  const startPercent = 0.4;
  const endPercent = 0.9;
  const totalSteps = 5;
  const percent = startPercent + ((endPercent - startPercent) * Math.min(step, totalSteps)) / totalSteps;
  const offer = Math.round(fairMax * percent);
  return Math.min(Math.max(offer, fairMin), fairMax);
}

function getNegotiationTips(
  priceStatus: 'overpriced' | 'slightly_high' | 'fair',
  lang: Language
): string[] {
  if (lang === 'sw') {
    switch (priceStatus) {
      case 'overpriced':
        return [
          'Bei hii ni juu sana! Anza na bei ya chini kabisa.',
          'Onesha kuwa unajua bei ya soko - taja bei ya haki.',
          'Kuwa tayari kuondoka - muuzaji mara nyingi atapunguza bei.',
          'Linganisha na maduka mengine kabla ya kukubali.',
        ];
      case 'slightly_high':
        return [
          'Bei iko kidogo juu. Pendekeza bei karibu ya wastani.',
          'Omba punguzo kidogo - mara nyingi wanakubali.',
          'Nunua bidhaa nyingi kupata punguzo.',
        ];
      case 'fair':
        return [
          'Bei hii ni ya haki! Unaweza kujadiliana kidogo tu.',
          'Hakikisha ubora wa bidhaa kabla ya kulipa.',
          'Uliza kuhusu dhamana au udhuru wa kurudisha.',
        ];
    }
  }
  switch (priceStatus) {
    case 'overpriced':
      return [
        'This price is way too high! Start with a low counter-offer.',
        'Show you know the market - mention the fair price range.',
        'Be ready to walk away - vendors often lower the price.',
        'Compare with other shops before agreeing.',
      ];
    case 'slightly_high':
      return [
        'Price is slightly above fair. Offer near the middle range.',
        'Ask for a small discount - they often accept.',
        'Buy multiple items to get a bundle discount.',
      ];
    case 'fair':
      return [
        'This is a fair price! You can negotiate only slightly.',
        'Make sure to check quality before paying.',
        'Ask about warranties or return policies.',
      ];
  }
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

// ── Haggling steps ──

const hagglingSteps: HagglingStep[] = [
  {
    step: 1,
    sw: 'Uliza bei kwanza - acha muuzaji ataje bei yake',
    en: 'Ask the price first - let the vendor name their price',
    icon: <MessageSquare className="size-4" />,
  },
  {
    step: 2,
    sw: 'Onesha kupendezwa lakini sema bei ni juu',
    en: 'Show interest but say the price is too high',
    icon: <Minus className="size-4" />,
  },
  {
    step: 3,
    sw: 'Toa pendekezo lako - anza chini kabisa',
    en: 'Make your counter-offer - start low',
    icon: <TrendingDown className="size-4" />,
  },
  {
    step: 4,
    sw: 'Mwandamashee - ongeza kidogo kila mara',
    en: 'Negotiate - increase slightly each time',
    icon: <ArrowRight className="size-4" />,
  },
  {
    step: 5,
    sw: 'Fikia makubaliano au ondoka kwa heshima',
    en: 'Reach an agreement or walk away politely',
    icon: <CheckCircle2 className="size-4" />,
  },
];

// ── Component ──

export function HagglingAssistant({ className }: HagglingAssistantProps) {
  const storeLanguage = useAuthStore((s) => s.language);
  const lang = (storeLanguage as Language) || 'sw';

  // ── State ──
  const [itemName, setItemName] = useState('');
  const [selectedZone, setSelectedZone] = useState('');
  const [priceData, setPriceData] = useState<PriceRadarEntry[]>([]);
  const [zones, setZones] = useState<Zone[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [vendorPrice, setVendorPrice] = useState<string>('');
  const [negotiationStep, setNegotiationStep] = useState(0);
  const [showGuide, setShowGuide] = useState(false);
  const [copied, setCopied] = useState(false);

  // ── Load data ──
  useEffect(() => {
    async function loadData() {
      try {
        const [priceResult, zoneResult] = await Promise.all([
          priceRadarApi.list(),
          zonesApi.list(),
        ]);
        setPriceData(priceResult);
        setZones(zoneResult);
        if (zoneResult.length > 0 && !selectedZone) {
          setSelectedZone(zoneResult[0].id);
        }
      } catch {
        // API not available, use empty data
      }
    }
    loadData();
  }, []);

  // ── Find matching price entry ──
  const matchingEntry = useMemo(() => {
    if (!itemName || !selectedZone) return null;
    const searchLower = itemName.toLowerCase();
    return priceData.find(
      (p) =>
        p.zoneId === selectedZone &&
        (p.category.toLowerCase().includes(searchLower) ||
          searchLower.includes(p.category.toLowerCase()))
    );
  }, [itemName, selectedZone, priceData]);

  // ── All entries for selected zone ──
  const zoneEntries = useMemo(() => {
    if (!selectedZone) return [];
    return priceData.filter((p) => p.zoneId === selectedZone);
  }, [selectedZone, priceData]);

  // ── Computed values ──
  const fairMin = matchingEntry?.priceMin ?? 0;
  const fairMax = matchingEntry?.priceMax ?? 0;
  const vendorPriceNum = parseFloat(vendorPrice) || 0;

  const priceStatus = useMemo(
    () => (fairMin && fairMax && vendorPriceNum ? getPriceStatus(vendorPriceNum, fairMin, fairMax) : null),
    [vendorPriceNum, fairMin, fairMax]
  );

  const suggestedOffer = useMemo(
    () => (fairMax && fairMin ? getSuggestedOffer(fairMax, fairMin, negotiationStep) : 0),
    [fairMax, fairMin, negotiationStep]
  );

  const savings = vendorPriceNum - suggestedOffer;

  const negotiationTips = useMemo(
    () => (priceStatus ? getNegotiationTips(priceStatus, lang) : []),
    [priceStatus, lang]
  );

  const zoneName = useMemo(() => {
    const zone = zones.find((z) => z.id === selectedZone);
    if (!zone) return '';
    return lang === 'sw' ? zone.nameSw : zone.name;
  }, [zones, selectedZone, lang]);

  // ── Handlers ──
  const handleSearch = useCallback(async () => {
    if (!itemName.trim()) return;
    setIsLoading(true);
    try {
      const result = await priceRadarApi.list();
      setPriceData(result);
    } catch {
      // Silently handle
    }
    setIsLoading(false);
  }, [itemName]);

  const handleNextStep = useCallback(() => {
    if (negotiationStep < 4) {
      setNegotiationStep((s) => s + 1);
    }
  }, [negotiationStep]);

  const handlePrevStep = useCallback(() => {
    if (negotiationStep > 0) {
      setNegotiationStep((s) => s - 1);
    }
  }, [negotiationStep]);

  const handleCopy = useCallback(async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback
    }
  }, []);

  // ── Status config ──
  const statusConfig = {
    overpriced: {
      color: 'text-red-600 dark:text-red-400',
      bg: 'bg-red-50 dark:bg-red-900/20',
      border: 'border-red-200 dark:border-red-800',
      barColor: 'bg-red-500',
      icon: AlertTriangle,
      labelKey: 'haggling_overpriced',
    },
    slightly_high: {
      color: 'text-amber-600 dark:text-amber-400',
      bg: 'bg-amber-50 dark:bg-amber-900/20',
      border: 'border-amber-200 dark:border-amber-800',
      barColor: 'bg-amber-500',
      icon: Minus,
      labelKey: 'haggling_slightly_high',
    },
    fair: {
      color: 'text-emerald-600 dark:text-emerald-400',
      bg: 'bg-emerald-50 dark:bg-emerald-900/20',
      border: 'border-emerald-200 dark:border-emerald-800',
      barColor: 'bg-emerald-500',
      icon: CheckCircle2,
      labelKey: 'haggling_fair_price',
    },
  };

  const phraseSw = `Naomba bei ndogo kidogo, bei yangu ni TZS ${formatTZS(suggestedOffer)}`;
  const phraseEn = `Could you lower the price a bit? My offer is TZS ${formatTZS(suggestedOffer)}`;
  const currentPhrase = lang === 'sw' ? phraseSw : phraseEn;

  return (
    <div className={cn('glass-card gradient-border p-5 space-y-5', className)}>
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
      </div>

      {/* ── Search Section ── */}
      <div className="glass rounded-xl p-3 space-y-2.5">
        <div className="flex gap-2">
          <Input
            value={itemName}
            onChange={(e) => setItemName(e.target.value)}
            placeholder={lang === 'sw' ? 'Tafuta bidhaa (mf: kanga, viungo)' : 'Search item (e.g. kanga, spices)'}
            className="glass-input h-9 text-sm"
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
          />
          <Button
            size="sm"
            className="shrink-0 glass-button h-9 px-3"
            onClick={handleSearch}
            disabled={isLoading}
          >
            {isLoading ? (
              <span className="size-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <Search className="size-4" />
            )}
          </Button>
        </div>
        <div className="flex gap-2">
          <Select value={selectedZone} onValueChange={setSelectedZone}>
            <SelectTrigger className="glass-input h-8 text-xs flex-1">
              <SelectValue placeholder={lang === 'sw' ? 'Chagua eneo' : 'Select zone'} />
            </SelectTrigger>
            <SelectContent>
              {zones.map((zone) => (
                <SelectItem key={zone.id} value={zone.id}>
                  {lang === 'sw' ? zone.nameSw : zone.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* ── Price Range Display ── */}
      {matchingEntry && (
        <div className="glass rounded-xl p-4 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
              <Gauge className="size-3.5" />
              {lang === 'sw' ? 'Rada ya Bei' : 'Price Radar'} — {matchingEntry.category}
            </div>
            <Badge className={cn('text-[11px] font-medium px-2.5 py-0.5 border', (categoryConfig[matchingEntry.category] || categoryConfig.default).color)}>
              {(categoryConfig[matchingEntry.category] || categoryConfig.default).emoji} {matchingEntry.category}
            </Badge>
          </div>

          {/* Fair price range bars */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="text-emerald-600 dark:text-emerald-400 font-medium">
                {lang === 'sw' ? 'Bei ya chini' : 'Min Price'}
              </span>
              <span className="font-bold text-emerald-600 dark:text-emerald-400">
                {formatTZS(fairMin)} TZS
              </span>
            </div>
            <div className="h-2.5 rounded-full bg-muted/30 overflow-hidden">
              <div
                className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-emerald-400 transition-all duration-700"
                style={{ width: '100%' }}
              />
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-amber-600 dark:text-amber-400 font-medium">
                {lang === 'sw' ? 'Bei ya juu' : 'Max Price'}
              </span>
              <span className="font-bold text-amber-600 dark:text-amber-400">
                {formatTZS(fairMax)} TZS
              </span>
            </div>
            <div className="h-2.5 rounded-full bg-muted/30 overflow-hidden">
              <div
                className="h-full rounded-full bg-gradient-to-r from-amber-500 to-orange-500 transition-all duration-700"
                style={{ width: '100%' }}
              />
            </div>
          </div>

          <div className="text-center text-[11px] text-muted-foreground pt-1">
            {lang === 'sw' ? 'Eneo' : 'Zone'}: {zoneName}
          </div>
        </div>
      )}

      {/* ── Zone Price Entries (if no exact match) ── */}
      {!matchingEntry && zoneEntries.length > 0 && (
        <div className="glass rounded-xl p-3 space-y-2">
          <p className="text-[11px] font-medium text-muted-foreground flex items-center gap-1">
            <Gauge className="size-3 text-amber-500" />
            {lang === 'sw' ? 'Bei katika eneo hili' : 'Prices in this zone'}
          </p>
          <div className="max-h-32 overflow-y-auto space-y-1.5 pr-1">
            {zoneEntries.map((entry) => {
              const catConfig = categoryConfig[entry.category] || categoryConfig.default;
              return (
                <button
                  key={entry.id}
                  onClick={() => setItemName(entry.category)}
                  className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-[11px] hover:bg-amber-50/50 dark:hover:bg-amber-900/10 transition-colors"
                >
                  <span className={cn('font-medium px-1.5 py-0.5 rounded border', catConfig.color)}>
                    {catConfig.emoji} {entry.category}
                  </span>
                  <span className="text-muted-foreground">
                    {formatTZS(entry.priceMin)} - {formatTZS(entry.priceMax)} TZS
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* ── Vendor Price Input ── */}
      {matchingEntry && (
        <div className="glass rounded-xl p-3 space-y-2.5">
          <p className="text-[11px] font-medium text-muted-foreground flex items-center gap-1">
            <Calculator className="size-3 text-amber-500" />
            {lang === 'sw' ? 'Weka bei ya muuzaji' : 'Enter vendor price'}
          </p>
          <div className="flex gap-2 items-center">
            <Input
              type="number"
              value={vendorPrice}
              onChange={(e) => {
                setVendorPrice(e.target.value);
                setNegotiationStep(0);
              }}
              placeholder={lang === 'sw' ? 'Mf: 25000' : 'e.g. 25000'}
              className="glass-input h-9 text-sm flex-1"
            />
            <span className="text-xs text-muted-foreground font-medium">TZS</span>
          </div>
        </div>
      )}

      {/* ── Price Status ── */}
      {priceStatus && vendorPriceNum > 0 && (
        <div
          className={cn(
            'flex items-center gap-2.5 rounded-xl border px-3.5 py-2.5',
            statusConfig[priceStatus].bg,
            statusConfig[priceStatus].border
          )}
        >
          {(() => {
            const StatusIcon = statusConfig[priceStatus].icon;
            return <StatusIcon className={cn('size-5 shrink-0', statusConfig[priceStatus].color)} />;
          })()}
          <div className="flex-1">
            <p className={cn('text-sm font-semibold', statusConfig[priceStatus].color)}>
              {t(statusConfig[priceStatus].labelKey, lang)}
            </p>
            <p className="text-[11px] text-muted-foreground">
              {t('haggling_zone', lang)}: {zoneName}
            </p>
          </div>
          {savings > 0 && (
            <div className="text-right">
              <p className="text-[11px] text-muted-foreground">{t('haggling_your_savings', lang)}</p>
              <p className={cn('text-sm font-bold', statusConfig[priceStatus].color)}>
                {formatTZS(savings)} TZS
              </p>
            </div>
          )}
        </div>
      )}

      {/* ── Suggested Offer Calculator ── */}
      {matchingEntry && vendorPriceNum > 0 && (
        <div className="glass rounded-xl p-4 space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-xs font-medium text-muted-foreground flex items-center gap-1">
              <Sparkles className="size-3 text-amber-500" />
              {lang === 'sw' ? 'Pendekezo la Bei' : 'Suggested Offer'}
            </p>
            <div className="flex items-center gap-1">
              <button
                onClick={handlePrevStep}
                disabled={negotiationStep === 0}
                className="size-6 rounded-md glass flex items-center justify-center hover:bg-amber-100/50 dark:hover:bg-amber-900/20 transition-colors disabled:opacity-30"
              >
                <ChevronDown className="size-3" />
              </button>
              <span className="text-[11px] font-medium text-amber-600 dark:text-amber-400 w-6 text-center">
                {negotiationStep + 1}/5
              </span>
              <button
                onClick={handleNextStep}
                disabled={negotiationStep >= 4}
                className="size-6 rounded-md glass flex items-center justify-center hover:bg-amber-100/50 dark:hover:bg-amber-900/20 transition-colors disabled:opacity-30"
              >
                <ChevronUp className="size-3" />
              </button>
            </div>
          </div>

          <div className="text-center py-2">
            <p className="text-3xl font-bold gradient-text">
              {formatTZS(suggestedOffer)} TZS
            </p>
            <p className="text-[11px] text-muted-foreground mt-1">
              {lang === 'sw'
                ? `Hatua ya ${negotiationStep + 1} - ${negotiationStep < 2 ? 'Anza chini' : negotiationStep < 4 ? 'Ongeza kidogo' : 'Bei ya mwisho'}`
                : `Step ${negotiationStep + 1} - ${negotiationStep < 2 ? 'Start low' : negotiationStep < 4 ? 'Increase slightly' : 'Final offer'}`}
            </p>
          </div>

          {/* Progress bar */}
          <div className="h-2 rounded-full bg-muted/30 overflow-hidden">
            <div
              className="h-full rounded-full bg-gradient-to-r from-amber-500 to-orange-500 transition-all duration-500"
              style={{ width: `${((negotiationStep + 1) / 5) * 100}%` }}
            />
          </div>
        </div>
      )}

      {/* ── Negotiation Tips ── */}
      {negotiationTips.length > 0 && (
        <div className="glass rounded-xl p-3 space-y-2">
          <p className="text-[11px] font-medium text-muted-foreground flex items-center gap-1">
            <Lightbulb className="size-3 text-amber-500" />
            {lang === 'sw' ? 'Vidokezo vya Kujadiliana' : 'Negotiation Tips'}
          </p>
          <div className="space-y-1.5">
            {negotiationTips.map((tip, idx) => (
              <div key={idx} className="flex items-start gap-2 text-[11px] text-muted-foreground">
                <span className="shrink-0 size-4 rounded-full bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 flex items-center justify-center text-[9px] font-bold mt-0.5">
                  {idx + 1}
                </span>
                <span className="leading-relaxed">{tip}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Negotiation Phrase ── */}
      {suggestedOffer > 0 && (
        <div className="glass rounded-xl p-3.5 space-y-2">
          <div className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
            <Sparkles className="size-3.5 text-amber-500" />
            {t('haggling_phrase_label', lang)}
          </div>
          <div className="space-y-1.5">
            <div className="flex items-start gap-2">
              <p className="flex-1 text-sm font-medium leading-relaxed">
                &ldquo;{phraseSw}&rdquo;
              </p>
              <Button
                variant="ghost"
                size="sm"
                className="shrink-0 size-7 p-0"
                onClick={() => handleCopy(phraseSw)}
              >
                {copied ? <Check className="size-3 text-emerald-500" /> : <Copy className="size-3" />}
              </Button>
            </div>
            {lang === 'en' && (
              <p className="text-[11px] text-muted-foreground italic pl-1">
                EN: &ldquo;{phraseEn}&rdquo;
              </p>
            )}
            {lang === 'sw' && (
              <p className="text-[11px] text-muted-foreground italic pl-1">
                EN: &ldquo;{phraseEn}&rdquo;
              </p>
            )}
          </div>
        </div>
      )}

      {/* ── Step-by-step Haggling Guide ── */}
      <div className="space-y-2">
        <button
          onClick={() => setShowGuide(!showGuide)}
          className="w-full flex items-center justify-between text-xs font-medium text-muted-foreground hover:text-foreground transition-colors"
        >
          <span className="flex items-center gap-1">
            <MessageSquare className="size-3 text-amber-500" />
            {lang === 'sw' ? 'Mwongozo wa Kujadiliana Hatua kwa Hatua' : 'Step-by-step Haggling Guide'}
          </span>
          {showGuide ? <ChevronUp className="size-3.5" /> : <ChevronDown className="size-3.5" />}
        </button>

        {showGuide && (
          <div className="glass rounded-xl p-3 space-y-3">
            {hagglingSteps.map((step, idx) => (
              <div key={step.step} className="flex items-start gap-2.5">
                <div
                  className={cn(
                    'size-7 rounded-lg flex items-center justify-center shrink-0 text-xs font-bold',
                    idx <= negotiationStep
                      ? 'bg-gradient-to-br from-amber-500 to-orange-500 text-white'
                      : 'bg-muted/30 text-muted-foreground'
                  )}
                >
                  {step.step}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[11px] font-medium leading-relaxed">
                    {lang === 'sw' ? step.sw : step.en}
                  </p>
                  {lang === 'sw' && (
                    <p className="text-[10px] text-muted-foreground italic mt-0.5">{step.en}</p>
                  )}
                  {lang === 'en' && (
                    <p className="text-[10px] text-muted-foreground italic mt-0.5">{step.sw}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── Action Button ── */}
      {suggestedOffer > 0 && (
        <Button
          className="w-full h-12 text-sm font-semibold glass-button"
          onClick={handleNextStep}
          disabled={negotiationStep >= 4}
        >
          {negotiationStep >= 4 ? (
            <>
              <CheckCircle2 className="size-4 mr-1.5" />
              {lang === 'sw' ? 'Umekubali' : 'Offer Accepted'}
            </>
          ) : (
            <>
              <TrendingDown className="size-4 mr-1.5" />
              {lang === 'sw' ? 'Pendekeza Bei' : 'Suggest Offer'} — {formatTZS(suggestedOffer)} TZS
              <ArrowRight className="size-4 ml-1.5" />
            </>
          )}
        </Button>
      )}
    </div>
  );
}

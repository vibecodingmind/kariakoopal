'use client';

import { Tag, Clock, MessageSquare, Filter } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { t, type Language } from '@/lib/i18n';
import { useAuthStore } from '@/lib/stores/auth-store';
import { cn } from '@/lib/utils';
import { useState, useMemo } from 'react';

interface PriceItem {
  id: string;
  category: string;
  zoneId: string;
  zoneNameKey: string;
  minPrice: number;
  maxPrice: number;
  updatedAt: string;
}

interface PriceRadarPanelProps {
  prices: PriceItem[];
  zones?: Array<{ id: string; nameKey: string }>;
  language?: Language;
  isLoading?: boolean;
  onSuggestUpdate?: (priceId: string, suggestion: string) => void;
  className?: string;
}

const categoryIcons: Record<string, React.ElementType> = {
  default: Tag,
};

const zoneColorMap: Record<string, { bg: string; bar: string; barBg: string }> = {
  zone_vyombo: { bg: 'border-orange-200 dark:border-orange-800', bar: 'bg-orange-500', barBg: 'bg-orange-100 dark:bg-orange-900/30' },
  zone_electronics: { bg: 'border-sky-200 dark:border-sky-800', bar: 'bg-sky-500', barBg: 'bg-sky-100 dark:bg-sky-900/30' },
  zone_fabric: { bg: 'border-pink-200 dark:border-pink-800', bar: 'bg-pink-500', barBg: 'bg-pink-100 dark:bg-pink-900/30' },
  zone_spices: { bg: 'border-red-200 dark:border-red-800', bar: 'bg-red-500', barBg: 'bg-red-100 dark:bg-red-900/30' },
  zone_wholesale: { bg: 'border-teal-200 dark:border-teal-800', bar: 'bg-teal-500', barBg: 'bg-teal-100 dark:bg-teal-900/30' },
};

const defaultZoneColors = { bg: 'border-muted', bar: 'bg-primary', barBg: 'bg-muted' };

function formatTZS(amount: number, lang: Language): string {
  return new Intl.NumberFormat(lang === 'sw' ? 'sw-TZ' : 'en-US').format(amount);
}

export function PriceRadarPanel({
  prices,
  zones = [],
  language: propLanguage,
  isLoading = false,
  onSuggestUpdate,
  className,
}: PriceRadarPanelProps) {
  const storeLanguage = useAuthStore((s) => s.language) as Language;
  const language = propLanguage || storeLanguage;

  const [filterZone, setFilterZone] = useState<string>('all');
  const [suggestOpen, setSuggestOpen] = useState(false);
  const [suggestPriceId, setSuggestPriceId] = useState<string>('');
  const [suggestionText, setSuggestionText] = useState('');

  const filteredPrices = useMemo(() => {
    if (filterZone === 'all') return prices;
    return prices.filter((p) => p.zoneId === filterZone);
  }, [prices, filterZone]);

  // Calculate a global max for price bars
  const globalMax = useMemo(() => {
    if (filteredPrices.length === 0) return 1;
    return Math.max(...filteredPrices.map((p) => p.maxPrice));
  }, [filteredPrices]);

  const handleSuggest = () => {
    if (onSuggestUpdate && suggestionText.trim()) {
      onSuggestUpdate(suggestPriceId, suggestionText);
      setSuggestionText('');
      setSuggestOpen(false);
    }
  };

  const openSuggest = (priceId: string) => {
    setSuggestPriceId(priceId);
    setSuggestionText('');
    setSuggestOpen(true);
  };

  if (isLoading) {
    return (
      <div className={cn('space-y-4', className)}>
        <Skeleton className="h-8 w-40" />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {Array.from({ length: 4 }, (_, i) => (
            <Skeleton key={i} className="h-32 rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className={cn('space-y-4', className)}>
      {/* Header */}
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <h2 className="text-lg font-bold text-foreground">{t('price_radar_title', language)}</h2>
        <div className="flex items-center gap-2">
          <Filter className="size-4 text-muted-foreground" />
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
        </div>
      </div>

      {/* Price cards */}
      {filteredPrices.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <Tag className="size-10 mx-auto mb-2 opacity-50" />
          <p className="text-sm">{t('no_results', language)}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {filteredPrices.map((price) => {
            const colors = zoneColorMap[price.zoneId] || defaultZoneColors;
            const Icon = categoryIcons[price.category] || categoryIcons.default;

            return (
              <Card key={price.id} className={cn('overflow-hidden border', colors.bg)}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <div className={cn('size-8 rounded-lg flex items-center justify-center', colors.barBg)}>
                        <Icon className={cn('size-4', colors.bar.replace('bg-', 'text-'))} />
                      </div>
                      <div>
                        <h3 className="font-semibold text-sm text-foreground">{price.category}</h3>
                        <p className="text-[10px] text-muted-foreground">{t(price.zoneNameKey, language)}</p>
                      </div>
                    </div>

                    {onSuggestUpdate && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 gap-1 text-xs shrink-0"
                        onClick={() => openSuggest(price.id)}
                      >
                        <MessageSquare className="size-3" />
                        {t('suggest_update', language)}
                      </Button>
                    )}
                  </div>

                  {/* Price range */}
                  <div className="mt-3">
                    <div className="flex items-baseline justify-between text-xs mb-1">
                      <span className="text-muted-foreground">{t('min_price', language)}</span>
                      <span className="font-medium text-foreground">{formatTZS(price.minPrice, language)} {t('tzs', language)}</span>
                    </div>

                    {/* Price bar */}
                    <div className={cn('h-2 rounded-full overflow-hidden', colors.barBg)}>
                      <div
                        className={cn('h-full rounded-full', colors.bar)}
                        style={{
                          marginLeft: `${(price.minPrice / globalMax) * 100}%`,
                          width: `${((price.maxPrice - price.minPrice) / globalMax) * 100}%`,
                        }}
                      />
                    </div>

                    <div className="flex items-baseline justify-between text-xs mt-1">
                      <span className="text-muted-foreground">{t('max_price', language)}</span>
                      <span className="font-medium text-foreground">{formatTZS(price.maxPrice, language)} {t('tzs', language)}</span>
                    </div>
                  </div>

                  {/* Last updated */}
                  <div className="flex items-center gap-1 mt-2 text-[10px] text-muted-foreground">
                    <Clock className="size-2.5" />
                    {t('last_updated', language)}: {new Date(price.updatedAt).toLocaleDateString(language === 'sw' ? 'sw-TZ' : 'en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Suggest update dialog */}
      <Dialog open={suggestOpen} onOpenChange={setSuggestOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('suggest_update', language)}</DialogTitle>
            <DialogDescription>
              {language === 'sw'
                ? 'Pendekeza marekebisho ya bei ya haki'
                : 'Suggest a fair price update'}
            </DialogDescription>
          </DialogHeader>

          <textarea
            value={suggestionText}
            onChange={(e) => setSuggestionText(e.target.value)}
            placeholder={language === 'sw' ? 'Eleza marekebisho yako...' : 'Describe your suggestion...'}
            className="w-full h-24 rounded-md border bg-background px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-ring"
          />

          <DialogFooter>
            <Button variant="outline" onClick={() => setSuggestOpen(false)}>
              {t('cancel', language)}
            </Button>
            <Button onClick={handleSuggest} disabled={!suggestionText.trim()}>
              {t('submit', language)}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

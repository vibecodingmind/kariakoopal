'use client';

import { useState, useCallback } from 'react';
import {
  Package,
  Clock,
  MapPin,
  Truck,
  Star,
  ArrowRight,
  Zap,
  CheckCircle2,
  Tag,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { t, type Language } from '@/lib/i18n';
import { useAuthStore } from '@/lib/stores/auth-store';
import { cn } from '@/lib/utils';

// ── Types ──

interface PackageDeal {
  id: string;
  title: string;
  duration: number; // in hours
  zones: string[];
  price: number;
  deliveryIncluded: boolean;
  sessionsCompleted?: number;
  isPopular?: boolean;
}

interface PackageDealsProps {
  packages: PackageDeal[];
  guideName: string;
  onBook: (packageId: string) => void;
  language?: 'sw' | 'en';
  className?: string;
}

// ── Helpers ──

function formatTZS(n: number): string {
  return n.toLocaleString('en-TZ');
}

// ── Component ──

export function PackageDeals({
  packages,
  guideName,
  onBook,
  language: languageProp,
  className,
}: PackageDealsProps) {
  const storeLanguage = useAuthStore((s) => s.language);
  const lang = languageProp || (storeLanguage as Language) || 'sw';

  const [bookedIds, setBookedIds] = useState<Set<string>>(new Set());

  const handleBook = useCallback(
    (pkgId: string) => {
      setBookedIds((prev) => new Set(prev).add(pkgId));
      onBook(pkgId);
    },
    [onBook]
  );

  return (
    <div className={cn('glass-card gradient-border p-5 space-y-5', className)}>
      {/* ── Header ── */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="size-9 rounded-xl bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center shadow-lg shadow-amber-500/20">
            <Package className="size-4 text-white" />
          </div>
          <div>
            <h3 className="font-semibold text-sm gradient-text">
              {t('package_title', lang)}
            </h3>
            <p className="text-[11px] text-muted-foreground">
              {t('package_by_guide', lang)} {guideName}
            </p>
          </div>
        </div>
        <Badge variant="outline" className="text-[11px]">
          {packages.length} {t('package_title', lang).toLowerCase()}
        </Badge>
      </div>

      {/* ── Package cards ── */}
      <div className="space-y-3 max-h-96 overflow-y-auto pr-1">
        {packages.map((pkg) => {
          const isBooked = bookedIds.has(pkg.id);

          return (
            <div
              key={pkg.id}
              className={cn(
                'glass rounded-xl p-4 space-y-3 transition-all duration-300 relative',
                isBooked && 'opacity-70',
                pkg.isPopular && 'ring-1 ring-amber-300 dark:ring-amber-700'
              )}
            >
              {/* Popular badge */}
              {pkg.isPopular && (
                <div className="absolute -top-2 left-4">
                  <Badge className="bg-gradient-to-r from-amber-500 to-orange-500 text-white border-0 text-[10px] font-bold px-2.5 py-0.5">
                    <Zap className="size-3 mr-0.5" />
                    {t('package_most_popular', lang)}
                  </Badge>
                </div>
              )}

              {/* Title + price row */}
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <h4 className="text-sm font-bold truncate">{pkg.title}</h4>
                  <div className="flex items-center gap-2 mt-1 text-[11px] text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Clock className="size-3 text-amber-500" />
                      {pkg.duration} {t('package_hours', lang)}
                    </span>
                    {pkg.sessionsCompleted && (
                      <span className="flex items-center gap-1">
                        <Star className="size-3 text-amber-500" />
                        {pkg.sessionsCompleted} {t('package_sessions_completed', lang)}
                      </span>
                    )}
                  </div>
                </div>

                {/* Price */}
                <div className="text-right shrink-0">
                  <p className="text-lg font-extrabold gradient-text">
                    {formatTZS(pkg.price)}
                  </p>
                  <p className="text-[10px] text-muted-foreground">TZS</p>
                </div>
              </div>

              {/* Zones */}
              <div className="space-y-1.5">
                <p className="text-[11px] font-medium text-muted-foreground flex items-center gap-1">
                  <MapPin className="size-3 text-amber-500" />
                  {t('package_zones', lang)}
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {pkg.zones.map((zone, idx) => (
                    <Badge
                      key={idx}
                      variant="outline"
                      className="text-[10px] px-2 py-0.5 border-amber-200 dark:border-amber-800 text-amber-700 dark:text-amber-400"
                    >
                      {zone}
                    </Badge>
                  ))}
                </div>
              </div>

              {/* Delivery badge + price tag */}
              <div className="flex items-center justify-between">
                {pkg.deliveryIncluded ? (
                  <Badge className="bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800 text-[11px] px-2.5 py-0.5">
                    <Truck className="size-3 mr-1" />
                    {t('package_delivery_included', lang)}
                  </Badge>
                ) : (
                  <Badge variant="outline" className="text-[11px] px-2.5 py-0.5 text-muted-foreground">
                    <Tag className="size-3 mr-1" />
                    {t('package_price', lang)}: {formatTZS(pkg.price)} TZS
                  </Badge>
                )}

                {/* Book button */}
                {isBooked ? (
                  <div className="flex items-center gap-1 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                    <CheckCircle2 className="size-4" />
                    {t('completed', lang)}
                  </div>
                ) : (
                  <Button
                    size="sm"
                    className="h-8 text-xs font-semibold glass-button px-4"
                    onClick={() => handleBook(pkg.id)}
                  >
                    {t('package_book_now', lang)}
                    <ArrowRight className="size-3.5 ml-1" />
                  </Button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* ── Summary ── */}
      {packages.length > 0 && (
        <div className="glass rounded-xl p-3 flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Package className="size-4 text-amber-500" />
            <span>
              {packages.length} {t('package_title', lang).toLowerCase()}
            </span>
          </div>
          <div className="text-xs text-muted-foreground">
            {lang === 'sw' ? 'Kutoka' : 'From'}{' '}
            <span className="font-bold gradient-text">
              {formatTZS(Math.min(...packages.map((p) => p.price)))}
            </span>{' '}
            TZS
          </div>
        </div>
      )}
    </div>
  );
}

'use client';

import { Heart, MapPin, Star, Clock, Store, Search, LayoutGrid, Map } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { MapView } from '@/components/map-view';
import { t, type Language } from '@/lib/i18n';
import { useAuthStore } from '@/lib/stores/auth-store';
import { cn } from '@/lib/utils';
import { useState, useMemo } from 'react';

interface Vendor {
  id: string;
  name: string;
  zoneId: string;
  zoneNameKey: string;
  categories: string[];
  stallNumber: string;
  recommendations: number;
  openHours: string;
  isApproved: boolean;
  x?: number;
  y?: number;
}

interface VendorDirectoryProps {
  vendors: Vendor[];
  zones?: Array<{ id: string; nameKey: string }>;
  language?: Language;
  isLoading?: boolean;
  onRegisterVendor?: (data: { name: string; zoneId: string; categories: string; stallNumber: string }) => void;
  className?: string;
}

const zoneColorMap: Record<string, string> = {
  zone_vyombo: 'bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300',
  zone_electronics: 'bg-sky-100 text-sky-700 dark:bg-sky-900/40 dark:text-sky-300',
  zone_fabric: 'bg-pink-100 text-pink-700 dark:bg-pink-900/40 dark:text-pink-300',
  zone_spices: 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300',
  zone_wholesale: 'bg-teal-100 text-teal-700 dark:bg-teal-900/40 dark:text-teal-300',
};

export function VendorDirectory({
  vendors,
  zones = [],
  language: propLanguage,
  isLoading = false,
  onRegisterVendor,
  className,
}: VendorDirectoryProps) {
  const storeLanguage = useAuthStore((s) => s.language) as Language;
  const language = propLanguage || storeLanguage;

  const [searchQuery, setSearchQuery] = useState('');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [filterZone, setFilterZone] = useState<string>('all');
  const [showMap, setShowMap] = useState(false);
  const [favorites, setFavorites] = useState<Set<string>>(new Set());
  const [registerOpen, setRegisterOpen] = useState(false);
  const [regForm, setRegForm] = useState({ name: '', zoneId: '', categories: '', stallNumber: '' });

  // All unique categories
  const allCategories = useMemo(() => {
    const cats = new Set<string>();
    vendors.forEach((v) => v.categories.forEach((c) => cats.add(c)));
    return Array.from(cats).sort();
  }, [vendors]);

  // Filtered vendors
  const filteredVendors = useMemo(() => {
    return vendors.filter((v) => {
      const matchesSearch =
        !searchQuery ||
        v.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        v.categories.some((c) => c.toLowerCase().includes(searchQuery.toLowerCase()));
      const matchesCategory = filterCategory === 'all' || v.categories.includes(filterCategory);
      const matchesZone = filterZone === 'all' || v.zoneId === filterZone;
      return matchesSearch && matchesCategory && matchesZone;
    });
  }, [vendors, searchQuery, filterCategory, filterZone]);

  const toggleFavorite = (vendorId: string) => {
    setFavorites((prev) => {
      const next = new Set(prev);
      if (next.has(vendorId)) {
        next.delete(vendorId);
      } else {
        next.add(vendorId);
      }
      return next;
    });
  };

  const handleRegister = () => {
    if (onRegisterVendor && regForm.name.trim()) {
      onRegisterVendor(regForm);
      setRegForm({ name: '', zoneId: '', categories: '', stallNumber: '' });
      setRegisterOpen(false);
    }
  };

  // Loading skeleton
  if (isLoading) {
    return (
      <div className={cn('space-y-4', className)}>
        <div className="flex gap-2">
          <Skeleton className="h-9 flex-1" />
          <Skeleton className="h-9 w-20" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {Array.from({ length: 6 }, (_, i) => (
            <Skeleton key={i} className="h-40 rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className={cn('space-y-4', className)}>
      {/* Header */}
      <div className="flex items-center justify-between gap-2">
        <h2 className="text-lg font-bold text-foreground">{t('vendor_directory', language)}</h2>
        <div className="flex gap-1.5">
          <Button
            variant={!showMap ? 'default' : 'outline'}
            size="sm"
            onClick={() => setShowMap(false)}
            className="h-8 gap-1"
          >
            <LayoutGrid className="size-3.5" />
          </Button>
          <Button
            variant={showMap ? 'default' : 'outline'}
            size="sm"
            onClick={() => setShowMap(true)}
            className="h-8 gap-1"
          >
            <Map className="size-3.5" />
          </Button>
        </div>
      </div>

      {/* Search & Filters */}
      <div className="space-y-2">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={`${t('search', language)}...`}
            className="pl-9 h-10"
          />
        </div>

        <div className="flex gap-2 overflow-x-auto pb-1">
          {/* Zone filter */}
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

          {/* Category filter */}
          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            className="h-8 rounded-md border bg-background px-2 text-xs"
            aria-label={t('vendor_categories', language)}
          >
            <option value="all">{language === 'sw' ? 'Aina zote' : 'All categories'}</option>
            {allCategories.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Map view */}
      {showMap && (
        <MapView
          zones={zones.map((z) => ({
            id: z.id,
            name: t(z.nameKey, language),
            nameKey: z.nameKey,
            color: '',
            bgColor: '',
            x: 5,
            y: 5,
            w: 30,
            h: 40,
          }))}
          vendors={filteredVendors.map((v) => ({
            id: v.id,
            name: v.name,
            zoneId: v.zoneId,
            x: v.x || 50,
            y: v.y || 50,
          }))}
          className="w-full"
        />
      )}

      {/* Vendor grid */}
      {!showMap && (
        <>
          {filteredVendors.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Store className="size-10 mx-auto mb-2 opacity-50" />
              <p className="text-sm">{t('no_results', language)}</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {filteredVendors.map((vendor) => (
                <Card key={vendor.id} className="overflow-hidden">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-sm text-foreground truncate">{vendor.name}</h3>
                        <Badge
                          variant="secondary"
                          className={cn('text-[10px] mt-1 h-5', zoneColorMap[vendor.zoneId] || '')}
                        >
                          <MapPin className="size-2.5 mr-0.5" />
                          {t(vendor.zoneNameKey, language)}
                        </Badge>
                      </div>

                      <button
                        onClick={() => toggleFavorite(vendor.id)}
                        className="shrink-0 p-1.5 rounded-md hover:bg-muted/50 transition-colors"
                        aria-label={favorites.has(vendor.id) ? 'Remove from favorites' : 'Add to favorites'}
                      >
                        <Heart
                          className={cn(
                            'size-5',
                            favorites.has(vendor.id)
                              ? 'fill-red-500 text-red-500'
                              : 'text-muted-foreground'
                          )}
                        />
                      </button>
                    </div>

                    {/* Categories */}
                    <div className="flex flex-wrap gap-1 mt-2">
                      {vendor.categories.slice(0, 3).map((cat) => (
                        <Badge key={cat} variant="outline" className="text-[10px] h-5">
                          {cat}
                        </Badge>
                      ))}
                      {vendor.categories.length > 3 && (
                        <Badge variant="outline" className="text-[10px] h-5">
                          +{vendor.categories.length - 3}
                        </Badge>
                      )}
                    </div>

                    {/* Details */}
                    <div className="flex items-center gap-3 mt-2.5 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Store className="size-3" />
                        {t('vendor_stall', language)}: {vendor.stallNumber}
                      </span>
                      <span className="flex items-center gap-1">
                        <Star className="size-3" />
                        {vendor.recommendations}
                      </span>
                    </div>
                    <div className="flex items-center gap-1 mt-1 text-xs text-muted-foreground">
                      <Clock className="size-3" />
                      {vendor.openHours}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </>
      )}

      {/* Register as Vendor button */}
      {onRegisterVendor && (
        <div className="pt-2">
          <Button
            variant="outline"
            className="w-full h-11"
            onClick={() => setRegisterOpen(true)}
          >
            <Store className="size-4 mr-2" />
            {t('register_vendor', language)}
          </Button>
        </div>
      )}

      {/* Register Dialog */}
      <Dialog open={registerOpen} onOpenChange={setRegisterOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('register_vendor', language)}</DialogTitle>
            <DialogDescription>
              {language === 'sw'
                ? 'Jisajili kama muuzaji katika Kariakoo'
                : 'Register as a vendor in Kariakoo'}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3">
            <div>
              <label className="text-sm font-medium text-foreground">{t('vendor_name', language)}</label>
              <Input
                value={regForm.name}
                onChange={(e) => setRegForm((p) => ({ ...p, name: e.target.value }))}
                placeholder={language === 'sw' ? 'Jina la duka' : 'Shop name'}
                className="mt-1"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-foreground">{t('vendor_zone', language)}</label>
              <select
                value={regForm.zoneId}
                onChange={(e) => setRegForm((p) => ({ ...p, zoneId: e.target.value }))}
                className="mt-1 w-full h-9 rounded-md border bg-background px-3 text-sm"
              >
                <option value="">{language === 'sw' ? 'Chagua eneo' : 'Select zone'}</option>
                {zones.map((z) => (
                  <option key={z.id} value={z.id}>
                    {t(z.nameKey, language)}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-sm font-medium text-foreground">{t('vendor_categories', language)}</label>
              <Input
                value={regForm.categories}
                onChange={(e) => setRegForm((p) => ({ ...p, categories: e.target.value }))}
                placeholder={language === 'sw' ? 'Elektroniki, Vitambaa...' : 'Electronics, Fabric...'}
                className="mt-1"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-foreground">{t('vendor_stall', language)}</label>
              <Input
                value={regForm.stallNumber}
                onChange={(e) => setRegForm((p) => ({ ...p, stallNumber: e.target.value }))}
                placeholder={language === 'sw' ? 'Stendi namba' : 'Stall number'}
                className="mt-1"
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setRegisterOpen(false)}>
              {t('cancel', language)}
            </Button>
            <Button onClick={handleRegister} disabled={!regForm.name.trim()}>
              {t('submit', language)}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

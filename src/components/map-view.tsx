'use client';

import { MapPin, Navigation, Store, User } from 'lucide-react';
import { cn } from '@/lib/utils';
import { t, type Language } from '@/lib/i18n';
import { useAuthStore } from '@/lib/stores/auth-store';
import { useState } from 'react';

interface MapZone {
  id: string;
  name: string;
  nameKey: string;
  color: string;
  bgColor: string;
  x: number; // percentage
  y: number; // percentage
  w: number; // percentage width
  h: number; // percentage height
}

interface MapVendor {
  id: string;
  name: string;
  zoneId: string;
  x: number;
  y: number;
}

interface MapGuide {
  id: string;
  name: string;
  x: number;
  y: number;
}

interface MapViewProps {
  zones?: MapZone[];
  vendors?: MapVendor[];
  guides?: MapGuide[];
  userLocation?: { x: number; y: number };
  onZoneClick?: (zoneId: string) => void;
  className?: string;
}

const defaultZones: MapZone[] = [
  { id: 'zone_vyombo', name: 'Vyombo', nameKey: 'zone_vyombo', color: 'fill-orange-400/40 stroke-orange-500', bgColor: 'bg-orange-50 dark:bg-orange-950/30', x: 5, y: 5, w: 30, h: 40 },
  { id: 'zone_electronics', name: 'Electronics', nameKey: 'zone_electronics', color: 'fill-sky-400/40 stroke-sky-500', bgColor: 'bg-sky-50 dark:bg-sky-950/30', x: 38, y: 5, w: 30, h: 28 },
  { id: 'zone_fabric', name: 'Fabric', nameKey: 'zone_fabric', color: 'fill-pink-400/40 stroke-pink-500', bgColor: 'bg-pink-50 dark:bg-pink-950/30', x: 38, y: 36, w: 30, h: 28 },
  { id: 'zone_spices', name: 'Spices', nameKey: 'zone_spices', color: 'fill-red-400/40 stroke-red-500', bgColor: 'bg-red-50 dark:bg-red-950/30', x: 5, y: 48, w: 30, h: 40 },
  { id: 'zone_wholesale', name: 'Wholesale', nameKey: 'zone_wholesale', color: 'fill-teal-400/40 stroke-teal-500', bgColor: 'bg-teal-50 dark:bg-teal-950/30', x: 71, y: 5, w: 24, h: 83 },
];

const defaultVendors: MapVendor[] = [
  { id: 'v1', name: 'Mzee Juma', zoneId: 'zone_vyombo', x: 15, y: 20 },
  { id: 'v2', name: 'Bi Fatma', zoneId: 'zone_vyombo', x: 25, y: 35 },
  { id: 'v3', name: 'Hassan Tech', zoneId: 'zone_electronics', x: 48, y: 15 },
  { id: 'v4', name: 'Dar Electronics', zoneId: 'zone_electronics', x: 58, y: 22 },
  { id: 'v5', name: 'Mama Kitenge', zoneId: 'zone_fabric', x: 50, y: 48 },
  { id: 'v6', name: 'Spice World', zoneId: 'zone_spices', x: 15, y: 65 },
  { id: 'v7', name: 'Wholesale Hub', zoneId: 'zone_wholesale', x: 80, y: 40 },
];

const defaultGuides: MapGuide[] = [
  { id: 'g1', name: 'Amani', x: 20, y: 25 },
  { id: 'g2', name: 'Zahra', x: 55, y: 18 },
  { id: 'g3', name: 'Saidi', x: 78, y: 55 },
];

export function MapView({
  zones = defaultZones,
  vendors = defaultVendors,
  guides = defaultGuides,
  userLocation = { x: 50, y: 50 },
  onZoneClick,
  className,
}: MapViewProps) {
  const language = useAuthStore((s) => s.language) as Language;
  const [activeZone, setActiveZone] = useState<string | null>(null);

  const handleZoneClick = (zoneId: string) => {
    setActiveZone(zoneId === activeZone ? null : zoneId);
    onZoneClick?.(zoneId);
  };

  const activeZoneData = zones.find((z) => z.id === activeZone);

  return (
    <div className={cn('relative rounded-xl border bg-background overflow-hidden', className)}>
      {/* Map container */}
      <div className="relative w-full aspect-[4/3] bg-muted/30 dark:bg-muted/10">
        {/* Grid lines for street feel */}
        <svg className="absolute inset-0 w-full h-full opacity-10" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
              <path d="M 40 0 L 0 0 0 40" fill="none" stroke="currentColor" strokeWidth="0.5" className="text-foreground" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#grid)" />
        </svg>

        {/* Zone overlays */}
        <svg className="absolute inset-0 w-full h-full" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 90">
          {zones.map((zone) => (
            <g key={zone.id}>
              <rect
                x={zone.x}
                y={zone.y}
                width={zone.w}
                height={zone.h}
                rx="2"
                className={cn(
                  zone.color,
                  'cursor-pointer transition-all duration-200',
                  activeZone === zone.id ? 'stroke-[1.5] opacity-90' : 'stroke-[0.5] opacity-60 hover:opacity-80'
                )}
                onClick={() => handleZoneClick(zone.id)}
              />
              <text
                x={zone.x + zone.w / 2}
                y={zone.y + zone.h / 2}
                textAnchor="middle"
                dominantBaseline="central"
                className="text-[2.5px] fill-foreground font-semibold pointer-events-none select-none"
              >
                {t(zone.nameKey, language)}
              </text>
            </g>
          ))}
        </svg>

        {/* Vendor pins */}
        {vendors.map((vendor) => (
          <button
            key={vendor.id}
            className="absolute z-10 group"
            style={{ left: `${vendor.x}%`, top: `${vendor.y}%`, transform: 'translate(-50%, -100%)' }}
            aria-label={vendor.name}
          >
            <div className="relative">
              <Store className="size-4 text-foreground/80" />
              <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 text-[7px] font-medium text-foreground whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity bg-background/90 px-1 rounded">
                {vendor.name}
              </span>
            </div>
          </button>
        ))}

        {/* Guide locations (animated dots) */}
        {guides.map((guide) => (
          <div
            key={guide.id}
            className="absolute z-20 group"
            style={{ left: `${guide.x}%`, top: `${guide.y}%`, transform: 'translate(-50%, -50%)' }}
          >
            <div className="relative">
              <div className="size-3 rounded-full bg-emerald-500 animate-pulse" />
              <div className="absolute inset-0 size-3 rounded-full bg-emerald-500/40 animate-ping" />
              <span className="absolute -top-4 left-1/2 -translate-x-1/2 text-[7px] font-medium text-emerald-700 dark:text-emerald-300 whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity bg-background/90 px-1 rounded">
                {guide.name}
              </span>
            </div>
          </div>
        ))}

        {/* User location */}
        <div
          className="absolute z-30"
          style={{ left: `${userLocation.x}%`, top: `${userLocation.y}%`, transform: 'translate(-50%, -50%)' }}
        >
          <div className="relative">
            <div className="size-4 rounded-full bg-primary border-2 border-white dark:border-gray-800 shadow-lg flex items-center justify-center">
              <Navigation className="size-2 text-primary-foreground" />
            </div>
            <div className="absolute inset-0 size-4 rounded-full bg-primary/20 animate-ping" />
          </div>
        </div>

        {/* Legend */}
        <div className="absolute top-2 left-2 bg-background/80 backdrop-blur-sm rounded-lg p-2 text-[9px] flex flex-col gap-1">
          <div className="flex items-center gap-1.5">
            <div className="size-2 rounded-full bg-emerald-500" />
            <span className="text-foreground">{t('online', language)}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Store className="size-2.5 text-foreground/60" />
            <span className="text-foreground">{t('vendor_directory', language)}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="size-2 rounded-full bg-primary" />
            <span className="text-foreground"><User className="size-2 inline" /> {language === 'sw' ? 'Wewe' : 'You'}</span>
          </div>
        </div>
      </div>

      {/* Active zone detail panel */}
      {activeZoneData && (
        <div className={cn('p-3 border-t', activeZoneData.bgColor)}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <MapPin className="size-4 text-foreground" />
              <span className="font-medium text-sm text-foreground">{t(activeZoneData.nameKey, language)}</span>
            </div>
            <button
              onClick={() => setActiveZone(null)}
              className="text-xs text-muted-foreground hover:text-foreground"
            >
              {t('close', language)}
            </button>
          </div>
          <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
            <span>{vendors.filter((v) => v.zoneId === activeZoneData.id).length} {language === 'sw' ? 'wauzaji' : 'vendors'}</span>
            <span>{guides.length} {language === 'sw' ? 'waongozaji' : 'guides'}</span>
          </div>
        </div>
      )}
    </div>
  );
}

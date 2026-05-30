'use client';

import { useState, useEffect, useCallback, useRef, useMemo, lazy, Suspense } from 'react';
import { cn } from '@/lib/utils';
import { t, type Language } from '@/lib/i18n';
import { useAuthStore } from '@/lib/stores/auth-store';
import {
  MapPin,
  Store,
  Navigation,
  Plus,
  Minus,
  Crosshair,
  Search,
  X,
  Compass,
  ChevronUp,
} from 'lucide-react';

// ── Deterministic offset utility for SVG map ──
// Stable hash-based offset so vendor/guide positions don't jitter on re-render.
function deterministicSvgOffset(id: string, index: number, range: number): number {
  let hash = 0;
  const str = id + String(index);
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) - hash) + str.charCodeAt(i);
    hash |= 0;
  }
  return ((hash % 1000) / 1000 - 0.5) * 2 * range;
}

// ── Conditional rendering: use real Google Maps if API key is available ──
const GOOGLE_MAPS_API_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || '';

// ── Types ──

export interface ZoneData {
  id: string;
  name: string;
  nameKey?: string;
  color?: string;
  lat?: number;
  lng?: number;
}

export interface VendorMarker {
  id: string;
  name: string;
  zoneId?: string;
  lat?: number;
  lng?: number;
  category?: string;
}

export interface GuideMarker {
  id: string;
  name: string;
  lat?: number;
  lng?: number;
  rating?: number;
  isOnline?: boolean;
}

export interface GoogleMapProps {
  zones?: ZoneData[];
  vendors?: VendorMarker[];
  guides?: GuideMarker[];
  center?: { lat: number; lng: number };
  zoom?: number;
  onZoneClick?: (zoneId: string) => void;
  onVendorClick?: (vendorId: string) => void;
  onGuideClick?: (guideId: string) => void;
  className?: string;
  showUserLocation?: boolean;
  interactive?: boolean;
}

// ── Real Kariakoo Coordinates ──

const KARIAKOO_CENTER = { lat: -6.8264, lng: 39.2695 };

const ZONE_COORDS: Record<string, { lat: number; lng: number; color: string; label: string; labelSw: string }> = {
  zone_vyombo: { lat: -6.8250, lng: 39.2685, color: '#f97316', label: 'Vyombo', labelSw: 'Vyombo' },
  zone_electronics: { lat: -6.8270, lng: 39.2700, color: '#0ea5e9', label: 'Electronics', labelSw: 'Elektroniki' },
  zone_fabric: { lat: -6.8280, lng: 39.2690, color: '#ec4899', label: 'Fabric', labelSw: 'Vitambaa' },
  zone_spices: { lat: -6.8250, lng: 39.2700, color: '#ef4444', label: 'Spices', labelSw: 'Viungo' },
  zone_wholesale: { lat: -6.8270, lng: 39.2710, color: '#14b8a6', label: 'Wholesale', labelSw: 'Jumla' },
};

// ── SVG Map Zone Polygons (approximate real Kariakoo layout) ──
// Viewbox: 0 0 400 360
// These approximate the actual Kariakoo market layout with streets between zones

const SVG_ZONE_PATHS: Record<string, { path: string; cx: number; cy: number }> = {
  zone_vyombo: {
    path: 'M 30 30 L 165 25 L 170 60 L 160 120 L 140 140 L 30 130 Z',
    cx: 95,
    cy: 80,
  },
  zone_electronics: {
    path: 'M 175 25 L 310 20 L 315 75 L 300 110 L 175 120 L 170 60 Z',
    cx: 240,
    cy: 68,
  },
  zone_fabric: {
    path: 'M 175 125 L 300 115 L 310 175 L 295 230 L 175 235 L 165 175 Z',
    cx: 237,
    cy: 175,
  },
  zone_spices: {
    path: 'M 30 140 L 140 150 L 155 230 L 130 280 L 30 290 Z',
    cx: 85,
    cy: 215,
  },
  zone_wholesale: {
    path: 'M 320 20 L 375 25 L 380 280 L 375 310 L 320 310 L 310 175 L 315 75 Z',
    cx: 348,
    cy: 165,
  },
};

// ── Street grid paths ──

const STREET_PATHS = [
  // Main horizontal roads
  'M 20 60 L 380 55',
  'M 25 130 L 310 125',
  'M 30 175 L 310 175',
  'M 25 235 L 310 235',
  // Main vertical roads
  'M 165 20 L 165 310',
  'M 310 20 L 310 310',
  // Minor streets
  'M 80 30 L 85 290',
  'M 230 25 L 240 310',
  'M 350 25 L 355 310',
  'M 20 290 L 380 290',
  // Diagonal alley
  'M 30 30 L 165 130',
  'M 310 20 L 375 100',
];

// ── Building shapes ──

const BUILDINGS = [
  // Vyombo zone buildings
  { x: 45, y: 42, w: 25, h: 18 }, { x: 90, y: 38, w: 30, h: 22 }, { x: 50, y: 90, w: 35, h: 20 },
  { x: 110, y: 85, w: 28, h: 25 },
  // Electronics zone buildings
  { x: 190, y: 35, w: 30, h: 20 }, { x: 240, y: 38, w: 25, h: 22 }, { x: 200, y: 78, w: 35, h: 18 },
  { x: 260, y: 75, w: 20, h: 20 },
  // Fabric zone buildings
  { x: 190, y: 140, w: 28, h: 22 }, { x: 235, y: 145, w: 32, h: 18 }, { x: 195, y: 195, w: 25, h: 22 },
  { x: 250, y: 190, w: 28, h: 25 },
  // Spices zone buildings
  { x: 45, y: 165, w: 30, h: 20 }, { x: 95, y: 170, w: 25, h: 18 }, { x: 50, y: 230, w: 35, h: 22 },
  { x: 100, y: 235, w: 20, h: 20 },
  // Wholesale zone buildings
  { x: 325, y: 55, w: 30, h: 25 }, { x: 330, y: 120, w: 28, h: 30 }, { x: 328, y: 200, w: 32, h: 25 },
  { x: 325, y: 255, w: 30, h: 28 },
];

// ── Component ──

// Lazy wrapper for the real Google Maps component
// We use dynamic import to avoid bundling the Google Maps API when not needed
const RealGoogleMapLazy = lazy(() =>
  import('@/components/real-google-map').then((mod) => ({ default: mod.RealGoogleMap }))
);

function RealGoogleMapWrapper(props: GoogleMapProps) {
  return (
    <Suspense
      fallback={
        <div className="w-full aspect-[4/3] flex items-center justify-center bg-gradient-to-b from-amber-50/80 to-amber-100/60 dark:from-gray-900 dark:to-gray-950 rounded-xl">
          <div className="text-center p-6">
            <div className="size-10 mx-auto mb-3 border-2 border-amber-500 border-t-transparent rounded-full animate-spin" />
            <p className="text-sm text-muted-foreground">Loading map...</p>
          </div>
        </div>
      }
    >
      <RealGoogleMapLazy {...props} />
    </Suspense>
  );
}

export function GoogleMap(props: GoogleMapProps) {
  // ── If Google Maps API key is available, render the real Google Map ──
  if (GOOGLE_MAPS_API_KEY) {
    return <RealGoogleMapWrapper {...props} />;
  }

  // ── Otherwise, render the SVG fallback map ──
  return <SvgMapFallback {...props} />;
}

// ── SVG Map Fallback Component ──

function SvgMapFallback({
  zones = [],
  vendors = [],
  guides = [],
  center = KARIAKOO_CENTER,
  zoom: initialZoom = 15,
  onZoneClick,
  onVendorClick,
  onGuideClick,
  className,
  showUserLocation = true,
  interactive = true,
}: GoogleMapProps) {
  const language = useAuthStore((s) => s.language) as Language;
  const [activeZone, setActiveZone] = useState<string | null>(null);
  const [hoveredVendor, setHoveredVendor] = useState<string | null>(null);
  const [hoveredGuide, setHoveredGuide] = useState<string | null>(null);
  const [zoomLevel, setZoomLevel] = useState(initialZoom - 12); // normalize 15 → 3
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearch, setShowSearch] = useState(false);
  const [panOffset, setPanOffset] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const containerRef = useRef<HTMLDivElement>(null);

  // Try to get user location via browser geolocation API
  // geoStatus: 'idle' → 'requested' → 'success' | 'failed'
  const [geoPosition, setGeoPosition] = useState<{ lat: number; lng: number } | null>(null);
  const [geoStatus, setGeoStatus] = useState<'idle' | 'requested' | 'success' | 'failed'>('idle');
  useEffect(() => {
    if (!showUserLocation) return;
    // Schedule the status update asynchronously to satisfy the lint rule
    const raf = requestAnimationFrame(() => {
      if (!navigator.geolocation) {
        setGeoStatus('failed');
        return;
      }
      setGeoStatus('requested');
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setGeoPosition({ lat: pos.coords.latitude, lng: pos.coords.longitude });
          setGeoStatus('success');
        },
        () => setGeoStatus('failed')
      );
    });
    return () => cancelAnimationFrame(raf);
  }, [showUserLocation]);

  // Derive userLocation: use geo if available, otherwise fall back to Kariakoo center
  const userLocation = showUserLocation
    ? (geoPosition ?? (geoStatus === 'failed' ? KARIAKOO_CENTER : null))
    : null;

  // ── Coordinate mapping ──
  // Convert lat/lng to SVG coordinates
  const latLngToSvg = useCallback((lat: number, lng: number) => {
    const latRange = 0.004; // approx 400m
    const lngRange = 0.004;
    const svgW = 400;
    const svgH = 360;

    const x = ((lng - (KARIAKOO_CENTER.lng - lngRange / 2)) / lngRange) * svgW;
    const y = ((KARIAKOO_CENTER.lat + latRange / 2 - lat) / latRange) * svgH;

    return { x: Math.max(5, Math.min(svgW - 5, x)), y: Math.max(5, Math.min(svgH - 5, y)) };
  }, []);

  // Map zone data to SVG
  const zoneSvgData = useMemo(() => {
    const mapped = zones.map((z) => {
      const coords = ZONE_COORDS[z.id] || ZONE_COORDS[`zone_${z.name.toLowerCase()}`];
      const svgPath = SVG_ZONE_PATHS[z.id] || SVG_ZONE_PATHS[`zone_${z.name.toLowerCase()}`];
      return {
        ...z,
        svgPath,
        zoneColor: coords?.color || '#f59e0b',
        label: coords?.label || z.name,
        labelSw: coords?.labelSw || z.name,
        nameKey: z.nameKey || `zone_${z.name.toLowerCase()}`,
      };
    });
    return mapped;
  }, [zones]);

  // Map vendor data to SVG
  const vendorSvgData = useMemo(() => {
    return vendors.map((v, idx) => {
      const coords = v.lat && v.lng ? latLngToSvg(v.lat, v.lng) : null;
      if (!coords) {
        // Assign position based on zone with deterministic jitter
        const zoneKey = v.zoneId || '';
        const zonePath = SVG_ZONE_PATHS[zoneKey] || SVG_ZONE_PATHS[`zone_${(v.zoneId || '').toLowerCase()}`];
        if (zonePath) {
          const jitterX = deterministicSvgOffset(v.id, idx * 2, 30);
          const jitterY = deterministicSvgOffset(v.id, idx * 2 + 1, 20);
          return { ...v, svgX: zonePath.cx + jitterX, svgY: zonePath.cy + jitterY };
        }
        return { ...v, svgX: 200, svgY: 180 };
      }
      return { ...v, svgX: coords.x, svgY: coords.y };
    });
  }, [vendors, latLngToSvg]);

  // Map guide data to SVG
  const guideSvgData = useMemo(() => {
    return guides.map((g, idx) => {
      const coords = g.lat && g.lng ? latLngToSvg(g.lat, g.lng) : null;
      if (!coords) {
        // Place near center with deterministic spread
        const jitterX = deterministicSvgOffset(g.id, idx * 2, 100);
        const jitterY = deterministicSvgOffset(g.id, idx * 2 + 1, 80);
        return { ...g, svgX: 200 + jitterX, svgY: 180 + jitterY };
      }
      return { ...g, svgX: coords.x, svgY: coords.y };
    });
  }, [guides, latLngToSvg]);

  // User location SVG
  const userSvgPos = useMemo(() => {
    if (!userLocation) return { x: 200, y: 180 };
    return latLngToSvg(userLocation.lat, userLocation.lng);
  }, [userLocation, latLngToSvg]);

  // ── Zoom handling ──
  const handleZoomIn = () => setZoomLevel((z) => Math.min(z + 1, 6));
  const handleZoomOut = () => setZoomLevel((z) => Math.max(z - 1, 1));

  const scale = Math.pow(1.5, zoomLevel - 3);

  // ── Pan handling ──
  const handlePointerDown = (e: React.PointerEvent) => {
    if (!interactive) return;
    setIsDragging(true);
    setDragStart({ x: e.clientX - panOffset.x, y: e.clientY - panOffset.y });
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDragging || !interactive) return;
    setPanOffset({ x: e.clientX - dragStart.x, y: e.clientY - dragStart.y });
  };

  const handlePointerUp = () => {
    setIsDragging(false);
  };

  // ── Center on user ──
  const handleCenterOnMe = () => {
    setPanOffset({ x: 0, y: 0 });
    setZoomLevel(3);
  };

  // ── Zone click ──
  const handleZoneClick = (zoneId: string) => {
    setActiveZone(zoneId === activeZone ? null : zoneId);
    onZoneClick?.(zoneId);
  };

  // ── Search / filter zones ──
  const filteredZoneIds = useMemo(() => {
    if (!searchQuery.trim()) return null; // null = show all
    const q = searchQuery.toLowerCase();
    return new Set(
      zoneSvgData
        .filter((z) => {
          const label = (language === 'sw' ? z.labelSw : z.label).toLowerCase();
          const nameKey = (z.nameKey || '').toLowerCase();
          return label.includes(q) || nameKey.includes(q);
        })
        .map((z) => z.id)
    );
  }, [searchQuery, zoneSvgData, language]);

  const activeZoneData = zoneSvgData.find((z) => z.id === activeZone);

  // ── Wheel zoom ──
  const handleWheel = useCallback((e: React.WheelEvent) => {
    if (!interactive) return;
    e.preventDefault();
    if (e.deltaY < 0) handleZoomIn();
    else handleZoomOut();
  }, [interactive]);

  return (
    <div className={cn('relative rounded-xl overflow-hidden', className)}>
      {/* Map container */}
      <div
        ref={containerRef}
        className="relative w-full aspect-[4/3] bg-gradient-to-b from-amber-50/80 to-amber-100/60 dark:from-gray-900 dark:to-gray-950 overflow-hidden cursor-grab active:cursor-grabbing select-none"
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerLeave={handlePointerUp}
        onWheel={handleWheel}
        style={{ touchAction: 'none' }}
      >
        {/* SVG Map */}
        <div
          className="absolute inset-0 flex items-center justify-center transition-transform duration-200"
          style={{
            transform: `translate(${panOffset.x}px, ${panOffset.y}px) scale(${scale})`,
            transformOrigin: 'center center',
          }}
        >
          <svg
            viewBox="0 0 400 360"
            className="w-full h-full"
            xmlns="http://www.w3.org/2000/svg"
          >
            <defs>
              {/* Gradient backgrounds for zones */}
              {Object.entries(ZONE_COORDS).map(([zoneId, data]) => (
                <linearGradient key={zoneId} id={`grad-${zoneId}`} x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor={data.color} stopOpacity="0.35" />
                  <stop offset="100%" stopColor={data.color} stopOpacity="0.15" />
                </linearGradient>
              ))}

              {/* Street pattern */}
              <pattern id="street-pattern" width="20" height="20" patternUnits="userSpaceOnUse">
                <rect width="20" height="20" fill="none" />
                <circle cx="10" cy="10" r="0.3" fill="currentColor" opacity="0.08" />
              </pattern>

              {/* Glow filter for active zone */}
              <filter id="zone-glow" x="-20%" y="-20%" width="140%" height="140%">
                <feGaussianBlur stdDeviation="4" result="blur" />
                <feComposite in="SourceGraphic" in2="blur" operator="over" />
              </filter>

              {/* Shadow filter for markers */}
              <filter id="marker-shadow" x="-50%" y="-50%" width="200%" height="200%">
                <feDropShadow dx="0" dy="1" stdDeviation="1.5" floodOpacity="0.3" />
              </filter>

              {/* Pulse animation */}
              <radialGradient id="pulse-grad" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="#10b981" stopOpacity="0.6" />
                <stop offset="100%" stopColor="#10b981" stopOpacity="0" />
              </radialGradient>

              <radialGradient id="user-pulse-grad" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.6" />
                <stop offset="100%" stopColor="#3b82f6" stopOpacity="0" />
              </radialGradient>
            </defs>

            {/* Background texture */}
            <rect width="400" height="360" fill="url(#street-pattern)" className="text-foreground" />

            {/* Street grid */}
            <g className="text-gray-400 dark:text-gray-600" strokeWidth="1.5" fill="none" opacity="0.4">
              {STREET_PATHS.map((d, i) => (
                <path key={i} d={d} stroke="currentColor" strokeDasharray={i < 6 ? 'none' : '4 3'} />
              ))}
            </g>

            {/* Building shapes */}
            <g opacity="0.25">
              {BUILDINGS.map((b, i) => (
                <rect
                  key={i}
                  x={b.x}
                  y={b.y}
                  width={b.w}
                  height={b.h}
                  rx="1.5"
                  className="fill-gray-400 dark:fill-gray-600"
                />
              ))}
            </g>

            {/* Zone polygons */}
            {zoneSvgData.map((zone) => {
              const isActive = activeZone === zone.id;
              const isFiltered = filteredZoneIds ? filteredZoneIds.has(zone.id) : true;
              const svgPath = zone.svgPath;

              if (!svgPath) return null;

              return (
                <g
                  key={zone.id}
                  className={cn(
                    'transition-all duration-300 cursor-pointer',
                    !isFiltered && 'opacity-10',
                    isFiltered && !isActive && 'opacity-70 hover:opacity-90',
                    isFiltered && isActive && 'opacity-100'
                  )}
                  onClick={() => handleZoneClick(zone.id)}
                  filter={isActive ? 'url(#zone-glow)' : undefined}
                >
                  <path
                    d={svgPath.path}
                    fill={`url(#grad-${zone.id})`}
                    stroke={zone.zoneColor}
                    strokeWidth={isActive ? 2.5 : 1}
                    className="transition-all duration-300"
                  />
                  {/* Zone label */}
                  <text
                    x={svgPath.cx}
                    y={svgPath.cy - 4}
                    textAnchor="middle"
                    dominantBaseline="central"
                    className="text-[7px] font-bold pointer-events-none select-none"
                    fill={zone.zoneColor}
                  >
                    {language === 'sw' ? zone.labelSw : zone.label}
                  </text>
                  {/* Zone icon */}
                  <text
                    x={svgPath.cx}
                    y={svgPath.cy + 10}
                    textAnchor="middle"
                    dominantBaseline="central"
                    className="text-[5px] pointer-events-none select-none opacity-60"
                    fill={zone.zoneColor}
                  >
                    ●
                  </text>
                </g>
              );
            })}

            {/* Vendor markers */}
            {vendorSvgData.map((v) => (
              <g
                key={v.id}
                className="cursor-pointer"
                onClick={() => onVendorClick?.(v.id)}
                onMouseEnter={() => setHoveredVendor(v.id)}
                onMouseLeave={() => setHoveredVendor(null)}
                filter="url(#marker-shadow)"
              >
                {/* Store icon background */}
                <rect
                  x={v.svgX - 5}
                  y={v.svgY - 5}
                  width="10"
                  height="10"
                  rx="2"
                  className="fill-amber-100 dark:fill-amber-900/60 stroke-amber-500"
                  strokeWidth="0.5"
                />
                {/* Store icon (simple representation) */}
                <rect
                  x={v.svgX - 2.5}
                  y={v.svgY - 3}
                  width="5"
                  height="4"
                  rx="0.5"
                  className="fill-amber-600 dark:fill-amber-400"
                />
                <rect
                  x={v.svgX - 3}
                  y={v.svgY + 1}
                  width="6"
                  height="2"
                  rx="0.5"
                  className="fill-amber-700 dark:fill-amber-300"
                />
                {/* Hover tooltip */}
                {hoveredVendor === v.id && (
                  <g>
                    <rect
                      x={v.svgX - 30}
                      y={v.svgY - 20}
                      width="60"
                      height="12"
                      rx="3"
                      className="fill-background/90 stroke-border"
                      strokeWidth="0.5"
                    />
                    <text
                      x={v.svgX}
                      y={v.svgY - 14}
                      textAnchor="middle"
                      dominantBaseline="central"
                      className="text-[4px] font-medium fill-foreground pointer-events-none select-none"
                    >
                      {v.name}
                    </text>
                  </g>
                )}
              </g>
            ))}

            {/* Guide markers (pulsing green dots) */}
            {guideSvgData.map((g) => (
              <g
                key={g.id}
                className="cursor-pointer"
                onClick={() => onGuideClick?.(g.id)}
                onMouseEnter={() => setHoveredGuide(g.id)}
                onMouseLeave={() => setHoveredGuide(null)}
              >
                {/* Pulse ring */}
                <circle
                  cx={g.svgX}
                  cy={g.svgY}
                  r="8"
                  fill="url(#pulse-grad)"
                  className="animate-ping"
                  style={{ animationDuration: '2s', transformOrigin: `${g.svgX}px ${g.svgY}px` }}
                />
                {/* Dot */}
                <circle
                  cx={g.svgX}
                  cy={g.svgY}
                  r="4"
                  className="fill-emerald-500 stroke-white dark:stroke-gray-900"
                  strokeWidth="1"
                  filter="url(#marker-shadow)"
                />
                {/* Inner highlight */}
                <circle
                  cx={g.svgX}
                  cy={g.svgY - 1}
                  r="1.5"
                  className="fill-emerald-300"
                />
                {/* Name label */}
                <text
                  x={g.svgX}
                  y={g.svgY + 10}
                  textAnchor="middle"
                  dominantBaseline="central"
                  className="text-[4px] font-semibold fill-emerald-700 dark:fill-emerald-300 pointer-events-none select-none"
                >
                  {g.name}
                </text>
                {/* Hover: full name + rating */}
                {hoveredGuide === g.id && (
                  <g>
                    <rect
                      x={g.svgX - 35}
                      y={g.svgY - 22}
                      width="70"
                      height="14"
                      rx="3"
                      className="fill-background/90 stroke-emerald-500/50"
                      strokeWidth="0.5"
                    />
                    <text
                      x={g.svgX - 10}
                      y={g.svgY - 15}
                      textAnchor="middle"
                      dominantBaseline="central"
                      className="text-[4px] font-medium fill-foreground pointer-events-none select-none"
                    >
                      {g.name}
                    </text>
                    {g.rating !== undefined && (
                      <text
                        x={g.svgX + 20}
                        y={g.svgY - 15}
                        textAnchor="middle"
                        dominantBaseline="central"
                        className="text-[3.5px] fill-amber-500 pointer-events-none select-none"
                      >
                        ★ {g.rating.toFixed(1)}
                      </text>
                    )}
                  </g>
                )}
              </g>
            ))}

            {/* User location (pulsing blue dot) */}
            {showUserLocation && userSvgPos && (
              <g>
                {/* Pulse ring */}
                <circle
                  cx={userSvgPos.x}
                  cy={userSvgPos.y}
                  r="10"
                  fill="url(#user-pulse-grad)"
                  className="animate-ping"
                  style={{ animationDuration: '2.5s', transformOrigin: `${userSvgPos.x}px ${userSvgPos.y}px` }}
                />
                {/* Accuracy circle */}
                <circle
                  cx={userSvgPos.x}
                  cy={userSvgPos.y}
                  r="12"
                  className="fill-blue-400/10 stroke-blue-400/30"
                  strokeWidth="0.5"
                />
                {/* Blue dot */}
                <circle
                  cx={userSvgPos.x}
                  cy={userSvgPos.y}
                  r="5"
                  className="fill-blue-500 stroke-white dark:stroke-gray-900"
                  strokeWidth="1.5"
                  filter="url(#marker-shadow)"
                />
                {/* Navigation arrow inside */}
                <polygon
                  points={`${userSvgPos.x},${userSvgPos.y - 2.5} ${userSvgPos.x + 1.5},${userSvgPos.y + 1} ${userSvgPos.x - 1.5},${userSvgPos.y + 1}`}
                  className="fill-white"
                />
              </g>
            )}

            {/* Compass Rose */}
            <g transform="translate(370, 30)">
              <circle r="12" className="fill-background/70 stroke-border" strokeWidth="0.5" />
              {/* N arrow */}
              <polygon points="0,-9 2,-3 -2,-3" className="fill-red-500" />
              {/* S arrow */}
              <polygon points="0,9 2,3 -2,3" className="fill-gray-400 dark:fill-gray-500" />
              {/* E arrow */}
              <polygon points="9,0 3,2 3,-2" className="fill-gray-400 dark:fill-gray-500" />
              {/* W arrow */}
              <polygon points="-9,0 -3,2 -3,-2" className="fill-gray-400 dark:fill-gray-500" />
              <text y="-10" textAnchor="middle" dominantBaseline="auto" className="text-[3px] font-bold fill-red-500">N</text>
            </g>

            {/* Scale indicator */}
            <g transform="translate(20, 340)">
              <line x1="0" y1="0" x2="40" y2="0" className="stroke-foreground/50" strokeWidth="0.8" />
              <line x1="0" y1="-2" x2="0" y2="2" className="stroke-foreground/50" strokeWidth="0.8" />
              <line x1="40" y1="-2" x2="40" y2="2" className="stroke-foreground/50" strokeWidth="0.8" />
              <text x="20" y="-3" textAnchor="middle" className="text-[3px] fill-foreground/50">
                ~100m
              </text>
            </g>

            {/* Kariakoo label */}
            <text
              x="200"
              y="15"
              textAnchor="middle"
              className="text-[5px] font-bold fill-foreground/30 select-none pointer-events-none"
            >
              KARIAKOO MARKET — DAR ES SALAAM
            </text>
          </svg>
        </div>

        {/* ── Glass Overlay Controls ── */}

        {/* Zoom controls */}
        {interactive && (
          <div className="absolute right-3 top-3 flex flex-col gap-1.5 z-20">
            <button
              onClick={handleZoomIn}
              className="glass-card size-9 flex items-center justify-center rounded-lg text-foreground hover:text-primary transition-colors"
              aria-label="Zoom in"
            >
              <Plus className="size-4" />
            </button>
            <button
              onClick={handleZoomOut}
              className="glass-card size-9 flex items-center justify-center rounded-lg text-foreground hover:text-primary transition-colors"
              aria-label="Zoom out"
            >
              <Minus className="size-4" />
            </button>
          </div>
        )}

        {/* Center on me button */}
        {interactive && (
          <button
            onClick={handleCenterOnMe}
            className="absolute right-3 bottom-3 glass-card size-9 flex items-center justify-center rounded-lg text-foreground hover:text-primary transition-colors z-20"
            aria-label="Center on me"
          >
            <Crosshair className="size-4" />
          </button>
        )}

        {/* Search button */}
        {interactive && (
          <button
            onClick={() => setShowSearch(!showSearch)}
            className="absolute left-3 top-3 glass-card size-9 flex items-center justify-center rounded-lg text-foreground hover:text-primary transition-colors z-20"
            aria-label="Search zones"
          >
            {showSearch ? <X className="size-4" /> : <Search className="size-4" />}
          </button>
        )}

        {/* Search input */}
        {showSearch && interactive && (
          <div className="absolute left-3 top-14 right-14 z-20">
            <div className="glass-card rounded-lg p-2">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={language === 'sw' ? 'Tafuta eneo...' : 'Search zones...'}
                className="w-full bg-transparent text-sm text-foreground placeholder:text-muted-foreground outline-none px-1"
                autoFocus
              />
              {searchQuery && filteredZoneIds && (
                <div className="mt-1.5 space-y-0.5 max-h-24 overflow-y-auto">
                  {zoneSvgData
                    .filter((z) => filteredZoneIds.has(z.id))
                    .map((z) => (
                      <button
                        key={z.id}
                        onClick={() => {
                          handleZoneClick(z.id);
                          setShowSearch(false);
                          setSearchQuery('');
                        }}
                        className="w-full text-left px-2 py-1 rounded text-xs text-foreground hover:bg-primary/10 transition-colors flex items-center gap-2"
                      >
                        <div
                          className="size-2.5 rounded-full shrink-0"
                          style={{ backgroundColor: z.zoneColor }}
                        />
                        {language === 'sw' ? z.labelSw : z.label}
                      </button>
                    ))}
                  {filteredZoneIds.size === 0 && (
                    <p className="text-xs text-muted-foreground px-2 py-1">{t('no_results', language)}</p>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Legend */}
        <div className="absolute left-3 bottom-3 glass-card rounded-lg p-2.5 z-10 text-[10px]">
          <div className="flex flex-col gap-1.5">
            <div className="flex items-center gap-1.5">
              <div className="size-2.5 rounded-full bg-emerald-500 shrink-0" />
              <span className="text-foreground">{t('online', language)}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Store className="size-2.5 text-amber-600 dark:text-amber-400 shrink-0" />
              <span className="text-foreground">{t('vendor_directory', language)}</span>
            </div>
            {showUserLocation && (
              <div className="flex items-center gap-1.5">
                <div className="size-2.5 rounded-full bg-blue-500 shrink-0" />
                <span className="text-foreground">{language === 'sw' ? 'Wewe' : 'You'}</span>
              </div>
            )}
            <div className="flex items-center gap-1.5 pt-1 border-t border-border/50">
              <Compass className="size-2.5 text-muted-foreground shrink-0" />
              <span className="text-muted-foreground">Kariakoo</span>
            </div>
          </div>
        </div>

        {/* Zone count badge */}
        <div className="absolute right-14 top-3 glass-card rounded-lg px-2.5 py-1.5 z-10 flex items-center gap-1.5">
          <MapPin className="size-3 text-primary" />
          <span className="text-[10px] font-medium text-foreground">
            {zoneSvgData.length} {language === 'sw' ? 'maeneo' : 'zones'}
          </span>
        </div>
      </div>

      {/* ── Active Zone Detail Panel ── */}
      {activeZoneData && (
        <div className="glass-card rounded-b-xl border-t border-border/30 p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div
                className="size-8 rounded-lg flex items-center justify-center"
                style={{ backgroundColor: `${activeZoneData.zoneColor}20` }}
              >
                <MapPin className="size-4" style={{ color: activeZoneData.zoneColor }} />
              </div>
              <div>
                <span className="font-semibold text-sm text-foreground">
                  {language === 'sw' ? activeZoneData.labelSw : activeZoneData.label}
                </span>
                <div className="flex items-center gap-3 mt-0.5 text-xs text-muted-foreground">
                  <span>
                    {vendorSvgData.filter((v) => v.zoneId === activeZoneData.id).length}{' '}
                    {language === 'sw' ? 'wauzaji' : 'vendors'}
                  </span>
                  <span>
                    {guideSvgData.length}{' '}
                    {language === 'sw' ? 'waongozaji' : 'guides'}
                  </span>
                </div>
              </div>
            </div>
            <button
              onClick={() => setActiveZone(null)}
              className="text-muted-foreground hover:text-foreground transition-colors p-1"
            >
              <X className="size-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

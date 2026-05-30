'use client';

import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import {
  GoogleMap as GoogleMapReact,
  useJsApiLoader,
  Polygon,
  Marker,
  InfoWindow,
  StandaloneSearchBox,
  Circle,
  MarkerClusterer,
} from '@react-google-maps/api';
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
} from 'lucide-react';
import {
  KARIAKOO_CENTER,
  ZONE_POLYGONS,
  LANDMARKS,
  VENDOR_STALLS,
  DEFAULT_MAP_OPTIONS,
  MAP_LIBRARIES,
  type ZonePolygon,
} from '@/lib/map-data';
import type { GoogleMapProps, ZoneData, VendorMarker, GuideMarker } from '@/components/google-map';

// ── Deterministic offset utility ──
// Replaces Math.random() with a stable hash-based offset so positions
// don't change on every render.
function deterministicOffset(id: string, index: number, range: number): number {
  let hash = 0;
  const str = id + String(index);
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) - hash) + str.charCodeAt(i);
    hash |= 0;
  }
  return ((hash % 1000) / 1000 - 0.5) * 2 * range;
}

// ── Container style for the map ──
const CONTAINER_STYLE = {
  width: '100%',
  height: '100%',
};

// ── Custom marker SVG paths ──
const VENDOR_MARKER_ICON = {
  path: 'M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z',
  fillColor: '#d97706',
  fillOpacity: 1,
  strokeColor: '#ffffff',
  strokeWeight: 2,
  scale: 1.5,
  anchor: { x: 12, y: 22 },
};

const GUIDE_ONLINE_MARKER_ICON = {
  path: 'M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z',
  fillColor: '#10b981',
  fillOpacity: 1,
  strokeColor: '#ffffff',
  strokeWeight: 2,
  scale: 1.5,
  anchor: { x: 12, y: 22 },
};

const GUIDE_OFFLINE_MARKER_ICON = {
  path: 'M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z',
  fillColor: '#9ca3af',
  fillOpacity: 0.6,
  strokeColor: '#ffffff',
  strokeWeight: 1,
  scale: 1.3,
  anchor: { x: 12, y: 22 },
};

const LANDMARK_MARKER_ICON = {
  path: 'M12 2L8 10h8L12 2zm0 3l1.5 3h-3L12 5z',
  fillColor: '#6366f1',
  fillOpacity: 1,
  strokeColor: '#ffffff',
  strokeWeight: 1,
  scale: 1.5,
  anchor: { x: 12, y: 10 },
};

// ── Component ──

export function RealGoogleMap({
  zones = [],
  vendors = [],
  guides = [],
  center = KARIAKOO_CENTER,
  zoom = 16,
  onZoneClick,
  onVendorClick,
  onGuideClick,
  className,
  showUserLocation = true,
  interactive = true,
}: GoogleMapProps) {
  const language = useAuthStore((s) => s.language) as Language;
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || '';

  const { isLoaded, loadError } = useJsApiLoader({
    googleMapsApiKey: apiKey,
    libraries: MAP_LIBRARIES,
  });

  const [activeZone, setActiveZone] = useState<string | null>(null);
  const [selectedVendor, setSelectedVendor] = useState<string | null>(null);
  const [selectedGuide, setSelectedGuide] = useState<string | null>(null);
  const [selectedLandmark, setSelectedLandmark] = useState<string | null>(null);
  const [geoLocation, setGeoLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [mapInstance, setMapInstance] = useState<google.maps.Map | null>(null);
  const [searchBox, setSearchBox] = useState<google.maps.places.SearchBox | null>(null);
  const [showSearch, setShowSearch] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const [mapZoom, setMapZoom] = useState(zoom);

  // Derive userLocation from geo + showUserLocation (no setState in effect)
  const userLocation = showUserLocation ? (geoLocation ?? KARIAKOO_CENTER) : null;

  // Try to get user location via geolocation API
  useEffect(() => {
    if (!showUserLocation) return;
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => setGeoLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude })
      );
    }
  }, [showUserLocation]);

  // Map load handler
  const onLoad = useCallback((map: google.maps.Map) => {
    setMapInstance(map);
  }, []);

  const onUnmount = useCallback(() => {
    setMapInstance(null);
  }, []);

  // Search box handlers
  const onSearchBoxLoad = useCallback((ref: google.maps.places.SearchBox) => {
    setSearchBox(ref);
  }, []);

  const onPlacesChanged = useCallback(() => {
    if (!searchBox || !mapInstance) return;
    const places = searchBox.getPlaces();
    if (places && places.length > 0) {
      const place = places[0];
      if (place.geometry?.location) {
        mapInstance.panTo(place.geometry.location);
        mapInstance.setZoom(17);
      }
    }
  }, [searchBox, mapInstance]);

  // Zoom handlers
  const handleZoomIn = () => {
    if (mapInstance) {
      const newZoom = Math.min(mapZoom + 1, 20);
      mapInstance.setZoom(newZoom);
      setMapZoom(newZoom);
    }
  };

  const handleZoomOut = () => {
    if (mapInstance) {
      const newZoom = Math.max(mapZoom - 1, 14);
      mapInstance.setZoom(newZoom);
      setMapZoom(newZoom);
    }
  };

  // Center on user
  const handleCenterOnMe = () => {
    if (mapInstance && userLocation) {
      mapInstance.panTo(userLocation);
      mapInstance.setZoom(17);
    }
  };

  // Zone click
  const handleZoneClick = (zoneId: string) => {
    setActiveZone(zoneId === activeZone ? null : zoneId);
    onZoneClick?.(zoneId);
    // Pan to zone center
    const zonePoly = ZONE_POLYGONS.find((z) => z.id === zoneId);
    if (zonePoly && mapInstance) {
      mapInstance.panTo(zonePoly.center);
    }
  };

  // Merge zones prop with polygon data
  const mergedZones = useMemo(() => {
    return ZONE_POLYGONS.map((zp) => {
      const propZone = zones.find((z) => z.id === zp.id);
      return {
        ...zp,
        name: propZone?.name || zp.name,
        nameKey: propZone?.nameKey,
      };
    });
  }, [zones]);

  // Find vendor position (from props or from map data stalls)
  const getVendorPosition = useCallback((vendor: VendorMarker, index: number = 0): { lat: number; lng: number } | null => {
    if (vendor.lat && vendor.lng) return { lat: vendor.lat, lng: vendor.lng };
    // Try to find a stall in the same zone
    const stall = VENDOR_STALLS.find((s) => s.zoneId === vendor.zoneId && s.name.includes(vendor.name));
    if (stall) return { lat: stall.lat, lng: stall.lng };
    // Fallback: use zone center with deterministic jitter
    const zonePoly = ZONE_POLYGONS.find((z) => z.id === vendor.zoneId);
    if (zonePoly) {
      return {
        lat: zonePoly.center.lat + deterministicOffset(vendor.id, index, 0.0005),
        lng: zonePoly.center.lng + deterministicOffset(vendor.id, index + 1, 0.0005),
      };
    }
    return {
      lat: KARIAKOO_CENTER.lat + deterministicOffset(vendor.id, index, 0.002),
      lng: KARIAKOO_CENTER.lng + deterministicOffset(vendor.id, index + 1, 0.002),
    };
  }, []);

  // Get guide position
  const getGuidePosition = useCallback((guide: GuideMarker, index: number = 0): { lat: number; lng: number } => {
    if (guide.lat && guide.lng) return { lat: guide.lat, lng: guide.lng };
    return {
      lat: KARIAKOO_CENTER.lat + deterministicOffset(guide.id, index, 0.003),
      lng: KARIAKOO_CENTER.lng + deterministicOffset(guide.id, index + 1, 0.003),
    };
  }, []);

  // Active zone data
  const activeZoneData = mergedZones.find((z) => z.id === activeZone);

  // Selected vendor data
  const selectedVendorData = vendors.find((v) => v.id === selectedVendor);
  const selectedVendorPos = selectedVendorData ? getVendorPosition(selectedVendorData) : null;

  // Selected guide data
  const selectedGuideData = guides.find((g) => g.id === selectedGuide);
  const selectedGuidePos = selectedGuideData ? getGuidePosition(selectedGuideData) : null;

  // Selected landmark data
  const selectedLandmarkData = LANDMARKS.find((l) => l.id === selectedLandmark);

  // Loading state
  if (loadError) {
    return (
      <div className={cn('relative rounded-xl overflow-hidden', className)}>
        <div className="w-full aspect-[4/3] flex items-center justify-center bg-gradient-to-b from-amber-50/80 to-amber-100/60 dark:from-gray-900 dark:to-gray-950">
          <div className="text-center p-6">
            <MapPin className="size-10 mx-auto mb-3 text-amber-500/50" />
            <p className="text-sm text-muted-foreground">
              {language === 'sw' ? 'Imeshindwa kupakia ramani' : 'Failed to load map'}
            </p>
            <p className="text-xs text-muted-foreground mt-1">{loadError.message}</p>
          </div>
        </div>
      </div>
    );
  }

  if (!isLoaded) {
    return (
      <div className={cn('relative rounded-xl overflow-hidden', className)}>
        <div className="w-full aspect-[4/3] flex items-center justify-center bg-gradient-to-b from-amber-50/80 to-amber-100/60 dark:from-gray-900 dark:to-gray-950">
          <div className="text-center p-6">
            <div className="size-10 mx-auto mb-3 border-2 border-amber-500 border-t-transparent rounded-full animate-spin" />
            <p className="text-sm text-muted-foreground">
              {language === 'sw' ? 'Inapakia ramani...' : 'Loading map...'}
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={cn('relative rounded-xl overflow-hidden', className)}>
      {/* Map container */}
      <div className="relative w-full aspect-[4/3]">
        <GoogleMapReact
          mapContainerStyle={CONTAINER_STYLE}
          center={center}
          zoom={zoom}
          onLoad={onLoad}
          onUnmount={onUnmount}
          options={{
            ...DEFAULT_MAP_OPTIONS,
            disableDefaultUI: !interactive,
            zoomControl: false,
            mapTypeControl: false,
            streetViewControl: false,
            fullscreenControl: false,
          }}
          onZoomChanged={() => {
            if (mapInstance) {
              setMapZoom(mapInstance.getZoom() || zoom);
            }
          }}
        >
          {/* Zone polygons */}
          {mergedZones.map((zone) => (
            <Polygon
              key={zone.id}
              paths={zone.paths}
              options={{
                fillColor: zone.fillColor,
                fillOpacity: activeZone === zone.id ? 0.4 : zone.fillOpacity,
                strokeColor: zone.strokeColor,
                strokeOpacity: activeZone === zone.id ? 1 : zone.strokeOpacity,
                strokeWeight: activeZone === zone.id ? 3 : zone.strokeWidth,
                clickable: true,
                zIndex: activeZone === zone.id ? 2 : 1,
              }}
              onClick={() => handleZoneClick(zone.id)}
            />
          ))}

          {/* Landmark markers */}
          {LANDMARKS.map((landmark) => (
            <Marker
              key={landmark.id}
              position={{ lat: landmark.lat, lng: landmark.lng }}
              icon={LANDMARK_MARKER_ICON}
              title={language === 'sw' ? landmark.nameSw : landmark.name}
              onClick={() => setSelectedLandmark(landmark.id)}
            />
          ))}

          {/* Vendor markers with clustering */}
          <MarkerClusterer
            gridSize={40}
            maxZoom={17}
            averageCenter
            enableRetinaIcons
          >
            {(clusterer) => (
              <>
                {vendors.map((vendor, idx) => {
                  const pos = getVendorPosition(vendor, idx);
                  if (!pos) return null;
                  return (
                    <Marker
                      key={vendor.id}
                      position={pos}
                      icon={VENDOR_MARKER_ICON}
                      title={vendor.name}
                      clusterer={clusterer}
                      onClick={() => {
                        setSelectedVendor(vendor.id);
                        onVendorClick?.(vendor.id);
                      }}
                    />
                  );
                })}
              </>
            )}
          </MarkerClusterer>

          {/* Guide markers with clustering */}
          <MarkerClusterer
            gridSize={40}
            maxZoom={17}
            averageCenter
            enableRetinaIcons
          >
            {(clusterer) => (
              <>
                {guides.map((guide, idx) => {
                  const pos = getGuidePosition(guide, idx);
                  return (
                    <Marker
                      key={guide.id}
                      position={pos}
                      icon={guide.isOnline ? GUIDE_ONLINE_MARKER_ICON : GUIDE_OFFLINE_MARKER_ICON}
                      title={guide.name}
                      clusterer={clusterer}
                      onClick={() => {
                        setSelectedGuide(guide.id);
                        onGuideClick?.(guide.id);
                      }}
                    />
                  );
                })}
              </>
            )}
          </MarkerClusterer>

          {/* User location circle (accuracy) + marker */}
          {showUserLocation && userLocation && (
            <>
              <Circle
                center={userLocation}
                radius={50}
                options={{
                  fillColor: '#3b82f6',
                  fillOpacity: 0.08,
                  strokeColor: '#3b82f6',
                  strokeOpacity: 0.2,
                  strokeWeight: 1,
                  clickable: false,
                }}
              />
              <Marker
                position={userLocation}
                icon={{
                  path: google.maps.SymbolPath.CIRCLE,
                  fillColor: '#3b82f6',
                  fillOpacity: 1,
                  strokeColor: '#ffffff',
                  strokeWeight: 3,
                  scale: 7,
                }}
                title={language === 'sw' ? 'Wewe uko hapa' : 'You are here'}
                zIndex={100}
              />
            </>
          )}

          {/* Info window for selected vendor */}
          {selectedVendor && selectedVendorData && selectedVendorPos && (
            <InfoWindow
              position={selectedVendorPos}
              onCloseClick={() => setSelectedVendor(null)}
              options={{
                pixelOffset: new google.maps.Size(0, -30),
              }}
            >
              <div className="p-1 min-w-[140px]">
                <div className="flex items-center gap-2 mb-1">
                  <Store className="size-4 text-amber-600" />
                  <span className="font-semibold text-sm text-gray-900">{selectedVendorData.name}</span>
                </div>
                {selectedVendorData.category && (
                  <p className="text-xs text-gray-500 capitalize">{selectedVendorData.category}</p>
                )}
                {selectedVendorData.zoneId && (
                  <p className="text-xs text-gray-400 mt-0.5">
                    {language === 'sw' ? 'Eneo: ' : 'Zone: '}
                    {ZONE_POLYGONS.find((z) => z.id === selectedVendorData.zoneId)?.nameSw ||
                      ZONE_POLYGONS.find((z) => z.id === selectedVendorData.zoneId)?.name ||
                      selectedVendorData.zoneId}
                  </p>
                )}
              </div>
            </InfoWindow>
          )}

          {/* Info window for selected guide */}
          {selectedGuide && selectedGuideData && selectedGuidePos && (
            <InfoWindow
              position={selectedGuidePos}
              onCloseClick={() => setSelectedGuide(null)}
              options={{
                pixelOffset: new google.maps.Size(0, -30),
              }}
            >
              <div className="p-1 min-w-[140px]">
                <div className="flex items-center gap-2 mb-1">
                  <div
                    className={cn(
                      'size-2.5 rounded-full',
                      selectedGuideData.isOnline ? 'bg-emerald-500' : 'bg-gray-400'
                    )}
                  />
                  <span className="font-semibold text-sm text-gray-900">{selectedGuideData.name}</span>
                </div>
                {selectedGuideData.rating !== undefined && (
                  <div className="flex items-center gap-1">
                    <span className="text-amber-500 text-xs">★</span>
                    <span className="text-xs text-gray-600">{selectedGuideData.rating.toFixed(1)}</span>
                  </div>
                )}
                <p className="text-xs text-gray-400 mt-0.5">
                  {selectedGuideData.isOnline
                    ? language === 'sw'
                      ? 'Mtandaoni'
                      : 'Online'
                    : language === 'sw'
                      ? 'Nje ya mtandaoni'
                      : 'Offline'}
                </p>
              </div>
            </InfoWindow>
          )}

          {/* Info window for selected landmark */}
          {selectedLandmark && selectedLandmarkData && (
            <InfoWindow
              position={{ lat: selectedLandmarkData.lat, lng: selectedLandmarkData.lng }}
              onCloseClick={() => setSelectedLandmark(null)}
              options={{
                pixelOffset: new google.maps.Size(0, -15),
              }}
            >
              <div className="p-1 min-w-[140px]">
                <div className="flex items-center gap-2 mb-1">
                  <MapPin className="size-4 text-indigo-500" />
                  <span className="font-semibold text-sm text-gray-900">
                    {language === 'sw' ? selectedLandmarkData.nameSw : selectedLandmarkData.name}
                  </span>
                </div>
                <p className="text-xs text-gray-400 capitalize">{selectedLandmarkData.type.replace('_', ' ')}</p>
              </div>
            </InfoWindow>
          )}

          {/* Search box overlay */}
          {showSearch && interactive && (
            <StandaloneSearchBox
              onLoad={onSearchBoxLoad}
              onPlacesChanged={onPlacesChanged}
              bounds={
                new google.maps.LatLngBounds(
                  new google.maps.LatLng(-6.832, 39.264), // SW corner
                  new google.maps.LatLng(-6.822, 39.276)  // NE corner
                )
              }
            >
              <input
                ref={searchInputRef}
                type="text"
                placeholder={language === 'sw' ? 'Tafuta mahali Kariakoo...' : 'Search places in Kariakoo...'}
                className="absolute top-3 left-3 right-14 z-20 glass-card rounded-lg p-2.5 text-sm text-foreground placeholder:text-muted-foreground outline-none w-auto"
                style={{ width: 'calc(100% - 60px)' }}
                autoFocus
              />
            </StandaloneSearchBox>
          )}
        </GoogleMapReact>
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

      {/* Search toggle button */}
      {interactive && (
        <button
          onClick={() => setShowSearch(!showSearch)}
          className="absolute left-3 top-3 glass-card size-9 flex items-center justify-center rounded-lg text-foreground hover:text-primary transition-colors z-30"
          aria-label="Search places"
        >
          {showSearch ? <X className="size-4" /> : <Search className="size-4" />}
        </button>
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
          <div className="flex items-center gap-1.5">
            <MapPin className="size-2.5 text-indigo-500 shrink-0" />
            <span className="text-foreground">{language === 'sw' ? 'Alama' : 'Landmarks'}</span>
          </div>
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
          {mergedZones.length} {language === 'sw' ? 'maeneo' : 'zones'}
        </span>
      </div>

      {/* ── Active Zone Detail Panel ── */}
      {activeZoneData && (
        <div className="glass-card rounded-b-xl border-t border-border/30 p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div
                className="size-8 rounded-lg flex items-center justify-center"
                style={{ backgroundColor: `${activeZoneData.color}20` }}
              >
                <MapPin className="size-4" style={{ color: activeZoneData.color }} />
              </div>
              <div>
                <span className="font-semibold text-sm text-foreground">
                  {language === 'sw' ? activeZoneData.nameSw : activeZoneData.name}
                </span>
                <div className="flex items-center gap-3 mt-0.5 text-xs text-muted-foreground">
                  <span>
                    {vendors.filter((v) => v.zoneId === activeZoneData.id).length}{' '}
                    {language === 'sw' ? 'wauzaji' : 'vendors'}
                  </span>
                  <span>
                    {guides.length}{' '}
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

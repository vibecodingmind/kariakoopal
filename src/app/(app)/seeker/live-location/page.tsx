'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  MapPin, Navigation, Shield, Phone, Share2, Star,
  AlertTriangle, CheckCircle, Users, Clock, Eye,
  ChevronRight, Cross, MessageSquare, Siren,
  Radio, Locate, History, Flag, Footprints, Plus,
  X, Loader2, MapPinned
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useAuthStore } from '@/lib/stores/auth-store';
import { connectSocket, disconnectSocket, emitLocation, onLocationUpdate } from '@/lib/socket';
import type { LiveLocation } from '@/lib/socket';

// ─── Types ───

interface NearbyGuide {
  id: string;
  name: string;
  distance: string;
  rating: number;
  availability: 'available' | 'busy' | 'offline';
  specialty: string;
  verified: boolean;
  lat?: number;
  lng?: number;
}

interface SafetyZone {
  id: string;
  name: string;
  nameSw: string;
  status: 'safe' | 'caution';
  description: string;
  bounds: { lat: number; lng: number; radius: number };
  color: string;
}

interface BreadcrumbPoint {
  lat: number;
  lng: number;
  timestamp: number;
}

interface MeetupPoint {
  lat: number;
  lng: number;
  label: string;
  setBy: string;
  timestamp: number;
}

// ─── Demo Data ───

const NEARBY_GUIDES: NearbyGuide[] = [
  { id: 'g1', name: 'Mwanamvua J.', distance: '120m', rating: 4.8, availability: 'available', specialty: 'Electronics', verified: true, lat: -6.8258, lng: 39.2705 },
  { id: 'g2', name: 'Asha M.', distance: '250m', rating: 4.6, availability: 'available', specialty: 'Fabrics & Textiles', verified: true, lat: -6.8270, lng: 39.2685 },
  { id: 'g3', name: 'Hassan K.', distance: '380m', rating: 4.9, availability: 'busy', specialty: 'Spices & Food', verified: true, lat: -6.8280, lng: 39.2710 },
  { id: 'g4', name: 'Fatma H.', distance: '450m', rating: 4.4, availability: 'available', specialty: 'General Shopping', verified: false, lat: -6.8240, lng: 39.2690 },
  { id: 'g5', name: 'Ramadhani S.', distance: '480m', rating: 4.7, availability: 'offline', specialty: 'Jewelry & Crafts', verified: true, lat: -6.8290, lng: 39.2720 },
];

const SAFETY_ZONES: SafetyZone[] = [
  { id: 'z1', name: 'Kariakoo Market - Zone A', nameSw: 'Soko Kuu Kariakoo - Eneo A', status: 'safe', description: 'Well-lit, high foot traffic', bounds: { lat: -6.8264, lng: 39.2695, radius: 300 }, color: '#10B981' },
  { id: 'z2', name: 'Kisutu Street', nameSw: 'Mtaa wa Kisutu', status: 'safe', description: 'Active vendor area', bounds: { lat: -6.8250, lng: 39.2700, radius: 200 }, color: '#10B981' },
  { id: 'z3', name: 'Mchikichini Back Alleys', nameSw: 'Vichochoro vya Mchikichini', status: 'caution', description: 'Low lighting, fewer people', bounds: { lat: -6.8280, lng: 39.2680, radius: 150 }, color: '#F59E0B' },
  { id: 'z4', name: 'Fabrics Zone', nameSw: 'Eneo la Vitambaa', status: 'safe', description: 'Busy market corridor', bounds: { lat: -6.8270, lng: 39.2710, radius: 250 }, color: '#10B981' },
  { id: 'z5', name: 'Electronics Zone', nameSw: 'Eneo la Elektroniki', status: 'safe', description: 'Main commercial strip', bounds: { lat: -6.8260, lng: 39.2720, radius: 200 }, color: '#10B981' },
];

// Kariakoo market center
const KARIAKOO_CENTER = { lat: -6.8264, lng: 39.2695 };

// ─── Animation ───

const containerVariants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.06 } },
};

const itemVariants = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0 },
};

// ─── Map Component with Google Maps ───

function LiveMap({
  userLocation,
  guideLocation,
  breadcrumbs,
  meetupPoint,
  safetyZones,
  onMapClick,
}: {
  userLocation: { lat: number; lng: number } | null;
  guideLocation: { lat: number; lng: number; name: string } | null;
  breadcrumbs: BreadcrumbPoint[];
  meetupPoint: MeetupPoint | null;
  safetyZones: SafetyZone[];
  onMapClick?: (lat: number, lng: number) => void;
}) {
  const [mapLoaded, setMapLoaded] = useState(false);
  const mapRef = useRef<google.maps.Map | null>(null);
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const markersRef = useRef<google.maps.Marker[]>([]);
  const circlesRef = useRef<google.maps.Circle[]>([]);
  const polylineRef = useRef<google.maps.Polyline | null>(null);
  const meetupMarkerRef = useRef<google.maps.Marker | null>(null);

  // Initialize Google Map
  useEffect(() => {
    const initMap = async () => {
      if (!mapContainerRef.current || mapRef.current) return;

      try {
        const { Loader } = await import('@googlemaps/js-api-loader');
        const loader = new Loader({
          apiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || '',
          version: 'weekly',
        });

        const { Map } = await loader.importLibrary('maps');
        const { Marker, Circle, Polyline } = await loader.importLibrary('marker') as any;

        const map = new Map(mapContainerRef.current, {
          center: KARIAKOO_CENTER,
          zoom: 16,
          mapTypeControl: false,
          streetViewControl: false,
          fullscreenControl: false,
          styles: [
            { featureType: 'poi', elementType: 'labels', stylers: [{ visibility: 'off' }] },
          ],
        });

        mapRef.current = map;
        setMapLoaded(true);

        // Add safety zone circles
        safetyZones.forEach((zone) => {
          const circle = new google.maps.Circle({
            strokeColor: zone.color,
            strokeOpacity: 0.6,
            strokeWeight: 2,
            fillColor: zone.color,
            fillOpacity: 0.08,
            map,
            center: { lat: zone.bounds.lat, lng: zone.bounds.lng },
            radius: zone.bounds.radius,
          });

          // Add zone label
          const infoWindow = new google.maps.InfoWindow({
            content: `<div style="padding:4px;"><strong>${zone.name}</strong><br/><span style="color:${zone.color}">${zone.status === 'safe' ? '✓ Safe' : '⚠ Caution'}</span></div>`,
            position: { lat: zone.bounds.lat, lng: zone.bounds.lng },
          });

          circle.addListener('click', () => infoWindow.open(map));
          circlesRef.current.push(circle);
        });

        // Click handler for meetup
        if (onMapClick) {
          map.addListener('click', (e: google.maps.MapMouseEvent) => {
            if (e.latLng) {
              onMapClick(e.latLng.lat(), e.latLng.lng());
            }
          });
        }
      } catch (err) {
        console.log('Google Maps failed to load, using fallback:', err);
        setMapLoaded(false);
      }
    };

    initMap();
  }, []);

  // Update markers when locations change
  useEffect(() => {
    if (!mapRef.current || !mapLoaded) return;

    // Clear old markers
    markersRef.current.forEach(m => m.setMap(null));
    markersRef.current = [];

    // User marker
    if (userLocation) {
      const userMarker = new google.maps.Marker({
        position: userLocation,
        map: mapRef.current,
        title: 'You',
        icon: {
          path: google.maps.SymbolPath.CIRCLE,
          fillColor: '#065F46',
          fillOpacity: 1,
          strokeColor: '#FFFFFF',
          strokeWeight: 3,
          scale: 8,
        },
        zIndex: 10,
      });
      markersRef.current.push(userMarker);

      // Pulse circle around user
      const pulseCircle = new google.maps.Circle({
        strokeColor: '#065F46',
        strokeOpacity: 0.3,
        strokeWeight: 1,
        fillColor: '#065F46',
        fillOpacity: 0.1,
        map: mapRef.current,
        center: userLocation,
        radius: 30,
      });
      circlesRef.current.push(pulseCircle);
    }

    // Guide marker
    if (guideLocation) {
      const guideMarker = new google.maps.Marker({
        position: { lat: guideLocation.lat, lng: guideLocation.lng },
        map: mapRef.current,
        title: guideLocation.name,
        icon: {
          path: google.maps.SymbolPath.CIRCLE,
          fillColor: '#F59E0B',
          fillOpacity: 1,
          strokeColor: '#FFFFFF',
          strokeWeight: 3,
          scale: 8,
        },
        zIndex: 9,
      });

      const guideInfo = new google.maps.InfoWindow({
        content: `<div style="padding:4px;"><strong>${guideLocation.name}</strong><br/>Your guide</div>`,
      });
      guideMarker.addListener('click', () => guideInfo.open(mapRef.current, guideMarker));
      markersRef.current.push(guideMarker);
    }

    // Meetup marker
    if (meetupPoint) {
      if (meetupMarkerRef.current) meetupMarkerRef.current.setMap(null);
      meetupMarkerRef.current = new google.maps.Marker({
        position: { lat: meetupPoint.lat, lng: meetupPoint.lng },
        map: mapRef.current,
        title: meetupPoint.label,
        icon: {
          path: google.maps.SymbolPath.CIRCLE,
          fillColor: '#EF4444',
          fillOpacity: 1,
          strokeColor: '#FFFFFF',
          strokeWeight: 3,
          scale: 10,
        },
        zIndex: 11,
      });

      const meetupInfo = new google.maps.InfoWindow({
        content: `<div style="padding:4px;"><strong>📍 ${meetupPoint.label}</strong><br/>Meeting point set by ${meetupPoint.setBy}</div>`,
      });
      meetupMarkerRef.current.addListener('click', () => meetupInfo.open(mapRef.current, meetupMarkerRef.current));
    } else {
      if (meetupMarkerRef.current) {
        meetupMarkerRef.current.setMap(null);
        meetupMarkerRef.current = null;
      }
    }

    // Breadcrumb polyline
    if (polylineRef.current) polylineRef.current.setMap(null);
    if (breadcrumbs.length > 1) {
      polylineRef.current = new google.maps.Polyline({
        path: breadcrumbs.map(b => ({ lat: b.lat, lng: b.lng })),
        geodesic: true,
        strokeColor: '#065F46',
        strokeOpacity: 0.5,
        strokeWeight: 3,
        icons: [{
          icon: { path: google.maps.SymbolPath.FORWARD_CLOSED_ARROW },
          offset: '100%',
          repeat: '80px',
        }],
        map: mapRef.current,
      });
    }
  }, [userLocation, guideLocation, breadcrumbs, meetupPoint, mapLoaded]);

  // Fallback: If Google Maps doesn't load, show the placeholder
  if (!mapLoaded && !mapContainerRef.current) {
    return <MapPlaceholder />;
  }

  return (
    <div className="relative w-full h-72 rounded-2xl overflow-hidden border border-[#E2E8F0] dark:border-[#334155]">
      <div ref={mapContainerRef} className="w-full h-full" />
      {/* Map controls overlay */}
      <div className="absolute bottom-3 right-3 flex flex-col gap-1.5">
        <button
          onClick={() => {
            if (mapRef.current && userLocation) {
              mapRef.current.panTo(userLocation);
              mapRef.current.setZoom(17);
            }
          }}
          className="w-8 h-8 rounded-lg bg-white/90 dark:bg-[#1E293B]/90 backdrop-blur-sm flex items-center justify-center shadow-sm hover:bg-white transition-colors"
        >
          <Locate className="w-4 h-4 text-[#065F46] dark:text-[#34D399]" />
        </button>
      </div>
      {/* Legend */}
      <div className="absolute top-3 left-3 bg-white/90 dark:bg-[#1E293B]/90 backdrop-blur-sm rounded-lg p-2 shadow-sm">
        <div className="flex items-center gap-1.5 text-[9px]">
          <div className="w-2.5 h-2.5 rounded-full bg-[#065F46] ring-1 ring-white" />
          <span className="text-[#64748B]">You</span>
          <div className="w-2.5 h-2.5 rounded-full bg-[#F59E0B] ring-1 ring-white ml-1" />
          <span className="text-[#64748B]">Guide</span>
          <div className="w-2.5 h-2.5 rounded-full bg-[#EF4444] ring-1 ring-white ml-1" />
          <span className="text-[#64748B]">Meetup</span>
        </div>
      </div>
    </div>
  );
}

// ─── Map Placeholder (Fallback) ───

function MapPlaceholder() {
  return (
    <div className="relative w-full h-72 rounded-2xl bg-gradient-to-br from-[#065F46]/10 via-[#ECFDF5] to-[#F1F5F9] dark:from-[#022C22] dark:via-[#064E3B] dark:to-[#1E293B] overflow-hidden border border-[#E2E8F0] dark:border-[#334155]">
      {/* Grid pattern */}
      <div className="absolute inset-0 opacity-10" style={{
        backgroundImage: 'linear-gradient(rgba(6,95,70,0.3) 1px, transparent 1px), linear-gradient(90deg, rgba(6,95,70,0.3) 1px, transparent 1px)',
        backgroundSize: '30px 30px',
      }} />

      {/* Safety zones */}
      {SAFETY_ZONES.map(zone => (
        <div key={zone.id} className="absolute rounded-full opacity-20"
          style={{
            backgroundColor: zone.color,
            width: `${zone.bounds.radius / 5}px`,
            height: `${zone.bounds.radius / 5}px`,
            left: `${40 + (zone.bounds.lng - 39.2695) * 2000}%`,
            top: `${40 + (zone.bounds.lat - (-6.8264)) * 2000}%`,
            transform: 'translate(-50%, -50%)',
          }}
        />
      ))}

      {/* Guide markers */}
      {NEARBY_GUIDES.filter(g => g.lat).map((guide, i) => (
        <motion.div
          key={guide.id}
          className="absolute"
          style={{
            left: `${40 + (guide.lng! - 39.2695) * 2000}%`,
            top: `${40 + (guide.lat! - (-6.8264)) * 2000}%`,
          }}
          animate={{ scale: [1, 1.3, 1] }}
          transition={{ duration: 2, repeat: Infinity, delay: i * 0.3 }}
        >
          <div className="w-3 h-3 rounded-full bg-[#F59E0B] ring-2 ring-white shadow-md" />
        </motion.div>
      ))}

      {/* Current location */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
        <motion.div
          animate={{ scale: [1, 1.5, 1], opacity: [0.5, 0.2, 0.5] }}
          transition={{ duration: 2, repeat: Infinity }}
          className="absolute -inset-4 rounded-full bg-[#065F46]/20"
        />
        <div className="relative w-4 h-4 rounded-full bg-[#065F46] ring-3 ring-white shadow-lg z-10" />
      </div>

      {/* Compass */}
      <div className="absolute top-3 right-3 w-8 h-8 rounded-lg bg-white/80 dark:bg-[#1E293B]/80 backdrop-blur-sm flex items-center justify-center shadow-sm">
        <Navigation className="w-4 h-4 text-[#065F46] dark:text-[#34D399] rotate-45" />
      </div>
    </div>
  );
}

// ─── Main Component ───

export default function LiveLocationPage() {
  const { user, language } = useAuthStore();
  const sw = language === 'sw';
  const l = (en: string, swText: string) => (sw ? swText : en);

  const [sosExpanded, setSosExpanded] = useState(false);
  const [locationSharing, setLocationSharing] = useState(false);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [guideLocation, setGuideLocation] = useState<{ lat: number; lng: number; name: string } | null>(null);
  const [breadcrumbs, setBreadcrumbs] = useState<BreadcrumbPoint[]>([]);
  const [meetupPoint, setMeetupPoint] = useState<MeetupPoint | null>(null);
  const [showMeetupPicker, setShowMeetupPicker] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [currentZone, setCurrentZone] = useState<SafetyZone>(SAFETY_ZONES[0]);
  const [isLocating, setIsLocating] = useState(false);
  const [locationError, setLocationError] = useState<string | null>(null);

  const watchIdRef = useRef<number | null>(null);
  const socketCleanupRef = useRef<(() => void) | null>(null);

  // ── Get user location via Geolocation API ──
  const startLocationTracking = useCallback(() => {
    if (!navigator.geolocation) {
      setLocationError(l('Geolocation not supported', 'Geolocation haitumiki'));
      return;
    }

    setIsLocating(true);
    setLocationError(null);

    watchIdRef.current = navigator.geolocation.watchPosition(
      (position) => {
        const { latitude: lat, longitude: lng } = position.coords;
        setUserLocation({ lat, lng });
        setIsLocating(false);
        setLocationError(null);

        // Add to breadcrumbs
        setBreadcrumbs(prev => {
          const last = prev[prev.length - 1];
          // Only add if moved more than ~10 meters
          if (!last || Math.abs(last.lat - lat) > 0.0001 || Math.abs(last.lng - lng) > 0.0001) {
            return [...prev.slice(-50), { lat, lng, timestamp: Date.now() }];
          }
          return prev;
        });

        // Check geofencing - which zone are we in?
        let inZone = false;
        for (const zone of SAFETY_ZONES) {
          const dist = Math.sqrt(
            Math.pow(lat - zone.bounds.lat, 2) + Math.pow(lng - zone.bounds.lng, 2)
          );
          // Rough distance check in degrees (1 degree ≈ 111km)
          const distMeters = dist * 111000;
          if (distMeters <= zone.bounds.radius) {
            setCurrentZone(zone);
            inZone = true;
            break;
          }
        }
        if (!inZone) {
          setCurrentZone({
            id: 'outside',
            name: 'Outside Market Zone',
            nameSw: 'Nje Ya Eneo La Soko',
            status: 'caution',
            description: 'You are outside the main market area',
            bounds: { lat: 0, lng: 0, radius: 0 },
            color: '#F59E0B',
          });
        }

        // Emit location via WebSocket if sharing
        if (locationSharing) {
          emitLocation(lat, lng, position.coords.accuracy || 10);
        }
      },
      (error) => {
        setIsLocating(false);
        switch (error.code) {
          case error.PERMISSION_DENIED:
            setLocationError(l('Location permission denied', 'Ruhusa ya eneo imekataliwa'));
            break;
          case error.POSITION_UNAVAILABLE:
            setLocationError(l('Location unavailable', 'Eneo halipatikani'));
            break;
          case error.TIMEOUT:
            setLocationError(l('Location request timed out', 'Ombi la eneo limeisha muda'));
            break;
        }
      },
      {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 5000,
      }
    );
  }, [locationSharing, l]);

  // ── Start/stop location sharing ──
  useEffect(() => {
    if (locationSharing) {
      startLocationTracking();

      // Connect to socket for real-time updates
      if (user?.id) {
        const socket = connectSocket(user.id, user.role);
        if (socket) {
          const cleanup = onLocationUpdate((data: LiveLocation) => {
            // If the other person in our session shares location, show them
            if (data.userId !== user.id) {
              setGuideLocation({
                lat: data.lat,
                lng: data.lng,
                name: data.userId === user.id ? 'You' : 'Your Guide',
              });
            }
          });
          socketCleanupRef.current = cleanup;
        }
      }
    } else {
      // Stop tracking
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
        watchIdRef.current = null;
      }
      if (socketCleanupRef.current) {
        socketCleanupRef.current();
        socketCleanupRef.current = null;
      }
    }

    return () => {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
      }
      if (socketCleanupRef.current) {
        socketCleanupRef.current();
      }
    };
  }, [locationSharing, user?.id, user?.role, startLocationTracking]);

  // ── Simulate guide location (demo) ──
  useEffect(() => {
    if (!guideLocation && locationSharing) {
      // Simulate a guide's location near the market
      const timer = setTimeout(() => {
        setGuideLocation({
          lat: KARIAKOO_CENTER.lat + 0.001,
          lng: KARIAKOO_CENTER.lng + 0.001,
          name: 'Mwanamvua J.',
        });
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [locationSharing, guideLocation]);

  // ── Handle map click for meetup point ──
  const handleMapClick = useCallback((lat: number, lng: number) => {
    if (showMeetupPicker) {
      setMeetupPoint({
        lat,
        lng,
        label: l('Meeting Point', 'Eneo la Kukutana'),
        setBy: user?.name || 'You',
        timestamp: Date.now(),
      });
      setShowMeetupPicker(false);
    }
  }, [showMeetupPicker, user?.name, l]);

  // ── Save location to history API ──
  const saveLocationToHistory = useCallback(async (lat: number, lng: number, sessionId: string = 'demo') => {
    try {
      await fetch('/api/location-history', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId, lat, lng, accuracy: 10 }),
      });
    } catch { /* ignore */ }
  }, []);

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="show"
      className="px-4 py-4 space-y-5 pb-24"
    >
      {/* Header */}
      <motion.div variants={itemVariants}>
        <h1 className="text-2xl font-bold text-[#065F46] dark:text-[#34D399]">{l('Live Location', 'Eneo La Moja kwa Moja')}</h1>
        <p className="text-sm text-[#64748B] mt-1">{l('Find nearby guides and stay safe', 'Pata miongozo karibu na ukae salama')}</p>
      </motion.div>

      {/* Map Area */}
      <motion.div variants={itemVariants}>
        <LiveMap
          userLocation={userLocation}
          guideLocation={guideLocation}
          breadcrumbs={breadcrumbs}
          meetupPoint={meetupPoint}
          safetyZones={SAFETY_ZONES}
          onMapClick={handleMapClick}
        />

        {/* Location status bar */}
        <div className="flex items-center justify-between mt-2">
          <div className="flex items-center gap-2">
            {isLocating ? (
              <>
                <Loader2 className="w-3.5 h-3.5 text-[#065F46] animate-spin" />
                <span className="text-xs text-[#64748B]">{l('Getting location...', 'Inapata eneo...')}</span>
              </>
            ) : userLocation ? (
              <>
                <div className="w-2 h-2 rounded-full bg-[#10B981]" />
                <span className="text-xs text-[#64748B]">
                  {userLocation.lat.toFixed(4)}, {userLocation.lng.toFixed(4)}
                </span>
              </>
            ) : (
              <>
                <MapPin className="w-3.5 h-3.5 text-[#94A3B8]" />
                <span className="text-xs text-[#94A3B8]">{l('Location not available', 'Eneo halipatikani')}</span>
              </>
            )}
          </div>
          {locationError && (
            <span className="text-[10px] text-[#DC2626]">{locationError}</span>
          )}
        </div>
      </motion.div>

      {/* Safety Zone Indicator */}
      <motion.div variants={itemVariants}>
        <div className={`p-4 rounded-2xl flex items-center gap-3 border ${
          currentZone.status === 'safe'
            ? 'bg-[#ECFDF5] dark:bg-[#064E3B] border-[#34D399]/20'
            : 'bg-[#FEF3C7] dark:bg-[#422006] border-[#F59E0B]/20'
        }`}>
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
            currentZone.status === 'safe' ? 'bg-white dark:bg-[#1E293B]' : 'bg-white dark:bg-[#1E293B]'
          }`}>
            {currentZone.status === 'safe'
              ? <Shield className="w-5 h-5 text-[#10B981]" />
              : <AlertTriangle className="w-5 h-5 text-[#F59E0B]" />
            }
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <p className="text-sm font-bold">
                {currentZone.status === 'safe' ? l('Safe Zone', 'Eneo Salama') : l('Caution Zone', 'Eneo la Tahadhari')}
              </p>
              <Badge variant="outline" className={`text-[8px] h-4 px-1.5 ${
                currentZone.status === 'safe'
                  ? 'border-[#10B981]/30 text-[#10B981] bg-white dark:bg-[#1E293B]'
                  : 'border-[#F59E0B]/30 text-[#F59E0B] bg-white dark:bg-[#1E293B]'
              }`}>
                {sw ? currentZone.nameSw : currentZone.name}
              </Badge>
            </div>
            <p className="text-xs text-[#64748B] mt-0.5">{currentZone.description}</p>
          </div>
        </div>
      </motion.div>

      {/* Location Sharing & Actions Row */}
      <motion.div variants={itemVariants} className="grid grid-cols-3 gap-2">
        <button
          onClick={() => setLocationSharing(!locationSharing)}
          className={`p-3 rounded-xl text-center transition-all ${
            locationSharing
              ? 'bg-[#065F46] text-white shadow-lg'
              : 'bg-white dark:bg-[#1E293B] border border-[#E2E8F0] dark:border-[#334155] hover:border-[#065F46] dark:hover:border-[#34D399]'
          }`}
        >
          <Radio className={`w-5 h-5 mx-auto mb-1 ${locationSharing ? 'animate-pulse' : ''}`} />
          <span className="text-[10px] font-bold block">
            {locationSharing ? l('Sharing', 'Inashiriki') : l('Share', 'Shiriki')}
          </span>
        </button>

        <button
          onClick={() => {
            setShowMeetupPicker(!showMeetupPicker);
            if (!showMeetupPicker && meetupPoint) {
              setMeetupPoint(null);
            }
          }}
          className={`p-3 rounded-xl text-center transition-all ${
            showMeetupPicker
              ? 'bg-[#EF4444] text-white shadow-lg'
              : meetupPoint
                ? 'bg-[#065F46] text-white shadow-lg'
                : 'bg-white dark:bg-[#1E293B] border border-[#E2E8F0] dark:border-[#334155] hover:border-[#065F46] dark:hover:border-[#34D399]'
          }`}
        >
          <MapPinned className="w-5 h-5 mx-auto mb-1" />
          <span className="text-[10px] font-bold block">
            {showMeetupPicker ? l('Tap Map', 'Gusa Ramani') : meetupPoint ? l('Meetup Set', 'Eneo Liko') : l('Meet Up', 'Kutana')}
          </span>
        </button>

        <button
          onClick={() => setShowHistory(!showHistory)}
          className={`p-3 rounded-xl text-center transition-all ${
            showHistory
              ? 'bg-[#065F46] text-white shadow-lg'
              : 'bg-white dark:bg-[#1E293B] border border-[#E2E8F0] dark:border-[#334155] hover:border-[#065F46] dark:hover:border-[#34D399]'
          }`}
        >
          <History className="w-5 h-5 mx-auto mb-1" />
          <span className="text-[10px] font-bold block">{l('Trail', 'Njia')}</span>
        </button>
      </motion.div>

      {/* Meetup Point Info */}
      <AnimatePresence>
        {meetupPoint && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className="p-3 rounded-xl bg-[#FEF2F2] dark:bg-[#2D1B1B] border border-[#EF4444]/20 flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-[#EF4444]/10 flex items-center justify-center">
                <MapPinned className="w-4 h-4 text-[#EF4444]" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-bold text-[#0F172A] dark:text-[#F1F5F9]">{meetupPoint.label}</p>
                <p className="text-[10px] text-[#64748B]">
                  {meetupPoint.lat.toFixed(4)}, {meetupPoint.lng.toFixed(4)} · {l('Set by', 'Imewekwa na')} {meetupPoint.setBy}
                </p>
              </div>
              <button onClick={() => setMeetupPoint(null)} className="p-1.5 rounded-lg hover:bg-[#EF4444]/10">
                <X className="w-4 h-4 text-[#EF4444]" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Location History Trail */}
      <AnimatePresence>
        {showHistory && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className="p-4 rounded-xl bg-white dark:bg-[#1E293B] border border-[#E2E8F0] dark:border-[#334155]">
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-sm font-bold text-[#065F46] dark:text-[#34D399] flex items-center gap-2">
                  <Footprints className="w-4 h-4" />
                  {l('Location Trail', 'Njia Ya Eneo')}
                </h4>
                <Badge variant="outline" className="text-[10px]">
                  {breadcrumbs.length} {l('points', 'pointi')}
                </Badge>
              </div>
              {breadcrumbs.length > 0 ? (
                <div className="max-h-40 overflow-y-auto space-y-1.5">
                  {breadcrumbs.slice(-10).reverse().map((point, i) => (
                    <div key={i} className="flex items-center gap-2 text-xs">
                      <div className={`w-2 h-2 rounded-full ${i === 0 ? 'bg-[#065F46]' : 'bg-[#94A3B8]'}`} />
                      <span className="text-[#64748B]">
                        {point.lat.toFixed(4)}, {point.lng.toFixed(4)}
                      </span>
                      <span className="text-[#94A3B8] ml-auto">
                        {new Date(point.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-[#94A3B8] text-center py-4">
                  {l('No location history yet. Start sharing your location.', 'Hakuna historia ya eneo bado. Anza kushiriki eneo lako.')}
                </p>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Nearby Guides */}
      <motion.div variants={itemVariants} className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="font-bold text-sm flex items-center gap-2">
            <Users className="w-4 h-4 text-[#065F46] dark:text-[#34D399]" />
            {l('Nearby Guides', 'Miongozo Karibu')}
          </h3>
          <span className="text-xs text-[#64748B]">{l('Within 500m', 'Ndani ya 500m')}</span>
        </div>
        <div className="space-y-2 max-h-72 overflow-y-auto">
          {NEARBY_GUIDES.map((guide, i) => (
            <motion.div
              key={guide.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className="p-3.5 rounded-xl bg-white dark:bg-[#1E293B] border border-[#E2E8F0] dark:border-[#334155] flex items-center justify-between"
            >
              <div className="flex items-center gap-3">
                <div className="relative">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-xs font-bold text-white ${
                    guide.availability === 'available' ? 'bg-gradient-to-br from-[#065F46] to-[#059669]' :
                    guide.availability === 'busy' ? 'bg-gradient-to-br from-[#F59E0B] to-[#FBBF24]' :
                    'bg-[#94A3B8]'
                  }`}>
                    {guide.name.split(' ').map(n => n[0]).join('')}
                  </div>
                  {guide.verified && (
                    <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full bg-[#10B981] flex items-center justify-center ring-2 ring-white dark:ring-[#1E293B]">
                      <CheckCircle className="w-2.5 h-2.5 text-white" />
                    </div>
                  )}
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <p className="text-sm font-medium">{guide.name}</p>
                    <div className="flex items-center gap-0.5">
                      <Star className="w-3 h-3 fill-[#F59E0B] text-[#F59E0B]" />
                      <span className="text-[10px] font-semibold">{guide.rating}</span>
                    </div>
                  </div>
                  <p className="text-xs text-[#64748B]">{guide.specialty}</p>
                </div>
              </div>
              <div className="text-right flex flex-col items-end gap-1.5">
                <div className="flex items-center gap-1 text-[#065F46] dark:text-[#34D399]">
                  <MapPin className="w-3 h-3" />
                  <span className="text-xs font-bold">{guide.distance}</span>
                </div>
                <Badge variant="outline" className={`text-[8px] h-4 px-1.5 ${
                  guide.availability === 'available'
                    ? 'border-[#10B981]/30 text-[#10B981] bg-[#ECFDF5] dark:bg-[#064E3B]'
                    : guide.availability === 'busy'
                    ? 'border-[#F59E0B]/30 text-[#F59E0B] bg-[#FEF3C7] dark:bg-[#422006]'
                    : 'border-[#94A3B8]/30 text-[#94A3B8] bg-[#F1F5F9] dark:bg-[#334155]'
                }`}>
                  {guide.availability}
                </Badge>
              </div>
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* Emergency SOS Button */}
      <motion.div variants={itemVariants} className="relative">
        <motion.button
          onClick={() => setSosExpanded(!sosExpanded)}
          className={`w-full py-4 rounded-2xl font-bold text-white flex items-center justify-center gap-2 transition-all ${
            sosExpanded
              ? 'bg-[#DC2626] rounded-t-2xl rounded-b-none'
              : 'bg-gradient-to-r from-[#DC2626] to-[#B91C1C] shadow-lg shadow-red-600/30'
          }`}
          whileTap={{ scale: 0.98 }}
        >
          <Siren className="w-5 h-5" />
          <span className="text-lg">SOS</span>
          {!sosExpanded && <span className="text-sm font-medium opacity-80">{l('Emergency', 'Dharura')}</span>}
        </motion.button>

        <AnimatePresence>
          {sosExpanded && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="bg-[#FEE2E2] dark:bg-[#2D1B1B] rounded-b-2xl overflow-hidden"
            >
              <div className="p-4 space-y-2">
                <p className="text-xs font-semibold text-[#DC2626] mb-3">{l('Choose emergency option:', 'Chagua chaguo la dharura:')}</p>
                {[
                  { icon: Phone, label: l('Call Emergency (112)', 'Piga Simu Ya Dharura (112)'), desc: l('Contact local emergency services', 'Wasiliana na huduma za dharura'), action: () => { window.location.href = 'tel:112'; } },
                  { icon: MessageSquare, label: l('Alert Trusted Contacts', 'Tahadhari Watu Wa Kuaminika'), desc: l('Send your location to saved contacts', 'Tuma eneo lako kwa watu ulioowaadhini'), action: () => {
                    const locationText = userLocation ? `SOS! I need help. My location: https://maps.google.com/?q=${userLocation.lat},${userLocation.lng}` : 'SOS! I need help at Kariakoo Market.';
                    if (navigator.share) {
                      navigator.share({ title: 'SOS - Chimbo Direct', text: locationText }).catch(() => {});
                    }
                  }},
                  { icon: Cross, label: l('Nearest Hospital', 'Hospitali Ya Karibu'), desc: l('Get directions to closest medical facility', 'Pata maelekezo ya hospitali ya karibu'), action: () => {
                    window.open('https://www.google.com/maps/search/hospital+near+Kariakoo+Dar+es+Salaam', '_blank');
                  }},
                  { icon: Shield, label: l('Report Incident', 'Ripoti Tukio'), desc: l('File a safety report with Chimbo Direct', 'Wasilisha ripoti ya usalama na Chimbo Direct'), action: () => {} },
                ].map((option, i) => (
                  <button
                    key={i}
                    onClick={option.action}
                    className="w-full flex items-center gap-3 p-3 rounded-xl bg-white dark:bg-[#1E293B] hover:bg-[#FEE2E2] dark:hover:bg-[#3D2B2B] transition-colors active:scale-[0.98]"
                  >
                    <div className="w-9 h-9 rounded-lg bg-[#DC2626]/10 flex items-center justify-center">
                      <option.icon className="w-4 h-4 text-[#DC2626]" />
                    </div>
                    <div className="text-left">
                      <p className="text-sm font-semibold">{option.label}</p>
                      <p className="text-[10px] text-[#64748B]">{option.desc}</p>
                    </div>
                    <ChevronRight className="w-4 h-4 text-[#64748B] ml-auto" />
                  </button>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </motion.div>
  );
}

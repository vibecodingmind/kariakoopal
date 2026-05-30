'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import {
  AlertTriangle,
  Shield,
  MapPin,
  Phone,
  User,
  Clock,
  CheckCircle2,
  X,
  Copy,
  Radio,
  Heart,
  ShieldAlert,
  Eye,
  Navigation,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { t, type Language } from '@/lib/i18n';
import { useAuthStore } from '@/lib/stores/auth-store';

// ── Types ──

type EmergencyStatus = 'idle' | 'countdown' | 'sent' | 'acknowledged';
type EmergencyType = 'safety' | 'theft' | 'medical' | 'harassment' | 'lost';

interface EmergencyPanelProps {
  sessionId: string;
  sessionCode: string;
  guideName?: string;
  seekerName?: string;
  onEmergencyTriggered?: (data: {
    type: string;
    lat: number;
    lng: number;
    timestamp: string;
  }) => void;
  onCancelEmergency?: () => void;
  language?: 'sw' | 'en';
  className?: string;
}

// ── Emergency type config ──

const emergencyTypes: {
  id: EmergencyType;
  key: string;
  icon: React.ElementType;
  color: string;
}[] = [
  {
    id: 'safety',
    key: 'emergency_safety',
    icon: ShieldAlert,
    color: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300',
  },
  {
    id: 'theft',
    key: 'emergency_theft',
    icon: Eye,
    color: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300',
  },
  {
    id: 'medical',
    key: 'emergency_medical',
    icon: Heart,
    color: 'bg-pink-100 text-pink-700 dark:bg-pink-900/30 dark:text-pink-300',
  },
  {
    id: 'harassment',
    key: 'emergency_harassment',
    icon: Shield,
    color: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300',
  },
  {
    id: 'lost',
    key: 'emergency_lost',
    icon: Navigation,
    color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300',
  },
];

// ── Kariakoo fallback GPS ──

const KARIAKOO_LAT = -6.8264;
const KARIAKOO_LNG = 39.2695;

// ── Component ──

export function EmergencyPanel({
  sessionId,
  sessionCode,
  guideName,
  seekerName,
  onEmergencyTriggered,
  onCancelEmergency,
  language: languageProp,
  className,
}: EmergencyPanelProps) {
  const storeLanguage = useAuthStore((s) => s.language);
  const lang = languageProp || (storeLanguage as Language) || 'sw';

  // State
  const [status, setStatus] = useState<EmergencyStatus>('idle');
  const [selectedType, setSelectedType] = useState<EmergencyType | ''>('');
  const [countdown, setCountdown] = useState(5);
  const [gpsCoords, setGpsCoords] = useState<{
    lat: number;
    lng: number;
  } | null>(null);
  const [gpsLoading, setGpsLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [acknowledgedBy, setAcknowledgedBy] = useState<string[]>([]);

  const countdownRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const holdTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const holdIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // ── GPS capture ──
  const captureGPS = useCallback(() => {
    setGpsLoading(true);

    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setGpsCoords({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          });
          setGpsLoading(false);
        },
        () => {
          // Fallback to Kariakoo coordinates
          setGpsCoords({ lat: KARIAKOO_LAT, lng: KARIAKOO_LNG });
          setGpsLoading(false);
        },
        { timeout: 5000, enableHighAccuracy: true }
      );
    } else {
      // Fallback
      setGpsCoords({ lat: KARIAKOO_LAT, lng: KARIAKOO_LNG });
      setGpsLoading(false);
    }
  }, []);

  // ── Countdown logic ──
  useEffect(() => {
    if (status !== 'countdown') return;

    countdownRef.current = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          // Countdown finished - send emergency
          if (countdownRef.current) clearInterval(countdownRef.current);

          // Capture GPS if not already
          const coords = gpsCoords || { lat: KARIAKOO_LAT, lng: KARIAKOO_LNG };

          setStatus('sent');
          onEmergencyTriggered?.({
            type: selectedType || 'safety',
            lat: coords.lat,
            lng: coords.lng,
            timestamp: new Date().toISOString(),
          });

          // Simulate acknowledgment after 3 seconds
          setTimeout(() => {
            setAcknowledgedBy(['police']);
            setStatus('acknowledged');
          }, 3000);

          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (countdownRef.current) clearInterval(countdownRef.current);
    };
  }, [status, selectedType, gpsCoords, onEmergencyTriggered]);

  // ── Handlers ──

  const handleStartEmergency = useCallback(() => {
    if (!selectedType) return;

    // Capture GPS
    captureGPS();

    // Start countdown
    setCountdown(5);
    setStatus('countdown');
  }, [selectedType, captureGPS]);

  const handleCancelCountdown = useCallback(() => {
    if (countdownRef.current) clearInterval(countdownRef.current);
    setStatus('idle');
    setCountdown(5);
    onCancelEmergency?.();
  }, [onCancelEmergency]);

  const handleImSafe = useCallback(() => {
    setStatus('idle');
    setSelectedType('');
    setAcknowledgedBy([]);
    setGpsCoords(null);
    setCountdown(5);
  }, []);

  const handleCopyCoords = useCallback(async () => {
    if (!gpsCoords) return;
    const text = `${gpsCoords.lat.toFixed(4)}, ${gpsCoords.lng.toFixed(4)}`;
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback
    }
  }, [gpsCoords]);

  // ── Cleanup ──
  useEffect(() => {
    return () => {
      if (countdownRef.current) clearInterval(countdownRef.current);
      if (holdTimerRef.current) clearTimeout(holdTimerRef.current);
      if (holdIntervalRef.current) clearInterval(holdIntervalRef.current);
    };
  }, []);

  // ── Render: Idle state ──
  const renderIdle = () => (
    <div className="space-y-4">
      {/* Emergency type selection */}
      <div>
        <p className="text-sm font-medium text-foreground mb-2">
          {t('emergency_type', lang)}
        </p>
        <div className="grid grid-cols-1 gap-2">
          {emergencyTypes.map((et) => {
            const Icon = et.icon;
            return (
              <button
                key={et.id}
                onClick={() => setSelectedType(et.id)}
                className={cn(
                  'flex items-center gap-3 rounded-xl border p-3 transition-all duration-200 text-left w-full',
                  'hover:border-red-300 hover:bg-red-50/50 dark:hover:bg-red-900/10',
                  selectedType === et.id
                    ? 'border-red-400 bg-red-50 dark:bg-red-900/20 ring-1 ring-red-400/50'
                    : 'border-border'
                )}
              >
                <div
                  className={cn(
                    'size-9 rounded-full flex items-center justify-center shrink-0',
                    et.color
                  )}
                >
                  <Icon className="size-4" />
                </div>
                <span className="text-sm font-medium">{t(et.key, lang)}</span>
                {selectedType === et.id && (
                  <CheckCircle2 className="size-4 text-red-600 dark:text-red-400 ml-auto shrink-0" />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Large emergency button */}
      <button
        onClick={handleStartEmergency}
        disabled={!selectedType}
        className={cn(
          'relative w-full py-6 rounded-2xl font-bold text-lg transition-all duration-300',
          'flex flex-col items-center justify-center gap-2',
          'bg-gradient-to-br from-red-500 to-red-700 text-white shadow-xl',
          'hover:from-red-600 hover:to-red-800 hover:shadow-2xl hover:shadow-red-500/40',
          'active:scale-[0.97]',
          'disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:shadow-xl',
          'focus:outline-none focus:ring-4 focus:ring-red-400/50'
        )}
      >
        {/* Pulsing ring */}
        {selectedType && (
          <span className="absolute inset-0 rounded-2xl animate-ping bg-red-400/20 pointer-events-none" />
        )}
        <AlertTriangle className="size-8" />
        <span>{t('emergency_press', lang)}</span>
        <span className="text-xs font-normal opacity-80">
          {t('emergency_hold', lang)}
        </span>
      </button>
    </div>
  );

  // ── Render: Countdown state ──
  const renderCountdown = () => (
    <div className="space-y-5">
      <div className="flex flex-col items-center gap-4 py-4">
        {/* Countdown circle */}
        <div className="relative size-32">
          <svg className="size-32 -rotate-90" viewBox="0 0 100 100">
            <circle
              cx="50"
              cy="50"
              r="42"
              fill="none"
              stroke="currentColor"
              className="text-red-100 dark:text-red-900/30"
              strokeWidth="6"
            />
            <circle
              cx="50"
              cy="50"
              r="42"
              fill="none"
              stroke="currentColor"
              className="text-red-500"
              strokeWidth="6"
              strokeLinecap="round"
              strokeDasharray={`${2 * Math.PI * 42}`}
              strokeDashoffset={`${2 * Math.PI * 42 * (1 - countdown / 5)}`}
              style={{ transition: 'stroke-dashoffset 1s linear' }}
            />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-4xl font-bold text-red-600 dark:text-red-400">
              {countdown}
            </span>
          </div>
        </div>

        <div className="text-center">
          <p className="text-base font-semibold text-red-700 dark:text-red-300">
            {t('emergency_countdown', lang)}
          </p>
          <p className="text-sm text-muted-foreground">
            {countdown} {t('emergency_seconds', lang)}
          </p>
        </div>

        {/* Selected type display */}
        {selectedType && (
          <Badge
            variant="destructive"
            className="text-sm py-1 px-3"
          >
            {t(
              emergencyTypes.find((et) => et.id === selectedType)?.key || 'emergency_safety',
              lang
            )}
          </Badge>
        )}
      </div>

      {/* GPS indicator */}
      <div className="flex items-center gap-2 text-xs text-muted-foreground bg-muted/50 rounded-lg px-3 py-2">
        <MapPin className="size-3.5 text-red-500 animate-pulse" />
        {gpsLoading
          ? t('emergency_waiting_gps', lang)
          : gpsCoords
            ? t('emergency_location_captured', lang)
            : t('emergency_waiting_gps', lang)}
      </div>

      {/* Cancel button */}
      <Button
        variant="outline"
        className="w-full h-12 border-2 border-red-300 text-red-600 hover:bg-red-50 dark:border-red-800 dark:text-red-400 dark:hover:bg-red-900/20 font-semibold"
        onClick={handleCancelCountdown}
      >
        <X className="size-5 mr-1.5" />
        {t('emergency_cancel', lang)}
      </Button>
    </div>
  );

  // ── Render: Sent state ──
  const renderSent = () => (
    <div className="space-y-5">
      <div className="flex flex-col items-center gap-4 py-4">
        {/* Pulsing alert icon */}
        <div className="relative size-24">
          <div className="absolute inset-0 rounded-full bg-red-100 dark:bg-red-900/30 animate-ping" />
          <div className="relative size-24 rounded-full bg-gradient-to-br from-red-500 to-red-700 flex items-center justify-center shadow-xl shadow-red-500/30">
            <AlertTriangle className="size-10 text-white animate-pulse" />
          </div>
        </div>

        <div className="text-center">
          <p className="text-xl font-bold text-red-700 dark:text-red-300">
            {t('emergency_sent', lang)}
          </p>
          <p className="text-sm text-muted-foreground mt-1">
            {lang === 'sw'
              ? 'Inasubiri uthibitisho...'
              : 'Waiting for acknowledgment...'}
          </p>
        </div>
      </div>

      {/* GPS coordinates */}
      {gpsCoords && (
        <Card className="border-red-200 dark:border-red-800">
          <CardContent className="p-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <MapPin className="size-4 text-red-500" />
                <span className="text-xs text-muted-foreground">
                  {t('emergency_gps', lang)}
                </span>
              </div>
              <button
                onClick={handleCopyCoords}
                className="flex items-center gap-1 text-xs text-red-600 dark:text-red-400 hover:underline"
              >
                <Copy className="size-3" />
                {copied ? t('copied', lang) : t('copy', lang)}
              </button>
            </div>
            <p className="text-sm font-mono font-semibold mt-1">
              {gpsCoords.lat.toFixed(4)}, {gpsCoords.lng.toFixed(4)}
            </p>
          </CardContent>
        </Card>
      )}

      {/* Notified parties */}
      <div className="space-y-2">
        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
          {t('emergency_notified', lang)}
        </p>
        {[
          { icon: Phone, label: t('emergency_police', lang), detail: '0772-111-111' },
          { icon: Shield, label: t('emergency_admin', lang), detail: lang === 'sw' ? 'Jukwaa' : 'Platform' },
          ...(guideName
            ? [{ icon: User, label: t('emergency_guide', lang), detail: guideName }]
            : []),
          ...(seekerName
            ? [{ icon: User, label: lang === 'sw' ? 'Muombaji' : 'Seeker', detail: seekerName }]
            : []),
        ].map((party, i) => {
          const Icon = party.icon;
          const isAcknowledged = acknowledgedBy.includes(
            i === 0 ? 'police' : i === 1 ? 'admin' : i === 2 ? 'guide' : 'seeker'
          );
          return (
            <div
              key={i}
              className={cn(
                'flex items-center gap-3 rounded-lg border p-2.5 transition-all',
                isAcknowledged
                  ? 'border-emerald-200 bg-emerald-50 dark:border-emerald-800 dark:bg-emerald-900/20'
                  : 'border-border'
              )}
            >
              <Icon className={cn('size-4', isAcknowledged ? 'text-emerald-600 dark:text-emerald-400' : 'text-muted-foreground')} />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{party.label}</p>
                <p className="text-xs text-muted-foreground truncate">{party.detail}</p>
              </div>
              {isAcknowledged ? (
                <CheckCircle2 className="size-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
              ) : (
                <Clock className="size-4 text-amber-500 animate-pulse shrink-0" />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );

  // ── Render: Acknowledged state ──
  const renderAcknowledged = () => (
    <div className="space-y-5">
      <div className="flex flex-col items-center gap-4 py-4">
        <div className="relative size-20">
          <div className="size-20 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
            <CheckCircle2 className="size-10 text-emerald-600 dark:text-emerald-400" />
          </div>
        </div>

        <div className="text-center">
          <p className="text-lg font-semibold text-emerald-700 dark:text-emerald-300">
            {t('emergency_acknowledged', lang)}
          </p>
          <p className="text-sm text-muted-foreground mt-1">
            {lang === 'sw'
              ? 'Usaidizi unakuja'
              : 'Help is on the way'}
          </p>
        </div>
      </div>

      {/* GPS coordinates */}
      {gpsCoords && (
        <Card className="border-emerald-200 dark:border-emerald-800">
          <CardContent className="p-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <MapPin className="size-4 text-emerald-500" />
                <span className="text-xs text-muted-foreground">
                  {t('emergency_gps', lang)}
                </span>
              </div>
              <button
                onClick={handleCopyCoords}
                className="flex items-center gap-1 text-xs text-emerald-600 dark:text-emerald-400 hover:underline"
              >
                <Copy className="size-3" />
                {copied ? t('copied', lang) : t('copy', lang)}
              </button>
            </div>
            <p className="text-sm font-mono font-semibold mt-1">
              {gpsCoords.lat.toFixed(4)}, {gpsCoords.lng.toFixed(4)}
            </p>
          </CardContent>
        </Card>
      )}

      {/* Session info */}
      <div className="flex items-center gap-2 text-xs text-muted-foreground bg-muted/50 rounded-lg px-3 py-2">
        <Radio className="size-3.5" />
        {t('session_code', lang)}: <span className="font-mono font-semibold">{sessionCode}</span>
      </div>

      {/* I'm safe button */}
      <Button
        className="w-full h-12 font-semibold bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white shadow-lg shadow-emerald-500/25"
        onClick={handleImSafe}
      >
        <Heart className="size-5 mr-1.5" />
        {t('emergency_im_safe', lang)}
      </Button>
    </div>
  );

  // ── Status config for header ──
  const statusConfig: Record<EmergencyStatus, { color: string; label: string }> = {
    idle: { color: 'text-muted-foreground', label: '' },
    countdown: {
      color: 'text-red-600 dark:text-red-400',
      label: t('emergency_countdown', lang),
    },
    sent: {
      color: 'text-red-600 dark:text-red-400',
      label: t('emergency_sent', lang),
    },
    acknowledged: {
      color: 'text-emerald-600 dark:text-emerald-400',
      label: t('emergency_acknowledged', lang),
    },
  };

  return (
    <Card
      className={cn(
        'overflow-hidden',
        status === 'countdown' && 'border-red-300 dark:border-red-800 ring-2 ring-red-400/30',
        status === 'sent' && 'border-red-300 dark:border-red-800',
        status === 'acknowledged' && 'border-emerald-300 dark:border-emerald-800',
        className
      )}
    >
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <div
            className={cn(
              'size-8 rounded-lg flex items-center justify-center',
              status === 'idle'
                ? 'bg-red-100 dark:bg-red-900/30'
                : status === 'acknowledged'
                  ? 'bg-emerald-100 dark:bg-emerald-900/30'
                  : 'bg-red-500'
            )}
          >
            <AlertTriangle
              className={cn(
                'size-4',
                status === 'idle' && 'text-red-600 dark:text-red-400',
                status === 'acknowledged' && 'text-emerald-600 dark:text-emerald-400',
                status !== 'idle' && status !== 'acknowledged' && 'text-white animate-pulse'
              )}
            />
          </div>
          <div className="flex-1">
            <span>{t('emergency_title', lang)}</span>
            {status !== 'idle' && (
              <p className={cn('text-xs font-normal', statusConfig[status].color)}>
                {statusConfig[status].label}
              </p>
            )}
          </div>
          {status !== 'idle' && (
            <Badge
              variant={status === 'acknowledged' ? 'default' : 'destructive'}
              className="animate-pulse"
            >
              {status === 'countdown' && `${countdown}s`}
              {status === 'sent' && (lang === 'sw' ? 'Imetumwa' : 'Sent')}
              {status === 'acknowledged' && (lang === 'sw' ? 'Imethibitishwa' : 'Ack')}
            </Badge>
          )}
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-0 px-4 pb-4">
        {status === 'idle' && renderIdle()}
        {status === 'countdown' && renderCountdown()}
        {status === 'sent' && renderSent()}
        {status === 'acknowledged' && renderAcknowledged()}
      </CardContent>
    </Card>
  );
}

'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import {
  Mic,
  MicOff,
  Square,
  Shield,
  Clock,
  AlertTriangle,
  CheckCircle2,
  Lock,
  Eye,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { t, type Language } from '@/lib/i18n';
import { useAuthStore } from '@/lib/stores/auth-store';
import { cn } from '@/lib/utils';

// ── Types ──

interface SessionRecordingProps {
  sessionId: string;
  guideConsent: boolean;
  seekerConsent: boolean;
  isRecording: boolean;
  duration: number; // in seconds
  onGrantConsent: () => void;
  onStartRecording: () => void;
  onStopRecording: () => void;
  language?: 'sw' | 'en';
  className?: string;
}

// ── Helpers ──

function formatDuration(seconds: number): string {
  const hrs = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;
  if (hrs > 0) {
    return `${hrs}:${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  }
  return `${mins}:${String(secs).padStart(2, '0')}`;
}

// ── Component ──

export function SessionRecording({
  sessionId,
  guideConsent,
  seekerConsent,
  isRecording,
  duration,
  onGrantConsent,
  onStartRecording,
  onStopRecording,
  language: languageProp,
  className,
}: SessionRecordingProps) {
  const storeLanguage = useAuthStore((s) => s.language);
  const lang = languageProp || (storeLanguage as Language) || 'sw';

  const [localConsent, setLocalConsent] = useState(false);
  const [elapsed, setElapsed] = useState(duration);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Timer when recording
  useEffect(() => {
    if (isRecording) {
      timerRef.current = setInterval(() => {
        setElapsed((prev) => prev + 1);
      }, 1000);
    } else {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isRecording]);

  // Sync duration prop
  useEffect(() => {
    if (!isRecording) {
      setElapsed(duration);
    }
  }, [duration, isRecording]);

  const bothConsented = guideConsent && seekerConsent;
  const canRecord = bothConsented || localConsent;

  const handleGrantConsent = useCallback(() => {
    setLocalConsent(true);
    onGrantConsent();
  }, [onGrantConsent]);

  return (
    <div className={cn('glass-card gradient-border p-5 space-y-5', className)}>
      {/* ── Header ── */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div
            className={cn(
              'size-9 rounded-xl flex items-center justify-center shadow-lg',
              isRecording
                ? 'bg-gradient-to-br from-red-500 to-red-600 shadow-red-500/20'
                : 'bg-gradient-to-br from-amber-500 to-orange-500 shadow-amber-500/20'
            )}
          >
            <Mic className="size-4 text-white" />
          </div>
          <div>
            <h3 className="font-semibold text-sm gradient-text">
              {t('recording_title', lang)}
            </h3>
            <p className="text-[11px] text-muted-foreground">
              {isRecording
                ? t('recording_active', lang)
                : t('recording_not_recording', lang)}
            </p>
          </div>
        </div>

        {/* Recording status badge */}
        <Badge
          className={cn(
            'text-[11px] font-medium px-2.5 py-0.5 border-0',
            isRecording
              ? 'bg-red-500/10 text-red-600 dark:text-red-400'
              : 'bg-muted/50 text-muted-foreground'
          )}
        >
          {isRecording ? (
            <>
              <span className="relative flex size-2 mr-1.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
                <span className="relative inline-flex rounded-full size-2 bg-red-500" />
              </span>
              {t('recording_active', lang)}
            </>
          ) : (
            <>
              <MicOff className="size-3 mr-1" />
              {t('recording_not_recording', lang)}
            </>
          )}
        </Badge>
      </div>

      {/* ── Recording timer ── */}
      {(isRecording || elapsed > 0) && (
        <div className="glass rounded-xl p-4 text-center space-y-1">
          <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground mb-1">
            <Clock className="size-3.5" />
            {t('recording_duration', lang)}
          </div>
          <p
            className={cn(
              'text-3xl font-mono font-bold tabular-nums',
              isRecording ? 'text-red-600 dark:text-red-400' : 'text-foreground'
            )}
          >
            {formatDuration(elapsed)}
          </p>
          {isRecording && (
            <div className="flex items-center justify-center gap-1 mt-2">
              {[0, 1, 2, 3, 4].map((i) => (
                <div
                  key={i}
                  className="w-1 bg-red-500 rounded-full animate-gentle-pulse"
                  style={{
                    height: `${8 + Math.random() * 16}px`,
                    animationDelay: `${i * 0.15}s`,
                  }}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── Consent section ── */}
      {!isRecording && (
        <div className="glass rounded-xl p-4 space-y-3">
          <div className="flex items-center gap-2 text-xs font-medium">
            <Shield className="size-4 text-amber-500" />
            {t('recording_consent', lang)}
          </div>

          <p className="text-[11px] text-muted-foreground leading-relaxed">
            {t('recording_consent_desc', lang)}
          </p>

          {/* Consent toggles */}
          <div className="space-y-2.5">
            {/* Guide consent */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs">
                <span className="size-2 rounded-full bg-amber-500" />
                <span>{lang === 'sw' ? 'Mwongozo' : 'Guide'}</span>
              </div>
              <div className="flex items-center gap-2">
                {guideConsent ? (
                  <Badge className="bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 border-0 text-[10px] px-2 py-0.5">
                    <CheckCircle2 className="size-3 mr-0.5" />
                    {t('recording_consent_granted', lang)}
                  </Badge>
                ) : (
                  <Badge variant="outline" className="text-[10px] px-2 py-0.5 text-muted-foreground">
                    {lang === 'sw' ? 'Inasubiri' : 'Pending'}
                  </Badge>
                )}
              </div>
            </div>

            {/* Seeker consent */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs">
                <span className="size-2 rounded-full bg-orange-500" />
                <span>{lang === 'sw' ? 'Mtafuta' : 'Seeker'}</span>
              </div>
              <div className="flex items-center gap-2">
                {seekerConsent ? (
                  <Badge className="bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 border-0 text-[10px] px-2 py-0.5">
                    <CheckCircle2 className="size-3 mr-0.5" />
                    {t('recording_consent_granted', lang)}
                  </Badge>
                ) : (
                  <Switch
                    checked={localConsent}
                    onCheckedChange={(checked) => {
                      if (checked) handleGrantConsent();
                    }}
                    className="data-[state=checked]:bg-amber-500"
                  />
                )}
              </div>
            </div>
          </div>

          {/* Consent required notice */}
          {!bothConsented && (
            <div className="flex items-center gap-1.5 text-[11px] text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 rounded-lg px-3 py-2">
              <AlertTriangle className="size-3.5 shrink-0" />
              {t('recording_consent_required', lang)}
            </div>
          )}
        </div>
      )}

      {/* ── Privacy notice ── */}
      <div className="flex items-start gap-2.5 text-[11px] text-muted-foreground bg-muted/30 rounded-lg p-3">
        <Lock className="size-3.5 shrink-0 mt-0.5 text-amber-500" />
        <div className="space-y-1">
          <p>{t('recording_privacy_notice', lang)}</p>
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1">
              <Shield className="size-3" />
              {t('recording_retention', lang)}
            </span>
            <span className="flex items-center gap-1">
              <Eye className="size-3" />
              {t('recording_dispute_only', lang)}
            </span>
          </div>
        </div>
      </div>

      {/* ── Action buttons ── */}
      {!isRecording ? (
        <Button
          className="w-full h-11 text-sm font-semibold glass-button"
          disabled={!canRecord}
          onClick={onStartRecording}
        >
          <Mic className="size-4 mr-1.5" />
          {t('recording_start', lang)}
        </Button>
      ) : (
        <Button
          variant="destructive"
          className="w-full h-11 text-sm font-semibold"
          onClick={onStopRecording}
        >
          <Square className="size-4 mr-1.5" />
          {t('recording_stop', lang)}
        </Button>
      )}
    </div>
  );
}

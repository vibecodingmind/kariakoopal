'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import {
  Clock,
  AlertTriangle,
  CheckCircle2,
  Timer,
  XCircle,
  Shield,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { t, type Language } from '@/lib/i18n';
import { useAuthStore } from '@/lib/stores/auth-store';
import { cn } from '@/lib/utils';

// ── Types ──

interface SmartTimeoutProps {
  sessionId: string;
  lastActivityTime: number; // Unix timestamp ms
  isActive: boolean;
  onStillHere: () => void;
  onAutoComplete: () => void;
  language?: 'sw' | 'en';
  className?: string;
}

// ── Constants ──

const INACTIVITY_THRESHOLD = 15 * 60 * 1000; // 15 minutes
const COUNTDOWN_DURATION = 60; // 60 seconds countdown

// ── Component ──

export function SmartTimeout({
  sessionId,
  lastActivityTime,
  isActive,
  onStillHere,
  onAutoComplete,
  language: languageProp,
  className,
}: SmartTimeoutProps) {
  const storeLanguage = useAuthStore((s) => s.language);
  const lang = languageProp || (storeLanguage as Language) || 'sw';

  const [showPrompt, setShowPrompt] = useState(false);
  const [countdown, setCountdown] = useState(COUNTDOWN_DURATION);
  const [dismissed, setDismissed] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Check inactivity
  useEffect(() => {
    if (!isActive || dismissed) return;

    const checkInactivity = () => {
      const elapsed = Date.now() - lastActivityTime;
      if (elapsed >= INACTIVITY_THRESHOLD) {
        setShowPrompt(true);
      }
    };

    const timer = setInterval(checkInactivity, 5000);
    checkInactivity();

    return () => clearInterval(timer);
  }, [lastActivityTime, isActive, dismissed]);

  // Countdown when prompt is shown
  useEffect(() => {
    if (!showPrompt) return;

    intervalRef.current = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          // Auto-complete
          if (intervalRef.current) clearInterval(intervalRef.current);
          onAutoComplete();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [showPrompt, onAutoComplete]);

  const handleStillHere = useCallback(() => {
    setShowPrompt(false);
    setCountdown(COUNTDOWN_DURATION);
    setDismissed(false);
    onStillHere();
  }, [onStillHere]);

  const handleDismiss = useCallback(() => {
    setShowPrompt(false);
    setDismissed(true);
    onAutoComplete();
  }, [onAutoComplete]);

  // Calculate time since last activity
  const timeSinceActivity = Date.now() - lastActivityTime;
  const minutesInactive = Math.floor(timeSinceActivity / 60000);
  const isInactive = timeSinceActivity >= INACTIVITY_THRESHOLD;

  // Progress circle for countdown
  const countdownProgress = countdown / COUNTDOWN_DURATION;
  const circumference = 2 * Math.PI * 40;
  const strokeDashoffset = circumference * (1 - countdownProgress);

  return (
    <div className={cn('glass-card gradient-border p-5 space-y-5', className)}>
      {/* ── Header ── */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div
            className={cn(
              'size-9 rounded-xl flex items-center justify-center shadow-lg',
              isInactive
                ? 'bg-gradient-to-br from-red-500 to-red-600 shadow-red-500/20'
                : 'bg-gradient-to-br from-amber-500 to-orange-500 shadow-amber-500/20'
            )}
          >
            <Timer className="size-4 text-white" />
          </div>
          <div>
            <h3 className="font-semibold text-sm gradient-text">
              {t('timeout_title', lang)}
            </h3>
            <p className="text-[11px] text-muted-foreground">
              {isActive
                ? t('timeout_session_active', lang)
                : t('timeout_inactive', lang)}
            </p>
          </div>
        </div>

        <Badge
          className={cn(
            'text-[11px] font-medium px-2.5 py-0.5 border-0',
            isInactive
              ? 'bg-red-500/10 text-red-600 dark:text-red-400'
              : 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
          )}
        >
          {isInactive ? (
            <>
              <AlertTriangle className="size-3 mr-1" />
              {t('timeout_inactive', lang)}
            </>
          ) : (
            <>
              <CheckCircle2 className="size-3 mr-1" />
              {t('active', lang)}
            </>
          )}
        </Badge>
      </div>

      {/* ── Inactivity info ── */}
      {!showPrompt && (
        <div className="glass rounded-xl p-4 space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground">{t('timeout_inactive', lang)}</span>
            <span
              className={cn(
                'font-semibold',
                minutesInactive >= 10 ? 'text-red-600 dark:text-red-400' : 'text-foreground'
              )}
            >
              {minutesInactive} {lang === 'sw' ? 'dakika' : 'min'}
            </span>
          </div>
          {/* Progress bar showing time to threshold */}
          <div className="h-2 rounded-full bg-muted/30 overflow-hidden">
            <div
              className={cn(
                'h-full rounded-full transition-all duration-1000',
                minutesInactive >= 12
                  ? 'bg-red-500'
                  : minutesInactive >= 8
                  ? 'bg-amber-500'
                  : 'bg-emerald-500'
              )}
              style={{
                width: `${Math.min(100, (minutesInactive / 15) * 100)}%`,
              }}
            />
          </div>
          <p className="text-[10px] text-muted-foreground">
            {lang === 'sw'
              ? 'Kikao kitaulizwa baada ya dakika 15 za kutotumika'
              : 'Session will prompt after 15 minutes of inactivity'}
          </p>
        </div>
      )}

      {/* ── Prompt dialog ── */}
      {showPrompt && (
        <div className="glass-strong rounded-xl p-5 space-y-4 border border-amber-300 dark:border-amber-700">
          {/* Countdown circle */}
          <div className="flex justify-center">
            <div className="relative size-24">
              <svg className="size-24 -rotate-90" viewBox="0 0 100 100">
                <circle
                  cx="50"
                  cy="50"
                  r="40"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="4"
                  className="text-muted/30"
                />
                <circle
                  cx="50"
                  cy="50"
                  r="40"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="4"
                  strokeLinecap="round"
                  className={cn(
                    countdown <= 15
                      ? 'text-red-500'
                      : 'text-amber-500'
                  )}
                  strokeDasharray={circumference}
                  strokeDashoffset={strokeDashoffset}
                  style={{ transition: 'stroke-dashoffset 1s linear' }}
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span
                  className={cn(
                    'text-2xl font-bold tabular-nums',
                    countdown <= 15
                      ? 'text-red-600 dark:text-red-400'
                      : 'text-foreground'
                  )}
                >
                  {countdown}
                </span>
                <span className="text-[9px] text-muted-foreground">
                  {t('timeout_seconds', lang)}
                </span>
              </div>
            </div>
          </div>

          {/* Question */}
          <div className="text-center space-y-1.5">
            <p className="text-base font-bold">{t('timeout_question', lang)}</p>
            <p className="text-xs text-muted-foreground">
              {t('timeout_warning', lang)} {countdown} {t('timeout_seconds', lang)}
            </p>
          </div>

          {/* Action buttons */}
          <div className="flex gap-2">
            <Button
              className="flex-1 h-11 text-sm font-semibold glass-button"
              onClick={handleStillHere}
            >
              <CheckCircle2 className="size-4 mr-1.5" />
              {t('timeout_still_here', lang)}
            </Button>
            <Button
              variant="outline"
              className="flex-1 h-11 text-sm font-medium border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20"
              onClick={handleDismiss}
            >
              <XCircle className="size-4 mr-1.5" />
              {t('timeout_auto_complete', lang)}
            </Button>
          </div>
        </div>
      )}

      {/* ── Privacy note ── */}
      <div className="flex items-center gap-2 text-[11px] text-muted-foreground bg-muted/30 rounded-lg px-3 py-2">
        <Shield className="size-3.5 text-amber-500 shrink-0" />
        {t('timeout_auto_complete', lang)}
      </div>
    </div>
  );
}

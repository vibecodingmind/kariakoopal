'use client';

import { useState, useCallback } from 'react';
import {
  Phone,
  WifiOff,
  Signal,
  ChevronRight,
  CheckCircle2,
  AlertCircle,
  Shield,
  Keyboard,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { t, type Language } from '@/lib/i18n';
import { useAuthStore } from '@/lib/stores/auth-store';
import { cn } from '@/lib/utils';

// ── Types ──

interface USSDOfflineModeProps {
  ussdCode: string;
  onToggleOffline: (isOffline: boolean) => void;
  language?: 'sw' | 'en';
  className?: string;
}

// ── Component ──

export function USSDOfflineMode({
  ussdCode,
  onToggleOffline,
  language: languageProp,
  className,
}: USSDOfflineModeProps) {
  const storeLanguage = useAuthStore((s) => s.language);
  const lang = languageProp || (storeLanguage as Language) || 'sw';

  const [isOffline, setIsOffline] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);

  const handleToggle = useCallback(
    (checked: boolean) => {
      setIsOffline(checked);
      onToggleOffline(checked);
    },
    [onToggleOffline]
  );

  const handleCopyCode = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(ussdCode);
      setCopiedCode(true);
      setTimeout(() => setCopiedCode(false), 2000);
    } catch {
      // fallback
    }
  }, [ussdCode]);

  return (
    <div className={cn('glass-card gradient-border p-5 space-y-5', className)}>
      {/* ── Header ── */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="size-9 rounded-xl bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center shadow-lg shadow-amber-500/20">
            <WifiOff className="size-4 text-white" />
          </div>
          <div>
            <h3 className="font-semibold text-sm gradient-text">
              {lang === 'sw' ? 'Hali ya Nje ya Mtandao' : 'Offline Mode'}
            </h3>
            <p className="text-[11px] text-muted-foreground">
              USSD {lang === 'sw' ? 'mbadala' : 'fallback'}
            </p>
          </div>
        </div>

        {/* Offline toggle */}
        <div className="flex items-center gap-2">
          <span className="text-[11px] text-muted-foreground">
            {isOffline
              ? t('offline', lang)
              : t('online', lang)}
          </span>
          <Switch
            checked={isOffline}
            onCheckedChange={handleToggle}
            className="data-[state=checked]:bg-amber-500"
          />
        </div>
      </div>

      {/* ── Status indicator ── */}
      <div
        className={cn(
          'flex items-center gap-3 rounded-xl border px-4 py-3',
          isOffline
            ? 'bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800'
            : 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800'
        )}
      >
        <div
          className={cn(
            'size-8 rounded-full flex items-center justify-center shrink-0',
            isOffline ? 'bg-amber-500/20' : 'bg-emerald-500/20'
          )}
        >
          {isOffline ? (
            <WifiOff className="size-4 text-amber-600 dark:text-amber-400" />
          ) : (
            <Signal className="size-4 text-emerald-600 dark:text-emerald-400" />
          )}
        </div>
        <div className="flex-1">
          <p
            className={cn(
              'text-sm font-semibold',
              isOffline
                ? 'text-amber-700 dark:text-amber-400'
                : 'text-emerald-700 dark:text-emerald-400'
            )}
          >
            {isOffline
              ? lang === 'sw'
                ? 'Uko nje ya mtandao'
                : 'You are offline'
              : lang === 'sw'
              ? 'Uko mtandaoni'
              : 'You are online'}
          </p>
          <p className="text-[11px] text-muted-foreground">
            {isOffline
              ? lang === 'sw'
                ? 'Tumia USSD kuendelea'
                : 'Use USSD to continue'
              : lang === 'sw'
              ? 'Muunganisho unafanya kazi'
              : 'Connection is active'}
          </p>
        </div>
      </div>

      {/* ── USSD Code card ── */}
      <div className="glass rounded-xl p-4 space-y-3">
        <p className="text-[11px] font-medium text-muted-foreground flex items-center gap-1">
          <Phone className="size-3 text-amber-500" />
          {lang === 'sw' ? 'Kodi ya USSD' : 'USSD Code'}
        </p>

        {/* Code display */}
        <div className="flex items-center gap-3 bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 rounded-xl px-5 py-4 border border-amber-200 dark:border-amber-800">
          <Phone className="size-5 text-amber-600 dark:text-amber-400 shrink-0" />
          <p className="text-2xl font-mono font-bold tracking-wider gradient-text">
            {ussdCode}
          </p>
        </div>

        {/* Copy button */}
        <Button
          variant="outline"
          size="sm"
          className="w-full h-9 text-xs font-medium border-amber-200 dark:border-amber-800 text-amber-700 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-900/20"
          onClick={handleCopyCode}
        >
          {copiedCode ? (
            <>
              <CheckCircle2 className="size-3.5 mr-1 text-emerald-500" />
              {t('copied', lang)}
            </>
          ) : (
            <>
              {t('copy', lang)} {lang === 'sw' ? 'kodi' : 'code'}
            </>
          )}
        </Button>

        {/* Instructions */}
        <div className="space-y-2">
          <p className="text-[11px] font-medium text-muted-foreground">
            {lang === 'sw' ? 'Maelekezo' : 'Instructions'}:
          </p>
          <div className="space-y-1.5">
            {[
              lang === 'sw'
                ? 'Fungua simu yako ya mkononi'
                : 'Open your mobile phone',
              lang === 'sw'
                ? 'Bonyeza kodi ya USSD kwenye kibodi ya simu'
                : 'Dial the USSD code on your phone keypad',
              lang === 'sw'
                ? 'Fuatilia maagizo kwenye skrini ya simu'
                : 'Follow the instructions on your phone screen',
              lang === 'sw'
                ? 'Kubali au kataa maombi ya mwongozo'
                : 'Accept or reject guide requests',
            ].map((step, idx) => (
              <div
                key={idx}
                className="flex items-start gap-2 text-[11px] text-muted-foreground"
              >
                <div className="size-4 rounded-full bg-amber-500/20 flex items-center justify-center shrink-0 mt-0.5">
                  <span className="text-[9px] font-bold text-amber-600 dark:text-amber-400">
                    {idx + 1}
                  </span>
                </div>
                {step}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Feature phone compatibility ── */}
      <div className="glass rounded-xl p-3 space-y-2">
        <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
          <Keyboard className="size-3.5 text-amber-500" />
          {lang === 'sw' ? 'Sawa na simu za kawaida' : 'Feature phone compatible'}
        </div>
        <div className="flex flex-wrap gap-1.5">
          {['Nokia', 'Samsung', 'Tecno', 'Itel', 'Infinix'].map((brand) => (
            <Badge
              key={brand}
              variant="outline"
              className="text-[10px] px-2 py-0.5 text-muted-foreground"
            >
              {brand}
            </Badge>
          ))}
        </div>
      </div>

      {/* ── Privacy notice ── */}
      <div className="flex items-start gap-2 text-[11px] text-muted-foreground bg-muted/30 rounded-lg px-3 py-2">
        <Shield className="size-3.5 shrink-0 mt-0.5 text-amber-500" />
        <span>
          {lang === 'sw'
            ? 'USSD hauhitaji mtandao wa data. Vikao vyako vinaendelea salama.'
            : 'USSD works without data. Your sessions continue safely.'}
        </span>
      </div>
    </div>
  );
}

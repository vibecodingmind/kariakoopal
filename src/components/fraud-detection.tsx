'use client';

import { useState, useCallback, useMemo } from 'react';
import {
  ShieldAlert,
  AlertTriangle,
  Eye,
  XCircle,
  User,
  Store,
  MapPin,
  TrendingUp,
  Search,
  Ban,
  BarChart3,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { t, type Language } from '@/lib/i18n';
import { useAuthStore } from '@/lib/stores/auth-store';
import { cn } from '@/lib/utils';

// ── Types ──

interface FraudAlert {
  id: string;
  entityType: 'guide' | 'seeker' | 'vendor';
  entityName: string;
  alertType: 'fast' | 'disputer' | 'spike' | 'rating';
  confidence: number; // 0-100
  timestamp: string;
  details?: string;
}

interface FraudDetectionProps {
  alerts: FraudAlert[];
  onInvestigate: (alertId: string) => void;
  onDismiss: (alertId: string) => void;
  language?: 'sw' | 'en';
  className?: string;
}

// ── Alert type config ──

const alertTypeConfig = {
  fast: {
    icon: Clock,
    color: 'text-amber-600 dark:text-amber-400',
    bg: 'bg-amber-50 dark:bg-amber-900/20',
    border: 'border-amber-200 dark:border-amber-800',
    labelKey: 'fraud_type_fast',
  },
  disputer: {
    icon: AlertTriangle,
    color: 'text-red-600 dark:text-red-400',
    bg: 'bg-red-50 dark:bg-red-900/20',
    border: 'border-red-200 dark:border-red-800',
    labelKey: 'fraud_type_disputer',
  },
  spike: {
    icon: TrendingUp,
    color: 'text-violet-600 dark:text-violet-400',
    bg: 'bg-violet-50 dark:bg-violet-900/20',
    border: 'border-violet-200 dark:border-violet-800',
    labelKey: 'fraud_type_spike',
  },
  rating: {
    icon: ShieldAlert,
    color: 'text-sky-600 dark:text-sky-400',
    bg: 'bg-sky-50 dark:bg-sky-900/20',
    border: 'border-sky-200 dark:border-sky-800',
    labelKey: 'fraud_type_rating',
  },
} as const;

const entityConfig = {
  guide: { icon: User, labelKey: 'fraud_entity_guide' },
  seeker: { icon: MapPin, labelKey: 'fraud_entity_seeker' },
  vendor: { icon: Store, labelKey: 'fraud_entity_vendor' },
} as const;

function Clock(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <circle cx="12" cy="12" r="10" />
      <polyline points="12 6 12 12 16 14" />
    </svg>
  );
}

// ── Helpers ──

function getConfidenceColor(confidence: number): string {
  if (confidence >= 80) return 'text-red-600 dark:text-red-400';
  if (confidence >= 60) return 'text-amber-600 dark:text-amber-400';
  return 'text-emerald-600 dark:text-emerald-400';
}

function getConfidenceBg(confidence: number): string {
  if (confidence >= 80) return 'bg-red-500';
  if (confidence >= 60) return 'bg-amber-500';
  return 'bg-emerald-500';
}

// ── Component ──

export function FraudDetection({
  alerts,
  onInvestigate,
  onDismiss,
  language: languageProp,
  className,
}: FraudDetectionProps) {
  const storeLanguage = useAuthStore((s) => s.language);
  const lang = languageProp || (storeLanguage as Language) || 'sw';

  const [dismissedIds, setDismissedIds] = useState<Set<string>>(new Set());

  // Summary stats
  const summary = useMemo(() => {
    const total = alerts.length;
    const highConfidence = alerts.filter((a) => a.confidence >= 80).length;
    const pendingReview = alerts.filter((a) => !dismissedIds.has(a.id)).length;
    return { total, highConfidence, pendingReview };
  }, [alerts, dismissedIds]);

  const handleInvestigate = useCallback(
    (alertId: string) => {
      onInvestigate(alertId);
    },
    [onInvestigate]
  );

  const handleDismiss = useCallback(
    (alertId: string) => {
      setDismissedIds((prev) => new Set(prev).add(alertId));
      onDismiss(alertId);
    },
    [onDismiss]
  );

  const activeAlerts = alerts.filter((a) => !dismissedIds.has(a.id));

  return (
    <div className={cn('glass-card gradient-border p-5 space-y-5', className)}>
      {/* ── Header ── */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="size-9 rounded-xl bg-gradient-to-br from-red-500 to-red-600 flex items-center justify-center shadow-lg shadow-red-500/20">
            <ShieldAlert className="size-4 text-white" />
          </div>
          <div>
            <h3 className="font-semibold text-sm gradient-text">
              {t('fraud_title', lang)}
            </h3>
            <p className="text-[11px] text-muted-foreground">
              {t('fraud_alerts', lang)}
            </p>
          </div>
        </div>
        <Badge
          className={cn(
            'text-[11px] font-medium px-2.5 py-0.5 border-0',
            summary.highConfidence > 0
              ? 'bg-red-500/10 text-red-600 dark:text-red-400'
              : 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
          )}
        >
          {summary.pendingReview} {t('fraud_pending_review', lang)}
        </Badge>
      </div>

      {/* ── Summary stats ── */}
      <div className="grid grid-cols-3 gap-2.5">
        <div className="glass rounded-xl p-3 text-center space-y-1">
          <BarChart3 className="size-4 text-muted-foreground mx-auto" />
          <p className="text-lg font-bold">{summary.total}</p>
          <p className="text-[10px] text-muted-foreground">{t('fraud_total_alerts', lang)}</p>
        </div>
        <div className="glass rounded-xl p-3 text-center space-y-1">
          <AlertTriangle className="size-4 text-red-500 mx-auto" />
          <p className="text-lg font-bold text-red-600 dark:text-red-400">{summary.highConfidence}</p>
          <p className="text-[10px] text-muted-foreground">{t('fraud_high_confidence', lang)}</p>
        </div>
        <div className="glass rounded-xl p-3 text-center space-y-1">
          <Eye className="size-4 text-amber-500 mx-auto" />
          <p className="text-lg font-bold text-amber-600 dark:text-amber-400">{summary.pendingReview}</p>
          <p className="text-[10px] text-muted-foreground">{t('fraud_pending_review', lang)}</p>
        </div>
      </div>

      {/* ── Alert cards ── */}
      {activeAlerts.length === 0 ? (
        <div className="flex flex-col items-center gap-2 py-6 text-center">
          <ShieldAlert className="size-8 text-muted-foreground/40" />
          <p className="text-sm text-muted-foreground">
            {t('fraud_no_alerts', lang)}
          </p>
        </div>
      ) : (
        <div className="space-y-2.5 max-h-80 overflow-y-auto pr-1">
          {activeAlerts.map((alert) => {
            const typeConfig = alertTypeConfig[alert.alertType];
            const TypeIcon = typeConfig.icon;
            const entConfig = entityConfig[alert.entityType];
            const EntityIcon = entConfig.icon;

            return (
              <div
                key={alert.id}
                className={cn(
                  'glass rounded-xl p-4 space-y-3 transition-all duration-300 border',
                  typeConfig.border
                )}
              >
                {/* Top row: entity + type + confidence */}
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-start gap-2.5 flex-1 min-w-0">
                    {/* Entity avatar */}
                    <div
                      className={cn(
                        'size-8 rounded-lg flex items-center justify-center shrink-0',
                        typeConfig.bg
                      )}
                    >
                      <EntityIcon className={cn('size-4', typeConfig.color)} />
                    </div>

                    <div className="min-w-0">
                      <p className="text-sm font-bold truncate">{alert.entityName}</p>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <Badge
                          variant="outline"
                          className={cn(
                            'text-[9px] px-1.5 py-0',
                            typeConfig.color,
                            typeConfig.border
                          )}
                        >
                          <TypeIcon className="size-2.5 mr-0.5" />
                          {t(typeConfig.labelKey, lang)}
                        </Badge>
                        <Badge
                          variant="outline"
                          className="text-[9px] px-1.5 py-0 text-muted-foreground"
                        >
                          <EntityIcon className="size-2.5 mr-0.5" />
                          {t(entConfig.labelKey, lang)}
                        </Badge>
                      </div>
                    </div>
                  </div>

                  {/* Confidence score */}
                  <div className="text-right shrink-0">
                    <p className="text-[10px] text-muted-foreground">{t('fraud_confidence', lang)}</p>
                    <p className={cn('text-lg font-bold', getConfidenceColor(alert.confidence))}>
                      {alert.confidence}%
                    </p>
                  </div>
                </div>

                {/* Confidence bar */}
                <div className="h-1.5 rounded-full bg-muted/30 overflow-hidden">
                  <div
                    className={cn(
                      'h-full rounded-full transition-all duration-700',
                      getConfidenceBg(alert.confidence)
                    )}
                    style={{ width: `${alert.confidence}%` }}
                  />
                </div>

                {/* Details */}
                {alert.details && (
                  <p className="text-[11px] text-muted-foreground leading-relaxed">
                    {alert.details}
                  </p>
                )}

                {/* Timestamp */}
                <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
                  <Clock className="size-3" />
                  {t('fraud_timestamp', lang)}: {alert.timestamp}
                </div>

                {/* Action buttons */}
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    className="flex-1 h-8 text-[11px] font-semibold glass-button"
                    onClick={() => handleInvestigate(alert.id)}
                  >
                    <Search className="size-3.5 mr-1" />
                    {t('fraud_investigate', lang)}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1 h-8 text-[11px] font-medium border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20"
                    onClick={() => handleDismiss(alert.id)}
                  >
                    <XCircle className="size-3.5 mr-1" />
                    {t('fraud_dismiss', lang)}
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

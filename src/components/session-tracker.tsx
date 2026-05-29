'use client';

import { Clock, CheckCircle2, AlertTriangle, Shield, ChevronDown, ChevronUp, Copy } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { t, type Language } from '@/lib/i18n';
import { useAuthStore } from '@/lib/stores/auth-store';
import { cn } from '@/lib/utils';
import { useState, useEffect, useCallback } from 'react';

interface ChecklistItem {
  id: string;
  text: string;
  completed: boolean;
}

interface SessionTrackerProps {
  sessionCode: string;
  startedAt: string | null;
  escrowStatus: 'pending' | 'held' | 'released' | 'refunded' | 'disputed';
  seekerConfirmed: boolean;
  guideConfirmed: boolean;
  checklist?: ChecklistItem[];
  onMarkComplete?: () => void;
  onEmergency?: () => void;
  onToggleChecklist?: (itemId: string) => void;
  onAddChecklistItem?: (text: string) => void;
  className?: string;
}

export function SessionTracker({
  sessionCode,
  startedAt,
  escrowStatus,
  seekerConfirmed,
  guideConfirmed,
  checklist = [],
  onMarkComplete,
  onEmergency,
  onToggleChecklist,
  onAddChecklistItem,
  className,
}: SessionTrackerProps) {
  const language = useAuthStore((s) => s.language) as Language;
  const [elapsed, setElapsed] = useState(() => {
    if (!startedAt) return '00:00:00';
    const start = new Date(startedAt).getTime();
    const diff = Math.max(0, Date.now() - start);
    const hrs = Math.floor(diff / 3600000);
    const mins = Math.floor((diff % 3600000) / 60000);
    const secs = Math.floor((diff % 60000) / 1000);
    return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  });
  const [showChecklist, setShowChecklist] = useState(true);
  const [newItemText, setNewItemText] = useState('');
  const [copied, setCopied] = useState(false);

  // Timer
  const updateElapsed = useCallback(() => {
    if (!startedAt) {
      setElapsed('00:00:00');
      return;
    }
    const start = new Date(startedAt).getTime();
    const now = Date.now();
    const diff = Math.max(0, now - start);
    const hrs = Math.floor(diff / 3600000);
    const mins = Math.floor((diff % 3600000) / 60000);
    const secs = Math.floor((diff % 60000) / 1000);
    setElapsed(
      `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
    );
  }, [startedAt]);

  useEffect(() => {
    // Initial sync is done by the interval's first tick after ~1s
    // We compute elapsed directly for immediate display
    const interval = setInterval(updateElapsed, 1000);
    return () => clearInterval(interval);
  }, [updateElapsed]);

  const handleCopyCode = async () => {
    try {
      await navigator.clipboard.writeText(sessionCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback - ignore
    }
  };

  const handleAddItem = () => {
    const trimmed = newItemText.trim();
    if (!trimmed || !onAddChecklistItem) return;
    onAddChecklistItem(trimmed);
    setNewItemText('');
  };

  const escrowConfig: Record<string, { color: string; icon: React.ElementType }> = {
    pending: { color: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300', icon: Clock },
    held: { color: 'bg-sky-100 text-sky-700 dark:bg-sky-900/40 dark:text-sky-300', icon: Shield },
    released: { color: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300', icon: CheckCircle2 },
    refunded: { color: 'bg-gray-100 text-gray-700 dark:bg-gray-900/40 dark:text-gray-300', icon: CheckCircle2 },
    disputed: { color: 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300', icon: AlertTriangle },
  };

  const escrow = escrowConfig[escrowStatus] || escrowConfig.pending;
  const EscrowIcon = escrow.icon;

  return (
    <Card className={cn('overflow-hidden', className)}>
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <Clock className="size-4 text-primary" />
          {t('active_session_g', language)}
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-4 px-4 pb-4">
        {/* Timer */}
        <div className="text-center">
          <p className="text-3xl font-mono font-bold text-foreground tracking-wider">{elapsed}</p>
          <p className="text-xs text-muted-foreground mt-1">{t('session_timer', language)}</p>
        </div>

        {/* Session code */}
        <div className="flex items-center justify-center gap-2">
          <div className="bg-muted rounded-lg px-4 py-3 text-center">
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider">{t('session_code', language)}</p>
            <p className="text-2xl font-mono font-bold text-foreground tracking-widest">{sessionCode}</p>
          </div>
          <Button
            variant="outline"
            size="icon"
            className="size-10 shrink-0"
            onClick={handleCopyCode}
            aria-label={t('copy', language)}
          >
            <Copy className="size-4" />
          </Button>
        </div>

        {copied && (
          <p className="text-center text-xs text-emerald-600 dark:text-emerald-400">{t('copied', language)}</p>
        )}

        {/* Escrow status */}
        <div className={cn('flex items-center gap-2 rounded-lg px-3 py-2', escrow.color)}>
          <EscrowIcon className="size-4" />
          <span className="text-sm font-medium">
            {escrowStatus === 'held' && t('escrow_held', language)}
            {escrowStatus === 'released' && t('escrow_released', language)}
            {escrowStatus === 'pending' && t('pending', language)}
            {escrowStatus === 'refunded' && (language === 'sw' ? 'Pesa zimerudishwa' : 'Refunded')}
            {escrowStatus === 'disputed' && t('dispute_raised', language)}
          </span>
        </div>

        {/* Confirmation indicators */}
        <div className="flex gap-2">
          <div className={cn(
            'flex-1 flex items-center justify-center gap-1.5 rounded-lg border p-2 text-xs font-medium',
            seekerConfirmed
              ? 'bg-emerald-50 border-emerald-200 text-emerald-700 dark:bg-emerald-900/30 dark:border-emerald-800 dark:text-emerald-300'
              : 'bg-muted border-muted text-muted-foreground'
          )}>
            <CheckCircle2 className="size-3.5" />
            {language === 'sw' ? 'Muombaji' : 'Seeker'}
          </div>
          <div className={cn(
            'flex-1 flex items-center justify-center gap-1.5 rounded-lg border p-2 text-xs font-medium',
            guideConfirmed
              ? 'bg-emerald-50 border-emerald-200 text-emerald-700 dark:bg-emerald-900/30 dark:border-emerald-800 dark:text-emerald-300'
              : 'bg-muted border-muted text-muted-foreground'
          )}>
            <CheckCircle2 className="size-3.5" />
            {language === 'sw' ? 'Mwongozo' : 'Guide'}
          </div>
        </div>

        {/* Checklist */}
        <div>
          <button
            className="flex items-center gap-1 text-sm font-medium text-foreground w-full"
            onClick={() => setShowChecklist(!showChecklist)}
          >
            {t('session_checklist', language)}
            {showChecklist ? <ChevronUp className="size-4" /> : <ChevronDown className="size-4" />}
          </button>

          {showChecklist && (
            <div className="mt-2 space-y-1.5">
              {checklist.map((item) => (
                <button
                  key={item.id}
                  className={cn(
                    'flex items-center gap-2 w-full text-left rounded-md px-2 py-1.5 text-sm transition-colors',
                    'hover:bg-muted/50',
                    item.completed && 'line-through text-muted-foreground'
                  )}
                  onClick={() => onToggleChecklist?.(item.id)}
                >
                  <div className={cn(
                    'size-4 rounded border flex items-center justify-center shrink-0',
                    item.completed
                      ? 'bg-primary border-primary text-primary-foreground'
                      : 'border-muted-foreground/30'
                  )}>
                    {item.completed && <CheckCircle2 className="size-3" />}
                  </div>
                  {item.text}
                </button>
              ))}

              {/* Add item */}
              {onAddChecklistItem && (
                <div className="flex gap-1.5 mt-2">
                  <input
                    value={newItemText}
                    onChange={(e) => setNewItemText(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleAddItem()}
                    placeholder={language === 'sw' ? 'Ongeza kitu...' : 'Add item...'}
                    className="flex-1 h-8 text-sm bg-transparent border-b border-muted-foreground/30 focus:border-primary outline-none px-1"
                  />
                  <Button variant="ghost" size="sm" onClick={handleAddItem} disabled={!newItemText.trim()}>
                    +
                  </Button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Action buttons */}
        <div className="flex flex-col gap-2 pt-2">
          <Button
            className="w-full h-11"
            onClick={onMarkComplete}
          >
            <CheckCircle2 className="size-4 mr-1" />
            {t('mark_complete', language)}
          </Button>

          <Button
            variant="destructive"
            className="w-full h-11"
            onClick={onEmergency}
          >
            <AlertTriangle className="size-4 mr-1" />
            {t('emergency_button', language)}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

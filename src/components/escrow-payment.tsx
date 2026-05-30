'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  Shield,
  CheckCircle2,
  AlertTriangle,
  Clock,
  CreditCard,
  Loader2,
  ArrowRight,
  ArrowLeft,
  Copy,
  Receipt,
  HandCoins,
  MessageSquareWarning,
  Lock,
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { t, type Language } from '@/lib/i18n';
import { useAuthStore } from '@/lib/stores/auth-store';
import { cn } from '@/lib/utils';

// ── Types ──

type PaymentStep = 'method' | 'confirm' | 'processing' | 'success';
type MobileProvider = 'mpesa' | 'tigo_pesa' | 'airtel_money' | 'halotel';

interface EscrowPaymentProps {
  amount: number;
  platformFee: number;
  escrowStatus: 'pending' | 'held' | 'released' | 'refunded' | 'disputed';
  onPaymentComplete?: () => void;
  onReleaseEscrow?: () => void;
  onRefundEscrow?: () => void;
  onDisputeEscrow?: (reason: string) => void;
  isGuide?: boolean;
  language?: 'sw' | 'en';
}

// ── Provider config ──

const mobileProviders: {
  id: MobileProvider;
  key: string;
  color: string;
  letter: string;
}[] = [
  { id: 'mpesa', key: 'mpesa', color: 'bg-green-600', letter: 'M' },
  { id: 'tigo_pesa', key: 'tigo_pesa', color: 'bg-blue-500', letter: 'T' },
  { id: 'airtel_money', key: 'airtel_money', color: 'bg-red-600', letter: 'A' },
  { id: 'halotel', key: 'halotel', color: 'bg-purple-600', letter: 'H' },
];

// ── Helper ──

function formatTZS(n: number): string {
  return n.toLocaleString('en-TZ');
}

function generateTxId(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let id = 'FW-';
  for (let i = 0; i < 12; i++) {
    if (i === 4 || i === 8) id += '-';
    id += chars[Math.floor(Math.random() * chars.length)];
  }
  return id;
}

// ── Component ──

export function EscrowPayment({
  amount,
  platformFee,
  escrowStatus,
  onPaymentComplete,
  onReleaseEscrow,
  onRefundEscrow,
  onDisputeEscrow,
  isGuide = false,
  language: languageProp,
}: EscrowPaymentProps) {
  const storeLanguage = useAuthStore((s) => s.language);
  const lang = languageProp || (storeLanguage as Language) || 'sw';

  // Payment flow state
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState<PaymentStep>('method');
  const [selectedProvider, setSelectedProvider] = useState<MobileProvider | ''>('');
  const [processingProgress, setProcessingProgress] = useState(0);
  const [transactionId, setTransactionId] = useState('');
  const [copied, setCopied] = useState(false);

  // Dispute state
  const [showDispute, setShowDispute] = useState(false);
  const [disputeReason, setDisputeReason] = useState('');

  // Guide fee = total - platform fee
  const guideFee = amount - platformFee;

  // ── Processing simulation ──
  useEffect(() => {
    if (step !== 'processing') return;

    const interval = setInterval(() => {
      setProcessingProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          return 100;
        }
        return prev + 2;
      });
    }, 60);

    return () => clearInterval(interval);
  }, [step]);

  // When progress hits 100, advance to success
  useEffect(() => {
    if (step === 'processing' && processingProgress >= 100) {
      const timeout = setTimeout(() => {
        setTransactionId(generateTxId());
        setStep('success');
        onPaymentComplete?.();
      }, 400);
      return () => clearTimeout(timeout);
    }
  }, [step, processingProgress, onPaymentComplete]);

  // ── Handlers ──

  const handleProviderSelect = useCallback((value: string) => {
    setSelectedProvider(value as MobileProvider);
  }, []);

  const handleProceedToConfirm = useCallback(() => {
    if (!selectedProvider) return;
    setStep('confirm');
  }, [selectedProvider]);

  const handleConfirmPayment = useCallback(() => {
    setProcessingProgress(0);
    setStep('processing');
  }, []);

  const handleOpenDialog = useCallback(() => {
    // If escrow already held/released/refunded/disputed, show the status view
    if (escrowStatus !== 'pending') {
      setOpen(true);
      return;
    }
    setStep('method');
    setSelectedProvider('');
    setProcessingProgress(0);
    setTransactionId('');
    setOpen(true);
  }, [escrowStatus]);

  const handleCloseDialog = useCallback(() => {
    setOpen(false);
    // Reset state after dialog closes
    setTimeout(() => {
      if (escrowStatus === 'pending') {
        setStep('method');
        setSelectedProvider('');
        setProcessingProgress(0);
      }
    }, 300);
  }, [escrowStatus]);

  const handleCopyTxId = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(transactionId);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback
    }
  }, [transactionId]);

  const handleSubmitDispute = useCallback(() => {
    if (!disputeReason.trim()) return;
    onDisputeEscrow?.(disputeReason.trim());
    setShowDispute(false);
    setDisputeReason('');
  }, [disputeReason, onDisputeEscrow]);

  // ── Escrow status config ──
  const escrowStatusConfig: Record<
    string,
    { color: string; bg: string; icon: React.ElementType; labelKey: string }
  > = {
    pending: {
      color: 'text-amber-700 dark:text-amber-300',
      bg: 'bg-amber-50 dark:bg-amber-900/30 border-amber-200 dark:border-amber-800',
      icon: Clock,
      labelKey: 'pending',
    },
    held: {
      color: 'text-sky-700 dark:text-sky-300',
      bg: 'bg-sky-50 dark:bg-sky-900/30 border-sky-200 dark:border-sky-800',
      icon: Shield,
      labelKey: 'escrow_held',
    },
    released: {
      color: 'text-emerald-700 dark:text-emerald-300',
      bg: 'bg-emerald-50 dark:bg-emerald-900/30 border-emerald-200 dark:border-emerald-800',
      icon: CheckCircle2,
      labelKey: 'escrow_released',
    },
    refunded: {
      color: 'text-gray-700 dark:text-gray-300',
      bg: 'bg-gray-50 dark:bg-gray-900/30 border-gray-200 dark:border-gray-800',
      icon: HandCoins,
      labelKey: 'escrow_refunded',
    },
    disputed: {
      color: 'text-red-700 dark:text-red-300',
      bg: 'bg-red-50 dark:bg-red-900/30 border-red-200 dark:border-red-800',
      icon: AlertTriangle,
      labelKey: 'dispute_raised',
    },
  };

  const statusConfig = escrowStatusConfig[escrowStatus] || escrowStatusConfig.pending;
  const StatusIcon = statusConfig.icon;

  // ── Provider info for confirm step ──
  const providerInfo = mobileProviders.find((p) => p.id === selectedProvider);

  // ── Render: Payment flow steps ──

  const renderMethodStep = () => (
    <div className="space-y-4">
      <div className="text-center mb-2">
        <div className="inline-flex items-center gap-1.5 text-xs font-medium text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/30 px-3 py-1 rounded-full mb-3">
          <Lock className="size-3" />
          {t('escrow_payment_protected', lang)}
        </div>
        <p className="text-sm text-muted-foreground">
          {t('escrow_select_method', lang)}
        </p>
      </div>

      <RadioGroup
        value={selectedProvider}
        onValueChange={handleProviderSelect}
        className="gap-2"
      >
        {mobileProviders.map((provider) => (
          <Label
            key={provider.id}
            htmlFor={provider.id}
            className={cn(
              'flex items-center gap-3 rounded-xl border p-3.5 cursor-pointer transition-all duration-200',
              'hover:border-amber-300 hover:bg-amber-50/50 dark:hover:bg-amber-900/10',
              selectedProvider === provider.id
                ? 'border-amber-400 bg-amber-50 dark:bg-amber-900/20 ring-1 ring-amber-400/50'
                : 'border-border'
            )}
          >
            <RadioGroupItem value={provider.id} id={provider.id} />
            <div
              className={cn(
                'size-9 rounded-full flex items-center justify-center text-white font-bold text-sm shrink-0',
                provider.color
              )}
            >
              {provider.letter}
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium">{t(provider.key, lang)}</p>
              <p className="text-xs text-muted-foreground">
                {lang === 'sw' ? 'Pesa ya simu' : 'Mobile Money'}
              </p>
            </div>
            {selectedProvider === provider.id && (
              <CheckCircle2 className="size-5 text-amber-600 dark:text-amber-400 shrink-0" />
            )}
          </Label>
        ))}
      </RadioGroup>

      <Button
        className="w-full h-12 text-base font-semibold bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white shadow-lg shadow-amber-500/25"
        disabled={!selectedProvider}
        onClick={handleProceedToConfirm}
      >
        {t('next', lang)}
        <ArrowRight className="size-4 ml-1" />
      </Button>
    </div>
  );

  const renderConfirmStep = () => (
    <div className="space-y-4">
      <div className="text-center mb-2">
        <p className="text-sm text-muted-foreground">
          {t('escrow_confirm_payment', lang)}
        </p>
      </div>

      {/* Breakdown card */}
      <Card className="overflow-hidden border-amber-200 dark:border-amber-800">
        <CardContent className="p-0">
          <div className="bg-gradient-to-r from-amber-500 to-orange-500 p-4 text-white">
            <p className="text-xs font-medium opacity-80 uppercase tracking-wider">
              {t('escrow_total', lang)}
            </p>
            <p className="text-3xl font-bold mt-1">
              {formatTZS(amount)} <span className="text-base font-normal opacity-80">TZS</span>
            </p>
          </div>
          <div className="p-4 space-y-3">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">{t('escrow_guide_fee', lang)}</span>
              <span className="font-medium">{formatTZS(guideFee)} TZS</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">{t('escrow_platform_fee', lang)}</span>
              <span className="font-medium text-amber-600 dark:text-amber-400">
                {formatTZS(platformFee)} TZS
              </span>
            </div>
            <div className="border-t pt-3 flex items-center justify-between text-sm font-semibold">
              <span>{t('escrow_total', lang)}</span>
              <span>{formatTZS(amount)} TZS</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Selected provider */}
      {providerInfo && (
        <div className="flex items-center gap-3 rounded-xl border p-3 bg-muted/30">
          <div
            className={cn(
              'size-10 rounded-full flex items-center justify-center text-white font-bold',
              providerInfo.color
            )}
          >
            {providerInfo.letter}
          </div>
          <div>
            <p className="text-sm font-medium">
              {t('escrow_pay_with', lang)} {t(providerInfo.key, lang)}
            </p>
            <p className="text-xs text-muted-foreground">
              {t('escrow_flutterwave_secure', lang)}
            </p>
          </div>
        </div>
      )}

      {/* Security badge */}
      <div className="flex items-center gap-2 text-xs text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/20 rounded-lg px-3 py-2">
        <Shield className="size-3.5" />
        <span>{t('escrow_money_held_safely', lang)}</span>
      </div>

      <div className="flex gap-2">
        <Button
          variant="outline"
          className="flex-1 h-11"
          onClick={() => setStep('method')}
        >
          <ArrowLeft className="size-4 mr-1" />
          {t('back', lang)}
        </Button>
        <Button
          className="flex-1 h-11 font-semibold bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white shadow-lg shadow-amber-500/25"
          onClick={handleConfirmPayment}
        >
          {providerInfo && `${t('escrow_pay_with', lang)} ${t(providerInfo.key, lang)}`}
          <ArrowRight className="size-4 ml-1" />
        </Button>
      </div>
    </div>
  );

  const renderProcessingStep = () => (
    <div className="space-y-6 py-6">
      <div className="flex flex-col items-center gap-4">
        {/* Spinning circle with progress */}
        <div className="relative size-28">
          {/* Background circle */}
          <svg className="size-28 -rotate-90" viewBox="0 0 100 100">
            <circle
              cx="50"
              cy="50"
              r="42"
              fill="none"
              stroke="currentColor"
              className="text-muted/30"
              strokeWidth="6"
            />
            <circle
              cx="50"
              cy="50"
              r="42"
              fill="none"
              stroke="url(#gradient)"
              strokeWidth="6"
              strokeLinecap="round"
              strokeDasharray={`${2 * Math.PI * 42}`}
              strokeDashoffset={`${2 * Math.PI * 42 * (1 - processingProgress / 100)}`}
              className="transition-all duration-100 ease-linear"
            />
            <defs>
              <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#f59e0b" />
                <stop offset="100%" stopColor="#f97316" />
              </linearGradient>
            </defs>
          </svg>
          {/* Center icon */}
          <div className="absolute inset-0 flex items-center justify-center">
            <Loader2 className="size-8 text-amber-500 animate-spin" />
          </div>
        </div>

        <div className="text-center">
          <p className="text-lg font-semibold">{t('escrow_processing', lang)}</p>
          <p className="text-sm text-muted-foreground mt-1">
            {Math.round(processingProgress)}%
          </p>
        </div>

        {providerInfo && (
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <div
              className={cn(
                'size-5 rounded-full flex items-center justify-center text-white text-[10px] font-bold',
                providerInfo.color
              )}
            >
              {providerInfo.letter}
            </div>
            {t(providerInfo.key, lang)}
          </div>
        )}
      </div>
    </div>
  );

  const renderSuccessStep = () => (
    <div className="space-y-5 py-4">
      <div className="flex flex-col items-center gap-3">
        {/* Checkmark animation */}
        <div className="relative size-20">
          <div className="absolute inset-0 rounded-full bg-emerald-100 dark:bg-emerald-900/30 animate-ping opacity-20" />
          <div className="relative size-20 rounded-full bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center shadow-lg shadow-emerald-500/30">
            <CheckCircle2 className="size-10 text-white" />
          </div>
        </div>

        <div className="text-center">
          <p className="text-xl font-bold text-emerald-700 dark:text-emerald-300">
            {t('escrow_success', lang)}
          </p>
          <p className="text-sm text-muted-foreground mt-1">
            {t('escrow_money_held_safely', lang)}
          </p>
        </div>
      </div>

      {/* Transaction ID */}
      <Card className="border-emerald-200 dark:border-emerald-800">
        <CardContent className="p-4 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground">{t('escrow_transaction_id', lang)}</span>
            <button
              onClick={handleCopyTxId}
              className="flex items-center gap-1 text-xs text-amber-600 dark:text-amber-400 hover:underline"
            >
              <Copy className="size-3" />
              {copied ? t('copied', lang) : t('copy', lang)}
            </button>
          </div>
          <p className="text-sm font-mono font-semibold">{transactionId}</p>

          <div className="border-t pt-3 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">{t('escrow_guide_fee', lang)}</span>
              <span>{formatTZS(guideFee)} TZS</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">{t('escrow_platform_fee', lang)}</span>
              <span>{formatTZS(platformFee)} TZS</span>
            </div>
            <div className="flex justify-between text-sm font-semibold border-t pt-2">
              <span>{t('escrow_total', lang)}</span>
              <span>{formatTZS(amount)} TZS</span>
            </div>
          </div>
        </CardContent>
      </Card>

      <Button
        className="w-full h-11 font-semibold"
        onClick={handleCloseDialog}
      >
        {t('ok', lang)}
      </Button>
    </div>
  );

  // ── Render: Escrow status views (when escrowStatus !== 'pending') ──

  const renderEscrowStatusView = () => {
    if (escrowStatus === 'held') {
      return (
        <div className="space-y-4">
          {/* Status banner */}
          <div
            className={cn(
              'flex items-center gap-3 rounded-xl border p-4',
              statusConfig.bg
            )}
          >
            <StatusIcon className={cn('size-6 shrink-0', statusConfig.color)} />
            <div>
              <p className={cn('font-semibold', statusConfig.color)}>
                {t(statusConfig.labelKey, lang)}
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">
                {t('escrow_money_held_safely', lang)}
              </p>
            </div>
          </div>

          {/* Breakdown */}
          <Card>
            <CardContent className="p-4 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">{t('escrow_guide_fee', lang)}</span>
                <span>{formatTZS(guideFee)} TZS</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">{t('escrow_platform_fee', lang)}</span>
                <span className="text-amber-600 dark:text-amber-400">{formatTZS(platformFee)} TZS</span>
              </div>
              <div className="flex justify-between text-sm font-semibold border-t pt-2">
                <span>{t('escrow_total', lang)}</span>
                <span>{formatTZS(amount)} TZS</span>
              </div>
            </CardContent>
          </Card>

          {/* Guide sees waiting message */}
          {isGuide && (
            <div className="flex items-center gap-2 text-xs text-muted-foreground bg-muted/50 rounded-lg px-3 py-2">
              <Clock className="size-3.5" />
              {t('escrow_waiting_confirmation', lang)}
            </div>
          )}

          {/* Seeker actions */}
          {!isGuide && (
            <div className="space-y-2">
              <Button
                className="w-full h-11 font-semibold bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white"
                onClick={onReleaseEscrow}
              >
                <HandCoins className="size-4 mr-1.5" />
                {t('escrow_release_payment', lang)}
              </Button>
              <Button
                variant="outline"
                className="w-full h-11 border-red-200 text-red-600 hover:bg-red-50 dark:border-red-800 dark:text-red-400 dark:hover:bg-red-900/20"
                onClick={() => setShowDispute(true)}
              >
                <MessageSquareWarning className="size-4 mr-1.5" />
                {t('escrow_report_issue', lang)}
              </Button>
            </div>
          )}

          {/* Dispute input */}
          {showDispute && (
            <Card className="border-red-200 dark:border-red-800">
              <CardContent className="p-4 space-y-3">
                <p className="text-sm font-medium text-red-600 dark:text-red-400">
                  {t('escrow_dispute_reason', lang)}
                </p>
                <Input
                  value={disputeReason}
                  onChange={(e) => setDisputeReason(e.target.value)}
                  placeholder={t('escrow_enter_dispute_reason', lang)}
                  className="border-red-200 focus:border-red-400 dark:border-red-800"
                />
                <div className="flex gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setShowDispute(false);
                      setDisputeReason('');
                    }}
                  >
                    {t('cancel', lang)}
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    disabled={!disputeReason.trim()}
                    onClick={handleSubmitDispute}
                  >
                    {t('submit', lang)}
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      );
    }

    if (escrowStatus === 'released') {
      return (
        <div className="space-y-4">
          <div className="flex flex-col items-center gap-3 py-2">
            <div className="size-16 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
              <CheckCircle2 className="size-8 text-emerald-600 dark:text-emerald-400" />
            </div>
            <p className="text-lg font-semibold text-emerald-700 dark:text-emerald-300">
              {t('escrow_released', lang)}
            </p>
          </div>

          {/* Receipt */}
          <Card className="border-emerald-200 dark:border-emerald-800">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-3">
                <Receipt className="size-4 text-emerald-600 dark:text-emerald-400" />
                <span className="text-sm font-semibold">{t('escrow_receipt', lang)}</span>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">{t('escrow_guide_fee', lang)}</span>
                  <span>{formatTZS(guideFee)} TZS</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">{t('escrow_platform_fee', lang)}</span>
                  <span>{formatTZS(platformFee)} TZS</span>
                </div>
                <div className="flex justify-between text-sm font-semibold border-t pt-2">
                  <span>{t('escrow_total', lang)}</span>
                  <span>{formatTZS(amount)} TZS</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Button className="w-full h-11" onClick={handleCloseDialog}>
            {t('close', lang)}
          </Button>
        </div>
      );
    }

    if (escrowStatus === 'refunded') {
      return (
        <div className="space-y-4">
          <div className="flex flex-col items-center gap-3 py-2">
            <div className="size-16 rounded-full bg-gray-100 dark:bg-gray-900/30 flex items-center justify-center">
              <HandCoins className="size-8 text-gray-600 dark:text-gray-400" />
            </div>
            <p className="text-lg font-semibold text-gray-700 dark:text-gray-300">
              {t('escrow_refunded', lang)}
            </p>
            <p className="text-sm text-muted-foreground text-center">
              {lang === 'sw'
                ? 'Pesa zimerudishwa kwa akaunti yako'
                : 'Funds have been returned to your account'}
            </p>
          </div>

          <Card>
            <CardContent className="p-4">
              <div className="flex justify-between text-sm font-semibold">
                <span>{t('escrow_refunded', lang)}</span>
                <span>{formatTZS(amount)} TZS</span>
              </div>
            </CardContent>
          </Card>

          <Button className="w-full h-11" onClick={handleCloseDialog}>
            {t('close', lang)}
          </Button>
        </div>
      );
    }

    if (escrowStatus === 'disputed') {
      return (
        <div className="space-y-4">
          <div
            className={cn(
              'flex items-center gap-3 rounded-xl border p-4',
              statusConfig.bg
            )}
          >
            <AlertTriangle className={cn('size-6 shrink-0', statusConfig.color)} />
            <div>
              <p className={cn('font-semibold', statusConfig.color)}>
                {t('dispute_raised', lang)}
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">
                {lang === 'sw'
                  ? 'Msimamizi atachunguza mgogoro huu'
                  : 'An admin will investigate this dispute'}
              </p>
            </div>
          </div>

          <Card>
            <CardContent className="p-4">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">{t('status', lang)}</span>
                <Badge variant="destructive">{t('dispute_raised', lang)}</Badge>
              </div>
              <div className="flex justify-between text-sm mt-2">
                <span className="text-muted-foreground">{t('amount', lang)}</span>
                <span>{formatTZS(amount)} TZS</span>
              </div>
            </CardContent>
          </Card>

          <div className="flex gap-2">
            <Button
              variant="outline"
              className="flex-1 h-11"
              onClick={onRefundEscrow}
            >
              <HandCoins className="size-4 mr-1" />
              {t('escrow_refunded', lang)}
            </Button>
            <Button
              className="flex-1 h-11 bg-gradient-to-r from-emerald-500 to-emerald-600 text-white"
              onClick={onReleaseEscrow}
            >
              <CheckCircle2 className="size-4 mr-1" />
              {t('escrow_release_payment', lang)}
            </Button>
          </div>
        </div>
      );
    }

    return null;
  };

  // ── Main render ──

  return (
    <>
      {/* Trigger button */}
      <Button
        onClick={handleOpenDialog}
        className={cn(
          'w-full h-11 font-semibold',
          escrowStatus === 'pending'
            ? 'bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white shadow-lg shadow-amber-500/25'
            : ''
        )}
        variant={escrowStatus !== 'pending' ? 'outline' : 'default'}
      >
        {escrowStatus === 'pending' && (
          <>
            <CreditCard className="size-4 mr-1.5" />
            {t('payment', lang)}
          </>
        )}
        {escrowStatus === 'held' && (
          <>
            <Shield className="size-4 mr-1.5" />
            {t('escrow_view_receipt', lang)}
          </>
        )}
        {escrowStatus === 'released' && (
          <>
            <Receipt className="size-4 mr-1.5" />
            {t('escrow_receipt', lang)}
          </>
        )}
        {escrowStatus === 'refunded' && (
          <>
            <HandCoins className="size-4 mr-1.5" />
            {t('escrow_refunded', lang)}
          </>
        )}
        {escrowStatus === 'disputed' && (
          <>
            <AlertTriangle className="size-4 mr-1.5" />
            {t('dispute_raised', lang)}
          </>
        )}
      </Button>

      {/* Dialog */}
      <Dialog open={open} onOpenChange={handleCloseDialog}>
        <DialogContent
          className="sm:max-w-md"
          showCloseButton={step !== 'processing'}
        >
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <div className="size-8 rounded-lg bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center">
                <Shield className="size-4 text-white" />
              </div>
              {t('escrow_title', lang)}
            </DialogTitle>
            {escrowStatus === 'pending' && step !== 'processing' && step !== 'success' && (
              <DialogDescription>
                {step === 'method' && t('escrow_select_method', lang)}
                {step === 'confirm' && t('escrow_confirm_payment', lang)}
              </DialogDescription>
            )}
          </DialogHeader>

          {/* Step indicators for payment flow */}
          {escrowStatus === 'pending' && (
            <div className="flex items-center justify-center gap-1.5 mb-2">
              {(['method', 'confirm', 'processing', 'success'] as PaymentStep[]).map(
                (s, i) => (
                  <div
                    key={s}
                    className={cn(
                      'h-1.5 rounded-full transition-all duration-300',
                      step === s
                        ? 'w-8 bg-gradient-to-r from-amber-500 to-orange-500'
                        : i <
                            ['method', 'confirm', 'processing', 'success'].indexOf(step)
                          ? 'w-4 bg-amber-400'
                          : 'w-4 bg-muted'
                    )}
                  />
                )
              )}
            </div>
          )}

          {/* Content */}
          {escrowStatus === 'pending' && step === 'method' && renderMethodStep()}
          {escrowStatus === 'pending' && step === 'confirm' && renderConfirmStep()}
          {escrowStatus === 'pending' && step === 'processing' && renderProcessingStep()}
          {escrowStatus === 'pending' && step === 'success' && renderSuccessStep()}

          {escrowStatus !== 'pending' && renderEscrowStatusView()}

          {/* Footer for processing step - no close button */}
          {step === 'processing' && (
            <DialogFooter>
              <p className="text-xs text-muted-foreground text-center w-full">
                {t('escrow_flutterwave_secure', lang)}
              </p>
            </DialogFooter>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}

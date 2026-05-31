'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Wallet as WalletIcon, ArrowUpRight, ArrowDownLeft, Plus, Send,
  Clock, CheckCircle2, XCircle, Smartphone, Shield, CreditCard,
  QrCode, X, TrendingUp, Receipt, ChevronRight, Zap,
  Loader2, Phone, AlertCircle,
} from 'lucide-react';
import { useAuthStore } from '@/lib/stores/auth-store';
import { useNotificationStore } from '@/lib/stores/notification-store';
import { toast } from 'sonner';

// ── Types ──

type FilterTab = 'all' | 'deposits' | 'withdrawals' | 'payments';
type PaymentProvider = 'mpesa' | 'tigo' | 'airtel';
type MpesaState = 'idle' | 'processing' | 'success' | 'failed';

interface Transaction {
  id: string;
  type: 'deposit' | 'payment' | 'refund' | 'withdrawal' | 'subscription';
  amount: number;
  status: 'completed' | 'pending' | 'failed';
  description: string;
  reference: string;
  date: string;
  time: string;
}

interface PaymentMethod {
  id: string;
  provider: PaymentProvider;
  phone: string;
  label: string;
  color: string;
  lastUsed: string;
}

// ── Demo Data ──

const DEMO_TRANSACTIONS: Transaction[] = [
  { id: 't1', type: 'deposit', amount: 50000, status: 'completed', description: 'M-Pesa Top Up', reference: 'MPESA2543', date: 'May 30, 2026', time: '2:45 PM' },
  { id: 't2', type: 'payment', amount: -35000, status: 'completed', description: 'Session Payment - Mwanaildi J.', reference: 'SES-001', date: 'May 30, 2026', time: '3:15 PM' },
  { id: 't3', type: 'refund', amount: 15000, status: 'completed', description: 'Session Refund - Cancelled', reference: 'REF-042', date: 'May 28, 2026', time: '11:00 AM' },
  { id: 't4', type: 'deposit', amount: 100000, status: 'completed', description: 'M-Pesa Top Up', reference: 'MPESA2540', date: 'May 27, 2026', time: '9:30 AM' },
  { id: 't5', type: 'payment', amount: -25000, status: 'completed', description: 'Session Payment - Asha M.', reference: 'SES-015', date: 'May 26, 2026', time: '4:20 PM' },
  { id: 't6', type: 'withdrawal', amount: -125000, status: 'completed', description: 'M-Pesa Withdrawal', reference: 'WD-088', date: 'May 25, 2026', time: '10:00 AM' },
  { id: 't7', type: 'subscription', amount: -15000, status: 'completed', description: 'Pro Subscription - Monthly', reference: 'SUB-PRO', date: 'May 22, 2026', time: '8:00 AM' },
  { id: 't8', type: 'payment', amount: -75000, status: 'pending', description: 'Session Payment - Bulk Order', reference: 'SES-022', date: 'May 30, 2026', time: '5:00 PM' },
  { id: 't9', type: 'deposit', amount: 25000, status: 'failed', description: 'M-Pesa Top Up (Failed)', reference: 'MPESA2539', date: 'May 21, 2026', time: '3:45 PM' },
  { id: 't10', type: 'payment', amount: -45000, status: 'completed', description: 'Session Payment - Fatma H.', reference: 'SES-010', date: 'May 20, 2026', time: '1:30 PM' },
];

const SAVED_PAYMENT_METHODS: PaymentMethod[] = [
  { id: 'pm1', provider: 'mpesa', phone: '0712 *** 678', label: 'M-Pesa', color: '#4CAF50', lastUsed: 'Today' },
  { id: 'pm2', provider: 'tigo', phone: '0655 *** 234', label: 'Tigo Pesa', color: '#E4002B', lastUsed: '3 days ago' },
  { id: 'pm3', provider: 'airtel', phone: '0788 *** 901', label: 'Airtel Money', color: '#ED1C24', lastUsed: '1 week ago' },
];

const MPESA_PRESETS = [5000, 10000, 25000, 50000];

// ── Animation variants ──

const containerVariants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.06 } },
};

const itemVariants = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0 },
};

// ── Main Component ──

export default function WalletPage() {
  const { user, walletBalance, setWalletBalance, language } = useAuthStore();
  const { addNotification } = useNotificationStore();
  const sw = language === 'sw';
  const l = (en: string, swText: string) => (sw ? swText : en);

  const [filter, setFilter] = useState<FilterTab>('all');
  const [showTopUp, setShowTopUp] = useState(false);
  const [showWithdraw, setShowWithdraw] = useState(false);
  const [topUpAmount, setTopUpAmount] = useState(0);
  const [withdrawAmount, setWithdrawAmount] = useState(0);
  const [phoneNumber, setPhoneNumber] = useState(user?.phone || '');
  const [processing, setProcessing] = useState(false);
  const [success, setSuccess] = useState(false);
  const [selectedProvider, setSelectedProvider] = useState<PaymentProvider>('mpesa');

  // M-Pesa STK Push states
  const [mpesaState, setMpesaState] = useState<MpesaState>('idle');
  const [mpesaCheckoutId, setMpesaCheckoutId] = useState<string>('');
  const [mpesaReceipt, setMpesaReceipt] = useState<string>('');
  const [mpesaPollTimer, setMpesaPollTimer] = useState<NodeJS.Timeout | null>(null);

  const pendingBalance = 75000;
  const availableBalance = walletBalance - pendingBalance;
  const usdEquivalent = (walletBalance / 2600).toFixed(2);

  const filtered = DEMO_TRANSACTIONS.filter(t => {
    if (filter === 'all') return true;
    if (filter === 'deposits') return t.type === 'deposit' || t.type === 'refund';
    if (filter === 'withdrawals') return t.type === 'withdrawal';
    if (filter === 'payments') return t.type === 'payment' || t.type === 'subscription';
    return true;
  });

  // ── M-Pesa STK Push Handler ──
  const handleMpesaTopUp = async () => {
    if (topUpAmount <= 0 || !phoneNumber) return;

    setMpesaState('processing');
    setProcessing(true);

    try {
      const res = await fetch('/api/payments/mpesa/stk-push', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phone: phoneNumber,
          amount: topUpAmount,
          accountRef: `KARIKO_${user?.id || 'demo'}`,
          transactionDesc: 'Wallet Top Up',
        }),
      });

      const data = await res.json();

      if (data.success && data.ResponseCode === '0') {
        setMpesaCheckoutId(data.CheckoutRequestID);

        if (data.demoMode) {
          // Demo mode: simulate success after a short delay
          setTimeout(() => {
            setMpesaState('success');
            setMpesaReceipt(data.mockMpesaReceipt || data.mockReceipt);
            setWalletBalance(walletBalance + topUpAmount);
            addNotification({
              userId: user?.id || '',
              type: 'payment',
              title: l('Top Up Successful', 'Kupakia Imefanikiwa'),
              message: `TZS ${topUpAmount.toLocaleString()} ${l('added to your wallet', 'imeongezwa kwenye mkoba wako')}. ${l('Receipt', 'Risiti')}: ${data.mockMpesaReceipt}`,
              read: false,
            });
            setProcessing(false);

            // Auto-close after showing success
            setTimeout(() => {
              setMpesaState('idle');
              setShowTopUp(false);
              setTopUpAmount(0);
              setMpesaReceipt('');
            }, 2500);
          }, 3000);

          // Poll status
          const timer = setInterval(async () => {
            try {
              const statusRes = await fetch(`/api/payments/mpesa/status?CheckoutRequestID=${encodeURIComponent(data.CheckoutRequestID)}`);
              const statusData = await statusRes.json();
              if (statusData.ResultCode === '0' && mpesaState === 'processing') {
                // Already handled by the timeout above in demo mode
              }
            } catch {
              // Ignore polling errors
            }
          }, 5000);
          setMpesaPollTimer(timer);
        } else {
          // Production: poll for status
          const pollInterval = setInterval(async () => {
            try {
              const statusRes = await fetch(`/api/payments/mpesa/status?CheckoutRequestID=${encodeURIComponent(data.CheckoutRequestID)}`);
              const statusData = await statusRes.json();

              if (statusData.ResultCode === '0') {
                clearInterval(pollInterval);
                setMpesaState('success');
                setWalletBalance(walletBalance + topUpAmount);
                addNotification({
                  userId: user?.id || '',
                  type: 'payment',
                  title: l('Top Up Successful', 'Kupakia Imefanikiwa'),
                  message: `TZS ${topUpAmount.toLocaleString()} ${l('added to your wallet', 'imeongezwa kwenye mkoba wako')}`,
                  read: false,
                });
                setProcessing(false);
                setTimeout(() => {
                  setMpesaState('idle');
                  setShowTopUp(false);
                  setTopUpAmount(0);
                }, 2500);
              } else if (statusData.ResultCode && statusData.ResultCode !== '0') {
                clearInterval(pollInterval);
                setMpesaState('failed');
                setProcessing(false);
                toast.error(l('M-Pesa payment failed', 'Malipo ya M-Pesa yameshindwa'));
              }
            } catch {
              // Continue polling
            }
          }, 5000);

          setMpesaPollTimer(pollInterval);

          // Timeout after 2 minutes
          setTimeout(() => {
            clearInterval(pollInterval);
            if (mpesaState === 'processing') {
              setMpesaState('failed');
              setProcessing(false);
              toast.error(l('M-Pesa request timed out', 'Ombi la M-Pesa limeishiwa wakati'));
            }
          }, 120000);
        }
      } else {
        setMpesaState('failed');
        setProcessing(false);
        toast.error(data.error || l('M-Pesa request failed', 'Ombi la M-Pesa limefeli'));
      }
    } catch {
      setMpesaState('failed');
      setProcessing(false);
      toast.error(l('Failed to initiate M-Pesa payment', 'Imeshindwa kuanzisha malipo ya M-Pesa'));
    }
  };

  const handleTopUp = () => {
    if (topUpAmount <= 0) return;
    setProcessing(true);
    setTimeout(() => {
      setWalletBalance(walletBalance + topUpAmount);
      setProcessing(false);
      setSuccess(true);
      addNotification({
        userId: user?.id || '',
        type: 'payment',
        title: 'Top Up Successful',
        message: `TZS ${topUpAmount.toLocaleString()} added to your wallet`,
        read: false,
      });
      setTimeout(() => {
        setSuccess(false);
        setShowTopUp(false);
        setTopUpAmount(0);
      }, 1500);
    }, 2000);
  };

  const handleWithdraw = () => {
    if (withdrawAmount <= 0 || withdrawAmount > availableBalance) return;
    setProcessing(true);
    setTimeout(() => {
      setWalletBalance(walletBalance - withdrawAmount);
      setProcessing(false);
      setSuccess(true);
      addNotification({
        userId: user?.id || '',
        type: 'payment',
        title: 'Withdrawal Initiated',
        message: `TZS ${withdrawAmount.toLocaleString()} being sent to ${selectedProvider === 'mpesa' ? 'M-Pesa' : selectedProvider === 'tigo' ? 'Tigo Pesa' : 'Airtel Money'}`,
        read: false,
      });
      setTimeout(() => {
        setSuccess(false);
        setShowWithdraw(false);
        setWithdrawAmount(0);
      }, 1500);
    }, 2000);
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'deposit': return <ArrowDownLeft className="w-4 h-4 text-[#10B981]" />;
      case 'withdrawal': return <ArrowUpRight className="w-4 h-4 text-[#F59E0B]" />;
      case 'payment': return <ArrowUpRight className="w-4 h-4 text-[#DC2626]" />;
      case 'refund': return <ArrowDownLeft className="w-4 h-4 text-[#0891B2]" />;
      case 'subscription': return <CreditCard className="w-4 h-4 text-[#7C3AED]" />;
      default: return <WalletIcon className="w-4 h-4" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed': return <span className="kbadge kbadge-verified text-[8px]">Done</span>;
      case 'pending': return <span className="kbadge kbadge-pending text-[8px]">Pending</span>;
      case 'failed': return <span className="kbadge kbadge-urgent text-[8px]">Failed</span>;
      default: return null;
    }
  };

  const getProviderColor = (provider: PaymentProvider) => {
    switch (provider) {
      case 'mpesa': return '#4CAF50';
      case 'tigo': return '#E4002B';
      case 'airtel': return '#ED1C24';
    }
  };

  const getProviderName = (provider: PaymentProvider) => {
    switch (provider) {
      case 'mpesa': return 'M-Pesa';
      case 'tigo': return 'Tigo Pesa';
      case 'airtel': return 'Airtel Money';
    }
  };

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="show"
      className="px-4 py-4 space-y-5"
    >
      {/* Header */}
      <motion.div variants={itemVariants}>
        <h1 className="text-2xl font-bold text-[#065F46] dark:text-[#34D399]">
          {l('Wallet', 'Mkoba')}
        </h1>
        <p className="text-sm text-[#64748B] mt-1">
          {l('Manage your funds and mobile payments', 'Dhibiti pesa zako na malipo ya simu')}
        </p>
      </motion.div>

      {/* Balance Card */}
      <motion.div
        variants={itemVariants}
        className="kcard-green p-6 relative overflow-hidden"
      >
        <div className="relative z-10">
          <div className="flex items-center justify-between mb-1">
            <span className="text-sm text-white/70">{l('Total Balance', 'Salio Jumla')}</span>
            <Shield className="w-4 h-4 text-[#F59E0B]" />
          </div>
          <p className="text-4xl font-bold text-white tracking-tight">TZS {walletBalance.toLocaleString()}</p>
          <p className="text-sm text-white/50 mt-1">≈ USD {usdEquivalent}</p>

          <div className="grid grid-cols-2 gap-3 mt-5">
            <div className="p-3 rounded-xl bg-white/10 backdrop-blur-sm">
              <p className="text-xs text-white/60">{l('Available', 'Inayopatikana')}</p>
              <p className="text-lg font-bold text-[#F59E0B]">TZS {availableBalance.toLocaleString()}</p>
            </div>
            <div className="p-3 rounded-xl bg-white/10 backdrop-blur-sm">
              <p className="text-xs text-white/60">{l('Pending', 'Inasubiri')}</p>
              <p className="text-lg font-bold text-white">TZS {pendingBalance.toLocaleString()}</p>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Quick Actions */}
      <motion.div variants={itemVariants} className="grid grid-cols-4 gap-3">
        {[
          { icon: Plus, label: l('Top Up', 'Weka'), color: '#10B981', onClick: () => { setMpesaState('idle'); setShowTopUp(true); } },
          { icon: ArrowUpRight, label: l('Withdraw', 'Toa'), color: '#F59E0B', onClick: () => setShowWithdraw(true) },
          { icon: Send, label: l('Send', 'Tuma'), color: '#0891B2', onClick: () => {} },
          { icon: QrCode, label: l('Receive', 'Pokea'), color: '#7C3AED', onClick: () => {} },
        ].map((action, i) => (
          <button
            key={i}
            onClick={action.onClick}
            className="kcard p-3 text-center hover:shadow-md transition-all active:scale-95"
          >
            <div
              className="w-10 h-10 rounded-xl mx-auto mb-1.5 flex items-center justify-center"
              style={{ backgroundColor: `${action.color}15` }}
            >
              <action.icon className="w-5 h-5" style={{ color: action.color }} />
            </div>
            <span className="text-xs font-medium">{action.label}</span>
          </button>
        ))}
      </motion.div>

      {/* M-Pesa Top Up Section */}
      <motion.div variants={itemVariants} className="kcard-glass p-5 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Smartphone className="w-5 h-5 text-[#4CAF50]" />
            <h3 className="font-bold text-sm">{l('M-Pesa Top Up', 'Weka Pesa M-Pesa')}</h3>
          </div>
          <span className="kbadge kbadge-verified text-[8px]">{l('Instant', 'Papo Hapo')}</span>
        </div>

        <div className="space-y-3">
          <div>
            <label className="text-xs font-medium text-[#64748B] mb-1.5 block">
              {l('Phone Number', 'Nambari ya Simu')}
            </label>
            <div className="relative">
              <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#64748B]" />
              <input
                value={phoneNumber}
                onChange={e => setPhoneNumber(e.target.value)}
                className="kinput w-full pl-10"
                placeholder="0712 345 678"
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-medium text-[#64748B] mb-2 block">
              {l('Quick Amount (TZS)', 'Kiasi Haraka (TZS)')}
            </label>
            <div className="grid grid-cols-4 gap-2">
              {MPESA_PRESETS.map(amt => (
                <button
                  key={amt}
                  onClick={() => setTopUpAmount(amt)}
                  className={`py-2.5 rounded-xl text-xs font-semibold transition-all ${
                    topUpAmount === amt
                      ? 'bg-[#065F46] text-white dark:bg-[#34D399] dark:text-[#022C22] shadow-sm'
                      : 'bg-[#F1F5F9] dark:bg-[#334155] text-[#64748B] dark:text-[#94A3B8] hover:bg-[#E2E8F0] dark:hover:bg-[#475569]'
                  }`}
                >
                  {(amt / 1000).toFixed(0)}K
                </button>
              ))}
            </div>
          </div>

          <button
            onClick={() => {
              if (topUpAmount <= 0) {
                toast.error(l('Please select an amount', 'Tafadhali chagua kiasi'));
                return;
              }
              if (!phoneNumber) {
                toast.error(l('Please enter phone number', 'Tafadhali ingiza nambari ya simu'));
                return;
              }
              setMpesaState('idle');
              setShowTopUp(true);
            }}
            disabled={topUpAmount <= 0 || !phoneNumber}
            className="w-full py-3 rounded-xl font-bold text-sm text-white transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2 bg-[#4CAF50] hover:bg-[#43A047]"
          >
            <Zap className="w-4 h-4" />
            {l('Top Up via M-Pesa', 'Weka kupitia M-Pesa')}
          </button>
        </div>
      </motion.div>

      {/* Payment Methods */}
      <motion.div variants={itemVariants}>
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-bold text-sm">{l('Saved Payment Methods', 'Njia za Malipo Zilizohifadhiwa')}</h3>
          <button className="text-xs text-[#065F46] dark:text-[#34D399] font-semibold">{l('+ Add New', '+ Ongeza')}</button>
        </div>
        <div className="space-y-2">
          {SAVED_PAYMENT_METHODS.map((method) => (
            <div key={method.id} className="kcard p-3.5 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center"
                  style={{ backgroundColor: `${method.color}15` }}
                >
                  <Smartphone className="w-5 h-5" style={{ color: method.color }} />
                </div>
                <div>
                  <p className="text-sm font-medium">{method.label}</p>
                  <p className="text-xs text-[#64748B]">{method.phone} · {method.lastUsed}</p>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-[#64748B]" />
            </div>
          ))}
        </div>
      </motion.div>

      {/* Transaction History */}
      <motion.div variants={itemVariants}>
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-bold text-sm">{l('Transaction History', 'Historia ya Miamala')}</h3>
          <Receipt className="w-4 h-4 text-[#64748B]" />
        </div>
        <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-2">
          {([
            { key: 'all', label: l('All', 'Zote') },
            { key: 'deposits', label: l('Deposits', 'Amana') },
            { key: 'withdrawals', label: l('Withdrawals', 'Utoaji') },
            { key: 'payments', label: l('Payments', 'Malipo') },
          ] as { key: FilterTab; label: string }[]).map(tab => (
            <button
              key={tab.key}
              onClick={() => setFilter(tab.key)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors ${
                filter === tab.key ? 'bg-[#065F46] text-white' : 'bg-[#F1F5F9] dark:bg-[#334155] text-[#64748B]'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </motion.div>

      <div className="space-y-2">
        {filtered.map((tx, i) => (
          <motion.div
            key={tx.id}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.03 }}
            className="kcard p-3.5 flex items-center justify-between"
          >
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                tx.type === 'deposit' || tx.type === 'refund' ? 'bg-[#ECFDF5] dark:bg-[#064E3B]' :
                tx.type === 'withdrawal' ? 'bg-[#FEF3C7] dark:bg-[#422006]' :
                tx.type === 'subscription' ? 'bg-[#F3E8FF] dark:bg-[#2E1065]' : 'bg-[#FEE2E2] dark:bg-[#2D1B1B]'
              }`}>
                {getTypeIcon(tx.type)}
              </div>
              <div>
                <p className="text-sm font-medium">{tx.description}</p>
                <p className="text-[10px] text-[#64748B]">{tx.date} · {tx.time}</p>
              </div>
            </div>
            <div className="text-right">
              <p className={`text-sm font-bold ${tx.amount > 0 ? 'text-[#10B981]' : 'text-[#DC2626]'}`}>
                {tx.amount > 0 ? '+' : ''}TZS {Math.abs(tx.amount).toLocaleString()}
              </p>
              {getStatusBadge(tx.status)}
            </div>
          </motion.div>
        ))}
      </div>

      {/* ── M-Pesa Top Up Modal ── */}
      <AnimatePresence>
        {showTopUp && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/50 flex items-end justify-center"
            onClick={() => {
              if (!processing && mpesaState !== 'processing') {
                if (mpesaPollTimer) clearInterval(mpesaPollTimer);
                setShowTopUp(false);
                setMpesaState('idle');
              }
            }}
          >
            <motion.div
              initial={{ y: 300 }}
              animate={{ y: 0 }}
              exit={{ y: 300 }}
              transition={{ type: 'spring', damping: 25 }}
              className="w-full max-w-lg bg-white dark:bg-[#1E293B] rounded-t-3xl p-6 space-y-4"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-bold flex items-center gap-2">
                  <Smartphone className="w-5 h-5 text-[#4CAF50]" />
                  {l('M-Pesa Top Up', 'Weka Pesa M-Pesa')}
                </h3>
                <button
                  onClick={() => {
                    if (!processing && mpesaState !== 'processing') {
                      if (mpesaPollTimer) clearInterval(mpesaPollTimer);
                      setShowTopUp(false);
                      setMpesaState('idle');
                    }
                  }}
                  className="w-8 h-8 rounded-full bg-[#F1F5F9] dark:bg-[#334155] flex items-center justify-center"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Success State */}
              {mpesaState === 'success' && (
                <div className="text-center py-8">
                  <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="w-16 h-16 rounded-full bg-[#ECFDF5] dark:bg-[#064E3B] flex items-center justify-center mx-auto mb-3">
                    <CheckCircle2 className="w-8 h-8 text-[#10B981]" />
                  </motion.div>
                  <p className="font-bold text-lg text-[#10B981]">{l('Top Up Successful!', 'Kupakia Imefanikiwa!')}</p>
                  <p className="text-sm text-[#64748B] mt-1">
                    TZS {topUpAmount.toLocaleString()} {l('added to your wallet', 'imeongezwa kwenye mkoba wako')}
                  </p>
                  {mpesaReceipt && (
                    <p className="text-xs text-[#64748B] mt-2">
                      {l('M-Pesa Receipt', 'Risiti ya M-Pesa')}: <span className="font-mono font-semibold">{mpesaReceipt}</span>
                    </p>
                  )}
                </div>
              )}

              {/* Failed State */}
              {mpesaState === 'failed' && (
                <div className="text-center py-8">
                  <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="w-16 h-16 rounded-full bg-[#FEE2E2] dark:bg-[#2D1B1B] flex items-center justify-center mx-auto mb-3">
                    <XCircle className="w-8 h-8 text-[#DC2626]" />
                  </motion.div>
                  <p className="font-bold text-lg text-[#DC2626]">{l('Top Up Failed', 'Kupakia Kumefeli')}</p>
                  <p className="text-sm text-[#64748B] mt-1">
                    {l('Please check your phone number and try again', 'Tafadhali angalia nambari yako ya simu na jaribu tena')}
                  </p>
                  <button
                    onClick={() => setMpesaState('idle')}
                    className="mt-4 px-6 py-2 rounded-xl bg-[#065F46] text-white text-sm font-semibold"
                  >
                    {l('Try Again', 'Jaribu Tena')}
                  </button>
                </div>
              )}

              {/* Processing State */}
              {mpesaState === 'processing' && (
                <div className="text-center py-8">
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ repeat: Infinity, duration: 2, ease: 'linear' }}
                    className="w-16 h-16 rounded-full bg-[#ECFDF5] dark:bg-[#064E3B] flex items-center justify-center mx-auto mb-3"
                  >
                    <Smartphone className="w-8 h-8 text-[#4CAF50]" />
                  </motion.div>
                  <p className="font-bold text-lg">{l('Check Your Phone', 'Angalia Simu Yako')}</p>
                  <p className="text-sm text-[#64748B] mt-1">
                    {l('An M-Pesa prompt has been sent to your phone. Enter your PIN to confirm.', 'Ombi la M-Pesa limetumwa kwenye simu yako. Ingiza PIN yako kuthibitisha.')}
                  </p>
                  <div className="flex items-center justify-center gap-2 mt-3 text-[#4CAF50]">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span className="text-sm font-medium">{l('Waiting for confirmation...', 'Inasubiri uthibitisho...')}</span>
                  </div>
                </div>
              )}

              {/* Idle State - Form */}
              {mpesaState === 'idle' && (
                <>
                  {/* Summary Card */}
                  <div className="p-4 rounded-xl bg-[#ECFDF5] dark:bg-[#064E3B]/30 border border-[#065F46]/20 dark:border-[#34D399]/20">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-medium text-[#065F46] dark:text-[#34D399]">{l('Amount', 'Kiasi')}</span>
                      <span className="text-2xl font-bold text-[#065F46] dark:text-[#34D399]">TZS {topUpAmount.toLocaleString()}</span>
                    </div>
                    <div className="flex items-center justify-between text-xs text-[#64748B]">
                      <span>{l('Phone', 'Simu')}: {phoneNumber}</span>
                      <span className="flex items-center gap-1"><Shield className="w-3 h-3" />{l('Secured', 'Imelindwa')}</span>
                    </div>
                  </div>

                  {/* Amount Selection */}
                  <div>
                    <label className="text-sm font-medium mb-2 block">{l('Select Amount (TZS)', 'Chagua Kiasi (TZS)')}</label>
                    <div className="grid grid-cols-4 gap-2">
                      {[5000, 10000, 25000, 50000, 100000, 200000, 500000, 1000000].map(amt => (
                        <button
                          key={amt}
                          onClick={() => setTopUpAmount(amt)}
                          className={`py-2 rounded-xl text-xs font-medium transition-all ${
                            topUpAmount === amt ? 'bg-[#065F46] text-white' : 'bg-[#F1F5F9] dark:bg-[#334155] text-[#64748B]'
                          }`}
                        >
                          {amt >= 1000000 ? `${amt / 1000000}M` : amt >= 1000 ? `${amt / 1000}K` : amt}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Custom Amount */}
                  <div>
                    <label className="text-sm font-medium mb-1 block">{l('Custom Amount', 'Kiasi Maalum')}</label>
                    <input
                      type="number"
                      value={topUpAmount || ''}
                      onChange={e => setTopUpAmount(Number(e.target.value))}
                      placeholder="TZS"
                      className="kinput w-full"
                    />
                  </div>

                  {/* Phone Number */}
                  <div>
                    <label className="text-sm font-medium mb-1 block">{l('Phone Number', 'Nambari ya Simu')}</label>
                    <input value={phoneNumber} onChange={e => setPhoneNumber(e.target.value)} className="kinput w-full" placeholder="0712 345 678" />
                  </div>

                  {/* M-Pesa Info */}
                  <div className="flex items-start gap-2 p-3 rounded-xl bg-[#F1F5F9] dark:bg-[#334155] text-xs text-[#64748B]">
                    <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                    <span>
                      {l(
                        'You will receive an M-Pesa push notification on your phone. Enter your PIN to complete the transaction.',
                        'Utapokea arifa la M-Pesa kwenye simu yako. Ingiza PIN yako kukamilisha muamala.'
                      )}
                    </span>
                  </div>

                  {/* Submit Button */}
                  <button
                    onClick={handleMpesaTopUp}
                    disabled={topUpAmount <= 0 || !phoneNumber || processing}
                    className="w-full py-3 rounded-xl font-bold text-sm text-white transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2 bg-[#4CAF50] hover:bg-[#43A047]"
                  >
                    <Zap className="w-4 h-4" />
                    {l('Top Up via M-Pesa', 'Weka kupitia M-Pesa')}
                  </button>
                </>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Withdraw Modal */}
      <AnimatePresence>
        {showWithdraw && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/50 flex items-end justify-center"
            onClick={() => !processing && setShowWithdraw(false)}
          >
            <motion.div
              initial={{ y: 300 }}
              animate={{ y: 0 }}
              exit={{ y: 300 }}
              transition={{ type: 'spring', damping: 25 }}
              className="w-full max-w-lg bg-white dark:bg-[#1E293B] rounded-t-3xl p-6 space-y-4"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-bold">{l('Withdraw Funds', 'Toa Pesa')}</h3>
                <button onClick={() => !processing && setShowWithdraw(false)} className="w-8 h-8 rounded-full bg-[#F1F5F9] dark:bg-[#334155] flex items-center justify-center">
                  <X className="w-4 h-4" />
                </button>
              </div>

              {success ? (
                <div className="text-center py-8">
                  <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="w-16 h-16 rounded-full bg-[#ECFDF5] flex items-center justify-center mx-auto mb-3">
                    <CheckCircle2 className="w-8 h-8 text-[#10B981]" />
                  </motion.div>
                  <p className="font-bold text-lg">{l('Withdrawal Initiated!', 'Utoaji Umeanza!')}</p>
                  <p className="text-sm text-[#64748B]">TZS {withdrawAmount.toLocaleString()} {l('being sent to', 'inatumwa kwa')} {getProviderName(selectedProvider)}</p>
                </div>
              ) : (
                <>
                  <div className="p-3 rounded-xl bg-[#FEF3C7] dark:bg-[#422006] text-[#F59E0B] text-xs flex items-center gap-2">
                    <Shield className="w-4 h-4 shrink-0" />
                    {l('Available for withdrawal', 'Inayopatikana kwa utoaji')}: TZS {availableBalance.toLocaleString()}
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-1 block">{l('Amount (TZS)', 'Kiasi (TZS)')}</label>
                    <input
                      type="number"
                      value={withdrawAmount || ''}
                      onChange={e => setWithdrawAmount(Number(e.target.value))}
                      placeholder={l('Enter amount', 'Ingiza kiasi')}
                      className="kinput w-full"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-2 block">{l('Withdrawal Method', 'Njia ya Utoaji')}</label>
                    <div className="grid grid-cols-3 gap-2">
                      {(['mpesa', 'tigo', 'airtel'] as PaymentProvider[]).map(provider => (
                        <button
                          key={provider}
                          onClick={() => setSelectedProvider(provider)}
                          className={`p-3 rounded-xl text-center transition-all border-2 ${
                            selectedProvider === provider ? 'border-current' : 'border-transparent bg-[#F1F5F9] dark:bg-[#334155]'
                          }`}
                          style={selectedProvider === provider ? { borderColor: getProviderColor(provider) } : {}}
                        >
                          <Smartphone className="w-5 h-5 mx-auto mb-1" style={{ color: getProviderColor(provider) }} />
                          <span className="text-xs font-medium">{getProviderName(provider)}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-1 block">{l('Phone Number', 'Nambari ya Simu')}</label>
                    <input value={phoneNumber} onChange={e => setPhoneNumber(e.target.value)} className="kinput w-full" placeholder="0712 345 678" />
                  </div>
                  <button
                    onClick={handleWithdraw}
                    disabled={withdrawAmount <= 0 || withdrawAmount > availableBalance || processing}
                    className="kbtn-yellow w-full text-sm h-11 disabled:opacity-50"
                  >
                    {processing ? (
                      <span className="flex items-center gap-2"><Clock className="w-4 h-4 animate-spin" />{l('Processing...', 'Inachakata...')}</span>
                    ) : (
                      <span className="flex items-center gap-2"><ArrowUpRight className="w-4 h-4" />{l('Withdraw', 'Toa')} TZS {withdrawAmount.toLocaleString()}</span>
                    )}
                  </button>
                </>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

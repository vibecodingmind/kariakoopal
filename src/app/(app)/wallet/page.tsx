'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Wallet as WalletIcon, ArrowUpRight, ArrowDownLeft, Plus, Send,
  Clock, CheckCircle2, XCircle, Smartphone, Shield, CreditCard,
  QrCode, X, Receipt, ChevronRight, Zap,
  Loader2, Phone, AlertCircle, Globe, Building2,
  Lock, AlertTriangle, Unlock, Scale,
} from 'lucide-react';
import { useAuthStore } from '@/lib/stores/auth-store';
import { useNotificationStore } from '@/lib/stores/notification-store';
import { usePayments } from '@/hooks/use-payments';
import { toast } from 'sonner';

// ── Types ──

type FilterTab = 'all' | 'deposits' | 'withdrawals' | 'payments';
type PaymentProvider = 'pesapal' | 'stripe' | 'paypal';
type PaymentState = 'idle' | 'processing' | 'success' | 'failed';

interface Transaction {
  id: string;
  type: 'deposit' | 'payment' | 'refund' | 'withdrawal' | 'subscription';
  amount: number;
  status: 'completed' | 'pending' | 'failed';
  description: string;
  reference: string;
  provider: string;
  date: string;
  time: string;
}

interface SavedPaymentMethod {
  id: string;
  provider: PaymentProvider;
  label: string;
  detail: string;
  color: string;
  icon: string;
  lastUsed: string;
}

// ── Demo Data ──

const DEMO_TRANSACTIONS: Transaction[] = [
  { id: 't1', type: 'deposit', amount: 50000, status: 'completed', description: 'Pesapal Top Up', reference: 'PSPL2543', provider: 'pesapal', date: 'May 30, 2026', time: '2:45 PM' },
  { id: 't2', type: 'payment', amount: -35000, status: 'completed', description: 'Session Payment - Mwanaildi J.', reference: 'SES-001', provider: 'pesapal', date: 'May 30, 2026', time: '3:15 PM' },
  { id: 't3', type: 'refund', amount: 15000, status: 'completed', description: 'Session Refund - Cancelled', reference: 'REF-042', provider: 'stripe', date: 'May 28, 2026', time: '11:00 AM' },
  { id: 't4', type: 'deposit', amount: 100000, status: 'completed', description: 'Stripe Card Top Up', reference: 'STRIPE2540', provider: 'stripe', date: 'May 27, 2026', time: '9:30 AM' },
  { id: 't5', type: 'payment', amount: -25000, status: 'completed', description: 'Session Payment - Asha M.', reference: 'SES-015', provider: 'pesapal', date: 'May 26, 2026', time: '4:20 PM' },
  { id: 't6', type: 'withdrawal', amount: -125000, status: 'completed', description: 'Pesapal Withdrawal', reference: 'WD-088', provider: 'pesapal', date: 'May 25, 2026', time: '10:00 AM' },
  { id: 't7', type: 'subscription', amount: -15000, status: 'completed', description: 'Pro Subscription - Monthly', reference: 'SUB-PRO', provider: 'paypal', date: 'May 22, 2026', time: '8:00 AM' },
  { id: 't8', type: 'deposit', amount: 75000, status: 'completed', description: 'PayPal Top Up', reference: 'PP-9921', provider: 'paypal', date: 'May 21, 2026', time: '6:15 PM' },
  { id: 't9', type: 'deposit', amount: 25000, status: 'failed', description: 'Pesapal Top Up (Failed)', reference: 'PSPL2539', provider: 'pesapal', date: 'May 21, 2026', time: '3:45 PM' },
  { id: 't10', type: 'payment', amount: -45000, status: 'completed', description: 'Session Payment - Fatma H.', reference: 'SES-010', provider: 'pesapal', date: 'May 20, 2026', time: '1:30 PM' },
];

const SAVED_METHODS: SavedPaymentMethod[] = [
  { id: 'pm1', provider: 'pesapal', label: 'M-Pesa via Pesapal', detail: '0712 *** 678', color: '#4CAF50', icon: 'phone', lastUsed: 'Today' },
  { id: 'pm2', provider: 'stripe', label: 'Visa ****4242', detail: 'Card ending 4242', color: '#635BFF', icon: 'card', lastUsed: '3 days ago' },
  { id: 'pm3', provider: 'paypal', label: 'PayPal', detail: 'j***@gmail.com', color: '#003087', icon: 'globe', lastUsed: '1 week ago' },
];

const TOP_UP_PRESETS = [5000, 10000, 25000, 50000, 100000, 200000, 500000, 1000000];

const PROVIDER_CONFIG: Record<PaymentProvider, { name: string; nameSw: string; icon: typeof Smartphone; color: string; description: string; descriptionSw: string }> = {
  pesapal: { name: 'Pesapal', nameSw: 'Pesapal', icon: Smartphone, color: '#4CAF50', description: 'Mobile Money (M-Pesa, Tigo, Airtel)', descriptionSw: 'Pesa ya Simu (M-Pesa, Tigo, Airtel)' },
  stripe: { name: 'Stripe', nameSw: 'Stripe', icon: CreditCard, color: '#635BFF', description: 'Credit / Debit Card', descriptionSw: 'Kadi ya Mkopo / Debiti' },
  paypal: { name: 'PayPal', nameSw: 'PayPal', icon: Globe, color: '#003087', description: 'PayPal Balance or Linked Card', descriptionSw: 'Salio la PayPal au Kadi' },
};

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
  const payments = usePayments();
  const sw = language === 'sw';
  const l = (en: string, swText: string) => (sw ? swText : en);

  const [filter, setFilter] = useState<FilterTab>('all');
  const [showTopUp, setShowTopUp] = useState(false);
  const [showWithdraw, setShowWithdraw] = useState(false);
  const [topUpAmount, setTopUpAmount] = useState(0);
  const [withdrawAmount, setWithdrawAmount] = useState(0);
  const [phoneNumber, setPhoneNumber] = useState(user?.phone || '');
  const [emailAddress, setEmailAddress] = useState(user?.email || '');
  const [processing, setProcessing] = useState(false);
  const [paymentState, setPaymentState] = useState<PaymentState>('idle');
  const [paymentReceipt, setPaymentReceipt] = useState('');
  const [selectedProvider, setSelectedProvider] = useState<PaymentProvider>('pesapal');

  const pendingBalance = 75000;
  const availableBalance = walletBalance - pendingBalance;
  const usdEquivalent = (walletBalance / 2600).toFixed(2);

  // ── Escrow demo data ──
  const escrowItems = [
    { id: 'esc-1', sessionId: 'SES-2847', guideName: 'Mwanaildi Juma', amount: 35000, status: 'held' as const, date: '2h ago', autoRelease: '46h remaining' },
    { id: 'esc-2', sessionId: 'SES-2901', guideName: 'Fatma Hassan', amount: 45000, status: 'disputed' as const, date: '1d ago', autoRelease: 'Disputed' },
    { id: 'esc-3', sessionId: 'SES-2756', guideName: 'Asha Mohamed', amount: 25000, status: 'released' as const, date: '3d ago', autoRelease: 'Released' },
  ];

  const escrowHeld = escrowItems.filter(e => e.status === 'held').reduce((s, e) => s + e.amount, 0);
  const escrowDisputed = escrowItems.filter(e => e.status === 'disputed').reduce((s, e) => s + e.amount, 0);

  const filtered = DEMO_TRANSACTIONS.filter(t => {
    if (filter === 'all') return true;
    if (filter === 'deposits') return t.type === 'deposit' || t.type === 'refund';
    if (filter === 'withdrawals') return t.type === 'withdrawal';
    if (filter === 'payments') return t.type === 'payment' || t.type === 'subscription';
    return true;
  });

  // ── Top Up Handler ──
  const handleTopUp = async () => {
    if (topUpAmount <= 0) return;
    setPaymentState('processing');
    setProcessing(true);

    try {
      let result;
      if (selectedProvider === 'pesapal') {
        if (!phoneNumber) { toast.error(l('Enter phone number', 'Ingiza nambari ya simu')); setPaymentState('idle'); setProcessing(false); return; }
        result = await payments.topUpPesapal(phoneNumber, topUpAmount);
      } else if (selectedProvider === 'stripe') {
        if (!emailAddress) { toast.error(l('Enter email address', 'Ingiza barua pepe')); setPaymentState('idle'); setProcessing(false); return; }
        result = await payments.topUpStripe(emailAddress, topUpAmount);
      } else {
        if (!emailAddress) { toast.error(l('Enter email address', 'Ingiza barua pepe')); setPaymentState('idle'); setProcessing(false); return; }
        result = await payments.topUpPayPal(emailAddress, topUpAmount);
      }

      if (result.success) {
        setPaymentState('success');
        setPaymentReceipt(result.reference);
        setWalletBalance(walletBalance + topUpAmount);
        setTimeout(() => {
          setPaymentState('idle');
          setShowTopUp(false);
          setTopUpAmount(0);
          setPaymentReceipt('');
        }, 2500);
      } else {
        setPaymentState('failed');
      }
    } catch {
      setPaymentState('failed');
    }
    setProcessing(false);
  };

  // ── Withdraw Handler ──
  const handleWithdraw = async () => {
    if (withdrawAmount <= 0 || withdrawAmount > availableBalance) return;
    setProcessing(true);
    try {
      const result = await payments.withdraw(withdrawAmount, phoneNumber, 'pesapal');
      if (result.success) {
        setPaymentState('success');
        setTimeout(() => {
          setPaymentState('idle');
          setShowWithdraw(false);
          setWithdrawAmount(0);
        }, 2000);
      }
    } catch { /* handled in hook */ }
    setProcessing(false);
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
      case 'completed': return <span className="text-[8px] px-1.5 py-0.5 rounded-full bg-[#ECFDF5] text-[#065F46] font-semibold">Done</span>;
      case 'pending': return <span className="text-[8px] px-1.5 py-0.5 rounded-full bg-[#FEF3C7] text-[#92400E] font-semibold">Pending</span>;
      case 'failed': return <span className="text-[8px] px-1.5 py-0.5 rounded-full bg-[#FEE2E2] text-[#991B1B] font-semibold">Failed</span>;
      default: return null;
    }
  };

  const getProviderBadge = (provider: string) => {
    const config = PROVIDER_CONFIG[provider as PaymentProvider];
    if (!config) return null;
    return <span className="text-[8px] px-1.5 py-0.5 rounded-full font-semibold" style={{ backgroundColor: `${config.color}15`, color: config.color }}>{config.name}</span>;
  };

  return (
    <motion.div variants={containerVariants} initial="hidden" animate="show" className="px-4 py-4 space-y-5">
      {/* Header */}
      <motion.div variants={itemVariants}>
        <h1 className="text-2xl font-bold text-[#065F46] dark:text-[#34D399]">{l('Wallet', 'Mkoba')}</h1>
        <p className="text-sm text-[#64748B] mt-1">{l('Manage your funds and payments', 'Dhibiti pesa zako na malipo')}</p>
      </motion.div>

      {/* Balance Card */}
      <motion.div variants={itemVariants} className="kcard-green p-6 relative overflow-hidden">
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
          { icon: Plus, label: l('Top Up', 'Weka'), color: '#10B981', onClick: () => { setPaymentState('idle'); setShowTopUp(true); } },
          { icon: ArrowUpRight, label: l('Withdraw', 'Toa'), color: '#F59E0B', onClick: () => { setPaymentState('idle'); setShowWithdraw(true); } },
          { icon: Send, label: l('Send', 'Tuma'), color: '#0891B2', onClick: () => toast.info(l('Coming soon', 'Inakuja hivi karibuni')) },
          { icon: QrCode, label: l('Receive', 'Pokea'), color: '#7C3AED', onClick: () => toast.info(l('Coming soon', 'Inakuja hivi karibuni')) },
        ].map((action, i) => (
          <button key={i} onClick={action.onClick} className="kcard p-3 text-center hover:shadow-md transition-all active:scale-95">
            <div className="w-10 h-10 rounded-xl mx-auto mb-1.5 flex items-center justify-center" style={{ backgroundColor: `${action.color}15` }}>
              <action.icon className="w-5 h-5" style={{ color: action.color }} />
            </div>
            <span className="text-xs font-medium">{action.label}</span>
          </button>
        ))}
      </motion.div>

      {/* ── Escrow Status ── */}
      <motion.div variants={itemVariants} className="kcard-glass p-5 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Lock className="w-5 h-5 text-[#065F46] dark:text-[#34D399]" />
            <h3 className="font-bold text-sm">{l('Escrow Payments', 'Malipo ya Amana')}</h3>
          </div>
          <span className="text-[8px] px-1.5 py-0.5 rounded-full bg-[#FEF3C7] text-[#92400E] font-semibold">{escrowItems.length} {l('Active', 'Hai')}</span>
        </div>

        {/* Escrow Summary */}
        <div className="grid grid-cols-2 gap-3">
          <div className="p-3 rounded-xl bg-[#ECFDF5] dark:bg-[#064E3B]/30 border border-[#065F46]/10 dark:border-[#34D399]/10">
            <div className="flex items-center gap-1.5 mb-1">
              <Lock className="w-3.5 h-3.5 text-[#065F46] dark:text-[#34D399]" />
              <span className="text-[10px] font-medium text-[#065F46] dark:text-[#34D399]">{l('Held in Escrow', 'Imewekwa Amana')}</span>
            </div>
            <p className="text-lg font-bold text-[#065F46] dark:text-[#34D399]">TZS {escrowHeld.toLocaleString()}</p>
          </div>
          <div className="p-3 rounded-xl bg-[#FEF3C7] dark:bg-[#422006]/30 border border-[#F59E0B]/10">
            <div className="flex items-center gap-1.5 mb-1">
              <AlertTriangle className="w-3.5 h-3.5 text-[#F59E0B]" />
              <span className="text-[10px] font-medium text-[#92400E] dark:text-[#F59E0B]">{l('Disputed', 'Imepingwa')}</span>
            </div>
            <p className="text-lg font-bold text-[#92400E] dark:text-[#F59E0B]">TZS {escrowDisputed.toLocaleString()}</p>
          </div>
        </div>

        {/* Escrow Items */}
        <div className="space-y-2 max-h-48 overflow-y-auto">
          {escrowItems.map((item) => (
            <div key={item.id} className="flex items-center justify-between p-3 rounded-xl bg-white dark:bg-[#1E293B] border border-[#E2E8F0] dark:border-[#334155]">
              <div className="flex items-center gap-3 min-w-0">
                <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${
                  item.status === 'held' ? 'bg-[#ECFDF5] dark:bg-[#064E3B]' :
                  item.status === 'disputed' ? 'bg-[#FEF3C7] dark:bg-[#422006]' :
                  'bg-[#F1F5F9] dark:bg-[#334155]'
                }`}>
                  {item.status === 'held' ? <Lock className="w-4 h-4 text-[#065F46] dark:text-[#34D399]" /> :
                   item.status === 'disputed' ? <Scale className="w-4 h-4 text-[#F59E0B]" /> :
                   <Unlock className="w-4 h-4 text-[#64748B]" />}
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-medium truncate">{item.guideName}</p>
                  <p className="text-[10px] text-[#64748B]">{item.sessionId} · {item.date}</p>
                </div>
              </div>
              <div className="text-right shrink-0 ml-3">
                <p className="text-xs font-bold">TZS {item.amount.toLocaleString()}</p>
                <span className={`text-[8px] px-1.5 py-0.5 rounded-full font-semibold ${
                  item.status === 'held' ? 'bg-[#ECFDF5] text-[#065F46]' :
                  item.status === 'disputed' ? 'bg-[#FEF3C7] text-[#92400E]' :
                  'bg-[#F1F5F9] text-[#64748B]'
                }`}>
                  {item.status === 'held' ? l('Held', 'Imewekwa') :
                   item.status === 'disputed' ? l('Disputed', 'Imepingwa') :
                   l('Released', 'Imeachiliwa')}
                </span>
              </div>
            </div>
          ))}
        </div>

        {/* Escrow info */}
        <div className="flex items-start gap-2 p-3 rounded-xl bg-[#F1F5F9] dark:bg-[#334155] text-xs text-[#64748B]">
          <Shield className="w-4 h-4 shrink-0 mt-0.5 text-[#065F46] dark:text-[#34D399]" />
          <span>
            {l('Funds are held in escrow until session completion. Auto-release after 48 hours. File a dispute if there\'s an issue.', 'Pesa zinawekwa kwenye amana hadi kipindi kikamilike. Zitaachiliwa baada ya masaa 48. Wasilisha tatizo kama kuna shida.')}
          </span>
        </div>
      </motion.div>

      {/* Payment Providers Quick Top Up */}
      <motion.div variants={itemVariants} className="kcard-glass p-5 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Building2 className="w-5 h-5 text-[#065F46] dark:text-[#34D399]" />
            <h3 className="font-bold text-sm">{l('Top Up Wallet', 'Weka Pesa Mkobani')}</h3>
          </div>
          <span className="text-[8px] px-1.5 py-0.5 rounded-full bg-[#ECFDF5] text-[#065F46] font-semibold">{l('3 Methods', 'Njia 3')}</span>
        </div>

        {/* Provider Cards */}
        <div className="space-y-2">
          {(Object.entries(PROVIDER_CONFIG) as [PaymentProvider, typeof PROVIDER_CONFIG[PaymentProvider]][]).map(([key, config]) => {
            const Icon = config.icon;
            return (
              <button
                key={key}
                onClick={() => { setSelectedProvider(key); setTopUpAmount(0); setPaymentState('idle'); setShowTopUp(true); }}
                className="w-full kcard p-3.5 flex items-center justify-between hover:shadow-md transition-all active:scale-[0.98]"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: `${config.color}15` }}>
                    <Icon className="w-5 h-5" style={{ color: config.color }} />
                  </div>
                  <div className="text-left">
                    <p className="text-sm font-medium">{sw ? config.nameSw : config.name}</p>
                    <p className="text-xs text-[#64748B]">{sw ? config.descriptionSw : config.description}</p>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-[#64748B]" />
              </button>
            );
          })}
        </div>
      </motion.div>

      {/* Saved Payment Methods */}
      <motion.div variants={itemVariants}>
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-bold text-sm">{l('Saved Payment Methods', 'Njia za Malipo Zilizohifadhiwa')}</h3>
          <button className="text-xs text-[#065F46] dark:text-[#34D399] font-semibold">{l('+ Add New', '+ Ongeza')}</button>
        </div>
        <div className="space-y-2">
          {SAVED_METHODS.map((method) => {
            const config = PROVIDER_CONFIG[method.provider];
            const Icon = config?.icon || Smartphone;
            return (
              <div key={method.id} className="kcard p-3.5 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: `${method.color}15` }}>
                    <Icon className="w-5 h-5" style={{ color: method.color }} />
                  </div>
                  <div>
                    <p className="text-sm font-medium">{method.label}</p>
                    <p className="text-xs text-[#64748B]">{method.detail} · {method.lastUsed}</p>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-[#64748B]" />
              </div>
            );
          })}
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
                <div className="flex items-center gap-2">
                  <p className="text-sm font-medium">{tx.description}</p>
                  {getProviderBadge(tx.provider)}
                </div>
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

      {/* ── Top Up Modal ── */}
      <AnimatePresence>
        {showTopUp && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/50 flex items-end justify-center"
            onClick={() => { if (!processing && paymentState !== 'processing') { setShowTopUp(false); setPaymentState('idle'); } }}
          >
            <motion.div
              initial={{ y: 300 }}
              animate={{ y: 0 }}
              exit={{ y: 300 }}
              transition={{ type: 'spring', damping: 25 }}
              className="w-full max-w-lg bg-white dark:bg-[#1E293B] rounded-t-3xl p-6 space-y-4 max-h-[90vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-bold flex items-center gap-2">
                  {(() => { const Icon = PROVIDER_CONFIG[selectedProvider].icon; return <Icon className="w-5 h-5" style={{ color: PROVIDER_CONFIG[selectedProvider].color }} />; })()}
                  {l('Top Up Wallet', 'Weka Pesa Mkobani')}
                </h3>
                <button
                  onClick={() => { if (!processing && paymentState !== 'processing') { setShowTopUp(false); setPaymentState('idle'); } }}
                  className="w-8 h-8 rounded-full bg-[#F1F5F9] dark:bg-[#334155] flex items-center justify-center"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Provider Tabs */}
              {paymentState === 'idle' && (
                <div className="flex gap-2">
                  {(Object.entries(PROVIDER_CONFIG) as [PaymentProvider, typeof PROVIDER_CONFIG[PaymentProvider]][]).map(([key, config]) => {
                    const Icon = config.icon;
                    return (
                      <button
                        key={key}
                        onClick={() => setSelectedProvider(key)}
                        className={`flex-1 p-2.5 rounded-xl text-center transition-all border-2 ${
                          selectedProvider === key ? 'border-current bg-opacity-5' : 'border-transparent bg-[#F1F5F9] dark:bg-[#334155]'
                        }`}
                        style={selectedProvider === key ? { borderColor: config.color, backgroundColor: `${config.color}08` } : {}}
                      >
                        <Icon className="w-4 h-4 mx-auto mb-1" style={{ color: config.color }} />
                        <span className="text-[10px] font-semibold" style={{ color: selectedProvider === key ? config.color : '#64748B' }}>
                          {sw ? config.nameSw : config.name}
                        </span>
                      </button>
                    );
                  })}
                </div>
              )}

              {/* Success State */}
              {paymentState === 'success' && (
                <div className="text-center py-8">
                  <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="w-16 h-16 rounded-full bg-[#ECFDF5] dark:bg-[#064E3B] flex items-center justify-center mx-auto mb-3">
                    <CheckCircle2 className="w-8 h-8 text-[#10B981]" />
                  </motion.div>
                  <p className="font-bold text-lg text-[#10B981]">{l('Top Up Successful!', 'Kupakia Imefanikiwa!')}</p>
                  <p className="text-sm text-[#64748B] mt-1">
                    TZS {topUpAmount.toLocaleString()} {l('added to your wallet', 'imeongezwa kwenye mkoba wako')}
                  </p>
                  {paymentReceipt && (
                    <p className="text-xs text-[#64748B] mt-2">
                      {l('Reference', 'Rejea')}: <span className="font-mono font-semibold">{paymentReceipt}</span>
                    </p>
                  )}
                </div>
              )}

              {/* Failed State */}
              {paymentState === 'failed' && (
                <div className="text-center py-8">
                  <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="w-16 h-16 rounded-full bg-[#FEE2E2] dark:bg-[#2D1B1B] flex items-center justify-center mx-auto mb-3">
                    <XCircle className="w-8 h-8 text-[#DC2626]" />
                  </motion.div>
                  <p className="font-bold text-lg text-[#DC2626]">{l('Top Up Failed', 'Kupakika Kumefeli')}</p>
                  <p className="text-sm text-[#64748B] mt-1">{l('Please try again', 'Tafadhali jaribu tena')}</p>
                  <button onClick={() => setPaymentState('idle')} className="mt-4 px-6 py-2 rounded-xl bg-[#065F46] text-white text-sm font-semibold">{l('Try Again', 'Jaribu Tena')}</button>
                </div>
              )}

              {/* Processing State */}
              {paymentState === 'processing' && (
                <div className="text-center py-8">
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ repeat: Infinity, duration: 2, ease: 'linear' }}
                    className="w-16 h-16 rounded-full bg-[#ECFDF5] dark:bg-[#064E3B] flex items-center justify-center mx-auto mb-3"
                  >
                    {(() => { const Icon = PROVIDER_CONFIG[selectedProvider].icon; return <Icon className="w-8 h-8" style={{ color: PROVIDER_CONFIG[selectedProvider].color }} />; })()}
                  </motion.div>
                  <p className="font-bold text-lg">{l('Processing Payment...', 'Inachakata Malipo...')}</p>
                  <p className="text-sm text-[#64748B] mt-1">
                    {selectedProvider === 'pesapal'
                      ? l('Check your phone for the mobile money prompt', 'Angalia simu yako kwa ombi la pesa ya simu')
                      : selectedProvider === 'stripe'
                      ? l('Redirecting to Stripe checkout...', 'Inaelekeza kwenye Stripe...')
                      : l('Redirecting to PayPal...', 'Inaelekeza kwenye PayPal...')}
                  </p>
                  <div className="flex items-center justify-center gap-2 mt-3" style={{ color: PROVIDER_CONFIG[selectedProvider].color }}>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span className="text-sm font-medium">{l('Please wait...', 'Tafadhali subiri...')}</span>
                  </div>
                </div>
              )}

              {/* Idle State - Form */}
              {paymentState === 'idle' && (
                <>
                  {/* Summary */}
                  <div className="p-4 rounded-xl bg-[#ECFDF5] dark:bg-[#064E3B]/30 border border-[#065F46]/20 dark:border-[#34D399]/20">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-medium text-[#065F46] dark:text-[#34D399]">{l('Amount', 'Kiasi')}</span>
                      <span className="text-2xl font-bold text-[#065F46] dark:text-[#34D399]">TZS {topUpAmount.toLocaleString()}</span>
                    </div>
                    <div className="flex items-center justify-between text-xs text-[#64748B]">
                      <span>{l('Via', 'Kupitia')}: {PROVIDER_CONFIG[selectedProvider].name}</span>
                      <span className="flex items-center gap-1"><Shield className="w-3 h-3" />{l('Secured', 'Imelindwa')}</span>
                    </div>
                  </div>

                  {/* Amount Selection */}
                  <div>
                    <label className="text-sm font-medium mb-2 block">{l('Select Amount (TZS)', 'Chagua Kiasi (TZS)')}</label>
                    <div className="grid grid-cols-4 gap-2">
                      {TOP_UP_PRESETS.map(amt => (
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

                  {/* Phone Number (Pesapal) */}
                  {selectedProvider === 'pesapal' && (
                    <div>
                      <label className="text-sm font-medium mb-1 block">{l('Phone Number', 'Nambari ya Simu')}</label>
                      <div className="relative">
                        <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#64748B]" />
                        <input value={phoneNumber} onChange={e => setPhoneNumber(e.target.value)} className="kinput w-full pl-10" placeholder="0712 345 678" />
                      </div>
                    </div>
                  )}

                  {/* Email (Stripe / PayPal) */}
                  {(selectedProvider === 'stripe' || selectedProvider === 'paypal') && (
                    <div>
                      <label className="text-sm font-medium mb-1 block">{l('Email Address', 'Barua Pepe')}</label>
                      <input value={emailAddress} onChange={e => setEmailAddress(e.target.value)} className="kinput w-full" placeholder="you@example.com" />
                    </div>
                  )}

                  {/* Info Box */}
                  <div className="flex items-start gap-2 p-3 rounded-xl bg-[#F1F5F9] dark:bg-[#334155] text-xs text-[#64748B]">
                    <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                    <span>
                      {selectedProvider === 'pesapal'
                        ? l('You will receive a mobile money push notification. Enter your PIN to confirm.', 'Utapokea arifa la pesa ya simu. Ingiza PIN yako kuthibitisha.')
                        : selectedProvider === 'stripe'
                        ? l('You will be redirected to Stripe secure checkout to complete payment.', 'Utaelekezwa kwenye Stripe kulipia kwa usalama.')
                        : l('You will be redirected to PayPal to authorize the payment.', 'Utaelekezwa kwenye PayPal kuidhinisha malipo.')}
                    </span>
                  </div>

                  {/* Submit Button */}
                  <button
                    onClick={handleTopUp}
                    disabled={topUpAmount <= 0 || processing || (selectedProvider === 'pesapal' && !phoneNumber) || ((selectedProvider === 'stripe' || selectedProvider === 'paypal') && !emailAddress)}
                    className="w-full py-3 rounded-xl font-bold text-sm text-white transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2"
                    style={{ backgroundColor: PROVIDER_CONFIG[selectedProvider].color }}
                  >
                    <Zap className="w-4 h-4" />
                    {l('Top Up via', 'Weka kupitia')} {PROVIDER_CONFIG[selectedProvider].name}
                  </button>
                </>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Withdraw Modal ── */}
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

              {paymentState === 'success' ? (
                <div className="text-center py-8">
                  <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="w-16 h-16 rounded-full bg-[#ECFDF5] flex items-center justify-center mx-auto mb-3">
                    <CheckCircle2 className="w-8 h-8 text-[#10B981]" />
                  </motion.div>
                  <p className="font-bold text-lg">{l('Withdrawal Initiated!', 'Utoaji Umeanza!')}</p>
                  <p className="text-sm text-[#64748B]">TZS {withdrawAmount.toLocaleString()} {l('being sent via Pesapal', 'inatumwa kupitia Pesapal')}</p>
                </div>
              ) : (
                <>
                  <div className="p-3 rounded-xl bg-[#FEF3C7] dark:bg-[#422006] text-[#F59E0B] text-xs flex items-center gap-2">
                    <Shield className="w-4 h-4 shrink-0" />
                    {l('Available for withdrawal', 'Inayopatikana kwa utoaji')}: TZS {availableBalance.toLocaleString()}
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-1 block">{l('Amount (TZS)', 'Kiasi (TZS)')}</label>
                    <input type="number" value={withdrawAmount || ''} onChange={e => setWithdrawAmount(Number(e.target.value))} placeholder={l('Enter amount', 'Ingiza kiasi')} className="kinput w-full" />
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-1 block">{l('Phone Number', 'Nambari ya Simu')}</label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#64748B]" />
                      <input value={phoneNumber} onChange={e => setPhoneNumber(e.target.value)} className="kinput w-full pl-10" placeholder="0712 345 678" />
                    </div>
                  </div>
                  <div className="p-3 rounded-xl bg-[#F1F5F9] dark:bg-[#334155] text-xs text-[#64748B] flex items-center gap-2">
                    <Smartphone className="w-4 h-4 shrink-0" style={{ color: '#4CAF50' }} />
                    {l('Withdraws via Pesapal (M-Pesa, Tigo, Airtel)', 'Utoaji kupitia Pesapal (M-Pesa, Tigo, Airtel)')}
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

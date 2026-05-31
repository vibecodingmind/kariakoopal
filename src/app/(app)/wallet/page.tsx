'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Wallet as WalletIcon, ArrowUpRight, ArrowDownLeft, Plus, Send,
  Clock, CheckCircle2, XCircle, Smartphone, Shield, CreditCard,
  QrCode, X, TrendingUp, Receipt, ChevronRight, Zap,
} from 'lucide-react';
import { useAuthStore } from '@/lib/stores/auth-store';
import { useNotificationStore } from '@/lib/stores/notification-store';

// ── Types ──

type FilterTab = 'all' | 'deposits' | 'withdrawals' | 'payments';
type PaymentProvider = 'mpesa' | 'tigo' | 'airtel';

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
  const { user, walletBalance, setWalletBalance } = useAuthStore();
  const { addNotification } = useNotificationStore();

  const [filter, setFilter] = useState<FilterTab>('all');
  const [showTopUp, setShowTopUp] = useState(false);
  const [showWithdraw, setShowWithdraw] = useState(false);
  const [topUpAmount, setTopUpAmount] = useState(0);
  const [withdrawAmount, setWithdrawAmount] = useState(0);
  const [phoneNumber, setPhoneNumber] = useState(user?.phone || '');
  const [processing, setProcessing] = useState(false);
  const [success, setSuccess] = useState(false);
  const [selectedProvider, setSelectedProvider] = useState<PaymentProvider>('mpesa');

  const pendingBalance = 75000;
  const availableBalance = walletBalance - pendingBalance;
  const usdEquivalent = (walletBalance / 2600).toFixed(2); // Approximate TZS to USD

  const filtered = DEMO_TRANSACTIONS.filter(t => {
    if (filter === 'all') return true;
    if (filter === 'deposits') return t.type === 'deposit' || t.type === 'refund';
    if (filter === 'withdrawals') return t.type === 'withdrawal';
    if (filter === 'payments') return t.type === 'payment' || t.type === 'subscription';
    return true;
  });

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
        <h1 className="text-2xl font-bold text-[#065F46] dark:text-[#34D399]">Wallet</h1>
        <p className="text-sm text-[#64748B] mt-1">Manage your funds and mobile payments</p>
      </motion.div>

      {/* Balance Card */}
      <motion.div
        variants={itemVariants}
        className="kcard-green p-6 relative overflow-hidden"
      >
        <div className="relative z-10">
          <div className="flex items-center justify-between mb-1">
            <span className="text-sm text-white/70">Total Balance</span>
            <Shield className="w-4 h-4 text-[#F59E0B]" />
          </div>
          <p className="text-4xl font-bold text-white tracking-tight">TZS {walletBalance.toLocaleString()}</p>
          <p className="text-sm text-white/50 mt-1">≈ USD {usdEquivalent}</p>

          <div className="grid grid-cols-2 gap-3 mt-5">
            <div className="p-3 rounded-xl bg-white/10 backdrop-blur-sm">
              <p className="text-xs text-white/60">Available</p>
              <p className="text-lg font-bold text-[#F59E0B]">TZS {availableBalance.toLocaleString()}</p>
            </div>
            <div className="p-3 rounded-xl bg-white/10 backdrop-blur-sm">
              <p className="text-xs text-white/60">Pending</p>
              <p className="text-lg font-bold text-white">TZS {pendingBalance.toLocaleString()}</p>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Quick Actions */}
      <motion.div variants={itemVariants} className="grid grid-cols-4 gap-3">
        {[
          { icon: Plus, label: 'Top Up', color: '#10B981', onClick: () => setShowTopUp(true) },
          { icon: ArrowUpRight, label: 'Withdraw', color: '#F59E0B', onClick: () => setShowWithdraw(true) },
          { icon: Send, label: 'Send', color: '#0891B2', onClick: () => {} },
          { icon: QrCode, label: 'Receive', color: '#7C3AED', onClick: () => {} },
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

      {/* M-Pesa Integration Section */}
      <motion.div variants={itemVariants} className="kcard-glass p-5 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Smartphone className="w-5 h-5 text-[#4CAF50]" />
            <h3 className="font-bold text-sm">Mobile Money</h3>
          </div>
          <span className="kbadge kbadge-verified text-[8px]">Instant</span>
        </div>

        <div className="space-y-3">
          <div>
            <label className="text-xs font-medium text-[#64748B] mb-1.5 block">Phone Number</label>
            <input
              value={phoneNumber}
              onChange={e => setPhoneNumber(e.target.value)}
              className="kinput w-full"
              placeholder="0712 345 678"
            />
          </div>

          <div>
            <label className="text-xs font-medium text-[#64748B] mb-2 block">Quick Amount (TZS)</label>
            <div className="grid grid-cols-4 gap-2">
              {MPESA_PRESETS.map(amt => (
                <button
                  key={amt}
                  onClick={() => setTopUpAmount(amt)}
                  className={`py-2 rounded-xl text-xs font-semibold transition-all ${
                    topUpAmount === amt
                      ? 'bg-[#065F46] text-white dark:bg-[#34D399] dark:text-[#022C22]'
                      : 'bg-[#F1F5F9] dark:bg-[#334155] text-[#64748B] dark:text-[#94A3B8] hover:bg-[#E2E8F0] dark:hover:bg-[#475569]'
                  }`}
                >
                  {(amt / 1000).toFixed(0)}K
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-xs font-medium text-[#64748B] mb-2 block">Payment Provider</label>
            <div className="grid grid-cols-3 gap-2">
              {(['mpesa', 'tigo', 'airtel'] as PaymentProvider[]).map(provider => (
                <button
                  key={provider}
                  onClick={() => setSelectedProvider(provider)}
                  className={`p-3 rounded-xl text-center transition-all border-2 ${
                    selectedProvider === provider
                      ? 'border-current bg-opacity-10'
                      : 'border-transparent bg-[#F1F5F9] dark:bg-[#334155]'
                  }`}
                  style={selectedProvider === provider ? { borderColor: getProviderColor(provider), backgroundColor: `${getProviderColor(provider)}15` } : {}}
                >
                  <Smartphone className="w-5 h-5 mx-auto mb-1" style={{ color: getProviderColor(provider) }} />
                  <span className="text-xs font-semibold" style={{ color: selectedProvider === provider ? getProviderColor(provider) : undefined }}>
                    {getProviderName(provider)}
                  </span>
                </button>
              ))}
            </div>
          </div>

          <button
            onClick={() => { if (topUpAmount > 0) setShowTopUp(true); }}
            disabled={topUpAmount <= 0}
            className="w-full py-3 rounded-xl font-bold text-sm text-white transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2"
            style={{ backgroundColor: getProviderColor(selectedProvider) }}
          >
            <Zap className="w-4 h-4" />
            Pay with {getProviderName(selectedProvider)}
          </button>
        </div>
      </motion.div>

      {/* Payment Methods */}
      <motion.div variants={itemVariants}>
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-bold text-sm">Saved Payment Methods</h3>
          <button className="text-xs text-[#065F46] dark:text-[#34D399] font-semibold">+ Add New</button>
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
          <h3 className="font-bold text-sm">Transaction History</h3>
          <Receipt className="w-4 h-4 text-[#64748B]" />
        </div>
        <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-2">
          {(['all', 'deposits', 'withdrawals', 'payments'] as FilterTab[]).map(tab => (
            <button
              key={tab}
              onClick={() => setFilter(tab)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors ${
                filter === tab ? 'bg-[#065F46] text-white' : 'bg-[#F1F5F9] dark:bg-[#334155] text-[#64748B]'
              }`}
            >
              {tab === 'all' ? 'All' :
               tab === 'deposits' ? 'Deposits' :
               tab === 'withdrawals' ? 'Withdrawals' :
               'Payments'}
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

      {/* Top Up Modal */}
      <AnimatePresence>
        {showTopUp && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/50 flex items-end justify-center"
            onClick={() => !processing && setShowTopUp(false)}
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
                <h3 className="text-lg font-bold">Top Up Wallet</h3>
                <button onClick={() => !processing && setShowTopUp(false)} className="w-8 h-8 rounded-full bg-[#F1F5F9] dark:bg-[#334155] flex items-center justify-center">
                  <X className="w-4 h-4" />
                </button>
              </div>

              {success ? (
                <div className="text-center py-8">
                  <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="w-16 h-16 rounded-full bg-[#ECFDF5] flex items-center justify-center mx-auto mb-3">
                    <CheckCircle2 className="w-8 h-8 text-[#10B981]" />
                  </motion.div>
                  <p className="font-bold text-lg">Top Up Successful!</p>
                  <p className="text-sm text-[#64748B]">TZS {topUpAmount.toLocaleString()} added to your wallet</p>
                </div>
              ) : (
                <>
                  <div>
                    <label className="text-sm font-medium mb-2 block">Select Amount (TZS)</label>
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
                  <div>
                    <label className="text-sm font-medium mb-1 block">Custom Amount</label>
                    <input
                      type="number"
                      value={topUpAmount || ''}
                      onChange={e => setTopUpAmount(Number(e.target.value))}
                      placeholder="TZS"
                      className="kinput w-full"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-1 block">Phone Number</label>
                    <input value={phoneNumber} onChange={e => setPhoneNumber(e.target.value)} className="kinput w-full" placeholder="0712 345 678" />
                  </div>
                  <button
                    onClick={handleTopUp}
                    disabled={topUpAmount <= 0 || processing}
                    className="kbtn w-full text-sm h-11 disabled:opacity-50"
                  >
                    {processing ? (
                      <span className="flex items-center gap-2"><Clock className="w-4 h-4 animate-spin" />Processing...</span>
                    ) : (
                      <span className="flex items-center gap-2"><Plus className="w-4 h-4" />Top Up TZS {topUpAmount.toLocaleString()}</span>
                    )}
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
                <h3 className="text-lg font-bold">Withdraw Funds</h3>
                <button onClick={() => !processing && setShowWithdraw(false)} className="w-8 h-8 rounded-full bg-[#F1F5F9] dark:bg-[#334155] flex items-center justify-center">
                  <X className="w-4 h-4" />
                </button>
              </div>

              {success ? (
                <div className="text-center py-8">
                  <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="w-16 h-16 rounded-full bg-[#ECFDF5] flex items-center justify-center mx-auto mb-3">
                    <CheckCircle2 className="w-8 h-8 text-[#10B981]" />
                  </motion.div>
                  <p className="font-bold text-lg">Withdrawal Initiated!</p>
                  <p className="text-sm text-[#64748B]">TZS {withdrawAmount.toLocaleString()} being sent to {getProviderName(selectedProvider)}</p>
                </div>
              ) : (
                <>
                  <div className="p-3 rounded-xl bg-[#FEF3C7] dark:bg-[#422006] text-[#F59E0B] text-xs flex items-center gap-2">
                    <Shield className="w-4 h-4 shrink-0" />
                    Available for withdrawal: TZS {availableBalance.toLocaleString()}
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-1 block">Amount (TZS)</label>
                    <input
                      type="number"
                      value={withdrawAmount || ''}
                      onChange={e => setWithdrawAmount(Number(e.target.value))}
                      placeholder="Enter amount"
                      className="kinput w-full"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-2 block">Withdrawal Method</label>
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
                    <label className="text-sm font-medium mb-1 block">Phone Number</label>
                    <input value={phoneNumber} onChange={e => setPhoneNumber(e.target.value)} className="kinput w-full" placeholder="0712 345 678" />
                  </div>
                  <button
                    onClick={handleWithdraw}
                    disabled={withdrawAmount <= 0 || withdrawAmount > availableBalance || processing}
                    className="kbtn-yellow w-full text-sm h-11 disabled:opacity-50"
                  >
                    {processing ? (
                      <span className="flex items-center gap-2"><Clock className="w-4 h-4 animate-spin" />Processing...</span>
                    ) : (
                      <span className="flex items-center gap-2"><ArrowUpRight className="w-4 h-4" />Withdraw TZS {withdrawAmount.toLocaleString()}</span>
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

'use client';

import { useState } from 'react';
import { useAuthStore } from '@/lib/stores/auth-store';
import { useNotificationStore } from '@/lib/stores/notification-store';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Wallet as WalletIcon, ArrowUpRight, ArrowDownLeft, Plus, Minus,
  Send, Clock, CheckCircle2, XCircle, Filter, CreditCard, Smartphone,
  ChevronRight, X, TrendingUp, Shield
} from 'lucide-react';

// ── Demo Transaction Data ──

const DEMO_TRANSACTIONS = [
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

const PRESET_AMOUNTS = [5000, 10000, 25000, 50000, 100000];

type FilterTab = 'all' | 'deposits' | 'withdrawals' | 'payments' | 'refunds';

export default function WalletPage() {
  const { user, language, walletBalance, setWalletBalance } = useAuthStore();
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

  const pendingBalance = 75000;
  const availableBalance = walletBalance - pendingBalance;

  const filtered = DEMO_TRANSACTIONS.filter(t => {
    if (filter === 'all') return true;
    if (filter === 'deposits') return t.type === 'deposit';
    if (filter === 'withdrawals') return t.type === 'withdrawal';
    if (filter === 'payments') return t.type === 'payment';
    if (filter === 'refunds') return t.type === 'refund' || t.type === 'subscription';
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
        title: sw ? 'Amana Imefanikiwa' : 'Top Up Successful',
        message: `TZS ${topUpAmount.toLocaleString()} ${sw ? 'imeongezwa kwenye mkoba wako' : 'added to your wallet'}`,
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
        title: sw ? 'Utoaji Umefanikiwa' : 'Withdrawal Initiated',
        message: `TZS ${withdrawAmount.toLocaleString()} ${sw ? 'inatolewa kwa M-Pesa' : 'being sent to M-Pesa'}`,
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
      case 'payment': return <Minus className="w-4 h-4 text-[#DC2626]" />;
      case 'refund': return <ArrowDownLeft className="w-4 h-4 text-[#0891B2]" />;
      case 'subscription': return <CreditCard className="w-4 h-4 text-[#7C3AED]" />;
      default: return <WalletIcon className="w-4 h-4" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed': return <span className="kbadge kbadge-verified text-[8px]">{l('Done', 'Imekamilika')}</span>;
      case 'pending': return <span className="kbadge kbadge-pending text-[8px]">{l('Pending', 'Inasubiri')}</span>;
      case 'failed': return <span className="kbadge kbadge-urgent text-[8px]">{l('Failed', 'Imeshindwa')}</span>;
      default: return null;
    }
  };

  return (
    <div className="px-4 py-4 space-y-5">
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-2xl font-bold text-[#065F46] dark:text-[#34D399]">{l('Wallet', 'Mkoba')}</h1>
        <p className="text-sm text-[#64748B] mt-1">{l('Manage your funds and transactions', 'Simamia pesa zako na miamala')}</p>
      </motion.div>

      {/* Balance Card */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="kcard-green p-5">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm text-white/70">{l('Total Balance', 'Salio Jumla')}</span>
          <Shield className="w-4 h-4 text-[#F59E0B]" />
        </div>
        <p className="text-3xl font-bold text-white">TZS {walletBalance.toLocaleString()}</p>
        <div className="grid grid-cols-2 gap-3 mt-4">
          <div className="p-3 rounded-lg bg-white/10">
            <p className="text-xs text-white/60">{l('Available', 'Inapatikana')}</p>
            <p className="text-lg font-bold text-[#F59E0B]">TZS {availableBalance.toLocaleString()}</p>
          </div>
          <div className="p-3 rounded-lg bg-white/10">
            <p className="text-xs text-white/60">{l('Pending', 'Inasubiri')}</p>
            <p className="text-lg font-bold text-white">TZS {pendingBalance.toLocaleString()}</p>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3 mt-4">
          <button onClick={() => setShowTopUp(true)} className="kbtn-yellow text-sm py-2.5 flex items-center justify-center gap-1.5">
            <Plus className="w-4 h-4" />{l('Top Up', 'Weka Pesa')}
          </button>
          <button onClick={() => setShowWithdraw(true)} className="bg-white/15 text-white font-semibold rounded-xl py-2.5 text-sm flex items-center justify-center gap-1.5 hover:bg-white/20 transition-colors">
            <ArrowUpRight className="w-4 h-4" />{l('Withdraw', 'Toa Pesa')}
          </button>
        </div>
      </motion.div>

      {/* Quick Actions */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} className="grid grid-cols-3 gap-3">
        {[
          { icon: Send, label: l('Send', 'Tuma'), color: '#0891B2' },
          { icon: Smartphone, label: l('M-Pesa', 'M-Pesa'), color: '#065F46' },
          { icon: TrendingUp, label: l('Statement', 'Taarifa'), color: '#F59E0B' },
        ].map((action, i) => (
          <button key={i} className="kcard p-3 text-center hover:shadow-md transition-all active:scale-95">
            <action.icon className="w-5 h-5 mx-auto mb-1.5" style={{ color: action.color }} />
            <span className="text-xs font-medium">{action.label}</span>
          </button>
        ))}
      </motion.div>

      {/* Filter Tabs */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-bold">{l('Transaction History', 'Historia ya Miamala')}</h2>
          <Filter className="w-4 h-4 text-[#64748B]" />
        </div>
        <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-2">
          {(['all', 'deposits', 'withdrawals', 'payments', 'refunds'] as FilterTab[]).map(tab => (
            <button
              key={tab}
              onClick={() => setFilter(tab)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors ${
                filter === tab ? 'bg-[#065F46] text-white' : 'bg-[#F1F5F9] dark:bg-[#334155] text-[#64748B]'
              }`}
            >
              {tab === 'all' ? l('All', 'Zote') :
               tab === 'deposits' ? l('Deposits', 'Amana') :
               tab === 'withdrawals' ? l('Withdrawals', 'Utoaji') :
               tab === 'payments' ? l('Payments', 'Malipo') :
               l('Refunds', 'Rudisho')}
            </button>
          ))}
        </div>
      </motion.div>

      {/* Transaction List */}
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
                tx.type === 'deposit' || tx.type === 'refund' ? 'bg-[#ECFDF5]' :
                tx.type === 'withdrawal' ? 'bg-[#FEF3C7]' :
                tx.type === 'subscription' ? 'bg-[#F3E8FF]' : 'bg-[#FEE2E2]'
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
                <h3 className="text-lg font-bold">{l('Top Up Wallet', 'Weka Pesa kwenye Mkoba')}</h3>
                <button onClick={() => !processing && setShowTopUp(false)} className="w-8 h-8 rounded-full bg-[#F1F5F9] dark:bg-[#334155] flex items-center justify-center">
                  <X className="w-4 h-4" />
                </button>
              </div>

              {success ? (
                <div className="text-center py-8">
                  <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="w-16 h-16 rounded-full bg-[#ECFDF5] flex items-center justify-center mx-auto mb-3">
                    <CheckCircle2 className="w-8 h-8 text-[#10B981]" />
                  </motion.div>
                  <p className="font-bold text-lg">{l('Top Up Successful!', 'Amana Imefanikiwa!')}</p>
                  <p className="text-sm text-[#64748B]">TZS {topUpAmount.toLocaleString()} {l('added to your wallet', 'imeongezwa kwenye mkoba wako')}</p>
                </div>
              ) : (
                <>
                  <div>
                    <label className="text-sm font-medium mb-2 block">{l('Select Amount', 'Chagua Kiasi')}</label>
                    <div className="grid grid-cols-3 gap-2">
                      {PRESET_AMOUNTS.map(amt => (
                        <button
                          key={amt}
                          onClick={() => setTopUpAmount(amt)}
                          className={`py-2.5 rounded-xl text-sm font-medium transition-all ${
                            topUpAmount === amt ? 'bg-[#065F46] text-white' : 'bg-[#F1F5F9] dark:bg-[#334155] text-[#64748B]'
                          }`}
                        >
                          {amt >= 1000 ? `${amt / 1000}K` : amt}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-1 block">{l('Or enter custom amount', 'Au weka kiasi cha kawaida')}</label>
                    <input
                      type="number"
                      value={topUpAmount || ''}
                      onChange={e => setTopUpAmount(Number(e.target.value))}
                      placeholder="TZS"
                      className="kinput w-full"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-1 block">{l('M-Pesa Phone Number', 'Namba ya Simu ya M-Pesa')}</label>
                    <input value={phoneNumber} onChange={e => setPhoneNumber(e.target.value)} className="kinput w-full" placeholder="0712 345 678" />
                  </div>
                  <button
                    onClick={handleTopUp}
                    disabled={topUpAmount <= 0 || processing}
                    className="kbtn w-full text-sm h-11 disabled:opacity-50"
                  >
                    {processing ? (
                      <span className="flex items-center gap-2"><Clock className="w-4 h-4 animate-spin" />{l('Processing...', 'Inachakata...')}</span>
                    ) : (
                      <span className="flex items-center gap-2"><Plus className="w-4 h-4" />{l('Top Up TZS', 'Weka TZS')} {topUpAmount.toLocaleString()}</span>
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
                  <p className="text-sm text-[#64748B]">TZS {withdrawAmount.toLocaleString()} {l('being sent to your M-Pesa', 'inatolewa kwa M-Pesa yako')}</p>
                </div>
              ) : (
                <>
                  <div className="p-3 rounded-xl bg-[#FEF3C7] text-[#F59E0B] text-xs flex items-center gap-2">
                    <Shield className="w-4 h-4 shrink-0" />
                    {l('Available for withdrawal: TZS', 'Inapatikana kwa utoaji: TZS')} {availableBalance.toLocaleString()}
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-1 block">{l('Amount (TZS)', 'Kiasi (TZS)')}</label>
                    <input
                      type="number"
                      value={withdrawAmount || ''}
                      onChange={e => setWithdrawAmount(Number(e.target.value))}
                      placeholder="Enter amount"
                      className="kinput w-full"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-2 block">{l('Withdrawal Method', 'Njia ya Utoaji')}</label>
                    <div className="grid grid-cols-3 gap-2">
                      {['M-Pesa', 'Tigo Pesa', 'Airtel Money'].map(method => (
                        <button key={method} className="kcard p-2.5 text-center text-xs font-medium hover:border-[#065F46] transition-colors">
                          <Smartphone className="w-4 h-4 mx-auto mb-1 text-[#065F46]" />{method}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-1 block">{l('Phone Number', 'Namba ya Simu')}</label>
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
                      <span className="flex items-center gap-2"><ArrowUpRight className="w-4 h-4" />{l('Withdraw TZS', 'Toa TZS')} {withdrawAmount.toLocaleString()}</span>
                    )}
                  </button>
                </>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

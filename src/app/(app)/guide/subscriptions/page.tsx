'use client';

import { useState } from 'react';
import { useAuthStore } from '@/lib/stores/auth-store';
import { useNotificationStore } from '@/lib/stores/notification-store';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Crown, Zap, Shield, Check, Star, BarChart3, MapPin, Trophy,
  Clock, CreditCard, Smartphone, Sparkles, ChevronRight, X, ArrowRight
} from 'lucide-react';

const TIERS = [
  {
    id: 'starter' as const,
    name: 'Starter',
    price: 0,
    icon: Shield,
    color: 'from-slate-400 to-slate-500',
    bgColor: 'bg-[#F1F5F9] dark:bg-[#334155]',
    features: [
      { text: 'Basic matching', included: true },
      { text: '3 sessions/day', included: true },
      { text: 'Standard support', included: true },
      { text: 'Unlimited sessions', included: false },
      { text: 'Priority matching', included: false },
      { text: 'Analytics dashboard', included: false },
      { text: 'Featured on homepage', included: false },
      { text: 'Exclusive zones access', included: false },
    ],
  },
  {
    id: 'pro' as const,
    name: 'Pro',
    price: 15000,
    icon: Zap,
    color: 'from-amber-500 to-orange-500',
    bgColor: 'bg-[#FEF3C7] dark:bg-[#3D2E0A]',
    popular: true,
    features: [
      { text: 'Basic matching', included: true },
      { text: '3 sessions/day', included: true },
      { text: 'Priority support', included: true },
      { text: 'Unlimited sessions', included: true },
      { text: 'Priority matching', included: true },
      { text: 'Analytics dashboard', included: true },
      { text: 'Featured on homepage', included: false },
      { text: 'Exclusive zones access', included: false },
    ],
  },
  {
    id: 'elite' as const,
    name: 'Elite',
    price: 35000,
    icon: Crown,
    color: 'from-[#065F46] to-[#34D399]',
    bgColor: 'bg-[#ECFDF5] dark:bg-[#022C22]',
    features: [
      { text: 'Basic matching', included: true },
      { text: 'Unlimited sessions', included: true },
      { text: 'VIP support', included: true },
      { text: 'Unlimited sessions', included: true },
      { text: 'Priority matching', included: true },
      { text: 'Full analytics suite', included: true },
      { text: 'Featured on homepage', included: true },
      { text: 'Exclusive zones access', included: true },
    ],
  },
];

const BILLING_HISTORY = [
  { id: 'b1', tier: 'Pro', amount: 15000, date: 'May 22, 2026', status: 'completed', method: 'M-Pesa' },
  { id: 'b2', tier: 'Pro', amount: 15000, date: 'Apr 22, 2026', status: 'completed', method: 'M-Pesa' },
  { id: 'b3', tier: 'Starter', amount: 0, date: 'Mar 22, 2026', status: 'completed', method: 'Free' },
];

export default function SubscriptionsPage() {
  const { language, subscriptionTier, setSubscriptionTier } = useAuthStore();
  const { addNotification } = useNotificationStore();
  const sw = language === 'sw';
  const l = (en: string, swText: string) => (sw ? swText : en);
  const [upgrading, setUpgrading] = useState<string | null>(null);
  const [showPayment, setShowPayment] = useState(false);
  const [selectedTier, setSelectedTier] = useState<string | null>(null);
  const [mpesaPhone, setMpesaPhone] = useState('');
  const [processing, setProcessing] = useState(false);
  const [success, setSuccess] = useState(false);
  const [autoRenew, setAutoRenew] = useState(true);

  const handleUpgrade = (tierId: string) => {
    if (tierId === subscriptionTier) return;
    setSelectedTier(tierId);
    if (tierId === 'starter') {
      setSubscriptionTier('starter');
      addNotification({
        userId: '',
        type: 'success',
        title: l('Subscription Downgraded', 'Usajili Umepunguzwa'),
        message: l('You are now on the Starter plan', 'Sasa uko kwenye mpango wa Starter'),
        read: false,
        actionUrl: '/guide/subscriptions',
      });
      return;
    }
    setShowPayment(true);
  };

  const handlePayment = () => {
    setProcessing(true);
    setTimeout(() => {
      setProcessing(false);
      setSuccess(true);
      setSubscriptionTier(selectedTier as 'starter' | 'pro' | 'elite');
      addNotification({
        userId: '',
        type: 'success',
        title: l('Subscription Updated!', 'Usajili Umehuishwa!'),
        message: l(`You are now on the ${selectedTier} plan`, `Sasa uko kwenye mpango wa ${selectedTier}`),
        read: false,
        actionUrl: '/guide/subscriptions',
      });
      setTimeout(() => {
        setSuccess(false);
        setShowPayment(false);
        setSelectedTier(null);
      }, 2000);
    }, 2500);
  };

  const currentTierData = TIERS.find(t => t.id === subscriptionTier) || TIERS[0];
  const daysRemaining = 18;

  return (
    <div className="px-4 py-4 space-y-5">
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-2xl font-bold text-[#065F46] dark:text-[#34D399]">{l('Subscription', 'Usajili')}</h1>
        <p className="text-sm text-[#64748B] mt-1">{l('Manage your guide subscription plan', 'Simamia mpango wako wa usajili')}</p>
      </motion.div>

      {/* Current Plan Card */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className={`kcard p-5 ${subscriptionTier !== 'starter' ? 'border-2 border-[#F59E0B]' : ''}`}>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2.5">
            <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${currentTierData.color} flex items-center justify-center`}>
              {(() => { const Icon = currentTierData.icon; return <Icon className="w-5 h-5 text-white" />; })()}
            </div>
            <div>
              <p className="font-bold">{currentTierData.name} {l('Plan', 'Mpango')}</p>
              <p className="text-xs text-[#64748B]">
                {currentTierData.price === 0 ? l('Free forever', 'Bure milele') : `TZS ${currentTierData.price.toLocaleString()}/${l('month', 'mwezi')}`}
              </p>
            </div>
          </div>
          {subscriptionTier !== 'starter' && (
            <span className="kbadge kbadge-gold">{l('Active', 'Hai')}</span>
          )}
        </div>

        {subscriptionTier !== 'starter' && (
          <div className="grid grid-cols-2 gap-3 mt-3">
            <div className="p-2.5 rounded-lg bg-[#F1F5F9] dark:bg-[#334155]">
              <p className="text-[10px] text-[#64748B]">{l('Renews In', 'Inajiriwa Baada ya')}</p>
              <p className="text-sm font-bold">{daysRemaining} {l('days', 'siku')}</p>
            </div>
            <div className="p-2.5 rounded-lg bg-[#F1F5F9] dark:bg-[#334155]">
              <p className="text-[10px] text-[#64748B]">{l('Auto-Renew', 'Kujiriwa Kiotomatiki')}</p>
              <button onClick={() => setAutoRenew(!autoRenew)} className="flex items-center gap-1.5 mt-0.5">
                <div className={`w-8 h-4.5 rounded-full transition-colors ${autoRenew ? 'bg-[#065F46]' : 'bg-[#E2E8F0]'} relative`}>
                  <div className={`w-3.5 h-3.5 rounded-full bg-white absolute top-0.5 transition-all ${autoRenew ? 'right-0.5' : 'left-0.5'}`} />
                </div>
                <span className="text-[10px] font-medium">{autoRenew ? l('On', 'Imewashwa') : l('Off', 'Imezimwa')}</span>
              </button>
            </div>
          </div>
        )}
      </motion.div>

      {/* Tier Comparison */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
        <h2 className="text-lg font-bold mb-3">{l('Choose Your Plan', 'Chagua Mpango Wako')}</h2>
        <div className="space-y-3">
          {TIERS.map((tier, i) => {
            const Icon = tier.icon;
            const isCurrent = subscriptionTier === tier.id;
            const isUpgrade = tier.price > 0 && !isCurrent;

            return (
              <motion.div
                key={tier.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 + i * 0.05 }}
                className={`kcard p-4 ${isCurrent ? 'border-2 border-[#065F46] dark:border-[#34D399]' : ''} ${tier.popular && !isCurrent ? 'border-2 border-[#F59E0B]' : ''}`}
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2.5">
                    <div className={`w-9 h-9 rounded-xl bg-gradient-to-br ${tier.color} flex items-center justify-center`}>
                      <Icon className="w-4 h-4 text-white" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-bold text-sm">{tier.name}</p>
                        {tier.popular && <span className="kbadge kbadge-gold text-[8px]"><Sparkles className="w-2.5 h-2.5" />{l('Popular', 'Maarufu')}</span>}
                      </div>
                      <p className="text-xs text-[#64748B]">
                        {tier.price === 0 ? l('Free', 'Bure') : `TZS ${tier.price.toLocaleString()}/${l('mo', 'mwezi')}`}
                      </p>
                    </div>
                  </div>
                  {isCurrent ? (
                    <span className="kbadge kbadge-verified flex items-center gap-1"><Check className="w-3 h-3" />{l('Current', 'Ya Sasa')}</span>
                  ) : (
                    <button
                      onClick={() => handleUpgrade(tier.id)}
                      disabled={upgrading === tier.id}
                      className="kbtn text-xs py-1.5 px-3"
                    >
                      {tier.price > 0 ? l('Upgrade', 'Boresha') : l('Downgrade', 'Punguza')} <ArrowRight className="w-3 h-3" />
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-1.5">
                  {tier.features.slice(0, 6).map((feat, fi) => (
                    <div key={fi} className={`flex items-center gap-1.5 text-xs ${feat.included ? '' : 'opacity-40 line-through'}`}>
                      <Check className={`w-3 h-3 shrink-0 ${feat.included ? 'text-[#10B981]' : 'text-[#64748B]'}`} />
                      {feat.text}
                    </div>
                  ))}
                </div>
              </motion.div>
            );
          })}
        </div>
      </motion.div>

      {/* Feature Highlights */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }} className="kcard p-4">
        <h3 className="font-semibold text-sm mb-3">{l('Premium Features', 'Vipengele maalum')}</h3>
        <div className="grid grid-cols-2 gap-3">
          {[
            { icon: BarChart3, label: l('Analytics', 'Uchambuzi'), desc: l('Track your performance', 'Fuata matokeo yako') },
            { icon: MapPin, label: l('Exclusive Zones', 'Maeneo Maalum'), desc: l('Access premium areas', 'Fikia maeneo bora') },
            { icon: Zap, label: l('Priority Match', 'Kipaumbele'), desc: l('Get matched first', 'Patanishwa kwanza') },
            { icon: Trophy, label: l('Guide of Week', 'Mwongozo wa Wiki'), desc: l('Featured placement', 'Nafasi ya kuonekana') },
          ].map((feat, i) => (
            <div key={i} className="flex items-start gap-2">
              <feat.icon className="w-5 h-5 text-[#F59E0B] shrink-0 mt-0.5" />
              <div>
                <p className="text-xs font-semibold">{feat.label}</p>
                <p className="text-[10px] text-[#64748B]">{feat.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </motion.div>

      {/* Billing History */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
        <h2 className="text-lg font-bold mb-3">{l('Billing History', 'Historia ya Malipo')}</h2>
        <div className="space-y-2">
          {BILLING_HISTORY.map((bill, i) => (
            <div key={bill.id} className="kcard p-3 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-[#ECFDF5] flex items-center justify-center">
                  <CreditCard className="w-4 h-4 text-[#065F46]" />
                </div>
                <div>
                  <p className="text-sm font-medium">{bill.tier} {l('Plan', 'Mpango')}</p>
                  <p className="text-[10px] text-[#64748B]">{bill.date} · {bill.method}</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-sm font-bold">{bill.amount === 0 ? l('Free', 'Bure') : `TZS ${bill.amount.toLocaleString()}`}</p>
                <span className="kbadge kbadge-verified text-[8px]">{l('Paid', 'Imelipwa')}</span>
              </div>
            </div>
          ))}
        </div>
      </motion.div>

      {/* Payment Modal */}
      <AnimatePresence>
        {showPayment && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/50 flex items-end justify-center"
            onClick={() => !processing && setShowPayment(false)}
          >
            <motion.div
              initial={{ y: 300 }}
              animate={{ y: 0 }}
              exit={{ y: 300 }}
              transition={{ type: 'spring', damping: 25 }}
              className="w-full max-w-lg bg-white dark:bg-[#1E293B] rounded-t-3xl p-6 space-y-4"
              onClick={(e) => e.stopPropagation()}
            >
              {success ? (
                <div className="text-center py-8">
                  <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="w-16 h-16 rounded-full bg-[#ECFDF5] flex items-center justify-center mx-auto mb-3">
                    <Check className="w-8 h-8 text-[#10B981]" />
                  </motion.div>
                  <p className="font-bold text-lg">{l('Subscription Updated!', 'Usajili Umehuishwa!')}</p>
                  <p className="text-sm text-[#64748B]">{l(`You are now on the ${selectedTier} plan`, `Sasa uko kwenye mpango wa ${selectedTier}`)}</p>
                </div>
              ) : (
                <>
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-bold">{l('Confirm Upgrade', 'Thibitisha Boresha')}</h3>
                    <button onClick={() => !processing && setShowPayment(false)} className="w-8 h-8 rounded-full bg-[#F1F5F9] dark:bg-[#334155] flex items-center justify-center">
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="kcard p-4 flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${TIERS.find(t => t.id === selectedTier)?.color} flex items-center justify-center`}>
                      {(() => { const TierIcon = TIERS.find(t => t.id === selectedTier)?.icon || Shield; return <TierIcon className="w-5 h-5 text-white" />; })()}
                    </div>
                    <div>
                      <p className="font-bold">{selectedTier} {l('Plan', 'Mpango')}</p>
                      <p className="text-sm text-[#64748B]">TZS {TIERS.find(t => t.id === selectedTier)?.price.toLocaleString()}/{l('month', 'mwezi')}</p>
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-1 block">{l('M-Pesa Phone Number', 'Namba ya Simu ya M-Pesa')}</label>
                    <input value={mpesaPhone} onChange={e => setMpesaPhone(e.target.value)} className="kinput w-full" placeholder="0712 345 678" />
                  </div>
                  <button onClick={handlePayment} disabled={processing} className="kbtn w-full text-sm h-11 disabled:opacity-50">
                    {processing ? (
                      <span className="flex items-center gap-2"><Clock className="w-4 h-4 animate-spin" />{l('Processing...', 'Inachakata...')}</span>
                    ) : (
                      l('Confirm Payment', 'Thibitisha Malipo')
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

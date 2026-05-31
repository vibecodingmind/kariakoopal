'use client';

import { useState } from 'react';
import { useAuthStore } from '@/lib/stores/auth-store';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Zap, Star, Crown, Check, X, ChevronRight, Phone, Loader2,
  ShieldCheck, Clock, Award, Eye, MessageSquare, BarChart3
} from 'lucide-react';
import { useRouter } from 'next/navigation';

// ── Animation variants ──
const fadeUp = {
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -8 },
};

// ── Tier definitions ──
const tiers = [
  {
    id: 'starter',
    name: 'Starter',
    nameSw: 'Kuanza',
    price: 0,
    priceLabel: 'Free',
    priceLabelSw: 'Bure',
    icon: Zap,
    color: '#6C757D',
    bgClass: 'bg-[#F1F3F5] dark:bg-[#21262D]',
    borderClass: 'border-[#6C757D]/20',
    textClass: 'text-[#6C757D]',
    features: [
      { name: 'Basic profile', nameSw: 'Wasifu wa kawaida', included: true },
      { name: 'Up to 2 zones', nameSw: 'Maeneo hadi 2', included: true },
      { name: 'Standard matching', nameSw: 'Ulinganisho wa kawaida', included: true },
      { name: 'In-app messaging', nameSw: 'Ujumbe ndani ya app', included: true },
      { name: 'Session recordings', nameSw: 'Kurekodi vipindi', included: false },
      { name: 'Priority matching', nameSw: 'Ulinganisho wa kipaumbele', included: false },
      { name: 'Featured listing', nameSw: 'Orodha iliyoangaziwa', included: false },
      { name: 'Analytics dashboard', nameSw: 'Dashibodi ya uchambuzi', included: false },
      { name: 'Mentorship access', nameSw: 'Ufikiaji wa ushauri', included: false },
      { name: 'Custom packages', nameSw: 'Pakiti za kawaida', included: false },
    ],
  },
  {
    id: 'pro',
    name: 'Pro',
    nameSw: 'Pro',
    price: 15000,
    priceLabel: 'TZS 15,000/mo',
    priceLabelSw: 'TZS 15,000/mwezi',
    icon: Star,
    color: '#0A4D3C',
    bgClass: 'bg-[#E8F5EE] dark:bg-[#0D2818]',
    borderClass: 'border-[#0A4D3C]/20',
    textClass: 'text-[#0A4D3C] dark:text-[#2EA77A]',
    popular: true,
    features: [
      { name: 'Enhanced profile', nameSw: 'Wasifu ulioboreshwa', included: true },
      { name: 'Up to 5 zones', nameSw: 'Maeneo hadi 5', included: true },
      { name: 'Priority matching', nameSw: 'Ulinganisho wa kipaumbele', included: true },
      { name: 'In-app messaging', nameSw: 'Ujumbe ndani ya app', included: true },
      { name: 'Session recordings', nameSw: 'Kurekodi vipindi', included: true },
      { name: 'Featured in search', nameSw: 'Angaziwa katika utafutaji', included: true },
      { name: 'Analytics dashboard', nameSw: 'Dashibodi ya uchambuzi', included: true },
      { name: 'Custom packages', nameSw: 'Pakiti za kawaida', included: true },
      { name: 'Mentorship access', nameSw: 'Ufikiaji wa ushauri', included: false },
      { name: 'VIP support', nameSw: 'Msaada wa VIP', included: false },
    ],
  },
  {
    id: 'elite',
    name: 'Elite',
    nameSw: 'Bora',
    price: 35000,
    priceLabel: 'TZS 35,000/mo',
    priceLabelSw: 'TZS 35,000/mwezi',
    icon: Crown,
    color: '#FFD23F',
    bgClass: 'bg-[#FEF3C7] dark:bg-[#3D2E0A]',
    borderClass: 'border-[#FFD23F]/30',
    textClass: 'text-[#B8860B] dark:text-[#FFD23F]',
    features: [
      { name: 'Premium profile', nameSw: 'Wasifu bora', included: true },
      { name: 'All zones', nameSw: 'Maeneo yote', included: true },
      { name: 'Top priority matching', nameSw: 'Ulinganisho wa juu', included: true },
      { name: 'In-app messaging', nameSw: 'Ujumbe ndani ya app', included: true },
      { name: 'Session recordings', nameSw: 'Kurekodi vipindi', included: true },
      { name: 'Top featured listing', nameSw: 'Orodha ya juu', included: true },
      { name: 'Advanced analytics', nameSw: 'Uchambuzi wa juu', included: true },
      { name: 'Unlimited packages', nameSw: 'Pakiti bila kikomo', included: true },
      { name: 'Mentorship access', nameSw: 'Ufikiaji wa ushauri', included: true },
      { name: 'VIP 24/7 support', nameSw: 'Msaada wa VIP 24/7', included: true },
    ],
  },
];

export default function SubscriptionsPage() {
  const { language, subscriptionTier, setSubscriptionTier, walletBalance } = useAuthStore();
  const router = useRouter();
  const sw = language === 'sw';
  const l = (en: string, swText: string) => (sw ? swText : en);
  const currentTier = subscriptionTier || 'pro';
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [selectedTier, setSelectedTier] = useState<string | null>(null);
  const [mpesaPhone, setMpesaPhone] = useState('');
  const [processing, setProcessing] = useState(false);
  const [showComparison, setShowComparison] = useState(false);

  const daysRemaining = 16;
  const renewalDate = 'Mar 15, 2026';

  const handleUpgrade = (tierId: string) => {
    if (tierId === currentTier) return;
    if (tierId === 'starter') {
      setSubscriptionTier('starter');
      return;
    }
    setSelectedTier(tierId);
    setShowUpgradeModal(true);
  };

  const handleConfirmPayment = async () => {
    setProcessing(true);
    // Simulate payment processing
    await new Promise(resolve => setTimeout(resolve, 2000));
    setProcessing(false);
    setShowUpgradeModal(false);
    setSubscriptionTier(selectedTier || 'pro');
  };

  const billingHistory = [
    { id: 'b1', tier: 'Pro', amount: 'TZS 15,000', date: 'Feb 15, 2026', status: 'paid' },
    { id: 'b2', tier: 'Starter', amount: 'Free', date: 'Jan 15, 2026', status: 'paid' },
    { id: 'b3', tier: 'Starter', amount: 'Free', date: 'Dec 15, 2025', status: 'paid' },
  ];

  return (
    <div className="px-4 py-4 space-y-5">
      {/* ── Header ── */}
      <motion.div {...fadeUp} className="flex items-center gap-3">
        <button onClick={() => router.back()} className="w-9 h-9 rounded-xl bg-[#F1F3F5] dark:bg-[#21262D] flex items-center justify-center">
          <X className="w-4 h-4" />
        </button>
        <h1 className="text-xl font-bold text-[#0A4D3C] dark:text-[#2EA77A]">{l('Subscriptions', 'Usajili')}</h1>
      </motion.div>

      {/* ── Current Plan Card ── */}
      <motion.div {...fadeUp} transition={{ delay: 0.05 }} className="kcard-green p-5 relative overflow-hidden">
        <div className="relative z-10">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-white/70">{l('Current Plan', 'Mpango wa Sasa')}</span>
            <span className={`kbadge ${currentTier === 'elite' ? 'kbadge-gold' : 'bg-white/20 text-white'}`}>
              {tiers.find(t => t.id === currentTier)?.name || 'Starter'}
            </span>
          </div>
          <p className="text-2xl font-bold text-white">
            {tiers.find(t => t.id === currentTier)?.priceLabel || 'Free'}
          </p>
          <div className="flex items-center gap-4 mt-2 text-white/70 text-xs">
            <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{daysRemaining} {l('days remaining', 'siku zimesalia')}</span>
            <span>{l('Renews', 'Inajirudi')} {renewalDate}</span>
          </div>
        </div>
      </motion.div>

      {/* ── Plan Selection ── */}
      <div className="space-y-3">
        {tiers.map((tier, i) => {
          const isActive = tier.id === currentTier;
          const TierIcon = tier.icon;
          return (
            <motion.div
              key={tier.id}
              {...fadeUp}
              transition={{ delay: 0.1 + i * 0.05 }}
              className={`kcard p-4 relative overflow-hidden ${isActive ? 'ring-2 ring-[#0A4D3C] dark:ring-[#2EA77A]' : ''}`}
            >
              {tier.popular && (
                <div className="absolute top-0 right-0 bg-[#FFD23F] text-[#0A4D3C] text-[10px] font-bold px-3 py-0.5 rounded-bl-lg">
                  {l('POPULAR', 'MAARUFU')}
                </div>
              )}
              <div className="flex items-center gap-3">
                <div className={`w-12 h-12 rounded-xl ${tier.bgClass} flex items-center justify-center border ${tier.borderClass}`}>
                  <TierIcon className={`w-6 h-6 ${tier.textClass}`} />
                </div>
                <div className="flex-1">
                  <h3 className="font-bold">{l(tier.name, tier.nameSw)}</h3>
                  <p className="text-sm text-[#0A4D3C] dark:text-[#2EA77A] font-semibold">{l(tier.priceLabel, tier.priceLabelSw)}</p>
                </div>
                {isActive ? (
                  <span className="kbadge kbadge-verified">{l('Active', 'Hai')}</span>
                ) : (
                  <button
                    onClick={() => handleUpgrade(tier.id)}
                    className={tier.price === 0 ? 'kbtn-outline text-xs py-2 px-3' : 'kbtn text-xs py-2 px-3'}
                  >
                    {l('Select', 'Chagua')}
                  </button>
                )}
              </div>
              <div className="mt-3 pt-3 border-t border-[#E9ECEF] dark:border-[#30363D]">
                <div className="grid grid-cols-2 gap-1.5">
                  {tier.features.filter(f => f.included).map((f, fi) => (
                    <div key={fi} className="flex items-center gap-1 text-xs">
                      <Check className="w-3 h-3 text-[#10B981] flex-shrink-0" />
                      <span className="text-[#6C757D] dark:text-[#8B949E]">{l(f.name, f.nameSw)}</span>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* ── Feature Comparison Table ── */}
      <motion.div {...fadeUp} transition={{ delay: 0.3 }}>
        <button
          onClick={() => setShowComparison(!showComparison)}
          className="w-full kcard p-4 flex items-center justify-between"
        >
          <span className="font-semibold text-sm">{l('Compare All Features', 'Linganisha Vipengele Vyote')}</span>
          <ChevronRight className={`w-4 h-4 transition-transform ${showComparison ? 'rotate-90' : ''}`} />
        </button>
        <AnimatePresence>
          {showComparison && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden"
            >
              <div className="kcard p-4 mt-2 overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b border-[#E9ECEF] dark:border-[#30363D]">
                      <th className="text-left py-2 pr-2 font-medium text-[#6C757D]">{l('Feature', 'Kipengele')}</th>
                      {tiers.map(t => (
                        <th key={t.id} className="text-center py-2 px-1 font-semibold">{t.name}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {tiers[0].features.map((feature, fi) => (
                      <tr key={fi} className="border-b border-[#E9ECEF]/50 dark:border-[#30363D]/50">
                        <td className="py-2 pr-2 text-[#6C757D] dark:text-[#8B949E]">{l(feature.name, feature.nameSw)}</td>
                        {tiers.map(t => (
                          <td key={t.id} className="text-center py-2 px-1">
                            {t.features[fi].included ? (
                              <Check className="w-4 h-4 text-[#10B981] mx-auto" />
                            ) : (
                              <X className="w-4 h-4 text-[#6C757D] mx-auto opacity-30" />
                            )}
                          </td>
                        ))}
                      </tr>
                    ))}
                    <tr>
                      <td className="py-2 pr-2 font-semibold">{l('Price', 'Bei')}</td>
                      {tiers.map(t => (
                        <td key={t.id} className="text-center py-2 px-1 font-bold">{l(t.priceLabel, t.priceLabelSw)}</td>
                      ))}
                    </tr>
                  </tbody>
                </table>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* ── Billing History ── */}
      <motion.div {...fadeUp} transition={{ delay: 0.35 }}>
        <h2 className="text-lg font-bold mb-3">{l('Billing History', 'Historia ya Malipo')}</h2>
        <div className="kcard p-0 overflow-hidden">
          {billingHistory.map((bill, i) => (
            <div key={bill.id} className="flex items-center justify-between px-4 py-3.5 border-b border-[#E9ECEF] dark:border-[#30363D] last:border-0">
              <div>
                <p className="text-sm font-medium">{bill.tier} {l('Plan', 'Mpango')}</p>
                <p className="text-xs text-[#6C757D] dark:text-[#8B949E]">{bill.date}</p>
              </div>
              <div className="text-right">
                <p className="text-sm font-semibold">{bill.amount}</p>
                <span className="kbadge kbadge-verified text-[9px]">{l('Paid', 'Lipwa')}</span>
              </div>
            </div>
          ))}
        </div>
      </motion.div>

      {/* ── Upgrade Modal ── */}
      <AnimatePresence>
        {showUpgradeModal && selectedTier && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[60] bg-black/50 flex items-end sm:items-center justify-center p-0 sm:p-4"
            onClick={() => !processing && setShowUpgradeModal(false)}
          >
            <motion.div
              initial={{ y: 100, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 100, opacity: 0 }}
              transition={{ type: 'spring', damping: 25 }}
              className="bg-white dark:bg-[#161B22] w-full sm:max-w-md sm:rounded-2xl rounded-t-2xl p-6"
              onClick={(e) => e.stopPropagation()}
            >
              <h2 className="text-lg font-bold mb-1">
                {l('Upgrade to', 'Panda hadi')} {tiers.find(t => t.id === selectedTier)?.name}
              </h2>
              <p className="text-sm text-[#6C757D] dark:text-[#8B949E] mb-4">
                {tiers.find(t => t.id === selectedTier)?.priceLabel}/ {l('month', 'mwezi')}
              </p>

              <div className="space-y-3 mb-5">
                {tiers.find(t => t.id === selectedTier)?.features.filter(f => f.included).map((f, i) => (
                  <div key={i} className="flex items-center gap-2 text-sm">
                    <Check className="w-4 h-4 text-[#10B981]" />
                    <span>{l(f.name, f.nameSw)}</span>
                  </div>
                ))}
              </div>

              <div className="mb-4">
                <label className="text-sm font-medium mb-1 block">{l('M-Pesa Phone Number', 'Nambari ya M-Pesa')}</label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#6C757D]" />
                  <input
                    type="tel"
                    value={mpesaPhone}
                    onChange={(e) => setMpesaPhone(e.target.value)}
                    className="kinput w-full pl-10"
                    placeholder="255 XXX XXX XXX"
                    disabled={processing}
                  />
                </div>
              </div>

              <div className="flex gap-3">
                <button onClick={() => setShowUpgradeModal(false)} disabled={processing} className="kbtn-outline flex-1 text-sm py-3">
                  {l('Cancel', 'Ghairi')}
                </button>
                <button onClick={handleConfirmPayment} disabled={processing} className="kbtn flex-1 text-sm py-3 flex items-center justify-center gap-2">
                  {processing ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      {l('Processing...', 'Inachakata...')}
                    </>
                  ) : (
                    l('Confirm & Pay', 'Thibitisha na Lipa')
                  )}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

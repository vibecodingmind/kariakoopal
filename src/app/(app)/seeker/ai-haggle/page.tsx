'use client';

import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Sparkles, DollarSign, Store, ShoppingCart, X, Loader2,
  ArrowRight, Volume2, AlertTriangle, Lightbulb, CheckCircle2,
  ChevronRight, MessageSquare, TrendingDown, Send, RefreshCw,
  Handshake, Info
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Slider } from '@/components/ui/slider';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Skeleton } from '@/components/ui/skeleton';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell
} from 'recharts';

// ─── Types ───────────────────────────────────────────────────────────

interface SwahiliPhrase {
  swahili: string;
  pronunciation: string;
  english: string;
}

interface NegotiationStep {
  step: number;
  icon: string;
  description: string;
  sayWhat: string;
}

interface NegotiationResult {
  fairPriceMin: number;
  fairPriceMax: number;
  negotiationStrategy: NegotiationStep[];
  swahiliPhrases: SwahiliPhrase[];
  walkAwayPrice: number;
  culturalTips: string[];
  rawText?: string;
}

interface HaggleFormData {
  item: string;
  askingPrice: number;
  vendorType: string;
  quality: number;
  budget: number;
}

// ─── Constants ───────────────────────────────────────────────────────

const ITEM_SUGGESTIONS = [
  'Kanga fabric', 'Spices', 'Electronics', 'Jewelry',
  'Carvings', 'Clothing', 'Tanzanite', 'Tea & Coffee',
  'Maasai crafts', 'Sandalwood', 'Basmati rice', 'Fresh produce',
];

const VENDOR_TYPES = [
  { id: 'market-stall', label: 'Market Stall', icon: Store },
  { id: 'shop', label: 'Shop', icon: ShoppingCart },
  { id: 'street-vendor', label: 'Street Vendor', icon: Handshake },
  { id: 'wholesale', label: 'Wholesale', icon: DollarSign },
] as const;

const QUALITY_LABELS = ['Poor', 'Fair', 'Average', 'Good', 'Premium'];

const MOCK_PRICE_HISTORY = [
  { name: 'Low', price: 5000, fill: '#34D399' },
  { name: 'Fair Low', price: 8000, fill: '#065F46' },
  { name: 'Average', price: 12000, fill: '#059669' },
  { name: 'Fair High', price: 16000, fill: '#F59E0B' },
  { name: 'High', price: 22000, fill: '#EF4444' },
];

// ─── Animation variants ─────────────────────────────────────────────

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.08, delayChildren: 0.1 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] },
  },
};

// ─── Helper ──────────────────────────────────────────────────────────

function formatTZS(amount: number): string {
  return `TZS ${amount.toLocaleString()}`;
}

function parseNegotiation(raw: string, askingPrice: number, budget: number): NegotiationResult {
  const fallback: NegotiationResult = {
    fairPriceMin: Math.round(askingPrice * 0.5),
    fairPriceMax: Math.round(askingPrice * 0.75),
    negotiationStrategy: [
      { step: 1, icon: '🎯', description: 'Start low but respectful', sayWhat: 'I saw this for less at another stall' },
      { step: 2, icon: '🤝', description: 'Show genuine interest', sayWhat: 'I really like this, but my budget is tight' },
      { step: 3, icon: '💪', description: 'Hold firm on your price', sayWhat: 'That is my final offer' },
      { step: 4, icon: '🚶', description: 'Be willing to walk away', sayWhat: 'Thank you, I will think about it' },
    ],
    swahiliPhrases: [
      { swahili: 'Bei gani?', pronunciation: 'bay gah-nee', english: 'How much?' },
      { swahili: 'Ni ghali sana!', pronunciation: 'nee ghah-lee sah-nah', english: 'It is too expensive!' },
      { swahili: 'Nina bei nzuri zaidi', pronunciation: 'nee-nah bay nzoo-ree zah-ee-dee', english: 'I have a better price' },
    ],
    walkAwayPrice: Math.round(askingPrice * 0.8),
    culturalTips: [
      'Always greet the vendor before starting negotiations',
      'Never accept the first price — bargaining is expected',
      'A smile goes a long way in negotiations',
      'Walking away politely often gets you the best price',
    ],
  };

  try {
    const parsed = JSON.parse(raw);
    return {
      fairPriceMin: parsed.fairPrice?.min ?? parsed.fairPriceMin ?? fallback.fairPriceMin,
      fairPriceMax: parsed.fairPrice?.max ?? parsed.fairPriceMax ?? fallback.fairPriceMax,
      negotiationStrategy: Array.isArray(parsed.negotiationStrategy)
        ? parsed.negotiationStrategy.map((s: Record<string, unknown>, i: number) => ({
            step: (s.step as number) || i + 1,
            icon: (s.icon as string) || '🎯',
            description: (s.description as string) || '',
            sayWhat: (s.sayWhat as string) || (s.whatToSay as string) || '',
          }))
        : fallback.negotiationStrategy,
      swahiliPhrases: Array.isArray(parsed.swahiliPhrases)
        ? parsed.swahiliPhrases.map((p: Record<string, unknown>) => ({
            swahili: (p.swahili as string) || '',
            pronunciation: (p.pronunciation as string) || '',
            english: (p.english as string) || (p.translation as string) || '',
          }))
        : fallback.swahiliPhrases,
      walkAwayPrice: parsed.walkAwayPrice ?? fallback.walkAwayPrice,
      culturalTips: Array.isArray(parsed.culturalTips)
        ? parsed.culturalTips
        : fallback.culturalTips,
    };
  } catch {
    return fallback;
  }
}

// ─── Component ───────────────────────────────────────────────────────

export default function AIHagglePage() {
  const [formData, setFormData] = useState<HaggleFormData>({
    item: '',
    askingPrice: 0,
    vendorType: 'market-stall',
    quality: 50,
    budget: 0,
  });
  const [result, setResult] = useState<NegotiationResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(true);
  const [refinementInput, setRefinementInput] = useState('');
  const [isRefining, setIsRefining] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);

  const isFormValid = formData.item.trim() !== '' && formData.askingPrice > 0;

  // ── Submit handler ──
  const handleSubmit = useCallback(async () => {
    if (!isFormValid) return;
    setIsLoading(true);
    setError(null);
    setResult(null);

    try {
      const res = await fetch('/api/ai/price-negotiate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          item: formData.item,
          askingPrice: formData.askingPrice,
          vendorType: formData.vendorType,
          quality: QUALITY_LABELS[Math.floor(formData.quality / 25)] || 'Average',
          seekerBudget: formData.budget || undefined,
        }),
      });

      if (!res.ok) throw new Error('Failed to get negotiation advice');

      const data = await res.json();
      if (!data.success) throw new Error(data.error || 'Request failed');

      const negotiation = data.negotiation;
      if (negotiation.rawText) {
        setResult(parseNegotiation(negotiation.rawText, formData.askingPrice, formData.budget));
      } else {
        setResult(parseNegotiation(JSON.stringify(negotiation), formData.askingPrice, formData.budget));
      }
      setShowForm(false);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Something went wrong';
      setError(message);
    } finally {
      setIsLoading(false);
    }
  }, [formData, isFormValid]);

  // ── Refine handler ──
  const handleRefine = useCallback(async () => {
    if (!result || !refinementInput.trim()) return;
    setIsRefining(true);
    setError(null);

    try {
      const res = await fetch('/api/ai/price-negotiate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          item: formData.item,
          askingPrice: formData.askingPrice,
          vendorType: formData.vendorType,
          quality: QUALITY_LABELS[Math.floor(formData.quality / 25)] || 'Average',
          seekerBudget: formData.budget || undefined,
          refinement: refinementInput,
        }),
      });

      if (!res.ok) throw new Error('Failed to refine');

      const data = await res.json();
      if (!data.success) throw new Error(data.error || 'Refinement failed');

      const negotiation = data.negotiation;
      if (negotiation.rawText) {
        setResult(parseNegotiation(negotiation.rawText, formData.askingPrice, formData.budget));
      } else {
        setResult(parseNegotiation(JSON.stringify(negotiation), formData.askingPrice, formData.budget));
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Something went wrong';
      setError(message);
    } finally {
      setIsRefining(false);
      setRefinementInput('');
    }
  }, [result, formData, refinementInput]);

  // ── Start over ──
  const handleStartOver = useCallback(() => {
    setResult(null);
    setShowForm(true);
    setError(null);
  }, []);

  // Generate price history based on the result
  const priceHistory = result
    ? [
        { name: 'Low', price: result.fairPriceMin, fill: '#34D399' },
        { name: 'Fair Low', price: Math.round(result.fairPriceMin + (result.fairPriceMax - result.fairPriceMin) * 0.33), fill: '#065F46' },
        { name: 'Average', price: Math.round((result.fairPriceMin + result.fairPriceMax) / 2), fill: '#059669' },
        { name: 'Fair High', price: Math.round(result.fairPriceMin + (result.fairPriceMax - result.fairPriceMin) * 0.66), fill: '#F59E0B' },
        { name: 'High', price: result.fairPriceMax, fill: '#EF4444' },
      ]
    : MOCK_PRICE_HISTORY;

  return (
    <div className="min-h-screen bg-[#F8FAFC] dark:bg-[#0F172A]">
      {/* ── Hero Section ── */}
      <div className="relative overflow-hidden">
        <div
          className="absolute inset-0 opacity-[0.03] dark:opacity-[0.05]"
          style={{
            backgroundImage: 'radial-gradient(circle, #065F46 1px, transparent 1px)',
            backgroundSize: '24px 24px',
          }}
        />
        <div className="absolute -top-24 -right-24 w-72 h-72 rounded-full bg-[#065F46]/10 dark:bg-[#34D399]/5 blur-3xl" />
        <div className="absolute -bottom-32 -left-16 w-64 h-64 rounded-full bg-[#F59E0B]/10 dark:bg-[#FBBF24]/5 blur-3xl" />

        <div className="relative px-4 pt-8 pb-10 sm:px-6 lg:px-8 max-w-5xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <div className="inline-flex items-center gap-2 bg-[#065F46]/10 dark:bg-[#34D399]/10 px-4 py-1.5 rounded-full mb-4">
              <Sparkles className="w-4 h-4 text-[#065F46] dark:text-[#34D399]" />
              <span className="text-xs font-semibold text-[#065F46] dark:text-[#34D399] uppercase tracking-wider">
                AI-Powered
              </span>
            </div>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight mb-3"
          >
            <span className="gradient-text-green">AI Haggling</span>{' '}
            <span className="gradient-text-gold">Assistant</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="text-base sm:text-lg text-[#64748B] dark:text-[#94A3B8] max-w-xl mx-auto"
          >
            Never overpay in Kariakoo again
          </motion.p>
        </div>
      </div>

      <div className="px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto pb-16">
        <AnimatePresence mode="wait">
          {showForm ? (
            <motion.div
              key="form"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -30 }}
              transition={{ duration: 0.5 }}
            >
              {/* ── Input Form ── */}
              <div className="kcard-glass p-5 sm:p-8 space-y-8">
                {/* Item input */}
                <div>
                  <label className="flex items-center gap-2 text-sm font-semibold text-[#0F172A] dark:text-[#F1F5F9] mb-3">
                    <ShoppingCart className="w-4 h-4 text-[#F59E0B]" />
                    What are you buying?
                  </label>
                  <div className="relative">
                    <Input
                      placeholder="e.g. Kanga fabric, Spices, Electronics..."
                      value={formData.item}
                      onChange={(e) => setFormData((p) => ({ ...p, item: e.target.value }))}
                      onFocus={() => setShowSuggestions(true)}
                      onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                      className="kinput"
                    />
                    <AnimatePresence>
                      {showSuggestions && (
                        <motion.div
                          initial={{ opacity: 0, y: -8 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -8 }}
                          className="absolute top-full left-0 right-0 mt-2 z-50 bg-white dark:bg-[#1E293B] border border-[#E2E8F0] dark:border-[#334155] rounded-xl shadow-lg overflow-hidden max-h-48 overflow-y-auto"
                        >
                          {ITEM_SUGGESTIONS.filter((s) =>
                            s.toLowerCase().includes(formData.item.toLowerCase()) || formData.item === ''
                          ).map((suggestion) => (
                            <button
                              key={suggestion}
                              onMouseDown={() => {
                                setFormData((p) => ({ ...p, item: suggestion }));
                                setShowSuggestions(false);
                              }}
                              className="w-full px-4 py-2.5 text-sm text-left hover:bg-[#ECFDF5] dark:hover:bg-[#064E3B] text-[#0F172A] dark:text-[#F1F5F9] transition-colors"
                            >
                              {suggestion}
                            </button>
                          ))}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </div>

                {/* Asking price & Budget */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div>
                    <label className="flex items-center gap-2 text-sm font-semibold text-[#0F172A] dark:text-[#F1F5F9] mb-3">
                      <DollarSign className="w-4 h-4 text-[#F59E0B]" />
                      Vendor asking price
                    </label>
                    <div className="relative">
                      <Input
                        type="number"
                        placeholder="0"
                        value={formData.askingPrice || ''}
                        onChange={(e) => setFormData((p) => ({ ...p, askingPrice: Number(e.target.value) }))}
                        className="kinput pr-16"
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-[#64748B] dark:text-[#94A3B8]">
                        TZS
                      </span>
                    </div>
                  </div>

                  <div>
                    <label className="flex items-center gap-2 text-sm font-semibold text-[#0F172A] dark:text-[#F1F5F9] mb-3">
                      <DollarSign className="w-4 h-4 text-[#F59E0B]" />
                      Your budget
                      <span className="text-xs font-normal text-[#94A3B8]">(optional)</span>
                    </label>
                    <div className="relative">
                      <Input
                        type="number"
                        placeholder="0"
                        value={formData.budget || ''}
                        onChange={(e) => setFormData((p) => ({ ...p, budget: Number(e.target.value) }))}
                        className="kinput pr-16"
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-[#64748B] dark:text-[#94A3B8]">
                        TZS
                      </span>
                    </div>
                  </div>
                </div>

                {/* Vendor type */}
                <div>
                  <label className="flex items-center gap-2 text-sm font-semibold text-[#0F172A] dark:text-[#F1F5F9] mb-3">
                    <Store className="w-4 h-4 text-[#F59E0B]" />
                    Vendor type
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {VENDOR_TYPES.map((vt) => {
                      const Icon = vt.icon;
                      const isActive = formData.vendorType === vt.id;
                      return (
                        <motion.button
                          key={vt.id}
                          whileTap={{ scale: 0.95 }}
                          onClick={() => setFormData((p) => ({ ...p, vendorType: vt.id }))}
                          className={`inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 ${
                            isActive
                              ? 'bg-[#065F46] dark:bg-[#34D399] text-white dark:text-[#022C22] shadow-md'
                              : 'bg-[#F1F5F9] dark:bg-[#334155] text-[#64748B] dark:text-[#94A3B8] hover:bg-[#E2E8F0] dark:hover:bg-[#475569]'
                          }`}
                        >
                          <Icon className="w-3.5 h-3.5" />
                          {vt.label}
                        </motion.button>
                      );
                    })}
                  </div>
                </div>

                {/* Quality slider */}
                <div>
                  <label className="flex items-center gap-2 text-sm font-semibold text-[#0F172A] dark:text-[#F1F5F9] mb-1">
                    <Sparkles className="w-4 h-4 text-[#F59E0B]" />
                    Quality
                  </label>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs text-[#64748B] dark:text-[#94A3B8]">Poor</span>
                    <Badge
                      variant="secondary"
                      className="bg-[#ECFDF5] dark:bg-[#064E3B] text-[#065F46] dark:text-[#34D399] font-semibold"
                    >
                      {QUALITY_LABELS[Math.floor(formData.quality / 25)] || 'Average'}
                    </Badge>
                    <span className="text-xs text-[#64748B] dark:text-[#94A3B8]">Premium</span>
                  </div>
                  <Slider
                    value={[formData.quality]}
                    min={0}
                    max={100}
                    step={25}
                    onValueChange={(v) => setFormData((p) => ({ ...p, quality: v[0] }))}
                    className="w-full"
                  />
                </div>

                {/* Submit button */}
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                >
                  <button
                    onClick={handleSubmit}
                    disabled={!isFormValid || isLoading}
                    className="w-full py-4 rounded-2xl text-base font-bold text-white bg-gradient-to-r from-[#065F46] via-[#059669] to-[#065F46] bg-[length:200%_100%] hover:bg-right shadow-lg shadow-[#065F46]/25 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-500 flex items-center justify-center gap-2.5"
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        Getting AI Advice…
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-5 h-5" />
                        Get AI Advice
                        <ChevronRight className="w-4 h-4" />
                      </>
                    )}
                  </button>
                </motion.div>

                {/* Error */}
                {error && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="p-4 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 flex items-start gap-3"
                  >
                    <AlertTriangle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-semibold text-red-700 dark:text-red-400">Request Failed</p>
                      <p className="text-xs text-red-600 dark:text-red-400/80 mt-0.5">{error}</p>
                    </div>
                  </motion.div>
                )}
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="result"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -30 }}
              transition={{ duration: 0.5 }}
            >
              {isLoading ? (
                <LoadingSkeleton />
              ) : result ? (
                <ResultDisplay
                  result={result}
                  formData={formData}
                  priceHistory={priceHistory}
                  onRefine={handleRefine}
                  isRefining={isRefining}
                  refinementInput={refinementInput}
                  setRefinementInput={setRefinementInput}
                  onStartOver={handleStartOver}
                />
              ) : null}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

// ─── Result Display ──────────────────────────────────────────────────

function ResultDisplay({
  result,
  formData,
  priceHistory,
  onRefine,
  isRefining,
  refinementInput,
  setRefinementInput,
  onStartOver,
}: {
  result: NegotiationResult;
  formData: HaggleFormData;
  priceHistory: { name: string; price: number; fill: string }[];
  onRefine: () => Promise<void>;
  isRefining: boolean;
  refinementInput: string;
  setRefinementInput: (v: string) => void;
  onStartOver: () => void;
}) {
  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="space-y-6"
    >
      {/* Fair Price Range */}
      <motion.div variants={itemVariants}>
        <div className="kcard-green p-5 sm:p-6 relative overflow-hidden">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_80%,rgba(245,158,11,0.12),transparent_50%)] pointer-events-none" />
          <div className="relative">
            <div className="flex items-center gap-2 mb-3">
              <TrendingDown className="w-5 h-5 text-[#FBBF24]" />
              <h2 className="text-lg font-bold text-white">Fair Price Range</h2>
            </div>
            <div className="flex items-baseline gap-2 mb-2">
              <span className="text-3xl sm:text-4xl font-extrabold text-white">
                {formatTZS(result.fairPriceMin)}
              </span>
              <span className="text-xl text-white/60">—</span>
              <span className="text-3xl sm:text-4xl font-extrabold text-white">
                {formatTZS(result.fairPriceMax)}
              </span>
            </div>
            <div className="flex flex-wrap gap-3 mt-3">
              <Badge className="bg-white/15 text-white border-0 text-xs">
                Vendor asking: {formatTZS(formData.askingPrice)}
              </Badge>
              {formData.budget > 0 && (
                <Badge className="bg-[#FBBF24]/20 text-[#FBBF24] border-0 text-xs">
                  Your budget: {formatTZS(formData.budget)}
                </Badge>
              )}
              <Badge className="bg-[#34D399]/20 text-[#34D399] border-0 text-xs">
                Potential savings: {formatTZS(formData.askingPrice - result.fairPriceMax)}
              </Badge>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Negotiation Strategy */}
      <motion.div variants={itemVariants}>
        <Card className="border-0 shadow-md overflow-hidden">
          <CardHeader className="bg-gradient-to-r from-[#065F46] to-[#059669] dark:from-[#022C22] dark:to-[#065F46] py-4 px-5">
            <CardTitle className="text-white flex items-center gap-2 text-base">
              <Handshake className="w-4 h-4 text-[#FBBF24]" />
              Negotiation Strategy
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y divide-[#F1F5F9] dark:divide-[#334155]">
              {result.negotiationStrategy.map((step, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.1, duration: 0.4 }}
                  className="p-4 sm:p-5 hover:bg-[#F8FAFC]/50 dark:hover:bg-[#1E293B]/50 transition-colors"
                >
                  <div className="flex items-start gap-4">
                    <div className="flex-shrink-0 w-10 h-10 rounded-full bg-[#ECFDF5] dark:bg-[#064E3B] flex items-center justify-center">
                      <span className="text-lg">{step.icon}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <Badge
                          variant="secondary"
                          className="bg-[#065F46] dark:bg-[#34D399] text-white dark:text-[#022C22] text-xs font-bold px-2"
                        >
                          Step {step.step || i + 1}
                        </Badge>
                        <span className="text-sm font-semibold text-[#0F172A] dark:text-[#F1F5F9]">
                          {step.description}
                        </span>
                      </div>
                      {step.sayWhat && (
                        <div className="mt-2 flex items-start gap-2 p-3 rounded-xl bg-[#ECFDF5]/60 dark:bg-[#064E3B]/40 border border-[#A7F3D0]/30 dark:border-[#065F46]/30">
                          <MessageSquare className="w-4 h-4 text-[#065F46] dark:text-[#34D399] shrink-0 mt-0.5" />
                          <p className="text-sm text-[#065F46] dark:text-[#34D399] italic">
                            &ldquo;{step.sayWhat}&rdquo;
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Swahili Phrases */}
      <motion.div variants={itemVariants}>
        <h3 className="text-lg font-bold text-[#0F172A] dark:text-[#F1F5F9] mb-3 flex items-center gap-2">
          <Volume2 className="w-5 h-5 text-[#065F46] dark:text-[#34D399]" />
          Swahili Phrases for Bargaining
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {result.swahiliPhrases.map((phrase, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: i * 0.05 }}
              className="kcard p-4 space-y-2"
            >
              <p className="text-lg font-bold text-[#065F46] dark:text-[#34D399]">
                {phrase.swahili}
              </p>
              <p className="text-xs text-[#F59E0B] dark:text-[#FBBF24] font-medium italic">
                /{phrase.pronunciation}/
              </p>
              <p className="text-sm text-[#64748B] dark:text-[#94A3B8]">
                {phrase.english}
              </p>
              <button className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#ECFDF5] dark:bg-[#064E3B] text-[#065F46] dark:text-[#34D399] text-xs font-semibold hover:bg-[#065F46] hover:text-white dark:hover:bg-[#34D399] dark:hover:text-[#022C22] transition-all">
                <Volume2 className="w-3 h-3" />
                Play
              </button>
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* Walk-Away Price & Cultural Tips side by side */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Walk-Away Price */}
        <motion.div variants={itemVariants}>
          <div className="p-5 sm:p-6 rounded-2xl border-2 border-red-300 dark:border-red-800 bg-red-50/50 dark:bg-red-900/10">
            <div className="flex items-center gap-2 mb-3">
              <AlertTriangle className="w-5 h-5 text-red-500" />
              <h3 className="text-base font-bold text-red-700 dark:text-red-400">
                Walk-Away Price
              </h3>
            </div>
            <p className="text-3xl sm:text-4xl font-extrabold text-red-600 dark:text-red-400 mb-2">
              {formatTZS(result.walkAwayPrice)}
            </p>
            <p className="text-sm text-red-600/80 dark:text-red-400/70 leading-relaxed">
              If the vendor won&apos;t budge below this price, walk away. There&apos;s likely another stall with a better deal nearby.
            </p>
          </div>
        </motion.div>

        {/* Cultural Tips */}
        <motion.div variants={itemVariants}>
          <div className="p-5 sm:p-6 rounded-2xl border-2 border-amber-300 dark:border-amber-700 bg-amber-50/50 dark:bg-amber-900/10">
            <div className="flex items-center gap-2 mb-3">
              <Lightbulb className="w-5 h-5 text-amber-500" />
              <h3 className="text-base font-bold text-amber-700 dark:text-amber-400">
                Cultural Tips
              </h3>
            </div>
            <ul className="space-y-2.5">
              {result.culturalTips.map((tip, i) => (
                <li key={i} className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                  <span className="text-sm text-amber-800 dark:text-amber-300/90 leading-relaxed">
                    {tip}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </motion.div>
      </div>

      {/* Price History Chart */}
      <motion.div variants={itemVariants}>
        <Card className="border-0 shadow-md">
          <CardHeader className="pb-2 px-5 pt-5">
            <CardTitle className="text-base flex items-center gap-2 text-[#0F172A] dark:text-[#F1F5F9]">
              <TrendingDown className="w-4 h-4 text-[#065F46] dark:text-[#34D399]" />
              Typical Price Ranges in Kariakoo
            </CardTitle>
          </CardHeader>
          <CardContent className="px-5 pb-5">
            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={priceHistory} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
                  <XAxis
                    dataKey="name"
                    tick={{ fontSize: 12, fill: '#64748B' }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    tick={{ fontSize: 11, fill: '#64748B' }}
                    axisLine={false}
                    tickLine={false}
                    tickFormatter={(v: number) => `${(v / 1000).toFixed(0)}k`}
                  />
                  <Tooltip
                    formatter={(value: number) => [formatTZS(value), 'Price']}
                    contentStyle={{
                      background: 'rgba(255,255,255,0.95)',
                      border: '1px solid #E2E8F0',
                      borderRadius: '12px',
                      fontSize: '13px',
                      boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
                    }}
                  />
                  <Bar dataKey="price" radius={[6, 6, 0, 0]}>
                    {priceHistory.map((entry, index) => (
                      <Cell key={index} fill={entry.fill} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Action Buttons */}
      <motion.div variants={itemVariants} className="flex flex-col sm:flex-row gap-3">
        <button
          onClick={onStartOver}
          className="flex-1 kbtn-outline flex items-center justify-center gap-2 py-3.5"
        >
          <RefreshCw className="w-4 h-4" />
          New Negotiation
        </button>
      </motion.div>

      {/* AI Refinement */}
      <motion.div variants={itemVariants}>
        <div className="kcard-glass p-5 sm:p-6 space-y-4">
          <h3 className="text-base font-bold text-[#0F172A] dark:text-[#F1F5F9] flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-[#F59E0B]" />
            Refine Advice
          </h3>

          {/* Quick chips */}
          <div className="flex flex-wrap gap-2">
            {['Be more aggressive', 'Be more polite', 'For a group buy', 'Last-minute tips'].map((chip) => (
              <motion.button
                key={chip}
                whileTap={{ scale: 0.95 }}
                onClick={() => {
                  setRefinementInput(chip);
                }}
                disabled={isRefining}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-[#ECFDF5] dark:bg-[#064E3B] text-[#065F46] dark:text-[#34D399] hover:bg-[#065F46] hover:text-white dark:hover:bg-[#34D399] dark:hover:text-[#022C22] transition-all duration-200 disabled:opacity-50"
              >
                <Sparkles className="w-3 h-3" />
                {chip}
              </motion.button>
            ))}
          </div>

          {/* Input */}
          <div className="flex gap-2">
            <div className="flex-1 relative">
              <Input
                placeholder="Ask AI for more specific advice…"
                value={refinementInput}
                onChange={(e) => setRefinementInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && refinementInput.trim()) onRefine();
                }}
                className="kinput pr-10"
                disabled={isRefining}
              />
              {refinementInput && (
                <button
                  onClick={() => setRefinementInput('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#94A3B8] hover:text-[#64748B]"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
            <button
              onClick={onRefine}
              disabled={isRefining || !refinementInput.trim()}
              className="kbtn px-4 disabled:opacity-50"
            >
              {isRefining ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Send className="w-4 h-4" />
              )}
            </button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

// ─── Loading Skeleton ────────────────────────────────────────────────

function LoadingSkeleton() {
  return (
    <div className="space-y-6">
      <div className="kcard-green p-6 space-y-3">
        <Skeleton className="h-5 w-32 bg-white/20" />
        <Skeleton className="h-10 w-64 bg-white/20" />
        <div className="flex gap-2">
          <Skeleton className="h-6 w-24 bg-white/20" />
          <Skeleton className="h-6 w-24 bg-white/20" />
        </div>
      </div>
      <div className="kcard p-6 space-y-4">
        <Skeleton className="h-5 w-40" />
        {[1, 2, 3].map((i) => (
          <div key={i} className="flex gap-4">
            <Skeleton className="w-10 h-10 rounded-full shrink-0" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-8 w-full" />
            </div>
          </div>
        ))}
      </div>
      <div className="grid grid-cols-3 gap-3">
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-32 rounded-2xl" />
        ))}
      </div>
    </div>
  );
}

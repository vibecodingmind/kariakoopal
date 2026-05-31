'use client';

import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Handshake, Target, ArrowRight, AlertTriangle, Loader2,
  ChevronRight, Sparkles, MessageSquare, TrendingDown,
  ArrowLeft, CheckCircle2, X, Volume2, Play
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { useAuthStore } from '@/lib/stores/auth-store';

// ─── Types ───────────────────────────────────────────────────────────

interface NegotiationTip {
  phase: string;
  advice: string;
}

interface NegotiationResult {
  targetPrice: number;
  openingOffer: number;
  maxWalkAway: number;
  tips: NegotiationTip[];
  coachScript: string;
  sessionId: string | null;
}

// ─── Constants ───────────────────────────────────────────────────────

const ZONES = [
  { id: 'zone-electronics', name: 'Electronics Zone' },
  { id: 'zone-fabrics', name: 'Fabrics Zone' },
  { id: 'zone-wholesale', name: 'Wholesale Zone' },
  { id: 'zone-spices', name: 'Spices Zone' },
  { id: 'zone-kitchenware', name: 'Kitchenware Zone' },
  { id: 'zone-artisanal', name: 'Artisanal Zone' },
];

function formatTZS(amount: number): string {
  return `TZS ${Math.round(amount).toLocaleString()}`;
}

// ─── Progress Bar for Negotiation Tracker ─────────────────────────

function NegotiationProgress({ askingPrice, targetPrice, currentOffer }: {
  askingPrice: number; targetPrice: number; currentOffer: number;
}) {
  const range = askingPrice - targetPrice;
  const progress = range > 0 ? Math.min(100, ((askingPrice - currentOffer) / range) * 100) : 0;
  const pctColor = progress < 30 ? 'bg-red-500' : progress < 60 ? 'bg-amber-500' : 'bg-emerald-500';

  return (
    <div className="space-y-2">
      <div className="flex justify-between text-xs text-[#64748B] dark:text-[#94A3B8]">
        <span>Asking: {formatTZS(askingPrice)}</span>
        <span>Target: {formatTZS(targetPrice)}</span>
      </div>
      <div className="relative h-4 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${Math.max(2, progress)}%` }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
          className={`absolute top-0 bottom-0 ${pctColor} rounded-full`}
        />
        <div
          className="absolute top-0 bottom-0 w-0.5 bg-[#065F46] dark:bg-[#34D399]"
          style={{ left: '100%' }}
        />
      </div>
      <div className="text-center">
        <span className="text-sm font-bold text-[#065F46] dark:text-[#34D399]">
          {progress.toFixed(0)}% {progress < 30 ? '— Keep negotiating!' : progress < 60 ? '— Getting closer!' : '— Almost there!'}
        </span>
      </div>
    </div>
  );
}

// ─── Main Component ─────────────────────────────────────────────

export default function AINegotiatePage() {
  const { language } = useAuthStore();
  const sw = language === 'sw';

  const [itemName, setItemName] = useState('');
  const [askingPrice, setAskingPrice] = useState('');
  const [vendorName, setVendorName] = useState('');
  const [zoneId, setZoneId] = useState('');
  const [result, setResult] = useState<NegotiationResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentOffer, setCurrentOffer] = useState(0);
  const [negotiationStep, setNegotiationStep] = useState(0);
  const [showForm, setShowForm] = useState(true);

  const isFormValid = itemName.trim() !== '' && Number(askingPrice) > 0;

  const handleSubmit = useCallback(async () => {
    if (!isFormValid) return;
    setIsLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/ai/negotiation-coach', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          itemName,
          askingPrice: Number(askingPrice),
          vendorName: vendorName || undefined,
          zoneId: zoneId || undefined,
        }),
      });

      if (!res.ok) throw new Error('Failed to get negotiation strategy');
      const data = await res.json();
      if (!data.success) throw new Error(data.error || 'Request failed');

      setResult(data);
      setCurrentOffer(data.openingOffer);
      setNegotiationStep(0);
      setShowForm(false);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Something went wrong';
      setError(message);
    } finally {
      setIsLoading(false);
    }
  }, [itemName, askingPrice, vendorName, zoneId, isFormValid]);

  const advanceStep = useCallback(() => {
    if (!result) return;
    const nextStep = negotiationStep + 1;
    if (nextStep < result.tips.length) {
      setNegotiationStep(nextStep);
      const priceRange = Number(askingPrice) - result.targetPrice;
      const stepSize = priceRange / (result.tips.length + 1);
      setCurrentOffer(prev => Math.min(Number(askingPrice), prev + stepSize));
    }
  }, [result, negotiationStep, askingPrice]);

  const retreatStep = useCallback(() => {
    if (!result || negotiationStep <= 0) return;
    const prevStep = negotiationStep - 1;
    setNegotiationStep(prevStep);
    const priceRange = Number(askingPrice) - result.targetPrice;
    const stepSize = priceRange / (result.tips.length + 1);
    setCurrentOffer(prev => Math.max(result.openingOffer, prev - stepSize));
  }, [result, negotiationStep, askingPrice]);

  const handleStartOver = useCallback(() => {
    setResult(null);
    setShowForm(true);
    setError(null);
    setNegotiationStep(0);
    setCurrentOffer(0);
  }, []);

  const phaseColors: Record<string, string> = {
    opening: 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300',
    middle: 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300',
    closing: 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300',
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] dark:bg-[#0F172A]">
      {/* Hero */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 opacity-[0.03] dark:opacity-[0.05]" style={{ backgroundImage: 'radial-gradient(circle, #065F46 1px, transparent 1px)', backgroundSize: '24px 24px' }} />
        <div className="absolute -top-24 -right-24 w-72 h-72 rounded-full bg-[#065F46]/10 dark:bg-[#34D399]/5 blur-3xl" />
        <div className="relative px-4 pt-8 pb-10 sm:px-6 lg:px-8 max-w-5xl mx-auto text-center">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <div className="inline-flex items-center gap-2 bg-[#065F46]/10 dark:bg-[#34D399]/10 px-4 py-1.5 rounded-full mb-4">
              <Handshake className="w-4 h-4 text-[#065F46] dark:text-[#34D399]" />
              <span className="text-xs font-semibold text-[#065F46] dark:text-[#34D399] uppercase tracking-wider">
                AI Coach
              </span>
            </div>
          </motion.div>
          <motion.h1 initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="text-4xl sm:text-5xl font-extrabold tracking-tight mb-3">
            <span className="text-[#065F46] dark:text-[#34D399]">{sw ? 'Kocha wa' : 'Negotiation'}</span>{' '}
            <span className="text-[#F59E0B] dark:text-[#FBBF24]">{sw ? 'Mazungumzo' : 'Coach'}</span>
          </motion.h1>
          <motion.p initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="text-base sm:text-lg text-[#64748B] dark:text-[#94A3B8] max-w-xl mx-auto">
            {sw ? 'Jifunze kujadiliana kama mtaalamu' : 'Negotiate like a pro'}
          </motion.p>
        </div>
      </div>

      <div className="px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto pb-16">
        <AnimatePresence mode="wait">
          {showForm ? (
            <motion.div key="form" initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -30 }}>
              <div className="bg-white dark:bg-[#1E293B] rounded-2xl shadow-md border border-[#E2E8F0] dark:border-[#334155] p-5 sm:p-8 space-y-6">
                {/* Item name */}
                <div>
                  <label className="flex items-center gap-2 text-sm font-semibold text-[#0F172A] dark:text-[#F1F5F9] mb-3">
                    <MessageSquare className="w-4 h-4 text-[#F59E0B]" />
                    {sw ? 'Kitu unachonunua' : 'Item you are buying'}
                  </label>
                  <Input placeholder={sw ? 'Mfano: Kanga, Simu...' : 'e.g. Kanga fabric, Smartphone...'} value={itemName} onChange={(e) => setItemName(e.target.value)} className="h-12 rounded-xl border-[#E2E8F0] dark:border-[#334155] bg-[#F8FAFC] dark:bg-[#0F172A]" />
                </div>

                {/* Asking price */}
                <div>
                  <label className="flex items-center gap-2 text-sm font-semibold text-[#0F172A] dark:text-[#F1F5F9] mb-3">
                    <Target className="w-4 h-4 text-[#F59E0B]" />
                    {sw ? 'Bei ya muuzaji' : "Vendor's asking price"}
                  </label>
                  <div className="relative max-w-xs">
                    <Input type="number" placeholder="0" value={askingPrice} onChange={(e) => setAskingPrice(e.target.value)} className="h-12 rounded-xl pr-16 border-[#E2E8F0] dark:border-[#334155] bg-[#F8FAFC] dark:bg-[#0F172A]" />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-[#64748B] dark:text-[#94A3B8]">TZS</span>
                  </div>
                </div>

                {/* Vendor name & Zone */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div>
                    <label className="flex items-center gap-2 text-sm font-semibold text-[#0F172A] dark:text-[#F1F5F9] mb-3">
                      <Handshake className="w-4 h-4 text-[#F59E0B]" />
                      {sw ? 'Jina la muuzaji' : 'Vendor name'} <span className="text-xs text-[#94A3B8]">({sw ? 'si lazima' : 'optional'})</span>
                    </label>
                    <Input placeholder={sw ? 'Jina la muuzaji' : 'Vendor name'} value={vendorName} onChange={(e) => setVendorName(e.target.value)} className="h-12 rounded-xl border-[#E2E8F0] dark:border-[#334155] bg-[#F8FAFC] dark:bg-[#0F172A]" />
                  </div>
                  <div>
                    <label className="flex items-center gap-2 text-sm font-semibold text-[#0F172A] dark:text-[#F1F5F9] mb-3">
                      <Sparkles className="w-4 h-4 text-[#F59E0B]" />
                      {sw ? 'Eneo' : 'Zone'} <span className="text-xs text-[#94A3B8]">({sw ? 'si lazima' : 'optional'})</span>
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {ZONES.map(z => (
                        <button key={z.id} onClick={() => setZoneId(p => p === z.id ? '' : z.id)} className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${zoneId === z.id ? 'bg-[#065F46] dark:bg-[#34D399] text-white dark:text-[#022C22]' : 'bg-[#F1F5F9] dark:bg-[#334155] text-[#64748B] dark:text-[#94A3B8]'}`}>
                          {z.name}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Submit */}
                <button onClick={handleSubmit} disabled={!isFormValid || isLoading} className="w-full py-4 rounded-2xl text-base font-bold text-white bg-gradient-to-r from-[#065F46] via-[#059669] to-[#065F46] bg-[length:200%_100%] hover:bg-right shadow-lg shadow-[#065F46]/25 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-500 flex items-center justify-center gap-2.5">
                  {isLoading ? (<><Loader2 className="w-5 h-5 animate-spin" />{sw ? 'Inaandaa mkakati...' : 'Preparing strategy...'} </>) : (<><Sparkles className="w-5 h-5" />{sw ? 'Anza Mazungumzo' : 'Start Negotiation'}<ChevronRight className="w-4 h-4" /></>)}
                </button>

                {error && (
                  <div className="p-4 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 flex items-start gap-3">
                    <AlertTriangle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
                    <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
                  </div>
                )}
              </div>
            </motion.div>
          ) : result ? (
            <motion.div key="result" initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -30 }} className="space-y-6">
              {/* Progress Tracker */}
              <div className="bg-white dark:bg-[#1E293B] rounded-2xl shadow-md border border-[#E2E8F0] dark:border-[#334155] p-5 sm:p-6 space-y-5">
                <div className="flex items-center gap-2">
                  <TrendingDown className="w-5 h-5 text-[#F59E0B]" />
                  <h2 className="text-lg font-bold text-[#0F172A] dark:text-[#F1F5F9]">{sw ? 'Ufuatiliaji wa Mazungumzo' : 'Negotiation Tracker'}</h2>
                </div>

                <NegotiationProgress
                  askingPrice={Number(askingPrice)}
                  targetPrice={result.targetPrice}
                  currentOffer={currentOffer}
                />

                {/* Price summary */}
                <div className="grid grid-cols-3 gap-3">
                  <div className="text-center p-3 rounded-xl bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-800">
                    <p className="text-xs text-amber-600 dark:text-amber-400 mb-1">{sw ? 'Ofa ya kwanza' : 'Opening Offer'}</p>
                    <p className="text-lg font-bold text-amber-700 dark:text-amber-300">{formatTZS(result.openingOffer)}</p>
                  </div>
                  <div className="text-center p-3 rounded-xl bg-emerald-50 dark:bg-emerald-900/10 border border-emerald-200 dark:border-emerald-800">
                    <p className="text-xs text-emerald-600 dark:text-emerald-400 mb-1">{sw ? 'Lengo' : 'Target'}</p>
                    <p className="text-lg font-bold text-emerald-700 dark:text-emerald-300">{formatTZS(result.targetPrice)}</p>
                  </div>
                  <div className="text-center p-3 rounded-xl bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-800">
                    <p className="text-xs text-red-600 dark:text-red-400 mb-1">{sw ? 'Kiwango cha juu' : 'Max Walk-Away'}</p>
                    <p className="text-lg font-bold text-red-700 dark:text-red-300">{formatTZS(result.maxWalkAway)}</p>
                  </div>
                </div>

                {/* Current offer display */}
                <div className="text-center py-3 bg-[#065F46]/5 dark:bg-[#34D399]/5 rounded-xl">
                  <p className="text-xs text-[#64748B] dark:text-[#94A3B8] mb-1">{sw ? 'Ofa yako ya sasa' : 'Your current offer'}</p>
                  <p className="text-2xl font-extrabold text-[#065F46] dark:text-[#34D399]">{formatTZS(currentOffer)}</p>
                </div>
              </div>

              {/* Step-by-step tips */}
              <Card className="border-0 shadow-md">
                <CardHeader className="bg-gradient-to-r from-[#065F46] to-[#059669] dark:from-[#022C22] dark:to-[#065F46] py-4 px-5">
                  <CardTitle className="text-white flex items-center gap-2 text-base">
                    <Sparkles className="w-4 h-4 text-[#FBBF24]" />
                    {sw ? 'Hatua ya Mazungumzo' : 'Negotiation Steps'}
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="divide-y divide-[#F1F5F9] dark:divide-[#334155]">
                    {result.tips.map((tip, i) => {
                      const isActive = i === negotiationStep;
                      const isPast = i < negotiationStep;
                      return (
                        <motion.div key={i} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.08 }} className={`p-4 transition-colors ${isActive ? 'bg-[#ECFDF5]/50 dark:bg-[#064E3B]/30' : ''}`}>
                          <div className="flex items-start gap-4">
                            <div className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center ${isPast ? 'bg-emerald-100 dark:bg-emerald-900/30' : isActive ? 'bg-[#065F46] dark:bg-[#34D399]' : 'bg-gray-100 dark:bg-gray-800'}`}>
                              {isPast ? (
                                <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                              ) : (
                                <span className={`text-sm font-bold ${isActive ? 'text-white dark:text-[#022C22]' : 'text-[#64748B] dark:text-[#94A3B8]'}`}>{i + 1}</span>
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1">
                                <Badge className={`${phaseColors[tip.phase] || phaseColors.middle} border-0 text-xs font-bold capitalize`}>
                                  {tip.phase}
                                </Badge>
                              </div>
                              <p className={`text-sm leading-relaxed ${isActive ? 'text-[#0F172A] dark:text-[#F1F5F9] font-medium' : 'text-[#64748B] dark:text-[#94A3B8]'}`}>
                                {tip.advice}
                              </p>
                            </div>
                          </div>
                        </motion.div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>

              {/* Navigation buttons */}
              <div className="flex gap-3">
                <button onClick={retreatStep} disabled={negotiationStep <= 0} className="flex-1 py-3.5 rounded-2xl border-2 border-[#065F46] dark:border-[#34D399] text-[#065F46] dark:text-[#34D399] font-semibold text-sm flex items-center justify-center gap-2 disabled:opacity-30 transition-all hover:bg-[#065F46] hover:text-white dark:hover:bg-[#34D399] dark:hover:text-[#022C22]">
                  <ArrowLeft className="w-4 h-4" />
                  {sw ? 'Rudi' : 'Back'}
                </button>
                <button onClick={advanceStep} disabled={negotiationStep >= (result.tips.length - 1)} className="flex-1 py-3.5 rounded-2xl font-semibold text-sm bg-[#065F46] dark:bg-[#34D399] text-white dark:text-[#022C22] flex items-center justify-center gap-2 disabled:opacity-30 transition-all hover:opacity-90">
                  {sw ? 'Hatua ijayo' : 'Next Step'}
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>

              {/* Coach Script */}
              <div className="bg-white dark:bg-[#1E293B] rounded-2xl shadow-md border border-[#E2E8F0] dark:border-[#334155] p-5 sm:p-6 space-y-4">
                <div className="flex items-center gap-2">
                  <MessageSquare className="w-5 h-5 text-[#065F46] dark:text-[#34D399]" />
                  <h3 className="text-lg font-bold text-[#0F172A] dark:text-[#F1F5F9]">{sw ? 'Maandishi ya Kocha' : 'Coach Script'}</h3>
                </div>
                <div className="p-4 rounded-xl bg-[#ECFDF5]/60 dark:bg-[#064E3B]/40 border border-[#A7F3D0]/30 dark:border-[#065F46]/30">
                  {result.coachScript.split('\n').map((line, i) => {
                    const isYou = line.startsWith('You:');
                    const isVendor = line.startsWith('Vendor:');
                    return (
                      <p key={i} className={`text-sm mb-1.5 ${isYou ? 'text-[#065F46] dark:text-[#34D399] font-medium' : isVendor ? 'text-[#F59E0B] dark:text-[#FBBF24] font-medium' : 'text-[#64748B] dark:text-[#94A3B8] italic'}`}>
                        {line}
                      </p>
                    );
                  })}
                </div>
              </div>

              {/* Start Over */}
              <button onClick={handleStartOver} className="w-full py-3.5 rounded-2xl border-2 border-[#E2E8F0] dark:border-[#334155] text-[#64748B] dark:text-[#94A3B8] font-semibold text-sm flex items-center justify-center gap-2 hover:bg-[#F1F5F9] dark:hover:bg-[#334155] transition-all">
                {sw ? 'Anza upya' : 'Start New Negotiation'}
              </button>
            </motion.div>
          ) : null}
        </AnimatePresence>
      </div>
    </div>
  );
}

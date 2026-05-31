'use client';

import { useState, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Camera, Upload, Sparkles, Scan, X, Loader2, MapPin,
  DollarSign, Shield, MessageSquare, Info, ChevronRight,
  Clock, Trash2, ArrowRight, Eye, Star, Lightbulb, CheckCircle2
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import Link from 'next/link';

// ─── Types ───────────────────────────────────────────────────────────

interface VisionResult {
  name?: string;
  nameSwahili?: string;
  category?: string;
  fairPriceRange?: {
    min: number;
    max: number;
    currency: string;
  };
  quality?: 'low' | 'medium' | 'high' | 'premium';
  negotiationTips?: string[];
  whereToFind?: string;
  culturalNote?: string;
  alternatives?: string[];
  rawText?: string;
}

interface ScanHistoryItem {
  id: string;
  imagePreview: string;
  result: VisionResult;
  scannedAt: Date;
}

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

// ─── Quality config ──────────────────────────────────────────────────

const QUALITY_CONFIG: Record<string, { label: string; color: string; bg: string; darkBg: string }> = {
  low: { label: 'Low Quality', color: 'text-red-600 dark:text-red-400', bg: 'bg-red-50 dark:bg-red-900/20', darkBg: 'dark:bg-red-900/20' },
  medium: { label: 'Medium Quality', color: 'text-amber-600 dark:text-amber-400', bg: 'bg-amber-50 dark:bg-amber-900/20', darkBg: 'dark:bg-amber-900/20' },
  high: { label: 'High Quality', color: 'text-[#065F46] dark:text-[#34D399]', bg: 'bg-[#ECFDF5] dark:bg-[#064E3B]', darkBg: 'dark:bg-[#064E3B]' },
  premium: { label: 'Premium Quality', color: 'text-[#F59E0B] dark:text-[#FBBF24]', bg: 'bg-amber-50 dark:bg-amber-900/20', darkBg: 'dark:bg-amber-900/20' },
};

function formatTZS(amount: number): string {
  return `TZS ${amount.toLocaleString()}`;
}

// ─── Component ───────────────────────────────────────────────────────

export default function AIVisionPage() {
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageBase64, setImageBase64] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<VisionResult | null>(null);
  const [history, setHistory] = useState<ScanHistoryItem[]>([]);
  const [language, setLanguage] = useState('English');

  const cameraInputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // ── Handle image selection ──
  const handleImageSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setError(null);
    setResult(null);

    const reader = new FileReader();
    reader.onload = (ev) => {
      const dataUrl = ev.target?.result as string;
      setImagePreview(dataUrl);
      setImageBase64(dataUrl);
    };
    reader.readAsDataURL(file);

    // Reset input so same file can be re-selected
    e.target.value = '';
  }, []);

  // ── Clear image ──
  const handleClearImage = useCallback(() => {
    setImagePreview(null);
    setImageBase64(null);
    setResult(null);
    setError(null);
  }, []);

  // ── Submit for analysis ──
  const handleAnalyze = useCallback(async () => {
    if (!imageBase64) return;

    setIsLoading(true);
    setError(null);
    setResult(null);

    try {
      const res = await fetch('/api/ai/vision', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageBase64, language }),
      });

      if (!res.ok) throw new Error('Failed to analyze image');

      const data = await res.json();
      if (!data.success) throw new Error(data.error || 'Analysis failed');

      const visionResult: VisionResult = data.result;

      // Try to extract JSON from rawText if needed
      if (visionResult.rawText && !visionResult.name) {
        try {
          const raw = visionResult.rawText;
          const jsonMatch = raw.match(/\{[\s\S]*\}/);
          if (jsonMatch) {
            const parsed = JSON.parse(jsonMatch[0]);
            Object.assign(visionResult, parsed);
            delete visionResult.rawText;
          }
        } catch {
          // Keep rawText as-is
        }
      }

      setResult(visionResult);

      // Add to history
      const historyItem: ScanHistoryItem = {
        id: Date.now().toString(),
        imagePreview: imagePreview || '',
        result: visionResult,
        scannedAt: new Date(),
      };
      setHistory((prev) => [historyItem, ...prev].slice(0, 10));
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Something went wrong';
      setError(message);
    } finally {
      setIsLoading(false);
    }
  }, [imageBase64, language, imagePreview]);

  // ── Remove history item ──
  const removeHistoryItem = useCallback((id: string) => {
    setHistory((prev) => prev.filter((item) => item.id !== id));
  }, []);

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
              <Eye className="w-4 h-4 text-[#065F46] dark:text-[#34D399]" />
              <span className="text-xs font-semibold text-[#065F46] dark:text-[#34D399] uppercase tracking-wider">
                AI Vision
              </span>
            </div>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight mb-3"
          >
            <span className="gradient-text-green">AI Vision</span>{' '}
            <span className="gradient-text-gold">Scanner</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="text-base sm:text-lg text-[#64748B] dark:text-[#94A3B8] max-w-xl mx-auto"
          >
            Point, snap, and get instant AI analysis of any item in Kariakoo Market
          </motion.p>
        </div>
      </div>

      <div className="px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto pb-16 space-y-8">
        {/* ── Image Capture Section ── */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          <motion.div variants={itemVariants} className="kcard-glass p-5 sm:p-8">
            {/* Language Selector */}
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-base font-bold text-[#0F172A] dark:text-[#F1F5F9] flex items-center gap-2">
                <Camera className="w-5 h-5 text-[#F59E0B]" />
                Scan an Item
              </h3>
              <div className="flex items-center gap-2">
                <span className="text-xs text-[#64748B] dark:text-[#94A3B8]">Language:</span>
                <select
                  value={language}
                  onChange={(e) => setLanguage(e.target.value)}
                  className="text-xs font-semibold bg-[#ECFDF5] dark:bg-[#064E3B] text-[#065F46] dark:text-[#34D399] border-0 rounded-lg px-3 py-1.5 focus:ring-2 focus:ring-[#065F46]/20"
                >
                  <option value="English">English</option>
                  <option value="Swahili">Swahili</option>
                  <option value="Both">Both</option>
                </select>
              </div>
            </div>

            {/* Image Preview or Upload Area */}
            <AnimatePresence mode="wait">
              {imagePreview ? (
                <motion.div
                  key="preview"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="relative mb-6"
                >
                  <div className="relative rounded-2xl overflow-hidden border-2 border-[#E2E8F0] dark:border-[#334155] bg-black/5">
                    <img
                      src={imagePreview}
                      alt="Scanned item preview"
                      className="w-full max-h-80 object-contain mx-auto"
                    />
                    <button
                      onClick={handleClearImage}
                      className="absolute top-3 right-3 w-8 h-8 rounded-full bg-red-500 text-white flex items-center justify-center hover:bg-red-600 transition-colors shadow-lg"
                    >
                      <X className="w-4 h-4" />
                    </button>
                    {isLoading && (
                      <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                        <div className="flex flex-col items-center gap-3">
                          <div className="w-16 h-16 rounded-full border-4 border-white/30 border-t-[#34D399] animate-spin" />
                          <span className="text-white text-sm font-semibold">Analyzing…</span>
                        </div>
                      </div>
                    )}
                  </div>
                </motion.div>
              ) : (
                <motion.div
                  key="upload"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="mb-6"
                >
                  <div className="border-2 border-dashed border-[#E2E8F0] dark:border-[#334155] rounded-2xl p-8 sm:p-12 text-center hover:border-[#065F46] dark:hover:border-[#34D399] transition-colors">
                    <div className="flex flex-col items-center gap-4">
                      <div className="w-16 h-16 rounded-2xl bg-[#ECFDF5] dark:bg-[#064E3B] flex items-center justify-center">
                        <Scan className="w-8 h-8 text-[#065F46] dark:text-[#34D399]" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-[#0F172A] dark:text-[#F1F5F9] mb-1">
                          Take a photo or upload an image
                        </p>
                        <p className="text-xs text-[#64748B] dark:text-[#94A3B8]">
                          Point your camera at any item in Kariakoo Market
                        </p>
                      </div>
                      <div className="flex flex-col sm:flex-row gap-3">
                        <button
                          onClick={() => cameraInputRef.current?.click()}
                          className="kbtn flex items-center gap-2"
                        >
                          <Camera className="w-4 h-4" />
                          Take Photo
                        </button>
                        <button
                          onClick={() => fileInputRef.current?.click()}
                          className="kbtn-outline flex items-center gap-2"
                        >
                          <Upload className="w-4 h-4" />
                          Upload Image
                        </button>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Hidden file inputs */}
            <input
              ref={cameraInputRef}
              type="file"
              accept="image/*"
              capture="environment"
              onChange={handleImageSelect}
              className="hidden"
            />
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleImageSelect}
              className="hidden"
            />

            {/* Analyze Button */}
            {imagePreview && !result && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <button
                  onClick={handleAnalyze}
                  disabled={isLoading}
                  className="w-full py-4 rounded-2xl text-base font-bold text-white bg-gradient-to-r from-[#065F46] via-[#059669] to-[#065F46] bg-[length:200%_100%] hover:bg-right shadow-lg shadow-[#065F46]/25 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-500 flex items-center justify-center gap-2.5"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Analyzing with AI…
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-5 h-5" />
                      Analyze Item
                      <ChevronRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </motion.div>
            )}

            {/* Error */}
            {error && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-4 p-4 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 flex items-start gap-3"
              >
                <Info className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-semibold text-red-700 dark:text-red-400">Analysis Failed</p>
                  <p className="text-xs text-red-600 dark:text-red-400/80 mt-0.5">{error}</p>
                </div>
              </motion.div>
            )}
          </motion.div>
        </motion.div>

        {/* ── AI Analysis Results ── */}
        <AnimatePresence>
          {result && (
            <motion.div
              variants={containerVariants}
              initial="hidden"
              animate="visible"
              exit="hidden"
              className="space-y-6"
            >
              {/* Item Name */}
              <motion.div variants={itemVariants}>
                <div className="flex items-center gap-3 mb-1">
                  <h2 className="text-2xl sm:text-3xl font-extrabold text-[#0F172A] dark:text-[#F1F5F9]">
                    {result.name || 'Unknown Item'}
                  </h2>
                  {result.category && (
                    <Badge className="bg-[#ECFDF5] dark:bg-[#064E3B] text-[#065F46] dark:text-[#34D399] border-0 text-xs font-semibold">
                      {result.category}
                    </Badge>
                  )}
                </div>
                {result.nameSwahili && (
                  <p className="text-base text-[#065F46] dark:text-[#34D399] font-semibold">
                    {result.nameSwahili}
                  </p>
                )}
              </motion.div>

              {/* Fair Price Range - Large Green Card */}
              <motion.div variants={itemVariants}>
                <div className="kcard-green p-5 sm:p-6 relative overflow-hidden">
                  <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_80%,rgba(245,158,11,0.12),transparent_50%)] pointer-events-none" />
                  <div className="relative">
                    <div className="flex items-center gap-2 mb-3">
                      <DollarSign className="w-5 h-5 text-[#FBBF24]" />
                      <h3 className="text-lg font-bold text-white">Fair Price Range</h3>
                    </div>
                    {result.fairPriceRange ? (
                      <>
                        <div className="flex items-baseline gap-2 mb-2">
                          <span className="text-3xl sm:text-4xl font-extrabold text-white">
                            {formatTZS(result.fairPriceRange.min)}
                          </span>
                          <span className="text-xl text-white/60">—</span>
                          <span className="text-3xl sm:text-4xl font-extrabold text-white">
                            {formatTZS(result.fairPriceRange.max)}
                          </span>
                        </div>
                        <Badge className="bg-white/15 text-white border-0 text-xs">
                          {result.fairPriceRange.currency}
                        </Badge>
                      </>
                    ) : (
                      <p className="text-white/80 text-sm">Price data not available</p>
                    )}
                  </div>
                </div>
              </motion.div>

              {/* Quality & Where to Find - side by side */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Quality Assessment */}
                <motion.div variants={itemVariants}>
                  <div className={`p-5 sm:p-6 rounded-2xl border-2 ${
                    result.quality
                      ? `${QUALITY_CONFIG[result.quality]?.bg || 'bg-gray-50'} border-current/20`
                      : 'bg-gray-50 dark:bg-gray-900/20 border-gray-200 dark:border-gray-700'
                  }`}>
                    <div className="flex items-center gap-2 mb-3">
                      <Shield className={`w-5 h-5 ${result.quality ? QUALITY_CONFIG[result.quality]?.color : 'text-gray-500'}`} />
                      <h3 className="text-base font-bold text-[#0F172A] dark:text-[#F1F5F9]">
                        Quality Assessment
                      </h3>
                    </div>
                    {result.quality ? (
                      <div className="flex items-center gap-3">
                        <Badge className={`${
                          result.quality === 'premium' ? 'bg-[#F59E0B]/20 text-[#F59E0B] dark:bg-[#FBBF24]/20 dark:text-[#FBBF24]' :
                          result.quality === 'high' ? 'bg-[#065F46]/10 text-[#065F46] dark:bg-[#34D399]/10 dark:text-[#34D399]' :
                          result.quality === 'medium' ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/20 dark:text-amber-400' :
                          'bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-400'
                        } border-0 text-sm font-bold px-4 py-1.5`}>
                          {QUALITY_CONFIG[result.quality]?.label || result.quality}
                        </Badge>
                        <div className="flex items-center gap-0.5">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <Star
                              key={star}
                              className={`w-4 h-4 ${
                                star <= (result.quality === 'premium' ? 5 : result.quality === 'high' ? 4 : result.quality === 'medium' ? 3 : 1)
                                  ? 'text-[#F59E0B] dark:text-[#FBBF24] fill-[#F59E0B] dark:fill-[#FBBF24]'
                                  : 'text-gray-300 dark:text-gray-600'
                              }`}
                            />
                          ))}
                        </div>
                      </div>
                    ) : (
                      <p className="text-sm text-[#64748B] dark:text-[#94A3B8]">Quality data not available</p>
                    )}
                  </div>
                </motion.div>

                {/* Where to Find */}
                <motion.div variants={itemVariants}>
                  <div className="p-5 sm:p-6 rounded-2xl border-2 border-[#065F46]/20 dark:border-[#34D399]/20 bg-[#ECFDF5]/50 dark:bg-[#064E3B]/30">
                    <div className="flex items-center gap-2 mb-3">
                      <MapPin className="w-5 h-5 text-[#065F46] dark:text-[#34D399]" />
                      <h3 className="text-base font-bold text-[#0F172A] dark:text-[#F1F5F9]">
                        Where to Find
                      </h3>
                    </div>
                    <p className="text-sm text-[#065F46] dark:text-[#34D399] leading-relaxed">
                      {result.whereToFind || 'Location data not available'}
                    </p>
                  </div>
                </motion.div>
              </div>

              {/* Negotiation Tips */}
              {result.negotiationTips && result.negotiationTips.length > 0 && (
                <motion.div variants={itemVariants}>
                  <Card className="border-0 shadow-md overflow-hidden">
                    <CardHeader className="bg-gradient-to-r from-[#065F46] to-[#059669] dark:from-[#022C22] dark:to-[#065F46] py-4 px-5">
                      <CardTitle className="text-white flex items-center gap-2 text-base">
                        <MessageSquare className="w-4 h-4 text-[#FBBF24]" />
                        Negotiation Tips
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="p-0">
                      <div className="divide-y divide-[#F1F5F9] dark:divide-[#334155]">
                        {result.negotiationTips.map((tip, i) => (
                          <motion.div
                            key={i}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: i * 0.1, duration: 0.4 }}
                            className="p-4 sm:p-5 hover:bg-[#F8FAFC]/50 dark:hover:bg-[#1E293B]/50 transition-colors"
                          >
                            <div className="flex items-start gap-4">
                              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-[#ECFDF5] dark:bg-[#064E3B] flex items-center justify-center">
                                <span className="text-sm font-bold text-[#065F46] dark:text-[#34D399]">{i + 1}</span>
                              </div>
                              <p className="text-sm text-[#0F172A] dark:text-[#F1F5F9] leading-relaxed pt-1">
                                {tip}
                              </p>
                            </div>
                          </motion.div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              )}

              {/* Cultural Note */}
              {result.culturalNote && (
                <motion.div variants={itemVariants}>
                  <div className="p-5 sm:p-6 rounded-2xl border-2 border-amber-300 dark:border-amber-700 bg-amber-50/50 dark:bg-amber-900/10">
                    <div className="flex items-center gap-2 mb-3">
                      <Lightbulb className="w-5 h-5 text-amber-500" />
                      <h3 className="text-base font-bold text-amber-700 dark:text-amber-400">
                        Cultural Note
                      </h3>
                    </div>
                    <p className="text-sm text-amber-800 dark:text-amber-300/90 leading-relaxed">
                      {result.culturalNote}
                    </p>
                  </div>
                </motion.div>
              )}

              {/* Alternatives */}
              {result.alternatives && result.alternatives.length > 0 && (
                <motion.div variants={itemVariants}>
                  <div className="kcard p-5 sm:p-6">
                    <h3 className="text-base font-bold text-[#0F172A] dark:text-[#F1F5F9] flex items-center gap-2 mb-4">
                      <CheckCircle2 className="w-5 h-5 text-[#065F46] dark:text-[#34D399]" />
                      Similar Alternatives
                    </h3>
                    <div className="flex flex-wrap gap-2">
                      {result.alternatives.map((alt, i) => (
                        <Badge
                          key={i}
                          className="bg-[#ECFDF5] dark:bg-[#064E3B] text-[#065F46] dark:text-[#34D399] border-0 text-sm px-3 py-1"
                        >
                          {alt}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </motion.div>
              )}

              {/* Raw Text fallback */}
              {result.rawText && !result.name && (
                <motion.div variants={itemVariants}>
                  <div className="kcard p-5 sm:p-6">
                    <h3 className="text-base font-bold text-[#0F172A] dark:text-[#F1F5F9] flex items-center gap-2 mb-3">
                      <Sparkles className="w-5 h-5 text-[#F59E0B]" />
                      AI Analysis
                    </h3>
                    <p className="text-sm text-[#64748B] dark:text-[#94A3B8] whitespace-pre-wrap leading-relaxed">
                      {result.rawText}
                    </p>
                  </div>
                </motion.div>
              )}

              {/* Action Buttons */}
              <motion.div variants={itemVariants} className="flex flex-col sm:flex-row gap-3">
                <button
                  onClick={handleClearImage}
                  className="flex-1 kbtn-outline flex items-center justify-center gap-2 py-3.5"
                >
                  <Scan className="w-4 h-4" />
                  Scan Another Item
                </button>
                <Link
                  href="/seeker/ai-haggle"
                  className="flex-1 kbtn flex items-center justify-center gap-2 py-3.5"
                >
                  <MessageSquare className="w-4 h-4" />
                  Negotiate This
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── Loading Skeleton ── */}
        {isLoading && !result && (
          <div className="space-y-6">
            <div className="kcard-green p-6 space-y-3">
              <Skeleton className="h-5 w-32 bg-white/20" />
              <Skeleton className="h-10 w-64 bg-white/20" />
              <Skeleton className="h-6 w-20 bg-white/20" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <Skeleton className="h-28 rounded-2xl" />
              <Skeleton className="h-28 rounded-2xl" />
            </div>
            <div className="kcard p-6 space-y-4">
              <Skeleton className="h-5 w-40" />
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex gap-4">
                  <Skeleton className="w-8 h-8 rounded-full shrink-0" />
                  <Skeleton className="h-4 flex-1" />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── Scan History ── */}
        {history.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <div className="kcard p-5 sm:p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-base font-bold text-[#0F172A] dark:text-[#F1F5F9] flex items-center gap-2">
                  <Clock className="w-5 h-5 text-[#065F46] dark:text-[#34D399]" />
                  Scan History
                </h3>
                <Badge className="bg-[#ECFDF5] dark:bg-[#064E3B] text-[#065F46] dark:text-[#34D399] border-0 text-xs">
                  {history.length} items
                </Badge>
              </div>
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {history.map((item) => (
                  <motion.div
                    key={item.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="flex items-center gap-3 p-3 rounded-xl bg-[#F8FAFC] dark:bg-[#1E293B] hover:bg-[#F1F5F9] dark:hover:bg-[#334155] transition-colors group"
                  >
                    <div className="w-12 h-12 rounded-lg overflow-hidden shrink-0 bg-[#E2E8F0] dark:bg-[#334155]">
                      <img
                        src={item.imagePreview}
                        alt={item.result.name || 'Scanned item'}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-[#0F172A] dark:text-[#F1F5F9] truncate">
                        {item.result.name || 'Unknown Item'}
                      </p>
                      <div className="flex items-center gap-2 text-xs text-[#64748B] dark:text-[#94A3B8]">
                        {item.result.fairPriceRange && (
                          <span>{formatTZS(item.result.fairPriceRange.min)} – {formatTZS(item.result.fairPriceRange.max)}</span>
                        )}
                        <span className="text-[#94A3B8]">·</span>
                        <span>{item.scannedAt.toLocaleTimeString()}</span>
                      </div>
                    </div>
                    <button
                      onClick={() => removeHistoryItem(item.id)}
                      className="opacity-0 group-hover:opacity-100 w-7 h-7 rounded-lg bg-red-50 dark:bg-red-900/20 text-red-500 flex items-center justify-center hover:bg-red-100 dark:hover:bg-red-900/30 transition-all"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </motion.div>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}

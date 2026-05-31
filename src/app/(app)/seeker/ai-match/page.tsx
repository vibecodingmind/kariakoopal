'use client';

import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Sparkles, Search, DollarSign, Users, Languages, MapPin,
  ChevronRight, Loader2, Star, Clock, Heart, CheckCircle2,
  AlertCircle, X, Send, Compass, ArrowRight, UserCheck,
  ShoppingBag, Utensils, Landmark, Palette, Camera, Building2,
  Leaf, Cpu, Gem, Hammer, User, Calendar
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Slider } from '@/components/ui/slider';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Skeleton } from '@/components/ui/skeleton';

// ─── Types ───────────────────────────────────────────────────────────

interface GuideMatch {
  guideId: string;
  name: string;
  avatar: string;
  rating: number;
  yearsExperience: number;
  matchScore: number;
  reasons: string[];
  highlights: string[];
  estimatedCostPerHour: number;
  estimatedCostPerDay: number;
}

interface MatchFormData {
  interests: string[];
  language: string;
  budgetLevel: string;
  groupSize: number;
  preferredZones: string[];
  specialNeeds: string;
}

// ─── Constants ───────────────────────────────────────────────────────

const INTERESTS = [
  { id: 'culture', label: 'Culture', icon: Landmark },
  { id: 'shopping', label: 'Shopping', icon: ShoppingBag },
  { id: 'food', label: 'Food', icon: Utensils },
  { id: 'history', label: 'History', icon: Building2 },
  { id: 'art', label: 'Art', icon: Palette },
  { id: 'fashion', label: 'Fashion', icon: Heart },
  { id: 'photography', label: 'Photography', icon: Camera },
  { id: 'architecture', label: 'Architecture', icon: Building2 },
  { id: 'spices', label: 'Spices', icon: Leaf },
  { id: 'electronics', label: 'Electronics', icon: Cpu },
] as const;

const LANGUAGES = [
  { id: 'English', label: 'English' },
  { id: 'Swahili', label: 'Swahili' },
  { id: 'Both', label: 'Both' },
] as const;

const BUDGET_LEVELS = [
  { id: 'budget', label: 'Budget', desc: 'TZS 30k-80k/day' },
  { id: 'moderate', label: 'Moderate', desc: 'TZS 80k-200k/day' },
  { id: 'premium', label: 'Premium', desc: 'TZS 200k+/day' },
] as const;

const ZONES = [
  { id: 'kariakoo-central', label: 'Kariakoo Central' },
  { id: 'east-market', label: 'East Market' },
  { id: 'west-market', label: 'West Market' },
  { id: 'street-food', label: 'Street Food Area' },
  { id: 'fabric-zone', label: 'Fabric Zone' },
  { id: 'electronics-zone', label: 'Electronics Zone' },
] as const;

const MOCK_GUIDES: Omit<GuideMatch, 'matchScore' | 'reasons' | 'highlights' | 'estimatedCostPerHour' | 'estimatedCostPerDay'>[] = [
  { guideId: 'g1', name: 'Amina Hassan', avatar: 'AH', rating: 4.9, yearsExperience: 8 },
  { guideId: 'g2', name: 'Joseph Mwangi', avatar: 'JM', rating: 4.7, yearsExperience: 5 },
  { guideId: 'g3', name: 'Fatima Saidi', avatar: 'FS', rating: 4.8, yearsExperience: 12 },
  { guideId: 'g4', name: 'David Kimaro', avatar: 'DK', rating: 4.5, yearsExperience: 3 },
  { guideId: 'g5', name: 'Grace Mrema', avatar: 'GM', rating: 4.6, yearsExperience: 6 },
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

// ─── Helpers ─────────────────────────────────────────────────────────

function formatTZS(amount: number): string {
  return `TZS ${amount.toLocaleString()}`;
}

function getScoreColor(score: number): string {
  if (score >= 80) return 'from-[#065F46] to-[#34D399]';
  if (score >= 60) return 'from-[#F59E0B] to-[#FBBF24]';
  return 'from-[#0891B2] to-[#22D3EE]';
}

function getScoreTextColor(score: number): string {
  if (score >= 80) return 'text-[#065F46] dark:text-[#34D399]';
  if (score >= 60) return 'text-[#F59E0B] dark:text-[#FBBF24]';
  return 'text-[#0891B2] dark:text-[#22D3EE]';
}

function getScoreBorderColor(score: number): string {
  if (score >= 80) return 'border-[#065F46] dark:border-[#34D399]';
  if (score >= 60) return 'border-[#F59E0B] dark:border-[#FBBF24]';
  return 'border-[#0891B2] dark:border-[#22D3EE]';
}

// Circular progress for match score
function CircularScore({ score }: { score: number }) {
  const radius = 40;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;

  return (
    <div className="relative w-24 h-24 flex items-center justify-center">
      <svg className="w-24 h-24 -rotate-90" viewBox="0 0 100 100">
        <circle
          cx="50"
          cy="50"
          r={radius}
          stroke="currentColor"
          className="text-[#E2E8F0] dark:text-[#334155]"
          strokeWidth="6"
          fill="none"
        />
        <circle
          cx="50"
          cy="50"
          r={radius}
          stroke="url(#scoreGradient)"
          strokeWidth="6"
          fill="none"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className="transition-all duration-1000 ease-out"
        />
        <defs>
          <linearGradient id="scoreGradient" x1="0%" y1="0%" x2="100%" y2="0%">
            {score >= 80 ? (
              <>
                <stop offset="0%" stopColor="#065F46" />
                <stop offset="100%" stopColor="#34D399" />
              </>
            ) : score >= 60 ? (
              <>
                <stop offset="0%" stopColor="#F59E0B" />
                <stop offset="100%" stopColor="#FBBF24" />
              </>
            ) : (
              <>
                <stop offset="0%" stopColor="#0891B2" />
                <stop offset="100%" stopColor="#22D3EE" />
              </>
            )}
          </linearGradient>
        </defs>
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className={`text-2xl font-extrabold ${getScoreTextColor(score)}`}>
          {score}%
        </span>
        <span className="text-[10px] font-semibold text-[#64748B] dark:text-[#94A3B8] uppercase tracking-wider">
          Match
        </span>
      </div>
    </div>
  );
}

function parseMatches(raw: string, formData: MatchFormData): GuideMatch[] {
  const fallbackGuides: GuideMatch[] = MOCK_GUIDES.map((g, idx) => ({
    ...g,
    matchScore: Math.max(50, 95 - idx * 12),
    reasons: [
      'Strong expertise in your selected interests',
      'Speaks your preferred language',
      'Excellent ratings from past seekers',
    ],
    highlights: ['Top Rated', 'Local Expert', 'Verified'],
    estimatedCostPerHour: [15000, 20000, 25000, 12000, 18000][idx],
    estimatedCostPerDay: [80000, 120000, 150000, 60000, 100000][idx],
  }));

  try {
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      return parsed.map((m: Record<string, unknown>, idx: number) => {
        const guide = MOCK_GUIDES.find((g) => g.guideId === m.guideId) || MOCK_GUIDES[idx] || MOCK_GUIDES[0];
        return {
          guideId: (m.guideId as string) || guide.guideId,
          name: (m.name as string) || guide.name,
          avatar: (m.avatar as string) || guide.avatar,
          rating: (m.rating as number) || guide.rating,
          yearsExperience: (m.yearsExperience as number) || guide.yearsExperience,
          matchScore: Math.min(100, Math.max(0, (m.matchScore as number) || fallbackGuides[idx]?.matchScore || 50)),
          reasons: Array.isArray(m.reasons) ? m.reasons.map(String) : fallbackGuides[idx]?.reasons || [],
          highlights: Array.isArray(m.highlights) ? m.highlights.map(String) : fallbackGuides[idx]?.highlights || [],
          estimatedCostPerHour: (m.estimatedCostPerHour as number) || m.estimatedCost?.perHour || fallbackGuides[idx]?.estimatedCostPerHour || 15000,
          estimatedCostPerDay: (m.estimatedCostPerDay as number) || m.estimatedCost?.perDay || fallbackGuides[idx]?.estimatedCostPerDay || 80000,
        };
      }).sort((a: GuideMatch, b: GuideMatch) => b.matchScore - a.matchScore);
    }
    return fallbackGuides;
  } catch {
    return fallbackGuides;
  }
}

// ─── Component ───────────────────────────────────────────────────────

export default function AIMatchPage() {
  const [formData, setFormData] = useState<MatchFormData>({
    interests: [],
    language: 'English',
    budgetLevel: 'moderate',
    groupSize: 1,
    preferredZones: [],
    specialNeeds: '',
  });
  const [matches, setMatches] = useState<GuideMatch[] | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(true);

  const isFormValid = formData.interests.length > 0;

  // ── Toggle interest ──
  const toggleInterest = useCallback((id: string) => {
    setFormData((prev) => ({
      ...prev,
      interests: prev.interests.includes(id)
        ? prev.interests.filter((i) => i !== id)
        : [...prev.interests, id],
    }));
  }, []);

  // ── Toggle zone ──
  const toggleZone = useCallback((id: string) => {
    setFormData((prev) => ({
      ...prev,
      preferredZones: prev.preferredZones.includes(id)
        ? prev.preferredZones.filter((z) => z !== id)
        : [...prev.preferredZones, id],
    }));
  }, []);

  // ── Find matches ──
  const handleMatch = useCallback(async () => {
    if (!isFormValid) return;
    setIsLoading(true);
    setError(null);
    setMatches(null);

    try {
      const seekerPreferences = {
        interests: formData.interests,
        language: formData.language,
        budgetLevel: formData.budgetLevel,
        groupSize: formData.groupSize,
        preferredZones: formData.preferredZones,
        specialNeeds: formData.specialNeeds,
      };

      const availableGuides = MOCK_GUIDES.map((g) => ({
        guideId: g.guideId,
        name: g.name,
        rating: g.rating,
        yearsExperience: g.yearsExperience,
        languages: ['English', 'Swahili'],
        specializations: formData.interests,
        zones: formData.preferredZones.length > 0 ? formData.preferredZones : ['kariakoo-central'],
      }));

      const res = await fetch('/api/ai/match-guide', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ seekerPreferences, availableGuides }),
      });

      if (!res.ok) throw new Error('Failed to find matches');

      const data = await res.json();
      if (!data.success) throw new Error(data.error || 'Matching failed');

      const rawMatches = data.matches;
      if (Array.isArray(rawMatches)) {
        setMatches(parseMatches(JSON.stringify(rawMatches), formData));
      } else if (rawMatches?.rawResponse) {
        setMatches(parseMatches(rawMatches.rawResponse, formData));
      } else {
        setMatches(parseMatches(JSON.stringify(rawMatches), formData));
      }
      setShowForm(false);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Something went wrong';
      setError(message);
    } finally {
      setIsLoading(false);
    }
  }, [formData, isFormValid]);

  // ── Start over ──
  const handleStartOver = useCallback(() => {
    setMatches(null);
    setShowForm(true);
    setError(null);
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
            <span className="gradient-text-green">Smart Guide</span>{' '}
            <span className="gradient-text-gold">Matching</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="text-base sm:text-lg text-[#64748B] dark:text-[#94A3B8] max-w-xl mx-auto"
          >
            Find your perfect Kariakoo guide with AI
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
              {/* ── Matching Form ── */}
              <div className="kcard-glass p-5 sm:p-8 space-y-8">
                {/* Interests */}
                <div>
                  <label className="flex items-center gap-2 text-sm font-semibold text-[#0F172A] dark:text-[#F1F5F9] mb-3">
                    <Compass className="w-4 h-4 text-[#F59E0B]" />
                    What interests you?
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {INTERESTS.map((interest) => {
                      const Icon = interest.icon;
                      const isActive = formData.interests.includes(interest.id);
                      return (
                        <motion.button
                          key={interest.id}
                          whileTap={{ scale: 0.95 }}
                          onClick={() => toggleInterest(interest.id)}
                          className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-full text-sm font-medium transition-all duration-200 ${
                            isActive
                              ? 'bg-[#065F46] text-white shadow-md shadow-[#065F46]/20'
                              : 'bg-[#F1F5F9] dark:bg-[#334155] text-[#64748B] dark:text-[#94A3B8] hover:bg-[#E2E8F0] dark:hover:bg-[#475569]'
                          }`}
                        >
                          <Icon className="w-3.5 h-3.5" />
                          {interest.label}
                        </motion.button>
                      );
                    })}
                  </div>
                  {formData.interests.length === 0 && (
                    <p className="text-xs text-[#DC2626] mt-1.5 flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" /> Select at least one interest
                    </p>
                  )}
                </div>

                {/* Language & Budget */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  {/* Language */}
                  <div>
                    <label className="flex items-center gap-2 text-sm font-semibold text-[#0F172A] dark:text-[#F1F5F9] mb-3">
                      <Languages className="w-4 h-4 text-[#F59E0B]" />
                      Preferred language
                    </label>
                    <div className="flex gap-2">
                      {LANGUAGES.map((lang) => {
                        const isActive = formData.language === lang.id;
                        return (
                          <motion.button
                            key={lang.id}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => setFormData((p) => ({ ...p, language: lang.id }))}
                            className={`flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 ${
                              isActive
                                ? 'bg-[#065F46] dark:bg-[#34D399] text-white dark:text-[#022C22] shadow-md'
                                : 'bg-[#F1F5F9] dark:bg-[#334155] text-[#64748B] dark:text-[#94A3B8] hover:bg-[#E2E8F0] dark:hover:bg-[#475569]'
                            }`}
                          >
                            {lang.label}
                          </motion.button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Budget Level */}
                  <div>
                    <label className="flex items-center gap-2 text-sm font-semibold text-[#0F172A] dark:text-[#F1F5F9] mb-3">
                      <DollarSign className="w-4 h-4 text-[#F59E0B]" />
                      Budget level
                    </label>
                    <div className="flex gap-2">
                      {BUDGET_LEVELS.map((level) => {
                        const isActive = formData.budgetLevel === level.id;
                        return (
                          <motion.button
                            key={level.id}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => setFormData((p) => ({ ...p, budgetLevel: level.id }))}
                            className={`flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 ${
                              isActive
                                ? 'bg-[#065F46] dark:bg-[#34D399] text-white dark:text-[#022C22] shadow-md'
                                : 'bg-[#F1F5F9] dark:bg-[#334155] text-[#64748B] dark:text-[#94A3B8] hover:bg-[#E2E8F0] dark:hover:bg-[#475569]'
                            }`}
                          >
                            <div className="flex flex-col items-center">
                              <span>{level.label}</span>
                              <span className="text-[10px] opacity-70 mt-0.5">{level.desc}</span>
                            </div>
                          </motion.button>
                        );
                      })}
                    </div>
                  </div>
                </div>

                {/* Group Size */}
                <div>
                  <label className="flex items-center gap-2 text-sm font-semibold text-[#0F172A] dark:text-[#F1F5F9] mb-3">
                    <Users className="w-4 h-4 text-[#F59E0B]" />
                    Group size: <span className="gradient-text-green text-lg font-bold">{formData.groupSize}</span>
                  </label>
                  <Slider
                    value={[formData.groupSize]}
                    min={1}
                    max={10}
                    step={1}
                    onValueChange={(v) => setFormData((p) => ({ ...p, groupSize: v[0] }))}
                    className="w-full"
                  />
                  <div className="flex justify-between text-xs text-[#64748B] dark:text-[#94A3B8] mt-1">
                    <span>1 person</span>
                    <span>10 people</span>
                  </div>
                </div>

                {/* Preferred Zones */}
                <div>
                  <label className="flex items-center gap-2 text-sm font-semibold text-[#0F172A] dark:text-[#F1F5F9] mb-3">
                    <MapPin className="w-4 h-4 text-[#F59E0B]" />
                    Preferred zones
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {ZONES.map((zone) => {
                      const isActive = formData.preferredZones.includes(zone.id);
                      return (
                        <label
                          key={zone.id}
                          className={`flex items-center gap-2 p-3 rounded-xl cursor-pointer transition-all duration-200 border-2 ${
                            isActive
                              ? 'border-[#065F46] dark:border-[#34D399] bg-[#ECFDF5] dark:bg-[#064E3B]'
                              : 'border-[#E2E8F0] dark:border-[#334155] bg-white dark:bg-[#1E293B] hover:border-[#94A3B8]'
                          }`}
                        >
                          <Checkbox
                            checked={isActive}
                            onCheckedChange={() => toggleZone(zone.id)}
                            className={isActive ? 'border-[#065F46] dark:border-[#34D399]' : ''}
                          />
                          <span className={`text-sm font-medium ${
                            isActive
                              ? 'text-[#065F46] dark:text-[#34D399]'
                              : 'text-[#64748B] dark:text-[#94A3B8]'
                          }`}>
                            {zone.label}
                          </span>
                        </label>
                      );
                    })}
                  </div>
                </div>

                {/* Special Needs */}
                <div>
                  <label className="flex items-center gap-2 text-sm font-semibold text-[#0F172A] dark:text-[#F1F5F9] mb-3">
                    <AlertCircle className="w-4 h-4 text-[#F59E0B]" />
                    Special needs
                    <span className="text-xs font-normal text-[#94A3B8]">(optional)</span>
                  </label>
                  <Textarea
                    placeholder="Accessibility needs, family-friendly, dietary restrictions, etc."
                    value={formData.specialNeeds}
                    onChange={(e) => setFormData((p) => ({ ...p, specialNeeds: e.target.value }))}
                    className="kinput min-h-[80px] resize-none"
                  />
                </div>

                {/* Match Button */}
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                >
                  <button
                    onClick={handleMatch}
                    disabled={!isFormValid || isLoading}
                    className="w-full py-4 rounded-2xl text-base font-bold text-white bg-gradient-to-r from-[#065F46] via-[#059669] to-[#065F46] bg-[length:200%_100%] hover:bg-right shadow-lg shadow-[#065F46]/25 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-500 flex items-center justify-center gap-2.5"
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        Finding Your Perfect Guide…
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-5 h-5" />
                        Find My Perfect Guide
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
                    <AlertCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-semibold text-red-700 dark:text-red-400">Matching Failed</p>
                      <p className="text-xs text-red-600 dark:text-red-400/80 mt-0.5">{error}</p>
                    </div>
                  </motion.div>
                )}
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="results"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -30 }}
              transition={{ duration: 0.5 }}
            >
              {isLoading ? (
                <LoadingSkeleton />
              ) : matches ? (
                <ResultsDisplay matches={matches} onStartOver={handleStartOver} />
              ) : null}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

// ─── Results Display ─────────────────────────────────────────────────

function ResultsDisplay({
  matches,
  onStartOver,
}: {
  matches: GuideMatch[];
  onStartOver: () => void;
}) {
  const hasMatches = matches.length > 0;

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="space-y-6"
    >
      {/* Results Header */}
      <motion.div variants={itemVariants}>
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-[#0F172A] dark:text-[#F1F5F9] flex items-center gap-2">
              <UserCheck className="w-5 h-5 text-[#065F46] dark:text-[#34D399]" />
              {hasMatches
                ? `${matches.length} Guide${matches.length !== 1 ? 's' : ''} Found`
                : 'No Matches Found'}
            </h2>
            <p className="text-sm text-[#64748B] dark:text-[#94A3B8] mt-0.5">
              {hasMatches
                ? 'Sorted by match score (highest first)'
                : 'Try adjusting your preferences'}
            </p>
          </div>
          <button
            onClick={onStartOver}
            className="kbtn-outline flex items-center gap-2 py-2 px-4 text-sm"
          >
            <Search className="w-4 h-4" />
            New Search
          </button>
        </div>
      </motion.div>

      {/* No matches state */}
      {!hasMatches && (
        <motion.div variants={itemVariants}>
          <div className="kcard-glass p-8 text-center space-y-4">
            <div className="w-16 h-16 rounded-full bg-[#FEF3C7] dark:bg-[#78350F] flex items-center justify-center mx-auto">
              <Search className="w-8 h-8 text-[#F59E0B] dark:text-[#FCD34D]" />
            </div>
            <h3 className="text-lg font-bold text-[#0F172A] dark:text-[#F1F5F9]">
              No guides match your criteria
            </h3>
            <p className="text-sm text-[#64748B] dark:text-[#94A3B8] max-w-md mx-auto">
              Try broadening your interests, selecting more zones, or adjusting your budget level for better results.
            </p>
            <button
              onClick={onStartOver}
              className="kbtn py-2.5 px-6 text-sm"
            >
              Adjust Filters
            </button>
          </div>
        </motion.div>
      )}

      {/* Guide cards */}
      {matches.map((guide, idx) => (
        <motion.div
          key={guide.guideId}
          variants={itemVariants}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: idx * 0.1, duration: 0.4 }}
        >
          <Card className="border-0 shadow-md overflow-hidden">
            <CardContent className="p-5 sm:p-6">
              <div className="flex flex-col sm:flex-row gap-5">
                {/* Avatar + Score */}
                <div className="flex sm:flex-col items-center gap-4 sm:gap-3">
                  <div className={`relative w-16 h-16 rounded-full bg-gradient-to-br ${getScoreColor(guide.matchScore)} p-0.5`}>
                    <div className="w-full h-full rounded-full bg-white dark:bg-[#1E293B] flex items-center justify-center">
                      <span className="text-lg font-bold text-[#065F46] dark:text-[#34D399]">
                        {guide.avatar}
                      </span>
                    </div>
                  </div>
                  <CircularScore score={guide.matchScore} />
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0 space-y-3">
                  {/* Name + Rating */}
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h3 className="text-lg font-bold text-[#0F172A] dark:text-[#F1F5F9]">
                        {guide.name}
                      </h3>
                      <div className="flex items-center gap-3 mt-0.5">
                        <div className="flex items-center gap-1">
                          <Star className="w-3.5 h-3.5 text-[#F59E0B] fill-[#F59E0B]" />
                          <span className="text-sm font-semibold text-[#0F172A] dark:text-[#F1F5F9]">
                            {guide.rating}
                          </span>
                        </div>
                        <div className="flex items-center gap-1 text-sm text-[#64748B] dark:text-[#94A3B8]">
                          <Clock className="w-3.5 h-3.5" />
                          {guide.yearsExperience} yr{guide.yearsExperience !== 1 ? 's' : ''} exp
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Why this match */}
                  {guide.reasons.length > 0 && (
                    <div>
                      <p className="text-xs font-semibold text-[#065F46] dark:text-[#34D399] uppercase tracking-wider mb-1.5">
                        Why this match
                      </p>
                      <ul className="space-y-1">
                        {guide.reasons.map((reason, i) => (
                          <li key={i} className="flex items-start gap-2">
                            <CheckCircle2 className="w-3.5 h-3.5 text-[#065F46] dark:text-[#34D399] shrink-0 mt-0.5" />
                            <span className="text-sm text-[#64748B] dark:text-[#94A3B8] leading-relaxed">
                              {reason}
                            </span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Highlights */}
                  {guide.highlights.length > 0 && (
                    <div className="flex flex-wrap gap-1.5">
                      {guide.highlights.map((h, i) => (
                        <Badge
                          key={i}
                          className="bg-[#ECFDF5] dark:bg-[#064E3B] text-[#065F46] dark:text-[#34D399] border-0 text-xs font-semibold"
                        >
                          {h}
                        </Badge>
                      ))}
                    </div>
                  )}

                  {/* Cost + Actions */}
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pt-2 border-t border-[#F1F5F9] dark:border-[#334155]">
                    <div className="flex items-center gap-4">
                      <div>
                        <p className="text-xs text-[#64748B] dark:text-[#94A3B8]">Per hour</p>
                        <p className="text-sm font-bold text-[#065F46] dark:text-[#34D399]">
                          {formatTZS(guide.estimatedCostPerHour)}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-[#64748B] dark:text-[#94A3B8]">Per day</p>
                        <p className="text-sm font-bold text-[#065F46] dark:text-[#34D399]">
                          {formatTZS(guide.estimatedCostPerDay)}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button className="kbtn py-2 px-5 text-sm flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5" />
                        Book Now
                      </button>
                      <button className="kbtn-outline py-2 px-4 text-sm flex items-center gap-1.5">
                        View Profile
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      ))}
    </motion.div>
  );
}

// ─── Loading Skeleton ────────────────────────────────────────────────

function LoadingSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-10 w-32 rounded-xl" />
      </div>
      {[1, 2, 3].map((i) => (
        <div key={i} className="kcard p-6">
          <div className="flex flex-col sm:flex-row gap-5">
            <div className="flex sm:flex-col items-center gap-4">
              <Skeleton className="w-16 h-16 rounded-full" />
              <Skeleton className="w-24 h-24 rounded-full" />
            </div>
            <div className="flex-1 space-y-3">
              <Skeleton className="h-6 w-40" />
              <div className="flex gap-3">
                <Skeleton className="h-4 w-16" />
                <Skeleton className="h-4 w-24" />
              </div>
              <div className="space-y-2">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-3/4" />
              </div>
              <div className="flex gap-2">
                <Skeleton className="h-6 w-20 rounded-full" />
                <Skeleton className="h-6 w-20 rounded-full" />
                <Skeleton className="h-6 w-20 rounded-full" />
              </div>
              <div className="flex gap-4 pt-2">
                <Skeleton className="h-10 w-24 rounded-xl" />
                <Skeleton className="h-10 w-28 rounded-xl" />
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

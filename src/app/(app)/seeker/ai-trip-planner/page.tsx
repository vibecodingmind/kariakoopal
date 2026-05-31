'use client';

import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Sparkles, MapPin, Clock, DollarSign, Users, Calendar,
  ChevronRight, Wand2, Save, Share2, RefreshCw, Plus, Minus,
  Lightbulb, AlertCircle, Heart, Camera, ShoppingBag, Utensils,
  Landmark, Palette, Cpu, Leaf, Gem, Hammer, Building2,
  Backpack, Armchair, UsersRound, User, Group, ChevronDown,
  Check, Loader2, X, Send
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Slider } from '@/components/ui/slider';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Skeleton } from '@/components/ui/skeleton';

// ─── Types ───────────────────────────────────────────────────────────

interface TripActivity {
  time: string;
  location: string;
  description: string;
  estimatedCost: number;
  localTip?: string;
  duration?: string;
}

interface TripDay {
  day: number;
  title: string;
  activities: TripActivity[];
}

interface LocalTip {
  icon: string;
  title: string;
  description: string;
}

interface CulturalNote {
  title: string;
  description: string;
  importance: 'high' | 'medium' | 'low';
}

interface Itinerary {
  title: string;
  summary: string;
  totalEstimatedCost: number;
  duration: number;
  highlights: string[];
  days: TripDay[];
  localTips: LocalTip[];
  culturalNotes: CulturalNote[];
  rawText?: string;
}

interface TripFormData {
  interests: string[];
  budget: number;
  duration: number;
  travelStyle: string;
  groupSize: number;
  language: string;
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
  { id: 'electronics', label: 'Electronics', icon: Cpu },
  { id: 'spices', label: 'Spices', icon: Leaf },
  { id: 'jewelry', label: 'Jewelry', icon: Gem },
  { id: 'crafts', label: 'Crafts', icon: Hammer },
  { id: 'photography', label: 'Photography', icon: Camera },
  { id: 'architecture', label: 'Architecture', icon: Building2 },
] as const;

const TRAVEL_STYLES = [
  { id: 'adventurous', label: 'Adventurous', icon: Backpack, color: 'from-orange-500 to-red-500' },
  { id: 'relaxed', label: 'Relaxed', icon: Armchair, color: 'from-cyan-500 to-blue-500' },
  { id: 'cultural', label: 'Cultural', icon: Landmark, color: 'from-emerald-600 to-teal-500' },
  { id: 'family', label: 'Family-friendly', icon: UsersRound, color: 'from-violet-500 to-purple-500' },
  { id: 'solo', label: 'Solo', icon: User, color: 'from-amber-500 to-orange-500' },
  { id: 'group', label: 'Group', icon: Group, color: 'from-pink-500 to-rose-500' },
] as const;

const LANGUAGES = ['English', 'Swahili', 'Both'] as const;

const REFINEMENT_CHIPS = [
  'Make it cheaper',
  'Add more food',
  'Less walking',
  'More authentic',
] as const;

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

const timelineVariants = {
  hidden: { opacity: 0, x: -20 },
  visible: (i: number) => ({
    opacity: 1,
    x: 0,
    transition: {
      delay: i * 0.1,
      duration: 0.5,
      ease: [0.25, 0.46, 0.45, 0.94],
    },
  }),
};

// ─── Helper ──────────────────────────────────────────────────────────

function formatTZS(amount: number): string {
  return `TZS ${amount.toLocaleString()}`;
}

function getBudgetLabel(value: number): string {
  if (value <= 50000) return 'Budget';
  if (value <= 150000) return 'Economy';
  if (value <= 250000) return 'Moderate';
  if (value <= 400000) return 'Comfort';
  return 'Luxury';
}

// ─── Component ───────────────────────────────────────────────────────

export default function AITripPlannerPage() {
  const [formData, setFormData] = useState<TripFormData>({
    interests: [],
    budget: 150000,
    duration: 2,
    travelStyle: '',
    groupSize: 1,
    language: 'English',
    specialNeeds: '',
  });
  const [itinerary, setItinerary] = useState<Itinerary | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [refinementInput, setRefinementInput] = useState('');
  const [isRefining, setIsRefining] = useState(false);
  const [showForm, setShowForm] = useState(true);

  // ── Toggle interest ──
  const toggleInterest = useCallback((id: string) => {
    setFormData((prev) => ({
      ...prev,
      interests: prev.interests.includes(id)
        ? prev.interests.filter((i) => i !== id)
        : [...prev.interests, id],
    }));
  }, []);

  // ── Generate plan ──
  const handleGenerate = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    setItinerary(null);

    try {
      const res = await fetch('/api/ai/trip-planner', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          interests: formData.interests,
          budget: formData.budget,
          duration: formData.duration,
          travelStyle: formData.travelStyle || 'adventurous',
          groupSize: formData.groupSize,
          language: formData.language,
          specialNeeds: formData.specialNeeds,
        }),
      });

      if (!res.ok) throw new Error('Failed to generate itinerary');

      const data = await res.json();

      if (!data.success) throw new Error(data.error || 'Generation failed');

      const itin = data.itinerary;
      if (itin.rawText) {
        // Fallback: parse raw text into a displayable itinerary
        setItinerary(parseRawText(itin.rawText, formData));
      } else {
        setItinerary(itin);
      }
      setShowForm(false);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Something went wrong';
      setError(message);
    } finally {
      setIsLoading(false);
    }
  }, [formData]);

  // ── Refine plan ──
  const handleRefine = useCallback(async (instruction: string) => {
    if (!itinerary || !instruction.trim()) return;
    setIsRefining(true);
    setError(null);

    try {
      const res = await fetch('/api/ai/trip-planner', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          interests: formData.interests,
          budget: formData.budget,
          duration: formData.duration,
          travelStyle: formData.travelStyle || 'adventurous',
          groupSize: formData.groupSize,
          language: formData.language,
          specialNeeds: formData.specialNeeds,
          refinement: instruction,
          previousPlan: itinerary,
        }),
      });

      if (!res.ok) throw new Error('Failed to refine itinerary');

      const data = await res.json();
      if (!data.success) throw new Error(data.error || 'Refinement failed');

      const itin = data.itinerary;
      if (itin.rawText) {
        setItinerary(parseRawText(itin.rawText, formData));
      } else {
        setItinerary(itin);
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Something went wrong';
      setError(message);
    } finally {
      setIsRefining(false);
      setRefinementInput('');
    }
  }, [itinerary, formData]);

  // ── Start over ──
  const handleStartOver = useCallback(() => {
    setItinerary(null);
    setShowForm(true);
    setError(null);
  }, []);

  // ── Check form validity ──
  const isFormValid = formData.interests.length > 0 && formData.travelStyle !== '';

  return (
    <div className="min-h-screen bg-[#F8FAFC] dark:bg-[#0F172A]">
      {/* ── Hero Section ── */}
      <div className="relative overflow-hidden">
        {/* Animated dot pattern background */}
        <div
          className="absolute inset-0 opacity-[0.03] dark:opacity-[0.05]"
          style={{
            backgroundImage:
              'radial-gradient(circle, #065F46 1px, transparent 1px)',
            backgroundSize: '24px 24px',
          }}
        />
        {/* Gradient orbs */}
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
            <span className="gradient-text-green">AI Trip</span>{' '}
            <span className="gradient-text-gold">Planner</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="text-base sm:text-lg text-[#64748B] dark:text-[#94A3B8] max-w-xl mx-auto"
          >
            Let our AI create your perfect Kariakoo adventure
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
              {/* ── Planning Form ── */}
              <div className="kcard-glass p-5 sm:p-8 space-y-8">
                {/* Interests */}
                <div>
                  <label className="flex items-center gap-2 text-sm font-semibold text-[#0F172A] dark:text-[#F1F5F9] mb-3">
                    <Sparkles className="w-4 h-4 text-[#F59E0B]" />
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

                {/* Budget Range */}
                <div>
                  <label className="flex items-center gap-2 text-sm font-semibold text-[#0F172A] dark:text-[#F1F5F9] mb-1">
                    <DollarSign className="w-4 h-4 text-[#F59E0B]" />
                    Budget Range
                  </label>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs text-[#64748B] dark:text-[#94A3B8]">Budget (10,000)</span>
                    <Badge
                      variant="secondary"
                      className="bg-[#ECFDF5] dark:bg-[#064E3B] text-[#065F46] dark:text-[#34D399] font-semibold"
                    >
                      {formatTZS(formData.budget)} · {getBudgetLabel(formData.budget)}
                    </Badge>
                    <span className="text-xs text-[#64748B] dark:text-[#94A3B8]">Luxury (500,000)</span>
                  </div>
                  <Slider
                    value={[formData.budget]}
                    min={10000}
                    max={500000}
                    step={5000}
                    onValueChange={(v) => setFormData((p) => ({ ...p, budget: v[0] }))}
                    className="w-full"
                  />
                </div>

                {/* Duration & Group Size side by side */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  {/* Duration */}
                  <div>
                    <label className="flex items-center gap-2 text-sm font-semibold text-[#0F172A] dark:text-[#F1F5F9] mb-3">
                      <Calendar className="w-4 h-4 text-[#F59E0B]" />
                      Duration
                    </label>
                    <div className="flex items-center gap-3">
                      <motion.button
                        whileTap={{ scale: 0.9 }}
                        onClick={() =>
                          setFormData((p) => ({ ...p, duration: Math.max(1, p.duration - 1) }))
                        }
                        disabled={formData.duration <= 1}
                        className="w-10 h-10 rounded-xl bg-[#F1F5F9] dark:bg-[#334155] flex items-center justify-center text-[#0F172A] dark:text-[#F1F5F9] disabled:opacity-40 hover:bg-[#E2E8F0] dark:hover:bg-[#475569] transition-colors"
                      >
                        <Minus className="w-4 h-4" />
                      </motion.button>
                      <div className="flex-1 text-center">
                        <span className="text-3xl font-bold gradient-text-green">{formData.duration}</span>
                        <p className="text-xs text-[#64748B] dark:text-[#94A3B8]">
                          {formData.duration === 1 ? 'Day' : 'Days'}
                        </p>
                      </div>
                      <motion.button
                        whileTap={{ scale: 0.9 }}
                        onClick={() =>
                          setFormData((p) => ({ ...p, duration: Math.min(7, p.duration + 1) }))
                        }
                        disabled={formData.duration >= 7}
                        className="w-10 h-10 rounded-xl bg-[#F1F5F9] dark:bg-[#334155] flex items-center justify-center text-[#0F172A] dark:text-[#F1F5F9] disabled:opacity-40 hover:bg-[#E2E8F0] dark:hover:bg-[#475569] transition-colors"
                      >
                        <Plus className="w-4 h-4" />
                      </motion.button>
                    </div>
                  </div>

                  {/* Group Size */}
                  <div>
                    <label className="flex items-center gap-2 text-sm font-semibold text-[#0F172A] dark:text-[#F1F5F9] mb-3">
                      <Users className="w-4 h-4 text-[#F59E0B]" />
                      Group Size
                    </label>
                    <div className="flex items-center gap-3">
                      <motion.button
                        whileTap={{ scale: 0.9 }}
                        onClick={() =>
                          setFormData((p) => ({ ...p, groupSize: Math.max(1, p.groupSize - 1) }))
                        }
                        disabled={formData.groupSize <= 1}
                        className="w-10 h-10 rounded-xl bg-[#F1F5F9] dark:bg-[#334155] flex items-center justify-center text-[#0F172A] dark:text-[#F1F5F9] disabled:opacity-40 hover:bg-[#E2E8F0] dark:hover:bg-[#475569] transition-colors"
                      >
                        <Minus className="w-4 h-4" />
                      </motion.button>
                      <div className="flex-1 text-center">
                        <span className="text-3xl font-bold gradient-text-gold">{formData.groupSize}</span>
                        <p className="text-xs text-[#64748B] dark:text-[#94A3B8]">
                          {formData.groupSize === 1 ? 'Person' : 'People'}
                        </p>
                      </div>
                      <motion.button
                        whileTap={{ scale: 0.9 }}
                        onClick={() =>
                          setFormData((p) => ({ ...p, groupSize: Math.min(10, p.groupSize + 1) }))
                        }
                        disabled={formData.groupSize >= 10}
                        className="w-10 h-10 rounded-xl bg-[#F1F5F9] dark:bg-[#334155] flex items-center justify-center text-[#0F172A] dark:text-[#F1F5F9] disabled:opacity-40 hover:bg-[#E2E8F0] dark:hover:bg-[#475569] transition-colors"
                      >
                        <Plus className="w-4 h-4" />
                      </motion.button>
                    </div>
                  </div>
                </div>

                {/* Travel Style */}
                <div>
                  <label className="flex items-center gap-2 text-sm font-semibold text-[#0F172A] dark:text-[#F1F5F9] mb-3">
                    <Wand2 className="w-4 h-4 text-[#F59E0B]" />
                    Travel Style
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {TRAVEL_STYLES.map((style) => {
                      const Icon = style.icon;
                      const isActive = formData.travelStyle === style.id;
                      return (
                        <motion.button
                          key={style.id}
                          whileTap={{ scale: 0.97 }}
                          onClick={() =>
                            setFormData((p) => ({
                              ...p,
                              travelStyle: isActive ? '' : style.id,
                            }))
                          }
                          className={`relative flex flex-col items-center gap-2 p-4 rounded-2xl border-2 transition-all duration-200 ${
                            isActive
                              ? 'border-[#065F46] dark:border-[#34D399] bg-[#ECFDF5] dark:bg-[#064E3B] shadow-md'
                              : 'border-[#E2E8F0] dark:border-[#334155] bg-white dark:bg-[#1E293B] hover:border-[#94A3B8]'
                          }`}
                        >
                          {isActive && (
                            <motion.div
                              layoutId="style-check"
                              className="absolute top-2 right-2 w-5 h-5 rounded-full bg-[#065F46] dark:bg-[#34D399] flex items-center justify-center"
                            >
                              <Check className="w-3 h-3 text-white dark:text-[#022C22]" />
                            </motion.div>
                          )}
                          <div
                            className={`w-10 h-10 rounded-xl flex items-center justify-center bg-gradient-to-br ${style.color} text-white`}
                          >
                            <Icon className="w-5 h-5" />
                          </div>
                          <span
                            className={`text-xs font-semibold ${
                              isActive
                                ? 'text-[#065F46] dark:text-[#34D399]'
                                : 'text-[#64748B] dark:text-[#94A3B8]'
                            }`}
                          >
                            {style.label}
                          </span>
                        </motion.button>
                      );
                    })}
                  </div>
                  {formData.travelStyle === '' && (
                    <p className="text-xs text-[#DC2626] mt-1.5 flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" /> Select a travel style
                    </p>
                  )}
                </div>

                {/* Language & Special Needs side by side */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  {/* Language Preference */}
                  <div>
                    <label className="flex items-center gap-2 text-sm font-semibold text-[#0F172A] dark:text-[#F1F5F9] mb-3">
                      <Sparkles className="w-4 h-4 text-[#F59E0B]" />
                      Language
                    </label>
                    <div className="flex gap-2">
                      {LANGUAGES.map((lang) => {
                        const isActive = formData.language === lang;
                        return (
                          <motion.button
                            key={lang}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => setFormData((p) => ({ ...p, language: lang }))}
                            className={`flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 ${
                              isActive
                                ? 'bg-[#065F46] dark:bg-[#34D399] text-white dark:text-[#022C22] shadow-md'
                                : 'bg-[#F1F5F9] dark:bg-[#334155] text-[#64748B] dark:text-[#94A3B8] hover:bg-[#E2E8F0] dark:hover:bg-[#475569]'
                            }`}
                          >
                            {lang}
                          </motion.button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Special Needs */}
                  <div>
                    <label className="flex items-center gap-2 text-sm font-semibold text-[#0F172A] dark:text-[#F1F5F9] mb-3">
                      <AlertCircle className="w-4 h-4 text-[#F59E0B]" />
                      Special Needs
                      <span className="text-xs font-normal text-[#94A3B8]">(optional)</span>
                    </label>
                    <Input
                      placeholder="Accessibility, dietary, etc."
                      value={formData.specialNeeds}
                      onChange={(e) => setFormData((p) => ({ ...p, specialNeeds: e.target.value }))}
                      className="kinput"
                    />
                  </div>
                </div>

                {/* Generate Button */}
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                >
                  <button
                    onClick={handleGenerate}
                    disabled={!isFormValid || isLoading}
                    className="w-full py-4 rounded-2xl text-base font-bold text-white bg-gradient-to-r from-[#065F46] via-[#059669] to-[#065F46] bg-[length:200%_100%] hover:bg-right shadow-lg shadow-[#065F46]/25 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-500 flex items-center justify-center gap-2.5"
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        Generating Your Perfect Trip…
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-5 h-5" />
                        Generate My Trip Plan
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
                      <p className="text-sm font-semibold text-red-700 dark:text-red-400">
                        Generation Failed
                      </p>
                      <p className="text-xs text-red-600 dark:text-red-400/80 mt-0.5">{error}</p>
                    </div>
                  </motion.div>
                )}
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="itinerary"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -30 }}
              transition={{ duration: 0.5 }}
            >
              {isLoading ? (
                <LoadingSkeleton />
              ) : itinerary ? (
                <ItineraryDisplay
                  itinerary={itinerary}
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

// ─── Itinerary Display ───────────────────────────────────────────────

function ItineraryDisplay({
  itinerary,
  onRefine,
  isRefining,
  refinementInput,
  setRefinementInput,
  onStartOver,
}: {
  itinerary: Itinerary;
  onRefine: (instruction: string) => Promise<void>;
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
      {/* Trip Summary Card */}
      <motion.div variants={itemVariants}>
        <div className="kcard-green p-5 sm:p-6 relative overflow-hidden">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_80%,rgba(245,158,11,0.12),transparent_50%)] pointer-events-none" />
          <div className="relative">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h2 className="text-xl sm:text-2xl font-bold text-white mb-1">
                  {itinerary.title}
                </h2>
                <p className="text-sm text-white/70">{itinerary.summary}</p>
              </div>
              <div className="flex gap-2">
                <button className="w-9 h-9 rounded-xl bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors">
                  <Save className="w-4 h-4 text-white" />
                </button>
                <button className="w-9 h-9 rounded-xl bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors">
                  <Share2 className="w-4 h-4 text-white" />
                </button>
              </div>
            </div>

            <div className="flex flex-wrap gap-3 sm:gap-4 mb-4">
              <div className="flex items-center gap-1.5 text-sm text-white/80">
                <DollarSign className="w-4 h-4 text-[#FBBF24]" />
                <span className="font-semibold text-white">
                  {formatTZS(itinerary.totalEstimatedCost)}
                </span>
              </div>
              <div className="flex items-center gap-1.5 text-sm text-white/80">
                <Calendar className="w-4 h-4 text-[#FBBF24]" />
                <span className="font-semibold text-white">
                  {itinerary.duration} {itinerary.duration === 1 ? 'Day' : 'Days'}
                </span>
              </div>
              <div className="flex items-center gap-1.5 text-sm text-white/80">
                <MapPin className="w-4 h-4 text-[#FBBF24]" />
                <span className="font-semibold text-white">Kariakoo, Dar es Salaam</span>
              </div>
            </div>

            {/* Highlights */}
            <div className="flex flex-wrap gap-2">
              {itinerary.highlights.map((h, i) => (
                <Badge
                  key={i}
                  className="bg-white/15 text-white border-0 text-xs font-medium hover:bg-white/20"
                >
                  ✨ {h}
                </Badge>
              ))}
            </div>
          </div>
        </div>
      </motion.div>

      {/* Day-by-Day Timeline */}
      {itinerary.days.map((day) => (
        <motion.div key={day.day} variants={itemVariants}>
          <Card className="border-0 shadow-md overflow-hidden">
            <CardHeader className="bg-gradient-to-r from-[#065F46] to-[#059669] dark:from-[#022C22] dark:to-[#065F46] py-4 px-5">
              <CardTitle className="text-white flex items-center gap-2 text-base">
                <Calendar className="w-4 h-4 text-[#FBBF24]" />
                Day {day.day}: {day.title}
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="relative">
                {/* Timeline line */}
                <div className="absolute left-[27px] top-4 bottom-4 w-0.5 bg-gradient-to-b from-[#065F46]/20 via-[#065F46]/10 to-transparent dark:from-[#34D399]/20 dark:via-[#34D399]/10" />

                <div className="divide-y divide-[#F1F5F9] dark:divide-[#334155]">
                  {day.activities.map((activity, i) => (
                    <motion.div
                      key={i}
                      custom={i}
                      variants={timelineVariants}
                      initial="hidden"
                      animate="visible"
                      className="relative p-4 sm:p-5 pl-14 sm:pl-16 hover:bg-[#F8FAFC]/50 dark:hover:bg-[#1E293B]/50 transition-colors"
                    >
                      {/* Timeline dot */}
                      <div className="absolute left-[20px] top-6 w-3.5 h-3.5 rounded-full bg-[#065F46] dark:bg-[#34D399] border-2 border-white dark:border-[#1E293B] shadow-sm z-10" />

                      <div className="flex flex-col sm:flex-row sm:items-start gap-2 sm:gap-4">
                        <div className="flex items-center gap-2 sm:min-w-[100px]">
                          <Clock className="w-3.5 h-3.5 text-[#64748B] dark:text-[#94A3B8] shrink-0" />
                          <span className="text-sm font-semibold text-[#065F46] dark:text-[#34D399]">
                            {activity.time}
                          </span>
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-1.5 mb-1">
                            <MapPin className="w-3.5 h-3.5 text-[#F59E0B] shrink-0" />
                            <span className="text-sm font-semibold text-[#0F172A] dark:text-[#F1F5F9]">
                              {activity.location}
                            </span>
                          </div>
                          <p className="text-sm text-[#64748B] dark:text-[#94A3B8] leading-relaxed">
                            {activity.description}
                          </p>
                          {activity.localTip && (
                            <div className="mt-2.5 flex items-start gap-2 p-2.5 rounded-xl bg-[#FEF3C7]/60 dark:bg-[#78350F]/20 border border-[#FDE68A]/50 dark:border-[#92400E]/30">
                              <Lightbulb className="w-4 h-4 text-[#D97706] shrink-0 mt-0.5" />
                              <p className="text-xs text-[#92400E] dark:text-[#FCD34D] leading-relaxed">
                                {activity.localTip}
                              </p>
                            </div>
                          )}
                        </div>
                        <div className="flex items-center gap-1.5 sm:mt-0.5">
                          <DollarSign className="w-3.5 h-3.5 text-[#059669] dark:text-[#34D399]" />
                          <span className="text-sm font-semibold text-[#065F46] dark:text-[#34D399]">
                            {formatTZS(activity.estimatedCost)}
                          </span>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      ))}

      {/* Local Tips Grid */}
      {itinerary.localTips && itinerary.localTips.length > 0 && (
        <motion.div variants={itemVariants}>
          <h3 className="text-lg font-bold text-[#0F172A] dark:text-[#F1F5F9] mb-3 flex items-center gap-2">
            <Lightbulb className="w-5 h-5 text-[#F59E0B]" />
            Local Tips
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {itinerary.localTips.map((tip, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: i * 0.05 }}
                className="kcard p-4 flex items-start gap-3"
              >
                <span className="text-2xl">{tip.icon}</span>
                <div>
                  <h4 className="text-sm font-semibold text-[#0F172A] dark:text-[#F1F5F9]">
                    {tip.title}
                  </h4>
                  <p className="text-xs text-[#64748B] dark:text-[#94A3B8] mt-0.5 leading-relaxed">
                    {tip.description}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      )}

      {/* Cultural Notes */}
      {itinerary.culturalNotes && itinerary.culturalNotes.length > 0 && (
        <motion.div variants={itemVariants}>
          <h3 className="text-lg font-bold text-[#0F172A] dark:text-[#F1F5F9] mb-3 flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-[#065F46] dark:text-[#34D399]" />
            Cultural Notes
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {itinerary.culturalNotes.map((note, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: i * 0.05 }}
                className="kcard p-4"
              >
                <div className="flex items-center gap-2 mb-2">
                  <div
                    className={`w-2 h-2 rounded-full ${
                      note.importance === 'high'
                        ? 'bg-red-500'
                        : note.importance === 'medium'
                        ? 'bg-amber-500'
                        : 'bg-green-500'
                    }`}
                  />
                  <h4 className="text-sm font-semibold text-[#0F172A] dark:text-[#F1F5F9]">
                    {note.title}
                  </h4>
                </div>
                <p className="text-xs text-[#64748B] dark:text-[#94A3B8] leading-relaxed">
                  {note.description}
                </p>
              </motion.div>
            ))}
          </div>
        </motion.div>
      )}

      {/* Save & Share Buttons */}
      <motion.div variants={itemVariants} className="flex flex-col sm:flex-row gap-3">
        <button className="flex-1 kbtn flex items-center justify-center gap-2 py-3.5">
          <Save className="w-4 h-4" />
          Save to Profile
        </button>
        <button className="flex-1 kbtn-yellow flex items-center justify-center gap-2 py-3.5">
          <Share2 className="w-4 h-4" />
          Share via Link
        </button>
        <button
          onClick={onStartOver}
          className="flex-1 kbtn-outline flex items-center justify-center gap-2 py-3.5"
        >
          <RefreshCw className="w-4 h-4" />
          Start Over
        </button>
      </motion.div>

      {/* AI Refinement */}
      <motion.div variants={itemVariants}>
        <div className="kcard-glass p-5 sm:p-6 space-y-4">
          <h3 className="text-base font-bold text-[#0F172A] dark:text-[#F1F5F9] flex items-center gap-2">
            <Wand2 className="w-5 h-5 text-[#F59E0B]" />
            Refine This Plan
          </h3>

          {/* Quick refinement chips */}
          <div className="flex flex-wrap gap-2">
            {REFINEMENT_CHIPS.map((chip) => (
              <motion.button
                key={chip}
                whileTap={{ scale: 0.95 }}
                onClick={() => onRefine(chip)}
                disabled={isRefining}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-[#ECFDF5] dark:bg-[#064E3B] text-[#065F46] dark:text-[#34D399] hover:bg-[#065F46] hover:text-white dark:hover:bg-[#34D399] dark:hover:text-[#022C22] transition-all duration-200 disabled:opacity-50"
              >
                <Sparkles className="w-3 h-3" />
                {chip}
              </motion.button>
            ))}
          </div>

          {/* Custom refinement input */}
          <div className="flex gap-2">
            <div className="flex-1 relative">
              <Input
                placeholder="Ask AI to adjust your plan…"
                value={refinementInput}
                onChange={(e) => setRefinementInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && refinementInput.trim()) {
                    onRefine(refinementInput);
                  }
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
              onClick={() => onRefine(refinementInput)}
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
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Summary skeleton */}
      <div className="kcard-green p-6 space-y-4">
        <Skeleton className="h-7 w-3/4 bg-white/20" />
        <Skeleton className="h-4 w-full bg-white/15" />
        <div className="flex gap-4">
          <Skeleton className="h-5 w-28 bg-white/15" />
          <Skeleton className="h-5 w-20 bg-white/15" />
          <Skeleton className="h-5 w-36 bg-white/15" />
        </div>
        <div className="flex gap-2">
          <Skeleton className="h-6 w-16 rounded-full bg-white/15" />
          <Skeleton className="h-6 w-20 rounded-full bg-white/15" />
          <Skeleton className="h-6 w-14 rounded-full bg-white/15" />
        </div>
      </div>

      {/* Timeline skeleton */}
      {[1, 2].map((day) => (
        <Card key={day} className="border-0 shadow-md overflow-hidden">
          <div className="bg-gradient-to-r from-[#065F46] to-[#059669] py-3 px-5">
            <Skeleton className="h-5 w-40 bg-white/20" />
          </div>
          <CardContent className="p-4 space-y-4">
            {[1, 2, 3].map((slot) => (
              <div key={slot} className="flex gap-4">
                <Skeleton className="h-4 w-16" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-48" />
                  <Skeleton className="h-3 w-full" />
                  <Skeleton className="h-3 w-3/4" />
                </div>
                <Skeleton className="h-4 w-20" />
              </div>
            ))}
          </CardContent>
        </Card>
      ))}

      {/* Tips skeleton */}
      <div className="grid grid-cols-2 gap-3">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="kcard p-4 space-y-2">
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-3 w-full" />
            <Skeleton className="h-3 w-2/3" />
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Parse raw text fallback ─────────────────────────────────────────

function parseRawText(text: string, formData: TripFormData): Itinerary {
  // Attempt to extract structured data from raw AI text
  const lines = text.split('\n').filter((l) => l.trim());
  const days: TripDay[] = [];
  let currentDay: TripDay | null = null;
  let currentActivity: TripActivity | null = null;
  const highlights: string[] = [];

  for (const line of lines) {
    const dayMatch = line.match(/(?:Day|DAY)\s*(\d+)/i);
    if (dayMatch) {
      if (currentDay && currentActivity) {
        currentDay.activities.push(currentActivity);
        currentActivity = null;
      }
      currentDay = {
        day: parseInt(dayMatch[1]),
        title: line.replace(/[*#]/g, '').trim(),
        activities: [],
      };
      days.push(currentDay);
      continue;
    }

    if (!currentDay) continue;

    const timeMatch = line.match(/(\d{1,2}[:.]\d{2}\s*(?:AM|PM|am|pm)?)/);
    if (timeMatch) {
      if (currentActivity) {
        currentDay.activities.push(currentActivity);
      }
      currentActivity = {
        time: timeMatch[1],
        location: 'Kariakoo Market',
        description: line.replace(/[*#]/g, '').trim(),
        estimatedCost: Math.round(formData.budget / (formData.duration * 4)),
        localTip: undefined,
      };
    } else if (currentActivity) {
      const tipMatch = line.match(/tip|hint|advice|pro tip/i);
      if (tipMatch) {
        currentActivity.localTip = line.replace(/[*#]/g, '').trim();
      } else {
        currentActivity.description += ' ' + line.replace(/[*#]/g, '').trim();
      }
    }
  }

  if (currentDay && currentActivity) {
    currentDay.activities.push(currentActivity);
  }

  // If no days parsed, create a fallback structure
  if (days.length === 0) {
    for (let d = 1; d <= formData.duration; d++) {
      days.push({
        day: d,
        title: `Day ${d}: Explore Kariakoo`,
        activities: [
          {
            time: '09:00',
            location: 'Kariakoo Market Center',
            description: 'Start your day exploring the vibrant market',
            estimatedCost: Math.round(formData.budget / (formData.duration * 4)),
            localTip: 'Arrive early for the best deals!',
          },
          {
            time: '12:00',
            location: 'Local Restaurant',
            description: 'Enjoy authentic Tanzanian cuisine for lunch',
            estimatedCost: Math.round(formData.budget / (formData.duration * 6)),
          },
          {
            time: '15:00',
            location: 'Specialty Shops',
            description: 'Continue exploring based on your interests',
            estimatedCost: Math.round(formData.budget / (formData.duration * 3)),
          },
        ],
      });
    }
  }

  // Extract potential highlights from first few lines
  const firstLines = text.slice(0, 300);
  if (firstLines.toLowerCase().includes('highlight')) {
    const highlightMatch = firstLines.match(/highlight[s]?:?\s*(.+)/i);
    if (highlightMatch) {
      highlights.push(
        ...highlightMatch[1]
          .split(/[,;]/)
          .map((h) => h.trim())
          .filter(Boolean)
          .slice(0, 5)
      );
    }
  }
  if (highlights.length === 0) {
    highlights.push(
      ...formData.interests.slice(0, 3).map(
        (i) => i.charAt(0).toUpperCase() + i.slice(1)
      ),
      'Authentic Experience',
      'Local Food'
    );
  }

  return {
    title: `Your ${formData.duration}-Day Kariakoo Adventure`,
    summary: `A personalized ${formData.travelStyle} trip through Kariakoo Market, tailored for ${formData.groupSize} ${formData.groupSize === 1 ? 'traveler' : 'travelers'} with a ${getBudgetLabel(formData.budget)} budget.`,
    totalEstimatedCost: Math.round(formData.budget * 0.85),
    duration: formData.duration,
    highlights,
    days,
    localTips: [
      { icon: '💰', title: 'Bargaining is Expected', description: 'Always negotiate prices — vendors expect it! Start at 40-50% of the asking price.' },
      { icon: '🕐', title: 'Best Time to Visit', description: 'Early mornings (7-9 AM) have fewer crowds and fresher produce.' },
      { icon: '👟', title: 'Wear Comfortable Shoes', description: 'Kariakoo covers a large area with uneven paths — comfortable walking shoes are a must.' },
      { icon: '📱', title: 'Mobile Money', description: 'Most vendors accept M-Pesa. Carry small bills for smaller stalls that may not.' },
    ],
    culturalNotes: [
      { title: 'Dress Modestly', description: 'Kariakoo is in a predominantly Muslim area. Dress modestly out of respect, especially on Fridays.', importance: 'high' },
      { title: 'Greeting is Important', description: 'Always greet vendors with "Jambo" or "Habari" before starting negotiations — it sets a friendly tone.', importance: 'medium' },
      { title: 'Friday Prayer Times', description: 'Many shops close on Fridays between 12-2 PM for prayer. Plan around this time.', importance: 'medium' },
    ],
  };
}

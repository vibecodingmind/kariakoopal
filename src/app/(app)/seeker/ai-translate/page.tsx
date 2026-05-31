'use client';

import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Sparkles, Languages, ArrowRightLeft, Volume2, Copy, Share2,
  Loader2, Check, X, ChevronRight, Info, BookOpen,
  MessageCircle, MapPin, UtensilsCrossed, AlertOctagon, Hash,
  ShoppingBag, Send
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';

// ─── Types ───────────────────────────────────────────────────────────

interface TranslationResult {
  translation: string;
  pronunciation: string;
  culturalNote: string;
  alternatives: string[];
  formalityLevel: 'formal' | 'informal' | 'slang';
}

interface PhrasebookPhrase {
  english: string;
  swahili: string;
  pronunciation: string;
}

interface PhrasebookCategory {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  phrases: PhrasebookPhrase[];
}

// ─── Constants ───────────────────────────────────────────────────────

const COMMON_PHRASES = [
  'How much?',
  'Too expensive',
  "I'll buy it",
  'Thank you',
  'Where is...?',
];

const PHRASEBOOK: PhrasebookCategory[] = [
  {
    id: 'shopping',
    label: 'Shopping',
    icon: ShoppingBag,
    phrases: [
      { english: 'How much is this?', swahili: 'Hii ni bei gani?', pronunciation: 'hee-ee nee bay gah-nee' },
      { english: 'Can you lower the price?', swahili: 'Unaweza kupunguza bei?', pronunciation: 'oo-nah-weh-zah koo-poon-goo-zah bay' },
      { english: 'That is too expensive', swahili: 'Hiyo ni ghali sana', pronunciation: 'hee-yoh nee ghah-lee sah-nah' },
      { english: "I'll take it", swahili: 'Ninahitaji hii', pronunciation: 'nee-nah-hee-tah-jee hee-ee' },
      { english: 'Do you have a better one?', swahili: 'Una bora zaidi?', pronunciation: 'oo-nah boh-rah zah-ee-dee' },
      { english: 'I am just looking', swahili: 'Ninaangalia tu', pronunciation: 'nee-nah-ahng-gah-lee-ah too' },
      { english: 'Give me a discount', swahili: 'Nipe punguzo', pronunciation: 'nee-peh poon-goo-zoh' },
      { english: 'I will come back later', swahili: 'Nitarudi baadaye', pronunciation: 'nee-tah-roo-dee bah-ah-dah-yeh' },
    ],
  },
  {
    id: 'directions',
    label: 'Directions',
    icon: MapPin,
    phrases: [
      { english: 'Where is the nearest...?', swahili: '...iko wapi karibu?', pronunciation: '...ee-koh wah-pee kah-ree-boo' },
      { english: 'How do I get to...?', swahili: 'Ninafikaje...?', pronunciation: 'nee-nah-fee-kah-yeh' },
      { english: 'Is it far?', swahili: 'Ni mbali?', pronunciation: 'nee mm-bah-lee' },
      { english: 'Turn left', swahili: 'Geuka kushoto', pronunciation: 'geh-oo-kah koo-shoh-toh' },
      { english: 'Turn right', swahili: 'Geuka kulia', pronunciation: 'geh-oo-kah koo-lee-ah' },
      { english: 'Go straight', swahili: 'Enda mbele', pronunciation: 'ehn-dah mm-beh-leh' },
    ],
  },
  {
    id: 'food',
    label: 'Food',
    icon: UtensilsCrossed,
    phrases: [
      { english: "I'd like to order...", swahili: 'Ningependa kuagiza...', pronunciation: 'nee-geh-pehn-dah koo-ah-gee-zah' },
      { english: 'The bill, please', swahili: 'Bili tafadhali', pronunciation: 'bee-lee tah-fahd-hah-lee' },
      { english: 'Is it spicy?', swahili: 'Ina pilipili?', pronunciation: 'ee-nah pee-lee-pee-lee' },
      { english: 'Water, please', swahili: 'Maji tafadhali', pronunciation: 'mah-jee tah-fahd-hah-lee' },
      { english: 'Delicious!', swahili: 'Kitamu sana!', pronunciation: 'kee-tah-moo sah-nah' },
      { english: 'No pork please', swahili: 'Hakiti nyama ya nguruwe', pronunciation: 'hah-kee-tee nyah-mah yah ngoo-roo-weh' },
    ],
  },
  {
    id: 'greetings',
    label: 'Greetings',
    icon: MessageCircle,
    phrases: [
      { english: 'Hello / How are you?', swahili: 'Habari?', pronunciation: 'hah-bah-ree' },
      { english: 'I am fine', swahili: 'Mzuri', pronunciation: 'mm-zoo-ree' },
      { english: 'Good morning', swahili: 'Habari za asubuhi', pronunciation: 'hah-bah-ree zah ah-soo-boo-hee' },
      { english: 'Good evening', swahili: 'Habari za jioni', pronunciation: 'hah-bah-ree zah jee-oh-nee' },
      { english: 'Goodbye', swahili: 'Kwaheri', pronunciation: 'kwah-heh-ree' },
      { english: 'See you later', swahili: 'Tuonane baadaye', pronunciation: 'too-oh-nah-neh bah-ah-dah-yeh' },
      { english: 'My name is...', swahili: 'Jina langu ni...', pronunciation: 'jee-nah lah-ngoo nee' },
      { english: 'Nice to meet you', swahili: 'Nafurahi kukutana', pronunciation: 'nah-foo-rah-hee koo-koo-tah-nah' },
    ],
  },
  {
    id: 'emergency',
    label: 'Emergency',
    icon: AlertOctagon,
    phrases: [
      { english: 'Help!', swahili: 'Msaada!', pronunciation: 'mm-sah-ah-dah' },
      { english: 'I need a doctor', swahili: 'Ninahitaji daktari', pronunciation: 'nee-nah-hee-tah-jee dahk-tah-ree' },
      { english: 'Call the police', swahili: 'Piga simu polisi', pronunciation: 'pee-gah see-moo poh-lee-see' },
      { english: "I've lost my way", swahili: 'Nimepotea njia', pronunciation: 'nee-meh-poh-teh-ah njee-ah' },
      { english: 'Where is the hospital?', swahili: 'Hospitali iko wapi?', pronunciation: 'hoh-spee-tah-lee ee-koh wah-pee' },
    ],
  },
  {
    id: 'numbers',
    label: 'Numbers',
    icon: Hash,
    phrases: [
      { english: 'One (1)', swahili: 'Moja', pronunciation: 'moh-jah' },
      { english: 'Two (2)', swahili: 'Mbili', pronunciation: 'mm-bee-lee' },
      { english: 'Three (3)', swahili: 'Tatu', pronunciation: 'tah-too' },
      { english: 'Four (4)', swahili: 'Nne', pronunciation: 'n-neh' },
      { english: 'Five (5)', swahili: 'Tano', pronunciation: 'tah-noh' },
      { english: 'Ten (10)', swahili: 'Kumi', pronunciation: 'koo-mee' },
      { english: 'Twenty (20)', swahili: 'Ishirini', pronunciation: 'ee-shee-ree-nee' },
      { english: 'Hundred (100)', swahili: 'Mia', pronunciation: 'mee-ah' },
      { english: 'Thousand (1,000)', swahili: 'Elfu', pronunciation: 'ehl-foo' },
      { english: '10,000 TZS', swahili: 'Elfu kumi', pronunciation: 'ehl-foo koo-mee' },
      { english: '50,000 TZS', swahili: 'Elfu hamsini', pronunciation: 'ehl-foo hahm-see-nee' },
      { english: '100,000 TZS', swahili: 'Laki', pronunciation: 'lah-kee' },
    ],
  },
];

// ─── Animation variants ─────────────────────────────────────────────

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.06, delayChildren: 0.1 },
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

// ─── Component ───────────────────────────────────────────────────────

export default function AITranslatePage() {
  const [inputText, setInputText] = useState('');
  const [fromLang, setFromLang] = useState<'en' | 'sw'>('en');
  const [result, setResult] = useState<TranslationResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const toLang = fromLang === 'en' ? 'sw' : 'en';

  // ── Translate ──
  const handleTranslate = useCallback(async () => {
    if (!inputText.trim()) return;
    setIsLoading(true);
    setError(null);
    setResult(null);

    try {
      const res = await fetch('/api/ai/translate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: inputText,
          from: fromLang === 'en' ? 'English' : 'Swahili',
          to: toLang === 'sw' ? 'Swahili' : 'English',
          context: 'Shopping in Kariakoo Market, Dar es Salaam',
        }),
      });

      if (!res.ok) throw new Error('Translation failed');

      const data = await res.json();
      if (!data.success) throw new Error(data.error || 'Translation failed');

      const t = data.translation;
      if (typeof t === 'string') {
        setResult({
          translation: t,
          pronunciation: '',
          culturalNote: '',
          alternatives: [],
          formalityLevel: 'informal',
        });
      } else {
        setResult({
          translation: t.translation || '',
          pronunciation: t.pronunciation || '',
          culturalNote: t.culturalNote || '',
          alternatives: Array.isArray(t.alternatives) ? t.alternatives : [],
          formalityLevel: t.formalityLevel || 'informal',
        });
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Something went wrong';
      setError(message);
    } finally {
      setIsLoading(false);
    }
  }, [inputText, fromLang, toLang]);

  // ── Swap languages ──
  const handleSwap = useCallback(() => {
    setFromLang(toLang);
    if (result?.translation) {
      setInputText(result.translation);
      setResult(null);
    }
  }, [toLang, result]);

  // ── Copy ──
  const handleCopy = useCallback(async () => {
    if (!result?.translation) return;
    try {
      await navigator.clipboard.writeText(result.translation);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // silently fail
    }
  }, [result]);

  // ── Quick phrase ──
  const handleQuickPhrase = useCallback((phrase: string) => {
    setInputText(phrase);
    setResult(null);
  }, []);

  const formalityColors: Record<string, string> = {
    formal: 'bg-[#065F46] dark:bg-[#34D399] text-white dark:text-[#022C22]',
    informal: 'bg-[#F59E0B] dark:bg-[#FBBF24] text-white dark:text-[#0F172A]',
    slang: 'bg-[#7C3AED] dark:bg-[#A78BFA] text-white dark:text-[#0F172A]',
  };

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
              <Languages className="w-4 h-4 text-[#065F46] dark:text-[#34D399]" />
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
            <span className="gradient-text-green">AI</span>{' '}
            <span className="gradient-text-gold">Translator</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="text-base sm:text-lg text-[#64748B] dark:text-[#94A3B8] max-w-xl mx-auto"
          >
            English ↔ Swahili, tuned for Kariakoo Market
          </motion.p>
        </div>
      </div>

      <div className="px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto pb-16">
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="space-y-6"
        >
          {/* ── Translation Input Card ── */}
          <motion.div variants={itemVariants}>
            <div className="kcard-glass p-5 sm:p-8 space-y-6">
              {/* Language direction header */}
              <div className="flex items-center justify-center gap-4">
                <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[#ECFDF5] dark:bg-[#064E3B]">
                  <span className="text-sm font-bold text-[#065F46] dark:text-[#34D399]">
                    {fromLang === 'en' ? 'English' : 'Swahili'}
                  </span>
                </div>

                <motion.button
                  whileTap={{ scale: 0.9, rotate: 180 }}
                  onClick={handleSwap}
                  className="w-10 h-10 rounded-full bg-[#065F46] dark:bg-[#34D399] text-white dark:text-[#022C22] flex items-center justify-center shadow-md hover:shadow-lg transition-shadow"
                >
                  <ArrowRightLeft className="w-4 h-4" />
                </motion.button>

                <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[#FEF3C7] dark:bg-[#78350F]">
                  <span className="text-sm font-bold text-[#92400E] dark:text-[#FCD34D]">
                    {toLang === 'sw' ? 'Swahili' : 'English'}
                  </span>
                </div>
              </div>

              {/* Input textarea */}
              <Textarea
                placeholder={
                  fromLang === 'en'
                    ? 'Type in English… e.g. "How much is this kanga?"'
                    : 'Andika kwa Kiswahili… mfano "Hii kanga ni bei gani?"'
                }
                value={inputText}
                onChange={(e) => {
                  setInputText(e.target.value);
                  setResult(null);
                }}
                className="kinput min-h-[120px] text-base resize-none"
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleTranslate();
                  }
                }}
              />

              {/* Common phrase chips */}
              <div>
                <p className="text-xs font-semibold text-[#64748B] dark:text-[#94A3B8] mb-2 flex items-center gap-1.5">
                  <MessageCircle className="w-3 h-3" />
                  Quick phrases
                </p>
                <div className="flex flex-wrap gap-2">
                  {COMMON_PHRASES.map((phrase) => (
                    <motion.button
                      key={phrase}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => handleQuickPhrase(phrase)}
                      className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-semibold bg-[#ECFDF5] dark:bg-[#064E3B] text-[#065F46] dark:text-[#34D399] hover:bg-[#065F46] hover:text-white dark:hover:bg-[#34D399] dark:hover:text-[#022C22] transition-all duration-200"
                    >
                      {phrase}
                    </motion.button>
                  ))}
                </div>
              </div>

              {/* Translate button */}
              <button
                onClick={handleTranslate}
                disabled={!inputText.trim() || isLoading}
                className="w-full py-4 rounded-2xl text-base font-bold text-white bg-gradient-to-r from-[#065F46] via-[#059669] to-[#065F46] bg-[length:200%_100%] hover:bg-right shadow-lg shadow-[#065F46]/25 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-500 flex items-center justify-center gap-2.5"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Translating…
                  </>
                ) : (
                  <>
                    <Sparkles className="w-5 h-5" />
                    Translate
                    <ChevronRight className="w-4 h-4" />
                  </>
                )}
              </button>

              {/* Error */}
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="p-4 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 flex items-start gap-3"
                >
                  <AlertOctagon className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-semibold text-red-700 dark:text-red-400">Translation Failed</p>
                    <p className="text-xs text-red-600 dark:text-red-400/80 mt-0.5">{error}</p>
                  </div>
                </motion.div>
              )}
            </div>
          </motion.div>

          {/* ── Translation Result ── */}
          <AnimatePresence>
            {result && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.4 }}
                className="space-y-4"
              >
                {/* Main translation */}
                <div className="kcard-green p-5 sm:p-6 relative overflow-hidden">
                  <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_80%,rgba(245,158,11,0.12),transparent_50%)] pointer-events-none" />
                  <div className="relative">
                    <div className="flex items-center justify-between mb-3">
                      <Badge className="bg-white/15 text-white border-0 text-xs">
                        {toLang === 'sw' ? 'Swahili' : 'English'}
                      </Badge>
                      <div className="flex gap-2">
                        <button
                          onClick={handleCopy}
                          className="w-9 h-9 rounded-xl bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors"
                          title="Copy translation"
                        >
                          {copied ? (
                            <Check className="w-4 h-4 text-white" />
                          ) : (
                            <Copy className="w-4 h-4 text-white" />
                          )}
                        </button>
                        <button className="w-9 h-9 rounded-xl bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors" title="Share">
                          <Share2 className="w-4 h-4 text-white" />
                        </button>
                      </div>
                    </div>
                    <p className="text-2xl sm:text-3xl font-bold text-white leading-relaxed mb-3">
                      {result.translation}
                    </p>
                    {result.pronunciation && (
                      <p className="text-base text-white/70 italic">
                        /{result.pronunciation}/
                      </p>
                    )}
                  </div>
                </div>

                {/* Details row */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Pronunciation Guide */}
                  {result.pronunciation && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: 0.1 }}
                      className="kcard p-4 space-y-2"
                    >
                      <h4 className="text-sm font-semibold text-[#0F172A] dark:text-[#F1F5F9] flex items-center gap-2">
                        <Volume2 className="w-4 h-4 text-[#065F46] dark:text-[#34D399]" />
                        Pronunciation Guide
                      </h4>
                      <p className="text-base text-[#065F46] dark:text-[#34D399] font-medium">
                        /{result.pronunciation}/
                      </p>
                      <button className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#ECFDF5] dark:bg-[#064E3B] text-[#065F46] dark:text-[#34D399] text-xs font-semibold hover:bg-[#065F46] hover:text-white dark:hover:bg-[#34D399] dark:hover:text-[#022C22] transition-all">
                        <Volume2 className="w-3 h-3" />
                        Play Audio
                      </button>
                    </motion.div>
                  )}

                  {/* Cultural Note */}
                  {result.culturalNote && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: 0.15 }}
                      className="p-4 rounded-2xl border-2 border-amber-300 dark:border-amber-700 bg-amber-50/50 dark:bg-amber-900/10 space-y-2"
                    >
                      <h4 className="text-sm font-semibold text-amber-700 dark:text-amber-400 flex items-center gap-2">
                        <Info className="w-4 h-4" />
                        Cultural Note
                      </h4>
                      <p className="text-sm text-amber-800 dark:text-amber-300/90 leading-relaxed">
                        {result.culturalNote}
                      </p>
                    </motion.div>
                  )}
                </div>

                {/* Alternative Expressions & Formality */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Alternative Expressions */}
                  {result.alternatives.length > 0 && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: 0.2 }}
                      className="kcard p-4 space-y-3"
                    >
                      <h4 className="text-sm font-semibold text-[#0F172A] dark:text-[#F1F5F9] flex items-center gap-2">
                        <BookOpen className="w-4 h-4 text-[#065F46] dark:text-[#34D399]" />
                        Alternative Expressions
                      </h4>
                      <ul className="space-y-2">
                        {result.alternatives.map((alt, i) => (
                          <li
                            key={i}
                            className="flex items-start gap-2 p-2 rounded-lg bg-[#F8FAFC] dark:bg-[#0F172A]"
                          >
                            <span className="text-sm font-medium text-[#065F46] dark:text-[#34D399] mt-0.5">
                              {i + 1}.
                            </span>
                            <span className="text-sm text-[#0F172A] dark:text-[#F1F5F9] leading-relaxed">
                              {alt}
                            </span>
                          </li>
                        ))}
                      </ul>
                    </motion.div>
                  )}

                  {/* Formality Level */}
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.25 }}
                    className="kcard p-4 space-y-3"
                  >
                    <h4 className="text-sm font-semibold text-[#0F172A] dark:text-[#F1F5F9] flex items-center gap-2">
                      <Info className="w-4 h-4 text-[#065F46] dark:text-[#34D399]" />
                      Formality Level
                    </h4>
                    <div className="flex items-center gap-3">
                      <span
                        className={`inline-flex items-center px-4 py-2 rounded-xl text-sm font-bold ${formalityColors[result.formalityLevel] || formalityColors.informal}`}
                      >
                        {result.formalityLevel === 'formal'
                          ? 'Formal'
                          : result.formalityLevel === 'informal'
                          ? 'Informal'
                          : 'Slang'}
                      </span>
                      <p className="text-xs text-[#64748B] dark:text-[#94A3B8] leading-relaxed">
                        {result.formalityLevel === 'formal'
                          ? 'Use with elders, officials, and in formal settings'
                          : result.formalityLevel === 'informal'
                          ? 'Perfect for everyday market conversations'
                          : 'Very casual — use with friends or young vendors'}
                      </p>
                    </div>
                  </motion.div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* ── Market Phrasebook ── */}
          <motion.div variants={itemVariants}>
            <div className="kcard-glass p-5 sm:p-6">
              <h2 className="text-xl font-bold text-[#0F172A] dark:text-[#F1F5F9] mb-1 flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-[#F59E0B]" />
                Market Phrasebook
              </h2>
              <p className="text-sm text-[#64748B] dark:text-[#94A3B8] mb-4">
                Essential phrases for Kariakoo Market
              </p>

              <Accordion type="single" collapsible className="space-y-2">
                {PHRASEBOOK.map((category) => {
                  const Icon = category.icon;
                  return (
                    <AccordionItem
                      key={category.id}
                      value={category.id}
                      className="border-0 rounded-xl overflow-hidden bg-white dark:bg-[#1E293B] shadow-sm"
                    >
                      <AccordionTrigger className="px-4 py-3 hover:no-underline hover:bg-[#F8FAFC] dark:hover:bg-[#0F172A] transition-colors [&>svg]:text-[#065F46] dark:[&>svg]:text-[#34D399]">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-lg bg-[#ECFDF5] dark:bg-[#064E3B] flex items-center justify-center">
                            <Icon className="w-4 h-4 text-[#065F46] dark:text-[#34D399]" />
                          </div>
                          <span className="text-sm font-semibold text-[#0F172A] dark:text-[#F1F5F9]">
                            {category.label}
                          </span>
                          <Badge
                            variant="secondary"
                            className="bg-[#F1F5F9] dark:bg-[#334155] text-[#64748B] dark:text-[#94A3B8] text-xs"
                          >
                            {category.phrases.length}
                          </Badge>
                        </div>
                      </AccordionTrigger>
                      <AccordionContent className="px-4 pb-3">
                        <div className="space-y-2 max-h-72 overflow-y-auto scrollbar-hide">
                          {category.phrases.map((phrase, i) => (
                            <motion.button
                              key={i}
                              initial={{ opacity: 0, x: -10 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ delay: i * 0.03 }}
                              onClick={() => handleQuickPhrase(phrase.english)}
                              className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-[#ECFDF5] dark:hover:bg-[#064E3B] transition-colors text-left group"
                            >
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-[#0F172A] dark:text-[#F1F5F9]">
                                  {phrase.english}
                                </p>
                                <p className="text-sm font-semibold text-[#065F46] dark:text-[#34D399] mt-0.5">
                                  {phrase.swahili}
                                </p>
                                <p className="text-xs text-[#F59E0B] dark:text-[#FBBF24] italic mt-0.5">
                                  /{phrase.pronunciation}/
                                </p>
                              </div>
                              <div className="flex items-center gap-1.5 shrink-0">
                                <span className="w-7 h-7 rounded-lg bg-[#ECFDF5] dark:bg-[#064E3B] flex items-center justify-center group-hover:bg-[#065F46] dark:group-hover:bg-[#34D399] transition-colors">
                                  <Volume2 className="w-3.5 h-3.5 text-[#065F46] dark:text-[#34D399] group-hover:text-white dark:group-hover:text-[#022C22]" />
                                </span>
                                <ChevronRight className="w-4 h-4 text-[#94A3B8] group-hover:text-[#065F46] dark:group-hover:text-[#34D399] transition-colors" />
                              </div>
                            </motion.button>
                          ))}
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                  );
                })}
              </Accordion>
            </div>
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
}

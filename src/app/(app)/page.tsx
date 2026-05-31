'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import {
  Sparkles, Languages, Handshake, UserCheck, MapPin,
  ArrowRight, Star, TrendingDown, Volume2, Compass,
  Brain, CalendarDays, Shield, Wallet, QrCode, Gift,
  Navigation, Bot, Lightbulb, Zap, Loader2
} from 'lucide-react';
import Link from 'next/link';
import { useAuthStore } from '@/lib/stores/auth-store';

// ─── AI Feature Cards ────────────────────────────────────────────────

const AI_FEATURES = [
  {
    title: 'AI Trip Planner',
    subtitle: 'Plan your perfect Kariakoo adventure',
    description: 'AI generates personalized day-by-day itineraries based on your interests, budget, and travel style with local tips and cultural notes.',
    href: '/seeker/ai-trip-planner',
    icon: CalendarDays,
    gradient: 'from-[#065F46] to-[#059669]',
    lightBg: 'bg-[#ECFDF5] dark:bg-[#064E3B]',
    iconColor: 'text-[#065F46] dark:text-[#34D399]',
    badges: ['Day-by-Day', 'Local Tips', 'Cultural Notes'],
    badgeIcon: Sparkles,
    featured: true,
  },
  {
    title: 'AI Haggling Assistant',
    subtitle: 'Never overpay in Kariakoo again',
    description: 'Get AI-powered price negotiation advice, Swahili bargaining phrases, walk-away prices, and cultural tips.',
    href: '/seeker/ai-haggle',
    icon: Handshake,
    gradient: 'from-[#065F46] to-[#059669]',
    lightBg: 'bg-[#ECFDF5] dark:bg-[#064E3B]',
    iconColor: 'text-[#065F46] dark:text-[#34D399]',
    badges: ['Price Ranges', 'Swahili Phrases', 'Cultural Tips'],
    badgeIcon: TrendingDown,
  },
  {
    title: 'AI Translator',
    subtitle: 'English ↔ Swahili for Kariakoo',
    description: 'Real-time AI translation tuned for market context, with pronunciation guides, cultural notes, and a complete phrasebook.',
    href: '/seeker/ai-translate',
    icon: Languages,
    gradient: 'from-[#0891B2] to-[#06B6D4]',
    lightBg: 'bg-[#ECFEFF] dark:bg-[#164E63]',
    iconColor: 'text-[#0891B2] dark:text-[#22D3EE]',
    badges: ['Pronunciation', 'Cultural Notes', 'Phrasebook'],
    badgeIcon: Volume2,
  },
  {
    title: 'Smart Guide Matching',
    subtitle: 'Find your perfect Kariakoo guide',
    description: 'AI matches you with local guides based on your interests, language, budget, and preferred zones with compatibility scores.',
    href: '/seeker/ai-match',
    icon: UserCheck,
    gradient: 'from-[#F59E0B] to-[#FBBF24]',
    lightBg: 'bg-[#FEF3C7] dark:bg-[#78350F]',
    iconColor: 'text-[#F59E0B] dark:text-[#FBBF24]',
    badges: ['Match Score', 'AI Reasons', 'Instant Book'],
    badgeIcon: Compass,
  },
];

const PLATFORM_FEATURES = [
  {
    title: 'Wallet & M-Pesa',
    description: 'Top up, withdraw, and pay with M-Pesa, Tigo Pesa, or Airtel Money',
    href: '/wallet',
    icon: Wallet,
    color: 'text-[#4CAF50]',
  },
  {
    title: 'QR Check-in',
    description: 'Scan QR codes to check in with guides and earn badges',
    href: '/seeker/qr-checkin',
    icon: QrCode,
    color: 'text-[#065F46] dark:text-[#34D399]',
  },
  {
    title: 'Live Location',
    description: 'Share your location, find nearby guides, and stay safe',
    href: '/seeker/live-location',
    icon: Navigation,
    color: 'text-[#3B82F6]',
  },
  {
    title: 'Referrals',
    description: 'Earn rewards by inviting friends to Chimbo Direct',
    href: '/seeker/referrals',
    icon: Gift,
    color: 'text-[#F59E0B]',
  },
  {
    title: 'AI Recommendations',
    description: 'Personalized vendor, food, and experience suggestions',
    href: '/seeker/find',
    icon: Lightbulb,
    color: 'text-[#8B5CF6]',
  },
  {
    title: 'Safety & Security',
    description: 'Emergency contacts, safe zones, and fraud protection',
    href: '/settings/security',
    icon: Shield,
    color: 'text-[#DC2626]',
  },
];

// ─── Animation variants ─────────────────────────────────────────────

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.08, delayChildren: 0.2 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 24 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] },
  },
};

// ─── Component ───────────────────────────────────────────────────────

export default function HomePage() {
  const { user, isAuthenticated } = useAuthStore();
  const router = useRouter();

  // Client-side redirect for authenticated users (middleware also handles this server-side)
  // Use router.push instead of router.replace to avoid back-button issues
  useEffect(() => {
    if (isAuthenticated && user) {
      if (user.role === 'admin') router.push('/admin');
      else if (user.role === 'guide') router.push('/guide');
      else router.push('/seeker');
    }
  }, [isAuthenticated, user, router]);

  // Show loading spinner while redirecting authenticated users
  if (isAuthenticated && user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F8FAFC] dark:bg-[#0F172A]">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 animate-spin text-[#065F46] dark:text-[#34D399]" />
          <p className="text-sm text-[#64748B] dark:text-[#94A3B8]">Redirecting...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] dark:bg-[#0F172A]">
      {/* ── Hero Section ── */}
      <div className="relative overflow-hidden">
        {/* Animated background dots */}
        <div
          className="absolute inset-0 opacity-[0.03] dark:opacity-[0.05]"
          style={{
            backgroundImage: 'radial-gradient(circle, #065F46 1px, transparent 1px)',
            backgroundSize: '24px 24px',
          }}
        />
        {/* Gradient orbs */}
        <div className="absolute -top-24 -right-24 w-72 h-72 rounded-full bg-[#065F46]/10 dark:bg-[#34D399]/5 blur-3xl" />
        <div className="absolute -bottom-32 -left-16 w-64 h-64 rounded-full bg-[#F59E0B]/10 dark:bg-[#FBBF24]/5 blur-3xl" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 rounded-full bg-[#065F46]/5 dark:bg-[#34D399]/3 blur-3xl" />

        <div className="relative px-4 pt-10 pb-12 sm:px-6 lg:px-8 max-w-5xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <div className="inline-flex items-center gap-2 bg-[#065F46]/10 dark:bg-[#34D399]/10 px-4 py-1.5 rounded-full mb-4">
              <Sparkles className="w-4 h-4 text-[#065F46] dark:text-[#34D399]" />
              <span className="text-xs font-semibold text-[#065F46] dark:text-[#34D399] uppercase tracking-wider">
                AI-Powered Platform
              </span>
            </div>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight mb-4"
          >
            <span className="gradient-text-green">Chimbo</span>{' '}
            <span className="gradient-text-gold">Direct</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="text-base sm:text-lg text-[#64748B] dark:text-[#94A3B8] max-w-2xl mx-auto leading-relaxed"
          >
            Your intelligent companion for Kariakoo Market. AI-powered tools to navigate, negotiate, translate, and explore Tanzania&apos;s biggest marketplace.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="flex items-center justify-center gap-6 mt-5"
          >
            <div className="flex items-center gap-1.5 text-sm text-[#64748B] dark:text-[#94A3B8]">
              <MapPin className="w-4 h-4 text-[#065F46] dark:text-[#34D399]" />
              <span>Dar es Salaam</span>
            </div>
            <div className="flex items-center gap-1.5 text-sm text-[#64748B] dark:text-[#94A3B8]">
              <Brain className="w-4 h-4 text-[#F59E0B]" />
              <span>7 AI Tools</span>
            </div>
            <div className="flex items-center gap-1.5 text-sm text-[#64748B] dark:text-[#94A3B8]">
              <Star className="w-4 h-4 text-[#F59E0B]" />
              <span>4.9 Rating</span>
            </div>
          </motion.div>

          {/* CTA Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="flex items-center justify-center gap-3 mt-6"
          >
            <Link
              href="/seeker/ai-trip-planner"
              className="inline-flex items-center gap-2 kbtn px-6 py-3 text-sm font-semibold"
            >
              <Sparkles className="w-4 h-4" />
              Plan with AI
            </Link>
            <Link
              href="/guides"
              className="inline-flex items-center gap-2 kbtn-outline px-6 py-3 text-sm font-semibold"
            >
              <Compass className="w-4 h-4" />
              Explore Guides
            </Link>
          </motion.div>
        </div>
      </div>

      {/* ── AI Feature Cards ── */}
      <div className="px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto pb-8">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="flex items-center gap-2 mb-5"
        >
          <Bot className="w-5 h-5 text-[#065F46] dark:text-[#34D399]" />
          <h2 className="text-xl font-bold text-[#0F172A] dark:text-[#F1F5F9]">AI-Powered Tools</h2>
          <span className="ml-auto inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-[#065F46]/10 dark:bg-[#34D399]/10 text-[10px] font-bold text-[#065F46] dark:text-[#34D399] uppercase">
            <Zap className="w-3 h-3" /> New
          </span>
        </motion.div>

        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="space-y-4"
        >
          {AI_FEATURES.map((feature) => {
            const Icon = feature.icon;
            const BadgeIcon = feature.badgeIcon;
            return (
              <motion.div key={feature.href} variants={itemVariants}>
                <Link href={feature.href} className="block group">
                  <div className={`kcard-glass p-5 sm:p-6 hover:shadow-xl transition-all duration-300 ${feature.featured ? 'ring-2 ring-[#065F46]/20 dark:ring-[#34D399]/20' : ''}`}>
                    <div className="flex flex-col sm:flex-row gap-5">
                      {/* Icon */}
                      <div className={`shrink-0 w-14 h-14 rounded-2xl ${feature.lightBg} flex items-center justify-center group-hover:scale-110 transition-transform duration-300`}>
                        <Icon className={`w-7 h-7 ${feature.iconColor}`} />
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <div className="flex items-center gap-2">
                              <h2 className="text-lg sm:text-xl font-bold text-[#0F172A] dark:text-[#F1F5F9] group-hover:text-[#065F46] dark:group-hover:text-[#34D399] transition-colors">
                                {feature.title}
                              </h2>
                              {feature.featured && (
                                <span className="px-2 py-0.5 rounded-full bg-[#065F46] dark:bg-[#34D399] text-[10px] font-bold text-white dark:text-[#022C22] uppercase">
                                  Featured
                                </span>
                              )}
                            </div>
                            <p className="text-sm text-[#065F46] dark:text-[#34D399] font-medium mt-0.5">
                              {feature.subtitle}
                            </p>
                          </div>
                          <div className="shrink-0 w-10 h-10 rounded-xl bg-[#F1F5F9] dark:bg-[#334155] flex items-center justify-center group-hover:bg-[#065F46] dark:group-hover:bg-[#34D399] transition-all duration-300">
                            <ArrowRight className="w-4 h-4 text-[#64748B] dark:text-[#94A3B8] group-hover:text-white dark:group-hover:text-[#022C22] group-hover:translate-x-0.5 transition-all" />
                          </div>
                        </div>

                        <p className="text-sm text-[#64748B] dark:text-[#94A3B8] mt-2 leading-relaxed">
                          {feature.description}
                        </p>

                        {/* Feature badges */}
                        <div className="flex flex-wrap gap-2 mt-3">
                          {feature.badges.map((badge) => (
                            <span
                              key={badge}
                              className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold ${feature.lightBg} ${feature.iconColor}`}
                            >
                              <BadgeIcon className="w-3 h-3" />
                              {badge}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </Link>
              </motion.div>
            );
          })}
        </motion.div>
      </div>

      {/* ── Platform Features Grid ── */}
      <div className="px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto pb-8">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.7 }}
          className="flex items-center gap-2 mb-5"
        >
          <Zap className="w-5 h-5 text-[#F59E0B]" />
          <h2 className="text-xl font-bold text-[#0F172A] dark:text-[#F1F5F9]">Platform Features</h2>
        </motion.div>

        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="grid grid-cols-2 sm:grid-cols-3 gap-3"
        >
          {PLATFORM_FEATURES.map((feature) => {
            const Icon = feature.icon;
            return (
              <motion.div key={feature.href} variants={itemVariants}>
                <Link href={feature.href} className="block group">
                  <div className="kcard p-4 hover:shadow-lg transition-all duration-300 h-full">
                    <Icon className={`w-6 h-6 ${feature.color} mb-2 group-hover:scale-110 transition-transform`} />
                    <h3 className="font-bold text-sm text-[#0F172A] dark:text-[#F1F5F9]">{feature.title}</h3>
                    <p className="text-[11px] text-[#64748B] dark:text-[#94A3B8] mt-1 leading-snug">{feature.description}</p>
                  </div>
                </Link>
              </motion.div>
            );
          })}
        </motion.div>
      </div>

      {/* ── AI Chat CTA ── */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.9 }}
        className="px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto pb-20"
      >
        <div className="kcard-glass p-6 text-center">
          <div className="w-12 h-12 rounded-2xl bg-[#065F46]/10 dark:bg-[#34D399]/10 flex items-center justify-center mx-auto mb-3">
            <Bot className="w-6 h-6 text-[#065F46] dark:text-[#34D399]" />
          </div>
          <h3 className="text-lg font-bold text-[#0F172A] dark:text-[#F1F5F9]">Need Help? Ask Chimbo AI</h3>
          <p className="text-sm text-[#64748B] dark:text-[#94A3B8] mt-1 max-w-md mx-auto">
            Our AI assistant is available 24/7 to help you find guides, negotiate prices, translate Swahili, and plan your trip.
          </p>
          <p className="text-xs text-[#94A3B8] mt-3">
            Click the <Sparkles className="w-3 h-3 inline" /> button in the bottom-right corner to start chatting!
          </p>
        </div>
      </motion.div>
    </div>
  );
}

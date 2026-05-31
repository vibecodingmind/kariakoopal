'use client';

import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search, HelpCircle, BookOpen, CreditCard, Shield, User,
  Sparkles, MessageCircle, Mail, Phone, ExternalLink,
  ChevronDown, FileText, Users, Lock, Heart, Globe
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import Link from 'next/link';

// ─── Types ───────────────────────────────────────────────────────────

interface HelpCategory {
  id: string;
  title: string;
  icon: React.ElementType;
  description: string;
  color: string;
}

interface FAQItem {
  question: string;
  answer: string;
  category: string;
}

// ─── Data ────────────────────────────────────────────────────────────

const HELP_CATEGORIES: HelpCategory[] = [
  {
    id: 'getting-started',
    title: 'Getting Started',
    icon: BookOpen,
    description: 'Learn the basics of Kariako Guide',
    color: 'text-[#065F46] dark:text-[#34D399]',
  },
  {
    id: 'booking',
    title: 'Booking & Sessions',
    icon: CalendarIcon,
    description: 'How to book and manage sessions',
    color: 'text-[#F59E0B] dark:text-[#FBBF24]',
  },
  {
    id: 'payments',
    title: 'Payments',
    icon: CreditCard,
    description: 'M-Pesa, pricing, and refunds',
    color: 'text-emerald-600 dark:text-emerald-400',
  },
  {
    id: 'safety',
    title: 'Safety',
    icon: Shield,
    description: 'Staying safe in Kariakoo Market',
    color: 'text-red-500',
  },
  {
    id: 'account',
    title: 'Account',
    icon: User,
    description: 'Profile, settings, and verification',
    color: 'text-cyan-600 dark:text-cyan-400',
  },
  {
    id: 'ai-features',
    title: 'AI Features',
    icon: Sparkles,
    description: 'AI haggling, vision, and translations',
    color: 'text-purple-600 dark:text-purple-400',
  },
];

const FAQ_ITEMS: FAQItem[] = [
  {
    question: 'What is Kariako Guide?',
    answer: 'Kariako Guide is an AI-powered platform that connects seekers with local guides in Kariakoo Market, Dar es Salaam. Our guides help you navigate the market, find the best deals, and avoid tourist traps. We also offer AI tools like haggling assistance, vision scanning, and real-time translation.',
    category: 'getting-started',
  },
  {
    question: 'How do I create an account?',
    answer: 'Download the Kariako Guide app or visit our website. You can sign up using your email, phone number, or social accounts (Google, Facebook). Choose whether you want to be a Seeker (shopper) or a Guide. Complete your profile and you\'re ready to go!',
    category: 'getting-started',
  },
  {
    question: 'What is the difference between a Seeker and a Guide?',
    answer: 'A Seeker is someone who wants to explore and shop in Kariakoo Market with the help of a local guide. A Guide is a verified local expert who knows the market well and can help Seekers find items, negotiate prices, and navigate the market safely.',
    category: 'getting-started',
  },
  {
    question: 'How do I book a guide?',
    answer: 'Browse available guides on the Find Guides page. You can filter by zone, language, rating, and specialties. Select a guide, choose your preferred date and time, and confirm your booking. Payment is held in escrow until the session is completed.',
    category: 'booking',
  },
  {
    question: 'Can I cancel or reschedule a booking?',
    answer: 'Yes, you can cancel or reschedule up to 2 hours before the session start time. Cancellations within 2 hours may incur a fee. To cancel, go to your booking details and tap "Cancel Booking." Rescheduling is free if done in advance.',
    category: 'booking',
  },
  {
    question: 'What happens during a session?',
    answer: 'During a session, your guide will meet you at the agreed location in Kariakoo Market. They\'ll help you find items, negotiate prices, and navigate the market. You can chat with your guide through the app, share your live location, and use AI tools during the session.',
    category: 'booking',
  },
  {
    question: 'How does payment work?',
    answer: 'We use M-Pesa for all payments. When you book a session, the payment is held in escrow until the session is completed. After the session, the payment is released to the guide minus our small platform fee. This ensures both parties are protected.',
    category: 'payments',
  },
  {
    question: 'What payment methods do you accept?',
    answer: 'We primarily support M-Pesa (Tanzania\'s mobile money platform). We also accept Tigo Pesa and Airtel Money. For international users, we accept Visa and Mastercard through our secure payment processor. All payments are processed in TZS (Tanzanian Shillings).',
    category: 'payments',
  },
  {
    question: 'How do refunds work?',
    answer: 'If a session is cancelled by the guide, you receive a full refund within 24 hours. If you cancel more than 2 hours before the session, you get a full refund. Late cancellations may receive a partial refund. Refunds are sent back to your original payment method.',
    category: 'payments',
  },
  {
    question: 'Is Kariakoo Market safe to visit?',
    answer: 'Kariakoo Market is generally safe during business hours (7 AM - 6 PM). However, like any busy market, it\'s important to stay aware of your surroundings. Our verified guides know the safe routes, which areas to avoid, and how to handle any situation. We also provide real-time safety alerts through the app.',
    category: 'safety',
  },
  {
    question: 'What safety features does the app have?',
    answer: 'We offer: live location sharing with trusted contacts, emergency SOS button, real-time safety alerts, verified guide profiles with background checks, escrow payment protection, and in-app chat with message recording. Your safety is our top priority.',
    category: 'safety',
  },
  {
    question: 'How do I become a verified guide?',
    answer: 'Go to the Guide Verification page and submit: a valid national ID or passport, a selfie with your ID, certifications (optional), and select which zones and languages you cover. Our team reviews submissions within 48 hours. Verified guides get priority in search results and can charge higher rates.',
    category: 'account',
  },
  {
    question: 'How do I update my profile?',
    answer: 'Go to Settings > Profile to update your name, photo, bio, languages, and specialties. Guides can also update their availability, zones, and pricing. Profile changes are reflected immediately for other users.',
    category: 'account',
  },
  {
    question: 'How does the AI Haggling Assistant work?',
    answer: 'Enter the item you want to buy and the vendor\'s asking price. Our AI analyzes market data, seasonal trends, and location to give you a fair price range, step-by-step negotiation strategy, and useful Swahili phrases. It\'s like having a local bargaining expert in your pocket!',
    category: 'ai-features',
  },
  {
    question: 'What is the AI Vision Scanner?',
    answer: 'Point your camera at any item in the market and our AI will identify it, estimate the fair price range, assess quality, and provide negotiation tips. It also tells you where in Kariakoo to find the item and any cultural significance. Works with photos from your camera or gallery.',
    category: 'ai-features',
  },
  {
    question: 'Does the AI translation work offline?',
    answer: 'Our AI translation works best with an internet connection. However, we cache common Swahili-English phrases for offline use. For full translation features including voice translation and context-aware suggestions, you\'ll need to be connected to the internet.',
    category: 'ai-features',
  },
];

const CONTACT_OPTIONS = [
  {
    icon: MessageCircle,
    label: 'In-App Chat',
    description: 'Chat with our support team',
    action: 'Open Chat',
    color: 'bg-[#065F46] dark:bg-[#34D399]',
    href: '#',
  },
  {
    icon: Mail,
    label: 'Email',
    description: 'support@kariako.guide',
    action: 'Send Email',
    color: 'bg-[#F59E0B] dark:bg-[#FBBF24]',
    href: 'mailto:support@kariako.guide',
  },
  {
    icon: Phone,
    label: 'Phone',
    description: '+255 123 456 789',
    action: 'Call Now',
    color: 'bg-emerald-500',
    href: 'tel:+255123456789',
  },
  {
    icon: Globe,
    label: 'WhatsApp',
    description: '+255 123 456 789',
    action: 'Open WhatsApp',
    color: 'bg-green-500',
    href: 'https://wa.me/255123456789',
  },
];

// ─── Calendar icon inline ────────────────────────────────────────────

function CalendarIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d="M8 2v4" />
      <path d="M16 2v4" />
      <rect width="18" height="18" x="3" y="4" rx="2" />
      <path d="M3 10h18" />
    </svg>
  );
}

// ─── Component ───────────────────────────────────────────────────────

export default function HelpCenterPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  // Filter FAQs
  const filteredFAQs = useMemo(() => {
    let items = FAQ_ITEMS;

    if (selectedCategory) {
      items = items.filter((item) => item.category === selectedCategory);
    }

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      items = items.filter(
        (item) =>
          item.question.toLowerCase().includes(query) ||
          item.answer.toLowerCase().includes(query)
      );
    }

    return items;
  }, [searchQuery, selectedCategory]);

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
              <HelpCircle className="w-4 h-4 text-[#065F46] dark:text-[#34D399]" />
              <span className="text-xs font-semibold text-[#065F46] dark:text-[#34D399] uppercase tracking-wider">
                Support
              </span>
            </div>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="text-4xl sm:text-5xl font-extrabold tracking-tight mb-3"
          >
            <span className="gradient-text-green">Help</span>{' '}
            <span className="gradient-text-gold">Center</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="text-base sm:text-lg text-[#64748B] dark:text-[#94A3B8] max-w-xl mx-auto mb-8"
          >
            Find answers to common questions and get the help you need
          </motion.p>

          {/* Search */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="max-w-xl mx-auto"
          >
            <div className="ksearch flex items-center gap-3 px-4 py-3">
              <Search className="w-5 h-5 text-[#64748B] dark:text-[#94A3B8] shrink-0" />
              <input
                type="text"
                placeholder="Search help articles..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="flex-1 bg-transparent border-0 outline-none text-sm text-[#0F172A] dark:text-[#F1F5F9] placeholder:text-[#94A3B8]"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="text-[#94A3B8] hover:text-[#64748B]"
                >
                  ✕
                </button>
              )}
            </div>
          </motion.div>
        </div>
      </div>

      <div className="px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto pb-16 space-y-10">
        {/* ── Categories ── */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <h2 className="text-lg font-bold text-[#0F172A] dark:text-[#F1F5F9] mb-4">Categories</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            {HELP_CATEGORIES.map((cat, i) => {
              const Icon = cat.icon;
              const isActive = selectedCategory === cat.id;
              return (
                <motion.button
                  key={cat.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.05 * i }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setSelectedCategory(isActive ? null : cat.id)}
                  className={`p-4 rounded-2xl text-center transition-all duration-200 ${
                    isActive
                      ? 'bg-[#065F46] dark:bg-[#34D399] text-white shadow-lg shadow-[#065F46]/20'
                      : 'kcard hover:shadow-md'
                  }`}
                >
                  <Icon className={`w-6 h-6 mx-auto mb-2 ${isActive ? 'text-white' : cat.color}`} />
                  <p className={`text-xs font-semibold ${isActive ? 'text-white' : 'text-[#0F172A] dark:text-[#F1F5F9]'}`}>
                    {cat.title}
                  </p>
                </motion.button>
              );
            })}
          </div>
        </motion.div>

        {/* ── FAQ Accordion ── */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-[#0F172A] dark:text-[#F1F5F9]">
              Frequently Asked Questions
            </h2>
            <Badge className="bg-[#ECFDF5] dark:bg-[#064E3B] text-[#065F46] dark:text-[#34D399] border-0 text-xs">
              {filteredFAQs.length} questions
            </Badge>
          </div>

          {filteredFAQs.length === 0 ? (
            <div className="kcard p-8 text-center">
              <HelpCircle className="w-12 h-12 text-[#94A3B8] mx-auto mb-3" />
              <p className="text-sm font-semibold text-[#0F172A] dark:text-[#F1F5F9] mb-1">No results found</p>
              <p className="text-xs text-[#64748B] dark:text-[#94A3B8]">Try a different search term or category</p>
            </div>
          ) : (
            <div className="kcard overflow-hidden">
              <Accordion type="single" collapsible className="w-full">
                {filteredFAQs.map((faq, i) => (
                  <AccordionItem
                    key={i}
                    value={`faq-${i}`}
                    className="border-b border-[#F1F5F9] dark:border-[#334155] last:border-0"
                  >
                    <AccordionTrigger className="px-5 py-4 hover:bg-[#F8FAFC]/50 dark:hover:bg-[#1E293B]/50 text-left text-sm font-semibold text-[#0F172A] dark:text-[#F1F5F9] hover:no-underline">
                      <div className="flex items-center gap-3 text-left">
                        <HelpCircle className="w-4 h-4 text-[#065F46] dark:text-[#34D399] shrink-0" />
                        {faq.question}
                      </div>
                    </AccordionTrigger>
                    <AccordionContent className="px-5 pb-4 text-sm text-[#64748B] dark:text-[#94A3B8] leading-relaxed">
                      {faq.answer}
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </div>
          )}
        </motion.div>

        {/* ── Contact Options ── */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
        >
          <h2 className="text-lg font-bold text-[#0F172A] dark:text-[#F1F5F9] mb-4">
            Still Need Help?
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {CONTACT_OPTIONS.map((contact, i) => {
              const Icon = contact.icon;
              return (
                <motion.div
                  key={contact.label}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.05 * i }}
                >
                  <Link href={contact.href} className="block">
                    <div className="kcard p-5 text-center hover:shadow-lg transition-all cursor-pointer">
                      <div className={`w-12 h-12 rounded-xl ${contact.color} text-white flex items-center justify-center mx-auto mb-3`}>
                        <Icon className="w-6 h-6" />
                      </div>
                      <h3 className="text-sm font-bold text-[#0F172A] dark:text-[#F1F5F9] mb-1">
                        {contact.label}
                      </h3>
                      <p className="text-xs text-[#64748B] dark:text-[#94A3B8] mb-3">
                        {contact.description}
                      </p>
                      <span className="inline-flex items-center gap-1 text-xs font-semibold text-[#065F46] dark:text-[#34D399]">
                        {contact.action}
                        <ExternalLink className="w-3 h-3" />
                      </span>
                    </div>
                  </Link>
                </motion.div>
              );
            })}
          </div>
        </motion.div>

        {/* ── Quick Links ── */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
        >
          <h2 className="text-lg font-bold text-[#0F172A] dark:text-[#F1F5F9] mb-4">Quick Links</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Link href="/legal/terms">
              <div className="kcard p-4 flex items-center gap-3 hover:shadow-md transition-all cursor-pointer">
                <div className="w-10 h-10 rounded-xl bg-[#ECFDF5] dark:bg-[#064E3B] flex items-center justify-center shrink-0">
                  <FileText className="w-5 h-5 text-[#065F46] dark:text-[#34D399]" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-[#0F172A] dark:text-[#F1F5F9]">Terms of Service</p>
                  <p className="text-xs text-[#64748B] dark:text-[#94A3B8]">Our terms and conditions</p>
                </div>
              </div>
            </Link>
            <Link href="/legal/privacy">
              <div className="kcard p-4 flex items-center gap-3 hover:shadow-md transition-all cursor-pointer">
                <div className="w-10 h-10 rounded-xl bg-[#ECFDF5] dark:bg-[#064E3B] flex items-center justify-center shrink-0">
                  <Lock className="w-5 h-5 text-[#065F46] dark:text-[#34D399]" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-[#0F172A] dark:text-[#F1F5F9]">Privacy Policy</p>
                  <p className="text-xs text-[#64748B] dark:text-[#94A3B8]">How we handle your data</p>
                </div>
              </div>
            </Link>
            <Link href="/about">
              <div className="kcard p-4 flex items-center gap-3 hover:shadow-md transition-all cursor-pointer">
                <div className="w-10 h-10 rounded-xl bg-[#ECFDF5] dark:bg-[#064E3B] flex items-center justify-center shrink-0">
                  <Users className="w-5 h-5 text-[#065F46] dark:text-[#34D399]" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-[#0F172A] dark:text-[#F1F5F9]">Community Guidelines</p>
                  <p className="text-xs text-[#64748B] dark:text-[#94A3B8]">Our community standards</p>
                </div>
              </div>
            </Link>
          </div>
        </motion.div>
      </div>
    </div>
  );
}

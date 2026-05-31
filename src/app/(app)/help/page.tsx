'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  HelpCircle, ChevronDown, Search, MessageCircle,
  Phone, Mail, MapPin, BookOpen, Shield, CreditCard,
  Users, Compass, Zap, ExternalLink
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useAuthStore } from '@/lib/stores/auth-store';
import Link from 'next/link';

// ─── FAQ Data ──

const FAQ_CATEGORIES = [
  { id: 'getting-started', label: 'Getting Started', labelSw: 'Kuanza', icon: Compass },
  { id: 'booking', label: 'Booking & Sessions', labelSw: 'Kubuka & Vikao', icon: CalendarIcon },
  { id: 'payments', label: 'Payments & Wallet', labelSw: 'Malipo & Pochi', icon: CreditCard },
  { id: 'safety', label: 'Safety & Trust', labelSw: 'Usalama & Tegemeo', icon: Shield },
  { id: 'guides', label: 'For Guides', labelSw: 'Kwa Waongozaji', icon: Users },
];

function CalendarIcon(props: any) {
  return <BookOpen {...props} />;
}

interface FAQItem {
  id: string;
  category: string;
  question: string;
  questionSw: string;
  answer: string;
  answerSw: string;
}

const FAQ_ITEMS: FAQItem[] = [
  {
    id: '1',
    category: 'getting-started',
    question: 'How do I find a guide in Kariakoo?',
    questionSw: 'Ninawezaje kupata mwongozo Kariakoo?',
    answer: 'Simply post a request describing what you need (fabrics, spices, electronics, etc.), and our system will match you with a verified local guide. You can also browse guides by zone and specialty.',
    answerSw: 'Tuma ombi likielezea unachohitaji (vitambaa, viungo, elektroniki, n.k.), na mfumo wetu utakutanisha na mwongozo aliye thibitishwa. Unaweza pia kutafuta waongozaji kwa eneo na utaalamu.',
  },
  {
    id: '2',
    category: 'getting-started',
    question: 'What is the Price Radar?',
    questionSw: 'Rada ya Bei ni nini?',
    answer: 'Price Radar shows you the fair price range for items in each market zone. It helps you avoid overpaying and gives you confidence when negotiating. Prices are updated by our community and verified guides.',
    answerSw: 'Rada ya Bei inakuonyesha kiwango cha haki cha bei kwa bidhaa kila eneo la soko. Inakusaidia kueza kulipia zaidi na kukupa kujiamini unapojadiliana. Bei zinashuhuriwa na jamii yetu na waongozaji walio thibitishwa.',
  },
  {
    id: '3',
    category: 'getting-started',
    question: 'How does the AI Vision Scanner work?',
    questionSw: 'Kichungi cha AI Vision kinafanyaje kazi?',
    answer: 'Point your camera at any item in the market, and our AI will identify it, tell you the Swahili name, estimate the fair price range, and give you haggling tips. It works offline with cached data too!',
    answerSw: 'Elekeza kamera yako kwenye bidhaa yoyote sokoni, na AI yetu itaitambulisha, kuambia jina la Kiswahili, kukisia kiwango cha haki cha bei, na kukupa vidokezo vya kujadiliana. Pia inafanya kazi nje ya mtandao!',
  },
  {
    id: '4',
    category: 'booking',
    question: 'How do I book a guide?',
    questionSw: 'Ninawezaje kubuka mwongozo?',
    answer: 'Post a request with your needs and budget. Available guides will be matched, and you can choose one based on ratings, specialty, and price. Your payment is held in escrow until the session is complete.',
    answerSw: 'Tuma ombi na mahitaji yako na bajeti. Waongozaji waliopo wataunganishwa, na unaweza kuchagua mmoja kulingana na ukadiriaji, utaalamu, na bei. Malipo yako yameshikiliwa kwa usalama hadi kikao kikamilike.',
  },
  {
    id: '5',
    category: 'booking',
    question: 'What happens during a market session?',
    questionSw: 'Nini hutokea wakati wa kikao cha soko?',
    answer: 'Your guide will meet you at the agreed location, help you navigate the market zones, negotiate prices on your behalf, and ensure you get fair deals. Sessions are tracked for safety and quality.',
    answerSw: 'Mwongozo wako atakutana mahali ulipoagana, akusaidie kupitia maeneo ya soko, kujadili bei kwa niaba yako, na kuhakikisha unapata mashauri ya haki. Vikao vinafuatiliwa kwa usalama na ubora.',
  },
  {
    id: '6',
    category: 'booking',
    question: 'Can I cancel a booking?',
    questionSw: 'Ninaweza kughairi buku?',
    answer: 'Yes, you can cancel before the session starts. If you cancel within 30 minutes of the start time, a small fee may apply. During the session, you can end early and get a pro-rated refund.',
    answerSw: 'Ndiyo, unaweza kughairi kabla ya kikao kuanza. Ukighairi ndani ya dakika 30 kabla ya muda wa kuanza, ada ndogo inaweza kutumika. Wakati wa kikao, unaweza kumaliza mapema na kupata rudi ya sehemu.',
  },
  {
    id: '7',
    category: 'payments',
    question: 'How do I pay for a guide?',
    questionSw: 'Ninawezaje kulipia mwongozo?',
    answer: 'We support M-Pesa, Tigo Pesa, Airtel Money, and Halotel. Your payment is held in escrow and only released to the guide after you confirm the session is complete. This protects both parties.',
    answerSw: 'Tunaunga mkono M-Pesa, Tigo Pesa, Airtel Money, na Halotel. Malipo yako yameshikiliwa kwa usalama na yanaletewa tu kwa mwongozo baada ya kuthibitisha kikao kimemalizika. Hii inalinda pande zote.',
  },
  {
    id: '8',
    category: 'payments',
    question: 'What is the wallet feature?',
    questionSw: 'Kitu cha pochi ni nini?',
    answer: 'The wallet lets you deposit funds via mobile money and pay for sessions instantly. Guides can also withdraw their earnings to their mobile money accounts. All transactions are secured.',
    answerSw: 'Pochi inakuwezesha kuweka pesa kupitia pesa ya simu na kulipia vikao papo hapo. Waongozaji pia wanaweza kutoa mapato yao kwenye akaunti zao za pesa ya simu. Muamala wote ni salama.',
  },
  {
    id: '9',
    category: 'safety',
    question: 'Is it safe to use Kariako Guide?',
    questionSw: 'Je, ni salama kutumia Kariako Guide?',
    answer: 'All guides are verified with ID documents and pass a zone knowledge quiz. Sessions are tracked with GPS, and there is an emergency button for immediate help. Your payments are protected by escrow.',
    answerSw: 'Waongozaji wote wame thibitishwa kwa nyaraka za kitambulisho na wanapita jaribio la ujuzi wa eneo. Vikao vinafuatiliwa kwa GPS, na kuna kitufe cha dharura kwa msaada wa haraka. Malipo yako yanalindwa na escrow.',
  },
  {
    id: '10',
    category: 'safety',
    question: 'How does the emergency button work?',
    questionSw: 'Kitufe cha dharura kinawezaje kazi?',
    answer: 'Press and hold the emergency button for 5 seconds to send an alert. Your GPS location is shared with our admin team, the guide, and optionally the police. We respond to emergencies 24/7.',
    answerSw: 'Bonyeza na ushikilie kitufe cha dharura kwa sekunde 5 kutuma tahadhari. Mahali pako pa GPS vinashirikiwa na timu yetu ya usimamizi, mwongozo, na hiari polisi. Tunajibu dharura masaa 24/7.',
  },
  {
    id: '11',
    category: 'guides',
    question: 'How do I become a verified guide?',
    questionSw: 'Ninawezaje kuwa mwongozo aliye thibitishwa?',
    answer: 'Register as a guide, complete the 4-step verification process: personal info, zone knowledge quiz (3/5 minimum), selfie verification, and ID document upload. Approval usually takes 24-48 hours.',
    answerSw: 'Jisajili kama mwongozo, kamilisha mchakato wa uthibitisho wa hatua 4: taarifa za kibinafsi, jaribio la ujuzi wa eneo (3/5 chini), uthibitisho wa picha, na kupakia nyaraka ya kitambulisho. Idhini kwa kawaida inachukua masaa 24-48.',
  },
  {
    id: '12',
    category: 'guides',
    question: 'How much can I earn as a guide?',
    questionSw: 'Ninaweza kupata pesa ngapi kama mwongozo?',
    answer: 'Earnings vary by zone and specialty. Average guides earn TZS 10,000-25,000 per session. Top-rated guides with specialties can earn more. You keep 88% of each session fee (12% platform fee).',
    answerSw: 'Mapato yanatofautiana kwa eneo na utaalamu. Waongozaji wa wastani wanapata TZS 10,000-25,000 kwa kikao. Waongozaji bora wenye utaalamu wanaweza kupata zaidi. Unabakiwa na 88% ya kila ada ya kikao (12% ada ya jukwaa).',
  },
];

export default function HelpPage() {
  const { language } = useAuthStore();
  const sw = language === 'sw';
  const l = (en: string, swText: string) => (sw ? swText : en);

  const [activeCategory, setActiveCategory] = useState('getting-started');
  const [expandedFaq, setExpandedFaq] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const filteredFaqs = FAQ_ITEMS.filter(faq => {
    const matchesCategory = faq.category === activeCategory;
    const matchesSearch = !searchQuery ||
      faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
      faq.questionSw.toLowerCase().includes(searchQuery.toLowerCase()) ||
      faq.answer.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="min-h-screen bg-[#F8FAFC] dark:bg-[#0F172A]">
      {/* Header */}
      <div className="bg-gradient-to-b from-[#065F46] to-[#064E3B] dark:from-[#0F172A] dark:to-[#0F172A] px-4 pt-6 pb-8">
        <motion.div initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }}>
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-white/15 flex items-center justify-center">
              <HelpCircle className="w-5 h-5 text-[#34D399]" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-white">{l('Help Center', 'Kituo Cha Msaada')}</h1>
              <p className="text-xs text-[#34D399]">{l('Find answers to your questions', 'Pata majibu ya maswali yako')}</p>
            </div>
          </div>

          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#64748B]" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder={l('Search help topics...', 'Tafuta mada za msaada...')}
              className="w-full pl-10 pr-4 py-3 rounded-xl bg-white dark:bg-[#1E293B] text-sm outline-none text-[#0F172A] dark:text-white placeholder:text-[#94A3B8]"
            />
          </div>
        </motion.div>
      </div>

      {/* Category Tabs */}
      <div className="px-4 -mt-4">
        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
          {FAQ_CATEGORIES.map(cat => {
            const Icon = cat.icon;
            const active = activeCategory === cat.id;
            return (
              <button
                key={cat.id}
                onClick={() => setActiveCategory(cat.id)}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium whitespace-nowrap transition-all ${
                  active
                    ? 'bg-[#065F46] text-white shadow-md'
                    : 'bg-white dark:bg-[#1E293B] text-[#64748B] shadow-sm hover:shadow-md'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                {sw ? cat.labelSw : cat.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* FAQ Accordion */}
      <div className="px-4 py-4 space-y-3 max-w-2xl mx-auto">
        <AnimatePresence mode="wait">
          {filteredFaqs.map(faq => {
            const isExpanded = expandedFaq === faq.id;
            return (
              <motion.div
                key={faq.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.2 }}
              >
                <Card className="border-0 shadow-md overflow-hidden">
                  <button
                    onClick={() => setExpandedFaq(isExpanded ? null : faq.id)}
                    className="w-full text-left"
                  >
                    <div className="p-4 flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 transition-colors ${
                        isExpanded ? 'bg-[#065F46]' : 'bg-[#ECFDF5] dark:bg-[#064E3B]'
                      }`}>
                        <HelpCircle className={`w-4 h-4 ${isExpanded ? 'text-white' : 'text-[#065F46] dark:text-[#34D399]'}`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-[#0F172A] dark:text-[#F1F5F9]">
                          {sw ? faq.questionSw : faq.question}
                        </p>
                      </div>
                      <ChevronDown className={`w-5 h-5 text-[#64748B] transition-transform shrink-0 ${isExpanded ? 'rotate-180' : ''}`} />
                    </div>
                  </button>

                  <AnimatePresence>
                    {isExpanded && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                      >
                        <div className="px-4 pb-4 pt-0">
                          <div className="pl-11">
                            <p className="text-sm text-[#64748B] dark:text-[#94A3B8] leading-relaxed">
                              {sw ? faq.answerSw : faq.answer}
                            </p>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </Card>
              </motion.div>
            );
          })}
        </AnimatePresence>

        {filteredFaqs.length === 0 && (
          <div className="text-center py-12">
            <HelpCircle className="w-12 h-12 text-[#64748B] mx-auto mb-3" />
            <p className="text-sm text-[#64748B]">{l('No matching questions found', 'Hakuna maswali yanayolingana')}</p>
          </div>
        )}

        {/* Contact Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="mt-8"
        >
          <Card className="border-0 shadow-lg overflow-hidden">
            <div className="bg-gradient-to-r from-[#065F46] to-[#059669] dark:from-[#022C22] dark:to-[#065F46] p-5 text-center">
              <h3 className="text-lg font-bold text-white mb-1">
                {l('Still need help?', 'Bado unahitaji msaada?')}
              </h3>
              <p className="text-sm text-white/80">
                {l('Our support team is here for you', 'Timu yetu ya msaada iko hapa kwa ajili yako')}
              </p>
            </div>
            <CardContent className="p-4 space-y-3">
              <button className="w-full flex items-center gap-3 p-3 rounded-xl bg-[#F8FAFC] dark:bg-[#1E293B] hover:bg-[#F1F5F9] dark:hover:bg-[#334155] transition-colors">
                <div className="w-10 h-10 rounded-xl bg-[#ECFDF5] dark:bg-[#064E3B] flex items-center justify-center">
                  <MessageCircle className="w-5 h-5 text-[#065F46] dark:text-[#34D399]" />
                </div>
                <div className="text-left">
                  <p className="text-sm font-semibold text-[#0F172A] dark:text-[#F1F5F9]">{l('Live Chat', 'Mazungumzo Ya Moja Kwa Moja')}</p>
                  <p className="text-xs text-[#64748B]">{l('Chat with our team', 'Zungumza na timu yetu')}</p>
                </div>
              </button>

              <button className="w-full flex items-center gap-3 p-3 rounded-xl bg-[#F8FAFC] dark:bg-[#1E293B] hover:bg-[#F1F5F9] dark:hover:bg-[#334155] transition-colors">
                <div className="w-10 h-10 rounded-xl bg-[#FEF3C7] dark:bg-[#422006] flex items-center justify-center">
                  <Phone className="w-5 h-5 text-[#F59E0B]" />
                </div>
                <div className="text-left">
                  <p className="text-sm font-semibold text-[#0F172A] dark:text-[#F1F5F9]">{l('Call Us', 'Piga Simu')}</p>
                  <p className="text-xs text-[#64748B]">+255 123 456 789</p>
                </div>
              </button>

              <button className="w-full flex items-center gap-3 p-3 rounded-xl bg-[#F8FAFC] dark:bg-[#1E293B] hover:bg-[#F1F5F9] dark:hover:bg-[#334155] transition-colors">
                <div className="w-10 h-10 rounded-xl bg-[#E0E7FF] dark:bg-[#312E81] flex items-center justify-center">
                  <Mail className="w-5 h-5 text-[#4F46E5]" />
                </div>
                <div className="text-left">
                  <p className="text-sm font-semibold text-[#0F172A] dark:text-[#F1F5F9]">{l('Email Support', 'Msaada Wa Barua')}</p>
                  <p className="text-xs text-[#64748B]">support@kariako.guide</p>
                </div>
              </button>

              <button className="w-full flex items-center gap-3 p-3 rounded-xl bg-[#F8FAFC] dark:bg-[#1E293B] hover:bg-[#F1F5F9] dark:hover:bg-[#334155] transition-colors">
                <div className="w-10 h-10 rounded-xl bg-[#ECFDF5] dark:bg-[#064E3B] flex items-center justify-center">
                  <MapPin className="w-5 h-5 text-[#065F46] dark:text-[#34D399]" />
                </div>
                <div className="text-left">
                  <p className="text-sm font-semibold text-[#0F172A] dark:text-[#F1F5F9]">{l('Visit Us', 'Ututembelee')}</p>
                  <p className="text-xs text-[#64748B]">Kariakoo Market, Dar es Salaam</p>
                </div>
              </button>
            </CardContent>
          </Card>
        </motion.div>

        {/* Quick Links */}
        <div className="flex flex-wrap gap-2 justify-center mt-4 pb-4">
          <Link href="/legal/terms">
            <Badge variant="outline" className="text-xs cursor-pointer hover:bg-[#ECFDF5] dark:hover:bg-[#064E3B]">
              {l('Terms of Service', 'Sheria na Masharti')} <ExternalLink className="w-3 h-3 ml-1" />
            </Badge>
          </Link>
          <Link href="/legal/privacy">
            <Badge variant="outline" className="text-xs cursor-pointer hover:bg-[#ECFDF5] dark:hover:bg-[#064E3B]">
              {l('Privacy Policy', 'Sera ya Faragha')} <ExternalLink className="w-3 h-3 ml-1" />
            </Badge>
          </Link>
          <Link href="/about">
            <Badge variant="outline" className="text-xs cursor-pointer hover:bg-[#ECFDF5] dark:hover:bg-[#064E3B]">
              {l('About Us', 'Kuhusu Sisi')} <ExternalLink className="w-3 h-3 ml-1" />
            </Badge>
          </Link>
        </div>
      </div>
    </div>
  );
}

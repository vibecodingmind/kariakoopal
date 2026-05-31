'use client';

import { motion } from 'framer-motion';
import {
  ArrowLeft, Heart, Globe, Users, Shield, Sparkles,
  MapPin, Award, Zap, Star, Target, Eye, Compass
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useAuthStore } from '@/lib/stores/auth-store';
import Link from 'next/link';

export default function AboutPage() {
  const { language } = useAuthStore();
  const sw = language === 'sw';
  const l = (en: string, swText: string) => (sw ? swText : en);

  const values = [
    {
      icon: Shield,
      title: l('Trust & Safety', 'Tegemeo & Usalama'),
      desc: l('Every guide is verified. Every payment is protected by escrow. Every session is tracked for safety.', 'Kila mwongozo amethibitishwa. Kila malipo yanalindwa na escrow. Kila kikao kinafuatiliwa kwa usalama.'),
      color: 'bg-[#ECFDF5] dark:bg-[#064E3B]',
      iconColor: 'text-[#065F46] dark:text-[#34D399]',
    },
    {
      icon: Heart,
      title: l('Community First', 'Jamii Kwanza'),
      desc: l('We empower local guides with fair earnings, training, and mentorship. When guides thrive, the community thrives.', 'Tunawawezesha waongozaji wa ndani na mapato ya haki, mafunzo, na ushauri. Waongozaji wakistawi, jamii inastawi.'),
      color: 'bg-[#FEF3C7] dark:bg-[#422006]',
      iconColor: 'text-[#F59E0B] dark:text-[#FBBF24]',
    },
    {
      icon: Sparkles,
      title: l('AI-Powered', 'Inayoendeshwa na AI'),
      desc: l('Smart features like AI Vision Scanner, Price Radar, and Haggling Assistant make shopping smarter and fairer.', 'Vipengele vyenye akili kama Kichungi cha AI Vision, Rada ya Bei, na Msaidizi wa Kujadiliana hufanya ununuzi kuwa wa busara zaidi na wa haki.'),
      color: 'bg-[#E0E7FF] dark:bg-[#312E81]',
      iconColor: 'text-[#4F46E5] dark:text-[#818CF8]',
    },
    {
      icon: Globe,
      title: l('Bilingual', 'Lugha Mbili'),
      desc: l('Full Swahili and English support. Because Kariakoo is for everyone — locals and visitors alike.', 'Msaada kamili wa Kiswahili na Kiingereza. Kwa sababu Kariakoo ni kwa kila mtu — wakaazi na wageni vilevile.'),
      color: 'bg-[#ECFDF5] dark:bg-[#064E3B]',
      iconColor: 'text-[#065F46] dark:text-[#34D399]',
    },
  ];

  const stats = [
    { value: '500+', label: l('Verified Guides', 'Waongozaji Waliothibitishwa'), icon: Users },
    { value: '6', label: l('Market Zones', 'Maeneo ya Soko'), icon: MapPin },
    { value: '50K+', label: l('Sessions Completed', 'Vikao Vilivyokamilika'), icon: Award },
    { value: '4.8', label: l('Average Rating', 'Ukadiriaji wa Wastani'), icon: Star },
  ];

  const features = [
    { icon: Eye, title: l('AI Vision Scanner', 'Kichungi cha AI Vision'), desc: l('Snap any item, get instant price & identification', 'Piga picha ya bidhaa yoyote, pata bei na utambulisho papo hapo') },
    { icon: Zap, title: l('Price Radar', 'Rada ya Bei'), desc: l('Know the fair price before you buy', 'Jua bei ya haki kabla ya kununua') },
    { icon: Compass, title: l('Guide Matching', 'Kuunganisha Mwongozo'), desc: l('Find the perfect guide for your needs', 'Pata mwongozo bora kwa mahitaji yako') },
    { icon: Shield, title: l('Escrow Protection', 'Ulinzi wa Escrow'), desc: l('Your money is safe until the session is complete', 'Pesa yako iko salama hadi kikao kikamilike') },
    { icon: Target, title: l('Haggling Assistant', 'Msaidizi wa Kujadiliana'), desc: l('AI-powered negotiation tips and phrases', 'Vidokezo vya AI vya kujadiliana na kauli') },
    { icon: Users, title: l('Group Tours', 'Safari za Kikundi'), desc: l('Save money by joining group sessions', 'Okoa pesa kwa kujiunga na vikao vya kikundi') },
  ];

  return (
    <div className="min-h-screen bg-[#F8FAFC] dark:bg-[#0F172A]">
      {/* Header */}
      <div className="relative overflow-hidden">
        <div className="bg-gradient-to-b from-[#065F46] to-[#064E3B] dark:from-[#0F172A] dark:to-[#0F172A] px-4 pt-6 pb-16">
          <motion.div initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }}>
            <Link href="/" className="inline-flex items-center gap-1 text-sm text-white/80 hover:text-white mb-3 transition-colors">
              <ArrowLeft className="w-4 h-4" />
              {l('Back to Home', 'Rudi Nyumbani')}
            </Link>
            <div className="text-center">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', stiffness: 200, damping: 15 }}
                className="w-20 h-20 rounded-2xl bg-white/15 flex items-center justify-center mx-auto mb-4"
              >
                <Compass className="w-10 h-10 text-[#34D399]" />
              </motion.div>
              <h1 className="text-3xl font-extrabold text-white mb-2">
                Chimbo<span className="text-[#34D399]">Direct</span>
              </h1>
              <p className="text-sm text-[#34D399] max-w-sm mx-auto">
                {l(
                  'Your trusted companion for navigating Kariakoo Market, Dar es Salaam',
                  'Rafiki yako wa kuaminika kwa kupitia Soko la Kariakoo, Dar es Salaam'
                )}
              </p>
            </div>
          </motion.div>
        </div>
        <div className="absolute -bottom-1 left-0 right-0 h-6 bg-[#F8FAFC] dark:bg-[#0F172A] rounded-t-3xl" />
      </div>

      {/* Mission */}
      <div className="px-4 -mt-8 max-w-2xl mx-auto relative z-10">
        <Card className="border-0 shadow-lg">
          <CardContent className="p-6 text-center">
            <h2 className="text-lg font-bold text-[#065F46] dark:text-[#34D399] mb-2">
              {l('Our Mission', 'Dhamira Yetu')}
            </h2>
            <p className="text-sm text-[#64748B] dark:text-[#94A3B8] leading-relaxed">
              {l(
                'To make Kariakoo Market accessible, fair, and safe for everyone — connecting visitors with trusted local guides, ensuring fair prices through technology, and empowering the community that makes Kariakoo the heart of Dar es Salaam.',
                'Kufanya Soko la Kariakoo liweze kupatikana, la haki, na salama kwa kila mtu — kuunganisha wageni na waongozaji wa ndani wa kuaminika, kuhakikisha bei ya haki kupitia teknolojia, na kuwawezesha jamii inayofanya Kariakoo kuwa moyo wa Dar es Salaam.'
              )}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Stats */}
      <div className="px-4 py-6 max-w-2xl mx-auto">
        <div className="grid grid-cols-2 gap-3">
          {stats.map((stat, i) => {
            const Icon = stat.icon;
            return (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 + i * 0.05 }}
              >
                <Card className="border-0 shadow-md text-center">
                  <CardContent className="p-4">
                    <Icon className="w-5 h-5 text-[#065F46] dark:text-[#34D399] mx-auto mb-2" />
                    <p className="text-2xl font-extrabold text-[#065F46] dark:text-[#34D399]">{stat.value}</p>
                    <p className="text-xs text-[#64748B] dark:text-[#94A3B8]">{stat.label}</p>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* Values */}
      <div className="px-4 pb-4 max-w-2xl mx-auto">
        <h2 className="text-lg font-bold text-[#065F46] dark:text-[#34D399] mb-4 text-center">
          {l('Our Values', 'Thamani Zetu')}
        </h2>
        <div className="space-y-3">
          {values.map((value, i) => {
            const Icon = value.icon;
            return (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -12 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 + i * 0.08 }}
              >
                <Card className="border-0 shadow-md">
                  <CardContent className="p-4 flex items-start gap-3">
                    <div className={`w-10 h-10 rounded-xl ${value.color} flex items-center justify-center shrink-0`}>
                      <Icon className={`w-5 h-5 ${value.iconColor}`} />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-[#0F172A] dark:text-[#F1F5F9] mb-1">{value.title}</h3>
                      <p className="text-xs text-[#64748B] dark:text-[#94A3B8] leading-relaxed">{value.desc}</p>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* Features */}
      <div className="px-4 pb-6 max-w-2xl mx-auto">
        <h2 className="text-lg font-bold text-[#065F46] dark:text-[#34D399] mb-4 text-center">
          {l('Key Features', 'Vipengele Muhimu')}
        </h2>
        <div className="grid grid-cols-2 gap-3">
          {features.map((feature, i) => {
            const Icon = feature.icon;
            return (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 + i * 0.05 }}
              >
                <Card className="border-0 shadow-md h-full">
                  <CardContent className="p-4">
                    <Icon className="w-5 h-5 text-[#065F46] dark:text-[#34D399] mb-2" />
                    <h3 className="text-xs font-bold text-[#0F172A] dark:text-[#F1F5F9] mb-1">{feature.title}</h3>
                    <p className="text-[11px] text-[#64748B] dark:text-[#94A3B8] leading-relaxed">{feature.desc}</p>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* About Kariakoo */}
      <div className="px-4 pb-6 max-w-2xl mx-auto">
        <Card className="border-0 shadow-lg overflow-hidden">
          <div className="bg-gradient-to-r from-[#065F46] to-[#059669] dark:from-[#022C22] dark:to-[#065F46] p-5">
            <h3 className="text-lg font-bold text-white mb-2">
              {l('About Kariakoo', 'Kuhusu Kariakoo')}
            </h3>
            <p className="text-sm text-white/80 leading-relaxed">
              {l(
                'Kariakoo is the largest open market in East Africa, located in the heart of Dar es Salaam, Tanzania. With over 6 major zones spanning fabrics, spices, electronics, food, jewelry, and wholesale goods, Kariakoo is a vibrant hub of commerce and culture. The name "Kariakoo" comes from "Carrier Corps" — the carrier corps of World War I who were based in this area.',
                'Kariakoo ni soko kubwa zaidi wazi Afrika Mashariki, liko katika moyo wa Dar es Salaam, Tanzania. Kwa maeneo zaidi ya 6 makubwa yanayojumuisha vitambaa, viungo, elektroniki, chakula, vito, na bidhaa za jumla, Kariakoo ni kituo kinachoendelea cha biashara na utamaduni. Jina "Kariakoo" linatokana na "Carrier Corps" — waunda wa Vita Kuu ya Kwanza ya Dunia waliokuwa na makao yao katika eneo hili.'
              )}
            </p>
          </div>
        </Card>
      </div>

      {/* Team / CTA */}
      <div className="px-4 pb-8 max-w-2xl mx-auto text-center">
        <p className="text-sm text-[#64748B] dark:text-[#94A3B8] mb-4">
          {l(
            'Built with ❤️ in Dar es Salaam, Tanzania',
            'Iliundwa kwa ❤️ huko Dar es Salaam, Tanzania'
          )}
        </p>
        <div className="flex flex-wrap gap-2 justify-center">
          <Link href="/help">
            <Badge variant="outline" className="text-xs cursor-pointer hover:bg-[#ECFDF5] dark:hover:bg-[#064E3B]">
              {l('Help Center', 'Kituo Cha Msaada')}
            </Badge>
          </Link>
          <Link href="/legal/terms">
            <Badge variant="outline" className="text-xs cursor-pointer hover:bg-[#ECFDF5] dark:hover:bg-[#064E3B]">
              {l('Terms', 'Sheria')}
            </Badge>
          </Link>
          <Link href="/legal/privacy">
            <Badge variant="outline" className="text-xs cursor-pointer hover:bg-[#ECFDF5] dark:hover:bg-[#064E3B]">
              {l('Privacy', 'Faragha')}
            </Badge>
          </Link>
        </div>
      </div>
    </div>
  );
}

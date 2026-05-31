'use client';

import { useRouter, useParams } from 'next/navigation';
import { useAuthStore } from '@/lib/stores/auth-store';
import {
  ArrowLeft, Star, ShieldCheck, MapPin, Clock, Users, Globe,
  Package, ChevronRight, MessageSquare, Award
} from 'lucide-react';
import { motion } from 'framer-motion';

const GUIDE_DATA: Record<string, {
  name: string; specialty: string; zone: string; zoneColor: string; rating: number;
  sessions: number; status: 'online' | 'busy' | 'offline'; verified: boolean;
  languages: string[]; bio: string; bioSw: string;
  badges: string[]; packages: { title: string; duration: number; price: number; completed: number }[];
  reviews: { name: string; rating: number; text: string; date: string }[];
}> = {
  g1: {
    name: 'Mwanaildi Juma', specialty: 'Fabrics & Village', zone: 'fabrics', zoneColor: '#8A2BE2', rating: 4.8, sessions: 156, status: 'online', verified: true,
    languages: ['Swahili', 'English', 'Arabic'],
    bio: 'Born and raised in Kariakoo. I know every fabric stall by name and can get you the best kanga deals in the market. My family has been in the fabric trade for three generations.',
    bioSw: 'Alizaliwa na kukulia Kariakoo. Ninajua duka la kitenge kwa jina na ninaweza kukupatia mikataba bora ya kanga sokoni. Familia yangu imekuwa katika biashara ya nguo kwa vizazi vitatu.',
    badges: ['Top Rated', '100+ Sessions', 'Verified Expert', 'Multi-Lingual'],
    packages: [
      { title: 'Kanga Shopping Tour', duration: 2, price: 25000, completed: 45 },
      { title: 'Full Fabrics Experience', duration: 4, price: 45000, completed: 28 },
    ],
    reviews: [
      { name: 'Sarah K.', rating: 5, text: 'Mwanaildi knows every stall! Got amazing deals on kanga sets. Highly recommend for fabric shopping.', date: '2 days ago' },
      { name: 'Ahmed M.', rating: 5, text: 'Incredible knowledge of the fabric zone. He negotiated prices I could never get on my own. Will use again!', date: '1 week ago' },
      { name: 'Lisa T.', rating: 4, text: 'Very helpful guide. Knew exactly where to find specific lace patterns. A bit rushed toward the end.', date: '2 weeks ago' },
    ],
  },
  g3: {
    name: 'Asha Mohamed', specialty: 'Wholesale Specialist', zone: 'wholesale', zoneColor: '#14B8A6', rating: 4.9, sessions: 210, status: 'online', verified: true,
    languages: ['Swahili', 'English', 'Hindi'],
    bio: 'The wholesale queen of Kariakoo. I have direct relationships with importers and can get you bulk prices unavailable to walk-in buyers. I handle everything from rice to cooking oil.',
    bioSw: 'Malkia wa jumla wa Kariakoo. Nina mahusiano ya moja kwa moja na waagizaji na ninaweza kukupatia bei za jumla ambazo haziwezipi wateja wa kawaida. Nashughulikia kila kitu kutoka mchele hadi mafuta ya kupika.',
    badges: ['Top Rated', '200+ Sessions', 'Verified Expert', 'Wholesale Pro', 'Hindi Speaker'],
    packages: [
      { title: 'Wholesale Quick Tour', duration: 2, price: 30000, completed: 68 },
      { title: 'Full Import Tour', duration: 6, price: 75000, completed: 35 },
      { title: 'Business Sourcing Package', duration: 8, price: 120000, completed: 15 },
    ],
    reviews: [
      { name: 'James R.', rating: 5, text: 'Asha saved me over 2 million TZS on a bulk rice order. Her connections are unmatched. Absolute must for wholesale buyers.', date: '3 days ago' },
      { name: 'Priya S.', rating: 5, text: 'She speaks Hindi which was perfect for our import needs. Got us direct factory prices on kitchen supplies.', date: '5 days ago' },
    ],
  },
};

const STATUS_MAP = {
  online: { color: '#10B981', label: 'Online', labelSw: 'Mtandaoni' },
  busy: { color: '#F59E0B', label: 'Busy', labelSw: 'Machwa' },
  offline: { color: '#6C757D', label: 'Offline', labelSw: 'Nje ya Mtandao' },
};

export default function GuideProfilePage() {
  const router = useRouter();
  const params = useParams();
  const { language, isAuthenticated } = useAuthStore();
  const sw = language === 'sw';
  const l = (en: string, swText: string) => (sw ? swText : en);

  const guideId = params.id as string;
  const guide = GUIDE_DATA[guideId] || GUIDE_DATA['g1'];

  return (
    <div className="px-4 py-4 space-y-5">
      <motion.div initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }}>
        <button onClick={() => router.push('/guides')} className="flex items-center gap-1 text-sm text-[#6C757D] hover:text-[#0A4D3A]">
          <ArrowLeft className="w-4 h-4" /> {l('Back', 'Rudi')}
        </button>
      </motion.div>

      {/* Profile Header */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="kcard p-5">
        <div className="flex items-center gap-4">
          <div className="relative">
            <div className="w-20 h-20 rounded-2xl flex items-center justify-center text-white font-bold text-2xl" style={{ background: guide.zoneColor }}>
              {guide.name.split(' ').map(n => n[0]).join('')}
            </div>
            <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full border-3 border-white dark:border-[#161B22]" style={{ background: STATUS_MAP[guide.status].color }} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold">{guide.name}</h1>
              {guide.verified && <ShieldCheck className="w-5 h-5 text-[#0B5D3A]" />}
            </div>
            <p className="text-sm text-[#6C757D]">{guide.specialty}</p>
            <span className="text-xs font-medium mt-1 inline-block" style={{ color: STATUS_MAP[guide.status].color }}>
              {sw ? STATUS_MAP[guide.status].labelSw : STATUS_MAP[guide.status].label}
            </span>
          </div>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-3 gap-3 mt-4">
          <div className="text-center p-3 rounded-lg bg-[#F8F9FA] dark:bg-[#21262D]">
            <div className="flex items-center justify-center gap-1"><Star className="w-4 h-4 fill-[#FFD23F] text-[#FFD23F]" /><span className="font-bold">{guide.rating}</span></div>
            <p className="text-[10px] text-[#6C757D] mt-0.5">{l('Rating', 'Alama')}</p>
          </div>
          <div className="text-center p-3 rounded-lg bg-[#F8F9FA] dark:bg-[#21262D]">
            <div className="flex items-center justify-center gap-1"><Users className="w-4 h-4 text-[#0B5D3A]" /><span className="font-bold">{guide.sessions}</span></div>
            <p className="text-[10px] text-[#6C757D] mt-0.5">{l('Sessions', 'Vipindi')}</p>
          </div>
          <div className="text-center p-3 rounded-lg bg-[#F8F9FA] dark:bg-[#21262D]">
            <div className="flex items-center justify-center gap-1"><Globe className="w-4 h-4 text-[#0B5D3A]" /><span className="font-bold text-sm">{guide.languages.length}</span></div>
            <p className="text-[10px] text-[#6C757D] mt-0.5">{l('Languages', 'Lugha')}</p>
          </div>
        </div>
      </motion.div>

      {/* Badges */}
      <div className="flex gap-2 flex-wrap">
        {guide.badges.map(badge => (
          <span key={badge} className="kbadge kbadge-verified flex items-center gap-1"><Award className="w-3 h-3" />{badge}</span>
        ))}
      </div>

      {/* About */}
      <div className="kcard p-5">
        <h3 className="font-semibold text-sm mb-2">{l('About', 'Kuhusu')}</h3>
        <p className="text-sm text-[#6C757D] leading-relaxed">{sw ? guide.bioSw : guide.bio}</p>
        <div className="flex gap-2 flex-wrap mt-3">
          {guide.languages.map(lang => (
            <span key={lang} className="kbadge kbadge-gold">{lang}</span>
          ))}
        </div>
      </div>

      {/* Package Deals */}
      {guide.packages.length > 0 && (
        <div>
          <h3 className="font-semibold text-sm mb-3">{l('Package Deals', 'Pakiti za Biashara')}</h3>
          <div className="space-y-3">
            {guide.packages.map((pkg, i) => (
              <motion.div key={i} initial={{ opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.1 }} className="kcard p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-semibold text-sm">{pkg.title}</h4>
                    <div className="flex items-center gap-3 mt-1">
                      <span className="text-xs text-[#6C757D] flex items-center gap-1"><Clock className="w-3 h-3" />{pkg.duration}h</span>
                      <span className="text-xs text-[#6C757D] flex items-center gap-1"><Users className="w-3 h-3" />{pkg.completed} {l('done', 'zimefanyika')}</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-[#0A4D3C]">TZS {pkg.price.toLocaleString()}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {/* Reviews */}
      {guide.reviews.length > 0 && (
        <div>
          <h3 className="font-semibold text-sm mb-3">{l('Reviews', 'Mapitio')} ({guide.reviews.length})</h3>
          <div className="space-y-3">
            {guide.reviews.map((review, i) => (
              <div key={i} className="kcard p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-[#E8F5EE] flex items-center justify-center text-xs font-bold text-[#0B5D3A]">{review.name.charAt(0)}</div>
                    <div>
                      <p className="text-sm font-medium">{review.name}</p>
                      <div className="flex items-center gap-0.5">{Array.from({ length: 5 }).map((_, j) => <Star key={j} className={`w-3 h-3 ${j < review.rating ? 'fill-[#FFD23F] text-[#FFD23F]' : 'text-[#E5E7EB]'}`} />)}</div>
                    </div>
                  </div>
                  <span className="text-[10px] text-[#6C757D]">{review.date}</span>
                </div>
                <p className="text-sm text-[#6C757D] mt-2 leading-relaxed">{review.text}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Book CTA */}
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="kcard-green p-5 text-center">
        <MessageSquare className="w-8 h-8 text-[#FFD23F] mx-auto mb-2" />
        <h3 className="font-bold text-white">{l('Book This Guide', 'Hudi Mwongozo huyu')}</h3>
        <p className="text-sm text-white/70 mt-1">{l('Start navigating Kariakoo with a trusted expert', 'Anza kutembea Kariakoo na mtaalamu wa kuaminika')}</p>
        <button onClick={() => router.push(isAuthenticated ? '/seeker/find' : '/auth')} className="kbtn-yellow mt-3 text-sm w-full max-w-xs mx-auto">
          {l('Book Now', 'Hudi Sasa')} <ChevronRight className="w-4 h-4" />
        </button>
      </motion.div>
    </div>
  );
}

'use client';
import { useAuthStore } from '@/lib/stores/auth-store';
import { motion } from 'framer-motion';
import { Star, MapPin, Clock, ChevronRight } from 'lucide-react';

const HISTORY = [
  { id: '1', guide: 'Mwanaildi Juma', specialty: 'Fabrics', date: 'May 28, 2026', duration: '2h 15m', amount: 25000, rating: 5, zone: 'Fabrics Zone', review: 'Amazing guide! Got the best kanga prices.' },
  { id: '2', guide: 'Fatma Hassan', specialty: 'Electronics', date: 'May 25, 2026', duration: '1h 45m', amount: 35000, rating: 5, zone: 'Electronics Zone', review: 'Very knowledgeable about genuine vs fake phones.' },
  { id: '3', guide: 'Asha Mohamed', specialty: 'Wholesale', date: 'May 20, 2026', duration: '3h 30m', amount: 75000, rating: 5, zone: 'Wholesale Zone', review: 'Incredible wholesale connections. Saved millions!' },
  { id: '4', guide: 'Said Bakari', specialty: 'General', date: 'May 15, 2026', duration: '2h', amount: 12000, rating: 4, zone: 'Multiple Zones', review: 'Good general navigation, but rushed a bit at the end.' },
];

export default function HistoryPage() {
  const { language } = useAuthStore();
  const sw = language === 'sw';
  const l = (en: string, swText: string) => (sw ? swText : en);

  return (
    <div className="px-4 py-4 space-y-4">
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-2xl font-bold text-[#312E81] dark:text-[#818CF8]">{l('Session History', 'Historia ya Vipindi')}</h1>
        <p className="text-sm text-[#78716C] mt-1">{l('Your past guided sessions', 'Vipindi vyako vilivyopita')}</p>
      </motion.div>

      <div className="space-y-3">
        {HISTORY.map((session, i) => (
          <motion.div key={session.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }} className="kcard p-4">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <div className="w-10 h-10 rounded-full bg-[#3730A3] flex items-center justify-center text-white text-xs font-bold">{session.guide.split(' ').map(n => n[0]).join('')}</div>
                <div>
                  <p className="font-semibold text-sm">{session.guide}</p>
                  <p className="text-xs text-[#78716C]">{session.specialty}</p>
                </div>
              </div>
              <div className="text-right">
                <p className="font-bold text-sm text-[#312E81]">TZS {session.amount.toLocaleString()}</p>
                <div className="flex items-center gap-0.5 justify-end">{Array.from({ length: 5 }).map((_, j) => <Star key={j} className={`w-3 h-3 ${j < session.rating ? 'fill-[#D97706] text-[#D97706]' : 'text-[#E7E5E4]'}`} />)}</div>
              </div>
            </div>
            <div className="flex items-center gap-3 text-xs text-[#78716C] mb-2">
              <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{session.duration}</span>
              <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{session.zone}</span>
              <span>{session.date}</span>
            </div>
            <p className="text-xs text-[#78716C] italic">"{session.review}"</p>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

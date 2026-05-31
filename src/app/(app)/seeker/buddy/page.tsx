'use client';
import { useAuthStore } from '@/lib/stores/auth-store';
import { motion } from 'framer-motion';
import { Users, MapPin, Clock, ChevronRight, Star } from 'lucide-react';

const BUDDY_MATCHES = [
  { id: 'b1', name: 'Amina K.', zone: 'Fabrics Zone', timeSlot: 'Tomorrow 10:00 AM', avatar: 'AK', shared: 'Kanga shopping', guide: 'Mwanaildi Juma', price: 12500 },
  { id: 'b2', name: 'David M.', zone: 'Electronics Zone', timeSlot: 'Today 2:00 PM', avatar: 'DM', shared: 'Phone shopping', guide: 'Fatma Hassan', price: 17500 },
  { id: 'b3', name: 'Sarah L.', zone: 'Wholesale Zone', timeSlot: 'Friday 8:00 AM', avatar: 'SL', shared: 'Bulk rice & oil', guide: 'Asha Mohamed', price: 37500 },
];

export default function BuddyPage() {
  const { language } = useAuthStore();
  const sw = language === 'sw';
  const l = (en: string, swText: string) => (sw ? swText : en);

  return (
    <div className="px-4 py-4 space-y-5">
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-2xl font-bold text-[#0A4D3C] dark:text-[#2EA77A]">{l('Find a Buddy', 'Tafuta Rafiki')}</h1>
        <p className="text-sm text-[#6C757D] mt-1">{l('Share guide costs with other seekers', 'Shiriki gharama za mwongozo na watafutaji wengine')}</p>
      </motion.div>

      <div className="kcard-green p-4">
        <div className="flex items-center gap-3 mb-2">
          <Users className="w-6 h-6 text-[#FFD23F]" />
          <div>
            <h3 className="font-bold text-white text-sm">{l('How It Works', 'Jinsi Inavyofanya Kazi')}</h3>
            <p className="text-xs text-white/60 mt-0.5">{l('Split the guide fee 50/50 with a matched seeker', 'Gawanya ada ya mwongozo 50/50 na mtafutaji aliye na pendwa')}</p>
          </div>
        </div>
      </div>

      <h2 className="text-lg font-bold">{l('Available Matches', 'Mechi Zinazopatikana')}</h2>
      <div className="space-y-3">
        {BUDDY_MATCHES.map((buddy, i) => (
          <motion.div key={buddy.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }} className="kcard p-4">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-12 h-12 rounded-full bg-[#FFD23F] flex items-center justify-center text-[#0A4D3C] font-bold">{buddy.avatar}</div>
              <div className="flex-1">
                <h4 className="font-semibold text-sm">{buddy.name}</h4>
                <p className="text-xs text-[#6C757D]">{l('Looking for:', 'Anatafuta:')} {buddy.shared}</p>
              </div>
            </div>
            <div className="flex items-center gap-3 text-xs text-[#6C757D] mb-3">
              <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{buddy.zone}</span>
              <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{buddy.timeSlot}</span>
            </div>
            <div className="flex items-center justify-between pt-3 border-t border-[#E9ECEF] dark:border-[#30363D]">
              <div>
                <p className="text-xs text-[#6C757D]">{l('Your share with', 'Sehemu yako na')} {buddy.guide}</p>
                <p className="font-bold text-[#0A4D3C]">TZS {buddy.price.toLocaleString()} <span className="text-xs font-normal text-[#6C757D]">{l('(50% off)', '(punguzo 50%)')}</span></p>
              </div>
              <button className="kbtn text-xs py-1.5">{l('Join', 'Jiunge')}</button>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

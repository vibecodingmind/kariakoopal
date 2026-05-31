'use client';
import { useAuthStore } from '@/lib/stores/auth-store';
import { motion } from 'framer-motion';
import { Users, Star, ChevronRight } from 'lucide-react';

const MENTORS = [
  { id: 'm1', name: 'Asha Mohamed', specialty: 'Wholesale Expert', sessions: 210, rating: 4.9, mentees: 3 },
  { id: 'm2', name: 'Khadija Mussa', specialty: 'Textiles Pro', sessions: 189, rating: 4.8, mentees: 2 },
];

export default function GuideMentorshipPage() {
  const { language } = useAuthStore();
  const sw = language === 'sw';
  const l = (en: string, swText: string) => (sw ? swText : en);

  return (
    <div className="px-4 py-4 space-y-5">
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-2xl font-bold text-[#0A4D3C] dark:text-[#2EA77A]">{l('Mentorship', 'Ushauri')}</h1>
        <p className="text-sm text-[#6C757D] mt-1">{l('Learn from senior guides and earn bonus', 'Jifunze kutoka kwa miongozo wazee na pata bonasi')}</p>
      </motion.div>

      <div className="kcard-green p-4">
        <h3 className="font-bold text-white text-sm">{l('How Mentorship Works', 'Jinsi Ushauri Unavyofanya Kazi')}</h3>
        <p className="text-xs text-white/70 mt-1">{l('Complete 5 sessions with a mentor to earn a 3% bonus on all future sessions. Mentors earn 2% from your sessions.', 'Kamilisha vipindi 5 na mshauri kupata bonasi ya 3% kwa vipindi vyote vijavyo. Washauri wanapata 2% kutoka kwa vipindi vyako.')}</p>
      </div>

      <h2 className="text-lg font-bold">{l('Available Mentors', 'Washauri Wapo')}</h2>
      <div className="space-y-3">
        {MENTORS.map((mentor, i) => (
          <motion.div key={mentor.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }} className="kcard p-4">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-12 h-12 rounded-full bg-[#0B5D3A] flex items-center justify-center text-white font-bold">{mentor.name.split(' ').map(n => n[0]).join('')}</div>
              <div>
                <h4 className="font-semibold text-sm">{mentor.name}</h4>
                <p className="text-xs text-[#6C757D]">{mentor.specialty}</p>
              </div>
            </div>
            <div className="flex items-center gap-4 text-xs text-[#6C757D]">
              <span className="flex items-center gap-1"><Star className="w-3 h-3 fill-[#FFD23F] text-[#FFD23F]" />{mentor.rating}</span>
              <span className="flex items-center gap-1"><Users className="w-3 h-3" />{mentor.sessions} {l('sessions', 'vipindi')}</span>
              <span>{mentor.mentees} {l('mentees', 'wanafunzi')}</span>
            </div>
            <button className="kbtn w-full mt-3 text-sm">{l('Request Mentorship', 'Omba Ushauri')}</button>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

'use client';
import { useAuthStore } from '@/lib/stores/auth-store';
import { motion } from 'framer-motion';
import { Clock, MapPin, Star, ChevronRight, CheckCircle2, XCircle } from 'lucide-react';

const SESSIONS = [
  { id: 's1', seeker: 'James K.', zone: 'Electronics Zone', time: 'Today 2:00 PM', status: 'upcoming', amount: 35000 },
  { id: 's2', seeker: 'Amina S.', zone: 'Fabrics Zone', time: 'Today 4:30 PM', status: 'upcoming', amount: 25000 },
  { id: 's3', seeker: 'David R.', zone: 'Wholesale Zone', time: 'Tomorrow 9:00 AM', status: 'pending', amount: 75000 },
  { id: 's4', seeker: 'Sarah M.', zone: 'Spices Zone', time: 'Yesterday', status: 'completed', amount: 15000, rating: 5 },
  { id: 's5', seeker: 'Ahmed T.', zone: 'Fabrics Zone', time: '2 days ago', status: 'completed', amount: 25000, rating: 4 },
];

export default function GuideSessionsPage() {
  const { language } = useAuthStore();
  const sw = language === 'sw';
  const l = (en: string, swText: string) => (sw ? swText : en);

  const upcoming = SESSIONS.filter(s => s.status === 'upcoming');
  const pending = SESSIONS.filter(s => s.status === 'pending');
  const completed = SESSIONS.filter(s => s.status === 'completed');

  return (
    <div className="px-4 py-4 space-y-5">
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-2xl font-bold text-[#0A4D3C] dark:text-[#2EA77A]">{l('Sessions', 'Vipindi')}</h1>
      </motion.div>

      {upcoming.length > 0 && (
        <div>
          <h2 className="text-sm font-bold text-[#10B981] mb-2 flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-[#10B981] animate-pulse-dot" />{l('Upcoming', 'Zinazokuja')}</h2>
          <div className="space-y-3">
            {upcoming.map(s => (
              <div key={s.id} className="kcard-green p-4">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-semibold text-white text-sm">{s.seeker}</h4>
                  <span className="text-sm font-bold text-[#FFD23F]">TZS {s.amount.toLocaleString()}</span>
                </div>
                <div className="flex items-center gap-3 text-xs text-white/60">
                  <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{s.zone}</span>
                  <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{s.time}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {pending.length > 0 && (
        <div>
          <h2 className="text-sm font-bold text-[#F59E0B] mb-2">{l('Pending Approval', 'Zinasubiri Idhini')}</h2>
          <div className="space-y-3">
            {pending.map(s => (
              <div key={s.id} className="kcard p-4">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-semibold text-sm">{s.seeker}</h4>
                  <span className="text-sm font-bold text-[#0A4D3C]">TZS {s.amount.toLocaleString()}</span>
                </div>
                <div className="flex items-center gap-3 text-xs text-[#6C757D] mb-3">
                  <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{s.zone}</span>
                  <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{s.time}</span>
                </div>
                <div className="flex gap-2">
                  <button className="kbtn flex-1 text-xs py-2 flex items-center justify-center gap-1"><CheckCircle2 className="w-3 h-3" />{l('Accept', 'Kubali')}</button>
                  <button className="kbtn-outline flex-1 text-xs py-2 flex items-center justify-center gap-1"><XCircle className="w-3 h-3" />{l('Decline', 'Kataa')}</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {completed.length > 0 && (
        <div>
          <h2 className="text-sm font-bold text-[#6C757D] mb-2">{l('Completed', 'Zimekamilika')}</h2>
          <div className="space-y-3">
            {completed.map(s => (
              <div key={s.id} className="kcard p-4 opacity-75">
                <div className="flex items-center justify-between mb-1">
                  <h4 className="font-semibold text-sm">{s.seeker}</h4>
                  <span className="text-sm font-bold">TZS {s.amount.toLocaleString()}</span>
                </div>
                <div className="flex items-center gap-3 text-xs text-[#6C757D]">
                  <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{s.zone}</span>
                  <span>{s.time}</span>
                  {s.rating && <span className="flex items-center gap-0.5">{Array.from({length: s.rating}).map((_,j) => <Star key={j} className="w-3 h-3 fill-[#FFD23F] text-[#FFD23F]" />)}</span>}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

'use client';
import { useAuthStore } from '@/lib/stores/auth-store';
import { motion } from 'framer-motion';
import { AlertTriangle, Clock, User, MessageSquare, CheckCircle2 } from 'lucide-react';

const DISPUTES = [
  { id: 'd1', seeker: 'James K.', guide: 'Unknown Guide', reason: 'Guide did not show up', amount: 35000, status: 'open', date: '2 hours ago' },
  { id: 'd2', seeker: 'Amina S.', guide: 'Fatma H.', reason: 'Item was counterfeit', amount: 250000, status: 'investigating', date: '1 day ago' },
  { id: 'd3', seeker: 'David M.', guide: 'Said B.', reason: 'Overcharged for service', amount: 50000, status: 'open', date: '3 days ago' },
];

export default function AdminDisputesPage() {
  const { language } = useAuthStore();
  const sw = language === 'sw';
  const l = (en: string, swText: string) => (sw ? swText : en);

  return (
    <div className="px-4 py-4 space-y-5">
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-2xl font-bold text-[#0A4D3C] dark:text-[#2EA77A]">{l('Disputes', 'Migogoro')}</h1>
      </motion.div>

      <div className="space-y-3">
        {DISPUTES.map((dispute, i) => (
          <motion.div key={dispute.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }} className={`kcard p-4 border-l-4 ${dispute.status === 'open' ? 'border-[#E63946]' : 'border-[#F59E0B]'}`}>
            <div className="flex items-center justify-between mb-2">
              <span className={`kbadge ${dispute.status === 'open' ? 'kbadge-urgent' : 'kbadge-pending'}`}>{dispute.status.toUpperCase()}</span>
              <span className="text-xs text-[#6C757D] flex items-center gap-1"><Clock className="w-3 h-3" />{dispute.date}</span>
            </div>
            <h4 className="font-semibold text-sm mb-1">{dispute.reason}</h4>
            <div className="flex items-center gap-3 text-xs text-[#6C757D] mb-3">
              <span className="flex items-center gap-1"><User className="w-3 h-3" />{dispute.seeker} vs {dispute.guide}</span>
              <span className="font-medium text-[#0A4D3C]">TZS {dispute.amount.toLocaleString()}</span>
            </div>
            <div className="flex gap-2">
              <button className="kbtn flex-1 text-xs py-2 flex items-center justify-center gap-1"><MessageSquare className="w-3 h-3" />{l('Investigate', 'Chunguza')}</button>
              <button className="kbtn-outline flex-1 text-xs py-2 flex items-center justify-center gap-1"><CheckCircle2 className="w-3 h-3" />{l('Resolve', 'Suluhisha')}</button>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

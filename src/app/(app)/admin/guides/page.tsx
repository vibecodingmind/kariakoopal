'use client';
import { useAuthStore } from '@/lib/stores/auth-store';
import { motion } from 'framer-motion';
import { ShieldCheck, Star, Users, Clock, CheckCircle2, XCircle, Eye } from 'lucide-react';

const PENDING_GUIDES = [
  { id: 'pg1', name: 'Omar Selemani', specialty: 'Artisanal Crafts', sessions: 45, rating: 4.4, status: 'pending', submitted: '2 days ago' },
  { id: 'pg2', name: 'Mariam Hamza', specialty: 'Electronics Repair', sessions: 0, rating: 0, status: 'pending', submitted: '5 hours ago' },
];
const ACTIVE_GUIDES = [
  { id: 'ag1', name: 'Mwanaildi Juma', specialty: 'Fabrics', sessions: 156, rating: 4.8, status: 'active' },
  { id: 'ag2', name: 'Fatma Hassan', specialty: 'Electronics', sessions: 98, rating: 4.6, status: 'active' },
  { id: 'ag3', name: 'Asha Mohamed', specialty: 'Wholesale', sessions: 210, rating: 4.9, status: 'active' },
];

export default function AdminGuidesPage() {
  const { language } = useAuthStore();
  const sw = language === 'sw';
  const l = (en: string, swText: string) => (sw ? swText : en);

  return (
    <div className="px-4 py-4 space-y-5">
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-2xl font-bold text-[#0A4D3C] dark:text-[#2EA77A]">{l('Manage Guides', 'Simamia Miongozo')}</h1>
      </motion.div>

      {PENDING_GUIDES.length > 0 && (
        <div>
          <h2 className="text-sm font-bold text-[#F59E0B] mb-2">{l('Pending Verification', 'Inasubiri Uthibitishaji')} ({PENDING_GUIDES.length})</h2>
          <div className="space-y-3">
            {PENDING_GUIDES.map((guide, i) => (
              <motion.div key={guide.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }} className="kcard p-4 border-l-4 border-[#F59E0B]">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-10 h-10 rounded-full bg-[#FEF3C7] flex items-center justify-center text-[#D97706] font-bold">{guide.name.charAt(0)}</div>
                  <div><h4 className="font-semibold text-sm">{guide.name}</h4><p className="text-xs text-[#6C757D]">{guide.specialty}</p></div>
                </div>
                <div className="flex items-center gap-3 text-xs text-[#6C757D] mb-3">
                  <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{guide.submitted}</span>
                  {guide.sessions > 0 && <><span className="flex items-center gap-1"><Users className="w-3 h-3" />{guide.sessions}</span><span className="flex items-center gap-1"><Star className="w-3 h-3" />{guide.rating}</span></>}
                </div>
                <div className="flex gap-2">
                  <button className="kbtn flex-1 text-xs py-2 flex items-center justify-center gap-1"><CheckCircle2 className="w-3 h-3" />{l('Approve', 'Kubali')}</button>
                  <button className="kbtn-outline flex-1 text-xs py-2 flex items-center justify-center gap-1"><Eye className="w-3 h-3" />{l('Review', 'Kagua')}</button>
                  <button className="kbtn-danger text-xs py-2 px-3 flex items-center justify-center gap-1"><XCircle className="w-3 h-3" />{l('Reject', 'Kataa')}</button>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      )}

      <div>
        <h2 className="text-sm font-bold mb-2 flex items-center gap-1"><ShieldCheck className="w-4 h-4 text-[#0B5D3A]" />{l('Active Guides', 'Miongozo Hai')} ({ACTIVE_GUIDES.length})</h2>
        <div className="space-y-2">
          {ACTIVE_GUIDES.map((guide, i) => (
            <div key={guide.id} className="kcard p-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-[#0B5D3A] flex items-center justify-center text-white text-xs font-bold">{guide.name.split(' ').map(n => n[0]).join('')}</div>
                <div><p className="text-sm font-medium">{guide.name}</p><p className="text-xs text-[#6C757D]">{guide.specialty} · {guide.sessions} {l('sessions', 'vipindi')} · {guide.rating}★</p></div>
              </div>
              <span className="kbadge kbadge-verified">{l('Active', 'Hai')}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

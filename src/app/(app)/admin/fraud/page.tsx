'use client';
import { useAuthStore } from '@/lib/stores/auth-store';
import { motion } from 'framer-motion';
import { ShieldCheck, AlertTriangle, Eye, Clock, User, TrendingUp } from 'lucide-react';

const FRAUD_ALERTS = [
  { id: 'f1', type: 'Rating Manipulation', entity: 'Guide #G452', entityType: 'guide', confidence: 87, status: 'pending', details: 'Unusual 5-star review pattern from 12 new accounts in 24 hours', date: '1 hour ago' },
  { id: 'f2', type: 'Recommendation Spike', entity: 'Vendor #V201', entityType: 'vendor', confidence: 72, status: 'pending', details: '300+ recommendations in 2 hours from same IP range', date: '3 hours ago' },
  { id: 'f3', type: 'Fast Completion', entity: 'Guide #G389', entityType: 'guide', confidence: 65, status: 'investigated', details: '5 sessions completed under 10 minutes each', date: '2 days ago' },
];

export default function AdminFraudPage() {
  const { language } = useAuthStore();
  const sw = language === 'sw';
  const l = (en: string, swText: string) => (sw ? swText : en);

  return (
    <div className="px-4 py-4 space-y-5">
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-2xl font-bold text-[#0A4D3C] dark:text-[#2EA77A]">{l('Fraud Alerts', 'Tahadhari za Dhuluma')}</h1>
      </motion.div>

      <div className="space-y-3">
        {FRAUD_ALERTS.map((alert, i) => (
          <motion.div key={alert.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }} className={`kcard p-4 border-l-4 ${alert.confidence > 80 ? 'border-[#E63946]' : alert.confidence > 60 ? 'border-[#F59E0B]' : 'border-[#6C757D]'}`}>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <AlertTriangle className={`w-4 h-4 ${alert.confidence > 80 ? 'text-[#E63946]' : 'text-[#F59E0B]'}`} />
                <span className="font-semibold text-sm">{alert.type}</span>
              </div>
              <span className={`kbadge ${alert.status === 'pending' ? 'kbadge-urgent' : 'kbadge-pending'}`}>{alert.status}</span>
            </div>
            <div className="flex items-center gap-3 text-xs text-[#6C757D] mb-2">
              <span className="flex items-center gap-1"><User className="w-3 h-3" />{alert.entity}</span>
              <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{alert.date}</span>
              <span className="flex items-center gap-1 font-medium" style={{ color: alert.confidence > 80 ? '#E63946' : '#F59E0B' }}>{alert.confidence}% {l('confidence', 'uhakika')}</span>
            </div>
            <p className="text-xs text-[#6C757D] mb-3">{alert.details}</p>
            <div className="flex gap-2">
              <button className="kbtn flex-1 text-xs py-2 flex items-center justify-center gap-1"><Eye className="w-3 h-3" />{l('Investigate', 'Chunguza')}</button>
              <button className="kbtn-outline flex-1 text-xs py-2">{l('Dismiss', 'Puuzia')}</button>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

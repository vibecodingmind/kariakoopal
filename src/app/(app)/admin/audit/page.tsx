'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/lib/stores/auth-store';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FileText, Search, Filter, Shield, LogIn, ArrowRightLeft,
  DollarSign, AlertTriangle, Clock, ChevronDown, Download, ArrowLeft,
} from 'lucide-react';

type ActionType = 'login' | 'role_change' | 'payout' | 'dispute' | 'security';

interface AuditEntry {
  id: string;
  timestamp: string;
  user: string;
  action: ActionType;
  details: string;
  ip: string;
}

const ACTION_CONFIG: Record<ActionType, { icon: typeof LogIn; color: string; bgClass: string; badgeClass: string; label: string; labelSw: string }> = {
  login:       { icon: LogIn,          color: '#059669', bgClass: 'bg-[#ECFDF5] dark:bg-[#064E3B]', badgeClass: 'kbadge-live',     label: 'Login',        labelSw: 'Kuingia' },
  role_change: { icon: ArrowRightLeft, color: '#2563EB', bgClass: 'bg-[#DBEAFE] dark:bg-[#1E3A5F]', badgeClass: 'kbadge-verified', label: 'Role Change',  labelSw: 'Mabadiliko ya Nafasi' },
  payout:      { icon: DollarSign,     color: '#F59E0B', bgClass: 'bg-[#FEF3C7] dark:bg-[#78350F]', badgeClass: 'kbadge-gold',     label: 'Payout',       labelSw: 'Malipo' },
  dispute:     { icon: AlertTriangle,  color: '#DC2626', bgClass: 'bg-[#FEE2E2] dark:bg-[#7F1D1D]', badgeClass: 'kbadge-urgent',   label: 'Dispute',      labelSw: 'Mgogoro' },
  security:    { icon: Shield,         color: '#7C3AED', bgClass: 'bg-[#F3E8FF] dark:bg-[#3B0764]', badgeClass: 'kbadge-pending',  label: 'Security',     labelSw: 'Usalama' },
};

const AUDIT_ENTRIES: AuditEntry[] = [
  { id: 'a1',  timestamp: '2025-05-31 14:32:05', user: 'Admin Mkuu',    action: 'login',       details: 'Admin logged in from Chrome/Windows', ip: '192.168.1.45' },
  { id: 'a2',  timestamp: '2025-05-31 14:28:12', user: 'Admin Mkuu',    action: 'payout',      details: 'Payout of TZS 250,000 approved for Guide #G452', ip: '192.168.1.45' },
  { id: 'a3',  timestamp: '2025-05-31 13:45:33', user: 'Super Admin',   action: 'role_change', details: 'Changed Omar S. role from seeker to guide', ip: '192.168.1.10' },
  { id: 'a4',  timestamp: '2025-05-31 12:15:08', user: 'Admin Mkuu',    action: 'dispute',     details: 'Dispute #452 escalated to mediation', ip: '192.168.1.45' },
  { id: 'a5',  timestamp: '2025-05-31 11:50:22', user: 'Super Admin',   action: 'security',    details: 'User David M. suspended for policy violation', ip: '192.168.1.10' },
  { id: 'a6',  timestamp: '2025-05-31 10:30:15', user: 'Admin Mkuu',    action: 'login',       details: 'Admin logged in from Safari/macOS', ip: '192.168.1.45' },
  { id: 'a7',  timestamp: '2025-05-31 09:22:41', user: 'Super Admin',   action: 'payout',      details: 'Batch payout of TZS 1,200,000 processed for 8 guides', ip: '192.168.1.10' },
  { id: 'a8',  timestamp: '2025-05-30 18:45:10', user: 'Admin Mkuu',    action: 'dispute',     details: 'Dispute #449 resolved — refund issued', ip: '192.168.1.45' },
  { id: 'a9',  timestamp: '2025-05-30 16:33:28', user: 'Super Admin',   action: 'role_change', details: 'Changed Fatma H. role from guide to admin', ip: '192.168.1.10' },
  { id: 'a10', timestamp: '2025-05-30 15:20:55', user: 'Super Admin',   action: 'security',    details: 'Fraud detection threshold updated to 75%', ip: '192.168.1.10' },
  { id: 'a11', timestamp: '2025-05-30 14:10:33', user: 'Admin Mkuu',    action: 'login',       details: 'Admin logged in from Firefox/Linux', ip: '10.0.0.22' },
  { id: 'a12', timestamp: '2025-05-30 12:55:18', user: 'Admin Mkuu',    action: 'security',    details: 'User Peter O. suspended — fraudulent activity', ip: '192.168.1.45' },
  { id: 'a13', timestamp: '2025-05-29 17:35:20', user: 'Super Admin',   action: 'payout',      details: 'Monthly batch payout: TZS 4,500,000 for 32 guides', ip: '192.168.1.10' },
  { id: 'a14', timestamp: '2025-05-29 14:50:12', user: 'Admin Mkuu',    action: 'dispute',     details: 'Dispute #447 escalated by seeker Amina S.', ip: '192.168.1.45' },
  { id: 'a15', timestamp: '2025-05-29 11:12:08', user: 'Super Admin',   action: 'role_change', details: 'Changed Said B. role from guide to seeker', ip: '192.168.1.10' },
];

const FILTER_OPTIONS: { key: ActionType | 'all'; label: string; labelSw: string }[] = [
  { key: 'all',         label: 'All Actions',         labelSw: 'Vitendo Vyote' },
  { key: 'login',       label: 'Login',               labelSw: 'Kuingia' },
  { key: 'role_change', label: 'Role Change',         labelSw: 'Mabadiliko ya Nafasi' },
  { key: 'payout',      label: 'Payout',              labelSw: 'Malipo' },
  { key: 'dispute',     label: 'Dispute',             labelSw: 'Mgogoro' },
  { key: 'security',    label: 'Security',            labelSw: 'Usalama' },
];

export default function AdminAuditPage() {
  const { user, language, isAuthenticated } = useAuthStore();
  const router = useRouter();
  const sw = language === 'sw';
  const l = (en: string, s: string) => (sw ? s : en);

  const [searchQuery, setSearchQuery] = useState('');
  const [actionFilter, setActionFilter] = useState<ActionType | 'all'>('all');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [visibleCount, setVisibleCount] = useState(10);

  useEffect(() => {
    if (!isAuthenticated || user?.role !== 'admin') router.replace('/auth');
  }, [isAuthenticated, user, router]);

  if (!isAuthenticated) return null;

  const filtered = AUDIT_ENTRIES.filter((entry) => {
    const matchesSearch = !searchQuery ||
      entry.user.toLowerCase().includes(searchQuery.toLowerCase()) ||
      entry.details.toLowerCase().includes(searchQuery.toLowerCase()) ||
      entry.ip.includes(searchQuery);
    const matchesFilter = actionFilter === 'all' || entry.action === actionFilter;
    const entryDate = entry.timestamp.split(' ')[0];
    const matchesFrom = !dateFrom || entryDate >= dateFrom;
    const matchesTo = !dateTo || entryDate <= dateTo;
    return matchesSearch && matchesFilter && matchesFrom && matchesTo;
  });

  const visible = filtered.slice(0, visibleCount);
  const securityCount = AUDIT_ENTRIES.filter((e) => e.action === 'security').length;
  const roleChangeCount = AUDIT_ENTRIES.filter((e) => e.action === 'role_change').length;

  return (
    <div className="px-4 py-4 space-y-5 min-h-screen">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button onClick={() => router.push('/admin')} className="kbtn-ghost p-2 rounded-xl">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-2xl font-bold gradient-text-green">{l('Audit Log', 'Kumbukumbu ya Ukaguzi')}</h1>
            <p className="text-xs text-[#64748B] dark:text-[#94A3B8] mt-0.5">{l('Track all admin actions', 'Fuatilia vitendo vyote vya msimamizi')}</p>
          </div>
        </div>
        <button className="kbtn-outline text-xs py-2 px-3 flex items-center gap-1.5">
          <Download className="w-3.5 h-3.5" />
          {l('Export', 'Hamisha')}
        </button>
      </motion.div>

      {/* Stats Row */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }} className="grid grid-cols-3 gap-3">
        {[
          { icon: FileText, value: '47', label: l('Events Today', 'Matukio Leo'), color: '#065F46', bg: 'bg-[#ECFDF5] dark:bg-[#064E3B]' },
          { icon: Shield, value: String(securityCount), label: l('Security', 'Usalama'), color: '#7C3AED', bg: 'bg-[#F3E8FF] dark:bg-[#3B0764]' },
          { icon: ArrowRightLeft, value: String(roleChangeCount), label: l('Role Changes', 'Mabadiliko ya Nafasi'), color: '#2563EB', bg: 'bg-[#DBEAFE] dark:bg-[#1E3A5F]' },
        ].map((s, i) => (
          <div key={i} className="kcard p-3 flex items-center gap-2.5">
            <div className={`w-9 h-9 rounded-xl ${s.bg} flex items-center justify-center shrink-0`}>
              <s.icon className="w-4 h-4" style={{ color: s.color }} />
            </div>
            <div>
              <p className="text-lg font-bold">{s.value}</p>
              <p className="text-[9px] text-[#64748B] dark:text-[#94A3B8]">{s.label}</p>
            </div>
          </div>
        ))}
      </motion.div>

      {/* Filters */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="space-y-3">
        {/* Search */}
        <div className="ksearch flex items-center gap-2 px-4 py-3">
          <Search className="w-4 h-4 text-[#64748B] dark:text-[#94A3B8] shrink-0" />
          <input
            type="text"
            placeholder={l('Search actions, users, IPs...', 'Tafuta vitendo, watumiaji, IP...')}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="flex-1 bg-transparent outline-none text-sm placeholder:text-[#94A3B8]"
          />
          <Filter className="w-4 h-4 text-[#64748B] dark:text-[#94A3B8] shrink-0" />
        </div>
        {/* Action Type + Date Range */}
        <div className="flex gap-2">
          <select
            value={actionFilter}
            onChange={(e) => setActionFilter(e.target.value as ActionType | 'all')}
            className="kinput flex-1 text-xs py-2.5"
          >
            {FILTER_OPTIONS.map((opt) => (
              <option key={opt.key} value={opt.key}>{sw ? opt.labelSw : opt.label}</option>
            ))}
          </select>
          <input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} className="kinput text-xs py-2.5 w-28" />
          <input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} className="kinput text-xs py-2.5 w-28" />
        </div>
      </motion.div>

      {/* Log Entries */}
      <div className="space-y-2">
        <AnimatePresence>
          {visible.map((entry, i) => {
            const config = ACTION_CONFIG[entry.action];
            const IconComp = config.icon;
            return (
              <motion.div
                key={entry.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={{ delay: i * 0.02 }}
                className="kcard p-3"
              >
                <div className="flex items-start gap-3">
                  <div className={`w-9 h-9 rounded-xl ${config.bgClass} flex items-center justify-center shrink-0`}>
                    <IconComp className="w-4 h-4" style={{ color: config.color }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={`kbadge ${config.badgeClass}`}>
                        {sw ? config.labelSw : config.label}
                      </span>
                      <span className="text-[10px] text-[#64748B] dark:text-[#94A3B8] flex items-center gap-1">
                        <Clock className="w-3 h-3" />{entry.timestamp}
                      </span>
                    </div>
                    <p className="text-xs mt-1">{entry.details}</p>
                    <div className="flex items-center gap-3 mt-1.5 text-[10px] text-[#64748B] dark:text-[#94A3B8]">
                      <span className="flex items-center gap-1">
                        <div className="w-4 h-4 rounded-full bg-gradient-to-br from-[#065F46] to-[#059669] flex items-center justify-center">
                          <span className="text-[7px] text-white font-bold">{entry.user.charAt(0)}</span>
                        </div>
                        {entry.user}
                      </span>
                      <span>{entry.ip}</span>
                    </div>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>

      {/* Load More */}
      {visibleCount < filtered.length && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex justify-center">
          <button onClick={() => setVisibleCount((p) => p + 10)} className="kbtn-outline text-xs py-2 px-6 flex items-center gap-1.5">
            <ChevronDown className="w-3.5 h-3.5" />
            {l('Load More', 'Pakia Zaidi')} ({filtered.length - visibleCount} {l('remaining', 'zimesalia')})
          </button>
        </motion.div>
      )}

      {filtered.length === 0 && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="kcard p-8 text-center">
          <Search className="w-10 h-10 mx-auto text-[#94A3B8] mb-2" />
          <p className="text-sm text-[#64748B] dark:text-[#94A3B8]">{l('No audit entries found', 'Hakuna kumbukumbu zilizopatikana')}</p>
        </motion.div>
      )}
    </div>
  );
}

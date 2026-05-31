'use client';
import { useState, useEffect } from 'react';
import { useAuthStore } from '@/lib/stores/auth-store';
import { motion, AnimatePresence } from 'framer-motion';
import { ShieldCheck, AlertTriangle, Eye, Clock, User, TrendingUp, Ban, CheckCircle, XCircle, Search, Filter, BarChart3, Users, CreditCard, MessageSquare, Activity } from 'lucide-react';

type Severity = 'low' | 'medium' | 'high' | 'critical';
type AlertStatus = 'pending' | 'investigating' | 'resolved' | 'dismissed';

interface FraudAlert {
  id: string;
  type: string;
  entity: string;
  entityType: 'guide' | 'seeker' | 'vendor';
  severity: Severity;
  confidence: number;
  status: AlertStatus;
  details: string;
  date: string;
  rule: string;
}

const SEVERITY_COLORS: Record<Severity, string> = {
  low: '#64748B',
  medium: '#F59E0B',
  high: '#EA580C',
  critical: '#DC2626',
};

const SEVERITY_BG: Record<Severity, string> = {
  low: 'bg-slate-100 dark:bg-slate-800',
  medium: 'bg-amber-50 dark:bg-amber-950',
  high: 'bg-orange-50 dark:bg-orange-950',
  critical: 'bg-red-50 dark:bg-red-950',
};

const DEMO_ALERTS: FraudAlert[] = [
  { id: 'f1', type: 'Rating Manipulation', entity: 'Guide #G452', entityType: 'guide', severity: 'critical', confidence: 87, status: 'pending', details: 'Unusual 5-star review pattern from 12 new accounts created within 24 hours. All reviews have identical text and were posted from the same IP range.', date: '1 hour ago', rule: 'fake_reviews' },
  { id: 'f2', type: 'Recommendation Spike', entity: 'Vendor #V201', entityType: 'vendor', severity: 'high', confidence: 72, status: 'pending', details: '300+ recommendations in 2 hours from same IP range. Normal daily average is 15-20.', date: '3 hours ago', rule: 'unusual_activity' },
  { id: 'f3', type: 'Fast Completion', entity: 'Guide #G389', entityType: 'guide', severity: 'medium', confidence: 65, status: 'investigating', details: '5 sessions completed under 10 minutes each. Average session duration for this zone is 45-90 minutes.', date: '2 days ago', rule: 'session_anomaly' },
  { id: 'f4', type: 'Multiple Accounts', entity: 'Seeker #S102, #S103, #S104', entityType: 'seeker', severity: 'high', confidence: 91, status: 'pending', details: '3 accounts created from same device fingerprint within 1 hour. Likely referral fraud.', date: '4 hours ago', rule: 'multi_account' },
  { id: 'f5', type: 'Payment Anomaly', entity: 'Guide #G512', entityType: 'guide', severity: 'medium', confidence: 58, status: 'pending', details: 'Wallet top-up of TZS 2,000,000 followed by immediate withdrawal. Pattern consistent with money laundering.', date: '6 hours ago', rule: 'payment_anomaly' },
  { id: 'f6', type: 'No-Show Pattern', entity: 'Guide #G278', entityType: 'guide', severity: 'high', confidence: 78, status: 'pending', details: '7 no-shows in the past 14 days. No-show rate of 35% vs platform average of 3%.', date: '12 hours ago', rule: 'no_show_pattern' },
  { id: 'f7', type: 'Duplicate Listing', entity: 'Vendor #V89 & #V92', entityType: 'vendor', severity: 'low', confidence: 45, status: 'dismissed', details: 'Two vendor listings with similar names, photos, and descriptions in the same zone.', date: '3 days ago', rule: 'duplicate_content' },
  { id: 'f8', type: 'Cancellation Abuse', entity: 'Seeker #S67', entityType: 'seeker', severity: 'medium', confidence: 62, status: 'resolved', details: 'Booked and cancelled 8 sessions in 3 days. Pattern suggests testing guide availability without intent to book.', date: '5 days ago', rule: 'cancellation_abuse' },
];

const RISK_USERS = [
  { id: 'G452', name: 'James Mwangi', role: 'guide', score: 87, trend: 'up' },
  { id: 'S102', name: 'Unknown User', role: 'seeker', score: 91, trend: 'up' },
  { id: 'G278', name: 'Fatima Hassan', role: 'guide', score: 78, trend: 'up' },
  { id: 'G389', name: 'Peter Kimathi', role: 'guide', score: 65, trend: 'stable' },
  { id: 'V201', name: 'Kariakoo Electronics', role: 'vendor', score: 72, trend: 'up' },
  { id: 'G512', name: 'Amina Juma', role: 'guide', score: 58, trend: 'down' },
];

const DETECTION_RULES = [
  { id: 'fake_reviews', name: 'Fake Review Detection', description: 'Flags unusual review patterns, duplicate text, and new-account review bombing', enabled: true, alerts: 12 },
  { id: 'multi_account', name: 'Multi-Account Detection', description: 'Detects multiple accounts from same device/IP fingerprint', enabled: true, alerts: 8 },
  { id: 'session_anomaly', name: 'Session Anomaly', description: 'Flags sessions with abnormal duration, location, or completion patterns', enabled: true, alerts: 5 },
  { id: 'payment_anomaly', name: 'Payment Anomaly', description: 'Detects unusual payment amounts, rapid top-up/withdrawal patterns', enabled: true, alerts: 3 },
  { id: 'no_show_pattern', name: 'No-Show Pattern', description: 'Tracks guides with abnormally high no-show rates', enabled: true, alerts: 7 },
  { id: 'unusual_activity', name: 'Activity Spike', description: 'Flags sudden spikes in recommendations, bookings, or ratings', enabled: true, alerts: 4 },
  { id: 'cancellation_abuse', name: 'Cancellation Abuse', description: 'Detects users who frequently book and cancel', enabled: false, alerts: 2 },
  { id: 'duplicate_content', name: 'Duplicate Content', description: 'Finds duplicate vendor listings or guide profiles', enabled: false, alerts: 1 },
];

export default function AdminFraudPage() {
  const { language } = useAuthStore();
  const sw = language === 'sw';
  const l = (en: string, swText: string) => (sw ? swText : en);

  const [alerts, setAlerts] = useState<FraudAlert[]>(DEMO_ALERTS);
  const [selectedTab, setSelectedTab] = useState<'alerts' | 'risk' | 'rules' | 'stats'>('alerts');
  const [severityFilter, setSeverityFilter] = useState<Severity | 'all'>('all');
  const [statusFilter, setStatusFilter] = useState<AlertStatus | 'all'>('all');
  const [selectedAlert, setSelectedAlert] = useState<FraudAlert | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const filteredAlerts = alerts.filter(a => {
    if (severityFilter !== 'all' && a.severity !== severityFilter) return false;
    if (statusFilter !== 'all' && a.status !== statusFilter) return false;
    if (searchQuery && !a.type.toLowerCase().includes(searchQuery.toLowerCase()) && !a.entity.toLowerCase().includes(searchQuery.toLowerCase()) && !a.details.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    return true;
  });

  const stats = {
    total: alerts.length,
    pending: alerts.filter(a => a.status === 'pending').length,
    critical: alerts.filter(a => a.severity === 'critical').length,
    resolved: alerts.filter(a => a.status === 'resolved' || a.status === 'dismissed').length,
  };

  const handleAlertAction = (alertId: string, action: 'investigate' | 'dismiss' | 'suspend' | 'ban' | 'resolve') => {
    setAlerts(prev => prev.map(a => {
      if (a.id !== alertId) return a;
      switch (action) {
        case 'investigate': return { ...a, status: 'investigating' as AlertStatus };
        case 'dismiss': return { ...a, status: 'dismissed' as AlertStatus };
        case 'resolve': return { ...a, status: 'resolved' as AlertStatus };
        case 'suspend': return { ...a, status: 'resolved' as AlertStatus, details: a.details + ' [USER SUSPENDED]' };
        case 'ban': return { ...a, status: 'resolved' as AlertStatus, details: a.details + ' [USER BANNED]' };
        default: return a;
      }
    }));
    setSelectedAlert(null);
  };

  const tabs = [
    { id: 'alerts' as const, label: l('Alerts', 'Tahadhari'), icon: AlertTriangle, count: stats.pending },
    { id: 'risk' as const, label: l('Risk Scores', 'Alama za Hatari'), icon: BarChart3 },
    { id: 'rules' as const, label: l('Detection Rules', 'Kanusu'), icon: ShieldCheck },
    { id: 'stats' as const, label: l('Statistics', 'Takwimu'), icon: Activity },
  ];

  return (
    <div className="px-4 py-4 space-y-5">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#065F46] dark:text-[#34D399]">{l('Fraud Detection Center', 'Kituo cha Ugunduzi wa Dhuluma')}</h1>
          <p className="text-sm text-[#64748B] mt-1">{l('Monitor and manage fraud alerts, risk scores, and detection rules', 'Fuatilia na udhibiti tahadhari za dhuluma, alama za hatari, na kanusu')}</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="px-3 py-1 rounded-full bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 text-xs font-bold">{stats.critical} {l('Critical', 'Hatarishi')}</span>
          <span className="px-3 py-1 rounded-full bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 text-xs font-bold">{stats.pending} {l('Pending', 'Inasubiri')}</span>
        </div>
      </motion.div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: l('Total Alerts', 'Jumla'), value: stats.total, icon: AlertTriangle, color: '#64748B' },
          { label: l('Pending', 'Inasubiri'), value: stats.pending, icon: Clock, color: '#F59E0B' },
          { label: l('Critical', 'Hatarishi'), value: stats.critical, icon: ShieldCheck, color: '#DC2626' },
          { label: l('Resolved', 'Imetatuliwa'), value: stats.resolved, icon: CheckCircle, color: '#065F46' },
        ].map((s, i) => (
          <motion.div key={s.label} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }} className="kcard p-4">
            <div className="flex items-center gap-2 mb-2">
              <s.icon className="w-4 h-4" style={{ color: s.color }} />
              <span className="text-xs text-[#64748B]">{s.label}</span>
            </div>
            <p className="text-2xl font-bold" style={{ color: s.color }}>{s.value}</p>
          </motion.div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 p-1 bg-[#F1F5F9] dark:bg-[#1E293B] rounded-xl">
        {tabs.map(tab => (
          <button key={tab.id} onClick={() => setSelectedTab(tab.id)} className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold transition-all ${selectedTab === tab.id ? 'bg-white dark:bg-[#0F172A] shadow-sm text-[#065F46] dark:text-[#34D399]' : 'text-[#64748B] hover:text-[#0F172A] dark:hover:text-[#E7E5E4]'}`}>
            <tab.icon className="w-3.5 h-3.5" />
            {tab.label}
            {tab.count !== undefined && <span className="px-1.5 py-0.5 rounded-full bg-[#065F46] text-white text-[10px]">{tab.count}</span>}
          </button>
        ))}
      </div>

      {/* Alerts Tab */}
      {selectedTab === 'alerts' && (
        <div className="space-y-4">
          {/* Filters */}
          <div className="flex flex-wrap gap-2">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#64748B]" />
              <input value={searchQuery} onChange={e => setSearchQuery(e.target.value)} placeholder={l('Search alerts...', 'Tafuta tahadhari...')} className="w-full pl-10 pr-4 py-2 rounded-xl border border-[#E2E8F0] dark:border-[#334155] bg-white dark:bg-[#1E293B] text-sm focus:ring-2 focus:ring-[#065F46] focus:border-[#065F46] outline-none" />
            </div>
            <select value={severityFilter} onChange={e => setSeverityFilter(e.target.value as Severity | 'all')} className="px-3 py-2 rounded-xl border border-[#E2E8F0] dark:border-[#334155] bg-white dark:bg-[#1E293B] text-sm">
              <option value="all">{l('All Severity', 'Uhakika Wote')}</option>
              <option value="critical">{l('Critical', 'Hatarishi')}</option>
              <option value="high">{l('High', 'Juu')}</option>
              <option value="medium">{l('Medium', 'Kati')}</option>
              <option value="low">{l('Low', 'Chini')}</option>
            </select>
            <select value={statusFilter} onChange={e => setStatusFilter(e.target.value as AlertStatus | 'all')} className="px-3 py-2 rounded-xl border border-[#E2E8F0] dark:border-[#334155] bg-white dark:bg-[#1E293B] text-sm">
              <option value="all">{l('All Status', 'Hali Yote')}</option>
              <option value="pending">{l('Pending', 'Inasubiri')}</option>
              <option value="investigating">{l('Investigating', 'Inachunguza')}</option>
              <option value="resolved">{l('Resolved', 'Imetatuliwa')}</option>
              <option value="dismissed">{l('Dismissed', 'Imepuuzwa')}</option>
            </select>
          </div>

          {/* Alert List */}
          <div className="space-y-3">
            <AnimatePresence>
              {filteredAlerts.map((alert, i) => (
                <motion.div key={alert.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, height: 0 }} transition={{ delay: i * 0.03 }} className={`kcard border-l-4 ${SEVERITY_BG[alert.severity]} cursor-pointer hover:shadow-md transition-shadow`} style={{ borderLeftColor: SEVERITY_COLORS[alert.severity] }} onClick={() => setSelectedAlert(alert)}>
                  <div className="p-4">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <AlertTriangle className="w-4 h-4" style={{ color: SEVERITY_COLORS[alert.severity] }} />
                        <span className="font-semibold text-sm">{alert.type}</span>
                        <span className="px-1.5 py-0.5 rounded text-[10px] font-bold uppercase" style={{ color: SEVERITY_COLORS[alert.severity], backgroundColor: `${SEVERITY_COLORS[alert.severity]}15` }}>{alert.severity}</span>
                      </div>
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${alert.status === 'pending' ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' : alert.status === 'investigating' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' : alert.status === 'resolved' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400'}`}>{alert.status}</span>
                    </div>
                    <div className="flex items-center gap-3 text-xs text-[#64748B] mb-2">
                      <span className="flex items-center gap-1"><User className="w-3 h-3" />{alert.entity}</span>
                      <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{alert.date}</span>
                      <span className="flex items-center gap-1 font-medium" style={{ color: SEVERITY_COLORS[alert.severity] }}>{alert.confidence}% {l('confidence', 'uhakika')}</span>
                    </div>
                    <p className="text-xs text-[#64748B] mb-3 line-clamp-2">{alert.details}</p>
                    <div className="flex gap-2" onClick={e => e.stopPropagation()}>
                      {alert.status === 'pending' && (
                        <>
                          <button onClick={() => handleAlertAction(alert.id, 'investigate')} className="kbtn text-xs py-1.5 px-3 flex items-center gap-1"><Eye className="w-3 h-3" />{l('Investigate', 'Chunguza')}</button>
                          <button onClick={() => handleAlertAction(alert.id, 'dismiss')} className="kbtn-outline text-xs py-1.5 px-3">{l('Dismiss', 'Puuzia')}</button>
                        </>
                      )}
                      {alert.status === 'investigating' && (
                        <>
                          <button onClick={() => handleAlertAction(alert.id, 'suspend')} className="text-xs py-1.5 px-3 rounded-lg bg-amber-500 text-white font-medium flex items-center gap-1"><Ban className="w-3 h-3" />{l('Suspend User', 'Simama Mtumiaji')}</button>
                          <button onClick={() => handleAlertAction(alert.id, 'ban')} className="text-xs py-1.5 px-3 rounded-lg bg-red-500 text-white font-medium flex items-center gap-1"><XCircle className="w-3 h-3" />{l('Ban User', 'Marufuku Mtumiaji')}</button>
                          <button onClick={() => handleAlertAction(alert.id, 'resolve')} className="kbtn-outline text-xs py-1.5 px-3 flex items-center gap-1"><CheckCircle className="w-3 h-3" />{l('Resolve', 'Tatua')}</button>
                        </>
                      )}
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
            {filteredAlerts.length === 0 && (
              <div className="kcard p-8 text-center">
                <ShieldCheck className="w-12 h-12 text-[#34D399] mx-auto mb-3" />
                <p className="text-sm text-[#64748B]">{l('No alerts match your filters', 'Hakuna tahadhari zinazolingana na vichujio vyako')}</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Risk Scores Tab */}
      {selectedTab === 'risk' && (
        <div className="space-y-3">
          <p className="text-sm text-[#64748B]">{l('Users with highest fraud risk scores. Auto-suspend triggers at score 90+.', 'Watumiaji wenye alama za juu za hatari. Kusimama kiotomatiki huanzia alama 90+.')}</p>
          {RISK_USERS.sort((a, b) => b.score - a.score).map((user, i) => (
            <motion.div key={user.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }} className="kcard p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${user.score > 80 ? 'bg-red-100 dark:bg-red-900/30' : user.score > 60 ? 'bg-amber-100 dark:bg-amber-900/30' : 'bg-slate-100 dark:bg-slate-800'}`}>
                    <User className={`w-5 h-5 ${user.score > 80 ? 'text-red-500' : user.score > 60 ? 'text-amber-500' : 'text-slate-500'}`} />
                  </div>
                  <div>
                    <p className="font-semibold text-sm">{user.name}</p>
                    <p className="text-xs text-[#64748B]">{user.id} · {user.role}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-1">
                    <TrendingUp className={`w-3 h-3 ${user.trend === 'up' ? 'text-red-500' : user.trend === 'down' ? 'text-green-500' : 'text-slate-400'}`} />
                    <span className="text-xs text-[#64748B]">{user.trend === 'up' ? '↑' : user.trend === 'down' ? '↓' : '→'}</span>
                  </div>
                  <div className="w-24">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-bold" style={{ color: user.score > 80 ? '#DC2626' : user.score > 60 ? '#F59E0B' : '#64748B' }}>{user.score}</span>
                    </div>
                    <div className="h-2 rounded-full bg-[#E2E8F0] dark:bg-[#334155] overflow-hidden">
                      <div className="h-full rounded-full transition-all duration-500" style={{ width: `${user.score}%`, backgroundColor: user.score > 80 ? '#DC2626' : user.score > 60 ? '#F59E0B' : '#64748B' }} />
                    </div>
                  </div>
                  {user.score > 80 && <span className="px-2 py-0.5 rounded-full bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 text-[10px] font-bold">{l('AUTO-SUSPEND', 'SIMAMA-KIOTOMATIKI')}</span>}
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Detection Rules Tab */}
      {selectedTab === 'rules' && (
        <div className="space-y-3">
          <p className="text-sm text-[#64748B]">{l('Configure automated fraud detection rules. AI-powered anomaly detection runs continuously.', 'Sanidi kanusu za ugunduzi wa dhuluma wa kiotomatiki. Ugunduzi wa anomalies unaendeshwa kiotomatiki.')}</p>
          {DETECTION_RULES.map((rule, i) => (
            <motion.div key={rule.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }} className="kcard p-4">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <ShieldCheck className={`w-4 h-4 ${rule.enabled ? 'text-[#065F46]' : 'text-[#94A3B8]'}`} />
                    <span className="font-semibold text-sm">{rule.name}</span>
                    <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-[#64748B]">{rule.alerts} {l('alerts', 'tahadhari')}</span>
                  </div>
                  <p className="text-xs text-[#64748B]">{rule.description}</p>
                </div>
                <div className={`w-12 h-6 rounded-full p-0.5 transition-colors cursor-pointer ${rule.enabled ? 'bg-[#065F46]' : 'bg-[#CBD5E1] dark:bg-[#475569]'}`}>
                  <div className={`w-5 h-5 rounded-full bg-white shadow-sm transition-transform ${rule.enabled ? 'translate-x-6' : 'translate-x-0'}`} />
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Statistics Tab */}
      {selectedTab === 'stats' && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="kcard p-4">
              <div className="flex items-center gap-2 mb-3">
                <AlertTriangle className="w-4 h-4 text-[#F59E0B]" />
                <span className="text-xs font-semibold text-[#64748B]">{l('Alerts by Severity', 'Tahadhari kwa Ukali')}</span>
              </div>
              {(['critical', 'high', 'medium', 'low'] as Severity[]).map(sev => {
                const count = alerts.filter(a => a.severity === sev).length;
                const max = alerts.length;
                return (
                  <div key={sev} className="flex items-center gap-2 mb-2">
                    <span className="text-xs w-16 capitalize" style={{ color: SEVERITY_COLORS[sev] }}>{sev}</span>
                    <div className="flex-1 h-3 rounded-full bg-[#E2E8F0] dark:bg-[#334155] overflow-hidden">
                      <div className="h-full rounded-full" style={{ width: `${(count / max) * 100}%`, backgroundColor: SEVERITY_COLORS[sev] }} />
                    </div>
                    <span className="text-xs font-bold w-6 text-right">{count}</span>
                  </div>
                );
              })}
            </motion.div>
            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="kcard p-4">
              <div className="flex items-center gap-2 mb-3">
                <Activity className="w-4 h-4 text-[#065F46]" />
                <span className="text-xs font-semibold text-[#64748B]">{l('Alerts by Type', 'Tahadhari kwa Aina')}</span>
              </div>
              {['Rating Manipulation', 'Multi-Account', 'No-Show Pattern', 'Payment Anomaly'].map(type => {
                const count = alerts.filter(a => a.type === type).length;
                return (
                  <div key={type} className="flex items-center justify-between mb-2">
                    <span className="text-xs text-[#64748B]">{type}</span>
                    <span className="text-xs font-bold text-[#0F172A] dark:text-[#F1F5F9]">{count}</span>
                  </div>
                );
              })}
            </motion.div>
          </div>
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="kcard p-4">
            <div className="flex items-center gap-2 mb-3">
              <BarChart3 className="w-4 h-4 text-[#065F46]" />
              <span className="text-xs font-semibold text-[#64748B]">{l('Resolution Performance', 'Utendaji wa Kutatua')}</span>
            </div>
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <p className="text-2xl font-bold text-[#065F46]">{stats.resolved}</p>
                <p className="text-xs text-[#64748B]">{l('Resolved', 'Imetatuliwa')}</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-[#F59E0B]">4.2h</p>
                <p className="text-xs text-[#64748B]">{l('Avg Resolution', 'Wastani wa Kutatua')}</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-[#34D399]">89%</p>
                <p className="text-xs text-[#64748B]">{l('Accuracy', 'Usahihi')}</p>
              </div>
            </div>
          </motion.div>
        </div>
      )}

      {/* Alert Detail Modal */}
      <AnimatePresence>
        {selectedAlert && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 p-4" onClick={() => setSelectedAlert(null)}>
            <motion.div initial={{ y: 100, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 100, opacity: 0 }} className="bg-white dark:bg-[#0F172A] rounded-2xl shadow-2xl w-full max-w-lg max-h-[80vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
              <div className="p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-bold">{selectedAlert.type}</h2>
                  <button onClick={() => setSelectedAlert(null)} className="w-8 h-8 rounded-full hover:bg-[#F1F5F9] dark:hover:bg-[#1E293B] flex items-center justify-center">✕</button>
                </div>
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase" style={{ color: SEVERITY_COLORS[selectedAlert.severity], backgroundColor: `${SEVERITY_COLORS[selectedAlert.severity]}15` }}>{selectedAlert.severity}</span>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${selectedAlert.status === 'pending' ? 'bg-amber-100 text-amber-700' : selectedAlert.status === 'investigating' ? 'bg-blue-100 text-blue-700' : 'bg-green-100 text-green-700'}`}>{selectedAlert.status}</span>
                </div>
                <div className="space-y-2 text-sm">
                  <p><span className="text-[#64748B]">{l('Entity:', 'Chombo:')}</span> <span className="font-medium">{selectedAlert.entity}</span></p>
                  <p><span className="text-[#64748B]">{l('Rule:', 'Kanusu:')}</span> <span className="font-medium">{selectedAlert.rule}</span></p>
                  <p><span className="text-[#64748B]">{l('Confidence:', 'Uhakika:')}</span> <span className="font-bold" style={{ color: SEVERITY_COLORS[selectedAlert.severity] }}>{selectedAlert.confidence}%</span></p>
                  <p><span className="text-[#64748B]">{l('Detected:', 'Iligunduliwa:')}</span> {selectedAlert.date}</p>
                </div>
                <div className="bg-[#F8FAFC] dark:bg-[#1E293B] rounded-xl p-4">
                  <p className="text-sm text-[#64748B]">{l('Details', 'Maelezo')}</p>
                  <p className="text-sm mt-1">{selectedAlert.details}</p>
                </div>
                <div className="flex gap-2 pt-2">
                  {selectedAlert.status === 'pending' && (
                    <>
                      <button onClick={() => handleAlertAction(selectedAlert.id, 'investigate')} className="kbtn flex-1 py-2 text-sm flex items-center justify-center gap-1"><Eye className="w-4 h-4" />{l('Investigate', 'Chunguza')}</button>
                      <button onClick={() => handleAlertAction(selectedAlert.id, 'dismiss')} className="kbtn-outline flex-1 py-2 text-sm">{l('Dismiss', 'Puuzia')}</button>
                    </>
                  )}
                  {selectedAlert.status === 'investigating' && (
                    <>
                      <button onClick={() => handleAlertAction(selectedAlert.id, 'suspend')} className="flex-1 py-2 text-sm rounded-lg bg-amber-500 text-white font-medium flex items-center justify-center gap-1"><Ban className="w-4 h-4" />{l('Suspend', 'Simama')}</button>
                      <button onClick={() => handleAlertAction(selectedAlert.id, 'ban')} className="flex-1 py-2 text-sm rounded-lg bg-red-500 text-white font-medium flex items-center justify-center gap-1"><XCircle className="w-4 h-4" />{l('Ban', 'Marufuku')}</button>
                      <button onClick={() => handleAlertAction(selectedAlert.id, 'resolve')} className="kbtn-outline flex-1 py-2 text-sm">{l('Resolve', 'Tatua')}</button>
                    </>
                  )}
                  {(selectedAlert.status === 'resolved' || selectedAlert.status === 'dismissed') && (
                    <div className="flex items-center gap-2 text-sm text-[#64748B]">
                      <CheckCircle className="w-4 h-4 text-[#065F46]" />
                      {l('This alert has been resolved', 'Tahadhari hii imetatuliwa')}
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

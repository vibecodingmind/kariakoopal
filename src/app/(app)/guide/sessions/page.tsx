'use client';
import { useState } from 'react';
import { useAuthStore } from '@/lib/stores/auth-store';
import { motion, AnimatePresence } from 'framer-motion';
import { Clock, MapPin, Star, ChevronRight, CheckCircle2, XCircle, Play, FileText, Camera, MessageSquare, Download, Timer, Navigation, Store, TrendingUp, Plus, X, Save } from 'lucide-react';

interface SessionNote {
  id: string;
  sessionId: string;
  text: string;
  timestamp: string;
  type: 'note' | 'milestone' | 'photo';
}

interface SessionMilestone {
  id: string;
  sessionId: string;
  type: 'meetup' | 'zone_change' | 'vendor_visit' | 'break' | 'end';
  label: string;
  timestamp: string;
  location?: string;
}

interface Session {
  id: string;
  seeker: string;
  seekerAvatar?: string;
  zone: string;
  time: string;
  status: 'upcoming' | 'active' | 'pending' | 'completed' | 'cancelled';
  amount: number;
  rating?: number;
  duration?: string;
  zonesVisited?: string[];
  vendorsMet?: number;
  notes?: SessionNote[];
  milestones?: SessionMilestone[];
  totalSpend?: number;
}

const SESSIONS: Session[] = [
  { id: 's1', seeker: 'James K.', zone: 'Electronics Zone', time: 'Today 2:00 PM', status: 'upcoming', amount: 35000 },
  { id: 's2', seeker: 'Amina S.', zone: 'Fabrics Zone', time: 'Today 4:30 PM', status: 'upcoming', amount: 25000 },
  { id: 's3', seeker: 'David R.', zone: 'Wholesale Zone', time: 'Tomorrow 9:00 AM', status: 'pending', amount: 75000 },
  {
    id: 's4', seeker: 'Sarah M.', zone: 'Spices Zone', time: 'Yesterday', status: 'completed', amount: 15000, rating: 5,
    duration: '1h 45m', zonesVisited: ['Spices Zone', 'Food Court'], vendorsMet: 4,
    notes: [
      { id: 'n1', sessionId: 's4', text: 'Sarah is interested in wholesale saffron prices', timestamp: '2:15 PM', type: 'note' },
      { id: 'n2', sessionId: 's4', text: 'Visited Mama Halima spice stall - good prices', timestamp: '2:30 PM', type: 'note' },
    ],
    milestones: [
      { id: 'm1', sessionId: 's4', type: 'meetup', label: 'Met at Kariakoo Main Gate', timestamp: '2:00 PM', location: 'Main Gate' },
      { id: 'm2', sessionId: 's4', type: 'zone_change', label: 'Entered Spices Zone', timestamp: '2:10 PM', location: 'Spices Zone' },
      { id: 'm3', sessionId: 's4', type: 'vendor_visit', label: 'Mama Halima Spice Stall', timestamp: '2:30 PM', location: 'Stall #42' },
      { id: 'm4', sessionId: 's4', type: 'vendor_visit', label: 'Zanzibar Spice Market', timestamp: '3:00 PM', location: 'Stall #55' },
      { id: 'm5', sessionId: 's4', type: 'zone_change', label: 'Moved to Food Court', timestamp: '3:20 PM', location: 'Food Court' },
      { id: 'm6', sessionId: 's4', type: 'end', label: 'Session completed', timestamp: '3:45 PM' },
    ],
    totalSpend: 45000,
  },
  {
    id: 's5', seeker: 'Ahmed T.', zone: 'Fabrics Zone', time: '2 days ago', status: 'completed', amount: 25000, rating: 4,
    duration: '2h 10m', zonesVisited: ['Fabrics Zone', 'Electronics Zone'], vendorsMet: 6,
    notes: [
      { id: 'n3', sessionId: 's5', text: 'Ahmed needs kente fabric for wedding - 20 yards', timestamp: '10:05 AM', type: 'note' },
    ],
    milestones: [
      { id: 'm7', sessionId: 's5', type: 'meetup', label: 'Met at Bus Stand', timestamp: '10:00 AM', location: 'Kariakoo Bus Stand' },
      { id: 'm8', sessionId: 's5', type: 'zone_change', label: 'Entered Fabrics Zone', timestamp: '10:10 AM', location: 'Fabrics Zone' },
      { id: 'm9', sessionId: 's5', type: 'vendor_visit', label: 'Al-Hajj Fabrics', timestamp: '10:25 AM', location: 'Stall #12' },
      { id: 'm10', sessionId: 's5', type: 'end', label: 'Session completed', timestamp: '12:10 PM' },
    ],
    totalSpend: 185000,
  },
];

const MILESTONE_ICONS: Record<string, typeof MapPin> = {
  meetup: Navigation,
  zone_change: MapPin,
  vendor_visit: Store,
  break: Clock,
  end: CheckCircle2,
};

const MILESTONE_COLORS: Record<string, string> = {
  meetup: '#3B82F6',
  zone_change: '#8B5CF6',
  vendor_visit: '#065F46',
  break: '#F59E0B',
  end: '#10B981',
};

export default function GuideSessionsPage() {
  const { language } = useAuthStore();
  const sw = language === 'sw';
  const l = (en: string, swText: string) => (sw ? swText : en);

  const [selectedSession, setSelectedSession] = useState<Session | null>(null);
  const [activeTab, setActiveTab] = useState<'timeline' | 'notes' | 'summary'>('timeline');
  const [newNote, setNewNote] = useState('');

  const upcoming = SESSIONS.filter(s => s.status === 'upcoming');
  const pending = SESSIONS.filter(s => s.status === 'pending');
  const completed = SESSIONS.filter(s => s.status === 'completed');

  const addNote = () => {
    if (!newNote.trim() || !selectedSession) return;
    const note: SessionNote = {
      id: `n-${Date.now()}`,
      sessionId: selectedSession.id,
      text: newNote,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      type: 'note',
    };
    selectedSession.notes = [...(selectedSession.notes || []), note];
    setNewNote('');
  };

  return (
    <div className="px-4 py-4 space-y-5">
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-2xl font-bold text-[#065F46] dark:text-[#34D399]">{l('Sessions', 'Vipindi')}</h1>
        <p className="text-sm text-[#64748B] mt-1">{l('Manage your guide sessions, add notes, and track milestones', 'Dhibiti vipindi vyako, ongeza notisi, na fuatilia hatua muhimu')}</p>
      </motion.div>

      {/* Quick Stats */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: l('Today', 'Leo'), value: upcoming.length, color: '#065F46' },
          { label: l('This Week', 'Wiki Hii'), value: completed.length, color: '#F59E0B' },
          { label: l('Earnings', 'Mapato'), value: `TZS ${(completed.reduce((a, s) => a + s.amount, 0)).toLocaleString()}`, color: '#065F46' },
        ].map((s, i) => (
          <motion.div key={s.label} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }} className="kcard p-3 text-center">
            <p className="text-lg font-bold" style={{ color: s.color }}>{s.value}</p>
            <p className="text-[10px] text-[#64748B]">{s.label}</p>
          </motion.div>
        ))}
      </div>

      {/* Upcoming Sessions */}
      {upcoming.length > 0 && (
        <div>
          <h2 className="text-sm font-bold text-[#10B981] mb-2 flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-[#10B981] animate-pulse" />{l('Upcoming', 'Zinazokuja')}</h2>
          <div className="space-y-3">
            {upcoming.map(s => (
              <motion.div key={s.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="kcard-green p-4 cursor-pointer" onClick={() => setSelectedSession(s)}>
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-semibold text-white text-sm">{s.seeker}</h4>
                  <span className="text-sm font-bold text-[#F59E0B]">TZS {s.amount.toLocaleString()}</span>
                </div>
                <div className="flex items-center gap-3 text-xs text-white/60">
                  <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{s.zone}</span>
                  <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{s.time}</span>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {/* Pending Sessions */}
      {pending.length > 0 && (
        <div>
          <h2 className="text-sm font-bold text-[#F59E0B] mb-2">{l('Pending Approval', 'Zinasubiri Idhini')}</h2>
          <div className="space-y-3">
            {pending.map(s => (
              <motion.div key={s.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="kcard p-4">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-semibold text-sm">{s.seeker}</h4>
                  <span className="text-sm font-bold text-[#065F46]">TZS {s.amount.toLocaleString()}</span>
                </div>
                <div className="flex items-center gap-3 text-xs text-[#64748B] mb-3">
                  <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{s.zone}</span>
                  <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{s.time}</span>
                </div>
                <div className="flex gap-2">
                  <button className="kbtn flex-1 text-xs py-2 flex items-center justify-center gap-1"><CheckCircle2 className="w-3 h-3" />{l('Accept', 'Kubali')}</button>
                  <button className="kbtn-outline flex-1 text-xs py-2 flex items-center justify-center gap-1"><XCircle className="w-3 h-3" />{l('Decline', 'Kataa')}</button>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {/* Completed Sessions */}
      {completed.length > 0 && (
        <div>
          <h2 className="text-sm font-bold text-[#64748B] mb-2">{l('Completed', 'Zimekamilika')}</h2>
          <div className="space-y-3">
            {completed.map(s => (
              <motion.div key={s.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="kcard p-4 cursor-pointer hover:shadow-md transition-shadow" onClick={() => { setSelectedSession(s); setActiveTab('timeline'); }}>
                <div className="flex items-center justify-between mb-1">
                  <h4 className="font-semibold text-sm">{s.seeker}</h4>
                  <span className="text-sm font-bold">TZS {s.amount.toLocaleString()}</span>
                </div>
                <div className="flex items-center gap-3 text-xs text-[#64748B]">
                  <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{s.zone}</span>
                  <span>{s.time}</span>
                  {s.duration && <span className="flex items-center gap-1"><Timer className="w-3 h-3" />{s.duration}</span>}
                  {s.rating && <span className="flex items-center gap-0.5">{Array.from({ length: s.rating }).map((_, j) => <Star key={j} className="w-3 h-3 fill-[#F59E0B] text-[#F59E0B]" />)}</span>}
                </div>
                {(s.zonesVisited || s.vendorsMet) && (
                  <div className="flex items-center gap-3 mt-2 text-xs text-[#64748B]">
                    {s.zonesVisited && <span className="flex items-center gap-1"><Navigation className="w-3 h-3" />{s.zonesVisited.length} zones</span>}
                    {s.vendorsMet && <span className="flex items-center gap-1"><Store className="w-3 h-3" />{s.vendorsMet} vendors</span>}
                    {s.notes && s.notes.length > 0 && <span className="flex items-center gap-1"><FileText className="w-3 h-3" />{s.notes.length} notes</span>}
                  </div>
                )}
                <ChevronRight className="w-4 h-4 text-[#94A3B8] absolute right-4 top-1/2 -translate-y-1/2" />
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {/* Session Detail Modal */}
      <AnimatePresence>
        {selectedSession && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 p-4" onClick={() => setSelectedSession(null)}>
            <motion.div initial={{ y: 100, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 100, opacity: 0 }} className="bg-white dark:bg-[#0F172A] rounded-2xl shadow-2xl w-full max-w-lg max-h-[85vh] overflow-hidden flex flex-col" onClick={e => e.stopPropagation()}>
              {/* Header */}
              <div className="p-4 border-b border-[#E2E8F0] dark:border-[#334155]">
                <div className="flex items-center justify-between mb-2">
                  <h2 className="text-lg font-bold">{selectedSession.seeker}</h2>
                  <button onClick={() => setSelectedSession(null)} className="w-8 h-8 rounded-full hover:bg-[#F1F5F9] dark:hover:bg-[#1E293B] flex items-center justify-center"><X className="w-4 h-4" /></button>
                </div>
                <div className="flex items-center gap-3 text-xs text-[#64748B]">
                  <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{selectedSession.zone}</span>
                  <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{selectedSession.time}</span>
                  {selectedSession.duration && <span className="flex items-center gap-1"><Timer className="w-3 h-3" />{selectedSession.duration}</span>}
                  <span className="font-bold text-[#065F46]">TZS {selectedSession.amount.toLocaleString()}</span>
                </div>
              </div>

              {/* Tabs */}
              <div className="flex border-b border-[#E2E8F0] dark:border-[#334155]">
                {(['timeline', 'notes', 'summary'] as const).map(tab => (
                  <button key={tab} onClick={() => setActiveTab(tab)} className={`flex-1 py-2.5 text-xs font-semibold border-b-2 transition-colors ${activeTab === tab ? 'border-[#065F46] text-[#065F46] dark:text-[#34D399] dark:border-[#34D399]' : 'border-transparent text-[#64748B]'}`}>
                    {tab === 'timeline' ? l('Timeline', 'Muda') : tab === 'notes' ? l('Notes', 'Notisi') : l('Summary', 'Muhtasari')}
                  </button>
                ))}
              </div>

              {/* Content */}
              <div className="flex-1 overflow-y-auto p-4">
                {/* Timeline Tab */}
                {activeTab === 'timeline' && selectedSession.milestones && (
                  <div className="relative pl-6">
                    <div className="absolute left-2 top-2 bottom-2 w-0.5 bg-[#E2E8F0] dark:bg-[#334155]" />
                    {selectedSession.milestones.map((ms, i) => {
                      const Icon = MILESTONE_ICONS[ms.type] || MapPin;
                      const color = MILESTONE_COLORS[ms.type] || '#64748B';
                      return (
                        <motion.div key={ms.id} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.08 }} className="relative mb-4 last:mb-0">
                          <div className="absolute -left-4 top-0.5 w-4 h-4 rounded-full flex items-center justify-center" style={{ backgroundColor: color }}>
                            <Icon className="w-2.5 h-2.5 text-white" />
                          </div>
                          <div className="ml-2">
                            <p className="text-sm font-medium">{ms.label}</p>
                            <div className="flex items-center gap-2 text-xs text-[#64748B]">
                              <span>{ms.timestamp}</span>
                              {ms.location && <span>· {ms.location}</span>}
                            </div>
                          </div>
                        </motion.div>
                      );
                    })}
                  </div>
                )}
                {activeTab === 'timeline' && !selectedSession.milestones && (
                  <div className="text-center py-8">
                    <Timer className="w-12 h-12 text-[#94A3B8] mx-auto mb-3" />
                    <p className="text-sm text-[#64748B]">{l('No timeline data for this session', 'Hakuna data ya muda wa kipindi hiki')}</p>
                  </div>
                )}

                {/* Notes Tab */}
                {activeTab === 'notes' && (
                  <div className="space-y-3">
                    {selectedSession.notes && selectedSession.notes.map(note => (
                      <div key={note.id} className="bg-[#F8FAFC] dark:bg-[#1E293B] rounded-xl p-3">
                        <div className="flex items-center gap-2 mb-1">
                          <FileText className="w-3 h-3 text-[#065F46]" />
                          <span className="text-[10px] text-[#64748B]">{note.timestamp}</span>
                          <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-[#065F46]/10 text-[#065F46] dark:bg-[#34D399]/10 dark:text-[#34D399]">{note.type}</span>
                        </div>
                        <p className="text-sm">{note.text}</p>
                      </div>
                    ))}
                    {(!selectedSession.notes || selectedSession.notes.length === 0) && (
                      <p className="text-sm text-[#64748B] text-center py-4">{l('No notes yet', 'Hakuna notisi bado')}</p>
                    )}
                    {/* Add Note */}
                    <div className="flex gap-2">
                      <input value={newNote} onChange={e => setNewNote(e.target.value)} placeholder={l('Add a note...', 'Ongeza notisi...')} className="flex-1 px-3 py-2 rounded-xl border border-[#E2E8F0] dark:border-[#334155] bg-white dark:bg-[#1E293B] text-sm focus:ring-2 focus:ring-[#065F46] outline-none" onKeyDown={e => e.key === 'Enter' && addNote()} />
                      <button onClick={addNote} className="kbtn px-3 py-2"><Save className="w-4 h-4" /></button>
                    </div>
                  </div>
                )}

                {/* Summary Tab */}
                {activeTab === 'summary' && (
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-3">
                      {[
                        { label: l('Duration', 'Muda'), value: selectedSession.duration || 'N/A', icon: Timer, color: '#065F46' },
                        { label: l('Zones', 'Maeneo'), value: selectedSession.zonesVisited?.length || 0, icon: Navigation, color: '#8B5CF6' },
                        { label: l('Vendors', 'Wauzaji'), value: selectedSession.vendorsMet || 0, icon: Store, color: '#F59E0B' },
                        { label: l('Client Spent', 'Matumizi'), value: `TZS ${selectedSession.totalSpend?.toLocaleString() || '0'}`, icon: TrendingUp, color: '#065F46' },
                      ].map(s => (
                        <div key={s.label} className="kcard p-3">
                          <div className="flex items-center gap-2 mb-1">
                            <s.icon className="w-3 h-3" style={{ color: s.color }} />
                            <span className="text-[10px] text-[#64748B]">{s.label}</span>
                          </div>
                          <p className="text-lg font-bold" style={{ color: s.color }}>{s.value}</p>
                        </div>
                      ))}
                    </div>
                    {selectedSession.zonesVisited && (
                      <div>
                        <p className="text-xs font-semibold text-[#64748B] mb-2">{l('Zones Visited', 'Maeneo Aliyotembelea')}</p>
                        <div className="flex flex-wrap gap-2">
                          {selectedSession.zonesVisited.map(z => (
                            <span key={z} className="px-2.5 py-1 rounded-lg text-xs font-medium bg-[#065F46]/10 text-[#065F46] dark:bg-[#34D399]/10 dark:text-[#34D399]">{z}</span>
                          ))}
                        </div>
                      </div>
                    )}
                    {selectedSession.rating && (
                      <div className="kcard p-4 text-center">
                        <p className="text-xs text-[#64748B] mb-2">{l('Client Rating', 'Ukadiriaji wa Mteja')}</p>
                        <div className="flex items-center justify-center gap-1">
                          {Array.from({ length: 5 }).map((_, i) => (
                            <Star key={i} className={`w-6 h-6 ${i < selectedSession.rating! ? 'fill-[#F59E0B] text-[#F59E0B]' : 'text-[#E2E8F0] dark:text-[#334155]'}`} />
                          ))}
                        </div>
                      </div>
                    )}
                    <button className="kbtn w-full py-2 text-sm flex items-center justify-center gap-2">
                      <Download className="w-4 h-4" />{l('Export Session Report', 'Pakua Ripoti ya Kipindi')}
                    </button>
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

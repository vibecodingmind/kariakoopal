'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/lib/stores/auth-store';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Bell, Send, Users, UserCircle2, Compass, Eye,
  CheckCircle2, MessageSquare, Search, ArrowLeft,
} from 'lucide-react';

type Target = 'all' | 'seekers' | 'guides' | 'individual';

interface SentBroadcast {
  id: string;
  title: string;
  message: string;
  target: Target;
  sentAt: string;
  deliveredCount: number;
}

const SENT_BROADCASTS: SentBroadcast[] = [
  { id: 'b1', title: 'Holiday Schedule Update', message: 'Kariakoo market will have extended hours this weekend. All guides please update your availability.', target: 'guides', sentAt: '2 hours ago', deliveredCount: 108 },
  { id: 'b2', title: 'New Safety Guidelines', message: 'We have updated our safety protocols. Please review the new guidelines in your settings.', target: 'all', sentAt: '1 day ago', deliveredCount: 329 },
  { id: 'b3', title: 'Weekend Special Offers', message: 'Explore special deals this weekend! Use code WEEKEND20 for 20% off your next guided session.', target: 'seekers', sentAt: '3 days ago', deliveredCount: 218 },
  { id: 'b4', title: 'Payout Schedule Change', message: 'Monthly payouts will now be processed on the 5th instead of the 1st. Plan accordingly.', target: 'guides', sentAt: '5 days ago', deliveredCount: 106 },
  { id: 'b5', title: 'App Maintenance Notice', message: 'The platform will undergo maintenance on Saturday 2am-4am EAT. Services will be briefly unavailable.', target: 'all', sentAt: '1 week ago', deliveredCount: 341 },
  { id: 'b6', title: 'Welcome Bonus', message: 'New seekers get a 10% discount on their first guided session. Share the Kariakoo experience!', target: 'seekers', sentAt: '2 weeks ago', deliveredCount: 195 },
];

const MAX_CHARS = 200;

export default function AdminBroadcastPage() {
  const { user, language, isAuthenticated } = useAuthStore();
  const router = useRouter();
  const sw = language === 'sw';
  const l = (en: string, swText: string) => (sw ? swText : en);

  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [target, setTarget] = useState<Target>('all');
  const [searchUser, setSearchUser] = useState('');
  const [confirmStep, setConfirmStep] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [broadcasts, setBroadcasts] = useState(SENT_BROADCASTS);
  const [isSending, setIsSending] = useState(false);

  useEffect(() => {
    if (!isAuthenticated || user?.role !== 'admin') router.replace('/auth');
  }, [isAuthenticated, user, router]);

  if (!isAuthenticated) return null;

  const charCount = message.length;
  const isOverLimit = charCount > MAX_CHARS;
  const canSend = title.trim().length > 0 && message.trim().length > 0 && !isOverLimit;

  const targetLabel = (t: Target) => {
    const map: Record<Target, [string, string]> = {
      all: ['All Users', 'Watumiaji Wote'],
      seekers: ['Seekers Only', 'Watafuta Tu'],
      guides: ['Guides Only', 'Miongozo Tu'],
      individual: ['Individual', 'Binafsi'],
    };
    return sw ? map[t][1] : map[t][0];
  };

  const targetBadge = (t: Target) => {
    if (t === 'all') return 'kbadge-live';
    if (t === 'seekers') return 'kbadge-gold';
    if (t === 'guides') return 'kbadge-verified';
    return 'kbadge-silver';
  };

  const targetBorderColor = (t: Target) => {
    if (t === 'all') return 'border-l-[#059669]';
    if (t === 'seekers') return 'border-l-[#F59E0B]';
    if (t === 'guides') return 'border-l-[#0891B2]';
    return 'border-l-[#64748B]';
  };

  const targetIcon = (t: Target) => {
    if (t === 'all') return Users;
    if (t === 'seekers') return Compass;
    if (t === 'guides') return UserCircle2;
    return MessageSquare;
  };

  const handleSend = () => {
    if (!confirmStep) { setConfirmStep(true); return; }
    setIsSending(true);
    setTimeout(() => {
      const newBroadcast: SentBroadcast = {
        id: `b${broadcasts.length + 1}`, title, message, target,
        sentAt: l('Just now', 'Hivi sasa'),
        deliveredCount: target === 'all' ? 342 : target === 'seekers' ? 232 : target === 'guides' ? 110 : 1,
      };
      setBroadcasts([newBroadcast, ...broadcasts]);
      setTitle(''); setMessage(''); setTarget('all'); setSearchUser('');
      setConfirmStep(false); setIsSending(false); setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 2500);
    }, 1200);
  };

  const targets: { key: Target; icon: typeof Users; label: string; labelSw: string; count: string }[] = [
    { key: 'all', icon: Users, label: 'All Users', labelSw: 'Watumiaji Wote', count: '342' },
    { key: 'seekers', icon: Compass, label: 'Seekers Only', labelSw: 'Watafuta Tu', count: '232' },
    { key: 'guides', icon: UserCircle2, label: 'Guides Only', labelSw: 'Miongozo Tu', count: '110' },
    { key: 'individual', icon: MessageSquare, label: 'Individual', labelSw: 'Binafsi', count: '' },
  ];

  return (
    <div className="px-4 py-4 space-y-5 min-h-screen">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="flex items-center gap-3">
        <button onClick={() => router.push('/admin')} className="kbtn-ghost p-2 rounded-xl">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-2xl font-bold gradient-text-green">{l('Notification Broadcast', 'Utangazaji wa Arifa')}</h1>
          <p className="text-xs text-[#64748B] dark:text-[#94A3B8] mt-0.5">{l('Send notifications to users', 'Tuma arifa kwa watumiaji')}</p>
        </div>
      </motion.div>

      {/* Stats */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }} className="grid grid-cols-3 gap-3">
        {[
          { icon: Send, label: l('Total Sent', 'Jumla Iliyotumwa'), value: '284', color: '#065F46' },
          { icon: CheckCircle2, label: l('Delivered Rate', 'Kiwango cha Utoaji'), value: '96%', color: '#059669' },
          { icon: Bell, label: l('Last Sent', 'Iliyotumwa Mwisho'), value: l('2h ago', 'Masaa 2'), color: '#F59E0B' },
        ].map((s, i) => (
          <div key={i} className="kcard p-3 text-center">
            <s.icon className="w-4 h-4 mx-auto mb-1.5" style={{ color: s.color }} />
            <p className="text-lg font-bold">{s.value}</p>
            <p className="text-[9px] text-[#64748B] dark:text-[#94A3B8] leading-tight">{s.label}</p>
          </div>
        ))}
      </motion.div>

      {/* Compose */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="kcard p-4 space-y-4">
        <h2 className="font-semibold text-sm flex items-center gap-1.5">
          <Bell className="w-4 h-4 text-[#F59E0B]" />
          {l('Compose Notification', 'Tunga Arifa')}
        </h2>

        {/* Title */}
        <div>
          <label className="text-xs font-medium text-[#64748B] dark:text-[#94A3B8] mb-1 block">{l('Title', 'Kichwa')}</label>
          <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} placeholder={l('Enter notification title...', 'Weka kichwa cha arifa...')} className="kinput w-full" maxLength={80} />
        </div>

        {/* Message + Char Counter */}
        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="text-xs font-medium text-[#64748B] dark:text-[#94A3B8]">{l('Message', 'Ujumbe')}</label>
            <span className={`text-[10px] font-bold ${isOverLimit ? 'text-[#DC2626]' : charCount > MAX_CHARS * 0.8 ? 'text-[#F59E0B]' : 'text-[#64748B]'}`}>{charCount}/{MAX_CHARS}</span>
          </div>
          <textarea value={message} onChange={(e) => setMessage(e.target.value)} placeholder={l('Write your notification message...', 'Andika ujumbe wako wa arifa...')} className="kinput w-full h-20 resize-none" maxLength={MAX_CHARS + 20} />
          <div className="mt-1 h-1 bg-[#F1F5F9] dark:bg-[#334155] rounded-full overflow-hidden">
            <div className="h-full rounded-full transition-all duration-300" style={{ width: `${Math.min((charCount / MAX_CHARS) * 100, 100)}%`, background: isOverLimit ? '#DC2626' : charCount > MAX_CHARS * 0.8 ? '#F59E0B' : 'linear-gradient(90deg, #065F46, #059669)' }} />
          </div>
        </div>

        {/* Target Selector */}
        <div>
          <label className="text-xs font-medium text-[#64748B] dark:text-[#94A3B8] mb-2 block">{l('Target Audience', 'Walengwa')}</label>
          <div className="grid grid-cols-2 gap-2">
            {targets.map((t) => (
              <button key={t.key} onClick={() => setTarget(t.key)} className={`kcard p-2.5 text-left transition-all ${target === t.key ? 'border-[#065F46] dark:border-[#34D399] shadow-md' : ''}`}>
                <div className="flex items-center gap-2">
                  <div className={`w-7 h-7 rounded-full flex items-center justify-center ${target === t.key ? 'bg-[#065F46] dark:bg-[#34D399]' : 'bg-[#F1F5F9] dark:bg-[#334155]'}`}>
                    <t.icon className={`w-3.5 h-3.5 ${target === t.key ? 'text-white' : 'text-[#64748B]'}`} />
                  </div>
                  <div>
                    <span className={`text-xs font-semibold block ${target === t.key ? 'text-[#065F46] dark:text-[#34D399]' : ''}`}>{sw ? t.labelSw : t.label}</span>
                    {t.count && <span className="text-[9px] text-[#64748B] dark:text-[#94A3B8]">{t.count} {l('users', 'watumiaji')}</span>}
                  </div>
                </div>
              </button>
            ))}
          </div>
          {target === 'individual' && (
            <div className="ksearch flex items-center gap-2 px-3 py-2.5 mt-2">
              <Search className="w-3.5 h-3.5 text-[#64748B] shrink-0" />
              <input type="text" value={searchUser} onChange={(e) => setSearchUser(e.target.value)} placeholder={l('Search user by name or phone...', 'Tafuta kwa jina au simu...')} className="flex-1 bg-transparent outline-none text-xs placeholder:text-[#94A3B8]" />
            </div>
          )}
        </div>

        {/* Live Preview */}
        {(title || message) && (
          <div className="rounded-xl overflow-hidden">
            <div className="kcard-green p-3.5">
              <div className="flex items-center gap-2 mb-2">
                <Bell className="w-4 h-4 text-[#FBBF24]" />
                <span className="text-xs font-bold text-white">{l('Preview', 'Hakiki')}</span>
              </div>
              <div className="bg-white/10 rounded-lg p-3 backdrop-blur-sm">
                <p className="text-sm font-bold text-white">{title || l('Notification title', 'Kichwa cha arifa')}</p>
                <p className="text-xs text-white/70 mt-1 leading-relaxed">{message || l('Your message will appear here...', 'Ujumbe wako utaonekana hapa...')}</p>
                <div className="flex items-center gap-2 mt-2">
                  <span className={`kbadge ${targetBadge(target)}`}>{targetLabel(target)}</span>
                  <span className="text-[9px] text-white/40">{l('Just now', 'Hivi sasa')}</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-2">
          <button disabled={!canSend} className="kbtn-outline flex-1 text-xs py-2.5 flex items-center justify-center gap-1.5 disabled:opacity-40">
            <Eye className="w-3.5 h-3.5" />{l('Preview', 'Hakiki')}
          </button>
          <button onClick={handleSend} disabled={!canSend || isSending} className={`${confirmStep ? 'bg-gradient-to-r from-[#DC2626] to-[#B91C1C]' : ''} kbtn-yellow flex-1 text-xs py-2.5 flex items-center justify-center gap-1.5 disabled:opacity-40`}>
            {isSending ? (
              <><div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />{l('Sending...', 'Inatuma...')}</>
            ) : confirmStep ? (
              <><Send className="w-3.5 h-3.5" />{l('Confirm Send?', 'Thibitisha?')}</>
            ) : (
              <><Send className="w-3.5 h-3.5" />{l('Send Now', 'Tuma Sasa')}</>
            )}
          </button>
        </div>
        {confirmStep && (
          <button onClick={() => setConfirmStep(false)} className="w-full text-xs text-[#64748B] dark:text-[#94A3B8] py-1 hover:underline">
            {l('Cancel', 'Ghairi')}
          </button>
        )}
      </motion.div>

      {/* Success Toast */}
      <AnimatePresence>
        {showSuccess && (
          <motion.div initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 40 }} className="fixed bottom-24 left-4 right-4 z-50 flex justify-center">
            <div className="kcard-green px-5 py-3 flex items-center gap-2 shadow-lg">
              <CheckCircle2 className="w-5 h-5 text-[#FBBF24]" />
              <span className="text-sm font-bold text-white">{l('Broadcast sent successfully!', 'Arifa imetumwa kikamilifu!')}</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Sent Broadcasts */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
        <h2 className="text-sm font-bold mb-3 flex items-center gap-1.5">
          <Bell className="w-4 h-4 text-[#065F46] dark:text-[#34D399]" />
          {l('Recent Broadcasts', 'Matangazo ya Hivi Karibu')}
        </h2>
        <div className="space-y-2 max-h-96 overflow-y-auto">
          {broadcasts.map((b, i) => {
            const Icon = targetIcon(b.target);
            return (
              <motion.div key={b.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }} className={`kcard p-3 border-l-4 ${targetBorderColor(b.target)}`}>
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg bg-[#ECFDF5] dark:bg-[#064E3B] flex items-center justify-center shrink-0">
                    <Bell className="w-3.5 h-3.5 text-[#059669]" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h4 className="text-xs font-semibold truncate">{b.title}</h4>
                      <span className={`kbadge ${targetBadge(b.target)}`}><Icon className="w-2.5 h-2.5" />{targetLabel(b.target)}</span>
                    </div>
                    <p className="text-[10px] text-[#64748B] dark:text-[#94A3B8] mt-0.5 line-clamp-1">{b.message}</p>
                    <div className="flex items-center gap-3 mt-1 text-[10px] text-[#64748B] dark:text-[#94A3B8]">
                      <span>{b.sentAt}</span>
                      <span className="flex items-center gap-0.5 text-[#059669]"><CheckCircle2 className="w-3 h-3" />{b.deliveredCount} {l('delivered', 'waliyopokea')}</span>
                    </div>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      </motion.div>
    </div>
  );
}

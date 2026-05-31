'use client';
import { useAuthStore } from '@/lib/stores/auth-store';
import { useRouter } from 'next/navigation';
import { ArrowLeft, MapPin, Star, Clock, MessageSquare, ShieldCheck, Phone, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { useState } from 'react';

export default function SessionPage() {
  const { language } = useAuthStore();
  const router = useRouter();
  const sw = language === 'sw';
  const l = (en: string, swText: string) => (sw ? swText : en);
  const [message, setMessage] = useState('');
  const [chatMessages, setChatMessages] = useState([
    { id: '1', sender: 'guide', text: 'Karibu! I\'m at the main entrance of the Fabrics Zone. Where are you?', time: '10:05 AM' },
    { id: '2', sender: 'seeker', text: 'I\'m near Stall B-10. I can see the blue sign.', time: '10:07 AM' },
    { id: '3', sender: 'guide', text: 'Perfect! Walk towards the big yellow umbrella — I\'m right there. I have a green vest on.', time: '10:08 AM' },
  ]);

  return (
    <div className="px-4 py-4 space-y-4">
      <motion.div initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }}>
        <button onClick={() => router.back()} className="flex items-center gap-1 text-sm text-[#64748B] hover:text-[#0A4D3A]">
          <ArrowLeft className="w-4 h-4" /> {l('Back', 'Rudi')}
        </button>
      </motion.div>

      {/* Session Header */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="kcard-green p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-[#10B981] animate-pulse-dot" /><span className="text-xs text-white font-medium">{l('LIVE SESSION', 'KIPINDI CHA MOJA KWA MOJA')}</span></div>
          <span className="kbadge kbadge-live">{l('ACTIVE', 'INAENDA')}</span>
        </div>
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-full bg-[#F59E0B] flex items-center justify-center text-[#065F46] font-bold">MJ</div>
          <div>
            <p className="text-white font-bold">Mwanaildi Juma</p>
            <p className="text-white/60 text-xs flex items-center gap-2">
              <span className="flex items-center gap-0.5"><Star className="w-3 h-3 fill-[#F59E0B] text-[#F59E0B]" />4.8</span>
              <span className="flex items-center gap-0.5"><MapPin className="w-3 h-3" />{l('Fabrics Zone', 'Eneo la Vitenge')}</span>
              <span className="flex items-center gap-0.5"><Clock className="w-3 h-3" />1h 23m</span>
            </p>
          </div>
        </div>
        <div className="mt-3 p-2 rounded-lg bg-white/10 flex items-center justify-between">
          <span className="text-xs text-white/60">{l('Escrow:', 'Escrow:')} TZS 25,000</span>
          <span className="kbadge kbadge-gold text-[8px]">{l('HELD', 'IMEHIFADHIWA')}</span>
        </div>
      </motion.div>

      {/* Chat */}
      <div className="kcard p-4">
        <h3 className="font-semibold text-sm mb-3 flex items-center gap-1"><MessageSquare className="w-4 h-4 text-[#065F46]" />{l('Chat', 'Mazungumzo')}</h3>
        <div className="space-y-3 max-h-64 overflow-y-auto mb-3">
          {chatMessages.map(msg => (
            <div key={msg.id} className={`flex ${msg.sender === 'seeker' ? 'justify-end' : 'justify-start'}`}>
              <div className={msg.sender === 'seeker' ? 'kchat-seeker' : 'kchat-guide'}>
                <p className="text-sm">{msg.text}</p>
                <p className="text-[10px] mt-1 opacity-60">{msg.time}</p>
              </div>
            </div>
          ))}
        </div>
        <div className="flex gap-2">
          <input type="text" value={message} onChange={e => setMessage(e.target.value)} placeholder={l('Type a message...', 'Andika ujumbe...')} className="kinput flex-1" onKeyDown={e => { if (e.key === 'Enter' && message.trim()) { setChatMessages(prev => [...prev, { id: Date.now().toString(), sender: 'seeker', text: message, time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) }]); setMessage(''); } }} />
          <button onClick={() => { if (message.trim()) { setChatMessages(prev => [...prev, { id: Date.now().toString(), sender: 'seeker', text: message, time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) }]); setMessage(''); } }} className="kbtn px-3"><MessageSquare className="w-4 h-4" /></button>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-3 gap-2">
        <button className="kcard p-3 text-center"><Phone className="w-5 h-5 text-[#065F46] mx-auto mb-1" /><span className="text-[10px] font-medium">{l('Call', 'Piga')}</span></button>
        <button className="kcard p-3 text-center"><AlertTriangle className="w-5 h-5 text-[#DC2626] mx-auto mb-1" /><span className="text-[10px] font-medium">{l('Emergency', 'Dharura')}</span></button>
        <button className="kcard p-3 text-center"><CheckCircle2 className="w-5 h-5 text-[#10B981] mx-auto mb-1" /><span className="text-[10px] font-medium">{l('Complete', 'Kamilisha')}</span></button>
      </div>
    </div>
  );
}

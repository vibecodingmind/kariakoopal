'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/lib/stores/auth-store';
import { Clock, MapPin, Save, CalendarDays, Zap, Scissors, Package, Flower2, ChefHat, Paintbrush } from 'lucide-react';
import { motion } from 'framer-motion';

const ZONES = [
  { id: 'electronics', name: 'Electronics', color: '#0891B2', icon: Zap },
  { id: 'fabrics', name: 'Fabrics', color: '#7C3AED', icon: Scissors },
  { id: 'wholesale', name: 'Wholesale', color: '#14B8A6', icon: Package },
  { id: 'spices', name: 'Spices', color: '#EF4444', icon: Flower2 },
  { id: 'kitchenware', name: 'Kitchenware', color: '#F59E0B', icon: ChefHat },
  { id: 'artisanal', name: 'Artisanal', color: '#8B5E3C', icon: Paintbrush },
];

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
const DAYS_SW = ['Jumatatu', 'Jumanne', 'Jumatano', 'Alhamisi', 'Ijumaa', 'Jumamosi', 'Jumapili'];
const TIME_SLOTS = Array.from({ length: 17 }, (_, i) => `${(i + 5).toString().padStart(2, '0')}:00`);

const DEFAULT_SCHEDULE = [
  { day: 0, available: true, start: '08:00', end: '18:00' },
  { day: 1, available: true, start: '08:00', end: '18:00' },
  { day: 2, available: true, start: '08:00', end: '18:00' },
  { day: 3, available: true, start: '08:00', end: '18:00' },
  { day: 4, available: true, start: '08:00', end: '18:00' },
  { day: 5, available: true, start: '09:00', end: '16:00' },
  { day: 6, available: false, start: '09:00', end: '14:00' },
];

export default function AvailabilityPage() {
  const { user, isAuthenticated, language } = useAuthStore();
  const router = useRouter();
  const sw = language === 'sw';
  const [isOnline, setIsOnline] = useState(true);
  const [schedule, setSchedule] = useState(DEFAULT_SCHEDULE);
  const [selectedZones, setSelectedZones] = useState(['fabrics', 'wholesale', 'kitchenware']);
  const [maxSessions, setMaxSessions] = useState(2);
  const [breakTime, setBreakTime] = useState('30');
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (!isAuthenticated || user?.role !== 'guide') router.replace('/auth');
  }, [isAuthenticated, user, router]);

  const l = (en: string, swText: string) => (sw ? swText : en);

  const toggleDay = (dayIdx: number) => {
    setSchedule(prev => prev.map((s, i) => i === dayIdx ? { ...s, available: !s.available } : s));
  };

  const updateTime = (dayIdx: number, field: 'start' | 'end', value: string) => {
    setSchedule(prev => prev.map((s, i) => i === dayIdx ? { ...s, [field]: value } : s));
  };

  const toggleZone = (zoneId: string) => {
    setSelectedZones(prev => prev.includes(zoneId) ? prev.filter(z => z !== zoneId) : [...prev, zoneId]);
  };

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="px-4 py-4 space-y-5 pb-24">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#ECFDF5] dark:bg-[#064E3B] flex items-center justify-center">
            <Clock className="w-5 h-5 text-[#065F46] dark:text-[#34D399]" />
          </div>
          <div>
            <h1 className="text-xl font-black text-[#0F172A] dark:text-[#F1F5F9]">{l('Availability', 'Upatikanaji')}</h1>
            <p className="text-xs text-[#64748B] dark:text-[#94A3B8]">{l('Set your working hours', 'Weka masaa yako ya kazi')}</p>
          </div>
        </div>
      </div>

      {/* Online/Offline Toggle */}
      <div className={`kcard p-4 flex items-center justify-between ${isOnline ? 'border-[#065F46]/20 dark:border-[#34D399]/20' : ''}`}>
        <div className="flex items-center gap-3">
          <div className={`w-12 h-12 rounded-xl flex items-center justify-center transition-colors ${isOnline ? 'bg-[#ECFDF5] dark:bg-[#064E3B]' : 'bg-[#F1F5F9] dark:bg-[#334155]'}`}>
            <div className={`w-5 h-5 rounded-full ${isOnline ? 'bg-[#10B981] animate-pulse-dot' : 'bg-[#94A3B8]'}`} />
          </div>
          <div>
            <p className="font-bold text-sm">{isOnline ? l('You are Online', 'Uko Mtandaoni') : l('You are Offline', 'Huko Mtandaoni')}</p>
            <p className="text-xs text-[#64748B]">{isOnline ? l('Accepting sessions', 'Unakubali vipindi') : l('Not accepting sessions', 'Hukubali vipindi')}</p>
          </div>
        </div>
        <button onClick={() => setIsOnline(!isOnline)}
          className={`ktoggle ${isOnline ? 'ktoggle-active' : ''}`}
        />
      </div>

      {/* Weekly Schedule */}
      <div>
        <h2 className="font-bold text-sm mb-3 flex items-center gap-2">
          <CalendarDays className="w-4 h-4 text-[#065F46] dark:text-[#34D399]" />
          {l('Weekly Schedule', 'Ratiba ya Wiki')}
        </h2>
        <div className="space-y-2">
          {schedule.map((day, idx) => (
            <motion.div key={idx} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: idx * 0.04 }}
              className={`kcard p-3 flex items-center gap-3 ${!day.available ? 'opacity-50' : ''}`}
            >
              <button onClick={() => toggleDay(idx)}
                className={`ktoggle ${day.available ? 'ktoggle-active' : ''} shrink-0`}
              />
              <span className="font-bold text-xs w-20 shrink-0">{sw ? DAYS_SW[idx] : DAYS[idx].slice(0, 3)}</span>
              <div className="flex items-center gap-2 flex-1">
                <select value={day.start} onChange={e => updateTime(idx, 'start', e.target.value)} disabled={!day.available}
                  className="kinput text-xs py-1 px-2 flex-1 disabled:opacity-40"
                >
                  {TIME_SLOTS.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
                <span className="text-xs text-[#64748B]">→</span>
                <select value={day.end} onChange={e => updateTime(idx, 'end', e.target.value)} disabled={!day.available}
                  className="kinput text-xs py-1 px-2 flex-1 disabled:opacity-40"
                >
                  {TIME_SLOTS.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Zone Availability */}
      <div>
        <h2 className="font-bold text-sm mb-3 flex items-center gap-2">
          <MapPin className="w-4 h-4 text-[#065F46] dark:text-[#34D399]" />
          {l('Zone Availability', 'Maeneo Unayofanya Kazi')}
        </h2>
        <div className="flex flex-wrap gap-2">
          {ZONES.map(zone => {
            const ZIcon = zone.icon;
            const selected = selectedZones.includes(zone.id);
            return (
              <button key={zone.id} onClick={() => toggleZone(zone.id)}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition-all ${
                  selected
                    ? 'text-white shadow-md scale-105'
                    : 'bg-[#F1F5F9] dark:bg-[#334155] text-[#64748B] dark:text-[#94A3B8] hover:bg-[#E2E8F0] dark:hover:bg-[#475569]'
                }`}
                style={selected ? { background: `linear-gradient(135deg, ${zone.color}, ${zone.color}CC)` } : undefined}
              >
                <ZIcon className="w-3.5 h-3.5" />
                {zone.name}
              </button>
            );
          })}
        </div>
      </div>

      {/* Session Settings */}
      <div className="kcard p-4 space-y-4">
        <h2 className="font-bold text-sm">{l('Session Settings', 'Mipangilio ya Vipindi')}</h2>
        <div className="flex items-center justify-between">
          <span className="text-sm text-[#64748B]">{l('Max simultaneous sessions', 'Vipindi vya wakati mmoja')}</span>
          <div className="flex items-center gap-2">
            <button onClick={() => setMaxSessions(Math.max(1, maxSessions - 1))} className="w-8 h-8 rounded-lg bg-[#F1F5F9] dark:bg-[#334155] flex items-center justify-center font-bold text-sm active:scale-90">−</button>
            <span className="w-8 text-center font-bold">{maxSessions}</span>
            <button onClick={() => setMaxSessions(Math.min(5, maxSessions + 1))} className="w-8 h-8 rounded-lg bg-[#F1F5F9] dark:bg-[#334155] flex items-center justify-center font-bold text-sm active:scale-90">+</button>
          </div>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-sm text-[#64748B]">{l('Break between sessions', 'Pumziko kati ya vipindi')}</span>
          <select value={breakTime} onChange={e => setBreakTime(e.target.value)} className="kinput text-xs py-1.5 px-2">
            <option value="15">15 min</option>
            <option value="30">30 min</option>
            <option value="45">45 min</option>
            <option value="60">60 min</option>
          </select>
        </div>
      </div>

      {/* Save Button */}
      <button onClick={handleSave}
        className={`kbtn w-full flex items-center justify-center gap-2 ${saved ? '!bg-gradient-to-r from-[#10B981] to-[#059669]' : ''}`}
      >
        <Save className="w-4 h-4" />
        {saved ? l('Saved!', 'Imehifadhiwa!') : l('Save Changes', 'Hifadhi Mabadiliko')}
      </button>
    </div>
  );
}

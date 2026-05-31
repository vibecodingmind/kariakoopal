'use client';
import { useState } from 'react';
import { useAuthStore } from '@/lib/stores/auth-store';
import { motion } from 'framer-motion';
import { User, MapPin, Globe, Edit, Camera, ShieldCheck, Award, Star, Save } from 'lucide-react';

export default function GuideProfilePage() {
  const { user, language } = useAuthStore();
  const sw = language === 'sw';
  const l = (en: string, swText: string) => (sw ? swText : en);
  const [editing, setEditing] = useState(false);
  const [bio, setBio] = useState('Born and raised in Kariakoo. I know every fabric stall by name and can get you the best kanga deals in the market.');
  const [zones, setZones] = useState(['Fabrics Zone', 'Wholesale Zone']);
  const [languages, setLanguages] = useState(['Swahili', 'English', 'Arabic']);

  const allZones = ['Electronics Zone', 'Fabrics Zone', 'Wholesale Zone', 'Spices Zone', 'Kitchenware Zone', 'Artisanal Zone'];
  const allLanguages = ['Swahili', 'English', 'Arabic', 'Hindi', 'French', 'German'];

  return (
    <div className="px-4 py-4 space-y-5">
      <div className="flex items-center justify-between">
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="text-2xl font-bold text-[#0A4D3C] dark:text-[#2EA77A]">{l('My Profile', 'Wasifu Wangu')}</h1>
        </motion.div>
        <button onClick={() => setEditing(!editing)} className="kbtn-outline text-xs py-1.5 px-3 flex items-center gap-1">
          {editing ? <Save className="w-3 h-3" /> : <Edit className="w-3 h-3" />}
          {editing ? l('Save', 'Hifadhi') : l('Edit', 'Hariri')}
        </button>
      </div>

      {/* Avatar */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="kcard p-5 text-center">
        <div className="relative inline-block">
          <div className="w-24 h-24 rounded-2xl bg-[#0B5D3A] flex items-center justify-center text-white font-bold text-3xl mx-auto">
            {user?.name?.split(' ').map(n => n[0]).join('') || 'G'}
          </div>
          {editing && (
            <button className="absolute bottom-0 right-0 w-8 h-8 rounded-full bg-[#FFD23F] flex items-center justify-center">
              <Camera className="w-4 h-4 text-[#0A4D3C]" />
            </button>
          )}
        </div>
        <h2 className="text-xl font-bold mt-3">{user?.name || 'Guide'}</h2>
        <div className="flex items-center justify-center gap-2 mt-1">
          <ShieldCheck className="w-4 h-4 text-[#0B5D3A]" />
          <span className="kbadge kbadge-verified">{l('Verified Expert', 'Mtaalamu Aliyethibitishwa')}</span>
        </div>
        <div className="flex items-center justify-center gap-4 mt-3">
          <div className="text-center"><p className="text-lg font-bold">4.8</p><p className="text-[10px] text-[#6C757D]">{l('Rating', 'Alama')}</p></div>
          <div className="w-px h-8 bg-[#E9ECEF]" />
          <div className="text-center"><p className="text-lg font-bold">156</p><p className="text-[10px] text-[#6C757D]">{l('Sessions', 'Vipindi')}</p></div>
          <div className="w-px h-8 bg-[#E9ECEF]" />
          <div className="text-center"><p className="text-lg font-bold">3</p><p className="text-[10px] text-[#6C757D]">{l('Badges', 'Beji')}</p></div>
        </div>
      </motion.div>

      {/* Bio */}
      <div className="kcard p-4">
        <h3 className="font-semibold text-sm mb-2">{l('Bio', 'Maisha')}</h3>
        {editing ? <textarea value={bio} onChange={e => setBio(e.target.value)} className="kinput w-full h-24 resize-none" /> : <p className="text-sm text-[#6C757D] leading-relaxed">{bio}</p>}
      </div>

      {/* Zones */}
      <div className="kcard p-4">
        <h3 className="font-semibold text-sm mb-2 flex items-center gap-1"><MapPin className="w-4 h-4 text-[#0B5D3A]" />{l('Zones', 'Maeneo')}</h3>
        <div className="flex gap-2 flex-wrap">
          {(editing ? allZones : zones).map(zone => {
            const active = zones.includes(zone);
            return (
              <button key={zone} onClick={() => editing && (active ? setZones(zones.filter(z => z !== zone)) : setZones([...zones, zone]))} className={`ktag ${active ? 'ktag-active' : 'ktag-inactive'}`}>
                {zone}
              </button>
            );
          })}
        </div>
      </div>

      {/* Languages */}
      <div className="kcard p-4">
        <h3 className="font-semibold text-sm mb-2 flex items-center gap-1"><Globe className="w-4 h-4 text-[#0B5D3A]" />{l('Languages', 'Lugha')}</h3>
        <div className="flex gap-2 flex-wrap">
          {(editing ? allLanguages : languages).map(lang => {
            const active = languages.includes(lang);
            return (
              <button key={lang} onClick={() => editing && (active ? setLanguages(languages.filter(l => l !== lang)) : setLanguages([...languages, lang]))} className={`ktag ${active ? 'ktag-active' : 'ktag-inactive'}`}>
                {lang}
              </button>
            );
          })}
        </div>
      </div>

      {/* Badges */}
      <div className="kcard p-4">
        <h3 className="font-semibold text-sm mb-2 flex items-center gap-1"><Award className="w-4 h-4 text-[#FFD23F]" />{l('Badges', 'Beji')}</h3>
        <div className="flex gap-2 flex-wrap">
          <span className="kbadge kbadge-gold flex items-center gap-1"><Star className="w-3 h-3" />Top Rated</span>
          <span className="kbadge kbadge-verified flex items-center gap-1"><ShieldCheck className="w-3 h-3" />Verified Expert</span>
          <span className="kbadge kbadge-silver flex items-center gap-1"><Award className="w-3 h-3" />100+ Sessions</span>
        </div>
      </div>
    </div>
  );
}

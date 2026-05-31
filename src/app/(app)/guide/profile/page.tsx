'use client';

import { useState } from 'react';
import { useAuthStore } from '@/lib/stores/auth-store';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import {
  User, MapPin, Globe, Edit, Camera, ShieldCheck, Award, Star, Save,
  Crown, Zap, Wallet, ChevronRight, Bell, Settings, Shield, LogOut,
  Clock, Check, X, ToggleLeft, ToggleRight
} from 'lucide-react';

export default function GuideProfilePage() {
  const { user, language, logout, updateProfile, walletBalance, subscriptionTier, setSubscriptionTier, guideProfile } = useAuthStore();
  const router = useRouter();
  const sw = language === 'sw';
  const l = (en: string, swText: string) => (sw ? swText : en);

  const [editing, setEditing] = useState(false);
  const [bio, setBio] = useState('Born and raised in Kariakoo. I know every fabric stall by name and can get you the best kanga deals in the market.');
  const [zones, setZones] = useState(['Fabrics Zone', 'Wholesale Zone']);
  const [languages, setLanguages] = useState(['Swahili', 'English', 'Arabic']);
  const [name, setName] = useState(user?.name || '');
  const [email, setEmail] = useState(user?.email || '');
  const [saved, setSaved] = useState(false);
  const [isOnline, setIsOnline] = useState(true);

  const allZones = ['Electronics Zone', 'Fabrics Zone', 'Wholesale Zone', 'Spices Zone', 'Kitchenware Zone', 'Artisanal Zone'];
  const allLanguages = ['Swahili', 'English', 'Arabic', 'Hindi', 'French', 'German'];

  const handleSave = () => {
    updateProfile({ name, email });
    setEditing(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const handleLogout = async () => { logout(); router.replace('/auth'); };

  const tierConfig: Record<string, { icon: typeof Crown; color: string; bg: string }> = {
    starter: { icon: Shield, color: 'from-slate-400 to-slate-500', bg: 'bg-[#F1F3F5] dark:bg-[#21262D]' },
    pro: { icon: Zap, color: 'from-amber-500 to-orange-500', bg: 'bg-[#FEF3C7] dark:bg-[#3D2E0A]' },
    elite: { icon: Crown, color: 'from-[#0A4D3C] to-[#2EA77A]', bg: 'bg-[#E8F5EE] dark:bg-[#0D2818]' },
  };

  const currentTier = tierConfig[subscriptionTier] || tierConfig.starter;
  const TierIcon = currentTier.icon;

  return (
    <div className="px-4 py-4 space-y-5">
      {/* Header with Edit */}
      <div className="flex items-center justify-between">
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="text-2xl font-bold text-[#0A4D3C] dark:text-[#2EA77A]">{l('My Profile', 'Wasifu Wangu')}</h1>
        </motion.div>
        <div className="flex items-center gap-2">
          {/* Online Toggle */}
          <button
            onClick={() => setIsOnline(!isOnline)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${isOnline ? 'bg-[#E8F5EE] text-[#0B5D3A]' : 'bg-[#F1F3F5] dark:bg-[#21262D] text-[#6C757D]'}`}
          >
            <div className={`w-2 h-2 rounded-full ${isOnline ? 'bg-[#10B981] animate-pulse-dot' : 'bg-[#6C757D]'}`} />
            {isOnline ? l('Online', 'Mtandaoni') : l('Offline', 'Hapatikani')}
          </button>
          <button onClick={() => editing ? handleSave() : setEditing(true)} className="kbtn-outline text-xs py-1.5 px-3 flex items-center gap-1">
            {editing ? (saved ? <Check className="w-3 h-3 text-[#10B981]" /> : <Save className="w-3 h-3" />) : <Edit className="w-3 h-3" />}
            {editing ? (saved ? l('Saved!', 'Imehifadhiwa!') : l('Save', 'Hifadhi')) : l('Edit', 'Hariri')}
          </button>
        </div>
      </div>

      {/* Avatar Section */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="kcard p-5 text-center">
        <div className="relative inline-block">
          <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-[#0A4D3C] to-[#2EA77A] flex items-center justify-center text-white font-bold text-3xl mx-auto shadow-lg shadow-[#0A4D3C]/20 ring-4 ring-[#10B981]/20">
            {user?.name?.split(' ').map(n => n[0]).join('') || 'G'}
          </div>
          {editing && (
            <button className="absolute bottom-0 right-0 w-8 h-8 rounded-full bg-[#FFD23F] flex items-center justify-center shadow-md">
              <Camera className="w-4 h-4 text-[#0A4D3C]" />
            </button>
          )}
          {/* Online indicator */}
          {isOnline && (
            <div className="absolute top-1 right-1 w-4 h-4 rounded-full bg-[#10B981] border-2 border-white dark:border-[#161B22]" />
          )}
        </div>
        {editing ? (
          <div className="mt-3 space-y-2 max-w-xs mx-auto">
            <input value={name} onChange={e => setName(e.target.value)} className="kinput w-full text-center font-bold" />
            <input value={email} onChange={e => setEmail(e.target.value)} className="kinput w-full text-center text-sm" placeholder={l('Email', 'Barua pepe')} />
          </div>
        ) : (
          <>
            <h2 className="text-xl font-bold mt-3">{user?.name || 'Guide'}</h2>
          </>
        )}
        <div className="flex items-center justify-center gap-2 mt-2">
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

      {/* Subscription Card */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
        onClick={() => router.push('/guide/subscriptions')}
        className="kcard p-4 cursor-pointer hover:shadow-md transition-all active:scale-[0.98] border-l-4 border-l-[#FFD23F]"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${currentTier.color} flex items-center justify-center`}>
              <TierIcon className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="font-semibold text-sm">{subscriptionTier === 'starter' ? l('Starter Plan', 'Mpango wa Starter') : subscriptionTier === 'pro' ? l('Pro Plan', 'Mpango wa Pro') : l('Elite Plan', 'Mpango wa Elite')}</p>
              <p className="text-xs text-[#6C757D]">
                {subscriptionTier === 'starter' ? l('Free forever', 'Bure milele') : `TZS ${subscriptionTier === 'pro' ? '15,000' : '35,000'}/${l('mo', 'mwezi')}`}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {subscriptionTier !== 'starter' && <span className="kbadge kbadge-gold text-[8px]">{l('Active', 'Hai')}</span>}
            <ChevronRight className="w-4 h-4 text-[#6C757D]" />
          </div>
        </div>
      </motion.div>

      {/* Bio */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="kcard p-4">
        <h3 className="font-semibold text-sm mb-2">{l('Bio', 'Maisha')}</h3>
        {editing ? <textarea value={bio} onChange={e => setBio(e.target.value)} className="kinput w-full h-24 resize-none" /> : <p className="text-sm text-[#6C757D] leading-relaxed">{bio}</p>}
      </motion.div>

      {/* Zones */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }} className="kcard p-4">
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
      </motion.div>

      {/* Languages */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="kcard p-4">
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
      </motion.div>

      {/* Badges */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }} className="kcard p-4">
        <h3 className="font-semibold text-sm mb-2 flex items-center gap-1"><Award className="w-4 h-4 text-[#FFD23F]" />{l('Badges', 'Beji')}</h3>
        <div className="flex gap-2 flex-wrap">
          <span className="kbadge kbadge-gold flex items-center gap-1"><Star className="w-3 h-3" />Top Rated</span>
          <span className="kbadge kbadge-verified flex items-center gap-1"><ShieldCheck className="w-3 h-3" />Verified Expert</span>
          <span className="kbadge kbadge-silver flex items-center gap-1"><Award className="w-3 h-3" />100+ Sessions</span>
        </div>
      </motion.div>

      {/* Quick Links */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="kcard p-0 overflow-hidden">
        {[
          { icon: Wallet, label: l('Earnings & Wallet', 'Mapato na Mkoba'), href: '/guide/earnings', color: '#0B5D3A' },
          { icon: Bell, label: l('Notifications', 'Arifa'), href: '/notifications', color: '#0077B6', badge: '5' },
          { icon: Settings, label: l('Settings', 'Mipangilio'), href: '/settings', color: '#6C757D' },
          { icon: Shield, label: l('Security', 'Usalama'), href: '/settings/security', color: '#0B5D3A' },
        ].map((item, i) => (
          <button
            key={i}
            onClick={() => router.push(item.href)}
            className="w-full flex items-center gap-3 px-4 py-3.5 hover:bg-[#F1F3F5] dark:hover:bg-[#21262D] transition-colors border-b border-[#E9ECEF] dark:border-[#30363D] last:border-0"
          >
            <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: `${item.color}15` }}>
              <item.icon className="w-4 h-4" style={{ color: item.color }} />
            </div>
            <span className="text-sm font-medium flex-1 text-left">{item.label}</span>
            {item.badge && <span className="w-5 h-5 rounded-full bg-[#E63946] text-white text-[9px] font-bold flex items-center justify-center">{item.badge}</span>}
            <ChevronRight className="w-4 h-4 text-[#6C757D]" />
          </button>
        ))}
      </motion.div>

      {/* Logout */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.45 }}>
        <button onClick={handleLogout} className="w-full py-3 rounded-xl border-2 border-[#E63946] text-[#E63946] font-semibold text-sm hover:bg-[#FEE2E2] transition-colors flex items-center justify-center gap-2 active:scale-95">
          <LogOut className="w-4 h-4" />{l('Logout', 'Toka')}
        </button>
      </motion.div>
    </div>
  );
}

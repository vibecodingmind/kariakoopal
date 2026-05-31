'use client';

import { useState, useRef } from 'react';
import { useAuthStore } from '@/lib/stores/auth-store';
import { motion, AnimatePresence } from 'framer-motion';
import {
  User, MapPin, Globe, Edit, Camera, ShieldCheck, Award, Star, Save,
  Wifi, WifiOff, Settings, LogOut, Wallet, ChevronRight, X, Crown,
  Zap, Clock, Eye
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';

// ── Animation variants ──
const fadeUp = {
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -8 },
};

// ── Tier config ──
const tierConfig: Record<string, { color: string; bg: string; border: string; icon: typeof Crown }> = {
  starter: { color: 'text-[#6C757D]', bg: 'bg-[#F1F3F5] dark:bg-[#21262D]', border: 'border-[#6C757D]/20', icon: Zap },
  pro: { color: 'text-[#0A4D3C] dark:text-[#2EA77A]', bg: 'bg-[#E8F5EE] dark:bg-[#0D2818]', border: 'border-[#0A4D3C]/20', icon: Star },
  elite: { color: 'text-[#B8860B]', bg: 'bg-[#FEF3C7] dark:bg-[#3D2E0A]', border: 'border-[#FFD23F]/30', icon: Crown },
};

const tierNames: Record<string, { en: string; sw: string }> = {
  starter: { en: 'Starter', sw: 'Kuanza' },
  pro: { en: 'Pro', sw: 'Pro' },
  elite: { en: 'Elite', sw: 'Bora' },
};

export default function GuideProfilePage() {
  const { user, language, logout, subscriptionTier, updateProfile, setGuideProfile } = useAuthStore();
  const router = useRouter();
  const sw = language === 'sw';
  const l = (en: string, swText: string) => (sw ? swText : en);
  const [editing, setEditing] = useState(false);
  const [isOnline, setIsOnline] = useState(true);
  const [bio, setBio] = useState('Born and raised in Kariakoo. I know every fabric stall by name and can get you the best kanga deals in the market. Let me show you the real Kariakoo!');
  const [zones, setZones] = useState(['Fabrics Zone', 'Wholesale Zone', 'Spices Zone']);
  const [languages, setLanguages] = useState(['Swahili', 'English', 'Arabic']);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(user?.avatarUrl || null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editName, setEditName] = useState(user?.name || '');
  const [editEmail, setEditEmail] = useState(user?.email || '');
  const [editPhone, setEditPhone] = useState(user?.phone || '');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const allZones = ['Electronics Zone', 'Fabrics Zone', 'Wholesale Zone', 'Spices Zone', 'Kitchenware Zone', 'Artisanal Zone'];
  const allLanguages = ['Swahili', 'English', 'Arabic', 'Hindi', 'French', 'German'];
  const currentTier = subscriptionTier || 'pro';

  const handleLogout = async () => { logout(); router.replace('/auth'); };

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setAvatarPreview(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleSaveProfile = () => {
    updateProfile({ name: editName, email: editEmail, phone: editPhone, ...(avatarPreview ? { avatarUrl: avatarPreview } : {}) });
    setShowEditModal(false);
  };

  const handleToggleOnline = () => {
    setIsOnline(!isOnline);
    if (setGuideProfile) {
      // Update online status in store
    }
  };

  const tierInfo = tierConfig[currentTier] || tierConfig.starter;
  const TierIcon = tierInfo.icon;

  const demoBadges = [
    { type: 'Top Rated', icon: Star, class: 'kbadge-gold' },
    { type: 'Verified Expert', icon: ShieldCheck, class: 'kbadge-verified' },
    { type: '100+ Sessions', icon: Award, class: 'kbadge-silver' },
  ];

  return (
    <div className="px-4 py-4 space-y-5">
      {/* ── Header ── */}
      <div className="flex items-center justify-between">
        <motion.div {...fadeUp}>
          <h1 className="text-2xl font-bold text-[#0A4D3C] dark:text-[#2EA77A]">{l('My Profile', 'Wasifu Wangu')}</h1>
        </motion.div>
        <button onClick={() => setEditing(!editing)} className="kbtn-outline text-xs py-1.5 px-3 flex items-center gap-1">
          {editing ? <Save className="w-3 h-3" /> : <Edit className="w-3 h-3" />}
          {editing ? l('Save', 'Hifadhi') : l('Edit', 'Hariri')}
        </button>
      </div>

      {/* ── Avatar Section ── */}
      <motion.div {...fadeUp} transition={{ delay: 0.05 }} className="kcard p-6 text-center relative">
        <div className="relative inline-block">
          {avatarPreview ? (
            <div className="w-24 h-24 rounded-2xl mx-auto overflow-hidden ring-4 ring-[#E8F5EE] dark:ring-[#0D2818]">
              <Image src={avatarPreview} alt="Avatar" width={96} height={96} className="w-full h-full object-cover" />
            </div>
          ) : (
            <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-[#0A4D3C] to-[#2EA77A] flex items-center justify-center text-white font-bold text-3xl mx-auto ring-4 ring-[#E8F5EE] dark:ring-[#0D2818]">
              {user?.name?.split(' ').map(n => n[0]).join('') || 'G'}
            </div>
          )}
          {/* Online status indicator */}
          <div className={`absolute bottom-1 right-1 w-5 h-5 rounded-full border-2 border-white dark:border-[#161B22] ${isOnline ? 'bg-[#10B981]' : 'bg-[#6C757D]'}`} />
          {/* Camera button */}
          {(editing) && (
            <button onClick={() => fileInputRef.current?.click()} className="absolute -bottom-1 -right-1 w-8 h-8 rounded-full bg-[#FFD23F] flex items-center justify-center shadow-lg">
              <Camera className="w-4 h-4 text-[#0A4D3C]" />
            </button>
          )}
          <input ref={fileInputRef} type="file" accept="image/*" onChange={handleAvatarChange} className="hidden" />
        </div>
        <h2 className="text-xl font-bold mt-3">{user?.name || 'Guide'}</h2>
        <div className="flex items-center justify-center gap-2 mt-1">
          <ShieldCheck className="w-4 h-4 text-[#0A4D3C] dark:text-[#2EA77A]" />
          <span className="kbadge kbadge-verified">{l('Verified Expert', 'Mtaalamu Aliyethibitishwa')}</span>
        </div>
        <div className="flex items-center justify-center gap-1.5 mt-2">
          <div className={`w-2 h-2 rounded-full ${isOnline ? 'bg-[#10B981]' : 'bg-[#6C757D]'}`} />
          <span className={`text-xs font-medium ${isOnline ? 'text-[#10B981]' : 'text-[#6C757D]'}`}>
            {isOnline ? l('Online', 'Mtandaoni') : l('Offline', 'Nje ya Mtandao')}
          </span>
        </div>

        {/* ── Stats Row ── */}
        <div className="flex items-center justify-center gap-4 mt-4 pt-4 border-t border-[#E9ECEF] dark:border-[#30363D]">
          <div className="text-center">
            <p className="text-lg font-bold">4.8</p>
            <p className="text-[10px] text-[#6C757D]">{l('Rating', 'Alama')}</p>
          </div>
          <div className="w-px h-8 bg-[#E9ECEF] dark:bg-[#30363D]" />
          <div className="text-center">
            <p className="text-lg font-bold">156</p>
            <p className="text-[10px] text-[#6C757D]">{l('Sessions', 'Vipindi')}</p>
          </div>
          <div className="w-px h-8 bg-[#E9ECEF] dark:bg-[#30363D]" />
          <div className="text-center">
            <p className="text-lg font-bold">{demoBadges.length}</p>
            <p className="text-[10px] text-[#6C757D]">{l('Badges', 'Beji')}</p>
          </div>
        </div>
      </motion.div>

      {/* ── Subscription Tier Card ── */}
      <motion.div {...fadeUp} transition={{ delay: 0.1 }} className="kcard p-4 relative overflow-hidden">
        <div className={`absolute top-0 right-0 w-20 h-20 rounded-bl-full ${tierInfo.bg}`} />
        <div className="flex items-center gap-3 relative z-10">
          <div className={`w-12 h-12 rounded-xl ${tierInfo.bg} flex items-center justify-center border ${tierInfo.border}`}>
            <TierIcon className={`w-6 h-6 ${tierInfo.color}`} />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <h3 className="font-bold">{l(tierNames[currentTier]?.en || 'Starter', tierNames[currentTier]?.sw || 'Kuanza')} {l('Plan', 'Mpango')}</h3>
              <span className={`kbadge ${currentTier === 'elite' ? 'kbadge-gold' : currentTier === 'pro' ? 'kbadge-verified' : 'kbadge-pending'}`}>
                {currentTier === 'elite' ? '★' : currentTier === 'pro' ? '✓' : '○'}
              </span>
            </div>
            <p className="text-xs text-[#6C757D] dark:text-[#8B949E] mt-0.5">
              {l('Renews Mar 15, 2026', 'Inajirudi Machi 15, 2026')} · {l('16 days left', 'siku 16 zimesalia')}
            </p>
          </div>
        </div>
        <div className="flex items-center justify-between mt-3 pt-3 border-t border-[#E9ECEF] dark:border-[#30363D]">
          <div className="flex items-center gap-2">
            <span className="text-xs text-[#6C757D] dark:text-[#8B949E]">{l('Auto-renew', 'Kujirudia')}</span>
            <div className="ktoggle ktoggle-active"><div /></div>
          </div>
          <button onClick={() => router.push('/guide/subscriptions')} className="kbtn-outline text-xs py-1.5 px-3 flex items-center gap-1">
            {l('Manage', 'Simamia')}<ChevronRight className="w-3 h-3" />
          </button>
        </div>
      </motion.div>

      {/* ── Bio Section ── */}
      <motion.div {...fadeUp} transition={{ delay: 0.15 }} className="kcard p-4">
        <h3 className="font-semibold text-sm mb-2 flex items-center gap-1">
          <User className="w-4 h-4 text-[#0A4D3C] dark:text-[#2EA77A]" />{l('Bio', 'Maisha')}
        </h3>
        {editing ? (
          <textarea value={bio} onChange={e => setBio(e.target.value)} className="kinput w-full h-24 resize-none" />
        ) : (
          <p className="text-sm text-[#6C757D] dark:text-[#8B949E] leading-relaxed">{bio}</p>
        )}
      </motion.div>

      {/* ── Zones Section ── */}
      <motion.div {...fadeUp} transition={{ delay: 0.2 }} className="kcard p-4">
        <h3 className="font-semibold text-sm mb-2 flex items-center gap-1">
          <MapPin className="w-4 h-4 text-[#0A4D3C] dark:text-[#2EA77A]" />{l('Zones', 'Maeneo')}
        </h3>
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

      {/* ── Languages Section ── */}
      <motion.div {...fadeUp} transition={{ delay: 0.25 }} className="kcard p-4">
        <h3 className="font-semibold text-sm mb-2 flex items-center gap-1">
          <Globe className="w-4 h-4 text-[#0A4D3C] dark:text-[#2EA77A]" />{l('Languages', 'Lugha')}
        </h3>
        <div className="flex gap-2 flex-wrap">
          {(editing ? allLanguages : languages).map(lang => {
            const active = languages.includes(lang);
            return (
              <button key={lang} onClick={() => editing && (active ? setLanguages(languages.filter(lx => lx !== lang)) : setLanguages([...languages, lang]))} className={`ktag ${active ? 'ktag-active' : 'ktag-inactive'}`}>
                {lang}
              </button>
            );
          })}
        </div>
      </motion.div>

      {/* ── Badges Display ── */}
      <motion.div {...fadeUp} transition={{ delay: 0.3 }} className="kcard p-4">
        <h3 className="font-semibold text-sm mb-3 flex items-center gap-1">
          <Award className="w-4 h-4 text-[#FFD23F]" />{l('Badges', 'Beji')}
        </h3>
        <div className="grid grid-cols-3 gap-3">
          {demoBadges.map((badge, i) => (
            <div key={i} className="text-center p-3 rounded-xl bg-[#F8F9FA] dark:bg-[#21262D]">
              <badge.icon className={`w-6 h-6 mx-auto mb-1 ${badge.class === 'kbadge-gold' ? 'text-[#FFD23F]' : badge.class === 'kbadge-verified' ? 'text-[#0A4D3C] dark:text-[#2EA77A]' : 'text-[#6C757D]'}`} />
              <p className="text-[10px] font-semibold leading-tight">{badge.type}</p>
            </div>
          ))}
        </div>
      </motion.div>

      {/* ── Account Actions ── */}
      <motion.div {...fadeUp} transition={{ delay: 0.35 }} className="kcard p-0 overflow-hidden">
        <button onClick={() => { setEditName(user?.name || ''); setEditEmail(user?.email || ''); setEditPhone(user?.phone || ''); setShowEditModal(true); }} className="w-full flex items-center gap-3 px-4 py-3.5 hover:bg-[#F1F3F5] dark:hover:bg-[#21262D] transition-colors border-b border-[#E9ECEF] dark:border-[#30363D]">
          <div className="w-8 h-8 rounded-lg bg-[#E8F5EE] dark:bg-[#0D2818] flex items-center justify-center">
            <Edit className="w-4 h-4 text-[#0A4D3C] dark:text-[#2EA77A]" />
          </div>
          <span className="text-sm font-medium flex-1 text-left">{l('Edit Profile', 'Hariri Wasifu')}</span>
          <ChevronRight className="w-4 h-4 text-[#6C757D]" />
        </button>

        <button onClick={handleToggleOnline} className="w-full flex items-center gap-3 px-4 py-3.5 hover:bg-[#F1F3F5] dark:hover:bg-[#21262D] transition-colors border-b border-[#E9ECEF] dark:border-[#30363D]">
          <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${isOnline ? 'bg-[#E8F5EE] dark:bg-[#0D2818]' : 'bg-[#F1F3F5] dark:bg-[#21262D]'}`}>
            {isOnline ? <Wifi className="w-4 h-4 text-[#10B981]" /> : <WifiOff className="w-4 h-4 text-[#6C757D]" />}
          </div>
          <span className="text-sm font-medium flex-1 text-left">
            {isOnline ? l('Go Offline', 'Ota Mtandaoni') : l('Go Online', 'Kuwa Mtandaoni')}
          </span>
          <div className={`ktoggle ${isOnline ? 'ktoggle-active' : ''}`}><div /></div>
        </button>

        <button onClick={() => router.push('/wallet')} className="w-full flex items-center gap-3 px-4 py-3.5 hover:bg-[#F1F3F5] dark:hover:bg-[#21262D] transition-colors border-b border-[#E9ECEF] dark:border-[#30363D]">
          <div className="w-8 h-8 rounded-lg bg-[#E8F5EE] dark:bg-[#0D2818] flex items-center justify-center">
            <Wallet className="w-4 h-4 text-[#0A4D3C] dark:text-[#2EA77A]" />
          </div>
          <span className="text-sm font-medium flex-1 text-left">{l('View Earnings', 'Tazama Mapato')}</span>
          <ChevronRight className="w-4 h-4 text-[#6C757D]" />
        </button>

        <button onClick={() => router.push('/settings')} className="w-full flex items-center gap-3 px-4 py-3.5 hover:bg-[#F1F3F5] dark:hover:bg-[#21262D] transition-colors border-b border-[#E9ECEF] dark:border-[#30363D]">
          <div className="w-8 h-8 rounded-lg bg-[#E8F5EE] dark:bg-[#0D2818] flex items-center justify-center">
            <Settings className="w-4 h-4 text-[#0A4D3C] dark:text-[#2EA77A]" />
          </div>
          <span className="text-sm font-medium flex-1 text-left">{l('Settings', 'Mipangilio')}</span>
          <ChevronRight className="w-4 h-4 text-[#6C757D]" />
        </button>

        <button onClick={handleLogout} className="w-full flex items-center gap-3 px-4 py-3.5 hover:bg-[#FEE2E2] dark:hover:bg-[#3D1F1F] transition-colors">
          <div className="w-8 h-8 rounded-lg bg-[#FEE2E2] dark:bg-[#3D1F1F] flex items-center justify-center">
            <LogOut className="w-4 h-4 text-[#E63946]" />
          </div>
          <span className="text-sm font-medium flex-1 text-left text-[#E63946]">{l('Logout', 'Toka')}</span>
        </button>
      </motion.div>

      {/* ── Edit Profile Modal ── */}
      <AnimatePresence>
        {showEditModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[60] bg-black/50 flex items-end sm:items-center justify-center p-0 sm:p-4"
            onClick={() => setShowEditModal(false)}
          >
            <motion.div
              initial={{ y: 100, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 100, opacity: 0 }}
              transition={{ type: 'spring', damping: 25 }}
              className="bg-white dark:bg-[#161B22] w-full sm:max-w-md sm:rounded-2xl rounded-t-2xl p-6 max-h-[85vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-5">
                <h2 className="text-lg font-bold">{l('Edit Profile', 'Hariri Wasifu')}</h2>
                <button onClick={() => setShowEditModal(false)} className="w-8 h-8 rounded-lg bg-[#F1F3F5] dark:bg-[#21262D] flex items-center justify-center">
                  <X className="w-4 h-4" />
                </button>
              </div>
              <div className="text-center mb-5">
                <div className="relative inline-block">
                  {avatarPreview ? (
                    <div className="w-20 h-20 rounded-2xl mx-auto overflow-hidden ring-2 ring-[#E8F5EE]">
                      <Image src={avatarPreview} alt="Avatar" width={80} height={80} className="w-full h-full object-cover" />
                    </div>
                  ) : (
                    <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-[#0A4D3C] to-[#2EA77A] flex items-center justify-center text-white font-bold text-2xl mx-auto ring-2 ring-[#E8F5EE]">
                      {editName?.split(' ').map(n => n[0]).join('') || 'G'}
                    </div>
                  )}
                  <button onClick={() => fileInputRef.current?.click()} className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full bg-[#FFD23F] flex items-center justify-center">
                    <Camera className="w-3.5 h-3.5 text-[#0A4D3C]" />
                  </button>
                </div>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium mb-1 block">{l('Full Name', 'Jina Kamili')}</label>
                  <input type="text" value={editName} onChange={(e) => setEditName(e.target.value)} className="kinput w-full" />
                </div>
                <div>
                  <label className="text-sm font-medium mb-1 block">{l('Email', 'Barua Pepe')}</label>
                  <input type="email" value={editEmail} onChange={(e) => setEditEmail(e.target.value)} className="kinput w-full" />
                </div>
                <div>
                  <label className="text-sm font-medium mb-1 block">{l('Phone', 'Simu')}</label>
                  <input type="tel" value={editPhone} onChange={(e) => setEditPhone(e.target.value)} className="kinput w-full" />
                </div>
              </div>
              <div className="flex gap-3 mt-6">
                <button onClick={() => setShowEditModal(false)} className="kbtn-outline flex-1 text-sm py-3">{l('Cancel', 'Ghairi')}</button>
                <button onClick={handleSaveProfile} className="kbtn flex-1 text-sm py-3 flex items-center justify-center gap-2">
                  <Save className="w-4 h-4" />{l('Save', 'Hifadhi')}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

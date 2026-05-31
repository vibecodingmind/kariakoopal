'use client';

import { useState, useRef } from 'react';
import { useAuthStore } from '@/lib/stores/auth-store';
import { useNotificationStore } from '@/lib/stores/notification-store';
import { motion, AnimatePresence } from 'framer-motion';
import {
  User, Phone, Mail, Camera, Star, MapPin, Bell, Shield,
  HelpCircle, LogOut, Settings, Wallet, ChevronRight, Calendar,
  X, Save, Award, ShoppingBag, Clock
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';

// ── Animation variants ──
const fadeUp = {
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -8 },
};

export default function SeekerProfilePage() {
  const { user, language, logout, walletBalance, updateProfile } = useAuthStore();
  const { unreadCount } = useNotificationStore();
  const router = useRouter();
  const sw = language === 'sw';
  const l = (en: string, swText: string) => (sw ? swText : en);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editName, setEditName] = useState(user?.name || '');
  const [editEmail, setEditEmail] = useState(user?.email || '');
  const [editPhone, setEditPhone] = useState(user?.phone || '');
  const [avatarPreview, setAvatarPreview] = useState<string | null>(user?.avatarUrl || null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleLogout = async () => {
    logout();
    router.replace('/auth');
  };

  const handleSaveProfile = () => {
    updateProfile({
      name: editName,
      email: editEmail,
      phone: editPhone,
      ...(avatarPreview ? { avatarUrl: avatarPreview } : {}),
    });
    setShowEditModal(false);
  };

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setAvatarPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const memberSince = user?.createdAt
    ? new Date(user.createdAt).toLocaleDateString(sw ? 'sw-TZ' : 'en-US', { month: 'long', year: 'numeric' })
    : l('January 2025', 'Januari 2025');

  // Demo stats
  const stats = [
    { icon: ShoppingBag, label: l('Sessions', 'Vipindi'), value: '12', color: 'text-[#0A4D3C] dark:text-[#2EA77A]' },
    { icon: Star, label: l('Reviews', 'Mapitio'), value: '8', color: 'text-[#FFD23F]' },
    { icon: MapPin, label: l('Fav Zones', 'Maeneo'), value: '4', color: 'text-[#E63946]' },
    { icon: Wallet, label: l('Balance', 'Salio'), value: `TZS ${(walletBalance || 0).toLocaleString()}`, color: 'text-[#10B981]' },
  ];

  const menuItems = [
    { icon: Star, label: l('My Reviews', 'Mapitio Yangu'), href: '/seeker/history', badge: null },
    { icon: MapPin, label: l('Saved Zones', 'Maeneo Yaliyohifadhiwa'), href: '/market', badge: null },
    { icon: Bell, label: l('Notifications', 'Arifa'), href: '/notifications', badge: unreadCount > 0 ? String(unreadCount) : null },
    { icon: Wallet, label: l('Wallet', 'Mkoba'), href: '/wallet', badge: null },
    { icon: Settings, label: l('Settings', 'Mipangilio'), href: '/settings', badge: null },
    { icon: Shield, label: l('Privacy & Security', 'Faragha na Usalama'), href: '/settings/security', badge: null },
    { icon: HelpCircle, label: l('Help & Support', 'Msaada'), href: '#', badge: null },
  ];

  return (
    <div className="px-4 py-4 space-y-5">
      {/* ── Avatar Section ── */}
      <motion.div {...fadeUp} transition={{ delay: 0 }} className="kcard p-6 text-center relative">
        <div className="relative inline-block">
          {avatarPreview ? (
            <div className="w-24 h-24 rounded-full mx-auto overflow-hidden ring-4 ring-[#E8F5EE] dark:ring-[#0D2818]">
              <Image src={avatarPreview} alt="Avatar" width={96} height={96} className="w-full h-full object-cover" />
            </div>
          ) : (
            <div className="w-24 h-24 rounded-full bg-gradient-to-br from-[#0A4D3C] to-[#2EA77A] flex items-center justify-center text-white font-bold text-3xl mx-auto ring-4 ring-[#E8F5EE] dark:ring-[#0D2818]">
              {user?.name?.split(' ').map(n => n[0]).join('') || 'U'}
            </div>
          )}
          <button
            onClick={() => fileInputRef.current?.click()}
            className="absolute bottom-0 right-0 w-8 h-8 rounded-full bg-[#FFD23F] flex items-center justify-center shadow-lg hover:scale-110 transition-transform active:scale-95"
          >
            <Camera className="w-4 h-4 text-[#0A4D3C]" />
          </button>
          <input ref={fileInputRef} type="file" accept="image/*" onChange={handleAvatarChange} className="hidden" />
        </div>
        <h2 className="text-xl font-bold mt-3">{user?.name || 'User'}</h2>
        <div className="flex items-center justify-center gap-3 mt-1 text-sm text-[#6C757D] dark:text-[#8B949E]">
          <span className="flex items-center gap-1"><Phone className="w-3.5 h-3.5" />{user?.phone || '+255 XXX XXX XXX'}</span>
        </div>
        {user?.email && (
          <div className="flex items-center justify-center gap-1 mt-0.5 text-sm text-[#6C757D] dark:text-[#8B949E]">
            <Mail className="w-3.5 h-3.5" />{user.email}
          </div>
        )}
        <div className="flex items-center justify-center gap-2 mt-2">
          <span className="kbadge kbadge-verified flex items-center gap-1">
            <User className="w-3 h-3" />{l('Seeker', 'Mtafutaji')}
          </span>
        </div>
        <div className="flex items-center justify-center gap-1 mt-2 text-xs text-[#6C757D] dark:text-[#8B949E]">
          <Calendar className="w-3 h-3" />
          {l('Member since', 'Mwanachama tangu')} {memberSince}
        </div>
        <button
          onClick={() => { setEditName(user?.name || ''); setEditEmail(user?.email || ''); setEditPhone(user?.phone || ''); setShowEditModal(true); }}
          className="kbtn-outline text-xs py-2 px-4 mt-3"
        >
          {l('Edit Profile', 'Hariri Wasifu')}
        </button>
      </motion.div>

      {/* ── Stats Cards ── */}
      <motion.div {...fadeUp} transition={{ delay: 0.05 }} className="grid grid-cols-2 gap-3">
        {stats.map((stat, i) => (
          <motion.div key={i} {...fadeUp} transition={{ delay: 0.05 + i * 0.03 }} className="kcard p-4">
            <stat.icon className={`w-5 h-5 ${stat.color} mb-1.5`} />
            <p className="text-lg font-bold">{stat.value}</p>
            <p className="text-[10px] text-[#6C757D] dark:text-[#8B949E]">{stat.label}</p>
          </motion.div>
        ))}
      </motion.div>

      {/* ── Wallet Quick View ── */}
      <motion.div {...fadeUp} transition={{ delay: 0.15 }} className="kcard-green p-4 relative overflow-hidden">
        <div className="flex items-center justify-between relative z-10">
          <div>
            <p className="text-sm text-white/70">{l('Wallet Balance', 'Salio la Mkoba')}</p>
            <p className="text-2xl font-bold text-white mt-0.5">TZS {(walletBalance || 0).toLocaleString()}</p>
          </div>
          <Wallet className="w-10 h-10 text-white/20" />
        </div>
        <div className="flex gap-2 mt-3 relative z-10">
          <button onClick={() => router.push('/wallet')} className="kbtn-yellow text-xs py-2 px-4 flex-1">
            {l('Top Up', 'Jaza')}
          </button>
          <button onClick={() => router.push('/wallet')} className="bg-white/20 text-white text-xs py-2 px-4 rounded-xl font-semibold flex-1 hover:bg-white/30 transition-colors">
            {l('View Wallet', 'Tazama Mkoba')}
          </button>
        </div>
      </motion.div>

      {/* ── Menu Items ── */}
      <motion.div {...fadeUp} transition={{ delay: 0.2 }} className="kcard p-0 overflow-hidden">
        {menuItems.map((item, i) => (
          <button
            key={i}
            onClick={() => item.href !== '#' && router.push(item.href)}
            className="w-full flex items-center gap-3 px-4 py-3.5 hover:bg-[#F1F3F5] dark:hover:bg-[#21262D] transition-colors border-b border-[#E9ECEF] dark:border-[#30363D] last:border-0"
          >
            <div className="w-8 h-8 rounded-lg bg-[#E8F5EE] dark:bg-[#0D2818] flex items-center justify-center">
              <item.icon className="w-4 h-4 text-[#0A4D3C] dark:text-[#2EA77A]" />
            </div>
            <span className="text-sm font-medium flex-1 text-left">{item.label}</span>
            {item.badge && (
              <span className="kbadge bg-[#E63946] text-white text-[10px] px-1.5">{item.badge}</span>
            )}
            <ChevronRight className="w-4 h-4 text-[#6C757D] dark:text-[#8B949E]" />
          </button>
        ))}
      </motion.div>

      {/* ── Logout ── */}
      <motion.button {...fadeUp} transition={{ delay: 0.25 }} onClick={handleLogout} className="w-full py-3.5 rounded-xl border-2 border-[#E63946] text-[#E63946] font-semibold text-sm hover:bg-[#FEE2E2] dark:hover:bg-[#3D1F1F] transition-colors flex items-center justify-center gap-2 active:scale-95">
        <LogOut className="w-4 h-4" />{l('Logout', 'Toka')}
      </motion.button>

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

              {/* Avatar change */}
              <div className="text-center mb-5">
                <div className="relative inline-block">
                  {avatarPreview ? (
                    <div className="w-20 h-20 rounded-full mx-auto overflow-hidden ring-2 ring-[#E8F5EE]">
                      <Image src={avatarPreview} alt="Avatar" width={80} height={80} className="w-full h-full object-cover" />
                    </div>
                  ) : (
                    <div className="w-20 h-20 rounded-full bg-gradient-to-br from-[#0A4D3C] to-[#2EA77A] flex items-center justify-center text-white font-bold text-2xl mx-auto ring-2 ring-[#E8F5EE]">
                      {editName?.split(' ').map(n => n[0]).join('') || 'U'}
                    </div>
                  )}
                  <button onClick={() => fileInputRef.current?.click()} className="absolute bottom-0 right-0 w-7 h-7 rounded-full bg-[#FFD23F] flex items-center justify-center">
                    <Camera className="w-3.5 h-3.5 text-[#0A4D3C]" />
                  </button>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium mb-1 block">{l('Full Name', 'Jina Kamili')}</label>
                  <input type="text" value={editName} onChange={(e) => setEditName(e.target.value)} className="kinput w-full" placeholder={l('Enter your name', 'Weka jina lako')} />
                </div>
                <div>
                  <label className="text-sm font-medium mb-1 block">{l('Email', 'Barua Pepe')}</label>
                  <input type="email" value={editEmail} onChange={(e) => setEditEmail(e.target.value)} className="kinput w-full" placeholder={l('Enter email', 'Weka barua pepe')} />
                </div>
                <div>
                  <label className="text-sm font-medium mb-1 block">{l('Phone', 'Simu')}</label>
                  <input type="tel" value={editPhone} onChange={(e) => setEditPhone(e.target.value)} className="kinput w-full" placeholder="+255 XXX XXX XXX" />
                </div>
              </div>

              <div className="flex gap-3 mt-6">
                <button onClick={() => setShowEditModal(false)} className="kbtn-outline flex-1 text-sm py-3">
                  {l('Cancel', 'Ghairi')}
                </button>
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

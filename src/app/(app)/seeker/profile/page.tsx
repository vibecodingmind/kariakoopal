'use client';

import { useState } from 'react';
import { useAuthStore } from '@/lib/stores/auth-store';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import {
  User, Phone, MapPin, Star, Settings, Bell, Shield, HelpCircle, LogOut,
  Camera, Edit, Save, Wallet, ChevronRight, Clock, ShoppingBag, Check, X, Mail
} from 'lucide-react';

export default function SeekerProfilePage() {
  const { user, language, logout, updateProfile, walletBalance } = useAuthStore();
  const router = useRouter();
  const sw = language === 'sw';
  const l = (en: string, swText: string) => (sw ? swText : en);

  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(user?.name || '');
  const [email, setEmail] = useState(user?.email || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    updateProfile({ name, email, phone });
    setEditing(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const handleLogout = async () => { logout(); router.replace('/auth'); };

  const memberSince = user?.createdAt ? new Date(user.createdAt).toLocaleDateString('en-US', { month: 'long', year: 'numeric' }) : 'May 2026';

  return (
    <div className="px-4 py-4 space-y-5">
      {/* Profile Header */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="kcard p-5 text-center relative">
        <div className="relative inline-block">
          <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-[#0A4D3C] to-[#2EA77A] flex items-center justify-center text-white font-bold text-3xl mx-auto shadow-lg shadow-[#0A4D3C]/20">
            {user?.name?.split(' ').map(n => n[0]).join('') || 'U'}
          </div>
          {editing && (
            <button className="absolute bottom-0 right-0 w-8 h-8 rounded-full bg-[#FFD23F] flex items-center justify-center shadow-md">
              <Camera className="w-4 h-4 text-[#0A4D3C]" />
            </button>
          )}
        </div>
        {editing ? (
          <div className="mt-3 space-y-2">
            <input value={name} onChange={e => setName(e.target.value)} className="kinput w-full text-center text-lg font-bold" placeholder={l('Your name', 'Jina lako')} />
            <input value={email} onChange={e => setEmail(e.target.value)} className="kinput w-full text-center text-sm" placeholder={l('Email', 'Barua pepe')} />
            <input value={phone} onChange={e => setPhone(e.target.value)} className="kinput w-full text-center text-sm" placeholder={l('Phone', 'Simu')} />
          </div>
        ) : (
          <>
            <h2 className="text-xl font-bold mt-3">{user?.name || 'User'}</h2>
            <p className="text-sm text-[#6C757D] mt-0.5">{user?.phone}</p>
            {user?.email && <p className="text-xs text-[#6C757D]">{user.email}</p>}
          </>
        )}
        <div className="flex items-center justify-center gap-2 mt-2">
          <span className="kbadge kbadge-verified">{l('Seeker', 'Mtafutaji')}</span>
          <span className="text-[10px] text-[#6C757D]">{l('Since', 'Tangu')} {memberSince}</span>
        </div>

        <div className="flex items-center justify-center gap-2 mt-4">
          {editing ? (
            <>
              <button onClick={handleSave} className="kbtn text-xs py-2 px-4 flex items-center gap-1">
                {saved ? <Check className="w-3 h-3" /> : <Save className="w-3 h-3" />}
                {saved ? l('Saved!', 'Imehifadhiwa!') : l('Save', 'Hifadhi')}
              </button>
              <button onClick={() => setEditing(false)} className="kbtn-outline text-xs py-2 px-4 flex items-center gap-1">
                <X className="w-3 h-3" />{l('Cancel', 'Ghairi')}
              </button>
            </>
          ) : (
            <button onClick={() => setEditing(true)} className="kbtn-outline text-xs py-2 px-4 flex items-center gap-1">
              <Edit className="w-3 h-3" />{l('Edit Profile', 'Hariri Wasifu')}
            </button>
          )}
        </div>
      </motion.div>

      {/* Stats Grid */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="grid grid-cols-4 gap-2">
        {[
          { label: l('Sessions', 'Vipindi'), value: '12', icon: Clock },
          { label: l('Reviews', 'Mapitio'), value: '8', icon: Star },
          { label: l('Zones', 'Maeneo'), value: '4', icon: MapPin },
          { label: l('Balance', 'Salio'), value: `${(walletBalance / 1000).toFixed(0)}K`, icon: Wallet },
        ].map((stat, i) => (
          <div key={i} className="kcard p-2.5 text-center">
            <stat.icon className="w-4 h-4 mx-auto mb-1 text-[#0B5D3A]" />
            <p className="text-sm font-bold">{stat.value}</p>
            <p className="text-[9px] text-[#6C757D]">{stat.label}</p>
          </div>
        ))}
      </motion.div>

      {/* Wallet Quick View */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
        onClick={() => router.push('/wallet')}
        className="kcard-green p-4 cursor-pointer hover:shadow-lg transition-all active:scale-[0.98]"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/15 flex items-center justify-center">
              <Wallet className="w-5 h-5 text-[#FFD23F]" />
            </div>
            <div>
              <p className="text-xs text-white/60">{l('Wallet Balance', 'Salio la Mkoba')}</p>
              <p className="text-lg font-bold text-white">TZS {walletBalance.toLocaleString()}</p>
            </div>
          </div>
          <ChevronRight className="w-5 h-5 text-white/40" />
        </div>
      </motion.div>

      {/* Menu Items */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="kcard p-0 overflow-hidden">
        {[
          { icon: Star, label: l('My Reviews', 'Mapitio Yangu'), href: '/seeker/history', color: '#FFD23F' },
          { icon: MapPin, label: l('Saved Zones', 'Maeneo Yaliyohifadhiwa'), href: '/market', color: '#0B5D3A' },
          { icon: ShoppingBag, label: l('Shopping Lists', 'Orodha za Manunuzi'), href: '/seeker/shopping-list', color: '#FFA500' },
          { icon: Bell, label: l('Notifications', 'Arifa'), href: '/notifications', color: '#0077B6', badge: '3' },
          { icon: Settings, label: l('Settings', 'Mipangilio'), href: '/settings', color: '#6C757D' },
          { icon: Shield, label: l('Privacy & Security', 'Faragha na Usalama'), href: '/settings/security', color: '#0B5D3A' },
          { icon: HelpCircle, label: l('Help & Support', 'Msaada'), href: '#', color: '#6C757D' },
        ].map((item, i) => (
          <button
            key={i}
            onClick={() => item.href !== '#' && router.push(item.href)}
            className="w-full flex items-center gap-3 px-4 py-3.5 hover:bg-[#F1F3F5] dark:hover:bg-[#21262D] transition-colors border-b border-[#E9ECEF] dark:border-[#30363D] last:border-0 active:scale-[0.98]"
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
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}>
        <button onClick={handleLogout} className="w-full py-3 rounded-xl border-2 border-[#E63946] text-[#E63946] font-semibold text-sm hover:bg-[#FEE2E2] transition-colors flex items-center justify-center gap-2 active:scale-95">
          <LogOut className="w-4 h-4" />{l('Logout', 'Toka')}
        </button>
      </motion.div>
    </div>
  );
}

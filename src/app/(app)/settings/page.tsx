'use client';

import { useState } from 'react';
import { useAuthStore } from '@/lib/stores/auth-store';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import {
  User, Phone, Mail, Globe, Bell, Shield, Eye, Camera,
  ChevronRight, Save, Check, HelpCircle, FileText, Info,
  MessageSquare, ShieldCheck, CreditCard, LogOut, Trash2
} from 'lucide-react';

export default function SettingsPage() {
  const { user, language, setLanguage, updateProfile, logout, subscriptionTier } = useAuthStore();
  const router = useRouter();
  const sw = language === 'sw';
  const l = (en: string, swText: string) => (sw ? swText : en);

  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(user?.name || '');
  const [email, setEmail] = useState(user?.email || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [saved, setSaved] = useState(false);
  const [pushNotif, setPushNotif] = useState(true);
  const [emailNotif, setEmailNotif] = useState(true);
  const [smsNotif, setSmsNotif] = useState(false);
  const [profileVisible, setProfileVisible] = useState(true);

  const handleSave = () => {
    updateProfile({ name, email, phone });
    setEditing(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="px-4 py-4 space-y-5">
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-2xl font-bold text-[#065F46] dark:text-[#34D399]">{l('Settings', 'Mipangilio')}</h1>
        <p className="text-sm text-[#64748B] mt-1">{l('Manage your account and preferences', 'Simamia akaunti yako na mapendeleo')}</p>
      </motion.div>

      {/* Account Section */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-bold text-[#64748B] uppercase tracking-wider">{l('Account', 'Akaunti')}</h2>
          <button onClick={() => editing ? handleSave() : setEditing(true)} className="kbtn-outline text-xs py-1 px-3 flex items-center gap-1">
            {editing ? (
              saved ? <Check className="w-3 h-3 text-[#10B981]" /> : <Save className="w-3 h-3" />
            ) : (
              <Camera className="w-3 h-3" />
            )}
            {editing ? (saved ? l('Saved!', 'Imehifadhiwa!') : l('Save', 'Hifadhi')) : l('Edit', 'Hariri')}
          </button>
        </div>
        <div className="kcard p-0 overflow-hidden">
          <div className="p-5 border-b border-[#E2E8F0] dark:border-[#475569]">
            <div className="flex items-center gap-4">
              <div className="relative">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#065F46] to-[#34D399] flex items-center justify-center text-white font-bold text-xl">
                  {user?.name?.charAt(0) || 'U'}
                </div>
                {editing && (
                  <button className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full bg-[#F59E0B] flex items-center justify-center shadow-md">
                    <Camera className="w-3.5 h-3.5 text-[#065F46]" />
                  </button>
                )}
              </div>
              <div className="flex-1">
                {editing ? (
                  <input value={name} onChange={e => setName(e.target.value)} className="kinput w-full text-sm font-semibold mb-1.5" />
                ) : (
                  <p className="font-semibold">{user?.name || 'User'}</p>
                )}
                <span className="kbadge kbadge-verified">{user?.role === 'guide' ? l('Guide', 'Mwongozo') : user?.role === 'admin' ? l('Admin', 'Msimamizi') : l('Seeker', 'Mtafutaji')}</span>
              </div>
            </div>
          </div>

          <div className="divide-y divide-[#E2E8F0] dark:divide-[#475569]">
            <div className="px-4 py-3 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <User className="w-4 h-4 text-[#065F46]" />
                <span className="text-sm">{l('Name', 'Jina')}</span>
              </div>
              {editing ? (
                <input value={name} onChange={e => setName(e.target.value)} className="kinput text-sm text-right w-48" />
              ) : (
                <span className="text-sm text-[#64748B]">{user?.name}</span>
              )}
            </div>
            <div className="px-4 py-3 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Phone className="w-4 h-4 text-[#065F46]" />
                <span className="text-sm">{l('Phone', 'Simu')}</span>
              </div>
              {editing ? (
                <input value={phone} onChange={e => setPhone(e.target.value)} className="kinput text-sm text-right w-48" />
              ) : (
                <span className="text-sm text-[#64748B]">{user?.phone}</span>
              )}
            </div>
            <div className="px-4 py-3 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Mail className="w-4 h-4 text-[#065F46]" />
                <span className="text-sm">{l('Email', 'Barua Pepe')}</span>
              </div>
              {editing ? (
                <input value={email} onChange={e => setEmail(e.target.value)} className="kinput text-sm text-right w-48" />
              ) : (
                <span className="text-sm text-[#64748B]">{user?.email || l('Not set', 'Haijawekwa')}</span>
              )}
            </div>
          </div>
        </div>
      </motion.div>

      {/* Language */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
        <h2 className="text-sm font-bold text-[#64748B] uppercase tracking-wider mb-3">{l('Preferences', 'Mapendeleo')}</h2>
        <div className="kcard p-0 overflow-hidden">
          <div className="px-4 py-3.5 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Globe className="w-4 h-4 text-[#065F46]" />
              <span className="text-sm font-medium">{l('Language', 'Lugha')}</span>
            </div>
            <div className="flex gap-1">
              <button
                onClick={() => setLanguage('sw')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${language === 'sw' ? 'bg-[#065F46] text-white' : 'bg-[#F1F5F9] dark:bg-[#334155] text-[#64748B]'}`}
              >
                Kiswahili
              </button>
              <button
                onClick={() => setLanguage('en')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${language === 'en' ? 'bg-[#065F46] text-white' : 'bg-[#F1F5F9] dark:bg-[#334155] text-[#64748B]'}`}
              >
                English
              </button>
            </div>
          </div>

          <div className="border-t border-[#E2E8F0] dark:border-[#475569]">
            <div className="px-4 py-3.5 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Bell className="w-4 h-4 text-[#065F46]" />
                <div>
                  <span className="text-sm font-medium">{l('Push Notifications', 'Arifa za Simu')}</span>
                  <p className="text-[10px] text-[#64748B]">{l('Session alerts, payments', 'Arifa za vipindi, malipo')}</p>
                </div>
              </div>
              <button onClick={() => setPushNotif(!pushNotif)}>
                <div className={`w-10 h-5.5 rounded-full relative transition-colors ${pushNotif ? 'bg-[#065F46]' : 'bg-[#E2E8F0] dark:bg-[#475569]'}`}>
                  <div className={`w-4 h-4 rounded-full bg-white absolute top-0.5 transition-all shadow-sm ${pushNotif ? 'right-0.5' : 'left-0.5'}`} />
                </div>
              </button>
            </div>
          </div>

          <div className="border-t border-[#E2E8F0] dark:border-[#475569]">
            <div className="px-4 py-3.5 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Mail className="w-4 h-4 text-[#065F46]" />
                <div>
                  <span className="text-sm font-medium">{l('Email Notifications', 'Arifa za Barua Pepe')}</span>
                  <p className="text-[10px] text-[#64748B]">{l('Updates, promotions', 'Taarifa, matangazo')}</p>
                </div>
              </div>
              <button onClick={() => setEmailNotif(!emailNotif)}>
                <div className={`w-10 h-5.5 rounded-full relative transition-colors ${emailNotif ? 'bg-[#065F46]' : 'bg-[#E2E8F0] dark:bg-[#475569]'}`}>
                  <div className={`w-4 h-4 rounded-full bg-white absolute top-0.5 transition-all shadow-sm ${emailNotif ? 'right-0.5' : 'left-0.5'}`} />
                </div>
              </button>
            </div>
          </div>

          <div className="border-t border-[#E2E8F0] dark:border-[#475569]">
            <div className="px-4 py-3.5 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Eye className="w-4 h-4 text-[#065F46]" />
                <div>
                  <span className="text-sm font-medium">{l('Profile Visibility', 'Mwonekano wa Wasifu')}</span>
                  <p className="text-[10px] text-[#64748B]">{l('Visible to other users', 'Inaonekana kwa wengine')}</p>
                </div>
              </div>
              <button onClick={() => setProfileVisible(!profileVisible)}>
                <div className={`w-10 h-5.5 rounded-full relative transition-colors ${profileVisible ? 'bg-[#065F46]' : 'bg-[#E2E8F0] dark:bg-[#475569]'}`}>
                  <div className={`w-4 h-4 rounded-full bg-white absolute top-0.5 transition-all shadow-sm ${profileVisible ? 'right-0.5' : 'left-0.5'}`} />
                </div>
              </button>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Quick Links */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
        <h2 className="text-sm font-bold text-[#64748B] uppercase tracking-wider mb-3">{l('More', 'Zaidi')}</h2>
        <div className="kcard p-0 overflow-hidden">
          {[
            { icon: Shield, label: l('Security Center', 'Kituo cha Usalama'), href: '/settings/security', badge: null },
            { icon: CreditCard, label: l('Wallet', 'Mkoba'), href: '/wallet', badge: null },
            ...(user?.role === 'guide' ? [{ icon: ShieldCheck, label: l('Subscription', 'Usajili'), href: '/guide/subscriptions', badge: subscriptionTier !== 'starter' ? subscriptionTier.toUpperCase() : null }] : []),
            { icon: HelpCircle, label: l('Help & Support', 'Msaada'), href: '#', badge: null },
            { icon: MessageSquare, label: l('Feedback', 'Maoni'), href: '#', badge: null },
            { icon: FileText, label: l('Terms of Service', 'Masharti ya Huduma'), href: '#', badge: null },
            { icon: Info, label: l('About Chimbo Direct', 'Kuhusu Chimbo Direct'), href: '#', badge: l('v2.0', 'v2.0') },
          ].map((item, i) => (
            <button
              key={i}
              onClick={() => item.href !== '#' && router.push(item.href)}
              className="w-full flex items-center justify-between px-4 py-3.5 hover:bg-[#F1F5F9] dark:hover:bg-[#334155] transition-colors border-b border-[#E2E8F0] dark:border-[#475569] last:border-0"
            >
              <div className="flex items-center gap-3">
                <item.icon className="w-4 h-4 text-[#065F46]" />
                <span className="text-sm font-medium">{item.label}</span>
              </div>
              <div className="flex items-center gap-2">
                {item.badge && <span className="kbadge kbadge-gold text-[8px]">{item.badge}</span>}
                <ChevronRight className="w-4 h-4 text-[#64748B]" />
              </div>
            </button>
          ))}
        </div>
      </motion.div>

      {/* Logout */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}>
        <button
          onClick={() => { logout(); router.replace('/auth'); }}
          className="w-full py-3 rounded-xl border-2 border-[#DC2626] text-[#DC2626] font-semibold text-sm hover:bg-[#FEE2E2] dark:hover:bg-[#2D1B1B] transition-colors flex items-center justify-center gap-2 active:scale-95"
        >
          <LogOut className="w-4 h-4" />{l('Logout', 'Toka')}
        </button>
      </motion.div>

      <div className="text-center py-4">
        <p className="text-[10px] text-[#64748B]">Chimbo Direct v2.0 · {l('Made with love in Kariakoo', 'Imetengenezwa kwa upendo Kariakoo')}</p>
      </div>
    </div>
  );
}

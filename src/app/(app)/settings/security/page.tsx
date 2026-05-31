'use client';

import { useState } from 'react';
import { useAuthStore } from '@/lib/stores/auth-store';
import { motion } from 'framer-motion';
import {
  Shield, Lock, Smartphone, Eye, EyeOff, Key, Fingerprint,
  Monitor, MapPin, Clock, CheckCircle2, AlertTriangle, ChevronRight,
  ToggleLeft, ToggleRight, LogOut, Trash2, Download
} from 'lucide-react';

const ACTIVE_SESSIONS = [
  { id: 's1', device: 'iPhone 15 Pro', location: 'Dar es Salaam, TZ', lastActive: 'Now', current: true },
  { id: 's2', device: 'Chrome on Windows', location: 'Dar es Salaam, TZ', lastActive: '2 hours ago', current: false },
  { id: 's3', device: 'Samsung Galaxy S24', location: 'Kariakoo, TZ', lastActive: '1 day ago', current: false },
];

const LOGIN_HISTORY = [
  { id: 'l1', device: 'iPhone 15 Pro', ip: '196.138.xxx.xx', time: 'Today 9:45 AM', success: true },
  { id: 'l2', device: 'Chrome on Windows', ip: '196.138.xxx.xx', time: 'Yesterday 3:20 PM', success: true },
  { id: 'l3', device: 'Unknown Device', ip: '45.33.xxx.xx', time: 'May 28, 4:15 AM', success: false },
  { id: 'l4', device: 'Samsung Galaxy S24', ip: '196.138.xxx.xx', time: 'May 27, 11:30 AM', success: true },
  { id: 'l5', device: 'Unknown Device', ip: '103.45.xxx.xx', time: 'May 25, 2:00 AM', success: false },
];

export default function SecurityPage() {
  const { language } = useAuthStore();
  const sw = language === 'sw';
  const l = (en: string, swText: string) => (sw ? swText : en);

  const [twoFA, setTwoFA] = useState(false);
  const [pinLock, setPinLock] = useState(false);
  const [showSetup2FA, setShowSetup2FA] = useState(false);
  const [showSetupPIN, setShowSetupPIN] = useState(false);
  const [pinDigits, setPinDigits] = useState(['', '', '', '']);
  const [verificationCode, setVerificationCode] = useState('');
  const [profileVisible, setProfileVisible] = useState(true);
  const [showPhone, setShowPhone] = useState(false);
  const [showEmail, setShowEmail] = useState(false);

  const securityScore = 45 + (twoFA ? 25 : 0) + (pinLock ? 20 : 0) + (showPhone || showEmail ? 0 : 10);

  const scoreColor = securityScore >= 80 ? '#10B981' : securityScore >= 50 ? '#F59E0B' : '#E63946';
  const scoreLabel = securityScore >= 80 ? l('Strong', 'Imara') : securityScore >= 50 ? l('Moderate', 'Wastani') : l('Weak', 'Dhaifu');

  return (
    <div className="px-4 py-4 space-y-5">
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-2xl font-bold text-[#0A4D3C] dark:text-[#2EA77A]">{l('Security Center', 'Kituo cha Usalama')}</h1>
        <p className="text-sm text-[#6C757D] mt-1">{l('Protect your account and data', 'Linda akaunti yako na data yako')}</p>
      </motion.div>

      {/* Security Score */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="kcard-green p-5">
        <div className="flex items-center justify-between mb-3">
          <span className="text-sm text-white/70">{l('Security Score', 'Alama ya Usalama')}</span>
          <Shield className="w-5 h-5 text-[#FFD23F]" />
        </div>
        <div className="flex items-center gap-4">
          <div className="relative w-20 h-20">
            <svg className="w-20 h-20 -rotate-90" viewBox="0 0 80 80">
              <circle cx="40" cy="40" r="34" fill="none" stroke="rgba(255,255,255,0.15)" strokeWidth="6" />
              <circle cx="40" cy="40" r="34" fill="none" stroke={scoreColor} strokeWidth="6" strokeLinecap="round" strokeDasharray={`${(securityScore / 100) * 213.6} 213.6`} className="transition-all duration-1000" />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-2xl font-bold text-white">{securityScore}</span>
            </div>
          </div>
          <div>
            <p className="text-lg font-bold text-white">{scoreLabel}</p>
            <p className="text-xs text-white/60 mt-1">
              {!twoFA && l('Enable 2FA for +25 points', 'Washa 2FA kwa alama +25')}
              {twoFA && !pinLock && l('Enable PIN lock for +20 points', 'Washa PIN kwa alama +20')}
              {twoFA && pinLock && l('Your account is well protected', 'Akaunti yako imekulindwa vizuri')}
            </p>
          </div>
        </div>
      </motion.div>

      {/* Two-Factor Authentication */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} className="kcard p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#E8F5EE] flex items-center justify-center">
              <Smartphone className="w-5 h-5 text-[#0B5D3A]" />
            </div>
            <div>
              <p className="font-semibold text-sm">{l('Two-Factor Auth', 'Uthibitishaji wa Pili')}</p>
              <p className="text-xs text-[#6C757D]">{twoFA ? l('Enabled', 'Imewashwa') : l('Disabled', 'Imezimwa')}</p>
            </div>
          </div>
          <button onClick={() => { if (!twoFA) setShowSetup2FA(true); else setTwoFA(false); }} className="transition-all">
            {twoFA ? (
              <ToggleRight className="w-10 h-6 text-[#0A4D3C]" />
            ) : (
              <ToggleLeft className="w-10 h-6 text-[#E9ECEF]" />
            )}
          </button>
        </div>

        {showSetup2FA && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="mt-4 space-y-3 pt-3 border-t border-[#E9ECEF] dark:border-[#30363D]">
            <p className="text-xs text-[#6C757D]">{l('Set up 2FA using an authenticator app', 'Weka 2FA kwa kutumia programu ya uthibitishaji')}</p>
            <div className="space-y-2">
              {[
                l('1. Install Google Authenticator or Authy', '1. Sakinisha Google Authenticator au Authy'),
                l('2. Scan the QR code below', '2. Piga picha ya QR code hapa chini'),
                l('3. Enter the 6-digit verification code', '3. Weka kodi ya uthibitishaji ya tarakimu 6'),
              ].map((step, i) => (
                <div key={i} className="flex items-start gap-2 text-xs">
                  <CheckCircle2 className="w-4 h-4 text-[#0A4D3A] shrink-0 mt-0.5" />
                  <span>{step}</span>
                </div>
              ))}
            </div>
            {/* Simulated QR Code */}
            <div className="w-32 h-32 mx-auto bg-[#F1F3F5] dark:bg-[#21262D] rounded-xl flex items-center justify-center border-2 border-dashed border-[#E9ECEF] dark:border-[#30363D]">
              <div className="grid grid-cols-5 gap-0.5">
                {Array.from({ length: 25 }).map((_, i) => (
                  <div key={i} className={`w-4 h-4 rounded-sm ${Math.random() > 0.4 ? 'bg-[#0A4D3C]' : 'bg-transparent'}`} />
                ))}
              </div>
            </div>
            <div>
              <label className="text-xs font-medium mb-1 block">{l('Verification Code', 'Kodi ya Uthibitishaji')}</label>
              <input value={verificationCode} onChange={e => setVerificationCode(e.target.value)} maxLength={6} className="kinput w-full text-center tracking-[0.3em] font-mono" placeholder="000000" />
            </div>
            <button
              onClick={() => { if (verificationCode.length >= 4) { setTwoFA(true); setShowSetup2FA(false); setVerificationCode(''); } }}
              className="kbtn w-full text-sm"
              disabled={verificationCode.length < 4}
            >
              {l('Enable 2FA', 'Washa 2FA')}
            </button>
          </motion.div>
        )}
      </motion.div>

      {/* PIN Lock */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="kcard p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#FEF3C7] flex items-center justify-center">
              <Key className="w-5 h-5 text-[#D97706]" />
            </div>
            <div>
              <p className="font-semibold text-sm">{l('Transaction PIN', 'PIN ya Miamala')}</p>
              <p className="text-xs text-[#6C757D]">{pinLock ? l('Enabled', 'Imewashwa') : l('Protect transactions with PIN', 'Linda miamala kwa PIN')}</p>
            </div>
          </div>
          <button onClick={() => { if (!pinLock) setShowSetupPIN(true); else setPinLock(false); }} className="transition-all">
            {pinLock ? <ToggleRight className="w-10 h-6 text-[#0A4D3C]" /> : <ToggleLeft className="w-10 h-6 text-[#E9ECEF]" />}
          </button>
        </div>

        {showSetupPIN && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="mt-4 space-y-3 pt-3 border-t border-[#E9ECEF] dark:border-[#30363D]">
            <p className="text-xs text-[#6C757D]">{l('Create a 4-digit PIN for transactions', 'Unda PIN ya tarakimu 4 kwa miamala')}</p>
            <div className="flex items-center justify-center gap-3">
              {pinDigits.map((digit, i) => (
                <input
                  key={i}
                  type="password"
                  maxLength={1}
                  value={digit}
                  onChange={e => {
                    const newDigits = [...pinDigits];
                    newDigits[i] = e.target.value;
                    setPinDigits(newDigits);
                    if (e.target.value && i < 3) {
                      const next = e.target.nextElementSibling as HTMLInputElement;
                      next?.focus();
                    }
                  }}
                  className="w-14 h-14 rounded-xl border-2 border-[#E9ECEF] dark:border-[#30363D] text-center text-2xl font-bold focus:border-[#0A4D3C] focus:ring-2 focus:ring-[#0A4D3C]/20 outline-none transition-all"
                />
              ))}
            </div>
            <button
              onClick={() => { if (pinDigits.every(d => d !== '')) { setPinLock(true); setShowSetupPIN(false); setPinDigits(['', '', '', '']); } }}
              className="kbtn w-full text-sm"
              disabled={!pinDigits.every(d => d !== '')}
            >
              {l('Set PIN', 'Weka PIN')}
            </button>
          </motion.div>
        )}
      </motion.div>

      {/* Active Sessions */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}>
        <h2 className="text-lg font-bold mb-3">{l('Active Sessions', 'Vikao Hai')}</h2>
        <div className="space-y-2">
          {ACTIVE_SESSIONS.map((session, i) => (
            <div key={session.id} className="kcard p-3.5 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-[#F1F3F5] dark:bg-[#21262D] flex items-center justify-center">
                  <Monitor className="w-4 h-4 text-[#6C757D]" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium">{session.device}</p>
                    {session.current && <span className="kbadge kbadge-verified text-[8px]">{l('Current', 'Hii')}</span>}
                  </div>
                  <p className="text-[10px] text-[#6C757D]"><MapPin className="w-3 h-3 inline mr-0.5" />{session.location} · {session.lastActive}</p>
                </div>
              </div>
              {!session.current && (
                <button className="text-[10px] font-medium text-[#E63946] px-2 py-1 rounded-lg border border-[#FEE2E2] hover:bg-[#FEE2E2] transition-colors">
                  {l('Revoke', 'Futa')}
                </button>
              )}
            </div>
          ))}
        </div>
      </motion.div>

      {/* Login History */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
        <h2 className="text-lg font-bold mb-3">{l('Login History', 'Historia ya Kuingia')}</h2>
        <div className="space-y-2">
          {LOGIN_HISTORY.map((login, i) => (
            <div key={login.id} className="kcard p-3 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${login.success ? 'bg-[#E8F5EE]' : 'bg-[#FEE2E2]'}`}>
                  {login.success ? <CheckCircle2 className="w-4 h-4 text-[#0B5D3A]" /> : <AlertTriangle className="w-4 h-4 text-[#E63946]" />}
                </div>
                <div>
                  <p className="text-xs font-medium">{login.device}</p>
                  <p className="text-[10px] text-[#6C757D]">{login.ip} · {login.time}</p>
                </div>
              </div>
              <span className={`kbadge text-[8px] ${login.success ? 'kbadge-verified' : 'kbadge-urgent'}`}>
                {login.success ? l('Success', 'Mafanikio') : l('Failed', 'Imeshindwa')}
              </span>
            </div>
          ))}
        </div>
      </motion.div>

      {/* Privacy Controls */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }}>
        <h2 className="text-lg font-bold mb-3">{l('Privacy Controls', 'Vidhibiti vya Faragha')}</h2>
        <div className="kcard p-0 overflow-hidden">
          {[
            { icon: Eye, label: l('Profile Visibility', 'Mwonekano wa Wasifu'), sublabel: l('Visible to other users', 'Inaonekana kwa watumiaji wengine'), value: profileVisible, setter: setProfileVisible },
            { icon: Smartphone, label: l('Show Phone Number', 'Onesha Namba ya Simu'), sublabel: l('Visible on your profile', 'Inaonekana kwenye wasifu wako'), value: showPhone, setter: setShowPhone },
            { icon: Lock, label: l('Show Email', 'Onesha Barua Pepe'), sublabel: l('Visible on your profile', 'Inaonekana kwenye wasifu wako'), value: showEmail, setter: setShowEmail },
          ].map((item, i) => (
            <div key={i} className="flex items-center justify-between px-4 py-3.5 border-b border-[#E9ECEF] dark:border-[#30363D] last:border-0">
              <div className="flex items-center gap-3">
                <item.icon className="w-4 h-4 text-[#0B5D3A]" />
                <div>
                  <p className="text-sm font-medium">{item.label}</p>
                  <p className="text-[10px] text-[#6C757D]">{item.sublabel}</p>
                </div>
              </div>
              <button onClick={() => item.setter(!item.value)}>
                {item.value ? <ToggleRight className="w-9 h-5 text-[#0A4D3C]" /> : <ToggleLeft className="w-9 h-5 text-[#E9ECEF]" />}
              </button>
            </div>
          ))}
        </div>
      </motion.div>

      {/* Danger Zone */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="kcard p-4 border-2 border-[#FEE2E2]">
        <h3 className="font-semibold text-sm text-[#E63946] mb-3">{l('Danger Zone', 'Eneo la Hatari')}</h3>
        <div className="space-y-2">
          <button className="w-full flex items-center justify-between p-3 rounded-xl hover:bg-[#FEE2E2] dark:hover:bg-[#3D1F1F] transition-colors">
            <div className="flex items-center gap-2">
              <Download className="w-4 h-4 text-[#6C757D]" />
              <span className="text-sm">{l('Export My Data', 'Hamisha Data Yangu')}</span>
            </div>
            <ChevronRight className="w-4 h-4 text-[#6C757D]" />
          </button>
          <button className="w-full flex items-center justify-between p-3 rounded-xl hover:bg-[#FEE2E2] dark:hover:bg-[#3D1F1F] transition-colors">
            <div className="flex items-center gap-2">
              <LogOut className="w-4 h-4 text-[#E63946]" />
              <span className="text-sm text-[#E63946]">{l('Sign Out All Devices', 'Toka kwa Vifaa Vyote')}</span>
            </div>
            <ChevronRight className="w-4 h-4 text-[#E63946]" />
          </button>
          <button className="w-full flex items-center justify-between p-3 rounded-xl hover:bg-[#FEE2E2] dark:hover:bg-[#3D1F1F] transition-colors">
            <div className="flex items-center gap-2">
              <Trash2 className="w-4 h-4 text-[#E63946]" />
              <span className="text-sm text-[#E63946]">{l('Delete Account', 'Futa Akaunti')}</span>
            </div>
            <ChevronRight className="w-4 h-4 text-[#E63946]" />
          </button>
        </div>
      </motion.div>
    </div>
  );
}

'use client';
import { useAuthStore } from '@/lib/stores/auth-store';
import { motion } from 'framer-motion';
import { User, Phone, MapPin, Star, Settings, Bell, Shield, HelpCircle, LogOut } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function SeekerProfilePage() {
  const { user, language, logout } = useAuthStore();
  const router = useRouter();
  const sw = language === 'sw';
  const l = (en: string, swText: string) => (sw ? swText : en);

  const handleLogout = async () => { logout(); router.replace('/auth'); };

  return (
    <div className="px-4 py-4 space-y-5">
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="kcard p-5 text-center">
        <div className="w-20 h-20 rounded-full bg-[#0B5D3A] flex items-center justify-center text-white font-bold text-2xl mx-auto mb-3">
          {user?.name?.charAt(0) || 'U'}
        </div>
        <h2 className="text-xl font-bold">{user?.name || 'User'}</h2>
        <p className="text-sm text-[#6C757D] mt-0.5">{user?.phone}</p>
        <span className="kbadge kbadge-verified mt-2 inline-flex">{l('Seeker', 'Mtafutaji')}</span>
      </motion.div>

      <div className="kcard p-0 overflow-hidden">
        {[
          { icon: Star, label: l('My Reviews', 'Mapitio Yangu'), href: '/seeker/history' },
          { icon: MapPin, label: l('Saved Zones', 'Maeneo Yaliyohifadhiwa'), href: '/market' },
          { icon: Bell, label: l('Notifications', 'Arifa'), href: '#' },
          { icon: Settings, label: l('Settings', 'Mipangilio'), href: '#' },
          { icon: Shield, label: l('Privacy & Security', 'Faragha na Usalama'), href: '#' },
          { icon: HelpCircle, label: l('Help & Support', 'Msaada'), href: '#' },
        ].map((item, i) => (
          <button key={i} onClick={() => item.href !== '#' && router.push(item.href)} className="w-full flex items-center gap-3 px-4 py-3.5 hover:bg-[#F1F3F5] dark:hover:bg-[#21262D] transition-colors border-b border-[#E9ECEF] dark:border-[#30363D] last:border-0">
            <item.icon className="w-4.5 h-4.5 text-[#0B5D3A]" />
            <span className="text-sm font-medium flex-1 text-left">{item.label}</span>
            <span className="text-[#6C757D] text-xs">›</span>
          </button>
        ))}
      </div>

      <button onClick={handleLogout} className="w-full py-3 rounded-lg border border-[#E63946] text-[#E63946] font-medium text-sm hover:bg-[#FEE2E2] transition-colors flex items-center justify-center gap-2">
        <LogOut className="w-4 h-4" />{l('Logout', 'Toka')}
      </button>
    </div>
  );
}

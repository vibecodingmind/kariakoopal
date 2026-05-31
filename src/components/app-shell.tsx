'use client';

import { usePathname, useRouter } from 'next/navigation';
import { useAuthStore } from '@/lib/stores/auth-store';
import { useAppStore } from '@/lib/stores/app-store';
import {
  Compass,
  Store,
  Search,
  Calendar,
  User,
  Home,
  MapPin,
  DollarSign,
  Shield,
  Users,
} from 'lucide-react';
import { LanguageToggle } from '@/components/language-toggle';
import { Moon, Sun, LogOut, ChevronDown } from 'lucide-react';
import { useState, useEffect, useRef, useCallback } from 'react';
import { signOut, useSession } from 'next-auth/react';
import { motion, AnimatePresence } from 'framer-motion';

// ── NextAuth Session Sync ──
function NextAuthSessionSync() {
  const { data: session } = useSession();
  const { setUser, setGuideProfile, isAuthenticated } = useAuthStore();
  const syncedRef = useRef(false);

  useEffect(() => { if (!isAuthenticated) syncedRef.current = false; }, [isAuthenticated]);

  useEffect(() => {
    if (session?.user && !isAuthenticated && !syncedRef.current) {
      syncedRef.current = true;
      const u = session.user;
      const user = {
        id: (u as Record<string, unknown>).dbId as string || u.id || '',
        phone: (u as Record<string, unknown>).phone as string || '',
        email: u.email || null,
        name: u.name || '',
        role: ((u as Record<string, unknown>).role as string || 'seeker') as 'seeker' | 'guide' | 'admin',
        languagePref: ((u as Record<string, unknown>).languagePref as string || 'sw') as 'sw' | 'en',
        avatarUrl: ((u as Record<string, unknown>).avatarUrl as string) || u.image || null,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      setUser(user);
      if (user.role === 'guide' && user.id) {
        fetch(`/api/guides/${user.id}`)
          .then(res => res.ok ? res.json() : null)
          .then(data => { if (data?.guideProfile) setGuideProfile(data.guideProfile); })
          .catch(() => {});
      }
    }
  }, [session, isAuthenticated, setUser, setGuideProfile]);
  return null;
}

// ── Bottom Navigation ──
function BottomNav() {
  const pathname = usePathname();
  const router = useRouter();
  const { user } = useAuthStore();

  const publicTabs = [
    { href: '/', icon: Home, label: 'Home', labelSw: 'Nyumbani' },
    { href: '/guides', icon: Compass, label: 'Guides', labelSw: 'Miongozo' },
    { href: '/prices', icon: DollarSign, label: 'Prices', labelSw: 'Bei' },
    { href: '/events', icon: Calendar, label: 'Events', labelSw: 'Matukio' },
    { href: '/vendors', icon: Store, label: 'Vendors', labelSw: 'Wauzaji' },
  ];

  const seekerTabs = [
    { href: '/', icon: Home, label: 'Home', labelSw: 'Nyumbani' },
    { href: '/market', icon: Store, label: 'Market', labelSw: 'Soko' },
    { href: '/seeker/find', icon: Search, label: 'Find Guide', labelSw: 'Tafuta' },
    { href: '/prices', icon: DollarSign, label: 'Prices', labelSw: 'Bei' },
    { href: '/seeker/profile', icon: User, label: 'Profile', labelSw: 'Wasifu' },
  ];

  const guideTabs = [
    { href: '/guide', icon: Home, label: 'Home', labelSw: 'Nyumbani' },
    { href: '/guide/sessions', icon: MapPin, label: 'Sessions', labelSw: 'Vipindi' },
    { href: '/guide/packages', icon: Compass, label: 'Packages', labelSw: 'Pakiti' },
    { href: '/guide/earnings', icon: DollarSign, label: 'Earnings', labelSw: 'Mapato' },
    { href: '/guide/profile', icon: User, label: 'Profile', labelSw: 'Wasifu' },
  ];

  const adminTabs = [
    { href: '/admin', icon: Home, label: 'Dashboard', labelSw: 'Dashibodi' },
    { href: '/admin/guides', icon: Users, label: 'Guides', labelSw: 'Miongozo' },
    { href: '/admin/vendors', icon: Store, label: 'Vendors', labelSw: 'Wauzaji' },
    { href: '/admin/disputes', icon: Shield, label: 'Disputes', labelSw: 'Migogoro' },
    { href: '/admin/fraud', icon: Search, label: 'Fraud', labelSw: 'Dhuluma' },
  ];

  const isAuth = useAuthStore(s => s.isAuthenticated);
  const language = useAuthStore(s => s.language);
  const sw = language === 'sw';

  let tabs = publicTabs;
  if (isAuth && user?.role === 'seeker') tabs = seekerTabs;
  else if (isAuth && user?.role === 'guide') tabs = guideTabs;
  else if (isAuth && user?.role === 'admin') tabs = adminTabs;

  const isActive = (href: string) => {
    if (href === '/') return pathname === '/';
    if (href === '/seeker' || href === '/guide' || href === '/admin') return pathname === href;
    return pathname.startsWith(href);
  };

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bottom-nav safe-area-bottom">
      <div className="max-w-lg mx-auto flex items-center justify-around h-16 px-2">
        {tabs.map((tab) => {
          const active = isActive(tab.href);
          return (
            <button
              key={tab.href + tab.label}
              onClick={() => router.push(tab.href)}
              className={`bottom-nav-item ${active ? 'bottom-nav-item-active' : 'bottom-nav-item-inactive'}`}
            >
              <div className="relative">
                {active && <div className="bottom-nav-indicator" />}
                <tab.icon className={`w-5 h-5 transition-all duration-300 ${active ? 'bottom-nav-icon-active stroke-[2.5]' : 'stroke-[1.5]'}`} />
              </div>
              <span className={`text-[10px] transition-all duration-300 ${active ? 'font-bold' : 'font-medium'}`}>
                {sw ? tab.labelSw : tab.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}

// ── Top Header ──
function TopHeader() {
  const { user, language, logout, isAuthenticated } = useAuthStore();
  const { darkMode, setDarkMode } = useAppStore();
  const router = useRouter();
  const [showMenu, setShowMenu] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (darkMode) document.documentElement.classList.add('dark');
    else document.documentElement.classList.remove('dark');
  }, [darkMode]);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setShowMenu(false);
    };
    if (showMenu) {
      document.addEventListener('mousedown', handleClick);
      return () => document.removeEventListener('mousedown', handleClick);
    }
  }, [showMenu]);

  const handleLogout = useCallback(async () => {
    try { await signOut({ redirect: false }); } catch {}
    logout(); setShowMenu(false); router.replace('/auth');
  }, [logout, router]);

  const sw = language === 'sw';

  return (
    <header className="knav sticky top-0 z-50">
      <div className="flex items-center justify-between px-4 h-14 max-w-4xl mx-auto">
        <button onClick={() => router.push('/')} className="flex items-center gap-2.5 group">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#0A4D3C] to-[#2EA77A] flex items-center justify-center shadow-sm group-hover:shadow-md transition-shadow">
            <Compass className="w-4.5 h-4.5 text-white" strokeWidth={2.5} />
          </div>
          <span className="text-sm font-bold gradient-text-green hidden sm:block">
            Kariako<span className="text-[#FFD23F]">Guide</span>
          </span>
        </button>

        <div className="flex items-center gap-1.5">
          <LanguageToggle className="border border-[#E9ECEF] dark:border-[#30363D] rounded-full" />
          <button
            onClick={() => setDarkMode(!darkMode)}
            className="w-9 h-9 rounded-xl flex items-center justify-center border border-[#E9ECEF] dark:border-[#30363D] hover:bg-[#F1F3F5] dark:hover:bg-[#21262D] transition-all"
          >
            {darkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>

          {isAuthenticated && user ? (
            <div className="relative" ref={menuRef}>
              <button onClick={() => setShowMenu(!showMenu)} className="flex items-center gap-1.5 group">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#0A4D3C] to-[#2EA77A] flex items-center justify-center text-white text-xs font-bold group-hover:shadow-md group-hover:ring-2 group-hover:ring-[#0A4D3C]/20 transition-all">
                  {user.name?.charAt(0) || 'U'}
                </div>
                <ChevronDown className="w-3 h-3 text-[#6C757D] hidden sm:block" />
              </button>
              <AnimatePresence>
                {showMenu && (
                  <motion.div
                    initial={{ opacity: 0, y: -8, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -8, scale: 0.95 }}
                    transition={{ duration: 0.2 }}
                    className="absolute right-0 top-full mt-2 w-56 kcard-glass p-0 overflow-hidden z-50"
                  >
                    <div className="p-4 border-b border-[#E9ECEF] dark:border-[#30363D]">
                      <p className="font-semibold text-sm">{user.name}</p>
                      <p className="text-xs text-[#6C757D] dark:text-[#8B949E] mt-0.5">{user.phone || user.email}</p>
                      <span className="inline-block mt-2 text-xs font-semibold text-[#0A4D3C] dark:text-[#2EA77A] capitalize px-2 py-0.5 rounded-md bg-[#E8F5EE] dark:bg-[#0D2818]">{user.role}</span>
                    </div>
                    <div className="p-2">
                      <button onClick={handleLogout} className="w-full flex items-center gap-2 px-3 py-2.5 text-sm text-[#E63946] hover:bg-[#FEE2E2] dark:hover:bg-[#3D1F1F] rounded-xl transition-colors">
                        <LogOut className="w-4 h-4" />{sw ? 'Toka' : 'Logout'}
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ) : (
            <button
              onClick={() => router.push('/auth')}
              className="kbtn text-xs py-2 px-4"
            >
              {sw ? 'Ingia' : 'Login'}
            </button>
          )}
        </div>
      </div>
    </header>
  );
}

// ── Main App Shell ──
export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  // Only hide shell on auth page
  const isAuth = pathname === '/auth';

  if (isAuth) {
    return <>{children}</>;
  }

  return (
    <>
      <NextAuthSessionSync />
      <div className="min-h-screen flex flex-col bg-[#F8F9FA] dark:bg-[#0D1117]">
        <TopHeader />
        <main className="flex-1 pb-20 max-w-4xl mx-auto w-full">
          {children}
        </main>
        <BottomNav />
      </div>
    </>
  );
}

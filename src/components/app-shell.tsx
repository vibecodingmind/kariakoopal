'use client';

import { usePathname, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuthStore } from '@/lib/stores/auth-store';
import { useAppStore } from '@/lib/stores/app-store';
import { useNotificationStore } from '@/lib/stores/notification-store';
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
  Bell,
  Wallet,
  Settings,
} from 'lucide-react';
import { LanguageToggle } from '@/components/language-toggle';
import { Moon, Sun, LogOut, ChevronDown, ChevronRight } from 'lucide-react';
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

// ── Navigation Progress Bar ──
function NavProgress() {
  const pathname = usePathname();
  const [progress, setProgress] = useState(0);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    setVisible(true);
    setProgress(30);
    const t1 = setTimeout(() => setProgress(70), 50);
    const t2 = setTimeout(() => setProgress(100), 150);
    const t3 = setTimeout(() => setVisible(false), 400);
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); };
  }, [pathname]);

  if (!visible) return null;

  return (
    <div className="fixed top-0 left-0 right-0 z-[100] h-[3px]">
      <div
        className="h-full bg-gradient-to-r from-[#312E81] via-[#818CF8] to-[#D97706] transition-all duration-200 ease-out"
        style={{ width: `${progress}%` }}
      />
    </div>
  );
}

// ── Bottom Navigation (Link-based for instant prefetch) ──
function BottomNav() {
  const pathname = usePathname();
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
          const Icon = tab.icon;
          return (
            <Link
              key={tab.href + tab.label}
              href={tab.href}
              prefetch={true}
              className={`bottom-nav-item ${active ? 'bottom-nav-item-active' : 'bottom-nav-item-inactive'}`}
            >
              <div className={`relative flex items-center justify-center transition-all duration-200 ${active ? 'bottom-nav-icon-pill' : ''}`}>
                <Icon className={`w-5 h-5 transition-all duration-200 ${active ? 'bottom-nav-icon-active stroke-[2.5]' : 'stroke-[1.5]'}`} />
              </div>
              <span className={`text-[10px] transition-all duration-200 ${active ? 'font-bold' : 'font-medium'}`}>
                {sw ? tab.labelSw : tab.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

// ── Top Header ──
function TopHeader() {
  const { user, language, logout, isAuthenticated, walletBalance } = useAuthStore();
  const unreadCount = useNotificationStore(s => s.unreadCount);
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

  const profileHref = user?.role === 'guide' ? '/guide/profile' : user?.role === 'admin' ? '/admin' : '/seeker/profile';

  return (
    <header className="knav sticky top-0 z-50">
      <div className="flex items-center justify-between px-4 h-14 max-w-4xl mx-auto">
        <Link href="/" prefetch={true} className="flex items-center gap-2.5 group">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#312E81] to-[#818CF8] flex items-center justify-center shadow-sm group-hover:shadow-md transition-shadow">
            <Compass className="w-4.5 h-4.5 text-white" strokeWidth={2.5} />
          </div>
          <span className="text-sm font-bold gradient-text-green hidden sm:block">
            Kariako<span className="text-[#D97706]">Guide</span>
          </span>
        </Link>

        <div className="flex items-center gap-1">
          <LanguageToggle className="border border-[#E7E5E4] dark:border-[#2E2C4A] rounded-full" />
          <button
            onClick={() => setDarkMode(!darkMode)}
            className="w-9 h-9 rounded-xl flex items-center justify-center border border-[#E7E5E4] dark:border-[#2E2C4A] hover:bg-[#F5F5F4] dark:hover:bg-[#242244] transition-all active:scale-90"
          >
            {darkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>

          {isAuthenticated && user ? (
            <>
              {/* Wallet Badge */}
              <button
                onClick={() => router.push('/wallet')}
                className="h-8 px-2.5 rounded-xl flex items-center gap-1.5 bg-[#E0E7FF] dark:bg-[#1E1B4B] border border-[#312E81]/10 dark:border-[#818CF8]/20 hover:shadow-sm transition-all active:scale-95"
              >
                <Wallet className="w-3.5 h-3.5 text-[#312E81] dark:text-[#818CF8]" />
                <span className="text-[10px] font-bold text-[#312E81] dark:text-[#818CF8]">{(walletBalance / 1000).toFixed(0)}K</span>
              </button>

              {/* Notification Bell */}
              <button
                onClick={() => router.push('/notifications')}
                className="w-9 h-9 rounded-xl flex items-center justify-center border border-[#E7E5E4] dark:border-[#2E2C4A] hover:bg-[#F5F5F4] dark:hover:bg-[#242244] transition-all active:scale-90 relative"
              >
                <Bell className="w-4 h-4" />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-4.5 h-4.5 rounded-full bg-[#DC2626] text-white text-[8px] font-bold flex items-center justify-center animate-scale-in">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </button>

              {/* User Menu */}
              <div className="relative" ref={menuRef}>
                <button onClick={() => setShowMenu(!showMenu)} className="flex items-center gap-1.5 group active:scale-95 transition-transform">
                  <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#312E81] to-[#818CF8] flex items-center justify-center text-white text-xs font-bold group-hover:shadow-md group-hover:ring-2 group-hover:ring-[#312E81]/20 transition-all">
                    {user.name?.charAt(0) || 'U'}
                  </div>
                  <ChevronDown className="w-3 h-3 text-[#78716C] hidden sm:block" />
                </button>
                <AnimatePresence>
                  {showMenu && (
                    <motion.div
                      initial={{ opacity: 0, y: -8, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: -8, scale: 0.95 }}
                      transition={{ duration: 0.15 }}
                      className="absolute right-0 top-full mt-2 w-60 kcard-glass p-0 overflow-hidden z-50"
                    >
                      <div className="p-4 border-b border-[#E7E5E4] dark:border-[#2E2C4A]">
                        <div className="flex items-center gap-2.5">
                          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#312E81] to-[#818CF8] flex items-center justify-center text-white text-sm font-bold">
                            {user.name?.charAt(0) || 'U'}
                          </div>
                          <div>
                            <p className="font-semibold text-sm">{user.name}</p>
                            <p className="text-xs text-[#78716C]">{user.phone || user.email}</p>
                          </div>
                        </div>
                        <span className="inline-block mt-2 text-xs font-semibold text-[#312E81] dark:text-[#818CF8] capitalize px-2 py-0.5 rounded-md bg-[#E0E7FF] dark:bg-[#1E1B4B]">{user.role}</span>
                      </div>
                      <div className="p-1.5">
                        {[
                          { icon: User, label: sw ? 'Wasifu Wangu' : 'My Profile', href: profileHref },
                          { icon: Wallet, label: sw ? 'Mkoba' : 'Wallet', href: '/wallet' },
                          { icon: Bell, label: sw ? 'Arifa' : 'Notifications', href: '/notifications', badge: unreadCount },
                          { icon: Settings, label: sw ? 'Mipangilio' : 'Settings', href: '/settings' },
                          { icon: Shield, label: sw ? 'Usalama' : 'Security', href: '/settings/security' },
                        ].map((item, i) => (
                          <button
                            key={i}
                            onClick={() => { router.push(item.href); setShowMenu(false); }}
                            className="w-full flex items-center gap-2.5 px-3 py-2 text-sm hover:bg-[#F5F5F4] dark:hover:bg-[#242244] rounded-lg transition-colors"
                          >
                            <item.icon className="w-4 h-4 text-[#78716C]" />
                            <span className="flex-1 text-left">{item.label}</span>
                            {item.badge && item.badge > 0 && (
                              <span className="w-4.5 h-4.5 rounded-full bg-[#DC2626] text-white text-[8px] font-bold flex items-center justify-center">{item.badge}</span>
                            )}
                            <ChevronRight className="w-3 h-3 text-[#78716C]" />
                          </button>
                        ))}
                      </div>
                      <div className="p-1.5 border-t border-[#E7E5E4] dark:border-[#2E2C4A]">
                        <button onClick={handleLogout} className="w-full flex items-center gap-2 px-3 py-2.5 text-sm text-[#DC2626] hover:bg-[#FEE2E2] dark:hover:bg-[#2D1B1B] rounded-xl transition-colors active:scale-95">
                          <LogOut className="w-4 h-4" />{sw ? 'Toka' : 'Logout'}
                        </button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </>
          ) : (
            <Link
              href="/auth"
              prefetch={true}
              className="kbtn text-xs py-2 px-4 active:scale-95 transition-transform"
            >
              {sw ? 'Ingia' : 'Login'}
            </Link>
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
      <NavProgress />
      <div className="min-h-screen flex flex-col bg-[#FAFAF9] dark:bg-[#0C0A1D]">
        <TopHeader />
        <main className="flex-1 pb-20 max-w-4xl mx-auto w-full">
          {children}
        </main>
        <BottomNav />
      </div>
    </>
  );
}

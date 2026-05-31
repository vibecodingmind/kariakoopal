'use client';

import { usePathname, useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { useAuthStore } from '@/lib/stores/auth-store';
import { useAppStore } from '@/lib/stores/app-store';
import { useNotificationStore } from '@/lib/stores/notification-store';
import {
  Compass,
  Store,
  Search,
  CalendarCheck,
  UserCircle2,
  Home,
  TrendingUp,
  LayoutDashboard,
  Users,
  Scale,
  ShieldAlert,
  Bell,
  Wallet,
  Settings,
  ShoppingBag,
} from 'lucide-react';
import { AIChatAssistant } from '@/components/ai-chat-assistant';
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
  const [progress, setProgress] = useState(30);
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const t1 = setTimeout(() => setProgress(70), 50);
    const t2 = setTimeout(() => setProgress(100), 150);
    const t3 = setTimeout(() => setVisible(false), 400);
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); };
  }, [pathname]);

  if (!visible) return null;

  return (
    <div className="fixed top-0 left-0 right-0 z-[100] h-[3px]">
      <div
        className="h-full bg-gradient-to-r from-[#065F46] via-[#34D399] to-[#F59E0B] transition-all duration-200 ease-out"
        style={{ width: `${progress}%` }}
      />
    </div>
  );
}

// ── User Avatar Component ──
function UserAvatar({ user, size = 'md' }: { user: { name?: string; role?: string; avatarUrl?: string | null }; size?: 'sm' | 'md' | 'lg' }) {
  const sizeClasses = { sm: 'w-8 h-8 text-xs', md: 'w-9 h-9 text-sm', lg: 'w-12 h-12 text-base' };
  const roleClass = user.role === 'guide' ? 'avatar-guide' : user.role === 'admin' ? 'avatar-admin' : 'avatar-seeker';
  const initials = user.name?.split(' ').map(n => n[0]).join('').slice(0, 2) || 'U';

  if (user.avatarUrl) {
    return (
      <div className={`${sizeClasses[size]} rounded-xl overflow-hidden ring-2 ring-[#065F46]/10 dark:ring-[#34D399]/10 shadow-sm`}>
        <Image
          src={user.avatarUrl}
          alt={user.name || 'User'}
          width={size === 'lg' ? 48 : size === 'md' ? 36 : 32}
          height={size === 'lg' ? 48 : size === 'md' ? 36 : 32}
          className="w-full h-full object-cover"
        />
      </div>
    );
  }

  return (
    <div className={`${sizeClasses[size]} rounded-xl ${roleClass} flex items-center justify-center text-white font-bold ring-2 ring-[#065F46]/10 dark:ring-[#34D399]/10 shadow-sm`}>
      {initials}
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
    { href: '/prices', icon: TrendingUp, label: 'Prices', labelSw: 'Bei' },
    { href: '/events', icon: CalendarCheck, label: 'Events', labelSw: 'Matukio' },
    { href: '/vendors', icon: Store, label: 'Vendors', labelSw: 'Wauzaji' },
  ];

  const seekerTabs = [
    { href: '/', icon: Home, label: 'Home', labelSw: 'Nyumbani' },
    { href: '/market', icon: ShoppingBag, label: 'Market', labelSw: 'Soko' },
    { href: '/seeker/find', icon: Search, label: 'Find', labelSw: 'Tafuta' },
    { href: '/prices', icon: TrendingUp, label: 'Prices', labelSw: 'Bei' },
    { href: '/seeker/profile', icon: UserCircle2, label: 'Profile', labelSw: 'Wasifu' },
  ];

  const guideTabs = [
    { href: '/guide', icon: Home, label: 'Home', labelSw: 'Nyumbani' },
    { href: '/guide/sessions', icon: CalendarCheck, label: 'Sessions', labelSw: 'Vipindi' },
    { href: '/guide/packages', icon: Compass, label: 'Packages', labelSw: 'Pakiti' },
    { href: '/guide/earnings', icon: TrendingUp, label: 'Earnings', labelSw: 'Mapato' },
    { href: '/guide/profile', icon: UserCircle2, label: 'Profile', labelSw: 'Wasifu' },
  ];

  const adminTabs = [
    { href: '/admin', icon: LayoutDashboard, label: 'Dashboard', labelSw: 'Dashibodi' },
    { href: '/admin/users', icon: Users, label: 'Users', labelSw: 'Watumiaji' },
    { href: '/admin/revenue', icon: TrendingUp, label: 'Revenue', labelSw: 'Mapato' },
    { href: '/admin/disputes', icon: Scale, label: 'Disputes', labelSw: 'Migogoro' },
    { href: '/admin/fraud', icon: ShieldAlert, label: 'Fraud', labelSw: 'Dhuluma' },
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
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#065F46] to-[#34D399] flex items-center justify-center shadow-sm group-hover:shadow-md transition-shadow">
            <Compass className="w-4.5 h-4.5 text-white" strokeWidth={2.5} />
          </div>
          <span className="text-sm font-bold gradient-text-green hidden sm:block">
            Kariako<span className="text-[#F59E0B]">Guide</span>
          </span>
        </Link>

        <div className="flex items-center gap-1">
          <LanguageToggle className="border border-[#E2E8F0] dark:border-[#334155] rounded-full" />
          <button
            onClick={() => setDarkMode(!darkMode)}
            className="w-9 h-9 rounded-xl flex items-center justify-center border border-[#E2E8F0] dark:border-[#334155] hover:bg-[#F1F5F9] dark:hover:bg-[#334155] transition-all active:scale-90"
          >
            {darkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>

          {isAuthenticated && user ? (
            <>
              {/* Wallet Badge */}
              <button
                onClick={() => router.push('/wallet')}
                className="h-8 px-2.5 rounded-xl flex items-center gap-1.5 bg-[#ECFDF5] dark:bg-[#064E3B] border border-[#065F46]/10 dark:border-[#34D399]/20 hover:shadow-sm transition-all active:scale-95"
              >
                <Wallet className="w-3.5 h-3.5 text-[#065F46] dark:text-[#34D399]" />
                <span className="text-[10px] font-bold text-[#065F46] dark:text-[#34D399]">{(walletBalance / 1000).toFixed(0)}K</span>
              </button>

              {/* Notification Bell */}
              <button
                onClick={() => router.push('/notifications')}
                className="w-9 h-9 rounded-xl flex items-center justify-center border border-[#E2E8F0] dark:border-[#334155] hover:bg-[#F1F5F9] dark:hover:bg-[#334155] transition-all active:scale-90 relative"
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
                  <UserAvatar user={user} size="md" />
                  <ChevronDown className="w-3 h-3 text-[#64748B] hidden sm:block" />
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
                      <div className="p-4 border-b border-[#E2E8F0] dark:border-[#334155]">
                        <div className="flex items-center gap-2.5">
                          <UserAvatar user={user} size="lg" />
                          <div>
                            <p className="font-semibold text-sm">{user.name}</p>
                            <p className="text-xs text-[#64748B]">{user.phone || user.email}</p>
                          </div>
                        </div>
                        <span className="inline-block mt-2 text-xs font-semibold text-[#065F46] dark:text-[#34D399] capitalize px-2 py-0.5 rounded-md bg-[#ECFDF5] dark:bg-[#064E3B]">{user.role}</span>
                      </div>
                      <div className="p-1.5">
                        {[
                          { icon: UserCircle2, label: sw ? 'Wasifu Wangu' : 'My Profile', href: profileHref },
                          { icon: Wallet, label: sw ? 'Mkoba' : 'Wallet', href: '/wallet' },
                          { icon: Bell, label: sw ? 'Arifa' : 'Notifications', href: '/notifications', badge: unreadCount },
                          { icon: Settings, label: sw ? 'Mipangilio' : 'Settings', href: '/settings' },
                          { icon: ShieldAlert, label: sw ? 'Usalama' : 'Security', href: '/settings/security' },
                        ].map((item, i) => (
                          <button
                            key={i}
                            onClick={() => { router.push(item.href); setShowMenu(false); }}
                            className="w-full flex items-center gap-2.5 px-3 py-2 text-sm hover:bg-[#F1F5F9] dark:hover:bg-[#334155] rounded-lg transition-colors"
                          >
                            <item.icon className="w-4 h-4 text-[#64748B]" />
                            <span className="flex-1 text-left">{item.label}</span>
                            {item.badge && item.badge > 0 && (
                              <span className="w-4.5 h-4.5 rounded-full bg-[#DC2626] text-white text-[8px] font-bold flex items-center justify-center">{item.badge}</span>
                            )}
                            <ChevronRight className="w-3 h-3 text-[#64748B]" />
                          </button>
                        ))}
                      </div>
                      <div className="p-1.5 border-t border-[#E2E8F0] dark:border-[#334155]">
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
  const { user } = useAuthStore();

  // Only hide shell on auth page
  const isAuth = pathname === '/auth';

  if (isAuth) {
    return <>{children}</>;
  }

  return (
    <>
      <NextAuthSessionSync />
      <NavProgress />
      <div className="min-h-screen flex flex-col bg-[#F8FAFC] dark:bg-[#0F172A]">
        <TopHeader />
        <main className="flex-1 pb-20 max-w-4xl mx-auto w-full">
          {children}
        </main>
        <BottomNav />
      </div>
      <AIChatAssistant userRole={user?.role || 'seeker'} />
    </>
  );
}

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
  BookOpen,
  Shield,
} from 'lucide-react';
import { LanguageToggle } from '@/components/language-toggle';
import { Moon, Sun, LogOut, ChevronDown } from 'lucide-react';
import { useState, useEffect, useRef, useCallback } from 'react';
import { signOut, useSession } from 'next-auth/react';

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
    { href: '/market', icon: Store, label: 'Market', labelSw: 'Soko' },
    { href: '/guides', icon: Compass, label: 'Guides', labelSw: 'Miongozo' },
    { href: '/prices', icon: DollarSign, label: 'Prices', labelSw: 'Bei' },
    { href: '/events', icon: Calendar, label: 'Events', labelSw: 'Matukio' },
    { href: '/stories', icon: BookOpen, label: 'Stories', labelSw: 'Hadithi' },
  ];

  const seekerTabs = [
    { href: '/seeker', icon: Home, label: 'Home', labelSw: 'Nyumbani' },
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
    { href: '/admin/guides', icon: Compass, label: 'Guides', labelSw: 'Miongozo' },
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
    if (href === '/seeker' || href === '/guide' || href === '/admin') return pathname === href;
    return pathname.startsWith(href);
  };

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-white dark:bg-[#161B22] border-t border-[#E9ECEF] dark:border-[#30363D] safe-area-bottom">
      <div className="max-w-lg mx-auto flex items-center justify-around h-16 px-2">
        {tabs.map((tab) => {
          const active = isActive(tab.href);
          return (
            <button
              key={tab.href}
              onClick={() => router.push(tab.href)}
              className={`flex flex-col items-center justify-center gap-0.5 flex-1 py-1 transition-all duration-200 ${
                active
                  ? 'text-[#0B5D3A] dark:text-[#2EA77A] scale-105'
                  : 'text-[#6C757D] dark:text-[#8B949E] hover:text-[#0B5D3A] dark:hover:text-[#2EA77A]'
              }`}
            >
              <div className={`relative ${active ? '' : ''}`}>
                {active && (
                  <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-5 h-0.5 bg-[#0B5D3A] dark:bg-[#2EA77A] rounded-full" />
                )}
                <tab.icon className={`w-5 h-5 ${active ? 'stroke-[2.5]' : 'stroke-[1.5]'}`} />
              </div>
              <span className={`text-[10px] ${active ? 'font-bold' : 'font-medium'}`}>
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
        <button onClick={() => router.push('/')} className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-[#0B5D3A] flex items-center justify-center">
            <Compass className="w-4 h-4 text-white" strokeWidth={2.5} />
          </div>
          <span className="text-sm font-bold gradient-text-green hidden sm:block">
            {sw ? 'Kariako Guide' : 'Kariako Guide'}
          </span>
        </button>

        <div className="flex items-center gap-2">
          <LanguageToggle className="border border-[#E9ECEF] dark:border-[#30363D] rounded-full" />
          <button
            onClick={() => setDarkMode(!darkMode)}
            className="w-9 h-9 rounded-full flex items-center justify-center border border-[#E9ECEF] dark:border-[#30363D] hover:bg-[#F1F3F5] dark:hover:bg-[#21262D] transition-colors"
          >
            {darkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>

          {isAuthenticated && user ? (
            <div className="relative" ref={menuRef}>
              <button onClick={() => setShowMenu(!showMenu)} className="flex items-center gap-1.5 group">
                <div className="w-8 h-8 rounded-full bg-[#0B5D3A] flex items-center justify-center text-white text-xs font-bold group-hover:ring-2 group-hover:ring-[#0B5D3A]/30 transition-all">
                  {user.name?.charAt(0) || 'U'}
                </div>
                <ChevronDown className="w-3 h-3 text-[#6C757D] hidden sm:block" />
              </button>
              {showMenu && (
                <div className="absolute right-0 top-full mt-2 w-56 kcard p-0 overflow-hidden z-50">
                  <div className="p-4 border-b border-[#E9ECEF] dark:border-[#30363D]">
                    <p className="font-medium text-sm">{user.name}</p>
                    <p className="text-xs text-[#6C757D] dark:text-[#8B949E] mt-0.5">{user.phone}</p>
                    <span className="inline-block mt-2 text-xs font-medium text-[#0B5D3A] dark:text-[#2EA77A] capitalize">{user.role}</span>
                  </div>
                  <div className="p-2">
                    <button onClick={handleLogout} className="w-full flex items-center gap-2 px-3 py-2 text-sm text-[#E63946] hover:bg-[#FEE2E2] dark:hover:bg-[#3D1F1F] rounded-lg transition-colors">
                      <LogOut className="w-4 h-4" />{sw ? 'Toka' : 'Logout'}
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <button
              onClick={() => router.push('/auth')}
              className="kbtn text-xs py-1.5 px-3"
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
  const { isAuthenticated } = useAuthStore();

  // Don't show shell on landing page or auth page
  const isLanding = pathname === '/';
  const isAuth = pathname === '/auth';

  if (isLanding || isAuth) {
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

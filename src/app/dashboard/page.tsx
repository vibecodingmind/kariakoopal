'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/lib/stores/auth-store';
import { useAppStore } from '@/lib/stores/app-store';
import { t } from '@/lib/i18n';
import { SeekerDashboard } from '@/components/seeker-dashboard';
import { GuideDashboard } from '@/components/guide-dashboard';
import { AdminDashboard } from '@/components/admin-dashboard';
import { Onboarding } from '@/components/onboarding';
import { LanguageToggle } from '@/components/language-toggle';
import { Compass, Moon, Sun, ChevronDown, LogOut, Shield } from 'lucide-react';
import { signOut, useSession } from 'next-auth/react';

// ── NextAuth Session Sync ──
function NextAuthSessionSync() {
  const { data: session } = useSession();
  const { setUser, setGuideProfile, isAuthenticated } = useAuthStore();
  const syncedRef = useRef(false);

  useEffect(() => {
    if (!isAuthenticated) {
      syncedRef.current = false;
    }
  }, [isAuthenticated]);

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
          .then(data => {
            if (data?.guideProfile) {
              setGuideProfile(data.guideProfile);
            }
          })
          .catch(() => {});
      }
    }
  }, [session, isAuthenticated, setUser, setGuideProfile]);

  return null;
}

// ── Glassmorphism App Shell ──
export default function DashboardPage() {
  const { user, language, logout, isAuthenticated } = useAuthStore();
  const { darkMode, setDarkMode, showOnboarding } = useAppStore();
  const router = useRouter();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Redirect to auth if not authenticated
  useEffect(() => {
    if (!isAuthenticated) {
      router.replace('/auth');
    }
  }, [isAuthenticated, router]);

  // Toggle dark mode
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  // Close menu when clicking outside
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setShowUserMenu(false);
      }
    };
    if (showUserMenu) {
      document.addEventListener('mousedown', handleClick);
      return () => document.removeEventListener('mousedown', handleClick);
    }
  }, [showUserMenu]);

  const roleLabel = user?.role === 'seeker'
    ? t('role_seeker', language)
    : user?.role === 'guide'
      ? t('role_guide', language)
      : 'Admin';

  const roleColor = user?.role === 'seeker'
    ? 'text-amber-600 dark:text-amber-400'
    : user?.role === 'guide'
      ? 'text-emerald-600 dark:text-emerald-400'
      : 'text-purple-600 dark:text-purple-400';

  const handleLogout = useCallback(async () => {
    try {
      await signOut({ redirect: false });
    } catch {
      // signOut can fail if no NextAuth session, that's OK
    }
    logout();
    setShowUserMenu(false);
    router.replace('/auth');
  }, [logout, router]);

  // Show onboarding for first-time seekers
  if (isAuthenticated && user?.role === 'seeker' && showOnboarding) {
    return (
      <>
        <NextAuthSessionSync />
        <Onboarding />
      </>
    );
  }

  if (!isAuthenticated) {
    return (
      <>
        <NextAuthSessionSync />
        <div className="min-h-screen flex items-center justify-center">
          <div className="animate-spin w-8 h-8 border-2 border-amber-500 border-t-transparent rounded-full" />
        </div>
      </>
    );
  }

  return (
    <>
      <NextAuthSessionSync />
      <div className="min-h-screen flex flex-col">
        {/* Header with glass nav */}
        <header className="glass-nav sticky top-0 z-50">
          <div className="flex items-center justify-between px-4 h-14">
            {/* Logo + name */}
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg glass-card flex items-center justify-center">
                <Compass className="w-4 h-4 gradient-text" strokeWidth={2.5} />
              </div>
              <div className="hidden sm:block">
                <h1 className="text-sm font-bold gradient-text">
                  {t('app_name', language)}
                </h1>
              </div>
            </div>

            {/* Right controls */}
            <div className="flex items-center gap-2">
              {/* Language toggle pill */}
              <LanguageToggle className="glass rounded-full" />

              {/* Dark mode toggle */}
              <button
                onClick={() => setDarkMode(!darkMode)}
                className="glass w-9 h-9 rounded-full flex items-center justify-center hover:bg-[var(--glass-hover)] transition-colors"
                aria-label="Toggle dark mode"
              >
                {darkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
              </button>

              {/* User avatar with menu */}
              <div className="relative" ref={menuRef}>
                <button
                  onClick={() => setShowUserMenu(!showUserMenu)}
                  className="flex items-center gap-2 group"
                >
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center text-white text-xs font-bold ring-2 ring-amber-400/30 group-hover:ring-amber-400/50 transition-all">
                    {user?.name?.charAt(0) || 'U'}
                  </div>
                  <ChevronDown className="w-3 h-3 text-muted-foreground hidden sm:block" />
                </button>

                {showUserMenu && (
                  <div className="absolute right-0 top-full mt-2 w-56 glass-card p-0 overflow-hidden">
                    <div className="p-4 border-b border-[var(--glass-border)]">
                      <p className="font-medium text-sm">{user?.name}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">{user?.phone}</p>
                      <span className={`inline-block mt-2 text-xs font-medium ${roleColor}`}>
                        {roleLabel}
                      </span>
                    </div>
                    <div className="p-2">
                      <button
                        onClick={handleLogout}
                        className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-500 hover:bg-red-500/10 rounded-lg transition-colors"
                      >
                        <LogOut className="w-4 h-4" />
                        {t('nav_logout', language)}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </header>

        {/* Main Content - Role-Based Dashboard */}
        <main className="flex-1">
          {user?.role === 'seeker' && <SeekerDashboard />}
          {user?.role === 'guide' && <GuideDashboard />}
          {user?.role === 'admin' && <AdminDashboard />}
        </main>
      </div>
    </>
  );
}

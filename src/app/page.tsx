'use client';

import { useState, useEffect, useRef } from 'react';
import { useAuthStore } from '@/lib/stores/auth-store';
import { useAppStore } from '@/lib/stores/app-store';
import { t, Language } from '@/lib/i18n';
import { SeekerDashboard } from '@/components/seeker-dashboard';
import { GuideDashboard } from '@/components/guide-dashboard';
import { AdminDashboard } from '@/components/admin-dashboard';
import { Onboarding } from '@/components/onboarding';
import { Input } from '@/components/ui/input';
import { MapPin, Phone, Shield, Compass, LogOut, Moon, Sun, Loader2, ChevronDown, Globe } from 'lucide-react';
import { toast } from 'sonner';

// ── Glassmorphism Auth Screen ──
function AuthScreen() {
  const { login, language, setLanguage, isLoading } = useAuthStore();
  const [step, setStep] = useState<'phone' | 'otp' | 'role'>('phone');
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [selectedRole, setSelectedRole] = useState<'seeker' | 'guide' | ''>('');
  const [error, setError] = useState('');

  const handleSendOtp = () => {
    if (phone.length < 9) {
      setError(language === 'sw' ? 'Weka nambari sahihi ya simu' : 'Enter a valid phone number');
      return;
    }
    setError('');
    setStep('otp');
  };

  const handleVerifyOtp = () => {
    if (otp.length < 4) {
      setError(language === 'sw' ? 'Weka nambari ya uthibitisho' : 'Enter the verification code');
      return;
    }
    setError('');
    setStep('role');
  };

  const handleRoleSelect = async () => {
    if (!selectedRole) return;
    setError('');
    try {
      const fullPhone = phone.startsWith('+') ? phone : `+255${phone.replace(/^0/, '')}`;
      await login(fullPhone);
    } catch {
      setError(language === 'sw' ? 'Hitilafu katika kuingia. Jaribu tena.' : 'Login failed. Please try again.');
    }
  };

  const quickLogin = async (role: string) => {
    setError('');
    try {
      let phoneNum = '';
      if (role === 'seeker') phoneNum = '+14155550001';
      else if (role === 'guide') phoneNum = '+255712000001';
      else if (role === 'admin') phoneNum = '+255700000001';
      await login(phoneNum);
    } catch {
      setError(language === 'sw' ? 'Hitilafu katika kuingia' : 'Login failed');
    }
  };

  const handleSocialLogin = (provider: string) => {
    toast.info(`${provider} ${t('demo_mode', language).toLowerCase()} — Coming soon!`);
  };

  const toggleLanguage = () => {
    const newLang: Language = language === 'sw' ? 'en' : 'sw';
    setLanguage(newLang);
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 relative">
      {/* Language toggle pill - top right */}
      <div className="fixed top-4 right-4 z-10">
        <button
          onClick={toggleLanguage}
          className="glass flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium hover:bg-[var(--glass-hover)] transition-colors"
          aria-label={`Switch language to ${language === 'sw' ? 'English' : 'Kiswahili'}`}
        >
          <Globe className="w-4 h-4" />
          <span className="text-xs font-semibold uppercase tracking-wide">
            {language === 'sw' ? 'SW' : 'EN'}
          </span>
        </button>
      </div>

      {/* Main glass card */}
      <div className="w-full max-w-sm">
        {/* Logo section */}
        <div className="text-center mb-8">
          <div className="animate-float inline-block">
            <div className="w-20 h-20 mx-auto rounded-2xl glass-card flex items-center justify-center amber-glow-sm">
              <Compass className="w-10 h-10 gradient-text" strokeWidth={2.5} />
            </div>
          </div>
          <h1 className="text-3xl font-bold mt-4 gradient-text">
            {t('app_name', language)}
          </h1>
          <p className="text-muted-foreground mt-2 text-sm max-w-xs mx-auto">
            {t('auth_subtitle', language)}
          </p>
        </div>

        {/* Auth card */}
        <div className="glass-card p-6 space-y-5">
          {/* Step title */}
          <div className="text-center">
            <h2 className="text-lg font-semibold">
              {step === 'phone' && t('auth_title', language)}
              {step === 'otp' && t('verify_otp', language)}
              {step === 'role' && (language === 'sw' ? 'Chagua jukumu lako' : 'Choose your role')}
            </h2>
          </div>

          {error && (
            <div className="glass p-3 rounded-lg text-red-500 dark:text-red-400 text-sm text-center">
              {error}
            </div>
          )}

          {/* Phone step */}
          {step === 'phone' && (
            <>
              <div className="space-y-2">
                <label className="text-sm font-medium">{t('phone_label', language)}</label>
                <div className="flex gap-2">
                  <div className="flex items-center px-3 glass-input rounded-lg text-sm font-medium min-w-fit">
                    +255
                  </div>
                  <Input
                    type="tel"
                    placeholder={t('phone_placeholder', language)}
                    value={phone}
                    onChange={(e) => setPhone(e.target.value.replace(/\D/g, ''))}
                    className="flex-1 glass-input border-0 bg-transparent focus:ring-0 focus:outline-none"
                    maxLength={10}
                  />
                </div>
              </div>
              <button
                onClick={handleSendOtp}
                className="glass-button w-full h-11 flex items-center justify-center gap-2 text-base"
              >
                <Phone className="w-4 h-4" />
                {t('send_otp', language)}
              </button>

              {/* Divider */}
              <div className="relative flex items-center gap-3">
                <div className="flex-1 h-px bg-[var(--glass-border)]" />
                <span className="text-xs text-muted-foreground whitespace-nowrap">
                  {t('or_continue_with', language)}
                </span>
                <div className="flex-1 h-px bg-[var(--glass-border)]" />
              </div>

              {/* Social login buttons */}
              <div className="flex gap-3">
                <button
                  onClick={() => handleSocialLogin(t('google_login', language))}
                  className="flex-1 glass flex items-center justify-center gap-2 py-2.5 rounded-xl hover:bg-[var(--glass-hover)] transition-colors"
                >
                  <svg className="w-4 h-4" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"/>
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                  </svg>
                  <span className="text-xs font-medium">{t('google_login', language)}</span>
                </button>
                <button
                  onClick={() => handleSocialLogin(t('facebook_login', language))}
                  className="flex-1 glass flex items-center justify-center gap-2 py-2.5 rounded-xl hover:bg-[var(--glass-hover)] transition-colors"
                >
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="#1877F2">
                    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                  </svg>
                  <span className="text-xs font-medium">{t('facebook_login', language)}</span>
                </button>
                <button
                  onClick={() => handleSocialLogin(t('apple_login', language))}
                  className="flex-1 glass flex items-center justify-center gap-2 py-2.5 rounded-xl hover:bg-[var(--glass-hover)] transition-colors"
                >
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M17.05 20.28c-.98.95-2.05.88-3.08.4-1.09-.5-2.08-.48-3.24 0-1.44.62-2.2.44-3.06-.4C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z"/>
                  </svg>
                  <span className="text-xs font-medium">{t('apple_login', language)}</span>
                </button>
              </div>
            </>
          )}

          {/* OTP step */}
          {step === 'otp' && (
            <>
              <div className="space-y-2">
                <label className="text-sm font-medium">{t('verify_otp', language)}</label>
                <Input
                  type="text"
                  placeholder={t('otp_placeholder', language)}
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                  className="glass-input border-0 bg-transparent text-center text-2xl tracking-[0.5em] focus:ring-0 focus:outline-none h-14"
                  maxLength={6}
                />
                <p className="text-xs text-muted-foreground text-center">
                  {language === 'sw'
                    ? 'Weka nambari yoyote (mfano: 123456)'
                    : 'Enter any code (e.g. 123456)'}
                </p>
              </div>
              <button
                onClick={handleVerifyOtp}
                className="glass-button w-full h-11 flex items-center justify-center gap-2 text-base"
              >
                <Shield className="w-4 h-4" />
                {t('verify_otp', language)}
              </button>
              <button
                onClick={() => setStep('phone')}
                className="w-full glass py-2.5 rounded-xl text-sm font-medium hover:bg-[var(--glass-hover)] transition-colors"
              >
                {t('back', language)}
              </button>
            </>
          )}

          {/* Role selection step */}
          {step === 'role' && (
            <>
              <div className="space-y-3">
                <button
                  onClick={() => setSelectedRole('seeker')}
                  className={`w-full p-4 rounded-xl text-left transition-all glass-card gradient-border ${
                    selectedRole === 'seeker'
                      ? 'ring-2 ring-amber-500/50 amber-glow-sm'
                      : 'hover:bg-[var(--glass-hover)]'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center animate-gentle-pulse">
                      <MapPin className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <div className="font-semibold">{t('role_seeker', language)}</div>
                      <div className="text-xs text-muted-foreground">
                        {language === 'sw'
                          ? 'Tafuta mwongozo wa soko'
                          : 'Find a market guide'}
                      </div>
                    </div>
                  </div>
                </button>

                <button
                  onClick={() => setSelectedRole('guide')}
                  className={`w-full p-4 rounded-xl text-left transition-all glass-card gradient-border ${
                    selectedRole === 'guide'
                      ? 'ring-2 ring-emerald-500/50'
                      : 'hover:bg-[var(--glass-hover)]'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center animate-gentle-pulse">
                      <Compass className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <div className="font-semibold">{t('role_guide', language)}</div>
                      <div className="text-xs text-muted-foreground">
                        {language === 'sw'
                          ? 'Kuwa mwongozo wa soko'
                          : 'Become a market guide'}
                      </div>
                    </div>
                  </div>
                </button>
              </div>
              <button
                onClick={handleRoleSelect}
                disabled={!selectedRole || isLoading}
                className="glass-button w-full h-11 flex items-center justify-center gap-2 text-base disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : null}
                {t('login', language)}
              </button>
            </>
          )}
        </div>

        {/* Quick demo login */}
        <div className="mt-6">
          <p className="text-xs text-center text-muted-foreground mb-3">
            {t('demo_mode', language)}:
          </p>
          <div className="flex gap-2">
            <button
              onClick={() => quickLogin('seeker')}
              disabled={isLoading}
              className="flex-1 glass py-2 px-3 rounded-full text-xs font-medium hover:bg-[var(--glass-hover)] transition-colors disabled:opacity-50 flex items-center justify-center gap-1.5"
            >
              {isLoading ? <Loader2 className="w-3 h-3 animate-spin" /> : <><MapPin className="w-3 h-3 text-amber-500" /> Seeker</>}
            </button>
            <button
              onClick={() => quickLogin('guide')}
              disabled={isLoading}
              className="flex-1 glass py-2 px-3 rounded-full text-xs font-medium hover:bg-[var(--glass-hover)] transition-colors disabled:opacity-50 flex items-center justify-center gap-1.5"
            >
              {isLoading ? <Loader2 className="w-3 h-3 animate-spin" /> : <><Compass className="w-3 h-3 text-emerald-500" /> Guide</>}
            </button>
            <button
              onClick={() => quickLogin('admin')}
              disabled={isLoading}
              className="flex-1 glass py-2 px-3 rounded-full text-xs font-medium hover:bg-[var(--glass-hover)] transition-colors disabled:opacity-50 flex items-center justify-center gap-1.5"
            >
              {isLoading ? <Loader2 className="w-3 h-3 animate-spin" /> : <><Shield className="w-3 h-3 text-purple-500" /> Admin</>}
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-8 text-center text-xs text-muted-foreground">
          <p>Kariakoo, Dar es Salaam, Tanzania</p>
          <p className="mt-1">v1.0.0 &middot; {t('powered_by', language)} Kariako Guide</p>
        </div>
      </div>
    </div>
  );
}

// ── Glassmorphism App Shell ──
function AppShell() {
  const { user, language, logout, setLanguage } = useAuthStore();
  const { darkMode, setDarkMode } = useAppStore();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

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

  const toggleLanguage = () => {
    const newLang: Language = language === 'sw' ? 'en' : 'sw';
    setLanguage(newLang);
  };

  return (
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
            <button
              onClick={toggleLanguage}
              className="glass flex items-center gap-1.5 px-2.5 py-1.5 rounded-full text-xs font-medium hover:bg-[var(--glass-hover)] transition-colors"
              aria-label={`Switch language to ${language === 'sw' ? 'English' : 'Kiswahili'}`}
            >
              <Globe className="w-3.5 h-3.5" />
              <span className="font-semibold uppercase tracking-wide">
                {language === 'sw' ? 'SW' : 'EN'}
              </span>
            </button>

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
                      onClick={() => {
                        logout();
                        setShowUserMenu(false);
                      }}
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
  );
}

// ── Main Home Page ──
export default function Home() {
  const { isAuthenticated, user } = useAuthStore();
  const { showOnboarding } = useAppStore();

  // Show onboarding for first-time seekers
  if (isAuthenticated && user?.role === 'seeker' && showOnboarding) {
    return <Onboarding />;
  }

  // Show auth screen if not logged in
  if (!isAuthenticated) {
    return <AuthScreen />;
  }

  // Show app shell with role-based dashboard
  return <AppShell />;
}

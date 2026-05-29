'use client';

import { useState, useEffect } from 'react';
import { useAuthStore } from '@/lib/stores/auth-store';
import { useAppStore } from '@/lib/stores/app-store';
import { t, Language } from '@/lib/i18n';
import { SeekerDashboard } from '@/components/seeker-dashboard';
import { GuideDashboard } from '@/components/guide-dashboard';
import { AdminDashboard } from '@/components/admin-dashboard';
import { Onboarding } from '@/components/onboarding';
import { LanguageToggle } from '@/components/language-toggle';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { MapPin, Phone, Shield, Compass, LogOut, Moon, Sun, Loader2 } from 'lucide-react';

// ── Auth Screen Component ──
function AuthScreen() {
  const { login, language, isLoading } = useAuthStore();
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
    // Mock OTP verification - any 4+ digit code works
    setStep('role');
  };

  const handleRoleSelect = async () => {
    if (!selectedRole) return;
    setError('');
    try {
      const fullPhone = phone.startsWith('+') ? phone : `+255${phone.replace(/^0/, '')}`;
      await login(fullPhone);
      // If the returned user role doesn't match selected role, we still proceed
      // In a real app, role selection would be part of registration
    } catch {
      setError(language === 'sw' ? 'Hitilafu katika kuingia. Jaribu tena.' : 'Login failed. Please try again.');
    }
  };

  // Quick login buttons for demo
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

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-gradient-to-br from-amber-50 via-orange-50 to-amber-100 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950">
      {/* Logo & Title */}
      <div className="text-center mb-8">
        <div className="w-20 h-20 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center shadow-lg">
          <Compass className="w-10 h-10 text-white" />
        </div>
        <h1 className="text-3xl font-bold text-amber-700 dark:text-amber-400">
          {t('app_name', language)}
        </h1>
        <p className="text-muted-foreground mt-2 text-sm max-w-xs mx-auto">
          {t('auth_subtitle', language)}
        </p>
      </div>

      {/* Language Toggle */}
      <div className="mb-6">
        <LanguageToggle />
      </div>

      {/* Auth Card */}
      <Card className="w-full max-w-sm shadow-xl border-0">
        <CardHeader className="text-center pb-2">
          <CardTitle className="text-xl">
            {step === 'phone' && t('auth_title', language)}
            {step === 'otp' && t('verify_otp', language)}
            {step === 'role' && (language === 'sw' ? 'Chagua jukumu lako' : 'Choose your role')}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {error && (
            <div className="bg-red-50 dark:bg-red-950 text-red-600 dark:text-red-400 text-sm p-3 rounded-lg">
              {error}
            </div>
          )}

          {step === 'phone' && (
            <>
              <div className="space-y-2">
                <label className="text-sm font-medium">{t('phone_label', language)}</label>
                <div className="flex gap-2">
                  <div className="flex items-center px-3 bg-muted rounded-lg text-sm font-medium">
                    +255
                  </div>
                  <Input
                    type="tel"
                    placeholder={t('phone_placeholder', language)}
                    value={phone}
                    onChange={(e) => setPhone(e.target.value.replace(/\D/g, ''))}
                    className="flex-1"
                    maxLength={10}
                  />
                </div>
              </div>
              <Button onClick={handleSendOtp} className="w-full bg-amber-600 hover:bg-amber-700" size="lg">
                <Phone className="w-4 h-4 mr-2" />
                {t('send_otp', language)}
              </Button>
            </>
          )}

          {step === 'otp' && (
            <>
              <div className="space-y-2">
                <label className="text-sm font-medium">{t('verify_otp', language)}</label>
                <Input
                  type="text"
                  placeholder={t('otp_placeholder', language)}
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                  className="text-center text-2xl tracking-[0.5em]"
                  maxLength={6}
                />
                <p className="text-xs text-muted-foreground text-center">
                  {language === 'sw'
                    ? 'Weka nambari yoyote (mfano: 123456)'
                    : 'Enter any code (e.g. 123456)'}
                </p>
              </div>
              <Button onClick={handleVerifyOtp} className="w-full bg-amber-600 hover:bg-amber-700" size="lg">
                <Shield className="w-4 h-4 mr-2" />
                {t('verify_otp', language)}
              </Button>
              <Button variant="ghost" onClick={() => setStep('phone')} className="w-full">
                {t('back', language)}
              </Button>
            </>
          )}

          {step === 'role' && (
            <>
              <div className="space-y-3">
                <button
                  onClick={() => setSelectedRole('seeker')}
                  className={`w-full p-4 rounded-xl border-2 text-left transition-all ${
                    selectedRole === 'seeker'
                      ? 'border-amber-500 bg-amber-50 dark:bg-amber-950'
                      : 'border-muted hover:border-amber-300'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-amber-100 dark:bg-amber-900 flex items-center justify-center">
                      <MapPin className="w-6 h-6 text-amber-600" />
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
                  className={`w-full p-4 rounded-xl border-2 text-left transition-all ${
                    selectedRole === 'guide'
                      ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950'
                      : 'border-muted hover:border-emerald-300'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-emerald-100 dark:bg-emerald-900 flex items-center justify-center">
                      <Compass className="w-6 h-6 text-emerald-600" />
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
              <Button
                onClick={handleRoleSelect}
                disabled={!selectedRole || isLoading}
                className="w-full bg-amber-600 hover:bg-amber-700"
                size="lg"
              >
                {isLoading ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : null}
                {t('login', language)}
              </Button>
            </>
          )}
        </CardContent>
      </Card>

      {/* Quick Demo Login */}
      <div className="mt-6 w-full max-w-sm">
        <p className="text-xs text-center text-muted-foreground mb-3">
          {language === 'sw' ? 'Ingia haraka kwa majaribio:' : 'Quick demo login:'}
        </p>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            className="flex-1 text-xs"
            onClick={() => quickLogin('seeker')}
            disabled={isLoading}
          >
            {isLoading ? <Loader2 className="w-3 h-3 animate-spin" /> : '🛒 Seeker'}
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="flex-1 text-xs"
            onClick={() => quickLogin('guide')}
            disabled={isLoading}
          >
            {isLoading ? <Loader2 className="w-3 h-3 animate-spin" /> : '🧭 Guide'}
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="flex-1 text-xs"
            onClick={() => quickLogin('admin')}
            disabled={isLoading}
          >
            {isLoading ? <Loader2 className="w-3 h-3 animate-spin" /> : '⚙️ Admin'}
          </Button>
        </div>
      </div>

      {/* Footer */}
      <div className="mt-8 text-center text-xs text-muted-foreground">
        <p>Kariakoo, Dar es Salaam, Tanzania</p>
        <p className="mt-1">v1.0.0 • {t('powered_by', language)} Kariako Guide</p>
      </div>
    </div>
  );
}

// ── App Shell with Header & Role-Based Dashboard ──
function AppShell() {
  const { user, language, logout, setLanguage } = useAuthStore();
  const { darkMode, setDarkMode } = useAppStore();
  const [showUserMenu, setShowUserMenu] = useState(false);

  // Toggle dark mode
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  const roleLabel = user?.role === 'seeker'
    ? t('role_seeker', language)
    : user?.role === 'guide'
      ? t('role_guide', language)
      : 'Admin';

  const roleColor = user?.role === 'seeker'
    ? 'bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300'
    : user?.role === 'guide'
      ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-300'
      : 'bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300';

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-background/95 backdrop-blur-sm border-b">
        <div className="flex items-center justify-between px-4 h-14">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center">
              <Compass className="w-4 h-4 text-white" />
            </div>
            <div className="hidden sm:block">
              <h1 className="text-sm font-bold text-amber-700 dark:text-amber-400">
                {t('app_name', language)}
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <LanguageToggle />

            <Button
              variant="ghost"
              size="icon"
              onClick={() => setDarkMode(!darkMode)}
              className="h-9 w-9"
            >
              {darkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </Button>

            <div className="relative">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowUserMenu(!showUserMenu)}
                className="flex items-center gap-2"
              >
                <div className="w-7 h-7 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center text-white text-xs font-bold">
                  {user?.name?.charAt(0) || 'U'}
                </div>
                <span className="hidden sm:block text-sm">{user?.name?.split(' ')[0]}</span>
              </Button>

              {showUserMenu && (
                <div className="absolute right-0 top-full mt-1 w-56 bg-popover border rounded-lg shadow-lg z-50">
                  <div className="p-3 border-b">
                    <p className="font-medium text-sm">{user?.name}</p>
                    <p className="text-xs text-muted-foreground">{user?.phone}</p>
                    <span className={`inline-block mt-1 px-2 py-0.5 rounded text-xs font-medium ${roleColor}`}>
                      {roleLabel}
                    </span>
                  </div>
                  <div className="p-1">
                    <button
                      onClick={() => {
                        logout();
                        setShowUserMenu(false);
                      }}
                      className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-950 rounded"
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
  const { showOnboarding, setShowOnboarding } = useAppStore();

  // Close user menu when clicking outside
  useEffect(() => {
    const handleClick = () => {
      // Will be handled by individual components
    };
    document.addEventListener('click', handleClick);
    return () => document.removeEventListener('click', handleClick);
  }, []);

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

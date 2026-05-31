'use client';

import { useState, useEffect, useRef, useCallback, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuthStore } from '@/lib/stores/auth-store';
import { useAppStore } from '@/lib/stores/app-store';
import { t } from '@/lib/i18n';
import { LanguageToggle } from '@/components/language-toggle';
import { Input } from '@/components/ui/input';
import { MapPin, Phone, Shield, Compass, Loader2 } from 'lucide-react';
import { signIn, useSession } from 'next-auth/react';
import { toast } from 'sonner';

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
          .then(data => { if (data?.guideProfile) setGuideProfile(data.guideProfile); })
          .catch(() => {});
      }
    }
  }, [session, isAuthenticated, setUser, setGuideProfile]);
  return null;
}

// ── Auth Screen ──
function AuthContent() {
  const { login, language, isLoading, isAuthenticated } = useAuthStore();
  const { showOnboarding } = useAppStore();
  const router = useRouter();
  const searchParams = useSearchParams();
  const preselectedRole = searchParams.get('role');

  const [step, setStep] = useState<'phone' | 'otp' | 'role'>('phone');
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [selectedRole, setSelectedRole] = useState<'seeker' | 'guide' | ''>(
    preselectedRole === 'guide' ? 'guide' : preselectedRole === 'seeker' ? 'seeker' : ''
  );
  const [error, setError] = useState('');

  useEffect(() => {
    if (isAuthenticated) router.replace('/');
  }, [isAuthenticated, router, showOnboarding]);

  const handleSendOtp = () => {
    if (phone.length < 9) { setError(language === 'sw' ? 'Weka nambari sahihi ya simu' : 'Enter a valid phone number'); return; }
    setError(''); setStep('otp');
  };

  const handleVerifyOtp = () => {
    if (otp.length < 4) { setError(language === 'sw' ? 'Weka nambari ya uthibitisho' : 'Enter the verification code'); return; }
    setError(''); setStep('role');
  };

  const handleRoleSelect = async () => {
    if (!selectedRole) return;
    setError('');
    try {
      const fullPhone = phone.startsWith('+') ? phone : `+255${phone.replace(/^0/, '')}`;
      const roleName = selectedRole === 'seeker' ? 'Demo Seeker' : 'Demo Guide';
      await login(fullPhone, selectedRole, roleName);
    } catch { setError(language === 'sw' ? 'Hitilafu katika kuingia' : 'Login failed. Please try again.'); }
  };

  const quickLogin = async (role: string) => {
    setError('');
    try {
      let phoneNum = '', name = '';
      if (role === 'seeker') { phoneNum = '+14155550001'; name = 'Demo Seeker'; }
      else if (role === 'guide') { phoneNum = '+255712000001'; name = 'Demo Guide'; }
      else if (role === 'admin') { phoneNum = '+255700000001'; name = 'Admin'; }
      await login(phoneNum, role, name);
    } catch { setError(language === 'sw' ? 'Hitilafu katika kuingia' : 'Login failed'); }
  };

  const handleSocialLogin = useCallback((provider: string) => {
    const providerMap: Record<string, string> = { 'Google': 'google', 'google': 'google', 'Facebook': 'facebook', 'facebook': 'facebook', 'Apple': 'apple', 'apple': 'apple' };
    const providerId = providerMap[provider];
    if (providerId === 'google' || providerId === 'facebook') { signIn(providerId, { callbackUrl: '/' }); }
    else { toast.info(`${provider} ${t('demo_mode', language).toLowerCase()} — Coming soon!`); }
  }, [language]);

  return (
    <>
      <NextAuthSessionSync />
      <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-[#F8F9FA] dark:bg-[#0D1117]">
        {/* Language toggle pill - top right */}
        <div className="fixed top-4 right-4 z-10">
          <LanguageToggle className="border border-[#E9ECEF] dark:border-[#30363D] rounded-full" />
        </div>
        {/* Back to landing */}
        <button onClick={() => router.push('/')} className="fixed top-4 left-4 z-10 w-10 h-10 rounded-xl bg-white dark:bg-[#161B22] border border-[#E9ECEF] dark:border-[#30363D] flex items-center justify-center hover:bg-[#F1F3F5] dark:hover:bg-[#21262D] transition-colors text-sm" aria-label="Back">←</button>

        <div className="w-full max-w-sm">
          {/* Logo section */}
          <div className="text-center mb-8">
            <div className="w-16 h-16 rounded-2xl bg-[#0B5D3A] mx-auto flex items-center justify-center mb-4">
              <Compass className="w-8 h-8 text-white" strokeWidth={2.5} />
            </div>
            <h1 className="text-2xl font-black gradient-text-green tracking-tight">{t('app_name', language)}</h1>
            <p className="text-[#6C757D] dark:text-[#8B949E] mt-2 text-sm">{t('auth_subtitle', language)}</p>
          </div>

          {/* Auth card */}
          <div className="kcard p-6 space-y-5">
            <div className="text-center">
              <h2 className="text-base font-semibold">
                {step === 'phone' && t('auth_title', language)}
                {step === 'otp' && t('verify_otp', language)}
                {step === 'role' && (language === 'sw' ? 'Chagua jukumu lako' : 'Choose your role')}
              </h2>
            </div>

            {error && <div className="bg-[#FEE2E2] dark:bg-[#3D1F1F] text-[#E63946] p-3 rounded-lg text-sm text-center">{error}</div>}

            {/* Phone step */}
            {step === 'phone' && (
              <>
                <div className="space-y-2">
                  <label className="text-sm font-medium">{t('phone_label', language)}</label>
                  <div className="flex gap-2">
                    <div className="flex items-center px-3 bg-[#F1F3F5] dark:bg-[#21262D] rounded-lg text-sm font-medium min-w-fit border border-[#E9ECEF] dark:border-[#30363D]">+255</div>
                    <Input type="tel" placeholder={t('phone_placeholder', language)} value={phone} onChange={(e) => setPhone(e.target.value.replace(/\D/g, ''))} className="flex-1 kinput" maxLength={10} />
                  </div>
                </div>
                <button onClick={handleSendOtp} className="kbtn w-full h-11 flex items-center justify-center gap-2"><Phone className="w-4 h-4" />{t('send_otp', language)}</button>
                <div className="relative flex items-center gap-3"><div className="flex-1 h-px bg-[#E9ECEF] dark:bg-[#30363D]" /><span className="text-xs text-[#6C757D] dark:text-[#8B949E] whitespace-nowrap">{t('or_continue_with', language)}</span><div className="flex-1 h-px bg-[#E9ECEF] dark:bg-[#30363D]" /></div>
                <div className="flex gap-3">
                  <button onClick={() => handleSocialLogin(t('google_login', language))} className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg border border-[#E9ECEF] dark:border-[#30363D] hover:bg-[#F1F3F5] dark:hover:bg-[#21262D] transition-colors">
                    <svg className="w-4 h-4" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>
                    <span className="text-xs font-medium">{t('google_login', language)}</span>
                  </button>
                  <button onClick={() => handleSocialLogin(t('facebook_login', language))} className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg border border-[#E9ECEF] dark:border-[#30363D] hover:bg-[#F1F3F5] dark:hover:bg-[#21262D] transition-colors">
                    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="#1877F2"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
                    <span className="text-xs font-medium">{t('facebook_login', language)}</span>
                  </button>
                </div>
              </>
            )}

            {/* OTP step */}
            {step === 'otp' && (
              <>
                <div className="space-y-2">
                  <label className="text-sm font-medium">{t('verify_otp', language)}</label>
                  <Input type="text" placeholder={t('otp_placeholder', language)} value={otp} onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))} className="kinput text-center text-2xl tracking-[0.5em] h-14" maxLength={6} />
                  <p className="text-xs text-[#6C757D] dark:text-[#8B949E] text-center">{language === 'sw' ? 'Weka nambari yoyote (mfano: 123456)' : 'Enter any code (e.g. 123456)'}</p>
                </div>
                <button onClick={handleVerifyOtp} className="kbtn w-full h-11 flex items-center justify-center gap-2"><Shield className="w-4 h-4" />{t('verify_otp', language)}</button>
                <button onClick={() => setStep('phone')} className="w-full py-2.5 rounded-lg text-sm font-medium border border-[#E9ECEF] dark:border-[#30363D] hover:bg-[#F1F3F5] dark:hover:bg-[#21262D] transition-colors">{t('back', language)}</button>
              </>
            )}

            {/* Role selection */}
            {step === 'role' && (
              <>
                <div className="space-y-3">
                  <button onClick={() => setSelectedRole('seeker')} className={`w-full p-4 rounded-xl text-left transition-all border ${selectedRole === 'seeker' ? 'border-[#0B5D3A] bg-[#E8F5EE] dark:bg-[#0D2818] ring-2 ring-[#0B5D3A]/20' : 'border-[#E9ECEF] dark:border-[#30363D] hover:bg-[#F1F3F5] dark:hover:bg-[#21262D]'}`}>
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-full bg-[#FFD700] flex items-center justify-center"><MapPin className="w-6 h-6 text-[#212529]" /></div>
                      <div><div className="font-semibold">{t('role_seeker', language)}</div><div className="text-xs text-[#6C757D] dark:text-[#8B949E]">{language === 'sw' ? 'Tafuta mwongozo wa soko' : 'Find a market guide'}</div></div>
                    </div>
                  </button>
                  <button onClick={() => setSelectedRole('guide')} className={`w-full p-4 rounded-xl text-left transition-all border ${selectedRole === 'guide' ? 'border-[#0B5D3A] bg-[#E8F5EE] dark:bg-[#0D2818] ring-2 ring-[#0B5D3A]/20' : 'border-[#E9ECEF] dark:border-[#30363D] hover:bg-[#F1F3F5] dark:hover:bg-[#21262D]'}`}>
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-full bg-[#0B5D3A] flex items-center justify-center"><Compass className="w-6 h-6 text-white" /></div>
                      <div><div className="font-semibold">{t('role_guide', language)}</div><div className="text-xs text-[#6C757D] dark:text-[#8B949E]">{language === 'sw' ? 'Kuwa mwongozo wa soko' : 'Become a market guide'}</div></div>
                    </div>
                  </button>
                </div>
                <button onClick={handleRoleSelect} disabled={!selectedRole || isLoading} className="kbtn w-full h-11 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed">
                  {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}{t('login', language)}
                </button>
              </>
            )}
          </div>

          {/* Quick demo login */}
          <div className="mt-6">
            <p className="text-xs text-center text-[#6C757D] dark:text-[#8B949E] mb-3">{t('demo_mode', language)}:</p>
            <div className="flex gap-2">
              <button onClick={() => quickLogin('seeker')} disabled={isLoading} className="flex-1 py-2 px-3 rounded-lg text-xs font-medium border border-[#E9ECEF] dark:border-[#30363D] hover:bg-[#F1F3F5] dark:hover:bg-[#21262D] transition-colors disabled:opacity-50 flex items-center justify-center gap-1.5">
                {isLoading ? <Loader2 className="w-3 h-3 animate-spin" /> : <><MapPin className="w-3 h-3 text-[#0B5D3A]" /> Seeker</>}
              </button>
              <button onClick={() => quickLogin('guide')} disabled={isLoading} className="flex-1 py-2 px-3 rounded-lg text-xs font-medium border border-[#E9ECEF] dark:border-[#30363D] hover:bg-[#F1F3F5] dark:hover:bg-[#21262D] transition-colors disabled:opacity-50 flex items-center justify-center gap-1.5">
                {isLoading ? <Loader2 className="w-3 h-3 animate-spin" /> : <><Compass className="w-3 h-3 text-[#0B5D3A]" /> Guide</>}
              </button>
              <button onClick={() => quickLogin('admin')} disabled={isLoading} className="flex-1 py-2 px-3 rounded-lg text-xs font-medium border border-[#E9ECEF] dark:border-[#30363D] hover:bg-[#F1F3F5] dark:hover:bg-[#21262D] transition-colors disabled:opacity-50 flex items-center justify-center gap-1.5">
                {isLoading ? <Loader2 className="w-3 h-3 animate-spin" /> : <><Shield className="w-3 h-3 text-[#8A2BE2]" /> Admin</>}
              </button>
            </div>
          </div>

          <div className="mt-8 text-center text-xs text-[#6C757D] dark:text-[#8B949E]">
            <p>Kariakoo, Dar es Salaam, Tanzania</p>
            <p className="mt-1">v1.0.0 &middot; {t('powered_by', language)} Kariako Guide</p>
          </div>
        </div>
      </div>
    </>
  );
}

export default function AuthPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-[#F8F9FA] dark:bg-[#0D1117]"><div className="animate-spin w-8 h-8 border-2 border-[#0B5D3A] border-t-transparent rounded-full" /></div>}>
      <AuthContent />
    </Suspense>
  );
}

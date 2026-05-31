'use client';

import { useState, useEffect, useRef, useCallback, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuthStore } from '@/lib/stores/auth-store';
import { useAppStore } from '@/lib/stores/app-store';
import { t } from '@/lib/i18n';
import { LanguageToggle } from '@/components/language-toggle';
import { Input } from '@/components/ui/input';
import {
  MapPin, Phone, Shield, Compass, Loader2, Mail, User, Eye, EyeOff,
  ArrowRight, CheckCircle2, Star, Zap, Users, Sparkles
} from 'lucide-react';
import { signIn, useSession } from 'next-auth/react';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';

// ── NextAuth Session Sync ──
function NextAuthSessionSync() {
  const { data: session } = useSession();
  const { setUser, setGuideProfile, isAuthenticated } = useAuthStore();
  const syncedRef = useRef(false);

  useEffect(() => {
    if (!isAuthenticated) syncedRef.current = false;
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

// ── Animated Background Dots ──
function AnimatedBackground() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {/* Floating orbs */}
      <div className="absolute top-[10%] right-[15%] w-72 h-72 rounded-full bg-[#F59E0B]/5 blur-3xl animate-float" />
      <div className="absolute bottom-[20%] left-[10%] w-96 h-96 rounded-full bg-white/3 blur-3xl animate-float-slow" />
      <div className="absolute top-[60%] right-[5%] w-48 h-48 rounded-full bg-[#34D399]/5 blur-3xl animate-float-reverse" />

      {/* Grid pattern overlay */}
      <div className="absolute inset-0 opacity-[0.015]"
        style={{
          backgroundImage: `radial-gradient(circle, white 1px, transparent 1px)`,
          backgroundSize: '32px 32px'
        }}
      />
    </div>
  );
}

// ── Auth Screen ──
function AuthContent() {
  const { login, language, isLoading, isAuthenticated } = useAuthStore();
  const { showOnboarding } = useAppStore();
  const router = useRouter();
  const searchParams = useSearchParams();
  const preselectedRole = searchParams.get('role');

  const [authMode, setAuthMode] = useState<'login' | 'register'>(preselectedRole === 'guide' ? 'register' : 'login');
  const [step, setStep] = useState<'main' | 'otp' | 'role'>('main');
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [selectedRole, setSelectedRole] = useState<'seeker' | 'guide' | ''>(
    preselectedRole === 'guide' ? 'guide' : preselectedRole === 'seeker' ? 'seeker' : ''
  );
  const [error, setError] = useState('');
  const [agreeTerms, setAgreeTerms] = useState(false);

  useEffect(() => {
    if (isAuthenticated) router.replace('/');
  }, [isAuthenticated, router, showOnboarding]);

  const handleSendOtp = () => {
    if (phone.length < 9) { setError(language === 'sw' ? 'Weka nambari sahihi ya simu' : 'Enter a valid phone number'); return; }
    if (authMode === 'register' && !name.trim()) { setError(language === 'sw' ? 'Weka jina lako' : 'Enter your name'); return; }
    setError(''); setStep('otp');
  };

  const handleVerifyOtp = () => {
    if (otp.length < 4) { setError(language === 'sw' ? 'Weka nambari ya uthibitisho' : 'Enter the verification code'); return; }
    setError('');
    if (authMode === 'register') setStep('role');
    else {
      // Login: go directly
      handleLogin();
    }
  };

  const handleLogin = async () => {
    setError('');
    try {
      const fullPhone = phone.startsWith('+') ? phone : `+255${phone.replace(/^0/, '')}`;
      // Don't override role for login - the API will use the existing user's role
      await login(fullPhone, undefined, undefined);
    } catch { setError(language === 'sw' ? 'Hitilafu katika kuingia' : 'Login failed. Please try again.'); }
  };

  const handleRoleSelect = async () => {
    if (!selectedRole) return;
    setError('');
    try {
      const fullPhone = phone.startsWith('+') ? phone : `+255${phone.replace(/^0/, '')}`;
      const roleName = name || (selectedRole === 'seeker' ? 'Demo Seeker' : 'Demo Guide');
      await login(fullPhone, selectedRole, roleName);
    } catch { setError(language === 'sw' ? 'Hitilafu katika kuingia' : 'Registration failed. Please try again.'); }
  };

  const quickLogin = async (role: string) => {
    setError('');
    try {
      let phoneNum = '', nameStr = '';
      if (role === 'seeker') { phoneNum = '+14155550001'; nameStr = 'Demo Seeker'; }
      else if (role === 'guide') { phoneNum = '+255712000001'; nameStr = 'Demo Guide'; }
      else if (role === 'admin') { phoneNum = '+255700000001'; nameStr = 'Admin'; }
      await login(phoneNum, role, nameStr);
    } catch { setError(language === 'sw' ? 'Hitilafu katika kuingia' : 'Login failed'); }
  };

  const handleSocialLogin = useCallback((provider: string) => {
    const providerMap: Record<string, string> = { 'Google': 'google', 'google': 'google', 'Facebook': 'facebook', 'facebook': 'facebook', 'Apple': 'apple', 'apple': 'apple' };
    const providerId = providerMap[provider];
    if (providerId === 'google' || providerId === 'facebook') { signIn(providerId, { callbackUrl: '/' }); }
    else { toast.info(`${provider} ${t('demo_mode', language).toLowerCase()} — Coming soon!`); }
  }, [language]);

  const sw = language === 'sw';

  return (
    <>
      <NextAuthSessionSync />
      <div className="min-h-screen flex flex-col auth-bg">
        <AnimatedBackground />

        {/* Top bar */}
        <div className="relative z-10 flex items-center justify-between p-4">
          <button onClick={() => router.push('/')} className="w-10 h-10 rounded-xl bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors text-white text-sm backdrop-blur-sm" aria-label="Back">
            ←
          </button>
          <LanguageToggle className="bg-white/10 border-white/20 text-white rounded-full backdrop-blur-sm" />
        </div>

        {/* Main Content */}
        <div className="relative z-10 flex-1 flex flex-col justify-center px-5 pb-8">
          <div className="w-full max-w-sm mx-auto">
            {/* Logo */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="text-center mb-6"
            >
              <div className="w-16 h-16 rounded-2xl bg-white/15 backdrop-blur-sm mx-auto flex items-center justify-center mb-3 ring-1 ring-white/20">
                <Compass className="w-8 h-8 text-[#F59E0B]" strokeWidth={2.5} />
              </div>
              <h1 className="text-2xl font-black text-white tracking-tight">
                Kariako<span className="text-[#F59E0B]">Guide</span>
              </h1>
              <p className="text-white/50 mt-1 text-sm">
                {sw ? 'Soko lako, Mwongozo wako' : 'Your Market, Your Guide'}
              </p>
            </motion.div>

            {/* Auth Card */}
            <motion.div
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15, duration: 0.5 }}
              className="auth-card p-6"
            >
              {/* Login / Register Tabs */}
              {step === 'main' && (
                <div className="flex bg-[#F1F5F9] dark:bg-[#334155] rounded-xl p-1 mb-6">
                  <button
                    onClick={() => { setAuthMode('login'); setError(''); }}
                    className={`flex-1 py-2.5 text-sm font-semibold rounded-lg transition-all duration-300 ${
                      authMode === 'login' ? 'auth-tab-active' : 'auth-tab-inactive'
                    }`}
                  >
                    {sw ? 'Ingia' : 'Login'}
                  </button>
                  <button
                    onClick={() => { setAuthMode('register'); setError(''); }}
                    className={`flex-1 py-2.5 text-sm font-semibold rounded-lg transition-all duration-300 ${
                      authMode === 'register' ? 'auth-tab-active' : 'auth-tab-inactive'
                    }`}
                  >
                    {sw ? 'Jisajili' : 'Register'}
                  </button>
                </div>
              )}

              {error && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="bg-[#FEE2E2] dark:bg-[#2D1B1B] text-[#DC2626] p-3 rounded-xl text-sm text-center mb-4"
                >
                  {error}
                </motion.div>
              )}

              {/* ── MAIN STEP: Login or Register form ── */}
              {step === 'main' && (
                <div className="space-y-4">
                  {/* Name field - only register */}
                  {authMode === 'register' && (
                    <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="space-y-1.5">
                      <label className="text-xs font-semibold text-[#64748B] dark:text-[#94A3B8] uppercase tracking-wider">
                        {sw ? 'Jina Kamili' : 'Full Name'}
                      </label>
                      <div className="relative">
                        <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#64748B]" />
                        <Input
                          type="text"
                          placeholder={sw ? 'Mfano: Juma Ahmed' : 'e.g. Juma Ahmed'}
                          value={name}
                          onChange={(e) => setName(e.target.value)}
                          className="kinput pl-10 w-full"
                        />
                      </div>
                    </motion.div>
                  )}

                  {/* Email field - only register */}
                  {authMode === 'register' && (
                    <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="space-y-1.5">
                      <label className="text-xs font-semibold text-[#64748B] dark:text-[#94A3B8] uppercase tracking-wider">
                        {sw ? 'Barua Pepe' : 'Email'} <span className="text-[#64748B] font-normal normal-case">({sw ? 'si lazima' : 'optional'})</span>
                      </label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#64748B]" />
                        <Input
                          type="email"
                          placeholder={sw ? 'barua@mfano.com' : 'email@example.com'}
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          className="kinput pl-10 w-full"
                        />
                      </div>
                    </motion.div>
                  )}

                  {/* Phone field */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-[#64748B] dark:text-[#94A3B8] uppercase tracking-wider">
                      {sw ? 'Nambari ya Simu' : 'Phone Number'}
                    </label>
                    <div className="flex gap-2">
                      <div className="flex items-center px-3 bg-[#F1F5F9] dark:bg-[#334155] rounded-xl text-sm font-semibold min-w-fit border border-[#E2E8F0] dark:border-[#475569] h-11">
                        🇹🇿 +255
                      </div>
                      <Input
                        type="tel"
                        placeholder={sw ? '712 345 678' : '712 345 678'}
                        value={phone}
                        onChange={(e) => setPhone(e.target.value.replace(/\D/g, ''))}
                        className="kinput flex-1 h-11"
                        maxLength={10}
                      />
                    </div>
                  </div>

                  {/* Password field - login */}
                  {authMode === 'login' && (
                    <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="space-y-1.5">
                      <div className="flex items-center justify-between">
                        <label className="text-xs font-semibold text-[#64748B] dark:text-[#94A3B8] uppercase tracking-wider">
                          {sw ? 'Nenosiri' : 'Password'}
                        </label>
                        <button className="text-xs font-medium text-[#065F46] dark:text-[#34D399] hover:underline">
                          {sw ? 'Umesahau?' : 'Forgot?'}
                        </button>
                      </div>
                      <div className="relative">
                        <Shield className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#64748B]" />
                        <Input
                          type={showPassword ? 'text' : 'password'}
                          placeholder={sw ? 'Weka nenosiri' : 'Enter password'}
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          className="kinput pl-10 pr-10 w-full h-11"
                        />
                        <button
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-[#64748B] hover:text-[#065F46] transition-colors"
                        >
                          {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                    </motion.div>
                  )}

                  {/* Terms checkbox - register */}
                  {authMode === 'register' && (
                    <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="flex items-start gap-2.5">
                      <button
                        onClick={() => setAgreeTerms(!agreeTerms)}
                        className={`w-5 h-5 rounded-md border-2 flex items-center justify-center shrink-0 mt-0.5 transition-all ${
                          agreeTerms ? 'bg-[#065F46] border-[#065F46]' : 'border-[#CBD5E1] dark:border-[#475569]'
                        }`}
                      >
                        {agreeTerms && <CheckCircle2 className="w-3 h-3 text-white" />}
                      </button>
                      <span className="text-xs text-[#64748B] dark:text-[#94A3B8] leading-relaxed">
                        {sw
                          ? 'Nakubaliana na Masharti ya Matumizi na Sera ya Faragha ya KariakoGuide'
                          : 'I agree to KariakoGuide\'s Terms of Service and Privacy Policy'}
                      </span>
                    </motion.div>
                  )}

                  {/* Submit button */}
                  <button
                    onClick={handleSendOtp}
                    disabled={authMode === 'register' && !agreeTerms}
                    className="kbtn w-full h-12 text-sm disabled:opacity-40 disabled:cursor-not-allowed disabled:transform-none"
                  >
                    {authMode === 'login' ? (
                      <>{sw ? 'Ingia kwenye Akaunti' : 'Sign In'}<ArrowRight className="w-4 h-4" /></>
                    ) : (
                      <>{sw ? 'Endelea kujisajili' : 'Continue Registration'}<ArrowRight className="w-4 h-4" /></>
                    )}
                  </button>

                  {/* Divider */}
                  <div className="relative flex items-center gap-3 py-1">
                    <div className="flex-1 h-px bg-[#E2E8F0] dark:bg-[#475569]" />
                    <span className="text-[11px] text-[#64748B] dark:text-[#94A3B8] whitespace-nowrap font-medium uppercase tracking-wider">
                      {sw ? 'au ingia kwa' : 'or continue with'}
                    </span>
                    <div className="flex-1 h-px bg-[#E2E8F0] dark:bg-[#475569]" />
                  </div>

                  {/* Social Login */}
                  <div className="flex gap-3">
                    <button onClick={() => handleSocialLogin('Google')} className="auth-social-btn flex-1">
                      <svg className="w-5 h-5" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>
                      <span className="text-sm font-medium">Google</span>
                    </button>
                    <button onClick={() => handleSocialLogin('Facebook')} className="auth-social-btn flex-1">
                      <svg className="w-5 h-5" viewBox="0 0 24 24" fill="#1877F2"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
                      <span className="text-sm font-medium">Facebook</span>
                    </button>
                  </div>
                </div>
              )}

              {/* ── OTP STEP ── */}
              {step === 'otp' && (
                <div className="space-y-4">
                  <div className="text-center mb-2">
                    <div className="w-14 h-14 rounded-2xl bg-[#ECFDF5] dark:bg-[#022C22] mx-auto flex items-center justify-center mb-3">
                      <Phone className="w-6 h-6 text-[#065F46] dark:text-[#34D399]" />
                    </div>
                    <h2 className="text-lg font-bold">{sw ? 'Thibitisha Nambari yako' : 'Verify Your Number'}</h2>
                    <p className="text-sm text-[#64748B] dark:text-[#94A3B8] mt-1">
                      {sw ? `Tumetuma nambari kwa +255${phone.replace(/^0/, '')}` : `We sent a code to +255${phone.replace(/^0/, '')}`}
                    </p>
                  </div>
                  <Input
                    type="text"
                    placeholder="• • • • • •"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                    className="kinput text-center text-2xl tracking-[0.5em] h-14 font-bold"
                    maxLength={6}
                  />
                  <p className="text-xs text-[#64748B] dark:text-[#94A3B8] text-center">
                    {sw ? 'Weka nambari yoyote (mfano: 123456)' : 'Enter any code (e.g. 123456) — Demo mode'}
                  </p>
                  <button onClick={handleVerifyOtp} className="kbtn w-full h-12 text-sm">
                    <Shield className="w-4 h-4" />{sw ? 'Thibitisha' : 'Verify Code'}
                  </button>
                  <button onClick={() => setStep('main')} className="w-full py-2.5 rounded-xl text-sm font-medium border border-[#E2E8F0] dark:border-[#475569] hover:bg-[#F1F5F9] dark:hover:bg-[#334155] transition-colors">
                    {sw ? 'Rudi' : 'Go Back'}
                  </button>
                </div>
              )}

              {/* ── ROLE SELECTION STEP ── */}
              {step === 'role' && (
                <div className="space-y-4">
                  <div className="text-center mb-2">
                    <h2 className="text-lg font-bold">{sw ? 'Chagua Jukumu Lako' : 'Choose Your Role'}</h2>
                    <p className="text-sm text-[#64748B] dark:text-[#94A3B8] mt-1">
                      {sw ? 'Jiwasilishe vipi na Kariakoo?' : 'How do you connect with Kariakoo?'}
                    </p>
                  </div>

                  <div className="space-y-3">
                    {/* Seeker */}
                    <motion.button
                      whileTap={{ scale: 0.98 }}
                      onClick={() => setSelectedRole('seeker')}
                      className={`w-full p-4 rounded-2xl text-left transition-all border-2 ${
                        selectedRole === 'seeker'
                          ? 'border-[#065F46] bg-[#ECFDF5] dark:bg-[#022C22] shadow-md'
                          : 'border-[#E2E8F0] dark:border-[#475569] hover:border-[#065F46]/30 hover:bg-[#F8FAFC] dark:hover:bg-[#334155]'
                      }`}
                    >
                      <div className="flex items-center gap-3.5">
                        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#F59E0B] to-[#FBBF24] flex items-center justify-center shadow-sm">
                          <MapPin className="w-6 h-6 text-white" />
                        </div>
                        <div className="flex-1">
                          <div className="font-bold text-sm">{sw ? 'Mtafuta Mwongozo' : 'Market Seeker'}</div>
                          <div className="text-xs text-[#64748B] dark:text-[#94A3B8] mt-0.5">
                            {sw ? 'Tafuta mwongozo, pata bei bora, nunua kwa ujasiri' : 'Find guides, get fair prices, shop with confidence'}
                          </div>
                        </div>
                        {selectedRole === 'seeker' && (
                          <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }}>
                            <CheckCircle2 className="w-5 h-5 text-[#065F46]" />
                          </motion.div>
                        )}
                      </div>
                    </motion.button>

                    {/* Guide */}
                    <motion.button
                      whileTap={{ scale: 0.98 }}
                      onClick={() => setSelectedRole('guide')}
                      className={`w-full p-4 rounded-2xl text-left transition-all border-2 ${
                        selectedRole === 'guide'
                          ? 'border-[#065F46] bg-[#ECFDF5] dark:bg-[#022C22] shadow-md'
                          : 'border-[#E2E8F0] dark:border-[#475569] hover:border-[#065F46]/30 hover:bg-[#F8FAFC] dark:hover:bg-[#334155]'
                      }`}
                    >
                      <div className="flex items-center gap-3.5">
                        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#065F46] to-[#34D399] flex items-center justify-center shadow-sm">
                          <Compass className="w-6 h-6 text-white" />
                        </div>
                        <div className="flex-1">
                          <div className="font-bold text-sm">{sw ? 'Mwongozo wa Soko' : 'Market Guide'}</div>
                          <div className="text-xs text-[#64748B] dark:text-[#94A3B8] mt-0.5">
                            {sw ? 'Pata pato kwa kuongoza wageni katika soko' : 'Earn by guiding visitors through the market'}
                          </div>
                        </div>
                        {selectedRole === 'guide' && (
                          <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }}>
                            <CheckCircle2 className="w-5 h-5 text-[#065F46]" />
                          </motion.div>
                        )}
                      </div>
                    </motion.button>
                  </div>

                  <button
                    onClick={handleRoleSelect}
                    disabled={!selectedRole || isLoading}
                    className="kbtn w-full h-12 text-sm disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                    {sw ? 'Anza Sasa' : 'Get Started'}
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              )}
            </motion.div>

            {/* Quick Demo Access */}
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.5 }}
              className="mt-5"
            >
              <p className="text-[11px] text-center text-white/40 mb-2.5 uppercase tracking-wider font-semibold">
                {sw ? 'Jaribu haraka' : 'Quick Demo Access'}
              </p>
              <div className="flex gap-2">
                {[
                  { role: 'seeker', icon: MapPin, color: 'from-[#F59E0B] to-[#FBBF24]' },
                  { role: 'guide', icon: Compass, color: 'from-[#065F46] to-[#34D399]' },
                  { role: 'admin', icon: Shield, color: 'from-[#7C3AED] to-[#6D28D9]' },
                ].map(({ role, icon: Icon, color }) => (
                  <button
                    key={role}
                    onClick={() => quickLogin(role)}
                    disabled={isLoading}
                    className="flex-1 py-2.5 px-3 rounded-xl text-xs font-semibold bg-white/8 hover:bg-white/15 backdrop-blur-sm border border-white/10 hover:border-white/20 transition-all disabled:opacity-40 flex items-center justify-center gap-1.5 text-white"
                  >
                    {isLoading ? <Loader2 className="w-3 h-3 animate-spin" /> : (
                      <div className={`w-5 h-5 rounded-md bg-gradient-to-br ${color} flex items-center justify-center`}>
                        <Icon className="w-3 h-3 text-white" />
                      </div>
                    )}
                    <span className="capitalize">{role}</span>
                  </button>
                ))}
              </div>
            </motion.div>

            {/* Trust Indicators */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
              className="mt-6 flex items-center justify-center gap-4"
            >
              {[
                { icon: Shield, label: sw ? 'Salama' : 'Secure' },
                { icon: Zap, label: sw ? 'Haraka' : 'Fast' },
                { icon: Star, label: sw ? 'Bora' : 'Trusted' },
              ].map(({ icon: TIcon, label }) => (
                <div key={label} className="flex items-center gap-1 text-white/30">
                  <TIcon className="w-3 h-3" />
                  <span className="text-[10px] font-medium uppercase tracking-wider">{label}</span>
                </div>
              ))}
            </motion.div>
          </div>
        </div>
      </div>
    </>
  );
}

export default function AuthPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center auth-bg">
        <AnimatedBackground />
        <div className="relative z-10 flex flex-col items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-white/15 backdrop-blur-sm flex items-center justify-center animate-pulse">
            <Compass className="w-6 h-6 text-[#F59E0B]" />
          </div>
          <div className="w-8 h-8 border-2 border-white/30 border-t-[#F59E0B] rounded-full animate-spin" />
        </div>
      </div>
    }>
      <AuthContent />
    </Suspense>
  );
}

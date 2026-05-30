'use client';

import { useEffect, useState, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/lib/stores/auth-store';
import { useAppStore } from '@/lib/stores/app-store';
import { t } from '@/lib/i18n';
import { LanguageToggle } from '@/components/language-toggle';
import {
  Compass,
  MapPin,
  Shield,
  Moon,
  Sun,
  ChevronRight,
  Star,
  Users,
  Globe,
  MessageCircle,
  Calendar,
  Zap,
  DollarSign,
  Navigation,
  CheckCircle2,
  ArrowRight,
  Quote,
  Sparkles,
  TrendingUp,
  Heart,
  Play,
} from 'lucide-react';

// ── Animated Counter ──
function AnimatedCounter({ target, suffix = '' }: { target: number; suffix?: string }) {
  const [count, setCount] = useState(0);
  const { ref, inView } = useInView(0.3);

  useEffect(() => {
    if (!inView) return;
    let start = 0;
    const duration = 2000;
    const increment = target / (duration / 16);
    const timer = setInterval(() => {
      start += increment;
      if (start >= target) {
        setCount(target);
        clearInterval(timer);
      } else {
        setCount(Math.floor(start));
      }
    }, 16);
    return () => clearInterval(timer);
  }, [inView, target]);

  return <span ref={ref}>{count.toLocaleString()}{suffix}</span>;
}

// ── Intersection Observer Hook ──
function useInView(threshold = 0.15) {
  const ref = useRef<HTMLDivElement>(null);
  const [inView, setInView] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setInView(true);
          observer.unobserve(el);
        }
      },
      { threshold }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [threshold]);

  return { ref, inView };
}

// ── Animated Section ──
function AnimatedSection({ children, className = '', delay = 0 }: { children: React.ReactNode; className?: string; delay?: number }) {
  const { ref, inView } = useInView();
  return (
    <div
      ref={ref}
      className={`transition-all duration-700 ease-out ${className} ${
        inView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
      }`}
      style={{ transitionDelay: `${delay}ms` }}
    >
      {children}
    </div>
  );
}

// ── Feature Card ──
function FeatureCard({
  icon,
  title,
  description,
  color,
  delay,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  color: 'amber' | 'emerald' | 'purple' | 'blue' | 'rose' | 'teal';
  delay: number;
}) {
  const colorMap = {
    amber: { gradient: 'from-amber-400 to-orange-500', bg: 'bg-amber-500/10', ring: 'ring-amber-400/20' },
    emerald: { gradient: 'from-emerald-400 to-teal-500', bg: 'bg-emerald-500/10', ring: 'ring-emerald-400/20' },
    purple: { gradient: 'from-purple-400 to-violet-500', bg: 'bg-purple-500/10', ring: 'ring-purple-400/20' },
    blue: { gradient: 'from-blue-400 to-indigo-500', bg: 'bg-blue-500/10', ring: 'ring-blue-400/20' },
    rose: { gradient: 'from-rose-400 to-pink-500', bg: 'bg-rose-500/10', ring: 'ring-rose-400/20' },
    teal: { gradient: 'from-teal-400 to-cyan-500', bg: 'bg-teal-500/10', ring: 'ring-teal-400/20' },
  };
  const c = colorMap[color];

  return (
    <AnimatedSection delay={delay}>
      <div className="glass-card-premium p-7 h-full group cursor-default">
        <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${c.gradient} flex items-center justify-center mb-5 group-hover:scale-110 group-hover:rotate-3 transition-all duration-500 ring-4 ${c.ring}`}>
          <div className="text-white">{icon}</div>
        </div>
        <h3 className="font-bold text-lg mb-2.5">{title}</h3>
        <p className="text-sm text-muted-foreground leading-relaxed">{description}</p>
      </div>
    </AnimatedSection>
  );
}

// ── Step Card ──
function StepCard({
  step,
  title,
  description,
  icon,
  delay,
}: {
  step: number;
  title: string;
  description: string;
  icon: React.ReactNode;
  delay: number;
}) {
  return (
    <AnimatedSection delay={delay}>
      <div className="glass-card-premium p-8 text-center h-full relative overflow-hidden">
        <div className="absolute -top-3 -right-3 text-[7rem] font-black opacity-[0.03] gradient-text-warm select-none leading-none">
          {step}
        </div>
        {/* Connector line on desktop */}
        {step < 3 && (
          <div className="hidden lg:block absolute top-1/2 -right-3 w-6 h-0.5 bg-gradient-to-r from-amber-400/30 to-transparent" />
        )}
        <div className="w-16 h-16 rounded-2xl glass-button mx-auto mb-5 flex items-center justify-center text-white ring-4 ring-amber-400/10">
          {icon}
        </div>
        <div className="text-xs font-black gradient-text-warm mb-2 uppercase tracking-[0.2em]">
          Step {step}
        </div>
        <h3 className="font-bold text-lg mb-3">{title}</h3>
        <p className="text-sm text-muted-foreground leading-relaxed">{description}</p>
      </div>
    </AnimatedSection>
  );
}

// ── Testimonial Card ──
function TestimonialCard({
  name,
  role,
  quote,
  rating,
  avatar,
  delay,
}: {
  name: string;
  role: string;
  quote: string;
  rating: number;
  avatar: string;
  delay: number;
}) {
  return (
    <AnimatedSection delay={delay}>
      <div className="glass-card-premium p-7 h-full flex flex-col">
        <div className="flex items-center gap-1.5 mb-4">
          {Array.from({ length: rating }).map((_, i) => (
            <Star key={i} className="w-4 h-4 fill-amber-400 text-amber-400" />
          ))}
        </div>
        <Quote className="w-10 h-10 gradient-text opacity-20 mb-2" />
        <p className="text-sm leading-relaxed flex-1 mb-5">{quote}</p>
        <div className="flex items-center gap-3 pt-4 border-t border-[var(--glass-border)]">
          <div className="w-11 h-11 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center text-white text-sm font-bold ring-2 ring-amber-400/20">
            {avatar}
          </div>
          <div>
            <p className="text-sm font-semibold">{name}</p>
            <p className="text-xs text-muted-foreground">{role}</p>
          </div>
          <div className="ml-auto">
            <CheckCircle2 className="w-5 h-5 text-emerald-500" />
          </div>
        </div>
      </div>
    </AnimatedSection>
  );
}

// ── Stat Item ──
function StatItem({ value, suffix, label, icon, delay }: { value: number; suffix: string; label: string; icon: React.ReactNode; delay: number }) {
  return (
    <AnimatedSection delay={delay}>
      <div className="glass-card-premium p-6 text-center group">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-400/20 to-orange-400/10 mx-auto mb-3 flex items-center justify-center text-amber-500 group-hover:scale-110 transition-transform">
          {icon}
        </div>
        <div className="text-3xl sm:text-4xl font-black gradient-text-warm mb-1">
          <AnimatedCounter target={value} suffix={suffix} />
        </div>
        <div className="text-xs text-muted-foreground font-medium uppercase tracking-wider">{label}</div>
      </div>
    </AnimatedSection>
  );
}

// ── Main Landing Page ──
export default function LandingPage() {
  const { language, isAuthenticated } = useAuthStore();
  const { darkMode, setDarkMode } = useAppStore();
  const router = useRouter();

  useEffect(() => {
    if (isAuthenticated) {
      router.replace('/dashboard');
    }
  }, [isAuthenticated, router]);

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  const sw = language === 'sw';
  const l = (en: string, swText: string) => (sw ? swText : en);

  return (
    <div className="min-h-screen overflow-hidden">
      {/* ═══ Animated Background ═══ */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <div className="orb orb-amber w-[500px] h-[500px] -top-[10%] -left-[5%]" />
        <div className="orb orb-emerald w-[400px] h-[400px] top-[20%] -right-[8%]" />
        <div className="orb orb-warm w-[350px] h-[350px] -bottom-[5%] left-[30%]" />
        <div className="grid-pattern absolute inset-0 opacity-40" />
      </div>

      {/* ═══ NAVIGATION ═══ */}
      <nav className="glass-nav sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl glass-card flex items-center justify-center animate-pulse-glow">
              <Compass className="w-5 h-5 gradient-text" strokeWidth={2.5} />
            </div>
            <span className="text-xl font-black gradient-text-warm tracking-tight">{t('app_name', language)}</span>
          </div>

          <div className="hidden md:flex items-center gap-8 text-sm font-medium">
            <a href="#features" className="text-muted-foreground hover:text-foreground transition-colors relative group">
              {l('Features', 'Vipengele')}
              <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-gradient-to-r from-amber-500 to-orange-500 group-hover:w-full transition-all duration-300" />
            </a>
            <a href="#how-it-works" className="text-muted-foreground hover:text-foreground transition-colors relative group">
              {l('How It Works', 'Jinsi Inavyofanya Kazi')}
              <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-gradient-to-r from-amber-500 to-orange-500 group-hover:w-full transition-all duration-300" />
            </a>
            <a href="#testimonials" className="text-muted-foreground hover:text-foreground transition-colors relative group">
              {l('Testimonials', 'Mashuhuda')}
              <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-gradient-to-r from-amber-500 to-orange-500 group-hover:w-full transition-all duration-300" />
            </a>
          </div>

          <div className="flex items-center gap-2">
            <LanguageToggle className="glass rounded-full" />
            <button
              onClick={() => setDarkMode(!darkMode)}
              className="glass w-9 h-9 rounded-full flex items-center justify-center hover:bg-[var(--glass-hover)] transition-colors"
              aria-label="Toggle dark mode"
            >
              {darkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>
            <Link
              href="/auth"
              className="glass-button px-5 h-9 text-sm flex items-center gap-1.5 rounded-xl"
            >
              {l('Get Started', 'Anza Sasa')}
              <ChevronRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </nav>

      {/* ═══ HERO SECTION ═══ */}
      <section className="relative pt-20 pb-32 sm:pt-28 sm:pb-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 relative z-10">
          <AnimatedSection>
            <div className="text-center max-w-4xl mx-auto">
              {/* Live badge */}
              <div className="inline-flex items-center gap-2 glass-card-premium rounded-full px-5 py-2 mb-8">
                <span className="relative flex h-2.5 w-2.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500" />
                </span>
                <span className="text-sm font-medium">
                  {l('Now live in Kariakoo Market', 'Sasa iko hai Sokoni Kariakoo')}
                </span>
                <Sparkles className="w-4 h-4 text-amber-500" />
              </div>

              {/* Headline */}
              <h1 className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-black leading-[0.95] mb-7 tracking-tight">
                <span className="gradient-text-warm animate-gradient bg-[length:200%_200%]">
                  {l('Discover', 'Gundua')}
                </span>
                <br />
                <span className="text-foreground">
                  {l('Kariakoo', 'Kariakoo')}
                </span>
                <br />
                <span className="gradient-text-warm animate-gradient bg-[length:200%_200%]" style={{ animationDelay: '2s' }}>
                  {l('Like a Local', 'Kama Mwenzetu')}
                </span>
              </h1>

              {/* Subtitle */}
              <p className="text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto mb-10 leading-relaxed">
                {l(
                  'Connect with trusted local guides who know every corner of Africa\'s largest open market. Navigate with confidence, bargain like a pro.',
                  'Ungana na miongozo wa kuaminika wanaojua kila kona ya soko kubwa zaidi barani Afrika. Tembea kwa kujiamini, pata bei nzuri.'
                )}
              </p>

              {/* CTAs */}
              <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-6">
                <Link
                  href="/auth"
                  className="glass-button px-10 h-14 text-lg flex items-center gap-3 rounded-2xl group"
                >
                  <MapPin className="w-5 h-5 group-hover:rotate-12 transition-transform" />
                  {l('Start Exploring', 'Anza Kutembea')}
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </Link>
                <Link
                  href="/auth?role=guide"
                  className="glass-button-emerald px-10 h-14 text-lg flex items-center gap-3 rounded-2xl group"
                >
                  <Compass className="w-5 h-5 group-hover:rotate-12 transition-transform" />
                  {l('Become a Guide', 'Kuwa Mwongozo')}
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </Link>
              </div>

              {/* Trust signals */}
              <div className="flex items-center justify-center gap-6 text-xs text-muted-foreground">
                <span className="flex items-center gap-1.5"><Shield className="w-3.5 h-3.5 text-emerald-500" /> {l('Secure', 'Salama')}</span>
                <span className="flex items-center gap-1.5"><Star className="w-3.5 h-3.5 text-amber-500" /> 4.9 {l('Rating', 'Ukadiriaji')}</span>
                <span className="flex items-center gap-1.5"><Users className="w-3.5 h-3.5 text-blue-500" /> 500+ {l('Guides', 'Miongozo')}</span>
              </div>
            </div>
          </AnimatedSection>

          {/* ── Hero Floating Preview Card ── */}
          <AnimatedSection delay={400}>
            <div className="mt-20 relative max-w-md mx-auto">
              <div className="glass-card-premium p-6 animate-float-slow noise-overlay">
                {/* Guide preview */}
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center text-white text-lg font-bold ring-2 ring-amber-400/20">
                    A
                  </div>
                  <div className="flex-1">
                    <p className="font-bold">Amina M.</p>
                    <p className="text-xs text-muted-foreground flex items-center gap-1.5">
                      <span className="relative flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
                      </span>
                      {l('Online now', 'Yupo mtandaoni')}
                    </p>
                  </div>
                  <div className="flex items-center gap-1 glass rounded-xl px-2.5 py-1">
                    <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                    <span className="text-sm font-bold">4.9</span>
                  </div>
                </div>
                <p className="text-sm text-muted-foreground mb-4 leading-relaxed">
                  {l(
                    'I know the best fabric shops and wholesale deals. Let me show you around Kariakoo!',
                    'Najuai maduka mazuri ya vitenge na bei za jumla. Nikuongoze Kariakoo!'
                  )}
                </p>
                <div className="flex gap-2">
                  <div className="glass-button px-5 py-2.5 text-sm rounded-xl flex items-center gap-2">
                    <MapPin className="w-4 h-4" />
                    {l('Book Guide', 'Agiza Mwongozo')}
                  </div>
                  <div className="glass-card px-4 py-2.5 text-sm rounded-xl flex items-center gap-2 hover:bg-[var(--glass-hover)] cursor-pointer transition-colors">
                    <MessageCircle className="w-4 h-4" />
                    {l('Chat', 'Zungumza')}
                  </div>
                </div>
                {/* Decorative dots */}
                <div className="absolute top-3 right-3 flex gap-1">
                  <div className="w-1.5 h-1.5 rounded-full bg-amber-400/40" />
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-400/40" />
                  <div className="w-1.5 h-1.5 rounded-full bg-blue-400/40" />
                </div>
              </div>

              {/* Floating mini card - price radar */}
              <div className="absolute -right-4 sm:-right-12 top-8 glass-card-premium p-3 animate-float-reverse noise-overlay">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center text-white">
                    <TrendingUp className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-emerald-500">{l('Fair Price', 'Bei Nzuri')}</p>
                    <p className="text-[10px] text-muted-foreground">TSh 25,000</p>
                  </div>
                </div>
              </div>

              {/* Floating mini card - rating */}
              <div className="absolute -left-4 sm:-left-12 bottom-12 glass-card-premium p-3 animate-float-slow noise-overlay" style={{ animationDelay: '2s' }}>
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center text-white">
                    <Heart className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-xs font-bold">{l('Top Rated', 'Bora Zaidi')}</p>
                    <div className="flex gap-0.5">
                      {[1,2,3,4,5].map(i => <Star key={i} className="w-2.5 h-2.5 fill-amber-400 text-amber-400" />)}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </AnimatedSection>
        </div>
      </section>

      {/* ═══ STATS SECTION ═══ */}
      <section className="py-16 relative z-10">
        <div className="divider-glow max-w-4xl mx-auto mb-12" />
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <StatItem value={500} suffix="+" label={l('Verified Guides', 'Miongozo')} icon={<Users className="w-5 h-5" />} delay={0} />
            <StatItem value={10} suffix="K+" label={l('Tours Done', 'Ziara')} icon={<Navigation className="w-5 h-5" />} delay={100} />
            <StatItem value={49} suffix="/5" label={l('Avg Rating', 'Ukadiriaji')} icon={<Star className="w-5 h-5" />} delay={200} />
            <StatItem value={50} suffix="+" label={l('Languages', 'Lugha')} icon={<Globe className="w-5 h-5" />} delay={300} />
          </div>
        </div>
      </section>

      {/* ═══ FEATURES SECTION ═══ */}
      <section id="features" className="py-24 sm:py-32 relative z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <AnimatedSection>
            <div className="text-center mb-16">
              <div className="inline-flex items-center gap-2 glass-card-premium rounded-full px-5 py-2 mb-5">
                <Zap className="w-4 h-4 text-amber-500" />
                <span className="text-sm font-semibold">{l('Why Kariako Guide?', 'Kwa Nini Kariako Guide?')}</span>
              </div>
              <h2 className="text-4xl sm:text-5xl font-black mb-5 tracking-tight">
                <span className="gradient-text-warm">{l('Everything You Need', 'Kila Unachohitaji')}</span>
              </h2>
              <p className="text-muted-foreground max-w-2xl mx-auto text-lg leading-relaxed">
                {l(
                  'From finding your perfect guide to securing fair prices, every tool for an unforgettable Kariakoo experience.',
                  'Kutafuta mwongozo wako bora hadi kupata bei nzuri, kila zana kwa uzoefu usisahaulika wa Kariakoo.'
                )}
              </p>
            </div>
          </AnimatedSection>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            <FeatureCard
              icon={<Navigation className="w-6 h-6" />}
              title={l('Find Local Guides', 'Pata Miongozo wa Karibu')}
              description={l(
                'Connect with verified guides who know every alley, shop, and hidden gem in Kariakoo. Browse profiles, ratings, and specialties to find your perfect match.',
                'Ungana na miongozo walioidhinishwa wanaojua kila njia, duka, na hazina iliyofichwa sokoni Kariakoo. Tafuta wasifu na upekee.'
              )}
              color="amber"
              delay={0}
            />
            <FeatureCard
              icon={<DollarSign className="w-6 h-6" />}
              title={l('Price Radar', 'Rada ya Bei')}
              description={l(
                'Know the fair price before you bargain. Our Price Radar shows real-time market rates so you never overpay. Data-driven confidence at your fingertips.',
                'Jua bei nzuri kabla hujabisha. Rada yetu inaonyesha viwango halisi vya soko ili usilipe zaidi. Kujiamini kwa data mikononi mwako.'
              )}
              color="emerald"
              delay={100}
            />
            <FeatureCard
              icon={<Shield className="w-6 h-6" />}
              title={l('Escrow Payments', 'Malipo ya Escrow')}
              description={l(
                'Pay securely through our trusted escrow system. Your money is held safely until the service is delivered. No risk, no worry — just fair transactions.',
                'Lipa kwa usalama kupitia mfumo wetu wa escrow. Pesa yako inahifadhiwa salama hadi huduma itolewe. Hakuna hatari.'
              )}
              color="purple"
              delay={200}
            />
            <FeatureCard
              icon={<MapPin className="w-6 h-6" />}
              title={l('Live Tracking', 'Ufuatiliaji wa Moja kwa Moja')}
              description={l(
                'Share your real-time location with trusted contacts for safety. Meet your guide at the exact spot and never get lost in the bustling alleys.',
                'Shiriki eneo lako la moja kwa moja kwa usalama. Pata mwongozo wako mahali paliposahihi na usipotee katika njia za soko.'
              )}
              color="blue"
              delay={300}
            />
            <FeatureCard
              icon={<MessageCircle className="w-6 h-6" />}
              title={l('Instant Chat', 'Mazungumzo ya Papo Hapo')}
              description={l(
                'Message your guide in Swahili or English with our built-in translator. Ask questions, negotiate terms, and coordinate your meeting in real-time.',
                'Wasiliana na mwongozo wako kwa Kiswahili au Kiingereza kupitia mtafsiri wetu. Uliza maswali na jadili moja kwa moja.'
              )}
              color="rose"
              delay={400}
            />
            <FeatureCard
              icon={<Calendar className="w-6 h-6" />}
              title={l('Cultural Calendar', 'Kalenda ya Utamaduni')}
              description={l(
                'Never miss a market event, festival, or cultural celebration. Our calendar keeps you in the loop with everything happening around Kariakoo.',
                'Usikose tukio la soko, tamasha, au sherehe ya utamaduni. Kalenda yetu inakujulisha kila kitu kinachoendelea Kariakoo.'
              )}
              color="teal"
              delay={500}
            />
          </div>
        </div>
      </section>

      {/* ═══ HOW IT WORKS ═══ */}
      <section id="how-it-works" className="py-24 sm:py-32 relative z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <AnimatedSection>
            <div className="text-center mb-16">
              <div className="inline-flex items-center gap-2 glass-card-premium rounded-full px-5 py-2 mb-5">
                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                <span className="text-sm font-semibold">{l('Simple & Secure', 'Rahisi na Salama')}</span>
              </div>
              <h2 className="text-4xl sm:text-5xl font-black mb-5 tracking-tight">
                <span className="gradient-text-warm">{l('How It Works', 'Jinsi Inavyofanya Kazi')}</span>
              </h2>
              <p className="text-muted-foreground max-w-2xl mx-auto text-lg leading-relaxed">
                {l(
                  'Three simple steps to unlock the best market experience in East Africa.',
                  'Hatua tatu rahisi kufungua uzoefu bora zaidi wa soko katika Afrika Mashariki.'
                )}
              </p>
            </div>
          </AnimatedSection>

          <div className="grid sm:grid-cols-3 gap-8">
            <StepCard
              step={1}
              icon={<Users className="w-7 h-7" />}
              title={l('Choose Your Guide', 'Chagua Mwongozo Wako')}
              description={l(
                'Browse verified guide profiles, check ratings and specialties, and pick the perfect companion for your market adventure. Every guide is vetted and community-reviewed.',
                'Tazama wasifu wa miongozo walioidhinishwa, angalia ukadiriaji na upekee, na chagua mwenzi bora kwa safari yako ya soko.'
              )}
              delay={0}
            />
            <StepCard
              step={2}
              icon={<Compass className="w-7 h-7" />}
              title={l('Explore Together', 'Tembea Pamoja')}
              description={l(
                'Meet at the market, get guided through the best shops, discover hidden deals, and experience Kariakoo through the eyes of someone who lives it every day.',
                'Pokeana sokoni, ongozwa kupitia maduka mazuri, gundua biashara zilizofichwa, na uishi Kariakoo kwa macho ya mtu anayeishi kila siku.'
              )}
              delay={150}
            />
            <StepCard
              step={3}
              icon={<DollarSign className="w-7 h-7" />}
              title={l('Pay Fairly', 'Lipa Kwa Haki')}
              description={l(
                'Transparent pricing with secure escrow payments. You only pay when you are satisfied, and our Price Radar ensures you always get a fair deal.',
                'Bei wazi kwa malipo salama ya escrow. Unalipa tu ukiwa meridhi, na Rada yetu ya Bei inahakikisha unapata mpango mzuri.'
              )}
              delay={300}
            />
          </div>
        </div>
      </section>

      {/* ═══ TESTIMONIALS ═══ */}
      <section id="testimonials" className="py-24 sm:py-32 relative z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <AnimatedSection>
            <div className="text-center mb-16">
              <div className="inline-flex items-center gap-2 glass-card-premium rounded-full px-5 py-2 mb-5">
                <Heart className="w-4 h-4 text-rose-500" />
                <span className="text-sm font-semibold">{l('Loved by Thousands', 'Wanapendwa na Maelfu')}</span>
              </div>
              <h2 className="text-4xl sm:text-5xl font-black mb-5 tracking-tight">
                <span className="gradient-text-warm">{l('What People Say', 'Watu Wanasemaje')}</span>
              </h2>
              <p className="text-muted-foreground max-w-2xl mx-auto text-lg leading-relaxed">
                {l(
                  'Hear from seekers and guides who transformed their Kariakoo experience.',
                  'Sikia kutoka kwa watafuta na miongozo waliobadilisha uzoefu wao wa Kariakoo.'
                )}
              </p>
            </div>
          </AnimatedSection>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            <TestimonialCard
              name="Sarah K."
              avatar="S"
              role={l('Seeker from Germany', 'Mtafuta kutoka Ujerumani')}
              quote={l(
                'I was overwhelmed by Kariakoo at first, but my guide Amina knew exactly where to find the best kanga fabrics at wholesale prices. The Price Radar saved me at least 30%!',
                'Nilishangaa na Kariakoo mwanzoni, lakini mwongozo wangu Amina alijua mahali pa kupata vitenge kwa bei za jumla. Rada ya Bei iliniokoa angalau 30%!'
              )}
              rating={5}
              delay={0}
            />
            <TestimonialCard
              name="Hassan M."
              avatar="H"
              role={l('Guide since 2024', 'Mwongozo tangu 2024')}
              quote={l(
                'Kariako Guide changed my life. I went from hustling in the market to earning a steady income doing what I love. The escrow system means I always get paid fairly and on time.',
                'Kariako Guide ilibadilisha maisha yangu. Nimepata mapato thabiti nikifanya ninachopenda. Mfumo wa escrow inamaanisha nalipwa kwa haki na wakati.'
              )}
              rating={5}
              delay={150}
            />
            <TestimonialCard
              name="Emily C."
              avatar="E"
              role={l('Seeker from Kenya', 'Mtafuta kutoka Kenya')}
              quote={l(
                'The live tracking feature gave me so much peace of mind. My friends back home could see where I was, and my guide knew the safest routes. Absolutely essential for Kariakoo!',
                'Kipengele cha ufuatiliaji kilinipa amani sana. Marafiki zangu nyumbani walweza kuona nilipo. Programu muhimu sana kwa Kariakoo!'
              )}
              rating={5}
              delay={300}
            />
          </div>
        </div>
      </section>

      {/* ═══ FINAL CTA ═══ */}
      <section className="py-24 sm:py-32 relative z-10">
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          <AnimatedSection>
            <div className="glass-frosted p-12 sm:p-20 text-center relative overflow-hidden noise-overlay">
              {/* Decorative orbs inside CTA */}
              <div className="absolute -top-20 -right-20 w-60 h-60 rounded-full bg-gradient-to-br from-amber-400/20 to-orange-400/10 blur-3xl" />
              <div className="absolute -bottom-20 -left-20 w-60 h-60 rounded-full bg-gradient-to-br from-emerald-400/15 to-teal-400/8 blur-3xl" />

              <div className="relative z-10">
                <div className="w-20 h-20 rounded-3xl glass-card-premium mx-auto mb-8 flex items-center justify-center animate-pulse-glow">
                  <Compass className="w-10 h-10 gradient-text-warm" strokeWidth={2.5} />
                </div>
                <h2 className="text-4xl sm:text-5xl font-black mb-5 tracking-tight">
                  <span className="gradient-text-warm">
                    {l('Ready to Explore?', 'Uko Tayari?')}
                  </span>
                </h2>
                <p className="text-muted-foreground max-w-lg mx-auto mb-10 text-lg leading-relaxed">
                  {l(
                    'Join thousands of seekers and guides already using Kariako Guide to navigate Africa\'s largest open market.',
                    'Jiunge na maelfu ya watafuta na miongozo wanaotumia Kariako Guide kutembea soko kubwa zaidi barani Afrika.'
                  )}
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <Link
                    href="/auth"
                    className="glass-button px-10 h-14 text-lg flex items-center justify-center gap-3 rounded-2xl group"
                  >
                    <MapPin className="w-5 h-5 group-hover:rotate-12 transition-transform" />
                    {l('Get Started Free', 'Anza Bure')}
                    <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                  </Link>
                  <Link
                    href="/auth?role=guide"
                    className="glass-button-emerald px-10 h-14 text-lg flex items-center justify-center gap-3 rounded-2xl group"
                  >
                    <Compass className="w-5 h-5 group-hover:rotate-12 transition-transform" />
                    {l('Apply as Guide', 'Omba kuwa Mwongozo')}
                    <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                  </Link>
                </div>
              </div>
            </div>
          </AnimatedSection>
        </div>
      </section>

      {/* ═══ FOOTER ═══ */}
      <footer className="py-16 relative z-10">
        <div className="divider-glow max-w-5xl mx-auto mb-12" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-10 mb-12">
            <div className="sm:col-span-2 lg:col-span-1">
              <div className="flex items-center gap-2.5 mb-4">
                <div className="w-9 h-9 rounded-xl glass-card flex items-center justify-center">
                  <Compass className="w-4 h-4 gradient-text" strokeWidth={2.5} />
                </div>
                <span className="text-base font-black gradient-text-warm">{t('app_name', language)}</span>
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {l(
                  'Your trusted companion for navigating Kariakoo market. Connecting seekers with local guides since 2024.',
                  'Mwenzi wako wa kuaminika kwa kutembea soko la Kariakoo. Tangu 2024.'
                )}
              </p>
            </div>

            <div>
              <h4 className="text-sm font-bold mb-4 uppercase tracking-wider">{l('Product', 'Bidhaa')}</h4>
              <ul className="space-y-2.5 text-sm text-muted-foreground">
                <li><a href="#features" className="hover:text-foreground transition-colors">{l('Features', 'Vipengele')}</a></li>
                <li><a href="#how-it-works" className="hover:text-foreground transition-colors">{l('How It Works', 'Jinsi Inavyofanya Kazi')}</a></li>
                <li><Link href="/auth?role=guide" className="hover:text-foreground transition-colors">{l('Become a Guide', 'Kuwa Mwongozo')}</Link></li>
                <li><Link href="/auth" className="hover:text-foreground transition-colors">{l('Sign In', 'Ingia')}</Link></li>
              </ul>
            </div>

            <div>
              <h4 className="text-sm font-bold mb-4 uppercase tracking-wider">{l('Company', 'Kampuni')}</h4>
              <ul className="space-y-2.5 text-sm text-muted-foreground">
                <li><span className="hover:text-foreground transition-colors cursor-default">{l('About Us', 'Kuhusu Sisi')}</span></li>
                <li><span className="hover:text-foreground transition-colors cursor-default">{l('Careers', 'Kazi')}</span></li>
                <li><span className="hover:text-foreground transition-colors cursor-default">{l('Blog', 'Blogu')}</span></li>
                <li><span className="hover:text-foreground transition-colors cursor-default">{l('Press', 'Habari')}</span></li>
              </ul>
            </div>

            <div>
              <h4 className="text-sm font-bold mb-4 uppercase tracking-wider">{l('Support', 'Msaada')}</h4>
              <ul className="space-y-2.5 text-sm text-muted-foreground">
                <li><span className="hover:text-foreground transition-colors cursor-default">{l('Help Center', 'Kituo cha Msaada')}</span></li>
                <li><span className="hover:text-foreground transition-colors cursor-default">{l('Safety', 'Usalama')}</span></li>
                <li><span className="hover:text-foreground transition-colors cursor-default">{l('Terms of Service', 'Masharti ya Huduma')}</span></li>
                <li><span className="hover:text-foreground transition-colors cursor-default">{l('Privacy Policy', 'Sera ya Faragha')}</span></li>
              </ul>
            </div>
          </div>

          <div className="pt-8 border-t border-[var(--glass-border)] flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-xs text-muted-foreground">
              &copy; {new Date().getFullYear()} Kariako Guide. {l('All rights reserved.', 'Haki zote zimehifadhiwa.')}
            </p>
            <div className="flex items-center gap-4">
              <Globe className="w-4 h-4 text-muted-foreground" />
              <span className="text-xs text-muted-foreground">
                {l('Kariakoo, Dar es Salaam, Tanzania', 'Kariakoo, Dar es Salaam, Tanzania')}
              </span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

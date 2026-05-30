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
} from 'lucide-react';

// ── Intersection Observer Hook for Scroll Animations ──
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

// ── Animated Section Wrapper ──
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
    amber: 'from-amber-400 to-orange-500 text-amber-500',
    emerald: 'from-emerald-400 to-teal-500 text-emerald-500',
    purple: 'from-purple-400 to-violet-500 text-purple-500',
    blue: 'from-blue-400 to-indigo-500 text-blue-500',
    rose: 'from-rose-400 to-pink-500 text-rose-500',
    teal: 'from-teal-400 to-cyan-500 text-teal-500',
  };
  const [gradient, textColor] = colorMap[color].split(' ');

  return (
    <AnimatedSection delay={delay}>
      <div className="glass-card p-6 h-full group">
        <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${gradient} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300`}>
          <div className="text-white">{icon}</div>
        </div>
        <h3 className="font-semibold text-base mb-2">{title}</h3>
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
      <div className="glass-card p-6 text-center h-full relative overflow-hidden">
        {/* Step number watermark */}
        <div className="absolute -top-2 -right-2 text-8xl font-bold opacity-[0.04] gradient-text select-none">
          {step}
        </div>
        <div className="w-14 h-14 rounded-full glass-button mx-auto mb-4 flex items-center justify-center text-white">
          {icon}
        </div>
        <div className="text-xs font-bold gradient-text mb-2 uppercase tracking-wider">
          {t('step', 'en')} {step}
        </div>
        <h3 className="font-semibold text-base mb-2">{title}</h3>
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
  delay,
}: {
  name: string;
  role: string;
  quote: string;
  rating: number;
  delay: number;
}) {
  return (
    <AnimatedSection delay={delay}>
      <div className="glass-card p-6 h-full flex flex-col">
        <Quote className="w-8 h-8 gradient-text opacity-40 mb-3" />
        <p className="text-sm leading-relaxed flex-1 mb-4">&ldquo;{quote}&rdquo;</p>
        <div className="flex items-center gap-3 pt-3 border-t border-[var(--glass-border)]">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center text-white text-sm font-bold">
            {name.charAt(0)}
          </div>
          <div>
            <p className="text-sm font-medium">{name}</p>
            <p className="text-xs text-muted-foreground">{role}</p>
          </div>
          <div className="ml-auto flex gap-0.5">
            {Array.from({ length: rating }).map((_, i) => (
              <Star key={i} className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
            ))}
          </div>
        </div>
      </div>
    </AnimatedSection>
  );
}

// ── Stat Item ──
function StatItem({ value, label, delay }: { value: string; label: string; delay: number }) {
  return (
    <AnimatedSection delay={delay}>
      <div className="text-center">
        <div className="text-3xl sm:text-4xl font-bold gradient-text mb-1">{value}</div>
        <div className="text-sm text-muted-foreground">{label}</div>
      </div>
    </AnimatedSection>
  );
}

// ── Main Landing Page ──
export default function LandingPage() {
  const { language, isAuthenticated } = useAuthStore();
  const { darkMode, setDarkMode } = useAppStore();
  const router = useRouter();

  // Redirect authenticated users to dashboard
  useEffect(() => {
    if (isAuthenticated) {
      router.replace('/dashboard');
    }
  }, [isAuthenticated, router]);

  // Sync dark mode
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  // Bilingual content helper
  const sw = language === 'sw';
  const l = (en: string, swText: string) => (sw ? swText : en);

  return (
    <div className="min-h-screen">
      {/* ── Navigation ── */}
      <nav className="glass-nav sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          {/* Logo */}
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl glass-card flex items-center justify-center animate-pulse-glow">
              <Compass className="w-5 h-5 gradient-text" strokeWidth={2.5} />
            </div>
            <span className="text-lg font-bold gradient-text">{t('app_name', language)}</span>
          </div>

          {/* Desktop nav links */}
          <div className="hidden md:flex items-center gap-6 text-sm">
            <a href="#features" className="text-muted-foreground hover:text-foreground transition-colors">
              {l('Features', 'Vipengele')}
            </a>
            <a href="#how-it-works" className="text-muted-foreground hover:text-foreground transition-colors">
              {l('How It Works', 'Jinsi Inavyofanya Kazi')}
            </a>
            <a href="#testimonials" className="text-muted-foreground hover:text-foreground transition-colors">
              {l('Testimonials', 'Mashuhuda')}
            </a>
          </div>

          {/* Right controls */}
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
              className="glass-button px-5 h-9 text-sm flex items-center gap-1.5"
            >
              {l('Get Started', 'Anza Sasa')}
              <ChevronRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </nav>

      {/* ── Hero Section ── */}
      <section className="relative pt-16 pb-24 sm:pt-24 sm:pb-32 overflow-hidden">
        {/* Floating decorative elements */}
        <div className="absolute top-20 left-10 w-32 h-32 rounded-full glass opacity-30 animate-float-slow" />
        <div className="absolute top-40 right-16 w-24 h-24 rounded-full glass opacity-20 animate-float-reverse" />
        <div className="absolute bottom-20 left-1/4 w-16 h-16 rounded-xl glass opacity-25 animate-float-slow" style={{ animationDelay: '2s' }} />

        <div className="max-w-6xl mx-auto px-4 text-center relative z-10">
          <AnimatedSection>
            {/* Badge */}
            <div className="inline-flex items-center gap-2 glass rounded-full px-4 py-1.5 mb-6">
              <Zap className="w-3.5 h-3.5 text-amber-500" />
              <span className="text-xs font-medium">
                {l('Now live in Kariakoo Market', 'Sasa iko hai Sokoni Kariakoo')}
              </span>
            </div>

            {/* Headline */}
            <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold leading-tight mb-6">
              <span className="gradient-text">
                {l('Discover Kariakoo', 'Gundua Kariakoo')}
              </span>
              <br />
              <span className="text-foreground">
                {l('Like a Local', 'Kama Mwenzetu')}
              </span>
            </h1>

            {/* Subtitle */}
            <p className="text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto mb-10 leading-relaxed">
              {l(
                'Connect with trusted local guides who know every corner of Africa\'s largest open market. Navigate with confidence, bargain like a pro, and experience the real Kariakoo.',
                'Ungana na miongozo wa kuaminika wanaojua kila kona ya soko kubwa zaidi barani Afrika. Tembea kwa kujiamini, pata bei nzuri, na uishi Kariakoo halisi.'
              )}
            </p>

            {/* CTAs */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <Link
                href="/auth"
                className="glass-button px-8 h-12 text-base flex items-center gap-2 rounded-xl"
              >
                <MapPin className="w-5 h-5" />
                {l('Get Started as Seeker', 'Anza kama Mtafuta')}
                <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                href="/auth?role=guide"
                className="glass-button-emerald px-8 h-12 text-base flex items-center gap-2 rounded-xl"
              >
                <Compass className="w-5 h-5" />
                {l('Become a Guide', 'Kuwa Mwongozo')}
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </AnimatedSection>

          {/* Floating phone mockup / illustration area */}
          <AnimatedSection delay={300}>
            <div className="mt-16 relative max-w-lg mx-auto">
              <div className="glass-card p-6 animate-float-slow">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center text-white text-sm font-bold">A</div>
                  <div>
                    <p className="text-sm font-medium">Amina M.</p>
                    <p className="text-xs text-muted-foreground flex items-center gap-1">
                      <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" />
                      {l('Online now', 'Yupo mtandaoni')}
                    </p>
                  </div>
                  <div className="ml-auto flex items-center gap-1">
                    <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                    <span className="text-sm font-medium">4.9</span>
                  </div>
                </div>
                <p className="text-sm text-muted-foreground mb-3">
                  {l(
                    'I know the best fabric shops and wholesale deals. Let me show you around!',
                    'Najuai maduka mazuri ya vitenge na bei za jumla. Nikuongoze!'
                  )}
                </p>
                <div className="flex gap-2">
                  <div className="glass-button px-4 py-2 text-xs rounded-lg">
                    {l('Book Guide', 'Agiza Mwongozo')}
                  </div>
                  <div className="glass px-4 py-2 text-xs rounded-lg">
                    {l('Message', 'Ujumbe')}
                  </div>
                </div>
              </div>
            </div>
          </AnimatedSection>
        </div>
      </section>

      {/* ── Stats Section ── */}
      <section className="py-16 border-y border-[var(--glass-border)]">
        <div className="max-w-6xl mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            <StatItem value="500+" label={l('Verified Guides', 'Miongozo Walioidhinishwa')} delay={0} />
            <StatItem value="10K+" label={l('Tours Completed', 'Ziara Zilizokamilika')} delay={100} />
            <StatItem value="4.9" label={l('Average Rating', 'Wastani wa Ukadiriaji')} delay={200} />
            <StatItem value="50+" label={l('Languages Supported', 'Lughas Zinazotumika')} delay={300} />
          </div>
        </div>
      </section>

      {/* ── Features Section ── */}
      <section id="features" className="py-20 sm:py-28">
        <div className="max-w-6xl mx-auto px-4">
          <AnimatedSection>
            <div className="text-center mb-14">
              <div className="inline-flex items-center gap-2 glass rounded-full px-4 py-1.5 mb-4">
                <Zap className="w-3.5 h-3.5 text-amber-500" />
                <span className="text-xs font-medium">{l('Why Kariako Guide?', 'Kwa Nini Kariako Guide?')}</span>
              </div>
              <h2 className="text-3xl sm:text-4xl font-bold mb-4">
                <span className="gradient-text">{l('Everything You Need', 'Kila Unachohitaji')}</span>
              </h2>
              <p className="text-muted-foreground max-w-xl mx-auto">
                {l(
                  'From finding your perfect guide to securing fair prices, we have every tool to make your Kariakoo experience unforgettable.',
                  'Kutafuta mwongozo wako bora hadi kupata bei nzuri, tuna kila zana ili kufanya uzoefu wako wa Kariakoo usisahaulike.'
                )}
              </p>
            </div>
          </AnimatedSection>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            <FeatureCard
              icon={<Navigation className="w-6 h-6" />}
              title={l('Find Local Guides', 'Pata Miongozo wa Karibu')}
              description={l(
                'Connect with verified guides who know every alley, shop, and hidden gem in Kariakoo market. Browse profiles, ratings, and specialties to find your perfect match.',
                'Ungana na miongozo walioidhinishwa wanaojua kila njia, duka, na hazina iliyofichwa sokoni Kariakoo. Tafuta wasifu, ukadiriaji, na upekee.'
              )}
              color="amber"
              delay={0}
            />
            <FeatureCard
              icon={<DollarSign className="w-6 h-6" />}
              title={l('Price Radar', 'Rada ya Bei')}
              description={l(
                'Know the fair price before you bargain. Our Price Radar shows real-time market rates so you never overpay. Data-driven confidence at your fingertips.',
                'Jua bei nzuri kabla hujabisha. Rada yetu ya Bei inaonyesha viwango halisi vya soko ili usilipe zaidi. Kujiamini kwa data mikononi mwako.'
              )}
              color="emerald"
              delay={100}
            />
            <FeatureCard
              icon={<Shield className="w-6 h-6" />}
              title={l('Escrow Payments', 'Malipo ya Escrow')}
              description={l(
                'Pay securely through our trusted escrow system. Your money is held safely until the service is delivered. No risk, no worry — just fair and transparent transactions.',
                'Lipa kwa usalama kupitia mfumo wetu wa escrow. Pesa yako inahifadhiwa salama hadi huduma itolewe. Hakuna hatari, hakuna wasiwasi.'
              )}
              color="purple"
              delay={200}
            />
            <FeatureCard
              icon={<MapPin className="w-6 h-6" />}
              title={l('Live Tracking', 'Ufuatiliaji wa Moja kwa Moja')}
              description={l(
                'Share your real-time location with trusted contacts for safety. Meet your guide at the exact spot, track your market route, and never get lost in the bustling alleys.',
                'Shiriki eneo lako la moja kwa moja na watu wa kuaminika kwa usalama. Pata mwongozo wako mahali paliposahihi na usipotee katika njia za soko.'
              )}
              color="blue"
              delay={300}
            />
            <FeatureCard
              icon={<MessageCircle className="w-6 h-6" />}
              title={l('Instant Chat', 'Mazungumzo ya Papo Hapo')}
              description={l(
                'Message your guide in Swahili or English with our built-in translator. Ask questions, negotiate terms, and coordinate your meeting — all in real-time within the app.',
                'Wasiliana na mwongozo wako kwa Kiswahili au Kiingereza kupitia mtafsiri wetu. Uliza maswali, jadili, na kuratibu mkutano wenu moja kwa moja.'
              )}
              color="rose"
              delay={400}
            />
            <FeatureCard
              icon={<Calendar className="w-6 h-6" />}
              title={l('Cultural Calendar', 'Kalenda ya Utamaduni')}
              description={l(
                'Never miss a market event, festival, or cultural celebration. Our calendar keeps you in the loop with everything happening in and around Kariakoo throughout the year.',
                'Usikose tukio la soko, tamasha, au sherehe ya utamaduni. Kalenda yetu inakujulisha kila kitu kinachoendelea Kariakoo mwaka nzima.'
              )}
              color="teal"
              delay={500}
            />
          </div>
        </div>
      </section>

      {/* ── How It Works Section ── */}
      <section id="how-it-works" className="py-20 sm:py-28 bg-[var(--glass)]/30">
        <div className="max-w-6xl mx-auto px-4">
          <AnimatedSection>
            <div className="text-center mb-14">
              <div className="inline-flex items-center gap-2 glass rounded-full px-4 py-1.5 mb-4">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                <span className="text-xs font-medium">{l('Simple & Secure', 'Rahisi na Salama')}</span>
              </div>
              <h2 className="text-3xl sm:text-4xl font-bold mb-4">
                <span className="gradient-text">{l('How It Works', 'Jinsi Inavyofanya Kazi')}</span>
              </h2>
              <p className="text-muted-foreground max-w-xl mx-auto">
                {l(
                  'Three simple steps to unlock the best market experience in East Africa.',
                  'Hatua tatu rahisi kufungua uzoefu bora zaidi wa soko katika Afrika Mashariki.'
                )}
              </p>
            </div>
          </AnimatedSection>

          <div className="grid sm:grid-cols-3 gap-6">
            <StepCard
              step={1}
              icon={<Users className="w-6 h-6" />}
              title={l('Choose Your Guide', 'Chagua Mwongozo Wako')}
              description={l(
                'Browse verified guide profiles, check ratings and specialties, and pick the perfect companion for your market adventure. Every guide is vetted and community-reviewed.',
                'Tazama wasifu wa miongozo walioidhinishwa, angalia ukadiriaji na upekee, na chagua mwenzi bora kwa safari yako ya soko. Kila mwongozo amethibitishwa.'
              )}
              delay={0}
            />
            <StepCard
              step={2}
              icon={<Compass className="w-6 h-6" />}
              title={l('Explore Together', 'Tembea Pamoja')}
              description={l(
                'Meet at the market, get guided through the best shops, discover hidden deals, and experience Kariakoo through the eyes of someone who lives and breathes it every day.',
                'Pokeana sokoni,ongozwa kupitia maduka mazuri, gundua biashara zilizofichwa, na uishi Kariakoo kwa macho ya mtu anayeishi kupumua kila siku.'
              )}
              delay={150}
            />
            <StepCard
              step={3}
              icon={<DollarSign className="w-6 h-6" />}
              title={l('Pay Fairly', 'Lipa Kwa Haki')}
              description={l(
                'Transparent pricing with secure escrow payments. You only pay when you are satisfied, and our Price Radar ensures you always get a fair deal. No hidden fees, no surprises.',
                'Bei wazi kwa malipo salama ya escrow. Unalipa tu ukiwa meridhi, na Rada yetu ya Bei inahakikisha unapata mpango mzuri. Hakuna ada zilizofichwa.'
              )}
              delay={300}
            />
          </div>
        </div>
      </section>

      {/* ── Testimonials Section ── */}
      <section id="testimonials" className="py-20 sm:py-28">
        <div className="max-w-6xl mx-auto px-4">
          <AnimatedSection>
            <div className="text-center mb-14">
              <div className="inline-flex items-center gap-2 glass rounded-full px-4 py-1.5 mb-4">
                <Star className="w-3.5 h-3.5 text-amber-500" />
                <span className="text-xs font-medium">{l('Loved by Thousands', 'Wanapendwa na Maelfu')}</span>
              </div>
              <h2 className="text-3xl sm:text-4xl font-bold mb-4">
                <span className="gradient-text">{l('What People Say', 'Watu Wanasemaje')}</span>
              </h2>
              <p className="text-muted-foreground max-w-xl mx-auto">
                {l(
                  'Hear from seekers and guides who have transformed their Kariakoo experience.',
                  'Sikia kutoka kwa watafuta na miongozo waliobadilisha uzoefu wao wa Kariakoo.'
                )}
              </p>
            </div>
          </AnimatedSection>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            <TestimonialCard
              name="Sarah K."
              role={l('Seeker from Germany', 'Mtafuta kutoka Ujerumani')}
              quote={l(
                'I was overwhelmed by Kariakoo at first, but my guide Amina knew exactly where to find the best kanga fabrics at wholesale prices. The Price Radar saved me at least 30% compared to what I would have paid on my own!',
                'Nilishangaa na Kariakoo mwanzoni, lakini mwongozo wangu Amina alijua mahali pa kupata vitenge vya kanga kwa bei za jumla. Rada ya Bei iliniokoa angalau 30% ikilinganishwa na niliangelipa mwenyewe!'
              )}
              rating={5}
              delay={0}
            />
            <TestimonialCard
              name="Hassan M."
              role={l('Guide since 2024', 'Mwongozo tangu 2024')}
              quote={l(
                'Kariako Guide changed my life. I went from hustling in the market to earning a steady income doing what I love — showing people around. The escrow system means I always get paid fairly and on time.',
                'Kariako Guide ilibadilisha maisha yangu. Nilipita kutoka kufanya biashara sokoni kupata mapato thabiti nikifanya ninachopenda — kuongoza watu. Mfumo wa escrow inamaanisha nalipwa kwa haki na wakati.'
              )}
              rating={5}
              delay={150}
            />
            <TestimonialCard
              name="Emily C."
              role={l('Seeker from Kenya', 'Mtafuta kutoka Kenya')}
              quote={l(
                'The live tracking feature gave me so much peace of mind. My friends back home could see where I was, and my guide knew the safest routes through the busy market. Absolutely essential app for Kariakoo!',
                'Kipengele cha ufuatiliaji kilinipa amani sana. Marafiki zangu nyumbani walweza kuona nilipo, na mwongozo wangu alijua njia salama kupitia soko lenye shughuli nyingi. Programu muhimu kwa Kariakoo!'
              )}
              rating={5}
              delay={300}
            />
          </div>
        </div>
      </section>

      {/* ── CTA Section ── */}
      <section className="py-20 sm:py-28 bg-[var(--glass)]/30">
        <div className="max-w-6xl mx-auto px-4">
          <AnimatedSection>
            <div className="glass-card p-10 sm:p-16 text-center relative overflow-hidden">
              {/* Decorative glow */}
              <div className="absolute inset-0 pointer-events-none">
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-96 h-96 bg-gradient-to-b from-amber-400/10 to-transparent rounded-full blur-3xl" />
              </div>

              <div className="relative z-10">
                <div className="w-16 h-16 rounded-2xl glass-card mx-auto mb-6 flex items-center justify-center animate-pulse-glow">
                  <Compass className="w-8 h-8 gradient-text" strokeWidth={2.5} />
                </div>
                <h2 className="text-3xl sm:text-4xl font-bold mb-4">
                  <span className="gradient-text">
                    {l('Ready to Explore Kariakoo?', 'Uko Tayari Kugundua Kariakoo?')}
                  </span>
                </h2>
                <p className="text-muted-foreground max-w-lg mx-auto mb-8 text-lg">
                  {l(
                    'Join thousands of seekers and guides who are already using Kariako Guide to navigate Africa\'s largest open market.',
                    'Jiunge na maelfu ya watafuta na miongozo ambao tayari wanatumia Kariako Guide kutembea soko kubwa zaidi barani Afrika.'
                  )}
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <Link
                    href="/auth"
                    className="glass-button px-8 h-12 text-base flex items-center justify-center gap-2 rounded-xl"
                  >
                    <MapPin className="w-5 h-5" />
                    {l('Get Started Free', 'Anza Bure')}
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                  <Link
                    href="/auth?role=guide"
                    className="glass-button-emerald px-8 h-12 text-base flex items-center justify-center gap-2 rounded-xl"
                  >
                    <Compass className="w-5 h-5" />
                    {l('Apply as Guide', 'Omba kuwa Mwongozo')}
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                </div>
              </div>
            </div>
          </AnimatedSection>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="py-12 border-t border-[var(--glass-border)]">
        <div className="max-w-6xl mx-auto px-4">
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8 mb-10">
            {/* Brand */}
            <div className="sm:col-span-2 lg:col-span-1">
              <div className="flex items-center gap-2.5 mb-3">
                <div className="w-8 h-8 rounded-lg glass-card flex items-center justify-center">
                  <Compass className="w-4 h-4 gradient-text" strokeWidth={2.5} />
                </div>
                <span className="text-base font-bold gradient-text">{t('app_name', language)}</span>
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {l(
                  'Your trusted companion for navigating Kariakoo market. Connecting seekers with local guides since 2024.',
                  'Mwenzi wako wa kuaminika kwa kutembea soko la Kariakoo. Kuiunganisha watafuta na miongozo wa karibu tangu 2024.'
                )}
              </p>
            </div>

            {/* Product */}
            <div>
              <h4 className="text-sm font-semibold mb-3">{l('Product', 'Bidhaa')}</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><a href="#features" className="hover:text-foreground transition-colors">{l('Features', 'Vipengele')}</a></li>
                <li><a href="#how-it-works" className="hover:text-foreground transition-colors">{l('How It Works', 'Jinsi Inavyofanya Kazi')}</a></li>
                <li><Link href="/auth?role=guide" className="hover:text-foreground transition-colors">{l('Become a Guide', 'Kuwa Mwongozo')}</Link></li>
                <li><Link href="/auth" className="hover:text-foreground transition-colors">{l('Sign In', 'Ingia')}</Link></li>
              </ul>
            </div>

            {/* Company */}
            <div>
              <h4 className="text-sm font-semibold mb-3">{l('Company', 'Kampuni')}</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><span className="hover:text-foreground transition-colors cursor-default">{l('About Us', 'Kuhusu Sisi')}</span></li>
                <li><span className="hover:text-foreground transition-colors cursor-default">{l('Careers', 'Kazi')}</span></li>
                <li><span className="hover:text-foreground transition-colors cursor-default">{l('Blog', 'Blogu')}</span></li>
                <li><span className="hover:text-foreground transition-colors cursor-default">{l('Press', 'Habari')}</span></li>
              </ul>
            </div>

            {/* Support */}
            <div>
              <h4 className="text-sm font-semibold mb-3">{l('Support', 'Msaada')}</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><span className="hover:text-foreground transition-colors cursor-default">{l('Help Center', 'Kituo cha Msaada')}</span></li>
                <li><span className="hover:text-foreground transition-colors cursor-default">{l('Safety', 'Usalama')}</span></li>
                <li><span className="hover:text-foreground transition-colors cursor-default">{l('Terms of Service', 'Masharti ya Huduma')}</span></li>
                <li><span className="hover:text-foreground transition-colors cursor-default">{l('Privacy Policy', 'Sera ya Faragha')}</span></li>
              </ul>
            </div>
          </div>

          {/* Bottom bar */}
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

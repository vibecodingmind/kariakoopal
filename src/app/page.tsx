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
  TrendingUp,
  Heart,
  Search,
  ShieldCheck,
  Award,
  Clock,
  Package,
  Store,
} from 'lucide-react';

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
    <div className="min-h-screen bg-[#F8F9FA] dark:bg-[#0D1117]">
      {/* ═══ NAVIGATION ═══ */}
      <nav className="knav sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#0B5D3A] flex items-center justify-center">
              <Compass className="w-5 h-5 text-white" strokeWidth={2.5} />
            </div>
            <span className="text-xl font-black gradient-text-green tracking-tight">{t('app_name', language)}</span>
          </div>

          <div className="hidden md:flex items-center gap-6 text-sm font-medium">
            <a href="#features" className="text-muted-foreground hover:text-foreground transition-colors">
              {l('Features', 'Vipengele')}
            </a>
            <a href="#how-it-works" className="text-muted-foreground hover:text-foreground transition-colors">
              {l('How It Works', 'Jinsi Inavyofanya Kazi')}
            </a>
            <a href="#zones" className="text-muted-foreground hover:text-foreground transition-colors">
              {l('Market Zones', 'Maeneo ya Soko')}
            </a>
            <a href="#testimonials" className="text-muted-foreground hover:text-foreground transition-colors">
              {l('Testimonials', 'Mashuhuda')}
            </a>
          </div>

          <div className="flex items-center gap-2">
            <LanguageToggle className="border border-[#E9ECEF] dark:border-[#30363D] rounded-full" />
            <button
              onClick={() => setDarkMode(!darkMode)}
              className="w-9 h-9 rounded-full flex items-center justify-center border border-[#E9ECEF] dark:border-[#30363D] hover:bg-[#F1F3F5] dark:hover:bg-[#21262D] transition-colors"
              aria-label="Toggle dark mode"
            >
              {darkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>
            <Link
              href="/auth"
              className="kbtn text-sm"
            >
              {l('Get Started', 'Anza Sasa')}
              <ChevronRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </nav>

      {/* ═══ HERO SECTION ═══ */}
      <section className="pt-12 pb-20 sm:pt-16 sm:pb-28">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <AnimatedSection>
            <div className="text-center max-w-3xl mx-auto mb-10">
              {/* Live badge */}
              <div className="inline-flex items-center gap-2 bg-[#E8F5EE] dark:bg-[#0D2818] rounded-full px-4 py-1.5 mb-6">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#10B981] opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-[#10B981]" />
                </span>
                <span className="text-sm font-semibold text-[#0B5D3A] dark:text-[#2EA77A]">
                  {l('Now live in Kariakoo Market', 'Sasa iko hai Sokoni Kariakoo')}
                </span>
              </div>

              {/* Headline */}
              <h1 className="text-4xl sm:text-5xl md:text-6xl font-black leading-[1.1] mb-6 tracking-tight text-[#212529] dark:text-[#F0F6FC]">
                {l('What are you looking for', 'Unatafuta nini')}
                <br />
                <span className="gradient-text-green">{l('today in Kariakoo?', 'leo Kariakoo?')}</span>
              </h1>

              {/* Subtitle */}
              <p className="text-lg text-[#6C757D] dark:text-[#8B949E] max-w-2xl mx-auto mb-8 leading-relaxed">
                {l(
                  'Connect with trusted local guides who know every corner of Africa\'s largest open market. Navigate with confidence, bargain like a pro.',
                  'Ungana na miongozo wa kuaminika wanaojua kila kona ya soko kubwa zaidi barani Afrika. Tembea kwa kujiamini, pata bei nzuri.'
                )}
              </p>

              {/* Search Bar */}
              <div className="khero-search max-w-2xl mx-auto">
                <div className="flex flex-col sm:flex-row gap-3">
                  <div className="flex-1 relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-white/50" />
                    <input
                      type="text"
                      placeholder={l('Search products, vendors, or zones...', 'Tafuta bidhaa, wauzaji, au maeneo...')}
                      className="w-full pl-10 pr-4 py-3 rounded-lg bg-white/10 border border-white/20 text-white placeholder:text-white/50 text-sm focus:outline-none focus:border-white/40 focus:bg-white/15 transition-all"
                    />
                  </div>
                  <select className="px-4 py-3 rounded-lg bg-white/10 border border-white/20 text-white text-sm focus:outline-none appearance-none cursor-pointer">
                    <option value="" className="text-[#212529]">{l('All Zones', 'Maeneo Yote')}</option>
                    <option value="electronics" className="text-[#212529]">{l('Electronics', 'Elektroniki')}</option>
                    <option value="fabric" className="text-[#212529]">{l('Fabrics', 'Vitenge')}</option>
                    <option value="kitchenware" className="text-[#212529]">{l('Kitchenware', 'Vyombo')}</option>
                    <option value="spices" className="text-[#212529]">{l('Spices', 'Viungo')}</option>
                  </select>
                  <button className="kbtn-yellow px-6 py-3 text-sm font-bold whitespace-nowrap">
                    {l('Search', 'Tafuta')}
                  </button>
                </div>
              </div>

              {/* Trust signals */}
              <div className="flex items-center justify-center gap-6 text-xs text-[#6C757D] dark:text-[#8B949E] mt-6">
                <span className="flex items-center gap-1.5"><ShieldCheck className="w-3.5 h-3.5 text-[#0B5D3A]" /> {l('Escrow Secure', 'Escrow Salama')}</span>
                <span className="flex items-center gap-1.5"><Star className="w-3.5 h-3.5 text-[#FFD700]" /> 4.9 {l('Rating', 'Ukadiriaji')}</span>
                <span className="flex items-center gap-1.5"><Users className="w-3.5 h-3.5 text-[#0B5D3A]" /> 500+ {l('Guides', 'Miongozo')}</span>
              </div>
            </div>
          </AnimatedSection>

          {/* Preview Cards Grid */}
          <AnimatedSection delay={300}>
            <div className="grid md:grid-cols-3 gap-4 max-w-5xl mx-auto">
              {/* Active Request Preview */}
              <div className="kcard p-5">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-[#6C757D]" />
                    <span className="text-sm font-semibold">{l('Active Request', 'Ombi Hai')}</span>
                  </div>
                  <span className="kbadge kbadge-live">LIVE</span>
                </div>
                <p className="text-sm font-semibold text-[#212529] dark:text-[#F0F6FC] mb-1">{l('Matching with guides...', 'Kuunganisha na miongozo...')}</p>
                <p className="text-xs text-[#6C757D] dark:text-[#8B949E] mb-3">
                  {l('Finding verified guides near the Electronics Zone who speak Swahili and English.', 'Tafuta miongozo waliothibitishwa karibu na Eneo la Elektroniki wanaozungumza Kiswahili na Kiingereza.')}
                </p>
                <div className="flex gap-2">
                  <button className="kbtn-outline text-xs py-1.5 px-3">{l('Cancel Search', 'Ghairi')}</button>
                  <button className="kbtn text-xs py-1.5 px-3">{l('Boost Visibility', 'Ongeza Mwonekano')}</button>
                </div>
              </div>

              {/* Price Radar Preview */}
              <div className="kcard p-5">
                <div className="flex items-center gap-2 mb-3">
                  <TrendingUp className="w-4 h-4 text-[#6C757D]" />
                  <span className="text-sm font-semibold">{l('Price Radar', 'Rada ya Bei')}</span>
                </div>
                <p className="text-xs text-[#6C757D] dark:text-[#8B949E] mb-3">
                  {l('Current fair market ranges in Kariakoo today.', 'Viwango vya soko vinavyofaa Kariakoo leo.')}
                </p>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="kbadge kbadge-electronics">{l('Electronics', 'Elektroniki')}</span>
                    <span className="text-xs font-semibold">TSh 120k - 450k</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="kbadge kbadge-kitchenware">{l('Kitchenware', 'Vyombo')}</span>
                    <span className="text-xs font-semibold">TSh 15k - 85k</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="kbadge kbadge-fabrics">{l('Fabrics', 'Vitenge')}</span>
                    <span className="text-xs font-semibold">TSh 8k - 22k/m</span>
                  </div>
                </div>
                <button className="kbtn-outline text-xs py-1.5 px-3 w-full mt-3">{l('Full Market Index', 'Hisa Kamili ya Soko')}</button>
              </div>

              {/* Member Identity Preview */}
              <div className="kcard-green p-5">
                <div className="flex items-center gap-2 mb-3">
                  <Award className="w-5 h-5 text-[#FFD700]" />
                  <span className="text-sm font-bold">{l('Seeker Identity', 'Kitambulisho cha Mtafuta')}</span>
                </div>
                <p className="text-sm font-bold mb-1">{l('Verified Profile', 'Wasifu Uliothibitishwa')}</p>
                <div className="mt-3 mb-2">
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="text-white/70">{l('Escrow Trust Score', 'Alama ya Escrow')}</span>
                    <span className="font-bold text-[#FFD700]">98%</span>
                  </div>
                  <div className="ktrust-progress">
                    <div className="ktrust-progress-bar" style={{ width: '98%' }} />
                  </div>
                </div>
                <p className="text-[11px] text-white/60 mt-2">
                  {l('4 successful transactions. Higher trust scores attract faster responses from Gold Tier guides.', 'Miamala 4 ya mafanikio. Alama za juu za kuaminika huvutia majibu haraka kutoka kwa miongozo ya Gold Tier.')}
                </p>
              </div>
            </div>
          </AnimatedSection>
        </div>
      </section>

      {/* ═══ STATS SECTION ═══ */}
      <section className="py-16 bg-[#0B5D3A] dark:bg-[#0A3D2C]">
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {[
              { value: 500, suffix: '+', label: l('Verified Guides', 'Miongozo'), icon: <Users className="w-5 h-5" /> },
              { value: 10, suffix: 'K+', label: l('Tours Done', 'Ziara'), icon: <Navigation className="w-5 h-5" /> },
              { value: 49, suffix: '/5', label: l('Avg Rating', 'Ukadiriaji'), icon: <Star className="w-5 h-5" /> },
              { value: 50, suffix: '+', label: l('Languages', 'Lugha'), icon: <Globe className="w-5 h-5" /> },
            ].map((stat, i) => (
              <AnimatedSection key={i} delay={i * 100}>
                <div className="text-center">
                  <div className="w-10 h-10 rounded-xl bg-white/10 mx-auto mb-3 flex items-center justify-center text-[#FFD700]">
                    {stat.icon}
                  </div>
                  <div className="text-3xl sm:text-4xl font-black text-white mb-1">
                    <AnimatedCounter target={stat.value} suffix={stat.suffix} />
                  </div>
                  <div className="text-xs text-white/60 font-medium uppercase tracking-wider">{stat.label}</div>
                </div>
              </AnimatedSection>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ MARKET ZONES ═══ */}
      <section id="zones" className="py-20 sm:py-28">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <AnimatedSection>
            <div className="text-center mb-12">
              <h2 className="text-3xl sm:text-4xl font-black mb-4 tracking-tight">
                <span className="gradient-text-green">{l('Explore Market Zones', 'Gundua Maeneo ya Soko')}</span>
              </h2>
              <p className="text-[#6C757D] dark:text-[#8B949E] max-w-xl mx-auto">
                {l('Navigate Kariakoo\'s diverse zones with expert local guides who know the best deals in each area.', 'Tembea maeneo tofauti ya Kariakoo na miongozo wataalamu wanaojua biashara nzuri katika kila eneo.')}
              </p>
            </div>
          </AnimatedSection>

          <div className="grid sm:grid-cols-2 lg:grid-cols-5 gap-4">
            {[
              { name: l('Electronics Hub', 'Eneo la Elektroniki'), color: '#0077B6', tag: 'kbadge-electronics', icon: <Zap className="w-6 h-6" />, vendors: '200+' },
              { name: l('Kitchenware Zone', 'Eneo la Vyombo'), color: '#FFA500', tag: 'kbadge-kitchenware', icon: <Package className="w-6 h-6" />, vendors: '150+' },
              { name: l('Fabric District', 'Eneo la Vitenge'), color: '#8A2BE2', tag: 'kbadge-fabrics', icon: <Store className="w-6 h-6" />, vendors: '300+' },
              { name: l('Spice Market', 'Soko la Viungo'), color: '#EF4444', tag: 'kbadge-spices', icon: <Heart className="w-6 h-6" />, vendors: '80+' },
              { name: l('Wholesale Area', 'Eneo la Jumla'), color: '#14B8A6', tag: 'kbadge-wholesale', icon: <DollarSign className="w-6 h-6" />, vendors: '120+' },
            ].map((zone, i) => (
              <AnimatedSection key={i} delay={i * 80}>
                <div className="kcard p-5 text-center group hover:shadow-lg transition-all cursor-pointer">
                  <div
                    className="w-14 h-14 rounded-2xl mx-auto mb-3 flex items-center justify-center text-white transition-transform group-hover:scale-110"
                    style={{ backgroundColor: zone.color }}
                  >
                    {zone.icon}
                  </div>
                  <h3 className="font-bold text-sm mb-1">{zone.name}</h3>
                  <span className={`kbadge ${zone.tag} mb-2`}>{zone.vendors} {l('vendors', 'wauzaji')}</span>
                  <p className="text-[11px] text-[#6C757D] dark:text-[#8B949E] mt-2">
                    {l('Top Zone Today', 'Eneo Bora Leo')}
                  </p>
                </div>
              </AnimatedSection>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ FEATURES SECTION ═══ */}
      <section id="features" className="py-20 sm:py-28 bg-[#F1F3F5] dark:bg-[#161B22]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <AnimatedSection>
            <div className="text-center mb-14">
              <div className="inline-flex items-center gap-2 bg-[#E8F5EE] dark:bg-[#0D2818] rounded-full px-4 py-1.5 mb-4">
                <Zap className="w-4 h-4 text-[#0B5D3A]" />
                <span className="text-sm font-semibold text-[#0B5D3A] dark:text-[#2EA77A]">{l('Why Kariako Guide?', 'Kwa Nini Kariako Guide?')}</span>
              </div>
              <h2 className="text-3xl sm:text-4xl font-black mb-4 tracking-tight">
                <span className="gradient-text-green">{l('Everything You Need', 'Kila Unachohitaji')}</span>
              </h2>
              <p className="text-[#6C757D] dark:text-[#8B949E] max-w-2xl mx-auto">
                {l('From finding your perfect guide to securing fair prices, every tool for an unforgettable Kariakoo experience.', 'Kutafuta mwongozo wako bora hadi kupata bei nzuri, kila zana kwa uzoefu usisahaulika wa Kariakoo.')}
              </p>
            </div>
          </AnimatedSection>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {[
              { icon: <Navigation className="w-6 h-6" />, title: l('Find Local Guides', 'Pata Miongozo'), desc: l('Connect with verified guides who know every alley, shop, and hidden gem in Kariakoo. Browse profiles, ratings, and specialties to find your perfect match.', 'Ungana na miongozo walioidhinishwa wanaojua kila njia na duka sokoni Kariakoo. Tafuta wasifu na upekee.'), color: '#0B5D3A' },
              { icon: <TrendingUp className="w-6 h-6" />, title: l('Price Radar', 'Rada ya Bei'), desc: l('Know the fair price before you bargain. Our Price Radar shows real-time market rates so you never overpay. Data-driven confidence at your fingertips.', 'Jua bei nzuri kabla hujabisha. Rada yetu inaonyesha viwango halisi vya soko ili usilipe zaidi.'), color: '#FFD700' },
              { icon: <Shield className="w-6 h-6" />, title: l('Escrow Payments', 'Malipo ya Escrow'), desc: l('Pay securely through our trusted escrow system. Your money is held safely until the service is delivered. No risk, no worry — just fair transactions.', 'Lipa kwa usalama kupitia mfumo wetu wa escrow. Pesa yako inahifadhiwa salama hadi huduma itolewe.'), color: '#8A2BE2' },
              { icon: <MapPin className="w-6 h-6" />, title: l('Live Tracking', 'Ufuatiliaji'), desc: l('Share your real-time location with trusted contacts for safety. Meet your guide at the exact spot and never get lost in the bustling alleys.', 'Shiriki eneo lako la moja kwa moja kwa usalama. Pata mwongozo wako mahali paliposahihi.'), color: '#0077B6' },
              { icon: <MessageCircle className="w-6 h-6" />, title: l('Instant Chat + Translate', 'Mazungumzo + Tafsiri'), desc: l('Message your guide in Swahili or English with our built-in translator. Ask questions, negotiate terms, and coordinate your meeting in real-time.', 'Wasiliana na mwongozo wako kwa Kiswahili au Kiingereza kupitia mtafsiri wetu. Uliza maswali na jadili.'), color: '#E63946' },
              { icon: <Calendar className="w-6 h-6" />, title: l('Cultural Calendar', 'Kalenda ya Utamaduni'), desc: l('Never miss a market event, festival, or cultural celebration. Our calendar keeps you in the loop with everything happening around Kariakoo.', 'Usikose tukio la soko, tamasha, au sherehe ya utamaduni. Kalenda yetu inakujulisha kila kitu kinachoendelea.'), color: '#14B8A6' },
            ].map((feature, i) => (
              <AnimatedSection key={i} delay={i * 80}>
                <div className="kcard p-6 h-full group hover:shadow-lg transition-all">
                  <div
                    className="w-12 h-12 rounded-xl flex items-center justify-center mb-4 text-white group-hover:scale-110 transition-transform"
                    style={{ backgroundColor: feature.color }}
                  >
                    {feature.icon}
                  </div>
                  <h3 className="font-bold text-base mb-2">{feature.title}</h3>
                  <p className="text-sm text-[#6C757D] dark:text-[#8B949E] leading-relaxed">{feature.desc}</p>
                </div>
              </AnimatedSection>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ HOW IT WORKS ═══ */}
      <section id="how-it-works" className="py-20 sm:py-28">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <AnimatedSection>
            <div className="text-center mb-14">
              <div className="inline-flex items-center gap-2 bg-[#E8F5EE] dark:bg-[#0D2818] rounded-full px-4 py-1.5 mb-4">
                <CheckCircle2 className="w-4 h-4 text-[#0B5D3A]" />
                <span className="text-sm font-semibold text-[#0B5D3A] dark:text-[#2EA77A]">{l('Simple & Secure', 'Rahisi na Salama')}</span>
              </div>
              <h2 className="text-3xl sm:text-4xl font-black mb-4 tracking-tight">
                <span className="gradient-text-green">{l('How It Works', 'Jinsi Inavyofanya Kazi')}</span>
              </h2>
            </div>
          </AnimatedSection>

          <div className="grid sm:grid-cols-3 gap-8">
            {[
              { step: 1, icon: <Users className="w-7 h-7" />, title: l('Choose Your Guide', 'Chagua Mwongozo'), desc: l('Browse verified guide profiles, check ratings and specialties, and pick the perfect companion for your market adventure.', 'Tazama wasifu wa miongozo, angalia ukadiriaji, na chagua mwenzi bora kwa safari yako ya soko.') },
              { step: 2, icon: <Compass className="w-7 h-7" />, title: l('Explore Together', 'Tembea Pamoja'), desc: l('Meet at the market, get guided through the best shops, discover hidden deals, and experience Kariakoo through the eyes of a local.', 'Pokeana sokoni, ongozwa kupitia maduka mazuri, gundua biashara zilizofichwa.') },
              { step: 3, icon: <DollarSign className="w-7 h-7" />, title: l('Pay Fairly', 'Lipa Kwa Haki'), desc: l('Transparent pricing with secure escrow payments. You only pay when satisfied, and our Price Radar ensures you always get a fair deal.', 'Bei wazi kwa malipo salama ya escrow. Unalipa tu ukiwa meridhi.') },
            ].map((stepData, i) => (
              <AnimatedSection key={i} delay={i * 150}>
                <div className="text-center">
                  <div className="w-16 h-16 rounded-2xl bg-[#0B5D3A] mx-auto mb-5 flex items-center justify-center text-white">
                    {stepData.icon}
                  </div>
                  <div className="text-xs font-black text-[#FFD700] mb-2 uppercase tracking-[0.2em]">
                    {l('Step', 'Hatua')} {stepData.step}
                  </div>
                  <h3 className="font-bold text-lg mb-3">{stepData.title}</h3>
                  <p className="text-sm text-[#6C757D] dark:text-[#8B949E] leading-relaxed max-w-xs mx-auto">{stepData.desc}</p>
                </div>
              </AnimatedSection>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ TESTIMONIALS ═══ */}
      <section id="testimonials" className="py-20 sm:py-28 bg-[#F1F3F5] dark:bg-[#161B22]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <AnimatedSection>
            <div className="text-center mb-14">
              <div className="inline-flex items-center gap-2 bg-[#E8F5EE] dark:bg-[#0D2818] rounded-full px-4 py-1.5 mb-4">
                <Heart className="w-4 h-4 text-[#E63946]" />
                <span className="text-sm font-semibold text-[#0B5D3A] dark:text-[#2EA77A]">{l('Loved by Thousands', 'Wanapendwa na Maelfu')}</span>
              </div>
              <h2 className="text-3xl sm:text-4xl font-black mb-4 tracking-tight">
                <span className="gradient-text-green">{l('What People Say', 'Watu Wanasemaje')}</span>
              </h2>
            </div>
          </AnimatedSection>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {[
              { name: 'Sarah K.', avatar: 'S', role: l('Seeker from Germany', 'Mtafuta kutoka Ujerumani'), quote: l('I was overwhelmed by Kariakoo at first, but my guide Amina knew exactly where to find the best kanga fabrics at wholesale prices. The Price Radar saved me at least 30%!', 'Nilishangaa na Kariakoo mwanzoni, lakini mwongozo wangu Amina alijua mahali pa kupata vitenge kwa bei za jumla. Rada ya Bei iliniokoa angalau 30%!'), rating: 5 },
              { name: 'Hassan M.', avatar: 'H', role: l('Guide since 2024', 'Mwongozo tangu 2024'), quote: l('Kariako Guide changed my life. I went from hustling in the market to earning a steady income. The escrow system means I always get paid fairly and on time.', 'Kariako Guide ilibadilisha maisha yangu. Nimepata mapato thabiti nikifanya ninachopenda. Mfumo wa escrow inamaanisha nalipwa kwa haki.'), rating: 5 },
              { name: 'Emily C.', avatar: 'E', role: l('Seeker from Kenya', 'Mtafuta kutoka Kenya'), quote: l('The live tracking feature gave me so much peace of mind. My friends back home could see where I was, and my guide knew the safest routes. Absolutely essential!', 'Kipengele cha ufuatiliaji kilinipa amani sana. Marafiki zangu nyumbani walweza kuona nilipo. Programu muhimu sana!'), rating: 5 },
            ].map((testimonial, i) => (
              <AnimatedSection key={i} delay={i * 150}>
                <div className="kcard p-6 h-full flex flex-col">
                  <div className="flex items-center gap-1 mb-4">
                    {Array.from({ length: testimonial.rating }).map((_, j) => (
                      <Star key={j} className="w-4 h-4 fill-[#FFD700] text-[#FFD700]" />
                    ))}
                  </div>
                  <Quote className="w-8 h-8 text-[#0B5D3A]/20 mb-2" />
                  <p className="text-sm leading-relaxed flex-1 mb-5">{testimonial.quote}</p>
                  <div className="flex items-center gap-3 pt-4 border-t border-[#E9ECEF] dark:border-[#30363D]">
                    <div className="w-10 h-10 rounded-full bg-[#0B5D3A] flex items-center justify-center text-white text-sm font-bold">
                      {testimonial.avatar}
                    </div>
                    <div>
                      <p className="text-sm font-semibold">{testimonial.name}</p>
                      <p className="text-xs text-[#6C757D] dark:text-[#8B949E]">{testimonial.role}</p>
                    </div>
                    <CheckCircle2 className="w-5 h-5 text-[#0B5D3A] ml-auto" />
                  </div>
                </div>
              </AnimatedSection>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ FINAL CTA ═══ */}
      <section className="py-20 sm:py-28">
        <div className="max-w-4xl mx-auto px-4 sm:px-6">
          <AnimatedSection>
            <div className="kcard-green p-12 sm:p-16 text-center relative overflow-hidden">
              <div className="relative z-10">
                <div className="w-16 h-16 rounded-2xl bg-white/10 mx-auto mb-6 flex items-center justify-center">
                  <Compass className="w-8 h-8 text-[#FFD700]" strokeWidth={2.5} />
                </div>
                <h2 className="text-3xl sm:text-4xl font-black mb-4 tracking-tight text-white">
                  {l('Ready to Explore?', 'Uko Tayari?')}
                </h2>
                <p className="text-white/70 max-w-lg mx-auto mb-8 text-base leading-relaxed">
                  {l(
                    'Join thousands of seekers and guides already using Kariako Guide to navigate Africa\'s largest open market.',
                    'Jiunge na maelfu ya watafuta na miongozo wanaotumia Kariako Guide kutembea soko kubwa zaidi barani Afrika.'
                  )}
                </p>
                <div className="flex flex-col sm:flex-row gap-3 justify-center">
                  <Link
                    href="/auth"
                    className="kbtn-yellow px-8 py-3.5 text-base font-bold flex items-center justify-center gap-2 group"
                  >
                    <MapPin className="w-5 h-5 group-hover:rotate-12 transition-transform" />
                    {l('Get Started Free', 'Anza Bure')}
                    <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                  </Link>
                  <Link
                    href="/auth?role=guide"
                    className="bg-white/10 text-white font-bold px-8 py-3.5 text-base rounded-lg flex items-center justify-center gap-2 hover:bg-white/20 transition-colors group"
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
      <footer className="py-12 bg-[#F1F3F5] dark:bg-[#161B22]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-10 mb-10">
            <div className="sm:col-span-2 lg:col-span-1">
              <div className="flex items-center gap-2.5 mb-4">
                <div className="w-9 h-9 rounded-xl bg-[#0B5D3A] flex items-center justify-center">
                  <Compass className="w-4 h-4 text-white" strokeWidth={2.5} />
                </div>
                <span className="text-base font-black gradient-text-green">{t('app_name', language)}</span>
              </div>
              <p className="text-sm text-[#6C757D] dark:text-[#8B949E] leading-relaxed">
                {l('Your trusted companion for navigating Kariakoo market. Connecting seekers with local guides since 2024.', 'Mwenzi wako wa kuaminika kwa kutembea soko la Kariakoo. Tangu 2024.')}
              </p>
            </div>
            <div>
              <h4 className="text-sm font-bold mb-4 uppercase tracking-wider">{l('Product', 'Bidhaa')}</h4>
              <ul className="space-y-2 text-sm text-[#6C757D] dark:text-[#8B949E]">
                <li><a href="#features" className="hover:text-foreground transition-colors">{l('Features', 'Vipengele')}</a></li>
                <li><a href="#how-it-works" className="hover:text-foreground transition-colors">{l('How It Works', 'Jinsi Inavyofanya Kazi')}</a></li>
                <li><Link href="/auth?role=guide" className="hover:text-foreground transition-colors">{l('Become a Guide', 'Kuwa Mwongozo')}</Link></li>
                <li><Link href="/auth" className="hover:text-foreground transition-colors">{l('Sign In', 'Ingia')}</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="text-sm font-bold mb-4 uppercase tracking-wider">{l('Company', 'Kampuni')}</h4>
              <ul className="space-y-2 text-sm text-[#6C757D] dark:text-[#8B949E]">
                <li><span className="hover:text-foreground transition-colors cursor-default">{l('About Us', 'Kuhusu Sisi')}</span></li>
                <li><span className="hover:text-foreground transition-colors cursor-default">{l('Careers', 'Kazi')}</span></li>
                <li><span className="hover:text-foreground transition-colors cursor-default">{l('Blog', 'Blogu')}</span></li>
              </ul>
            </div>
            <div>
              <h4 className="text-sm font-bold mb-4 uppercase tracking-wider">{l('Support', 'Msaada')}</h4>
              <ul className="space-y-2 text-sm text-[#6C757D] dark:text-[#8B949E]">
                <li><span className="hover:text-foreground transition-colors cursor-default">{l('Help Center', 'Kituo cha Msaada')}</span></li>
                <li><span className="hover:text-foreground transition-colors cursor-default">{l('Safety', 'Usalama')}</span></li>
                <li><span className="hover:text-foreground transition-colors cursor-default">{l('Terms of Service', 'Masharti ya Huduma')}</span></li>
                <li><span className="hover:text-foreground transition-colors cursor-default">{l('Privacy Policy', 'Sera ya Faragha')}</span></li>
              </ul>
            </div>
          </div>
          <div className="pt-8 border-t border-[#E9ECEF] dark:border-[#30363D] flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-xs text-[#6C757D] dark:text-[#8B949E]">
              &copy; {new Date().getFullYear()} Kariako Guide. {l('All rights reserved.', 'Haki zote zimehifadhiwa.')}
            </p>
            <div className="flex items-center gap-4">
              <Globe className="w-4 h-4 text-[#6C757D]" />
              <span className="text-xs text-[#6C757D] dark:text-[#8B949E]">
                {l('Kariakoo, Dar es Salaam, Tanzania', 'Kariakoo, Dar es Salaam, Tanzania')}
              </span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

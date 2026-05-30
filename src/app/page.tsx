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
  Shield,
  Moon,
  Sun,
  Star,
  Users,
  ArrowRight,
  Lock,
  ShieldCheck,
  Headphones,
  Search,
  Package,
  Store,
  Scissors,
  Zap,
  Menu,
  X,
  TrendingUp,
  Plus,
  CheckCircle2,
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
function AnimatedCounter({ target, prefix = '', suffix = '' }: { target: number; prefix?: string; suffix?: string }) {
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

  return <span ref={ref}>{prefix}{count.toLocaleString()}{suffix}</span>;
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
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

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
    <div className="min-h-screen bg-white">
      {/* ═══ NAVIGATION ═══ */}
      <nav className="landing-nav sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-lg bg-[#FFD23F] flex items-center justify-center">
              <Compass className="w-5 h-5 text-[#0A4D3C]" strokeWidth={2.5} />
            </div>
            <span className="text-lg font-bold text-white tracking-tight">
              {l('Kariakoo Connect', 'Kariakoo Connect')}
            </span>
          </div>

          <div className="hidden md:flex items-center gap-1">
            <Link href="/market" className="landing-nav-link">{l('Market', 'Soko')}</Link>
            <Link href="/guides" className="landing-nav-link">{l('Guides', 'Miongozo')}</Link>
            <Link href="/prices" className="landing-nav-link">{l('Prices', 'Bei')}</Link>
            <Link href="/events" className="landing-nav-link">{l('Events', 'Matukio')}</Link>
            <Link href="/stories" className="landing-nav-link">{l('Stories', 'Hadithi')}</Link>
          </div>

          <div className="hidden md:flex items-center gap-3">
            <LanguageToggle className="border border-white/20 rounded-full text-white text-xs" />
            <Link href="/auth" className="lbtn-nav-ghost">
              {l('Login', 'Ingia')}
            </Link>
            <Link href="/auth" className="lbtn-nav-green">
              {l('Get a Guide', 'Pata Mwongozo')}
            </Link>
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden w-10 h-10 flex items-center justify-center text-white"
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden bg-[#073B2A] border-t border-white/10 px-4 py-4 space-y-2">
            <Link href="/market" className="block py-2 text-white/80 hover:text-white text-sm" onClick={() => setMobileMenuOpen(false)}>{l('Market', 'Soko')}</Link>
            <Link href="/guides" className="block py-2 text-white/80 hover:text-white text-sm" onClick={() => setMobileMenuOpen(false)}>{l('Guides', 'Miongozo')}</Link>
            <Link href="/prices" className="block py-2 text-white/80 hover:text-white text-sm" onClick={() => setMobileMenuOpen(false)}>{l('Prices', 'Bei')}</Link>
            <Link href="/vendors" className="block py-2 text-white/80 hover:text-white text-sm" onClick={() => setMobileMenuOpen(false)}>{l('Vendors', 'Wauzaji')}</Link>
            <Link href="/events" className="block py-2 text-white/80 hover:text-white text-sm" onClick={() => setMobileMenuOpen(false)}>{l('Events', 'Matukio')}</Link>
            <Link href="/stories" className="block py-2 text-white/80 hover:text-white text-sm" onClick={() => setMobileMenuOpen(false)}>{l('Stories', 'Hadithi')}</Link>
            <div className="pt-3 border-t border-white/10 flex gap-2">
              <Link href="/auth" className="lbtn-nav-ghost flex-1">{l('Login', 'Ingia')}</Link>
              <Link href="/auth" className="lbtn-primary flex-1">{l('Get a Guide', 'Pata Mwongozo')}</Link>
            </div>
          </div>
        )}
      </nav>

      {/* ═══ HERO SECTION ═══ */}
      <section className="hero-gradient py-20 sm:py-28 lg:py-32 relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 relative z-10">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Left Content */}
            <AnimatedSection>
              <div>
                <h1 className="text-4xl sm:text-5xl lg:text-[3.5rem] font-bold text-white leading-[1.1] mb-6 tracking-tight">
                  {l('Navigate Kariakoo', 'Tembea Kariakoo')}
                  <br />
                  <span className="text-[#FFD23F]">{l('Like a Local.', 'Kama Mtaa.')}</span>
                </h1>
                <p className="text-lg text-white/70 max-w-lg mb-8 leading-relaxed">
                  {l(
                    'The premium gateway connecting global buyers with verified expert guides in East Africa\'s commercial heart.',
                    'Lango la hali ya juu linaunganisha wanunuzi wa kimataifa na miongozo wataalamu waliothibitishwa katika moyo wa biashara wa Afrika Mashariki.'
                  )}
                </p>
                <div className="flex flex-col sm:flex-row gap-3">
                  <Link href="/auth" className="lbtn-primary">
                    {l('Find My Guide', 'Pata Mwongozo Wangu')}
                    <ArrowRight className="w-5 h-5" />
                  </Link>
                  <Link href="/market" className="lbtn-secondary">
                    {l('Explore Market', 'Gundua Soko')}
                  </Link>
                </div>
              </div>
            </AnimatedSection>

            {/* Right Profile Card */}
            <AnimatedSection delay={300} className="hidden lg:block">
              <div className="lcard-profile max-w-xs ml-auto">
                <div className="bg-gradient-to-br from-[#0A4D3C] to-[#073B2A] p-5">
                  <div className="flex items-center justify-between mb-3">
                    <span className="ltag ltag-top">{l('TOP RATED GUIDE', 'MWONGOZO BORA')}</span>
                  </div>
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-12 h-12 rounded-full bg-[#FFD23F] flex items-center justify-center text-[#0A4D3C] font-bold text-lg">
                      M
                    </div>
                    <div>
                      <p className="text-white font-bold text-base">Mwanaildi J.</p>
                      <p className="text-white/60 text-sm">{l('Village & Fabrics', 'Kijiji & Vitenge')}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 mb-3">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star key={i} className={`w-4 h-4 ${i < 4 ? 'fill-[#FFD23F] text-[#FFD23F]' : 'fill-[#FFD23F]/50 text-[#FFD23F]/50'}`} />
                    ))}
                    <span className="text-white/60 text-sm ml-1">4.5</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="ltag ltag-verified flex items-center gap-1">
                      <ShieldCheck className="w-3 h-3" />
                      {l('Verified Expert', 'Mtaalamu Aliyethibitishwa')}
                    </span>
                    <ArrowRight className="w-5 h-5 text-white/50" />
                  </div>
                </div>
              </div>
            </AnimatedSection>
          </div>
        </div>
      </section>

      {/* ═══ MARKET INTELLIGENCE SECTION ═══ */}
      <section id="market" className="py-20 sm:py-28 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="grid lg:grid-cols-2 gap-12 items-start">
            {/* Left Column */}
            <AnimatedSection>
              <div>
                <span className="ltag ltag-price mb-4">{l('PRICE INSIGHT', 'MUONO WA BEI')}</span>
                <h2 className="text-3xl sm:text-4xl font-bold text-[#0A4D3C] mb-4 tracking-tight mt-3">
                  {l('Market Intelligence', 'Ujanja wa Soko')}
                  <br />
                  {l('at Your Fingertips.', 'Mikononi Mwako.')}
                </h2>
                <p className="text-[#666666] text-base leading-relaxed mb-8 max-w-md">
                  {l(
                    'Say goodbye to guesswork prices. Our real-time data engine tracks fair market values across Kariakoo\'s 10,000+ stalls.',
                    'Sema kwaheri bei za kukisia. Injini yetu ya data ya wakati halisi inafuatilia bei za haki za soko katika maduka zaidi ya 10,000 ya Kariakoo.'
                  )}
                </p>

                {/* Product Card */}
                <div className="lcard p-5 max-w-sm">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 rounded-lg bg-[#F3F4F6] flex items-center justify-center">
                      <Zap className="w-5 h-5 text-[#0A4D3C]" />
                    </div>
                    <div>
                      <p className="font-semibold text-sm text-[#333333]">Samsung Galaxy A54</p>
                      <p className="text-xs text-[#666666]">Electronics Zone</p>
                    </div>
                  </div>
                  <div className="mb-3">
                    <p className="text-lg font-bold text-[#0A4D3C]">KSH 25,000 - KSH 30,000</p>
                    <span className="ltag ltag-fair mt-1">{l('Fair Market Price', 'Bei ya Soko ya Haki')}</span>
                  </div>
                  <button className="lbtn-primary w-full text-sm py-2.5">
                    <Plus className="w-4 h-4" />
                    {l('Add to Watch List', 'Ongeza kwenye Orodha')}
                  </button>
                </div>
              </div>
            </AnimatedSection>

            {/* Right Column - Category Grid */}
            <AnimatedSection delay={200}>
              <div className="grid grid-cols-2 gap-4">
                <Link href="/market/fabrics" className="lcard-category bg-gradient-to-br from-[#1a1a2e] to-[#16213e] text-white">
                  <Scissors className="w-8 h-8 mb-2 opacity-80" />
                  <span className="font-semibold text-sm">{l('Fabrics', 'Vitenge')}</span>
                </Link>
                <Link href="/market/wholesale" className="lcard-category bg-[#FFD23F] text-[#0A4D3C]">
                  <Package className="w-8 h-8 mb-2 opacity-80" />
                  <span className="font-semibold text-sm">{l('Wholesale', 'Jumla')}</span>
                </Link>
                <Link href="/market/electronics" className="lcard-category bg-[#0A4D3C] text-white">
                  <Zap className="w-8 h-8 mb-2 opacity-80" />
                  <span className="font-semibold text-sm">{l('Electronics', 'Elektroniki')}</span>
                </Link>
                <Link href="/market/artisanal" className="lcard-category bg-gradient-to-br from-[#8B5E3C] to-[#6B3F1F] text-white">
                  <Store className="w-8 h-8 mb-2 opacity-80" />
                  <span className="font-semibold text-sm">{l('Artisanal', 'Kisanii')}</span>
                </Link>
              </div>
            </AnimatedSection>
          </div>
        </div>
      </section>

      {/* ═══ SECURITY SECTION ═══ */}
      <section className="security-section py-20 sm:py-28">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 relative z-10">
          <AnimatedSection>
            <div className="text-center mb-14">
              <h2 className="text-3xl sm:text-4xl font-bold text-white tracking-tight">
                <span className="yellow-underline">{l('Your Security.', 'Usalama Wako.')}</span>{' '}
                {l('Our Mandate.', 'Dhamana Yetu.')}
              </h2>
            </div>
          </AnimatedSection>

          <div className="grid sm:grid-cols-3 gap-6">
            {[
              {
                icon: <Lock className="w-8 h-8" />,
                title: l('Escrow Protection', 'Ulinzi wa Escrow'),
                desc: l('Funds are released only when you confirm receipt of goods. Trade with absolute peace of mind.', 'Pesa inatolewa tu unapothibitisha kupokea bidhaa. Fanya biashara kwa amani kamili.'),
              },
              {
                icon: <ShieldCheck className="w-8 h-8" />,
                title: l('Vetted Specialists', 'Wataalamu Waliochunguzwa'),
                desc: l('Each guide passes deep background checks and professional training before joining our elite network.', 'Kila mwongozo anapita ukaguzi wa kina na mafunzo ya kitaalamu kabla ya kujiunga na mtandao wetu.'),
              },
              {
                icon: <Headphones className="w-8 h-8" />,
                title: l('Concierge Support', 'Msaada wa Concierge'),
                desc: l('A dedicated support team monitors every transaction via GPS and live chat for end-to-end security.', 'Timu ya msaada iliyitengwa inafuatilia kila muamala kupitia GPS na mazungumzo ya moja kwa moja kwa usalama wa mwisho hadi mwisho.'),
              },
            ].map((feature, i) => (
              <AnimatedSection key={i} delay={i * 150}>
                <div className="bg-white/5 border border-white/10 rounded-xl p-6 text-center hover:bg-white/10 transition-all">
                  <div className="w-14 h-14 rounded-xl bg-[#FFD23F]/10 mx-auto mb-4 flex items-center justify-center text-[#FFD23F]">
                    {feature.icon}
                  </div>
                  <h3 className="font-bold text-white text-lg mb-3">{feature.title}</h3>
                  <p className="text-white/60 text-sm leading-relaxed">{feature.desc}</p>
                </div>
              </AnimatedSection>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ HOW IT WORKS SECTION ═══ */}
      <section id="how-it-works" className="py-20 sm:py-28 bg-[#F5F5F5]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <AnimatedSection>
            <div className="text-center mb-14">
              <h2 className="text-3xl sm:text-4xl font-bold text-[#0A4D3C] tracking-tight">
                {l('How Kariakoo Connect Works', 'Jinsi Kariakoo Connect Inavyofanya Kazi')}
              </h2>
            </div>
          </AnimatedSection>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              {
                step: '01',
                icon: <Search className="w-7 h-7" />,
                title: l('Post Needs', 'Tuma Mahitaji'),
                desc: l('Tell us what you\'re hunting for — be it textiles or a full sourcing plan.', 'Tuambie unatafuta nini — iwe ni nguo au mpango kamili wa ununuzi.'),
              },
              {
                step: '02',
                icon: <Users className="w-7 h-7" />,
                title: l('Match Guide', 'Pata Mwongozo'),
                desc: l('Choose from pre-vetted specialists who know your category inside out.', 'Chagua kutoka kwa wataalamu waliochunguzwa mapema wanaojua kategoria yako vizuri.'),
              },
              {
                step: '03',
                icon: <Shield className="w-7 h-7" />,
                title: l('Trade Safely', 'Fanya Biashara Salama'),
                desc: l('Negotiate the price with precision, knowing you\'re getting the best bulk prices.', 'Jadili bei kwa usahihi, ukiwa unajua unapata bei bora za jumla.'),
              },
              {
                step: '04',
                icon: <CheckCircle2 className="w-7 h-7" />,
                title: l('Release Escrow', 'Toa Escrow'),
                desc: l('Once satisfied, release payment. Your success is our reputation.', 'Unaporidhika, toa malipo. Mafanikio yako ni sifa yetu.'),
              },
            ].map((stepData, i) => (
              <AnimatedSection key={i} delay={i * 100}>
                <div className="text-center">
                  <div className="w-16 h-16 rounded-2xl bg-[#0A4D3C] mx-auto mb-4 flex items-center justify-center text-white">
                    {stepData.icon}
                  </div>
                  <div className="step-number mb-2">
                    {l('STEP', 'HATUA')} {stepData.step}
                  </div>
                  <h3 className="font-bold text-lg text-[#333333] mb-2">{stepData.title}</h3>
                  <p className="text-sm text-[#666666] leading-relaxed max-w-xs mx-auto">{stepData.desc}</p>
                </div>
              </AnimatedSection>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ MONETIZE SECTION ═══ */}
      <section id="for-guides" className="py-20 sm:py-28 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <AnimatedSection>
            <div className="text-center mb-14">
              <h2 className="text-3xl sm:text-4xl font-bold text-[#0A4D3C] tracking-tight mb-4">
                {l('Monetize Your', 'Pata Pato la')}
                <br />
                {l('Local Expertise.', 'Utaalamu wa Karibu.')}
              </h2>
              <p className="text-[#666666] max-w-lg mx-auto leading-relaxed">
                {l(
                  'Join an elite league. Protect global buyers and earn premium rates by being the professional bridge to the market.',
                  'Jiunge na ligi ya hali ya juu. Linda wanunuzi wa kimataifa na pata viwango vya hali ya juu kwa kuwa daraja la kitaalamu kwenye soko.'
                )}
              </p>
            </div>
          </AnimatedSection>

          <div className="grid sm:grid-cols-3 gap-6 mb-10 max-w-3xl mx-auto">
            {[
              { value: 2500, prefix: '', suffix: '+', label: l('VETTED GUIDES', 'MIONGOZO WALIOTHIBITISHWA') },
              { value: 98, prefix: '', suffix: '%', label: l('SATISFACTION', 'KURIDHIKA') },
              { value: 450, prefix: '', suffix: 'M TZS', label: l('TOTAL EARNINGS DISBURSED', 'JUMLA YA MAPATO YALIYOTOLEWA') },
            ].map((stat, i) => (
              <AnimatedSection key={i} delay={i * 150}>
                <div className="stat-card">
                  <p className="text-3xl sm:text-4xl font-bold text-[#0A4D3C] mb-2">
                    <AnimatedCounter target={stat.value} prefix={stat.prefix} suffix={stat.suffix} />
                  </p>
                  <p className="text-xs font-semibold text-[#666666] uppercase tracking-[0.15em]">{stat.label}</p>
                </div>
              </AnimatedSection>
            ))}
          </div>

          <AnimatedSection>
            <div className="text-center">
              <Link href="/auth?role=guide" className="lbtn-green">
                {l('Join the Network', 'Jiunge na Mtandao')}
                <ArrowRight className="w-5 h-5" />
              </Link>
            </div>
          </AnimatedSection>
        </div>
      </section>

      {/* ═══ FOOTER ═══ */}
      <footer className="py-16 bg-[#F5F5F5]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-10 mb-10">
            {/* Column 1 - Brand */}
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="w-9 h-9 rounded-lg bg-[#0A4D3C] flex items-center justify-center">
                  <Compass className="w-4 h-4 text-[#FFD23F]" strokeWidth={2.5} />
                </div>
                <span className="text-base font-bold text-[#0A4D3C]">{l('Kariakoo Connect', 'Kariakoo Connect')}</span>
              </div>
              <p className="text-sm text-[#666666] leading-relaxed mb-4">
                {l(
                  'Elevating East African commerce through radical transparency and trusted local expertise.',
                  'Kuimarisha biashara ya Afrika Mashariki kupitia uwazi mkubwa na utaalamu wa karibu unaotegemewa.'
                )}
              </p>
              <div className="flex items-center gap-3">
                {['twitter', 'instagram', 'facebook', 'linkedin'].map((social) => (
                  <div key={social} className="w-8 h-8 rounded-full bg-[#E5E7EB] flex items-center justify-center cursor-pointer hover:bg-[#0A4D3C] hover:text-white text-[#666666] transition-colors">
                    <span className="text-xs font-bold uppercase">{social[0]}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Column 2 - Platform */}
            <div>
              <h4 className="text-xs font-bold mb-4 uppercase tracking-[0.15em] text-[#333333]">{l('PLATFORM', 'JUKWAA')}</h4>
              <ul className="space-y-2.5 text-sm text-[#666666]">
                <li><Link href="/market" className="hover:text-[#0A4D3C] transition-colors">{l('Market Explorer', 'Mchunguzi wa Soko')}</Link></li>
                <li><Link href="/guides" className="hover:text-[#0A4D3C] transition-colors">{l('Browse Guides', 'Vinjua Miongozo')}</Link></li>
                <li><Link href="/prices" className="hover:text-[#0A4D3C] transition-colors">{l('Price Radar', 'Rada ya Bei')}</Link></li>
                <li><Link href="/vendors" className="hover:text-[#0A4D3C] transition-colors">{l('Vendor Directory', 'Orodha ya Wauzaji')}</Link></li>
              </ul>
            </div>

            {/* Column 3 - Company */}
            <div>
              <h4 className="text-xs font-bold mb-4 uppercase tracking-[0.15em] text-[#333333]">{l('COMPANY', 'KAMPUNI')}</h4>
              <ul className="space-y-2.5 text-sm text-[#666666]">
                <li><Link href="/events" className="hover:text-[#0A4D3C] transition-colors">{l('Events', 'Matukio')}</Link></li>
                <li><Link href="/stories" className="hover:text-[#0A4D3C] transition-colors">{l('Market Stories', 'Hadithi za Soko')}</Link></li>
                <li><span className="hover:text-[#0A4D3C] transition-colors cursor-pointer">{l('Safety First', 'Usalama Kwanza')}</span></li>
                <li><span className="hover:text-[#0A4D3C] transition-colors cursor-pointer">{l('Terms', 'Masharti')}</span></li>
              </ul>
            </div>

            {/* Column 4 - Language */}
            <div>
              <h4 className="text-xs font-bold mb-4 uppercase tracking-[0.15em] text-[#333333]">{l('LANGUAGE', 'LUGHA')}</h4>
              <LanguageToggle className="w-full border border-[#E5E7EB] rounded-lg px-4 py-2.5 text-sm text-[#333333]" />
              <div className="mt-6">
                <button
                  onClick={() => setDarkMode(!darkMode)}
                  className="flex items-center gap-2 text-sm text-[#666666] hover:text-[#0A4D3C] transition-colors"
                >
                  {darkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
                  {darkMode ? l('Light Mode', 'Hali ya Mwanga') : l('Dark Mode', 'Hali ya Giza')}
                </button>
              </div>
            </div>
          </div>

          <div className="pt-8 border-t border-[#E5E7EB] flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-xs text-[#666666]">
              &copy; {new Date().getFullYear()} Kariakoo Ltd. {l('All Rights Reserved.', 'Haki Zote Zimehifadhiwa.')}
            </p>
            <p className="text-xs text-[#999999] italic">
              {l('Empowering the future of pan-African trade.', 'Kuwawezesha mustakabali wa biashara ya Kiafrika.')}
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}

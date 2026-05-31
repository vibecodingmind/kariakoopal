'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/lib/stores/auth-store';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search,
  Mic,
  SlidersHorizontal,
  X,
  Star,
  MapPin,
  Clock,
  ChevronDown,
  ChevronUp,
  Sparkles,
  TrendingUp,
  History,
  ShieldCheck,
  BadgeCheck,
  ShoppingBag,
  Compass,
  Store,
  ArrowUpDown,
  Zap,
  Languages,
  CalendarDays,
  MicOff,
  Package,
  Calendar,
} from 'lucide-react';

// ── Types ──
interface SearchResult {
  id: string;
  name: string;
  type: 'guide' | 'vendor' | 'zone' | 'item' | 'package' | 'event';
  rating: number;
  price?: number;
  zone?: string;
  category?: string;
  specialty?: string;
  available?: boolean;
  verified?: boolean;
  aiRecommended?: boolean;
  languages?: string[];
  guideCount?: number;
  description?: string;
  highlightedName?: string;
  highlightedSpecialty?: string;
  highlightedCategory?: string;
  duration?: number;
  date?: string;
}

type FilterType = 'all' | 'guide' | 'vendor' | 'zone' | 'food' | 'shopping' | 'experience' | 'package' | 'event';

// ── Trending searches ──
const TRENDING_SEARCHES = ['Fabrics', 'Spices', 'Electronics', 'Kanga', 'Cultural Tour', 'Wholesale'];

// ── Zones ──
const ZONES = [
  { id: 'central', label: 'Central Market', labelSw: 'Soko Kuu' },
  { id: 'east', label: 'East Wing', labelSw: 'Upeo Mashariki' },
  { id: 'west', label: 'West Wing', labelSw: 'Upeo Magharibi' },
  { id: 'food', label: 'Food Court', labelSw: 'Ukumbi wa Chakula' },
  { id: 'fabric', label: 'Fabrics Zone', labelSw: 'Eneo la Vitambaa' },
  { id: 'electronics', label: 'Electronics', labelSw: 'Elektroniki' },
];

const LANGUAGES = [
  { id: 'en', label: 'English' },
  { id: 'sw', label: 'Swahili' },
  { id: 'both', label: 'Both' },
];

const SORT_OPTIONS = [
  { id: 'relevance', label: 'Relevance', labelSw: 'Uhusiano', icon: ArrowUpDown },
  { id: 'rating', label: 'Rating', labelSw: 'Ukadiriaji', icon: Star },
  { id: 'price_low', label: 'Price: Low → High', labelSw: 'Bei: Chini → Juu', icon: TrendingUp },
  { id: 'price_high', label: 'Price: High → Low', labelSw: 'Bei: Juu → Chini', icon: TrendingUp },
];

const AVAILABILITY_OPTIONS = [
  { id: 'now', label: 'Now', labelSw: 'Sasa' },
  { id: 'today', label: 'Today', labelSw: 'Leo' },
  { id: 'week', label: 'This Week', labelSw: 'Wiki Hii' },
];

// ── Filter Chips ──
const FILTER_CHIPS: { id: FilterType; label: string; labelSw: string; icon: any }[] = [
  { id: 'all', label: 'All', labelSw: 'Yote', icon: Search },
  { id: 'guide', label: 'Guides', labelSw: 'Miongozo', icon: Compass },
  { id: 'vendor', label: 'Vendors', labelSw: 'Wauzaji', icon: Store },
  { id: 'zone', label: 'Zones', labelSw: 'Maeneo', icon: MapPin },
  { id: 'package', label: 'Packages', labelSw: 'Pakiti', icon: Package },
  { id: 'event', label: 'Events', labelSw: 'Matukio', icon: Calendar },
  { id: 'food', label: 'Food', labelSw: 'Chakula', icon: ShoppingBag },
  { id: 'shopping', label: 'Shopping', labelSw: 'Ununuzi', icon: ShoppingBag },
  { id: 'experience', label: 'Experiences', labelSw: 'Uzoefu', icon: Sparkles },
];

// ── Local storage key ──
const RECENT_SEARCHES_KEY = 'chimbo-recent-searches';
const MAX_RECENT = 8;

function getRecentFromStorage(): string[] {
  if (typeof window === 'undefined') return [];
  try {
    const stored = localStorage.getItem(RECENT_SEARCHES_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

function saveRecentToStorage(searches: string[]) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(searches.slice(0, MAX_RECENT)));
  } catch { /* ignore */ }
}

export default function SearchPage() {
  const router = useRouter();
  const { language } = useAuthStore();
  const sw = language === 'sw';

  // Search state
  const [query, setQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<FilterType>('all');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  // Advanced filters
  const [showFilters, setShowFilters] = useState(false);
  const [priceMin, setPriceMin] = useState(0);
  const [priceMax, setPriceMax] = useState(200000);
  const [minRating, setMinRating] = useState(0);
  const [selectedZones, setSelectedZones] = useState<string[]>([]);
  const [availability, setAvailability] = useState('');
  const [selectedLanguage, setSelectedLanguage] = useState('');
  const [sortBy, setSortBy] = useState('relevance');

  // Suggestions
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);

  // Voice search
  const [isListening, setIsListening] = useState(false);
  const [voiceSupported, setVoiceSupported] = useState(false);
  const recognitionRef = useRef<any>(null);

  const inputRef = useRef<HTMLInputElement>(null);
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const l = (en: string, swText: string) => (sw ? swText : en);

  // ── Load recent searches from localStorage ──
  useEffect(() => {
    setRecentSearches(getRecentFromStorage());
  }, []);

  // ── Check voice search support ──
  useEffect(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      setVoiceSupported(true);
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = true;
      recognition.lang = sw ? 'sw-TZ' : 'en-US';

      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        setQuery(transcript);
        if (event.results[0].isFinal) {
          setIsListening(false);
          performSearch(transcript);
        }
      };

      recognition.onerror = () => {
        setIsListening(false);
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = recognition;
    }
  }, [sw]);

  // ── Toggle voice search ──
  const toggleVoiceSearch = useCallback(() => {
    if (!recognitionRef.current) return;
    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    } else {
      recognitionRef.current.start();
      setIsListening(true);
    }
  }, [isListening]);

  // ── Auto-suggestions from API ──
  useEffect(() => {
    if (query.length < 2) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    // Local autocomplete for speed
    const allTerms = [
      'Fabrics', 'Kanga', 'Spices', 'Electronics', 'Cultural Tour',
      'Mwanamvua Juma', 'Asha Mohamed', 'Fatma Hassan', 'Hassan Kimaro',
      'Central Market', 'Fabrics Zone', 'Spice Market', 'West Wing',
      'Wholesale', 'Textiles', 'Herbs', 'Gadgets', 'Jewelry',
      'Cultural Heritage Tour', 'Spice Trail Experience', 'Fabric Safari',
      'Kanga Festival', 'Pilau Masala', 'Tanzanite', 'Kitenge',
    ];

    const filtered = allTerms.filter(t =>
      t.toLowerCase().includes(query.toLowerCase())
    ).slice(0, 6);

    setSuggestions(filtered);
    setShowSuggestions(filtered.length > 0 && document.activeElement === inputRef.current);
  }, [query]);

  // ── Search Function ──
  const performSearch = useCallback(async (searchQuery?: string) => {
    const q = searchQuery || query;
    if (!q.trim() && activeFilter === 'all') {
      setResults([]);
      setHasSearched(false);
      return;
    }

    setIsSearching(true);
    setHasSearched(true);
    setShowSuggestions(false);

    try {
      const params = new URLSearchParams();
      if (q.trim()) params.set('q', q.trim());
      if (activeFilter !== 'all') params.set('type', activeFilter);
      if (priceMin > 0) params.set('minPrice', priceMin.toString());
      if (priceMax < 200000) params.set('maxPrice', priceMax.toString());
      if (minRating > 0) params.set('minRating', minRating.toString());
      if (selectedZones.length > 0) params.set('zone', selectedZones[0]);
      if (selectedLanguage) params.set('language', selectedLanguage);
      if (sortBy !== 'relevance') params.set('sort', sortBy);

      const res = await fetch(`/api/search?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setResults(data.results || []);
      } else {
        setResults([]);
      }
    } catch (err) {
      console.error('Search error:', err);
      setResults([]);
    } finally {
      setIsSearching(false);
    }

    // Save to recent searches
    if (q.trim()) {
      setRecentSearches(prev => {
        const updated = [q.trim(), ...prev.filter(s => s !== q.trim())].slice(0, MAX_RECENT);
        saveRecentToStorage(updated);
        return updated;
      });
    }
  }, [query, activeFilter, priceMin, priceMax, minRating, selectedZones, selectedLanguage, sortBy]);

  // ── Debounced search on query change ──
  useEffect(() => {
    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);

    if (query.trim().length >= 2) {
      searchTimeoutRef.current = setTimeout(() => performSearch(), 400);
    } else if (query.trim().length === 0 && hasSearched) {
      setResults([]);
      setHasSearched(false);
    }

    return () => {
      if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
    };
  }, [query, performSearch, hasSearched]);

  // ── Clear recent searches ──
  const clearRecentSearches = () => {
    setRecentSearches([]);
    saveRecentToStorage([]);
  };

  // ── Zone toggle ──
  const toggleZone = (zoneId: string) => {
    setSelectedZones(prev =>
      prev.includes(zoneId) ? prev.filter(z => z !== zoneId) : [...prev, zoneId]
    );
  };

  // ── Reset filters ──
  const resetFilters = () => {
    setPriceMin(0);
    setPriceMax(200000);
    setMinRating(0);
    setSelectedZones([]);
    setAvailability('');
    setSelectedLanguage('');
    setSortBy('relevance');
  };

  // ── Type badge config ──
  const getTypeBadge = (type: string) => {
    switch (type) {
      case 'guide': return { label: l('Guide', 'Mwongozo'), color: 'bg-[#065F46] text-white', icon: Compass };
      case 'vendor': return { label: l('Vendor', 'Muuzaji'), color: 'bg-[#F59E0B] text-white', icon: Store };
      case 'zone': return { label: l('Zone', 'Eneo'), color: 'bg-[#0EA5E9] text-white', icon: MapPin };
      case 'package': return { label: l('Package', 'Pakiti'), color: 'bg-[#8B5CF6] text-white', icon: Package };
      case 'event': return { label: l('Event', 'Tukio'), color: 'bg-[#EC4899] text-white', icon: Calendar };
      default: return { label: type, color: 'bg-[#64748B] text-white', icon: Search };
    }
  };

  // ── Get quick action ──
  const getQuickAction = (result: SearchResult) => {
    switch (result.type) {
      case 'guide': return { label: l('Book', 'Buka'), href: `/guides/${result.id}` };
      case 'vendor': return { label: l('Visit', 'Tembelea'), href: `/vendors/${result.id}` };
      case 'zone': return { label: l('View', 'Tazama'), href: `/market/${result.id}` };
      case 'package': return { label: l('Book', 'Buka'), href: `/packages/${result.id}` };
      case 'event': return { label: l('Details', 'Maelezo'), href: `/events/${result.id}` };
      default: return { label: l('View', 'Tazama'), href: '#' };
    }
  };

  const hasActiveFilters = priceMin > 0 || priceMax < 200000 || minRating > 0 || selectedZones.length > 0 || availability || selectedLanguage || sortBy !== 'relevance';

  return (
    <div className="min-h-screen bg-[#F8FAFC] dark:bg-[#0F172A]">
      {/* Hero Search Section */}
      <div className="bg-gradient-to-b from-[#065F46] to-[#064E3B] dark:from-[#0F172A] dark:to-[#0F172A] px-4 pt-4 pb-6">
        <motion.div initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="text-xl font-bold text-white mb-1">{l('Search Kariakoo', 'Tafuta Kariakoo')}</h1>
          <p className="text-xs text-[#34D399] mb-4">{l('Find guides, vendors, zones & more', 'Pata miongozo, wauzaji, maeneo na zaidi')}</p>

          {/* Search Bar */}
          <div className="relative">
            <div className={`flex items-center gap-2 bg-white dark:bg-[#1E293B] rounded-2xl px-4 py-3 shadow-lg ${isListening ? 'ring-2 ring-red-400 ring-offset-2' : ''}`}>
              <Search className="w-5 h-5 text-[#065F46] dark:text-[#34D399] flex-shrink-0" />
              <input
                ref={inputRef}
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onFocus={() => { if (suggestions.length > 0 || recentSearches.length > 0) setShowSuggestions(true); }}
                placeholder={isListening ? l('Listening...', 'Inasikiliza...') : l('Search anything...', 'Tafuta chochote...')}
                className="flex-1 bg-transparent text-sm outline-none text-[#065F46] dark:text-white placeholder:text-[#94A3B8]"
              />
              {query && (
                <button onClick={() => { setQuery(''); setResults([]); setHasSearched(false); }} className="p-1 hover:bg-[#F1F5F9] dark:hover:bg-[#334155] rounded-full transition-colors">
                  <X className="w-4 h-4 text-[#64748B]" />
                </button>
              )}
              {/* Voice Search Button */}
              {voiceSupported && (
                <button
                  onClick={toggleVoiceSearch}
                  className={`p-1.5 rounded-full transition-all ${
                    isListening
                      ? 'bg-red-500 text-white animate-pulse'
                      : 'hover:bg-[#F1F5F9] dark:hover:bg-[#334155]'
                  }`}
                  title={l('Voice Search', 'Utafutaji wa Sauti')}
                >
                  {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4 text-[#065F46] dark:text-[#34D399]" />}
                </button>
              )}
              {!voiceSupported && (
                <button className="p-1.5 hover:bg-[#F1F5F9] dark:hover:bg-[#334155] rounded-full transition-colors opacity-40" title={l('Voice not supported', 'Sauti haitumiki')}>
                  <Mic className="w-4 h-4 text-[#64748B]" />
                </button>
              )}
              <button
                onClick={() => setShowFilters(!showFilters)}
                className={`p-1.5 rounded-full transition-colors ${showFilters || hasActiveFilters ? 'bg-[#ECFDF5] dark:bg-[#064E3B]' : 'hover:bg-[#F1F5F9] dark:hover:bg-[#334155]'}`}
              >
                <SlidersHorizontal className={`w-4 h-4 ${showFilters || hasActiveFilters ? 'text-[#065F46] dark:text-[#34D399]' : 'text-[#64748B]'}`} />
              </button>
            </div>

            {/* Auto-suggestions Dropdown */}
            <AnimatePresence>
              {showSuggestions && (suggestions.length > 0 || (recentSearches.length > 0 && !query)) && (
                <motion.div
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -4 }}
                  className="absolute top-full left-0 right-0 mt-1 bg-white dark:bg-[#1E293B] rounded-xl shadow-xl border border-[#E2E8F0] dark:border-[#334155] z-20 overflow-hidden"
                >
                  {/* Recent searches in dropdown */}
                  {!query && recentSearches.length > 0 && (
                    <div className="border-b border-[#E2E8F0] dark:border-[#334155]">
                      <div className="flex items-center justify-between px-4 py-2">
                        <span className="text-[10px] font-semibold text-[#64748B] uppercase">{l('Recent', 'Hivi Karibu')}</span>
                        <button onClick={clearRecentSearches} className="text-[10px] text-[#DC2626] hover:underline">{l('Clear', 'Futa')}</button>
                      </div>
                      {recentSearches.slice(0, 4).map(term => (
                        <button
                          key={`recent-${term}`}
                          onClick={() => { setQuery(term); setShowSuggestions(false); performSearch(term); }}
                          className="w-full flex items-center gap-2.5 px-4 py-2 text-sm hover:bg-[#F1F5F9] dark:hover:bg-[#334155] transition-colors text-left"
                        >
                          <History className="w-3.5 h-3.5 text-[#94A3B8] flex-shrink-0" />
                          <span className="text-[#065F46] dark:text-white">{term}</span>
                        </button>
                      ))}
                    </div>
                  )}

                  {/* Autocomplete suggestions */}
                  {suggestions.map((suggestion, i) => (
                    <button
                      key={suggestion}
                      onClick={() => {
                        setQuery(suggestion);
                        setShowSuggestions(false);
                        performSearch(suggestion);
                      }}
                      className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm hover:bg-[#F1F5F9] dark:hover:bg-[#334155] transition-colors text-left"
                    >
                      <Search className="w-3.5 h-3.5 text-[#64748B] flex-shrink-0" />
                      <span className="text-[#065F46] dark:text-white">{suggestion}</span>
                    </button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>

        {/* Voice listening indicator */}
        <AnimatePresence>
          {isListening && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="mt-2 flex items-center justify-center gap-2"
            >
              <div className="flex items-center gap-1">
                {[0, 1, 2, 3, 4].map(i => (
                  <motion.div
                    key={i}
                    className="w-1 bg-white rounded-full"
                    animate={{ height: [8, 20, 8] }}
                    transition={{ duration: 0.6, repeat: Infinity, delay: i * 0.1 }}
                  />
                ))}
              </div>
              <span className="text-xs text-white/80">{l('Listening...', 'Inasikiliza...')}</span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Filter Chips */}
        <div className="flex gap-2 mt-4 overflow-x-auto pb-1 scrollbar-hide">
          {FILTER_CHIPS.map(chip => {
            const Icon = chip.icon;
            const active = activeFilter === chip.id;
            return (
              <button
                key={chip.id}
                onClick={() => {
                  setActiveFilter(chip.id);
                  if (hasSearched) performSearch();
                }}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all ${
                  active
                    ? 'bg-white text-[#065F46] shadow-sm'
                    : 'bg-white/15 text-white/80 hover:bg-white/25'
                }`}
              >
                <Icon className="w-3 h-3" />
                {sw ? chip.labelSw : chip.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Advanced Filters (collapsible) */}
      <AnimatePresence>
        {showFilters && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="overflow-hidden"
          >
            <div className="px-4 py-4 bg-white dark:bg-[#1E293B] border-b border-[#E2E8F0] dark:border-[#334155]">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-bold text-[#065F46] dark:text-[#34D399]">{l('Advanced Filters', 'Vichujio Vya Juu')}</h3>
                {hasActiveFilters && (
                  <button onClick={resetFilters} className="text-xs text-[#DC2626] font-medium hover:underline">
                    {l('Reset All', 'Futa Yote')}
                  </button>
                )}
              </div>

              {/* Price Range */}
              <div className="mb-4">
                <label className="text-xs font-medium text-[#64748B] mb-2 block">{l('Price Range (TZS)', 'Kiwango cha Bei (TZS)')}</label>
                <div className="flex items-center gap-3">
                  <input
                    type="number"
                    value={priceMin || ''}
                    onChange={e => setPriceMin(Number(e.target.value))}
                    placeholder="Min"
                    className="w-full px-3 py-2 rounded-lg border border-[#E2E8F0] dark:border-[#334155] bg-[#F8FAFC] dark:bg-[#0F172A] text-sm outline-none focus:ring-2 focus:ring-[#065F46]/20"
                  />
                  <span className="text-[#64748B] text-xs">—</span>
                  <input
                    type="number"
                    value={priceMax < 200000 ? priceMax : ''}
                    onChange={e => setPriceMax(Number(e.target.value) || 200000)}
                    placeholder="Max"
                    className="w-full px-3 py-2 rounded-lg border border-[#E2E8F0] dark:border-[#334155] bg-[#F8FAFC] dark:bg-[#0F172A] text-sm outline-none focus:ring-2 focus:ring-[#065F46]/20"
                  />
                </div>
              </div>

              {/* Rating */}
              <div className="mb-4">
                <label className="text-xs font-medium text-[#64748B] mb-2 block">{l('Minimum Rating', 'Ukadiriaji Wa Chini')}</label>
                <div className="flex gap-1.5">
                  {[1, 2, 3, 4, 5].map(star => (
                    <button
                      key={star}
                      onClick={() => setMinRating(minRating === star ? 0 : star)}
                      className={`p-2 rounded-lg border transition-all ${
                        minRating >= star
                          ? 'border-[#065F46] bg-[#ECFDF5] dark:bg-[#064E3B]'
                          : 'border-[#E2E8F0] dark:border-[#334155] hover:border-[#065F46]/30'
                      }`}
                    >
                      <Star className={`w-4 h-4 ${minRating >= star ? 'fill-[#F59E0B] text-[#F59E0B]' : 'text-[#CBD5E1]'}`} />
                    </button>
                  ))}
                </div>
              </div>

              {/* Zone */}
              <div className="mb-4">
                <label className="text-xs font-medium text-[#64748B] mb-2 block">{l('Zone', 'Eneo')}</label>
                <div className="grid grid-cols-2 gap-2">
                  {ZONES.map(zone => (
                    <button
                      key={zone.id}
                      onClick={() => toggleZone(zone.id)}
                      className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                        selectedZones.includes(zone.id)
                          ? 'bg-[#065F46] text-white'
                          : 'bg-[#F1F5F9] dark:bg-[#334155] text-[#64748B]'
                      }`}
                    >
                      {sw ? zone.labelSw : zone.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Language */}
              <div className="mb-4">
                <label className="text-xs font-medium text-[#64748B] mb-2 block flex items-center gap-1.5">
                  <Languages className="w-3 h-3" /> {l('Language', 'Lugha')}
                </label>
                <div className="flex gap-2">
                  {LANGUAGES.map(lang => (
                    <button
                      key={lang.id}
                      onClick={() => setSelectedLanguage(selectedLanguage === lang.id ? '' : lang.id)}
                      className={`flex-1 py-2 px-3 rounded-lg text-xs font-medium transition-all ${
                        selectedLanguage === lang.id
                          ? 'bg-[#065F46] text-white'
                          : 'bg-[#F1F5F9] dark:bg-[#334155] text-[#64748B]'
                      }`}
                    >
                      {lang.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Sort By */}
              <div>
                <label className="text-xs font-medium text-[#64748B] mb-2 block flex items-center gap-1.5">
                  <ArrowUpDown className="w-3 h-3" /> {l('Sort By', 'Panga Kwa')}
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {SORT_OPTIONS.map(opt => {
                    const Icon = opt.icon;
                    return (
                      <button
                        key={opt.id}
                        onClick={() => setSortBy(opt.id)}
                        className={`flex items-center gap-1.5 py-2 px-3 rounded-lg text-xs font-medium transition-all ${
                          sortBy === opt.id
                            ? 'bg-[#065F46] text-white'
                            : 'bg-[#F1F5F9] dark:bg-[#334155] text-[#64748B]'
                        }`}
                      >
                        <Icon className="w-3 h-3" />
                        {sw ? opt.labelSw : opt.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              <button
                onClick={() => { performSearch(); setShowFilters(false); }}
                className="w-full mt-4 py-2.5 bg-[#065F46] text-white text-sm font-bold rounded-xl hover:bg-[#064E3B] transition-colors active:scale-[0.98]"
              >
                {l('Apply Filters & Search', 'Tumia Vichujio na Tafuta')}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Content */}
      <div className="px-4 py-4">
        {/* Before search: Trending & Recent */}
        {!hasSearched && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
            {/* Recent Searches */}
            {recentSearches.length > 0 && (
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="flex items-center gap-2 text-sm font-bold text-[#065F46] dark:text-[#34D399]">
                    <History className="w-4 h-4" />
                    {l('Recent Searches', 'Utafutaji wa Hivi Karibu')}
                  </h3>
                  <button onClick={clearRecentSearches} className="text-[10px] text-[#DC2626] hover:underline">{l('Clear', 'Futa')}</button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {recentSearches.map(term => (
                    <button
                      key={term}
                      onClick={() => { setQuery(term); performSearch(term); }}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white dark:bg-[#1E293B] border border-[#E2E8F0] dark:border-[#334155] text-xs font-medium text-[#065F46] dark:text-[#34D399] hover:shadow-sm transition-all active:scale-95"
                    >
                      <History className="w-3 h-3 text-[#64748B]" />
                      {term}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Trending Searches */}
            <div>
              <h3 className="flex items-center gap-2 text-sm font-bold text-[#065F46] dark:text-[#34D399] mb-3">
                <TrendingUp className="w-4 h-4" />
                {l('Trending Searches', 'Utafutaji Maarufu')}
              </h3>
              <div className="flex flex-wrap gap-2">
                {TRENDING_SEARCHES.map(term => (
                  <button
                    key={term}
                    onClick={() => { setQuery(term); performSearch(term); }}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-gradient-to-r from-[#ECFDF5] to-[#FEF3C7] dark:from-[#064E3B] dark:to-[#1E293B] border border-[#065F46]/10 dark:border-[#34D399]/20 text-xs font-medium text-[#065F46] dark:text-[#34D399] hover:shadow-sm transition-all active:scale-95"
                  >
                    <Zap className="w-3 h-3 text-[#F59E0B]" />
                    {term}
                  </button>
                ))}
              </div>
            </div>

            {/* Quick Browse Zones */}
            <div>
              <h3 className="flex items-center gap-2 text-sm font-bold text-[#065F46] dark:text-[#34D399] mb-3">
                <MapPin className="w-4 h-4" />
                {l('Browse by Zone', 'Vinjari kwa Eneo')}
              </h3>
              <div className="grid grid-cols-2 gap-2">
                {ZONES.map(zone => (
                  <button
                    key={zone.id}
                    onClick={() => { setActiveFilter('zone'); setQuery(sw ? zone.labelSw : zone.label); performSearch(sw ? zone.labelSw : zone.label); }}
                    className="p-3 rounded-xl bg-white dark:bg-[#1E293B] border border-[#E2E8F0] dark:border-[#334155] text-left hover:shadow-sm transition-all active:scale-[0.98]"
                  >
                    <MapPin className="w-4 h-4 text-[#065F46] dark:text-[#34D399] mb-1" />
                    <p className="text-sm font-semibold text-[#065F46] dark:text-white">{sw ? zone.labelSw : zone.label}</p>
                  </button>
                ))}
              </div>
            </div>
          </motion.div>
        )}

        {/* Loading State */}
        {isSearching && (
          <div className="flex flex-col items-center justify-center py-16">
            <div className="w-10 h-10 border-3 border-[#065F46]/20 border-t-[#065F46] rounded-full animate-spin" />
            <p className="mt-3 text-sm text-[#64748B]">{l('Searching...', 'Inatafuta...')}</p>
          </div>
        )}

        {/* Search Results */}
        {!isSearching && hasSearched && (
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm text-[#64748B]">
                {results.length > 0
                  ? l(`${results.length} result${results.length !== 1 ? 's' : ''} found`, `Matokeo ${results.length} yamepatikana`)
                  : l('No results found', 'Hakuna matokeo')
                }
              </p>
              {query && (
                <span className="text-xs text-[#065F46] dark:text-[#34D399] font-medium">
                  &ldquo;{query}&rdquo;
                </span>
              )}
            </div>

            {results.length > 0 ? (
              <div className="space-y-3">
                {results.map((result, i) => {
                  const badge = getTypeBadge(result.type);
                  const action = getQuickAction(result);
                  const BadgeIcon = badge.icon;
                  const displayName = result.highlightedName || result.name;
                  const isHighlighted = displayName.includes('<mark>');

                  return (
                    <motion.div
                      key={`${result.type}-${result.id}`}
                      initial={{ opacity: 0, y: 12 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.05 }}
                      className="bg-white dark:bg-[#1E293B] rounded-2xl border border-[#E2E8F0] dark:border-[#334155] p-4 hover:shadow-md transition-shadow"
                    >
                      <div className="flex items-start gap-3">
                        {/* Icon/Avatar */}
                        <div className={`w-11 h-11 rounded-xl ${badge.color} flex items-center justify-center flex-shrink-0`}>
                          <BadgeIcon className="w-5 h-5" />
                        </div>

                        {/* Content */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-0.5">
                            {isHighlighted ? (
                              <h4 className="font-semibold text-sm text-[#065F46] dark:text-white" dangerouslySetInnerHTML={{ __html: displayName }} />
                            ) : (
                              <h4 className="font-semibold text-sm text-[#065F46] dark:text-white truncate">{displayName}</h4>
                            )}
                            {result.aiRecommended && (
                              <span className="flex items-center gap-0.5 px-1.5 py-0.5 rounded-md bg-[#FEF3C7] dark:bg-[#422006] text-[10px] font-bold text-[#92400E] dark:text-[#FCD34D] flex-shrink-0">
                                <Sparkles className="w-2.5 h-2.5" />
                                AI
                              </span>
                            )}
                          </div>

                          {/* Type Badge */}
                          <div className="flex items-center gap-2 mb-1.5">
                            <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[10px] font-medium ${badge.color}`}>
                              <BadgeIcon className="w-2.5 h-2.5" />
                              {badge.label}
                            </span>
                            {result.verified && (
                              <span className="flex items-center gap-0.5 text-[10px] text-[#065F46] dark:text-[#34D399] font-medium">
                                <ShieldCheck className="w-3 h-3" />
                                {l('Verified', 'Thibitishwa')}
                              </span>
                            )}
                          </div>

                          {/* Details */}
                          <div className="flex items-center gap-3 flex-wrap">
                            {result.rating > 0 && (
                              <span className="flex items-center gap-1 text-xs">
                                <Star className="w-3 h-3 fill-[#F59E0B] text-[#F59E0B]" />
                                <span className="font-semibold text-[#065F46] dark:text-white">{result.rating}</span>
                              </span>
                            )}
                            {result.price ? (
                              <span className="text-xs font-semibold text-[#065F46] dark:text-[#34D399]">
                                TZS {result.price.toLocaleString()}
                              </span>
                            ) : null}
                            {result.zone && (
                              <span className="flex items-center gap-1 text-xs text-[#64748B]">
                                <MapPin className="w-3 h-3" />
                                {result.zone}
                              </span>
                            )}
                            {result.duration && (
                              <span className="flex items-center gap-1 text-xs text-[#64748B]">
                                <Clock className="w-3 h-3" />
                                {result.duration}h
                              </span>
                            )}
                            {result.date && (
                              <span className="flex items-center gap-1 text-xs text-[#64748B]">
                                <CalendarDays className="w-3 h-3" />
                                {new Date(result.date).toLocaleDateString()}
                              </span>
                            )}
                            {result.available !== undefined && (
                              <span className={`flex items-center gap-1 text-[10px] font-medium ${result.available ? 'text-[#10B981]' : 'text-[#64748B]'}`}>
                                <div className={`w-1.5 h-1.5 rounded-full ${result.available ? 'bg-[#10B981]' : 'bg-[#94A3B8]'}`} />
                                {result.available ? l('Available', 'Wapo') : l('Busy', 'Hawi')}
                              </span>
                            )}
                          </div>

                          {/* Languages */}
                          {result.languages && result.languages.length > 0 && (
                            <div className="flex items-center gap-1 mt-1.5">
                              <Languages className="w-3 h-3 text-[#64748B]" />
                              {result.languages.map(lang => (
                                <span key={lang} className="text-[10px] text-[#64748B] px-1.5 py-0.5 bg-[#F1F5F9] dark:bg-[#334155] rounded">
                                  {lang}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Quick Action */}
                      <button
                        onClick={() => router.push(action.href)}
                        className="w-full mt-3 py-2 bg-[#065F46] text-white text-xs font-bold rounded-xl hover:bg-[#064E3B] transition-colors active:scale-[0.98]"
                      >
                        {action.label}
                      </button>
                    </motion.div>
                  );
                })}
              </div>
            ) : (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="flex flex-col items-center justify-center py-16 text-center"
              >
                <div className="w-20 h-20 rounded-full bg-[#ECFDF5] dark:bg-[#064E3B] flex items-center justify-center mb-4">
                  <Search className="w-8 h-8 text-[#065F46] dark:text-[#34D399]" />
                </div>
                <h3 className="text-lg font-bold text-[#065F46] dark:text-white mb-1">
                  {l('No results found', 'Hakuna matokeo')}
                </h3>
                <p className="text-sm text-[#64748B] max-w-xs mb-6">
                  {l(`We couldn't find anything matching "${query}". Try a different search or adjust your filters.`, `Hatukupata chochote kinacholingana na "${query}". Jaribu utafutaji tofauti au rekebisha vichujio vyako.`)}
                </p>
                <div className="flex flex-wrap justify-center gap-2">
                  {['Fabrics', 'Spices', 'Guides'].map(suggestion => (
                    <button
                      key={suggestion}
                      onClick={() => { setQuery(suggestion); performSearch(suggestion); }}
                      className="px-3 py-1.5 rounded-full bg-[#ECFDF5] dark:bg-[#064E3B] text-xs font-medium text-[#065F46] dark:text-[#34D399] hover:shadow-sm transition-all active:scale-95"
                    >
                      {l(`Try "${suggestion}"`, `Jaribu "${suggestion}"`)}
                    </button>
                  ))}
                </div>
              </motion.div>
            )}
          </motion.div>
        )}
      </div>
    </div>
  );
}

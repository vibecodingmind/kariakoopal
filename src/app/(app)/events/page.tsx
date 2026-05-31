'use client';

import { useState } from 'react';
import { useAuthStore } from '@/lib/stores/auth-store';
import { Calendar, MapPin, Lightbulb, Clock, Bell, ChevronRight, Star } from 'lucide-react';
import { motion } from 'framer-motion';

const EVENTS = [
  {
    id: 'e1', title: 'Ramadan Market Rush', titleSw: 'Msako wa Soko wa Ramadhani',
    type: 'religious', startDate: '2026-03-01', endDate: '2026-03-30',
    zones: ['All Zones'], description: 'The busiest season in Kariakoo. Wholesale prices drop 15-30% as merchants stock up for Eid celebrations. Best time for bulk purchases across all categories.',
    descriptionSw: 'Msimu wa shughuli nyingi zaidi Kariakoo. Bei za jumla zinashuka 15-30% wakamiishaji wanajipanga kwa sherehe za Eid. Wakati bora kwa ununuzi wa jumla katika makundi yote.',
    tip: 'Best time for wholesale deals before Eid. Go early morning (6-7am) for first pick.', tipSw: 'Wakati bora kwa mikataba ya jumla kabla ya Eid. Nenda asubuhi (6-7am) kwa chaguo la kwanza.',
  },
  {
    id: 'e2', title: 'Eid al-Fitr Celebration', titleSw: 'Sherehe ya Eid al-Fitr',
    type: 'religious', startDate: '2026-04-01', endDate: '2026-04-01',
    zones: ['All Zones'], description: 'Kariakoo transforms into a vibrant celebration. Special fabrics, gifts, and food items flood the market. Prices peak on the last 3 days before Eid.',
    descriptionSw: 'Kariakoo inageuka kuwa sherehe ya kupendeza. Nguo maalum, zawadi na vyakula vinafurisha soko. Bei zinakwisha siku 3 za mwisho kabla ya Eid.',
    tip: 'Fabrics sell out by noon — go early! Book a guide 2 weeks in advance.', tipSw: 'Nguo zinauzika kabla ya adhuhuri — nenda mapema! Hudi mwongozo wiki 2 kabla.',
  },
  {
    id: 'e3', title: 'Kariakoo Fabric Festival', titleSw: 'Tamasha la Vitenge la Kariakoo',
    type: 'cultural', startDate: '2026-06-15', endDate: '2026-06-17',
    zones: ['Fabrics Zone'], description: 'Annual celebration of East African textile artistry. Live kitenge printing demonstrations, fashion shows, and exclusive festival-only deals on premium fabrics.',
    descriptionSw: 'Sherehe ya kila mwaka ya sanaa ya nguo ya Afrika Mashariki. Maonyesho ya uchapishaji wa kitenge moja kwa moja, maonyesho ya mitindo na mikataba maalum ya tamasha kwa nguo za hali ya juu.',
    tip: 'Hand-drawn kitenge demos by master artisans. Don\'t miss the fashion show on Day 2!', tipSw: 'Maonyesho ya kitenge ya mkono na mafundi bora. Usikose maonyesho ya mitindo Siku ya 2!',
  },
  {
    id: 'e4', title: 'Harvest Season Opening', titleSw: 'Funguo la Msimu wa mavuno',
    type: 'seasonal', startDate: '2026-08-01', endDate: '2026-08-31',
    zones: ['Spices Zone', 'Wholesale Zone'], description: 'Fresh spice imports from Zanzibar and southern Tanzania arrive. Rice and grain harvests bring wholesale prices to annual lows. Best time for pantry stocking.',
    descriptionSw: 'Uagizaji wa viungo safi kutoka Zanzibar na Tanzania kusini unafika. Mavuno ya mchele na nafaka yanaleta bei za jumla hadi chini ya kila mwaka. Wakati bora kwa kujaza jikoni.',
    tip: 'Fresh spice imports from Zanzibar arrive. Buy turmeric and cardamom now before prices rise.', tipSw: 'Viungo safi kutoka Zanzibar vinafika. Nunua haldi na iliki sasa kabla bei haijapanda.',
  },
  {
    id: 'e5', title: 'Back to School Rush', titleSw: 'Msako wa Kurudi Shuleni',
    type: 'commercial', startDate: '2026-01-05', endDate: '2026-01-20',
    zones: ['Electronics Zone', 'Wholesale Zone'], description: 'The annual back-to-school shopping surge. Electronics stalls offer student discounts on calculators and tablets. Stationery and school supply bundles at wholesale prices.',
    descriptionSw: 'Mwendo wa kila mwaka wa ununuzi wa kurudi shuleni. Maduka ya elektroniki yanatoa punguzo kwa wanafunzi kwa vikokotozi na vidonge. Vifaa vya shule kwa bei za jumla.',
    tip: 'Best prices on school supplies. Buy calculators and tablets in the first week for 20% off.', tipSw: 'Bei bora kwa vifaa vya shule. Nunua vikokotozi na vidonge wiki ya kwanza kwa punguzo la 20%.',
  },
  {
    id: 'e6', title: 'Diwali Market', titleSw: 'Soko la Diwali',
    type: 'cultural', startDate: '2026-10-20', endDate: '2026-10-25',
    zones: ['Fabrics Zone', 'Kitchenware Zone'], description: 'Indian textile imports hit peak availability with exclusive festival designs. Kitchenware stalls feature copper and brass items at special Diwali prices. A unique cultural shopping experience.',
    descriptionSw: 'Uagizaji wa nguo za Kihindi unafika kilele na muundo maalum wa tamasha. Maduka ya chombo ya jikoni yana vitu vya shaba na konste kwa bei maalum za Diwali. Uzoefu wa kipekee wa ununuzi wa kitamaduni.',
    tip: 'Indian textile imports at wholesale prices. Look for the special Diwali collection at Stall B-12.', tipSw: 'Nguo za Kihindi kwa bei za jumla. Tafuta mkusanyiko maalum wa Diwali kwenye Duka B-12.',
  },
];

const TYPE_COLORS: Record<string, string> = { religious: '#0891B2', cultural: '#7C3AED', seasonal: '#F59E0B', commercial: '#14B8A6' };
const CATEGORIES = ['All', 'Cultural', 'Religious', 'Seasonal', 'Commercial'];
const TYPE_MAP: Record<number, string> = { 1: 'cultural', 2: 'religious', 3: 'seasonal', 4: 'commercial' };

export default function EventsPage() {
  const { language } = useAuthStore();
  const sw = language === 'sw';
  const [activeCategory, setActiveCategory] = useState(0);
  const [reminders, setReminders] = useState<string[]>([]);

  const l = (en: string, swText: string) => (sw ? swText : en);

  const filtered = EVENTS.filter(e => {
    if (activeCategory === 0) return true;
    return e.type === TYPE_MAP[activeCategory];
  });

  const toggleReminder = (id: string) => {
    setReminders(prev => prev.includes(id) ? prev.filter(r => r !== id) : [...prev, id]);
  };

  return (
    <div className="px-4 py-4 space-y-5">
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-2xl font-bold text-[#312E81] dark:text-[#818CF8]">{l('Kariakoo Events', 'Matukio ya Kariakoo')}</h1>
        <p className="text-sm text-[#78716C] mt-1">{l('Seasonal, cultural & commercial events in the market', 'Matukio ya msimu, kitamaduni na kibiashara sokoni')}</p>
      </motion.div>

      {/* Category Chips */}
      <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
        {CATEGORIES.map((cat, i) => (
          <button key={cat} onClick={() => setActiveCategory(i)} className={`ktag whitespace-nowrap ${activeCategory === i ? 'ktag-active' : 'ktag-inactive'}`}>{cat}</button>
        ))}
      </div>

      {/* Events List */}
      <div className="space-y-4">
        {filtered.map((event, i) => (
          <motion.div
            key={event.id}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            className="kcard overflow-hidden"
          >
            {/* Color Bar */}
            <div className="h-1.5" style={{ background: TYPE_COLORS[event.type] }} />

            <div className="p-4">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="kbadge text-[8px]" style={{ background: TYPE_COLORS[event.type] + '15', color: TYPE_COLORS[event.type] }}>
                      {event.type}
                    </span>
                  </div>
                  <h3 className="font-bold text-base">{sw ? event.titleSw : event.title}</h3>
                  <div className="flex items-center gap-3 mt-1.5 text-xs text-[#78716C]">
                    <span className="flex items-center gap-1"><Calendar className="w-3 h-3" />{event.startDate}{event.endDate && event.endDate !== event.startDate ? ` — ${event.endDate}` : ''}</span>
                  </div>
                  <div className="flex items-center gap-1 mt-1 flex-wrap">
                    {event.zones.map(z => (
                      <span key={z} className="text-[10px] text-[#3730A3] bg-[#E0E7FF] px-1.5 py-0.5 rounded">{z}</span>
                    ))}
                  </div>
                </div>
                <button
                  onClick={() => toggleReminder(event.id)}
                  className={`p-2 rounded-lg transition-colors ${reminders.includes(event.id) ? 'bg-[#3730A3] text-white' : 'bg-[#F5F5F4] dark:bg-[#242244] text-[#78716C]'}`}
                >
                  <Bell className="w-4 h-4" />
                </button>
              </div>

              <p className="text-sm text-[#78716C] mt-3 leading-relaxed">{sw ? event.descriptionSw : event.description}</p>

              {/* Insider Tip */}
              <div className="mt-3 p-3 rounded-lg bg-[#D97706]/10 border border-[#D97706]/20">
                <p className="text-xs font-medium text-[#0A4D3A] dark:text-[#818CF8] flex items-start gap-1.5">
                  <Lightbulb className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                  <span>{l('Insider Tip', 'Ushauri wa Ndani')}: {sw ? event.tipSw : event.tip}</span>
                </p>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {reminders.length > 0 && (
        <div className="kcard-green p-4 text-center">
          <Bell className="w-6 h-6 text-[#D97706] mx-auto mb-2" />
          <p className="text-sm font-medium text-white">{reminders.length} {l('reminders set', 'vikumbusho vimewekwa')}</p>
          <p className="text-xs text-white/60 mt-1">{l('You\'ll be notified before each event', 'Utaarifiwa kabla ya kila tukio')}</p>
        </div>
      )}
    </div>
  );
}

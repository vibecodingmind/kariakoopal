'use client';

import { useState, useMemo } from 'react';
import { useAuthStore } from '@/lib/stores/auth-store';
import { Calendar, MapPin, Lightbulb, Clock, Bell, ChevronRight, Star, Download, ChevronLeft, Plus, X, Sparkles, Sun, CloudRain, Thermometer } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const EVENTS = [
  {
    id: 'e1', title: 'Ramadan Market Rush', titleSw: 'Msako wa Soko wa Ramadhani',
    type: 'religious', startDate: '2026-03-01', endDate: '2026-03-30',
    zones: ['All Zones'], price: 'Free', time: '6:00 AM - 8:00 PM',
    description: 'The busiest season in Kariakoo. Wholesale prices drop 15-30% as merchants stock up for Eid celebrations. Best time for bulk purchases across all categories.',
    descriptionSw: 'Msimu wa shughuli nyingi zaidi Kariakoo. Bei za jumla zinashuka 15-30% wakamiishaji wanajipanga kwa sherehe za Eid. Wakati bora kwa ununuzi wa jumla katika makundi yote.',
    tip: 'Best time for wholesale deals before Eid. Go early morning (6-7am) for first pick.', tipSw: 'Wakati bora kwa mikataba ya jumla kabla ya Eid. Nenda asubuhi (6-7am) kwa chaguo la kwanza.',
  },
  {
    id: 'e2', title: 'Eid al-Fitr Celebration', titleSw: 'Sherehe ya Eid al-Fitr',
    type: 'religious', startDate: '2026-04-01', endDate: '2026-04-01',
    zones: ['All Zones'], price: 'Free', time: 'All Day',
    description: 'Kariakoo transforms into a vibrant celebration. Special fabrics, gifts, and food items flood the market. Prices peak on the last 3 days before Eid.',
    descriptionSw: 'Kariakoo inageuka kuwa sherehe ya kupendeza. Nguo maalum, zawadi na vyakula vinafurisha soko. Bei zinakwisha siku 3 za mwisho kabla ya Eid.',
    tip: 'Fabrics sell out by noon — go early! Book a guide 2 weeks in advance.', tipSw: 'Nguo zinauzika kabla ya adhuhuri — nenda mapema! Hudi mwongozo wiki 2 kabla.',
  },
  {
    id: 'e3', title: 'Kariakoo Fabric Festival', titleSw: 'Tamasha la Vitenge la Kariakoo',
    type: 'cultural', startDate: '2026-06-15', endDate: '2026-06-17',
    zones: ['Fabrics Zone'], price: 'TZS 5,000', time: '9:00 AM - 6:00 PM',
    description: 'Annual celebration of East African textile artistry. Live kitenge printing demonstrations, fashion shows, and exclusive festival-only deals on premium fabrics.',
    descriptionSw: 'Sherehe ya kila mwaka ya sanaa ya nguo ya Afrika Mashariki. Maonyesho ya uchapishaji wa kitenge moja kwa moja, maonyesho ya mitindo na mikataba maalum ya tamasha kwa nguo za hali ya juu.',
    tip: 'Hand-drawn kitenge demos by master artisans. Don\'t miss the fashion show on Day 2!', tipSw: 'Maonyesho ya kitenge ya mkono na mafundi bora. Usikose maonyesho ya mitindo Siku ya 2!',
  },
  {
    id: 'e4', title: 'Harvest Season Opening', titleSw: 'Funguo la Msimu wa mavuno',
    type: 'seasonal', startDate: '2026-08-01', endDate: '2026-08-31',
    zones: ['Spices Zone', 'Wholesale Zone'], price: 'Free', time: 'Dawn to Dusk',
    description: 'Fresh spice imports from Zanzibar and southern Tanzania arrive. Rice and grain harvests bring wholesale prices to annual lows. Best time for pantry stocking.',
    descriptionSw: 'Uagizaji wa viungo safi kutoka Zanzibar na Tanzania kusini unafika. Mavuno ya mchele na nafaka yanaleta bei za jumla hadi chini ya kila mwaka. Wakati bora kwa kujaza jikoni.',
    tip: 'Fresh spice imports from Zanzibar arrive. Buy turmeric and cardamom now before prices rise.', tipSw: 'Viungo safi kutoka Zanzibar vinafika. Nunua haldi na iliki sasa kabla bei haijapanda.',
  },
  {
    id: 'e5', title: 'Back to School Rush', titleSw: 'Msako wa Kurudi Shuleni',
    type: 'commercial', startDate: '2026-01-05', endDate: '2026-01-20',
    zones: ['Electronics Zone', 'Wholesale Zone'], price: 'Free', time: '8:00 AM - 7:00 PM',
    description: 'The annual back-to-school shopping surge. Electronics stalls offer student discounts on calculators and tablets. Stationery and school supply bundles at wholesale prices.',
    descriptionSw: 'Mwendo wa kila mwaka wa ununuzi wa kurudi shuleni. Maduka ya elektroniki yanatoa punguzo kwa wanafunzi kwa vikokotozi na vidonge. Vifaa vya shule kwa bei za jumla.',
    tip: 'Best prices on school supplies. Buy calculators and tablets in the first week for 20% off.', tipSw: 'Bei bora kwa vifaa vya shule. Nunua vikokotozi na vidonge wiki ya kwanza kwa punguzo la 20%.',
  },
  {
    id: 'e6', title: 'Diwali Market', titleSw: 'Soko la Diwali',
    type: 'cultural', startDate: '2026-10-20', endDate: '2026-10-25',
    zones: ['Fabrics Zone', 'Kitchenware Zone'], price: 'Free', time: '9:00 AM - 9:00 PM',
    description: 'Indian textile imports hit peak availability with exclusive festival designs. Kitchenware stalls feature copper and brass items at special Diwali prices.',
    descriptionSw: 'Uagizaji wa nguo za Kihindi unafika kilele na muundo maalum wa tamasha. Maduka ya chombo ya jikoni yana vitu vya shaba na konste kwa bei maalum za Diwali.',
    tip: 'Indian textile imports at wholesale prices. Look for the special Diwali collection at Stall B-12.', tipSw: 'Nguo za Kihindi kwa bei za jumla. Tafuta mkusanyiko maalum wa Diwali kwenye Duka B-12.',
  },
  {
    id: 'e7', title: 'Kariakoo Cultural Festival', titleSw: 'Tamasha la Kitamaduni la Kariakoo',
    type: 'cultural', startDate: '2026-07-04', endDate: '2026-07-06',
    zones: ['All Zones'], price: 'TZS 10,000', time: '10:00 AM - 10:00 PM',
    description: 'Three-day celebration of Kariakoo\'s multicultural heritage. Live music, traditional dance performances, food courts featuring cuisine from across East Africa, and artisan workshops.',
    descriptionSw: 'Sherehe ya siku tatu ya urithi wa utamaduni wa Kariakoo. Muziki moja kwa moja, maonyesho ya ngoma za jadi, vyakula kutoka Afrika Mashariki, na warsha za mafundi.',
    tip: 'The food court on Day 2 features the famous Zanzibar Pilau competition. Arrive hungry!', tipSw: 'Chakula cha Siku ya 2 kina shindano la Pilau ya Zanzibar. Fika na njaa!',
  },
  {
    id: 'e8', title: 'Sauti za Kariakoo Music Night', titleSw: 'Usiku wa Muziki wa Sauti za Kariakoo',
    type: 'cultural', startDate: '2026-09-12', endDate: '2026-09-12',
    zones: ['Food Court'], price: 'TZS 15,000', time: '6:00 PM - Midnight',
    description: 'Monthly live music event featuring Taarab, Bongo Flava, and traditional Tanzanian music. Local food vendors and artisan market accompany the performances.',
    descriptionSw: 'Tukio la muziki moja kwa moja la kila mwezi likiwa na Taarab, Bongo Flava, na muziki wa jadi wa Tanzania. Wauzaji wa chakula cha ndani na soko la mafundi.',
    tip: 'Bring cash for food vendors — most don\'t accept mobile money during events.', tipSw: 'leta pesa taslimu kwa wauzaji wa chakula — wengi hawakubali pesa ya simu wakati wa matukio.',
  },
];

const TYPE_COLORS: Record<string, string> = { religious: '#0891B2', cultural: '#7C3AED', seasonal: '#F59E0B', commercial: '#14B8A6' };
const TYPE_LABELS: Record<string, { en: string; sw: string }> = {
  religious: { en: 'Religious', sw: 'Kidini' },
  cultural: { en: 'Cultural', sw: 'Kitamaduni' },
  seasonal: { en: 'Seasonal', sw: 'Msimu' },
  commercial: { en: 'Commercial', sw: 'Kibiashara' },
};
const CATEGORIES = ['All', 'Cultural', 'Religious', 'Seasonal', 'Commercial'];
const TYPE_MAP: Record<number, string> = { 1: 'cultural', 2: 'religious', 3: 'seasonal', 4: 'commercial' };

const WEATHER = { temp: 29, condition: 'Partly Cloudy', humidity: 72, icon: Sun };

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

export default function EventsPage() {
  const { language } = useAuthStore();
  const sw = language === 'sw';
  const l = (en: string, swText: string) => (sw ? swText : en);

  const [activeCategory, setActiveCategory] = useState(0);
  const [reminders, setReminders] = useState<string[]>([]);
  const [viewMode, setViewMode] = useState<'list' | 'calendar'>('list');
  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth());
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());
  const [selectedEvent, setSelectedEvent] = useState<typeof EVENTS[0] | null>(null);

  const filtered = EVENTS.filter(e => {
    if (activeCategory === 0) return true;
    return e.type === TYPE_MAP[activeCategory];
  });

  const toggleReminder = (id: string) => {
    setReminders(prev => prev.includes(id) ? prev.filter(r => r !== id) : [...prev, id]);
  };

  const getEventsForDate = (day: number) => {
    const dateStr = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    return EVENTS.filter(e => {
      const start = new Date(e.startDate);
      const end = new Date(e.endDate);
      const check = new Date(dateStr);
      return check >= start && check <= end;
    });
  };

  const calendarDays = useMemo(() => {
    const firstDay = new Date(currentYear, currentMonth, 1).getDay();
    const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
    const days: (number | null)[] = [];
    for (let i = 0; i < firstDay; i++) days.push(null);
    for (let i = 1; i <= daysInMonth; i++) days.push(i);
    return days;
  }, [currentMonth, currentYear]);

  const downloadICS = (event: typeof EVENTS[0]) => {
    const start = event.startDate.replace(/-/g, '');
    const end = (event.endDate || event.startDate).replace(/-/g, '');
    const ics = `BEGIN:VCALENDAR\nVERSION:2.0\nBEGIN:VEVENT\nDTSTART:${start}\nDTEND:${end}\nSUMMARY:${sw ? event.titleSw : event.title}\nDESCRIPTION:${sw ? event.descriptionSw : event.description}\nLOCATION:Kariakoo Market, Dar es Salaam, Tanzania\nEND:VEVENT\nEND:VCALENDAR`;
    const blob = new Blob([ics], { type: 'text/calendar' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${event.title.toLowerCase().replace(/\s+/g, '-')}.ics`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="px-4 py-4 space-y-5">
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-2xl font-bold text-[#065F46] dark:text-[#34D399]">{l('Cultural Calendar', 'Kalenda ya Kitamaduni')}</h1>
        <p className="text-sm text-[#64748B] mt-1">{l('Seasonal, cultural & commercial events in Kariakoo', 'Matukio ya msimu, kitamaduni na kibiashara Kariakoo')}</p>
      </motion.div>

      {/* Weather Widget */}
      <div className="kcard p-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <WEATHER.icon className="w-8 h-8 text-[#F59E0B]" />
          <div>
            <p className="text-sm font-bold">{l('Dar es Salaam', 'Dar es Salaam')}</p>
            <p className="text-xs text-[#64748B]">{WEATHER.condition} · {WEATHER.humidity}% humidity</p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-xl font-bold">{WEATHER.temp}°C</p>
          <p className="text-[10px] text-[#64748B]">{l('Market weather', 'Hali ya hewa sokoni')}</p>
        </div>
      </div>

      {/* View Toggle */}
      <div className="flex gap-1 p-1 bg-[#F1F5F9] dark:bg-[#1E293B] rounded-xl">
        <button onClick={() => setViewMode('list')} className={`flex-1 py-2 rounded-lg text-xs font-semibold transition-colors ${viewMode === 'list' ? 'bg-white dark:bg-[#0F172A] shadow-sm text-[#065F46] dark:text-[#34D399]' : 'text-[#64748B]'}`}>{l('List View', 'Maoni ya Orodha')}</button>
        <button onClick={() => setViewMode('calendar')} className={`flex-1 py-2 rounded-lg text-xs font-semibold transition-colors ${viewMode === 'calendar' ? 'bg-white dark:bg-[#0F172A] shadow-sm text-[#065F46] dark:text-[#34D399]' : 'text-[#64748B]'}`}>{l('Calendar', 'Kalenda')}</button>
      </div>

      {/* Category Chips */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        {CATEGORIES.map((cat, i) => (
          <button key={cat} onClick={() => setActiveCategory(i)} className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors ${activeCategory === i ? 'bg-[#065F46] text-white' : 'bg-[#F1F5F9] dark:bg-[#1E293B] text-[#64748B]'}`}>{cat}</button>
        ))}
      </div>

      {/* Calendar View */}
      {viewMode === 'calendar' && (
        <div className="kcard p-4">
          <div className="flex items-center justify-between mb-4">
            <button onClick={() => { if (currentMonth === 0) { setCurrentMonth(11); setCurrentYear(y => y - 1); } else setCurrentMonth(m => m - 1); }} className="w-8 h-8 rounded-full hover:bg-[#F1F5F9] dark:hover:bg-[#1E293B] flex items-center justify-center"><ChevronLeft className="w-4 h-4" /></button>
            <h3 className="font-bold text-sm">{MONTHS[currentMonth]} {currentYear}</h3>
            <button onClick={() => { if (currentMonth === 11) { setCurrentMonth(0); setCurrentYear(y => y + 1); } else setCurrentMonth(m => m + 1); }} className="w-8 h-8 rounded-full hover:bg-[#F1F5F9] dark:hover:bg-[#1E293B] flex items-center justify-center"><ChevronRight className="w-4 h-4" /></button>
          </div>
          <div className="grid grid-cols-7 gap-1">
            {DAYS.map(d => <div key={d} className="text-center text-[10px] font-semibold text-[#64748B] py-1">{d}</div>)}
            {calendarDays.map((day, i) => {
              const dayEvents = day ? getEventsForDate(day) : [];
              const isToday = day === new Date().getDate() && currentMonth === new Date().getMonth() && currentYear === new Date().getFullYear();
              return (
                <div key={i} className={`aspect-square rounded-lg flex flex-col items-center justify-center text-xs relative cursor-pointer transition-colors ${day ? 'hover:bg-[#F1F5F9] dark:hover:bg-[#1E293B]' : ''} ${isToday ? 'bg-[#065F46] text-white hover:bg-[#065F46]' : ''}`} onClick={() => dayEvents.length > 0 && setSelectedEvent(dayEvents[0])}>
                  {day && <span className="font-medium">{day}</span>}
                  {dayEvents.length > 0 && (
                    <div className="flex gap-0.5 mt-0.5">
                      {dayEvents.slice(0, 3).map((e, j) => <div key={j} className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: TYPE_COLORS[e.type] }} />)}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Seasonal Highlights */}
      <div className="kcard p-4">
        <div className="flex items-center gap-2 mb-3">
          <Sparkles className="w-4 h-4 text-[#F59E0B]" />
          <span className="font-semibold text-sm">{l('Seasonal Highlights', 'Mambo Muhimu ya Msimu')}</span>
        </div>
        <div className="flex gap-2 overflow-x-auto pb-1">
          {[
            { label: l('June: Fabric Festival', 'Juni: Tamasha la Nguo'), color: '#7C3AED' },
            { label: l('August: Spice Season', 'Agosti: Msimu wa Viungo'), color: '#F59E0B' },
            { label: l('October: Diwali Market', 'Oktoba: Soko la Diwali'), color: '#14B8A6' },
          ].map(h => (
            <div key={h.label} className="px-3 py-2 rounded-xl border border-[#E2E8F0] dark:border-[#334155] shrink-0" style={{ borderLeftColor: h.color, borderLeftWidth: 3 }}>
              <p className="text-xs font-medium whitespace-nowrap">{h.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Events List */}
      {viewMode === 'list' && (
        <div className="space-y-4">
          {filtered.map((event, i) => (
            <motion.div key={event.id} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }} className="kcard overflow-hidden">
              <div className="h-1.5" style={{ background: TYPE_COLORS[event.type] }} />
              <div className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase" style={{ backgroundColor: TYPE_COLORS[event.type] + '15', color: TYPE_COLORS[event.type] }}>{TYPE_LABELS[event.type]?.[sw ? 'sw' : 'en'] || event.type}</span>
                      {event.price && <span className="text-[10px] text-[#64748B]">{event.price}</span>}
                    </div>
                    <h3 className="font-bold text-base">{sw ? event.titleSw : event.title}</h3>
                    <div className="flex items-center gap-3 mt-1.5 text-xs text-[#64748B]">
                      <span className="flex items-center gap-1"><Calendar className="w-3 h-3" />{event.startDate}{event.endDate && event.endDate !== event.startDate ? ` — ${event.endDate}` : ''}</span>
                      {event.time && <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{event.time}</span>}
                    </div>
                    <div className="flex items-center gap-1 mt-1 flex-wrap">
                      {event.zones.map(z => (
                        <span key={z} className="text-[10px] text-[#065F46] bg-[#ECFDF5] dark:bg-[#064E3B] dark:text-[#34D399] px-1.5 py-0.5 rounded">{z}</span>
                      ))}
                    </div>
                  </div>
                  <div className="flex flex-col gap-2">
                    <button onClick={() => toggleReminder(event.id)} className={`p-2 rounded-lg transition-colors ${reminders.includes(event.id) ? 'bg-[#065F46] text-white' : 'bg-[#F1F5F9] dark:bg-[#334155] text-[#64748B]'}`}>
                      <Bell className="w-4 h-4" />
                    </button>
                    <button onClick={() => downloadICS(event)} className="p-2 rounded-lg bg-[#F1F5F9] dark:bg-[#334155] text-[#64748B] hover:text-[#065F46] transition-colors">
                      <Download className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                <p className="text-sm text-[#64748B] mt-3 leading-relaxed">{sw ? event.descriptionSw : event.description}</p>
                <div className="mt-3 p-3 rounded-lg bg-[#F59E0B]/10 border border-[#F59E0B]/20">
                  <p className="text-xs font-medium text-[#0A4D3A] dark:text-[#34D399] flex items-start gap-1.5">
                    <Lightbulb className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                    <span>{l('Insider Tip', 'Ushauri wa Ndani')}: {sw ? event.tipSw : event.tip}</span>
                  </p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Reminders Summary */}
      {reminders.length > 0 && (
        <div className="kcard-green p-4 text-center">
          <Bell className="w-6 h-6 text-[#F59E0B] mx-auto mb-2" />
          <p className="text-sm font-medium text-white">{reminders.length} {l('reminders set', 'vikumbusho vimewekwa')}</p>
          <p className="text-xs text-white/60 mt-1">{l('You\'ll be notified before each event', 'Utaarifiwa kabla ya kila tukio')}</p>
        </div>
      )}

      {/* Event Detail Modal */}
      <AnimatePresence>
        {selectedEvent && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 p-4" onClick={() => setSelectedEvent(null)}>
            <motion.div initial={{ y: 100, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 100, opacity: 0 }} className="bg-white dark:bg-[#0F172A] rounded-2xl shadow-2xl w-full max-w-lg max-h-[80vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
              <div className="h-2 rounded-t-2xl" style={{ background: TYPE_COLORS[selectedEvent.type] }} />
              <div className="p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-bold">{sw ? selectedEvent.titleSw : selectedEvent.title}</h2>
                  <button onClick={() => setSelectedEvent(null)} className="w-8 h-8 rounded-full hover:bg-[#F1F5F9] dark:hover:bg-[#1E293B] flex items-center justify-center"><X className="w-4 h-4" /></button>
                </div>
                <div className="flex flex-wrap gap-2">
                  <span className="px-2 py-0.5 rounded-full text-xs font-bold" style={{ backgroundColor: TYPE_COLORS[selectedEvent.type] + '15', color: TYPE_COLORS[selectedEvent.type] }}>{TYPE_LABELS[selectedEvent.type]?.[sw ? 'sw' : 'en']}</span>
                  <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-[#F1F5F9] dark:bg-[#334155] text-[#64748B]">{selectedEvent.time}</span>
                  {selectedEvent.price && <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-[#ECFDF5] dark:bg-[#064E3B] text-[#065F46] dark:text-[#34D399]">{selectedEvent.price}</span>}
                </div>
                <p className="text-sm text-[#64748B] leading-relaxed">{sw ? selectedEvent.descriptionSw : selectedEvent.description}</p>
                <div className="flex items-center gap-1 flex-wrap">
                  {selectedEvent.zones.map(z => <span key={z} className="text-xs text-[#065F46] bg-[#ECFDF5] dark:bg-[#064E3B] dark:text-[#34D399] px-2 py-1 rounded-lg"><MapPin className="w-3 h-3 inline mr-1" />{z}</span>)}
                </div>
                <div className="p-3 rounded-lg bg-[#F59E0B]/10 border border-[#F59E0B]/20">
                  <p className="text-xs font-medium text-[#0A4D3A] dark:text-[#34D399] flex items-start gap-1.5">
                    <Lightbulb className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                    {sw ? selectedEvent.tipSw : selectedEvent.tip}
                  </p>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => { toggleReminder(selectedEvent.id); }} className={`kbtn flex-1 py-2 text-sm flex items-center justify-center gap-1 ${reminders.includes(selectedEvent.id) ? 'kbtn-outline' : ''}`}>
                    <Bell className="w-4 h-4" />{reminders.includes(selectedEvent.id) ? l('Remove Reminder', 'Ondoa Kikumbusho') : l('Set Reminder', 'Weka Kikumbusho')}
                  </button>
                  <button onClick={() => downloadICS(selectedEvent)} className="kbtn-outline py-2 px-3 text-sm flex items-center gap-1"><Download className="w-4 h-4" />{l('Add to Calendar', 'Ongeza kwenye Kalenda')}</button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

'use client';

import { useState } from 'react';
import { useAuthStore } from '@/lib/stores/auth-store';
import { BookOpen, Clock, MapPin, Tag, Volume2, ChevronDown, ChevronUp, PenLine } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const STORIES = [
  {
    id: 's1', title: 'The Art of Kanga Negotiation', titleSw: 'Sanaa ya Kujadili Kanga',
    author: 'Mwanaildi Juma', zone: 'Fabrics Zone', tags: ['Culture', 'Tips'], readTime: 3, hasAudio: true, featured: true,
    excerpt: 'In Kariakoo, buying kanga is not just a transaction — it\'s a dance of words, respect, and cultural understanding.',
    excerptSw: 'Kariakoo, kununua kanga si muamala tu — ni ngoma ya maneno, heshima na uelewa wa kitamaduni.',
    content: 'In Kariakoo, buying kanga is not just a transaction — it\'s a dance of words, respect, and cultural understanding. The first rule: never accept the first price. Vendors expect negotiation and respect buyers who engage in it.\n\nStart by greeting the vendor in Swahili — "Habari za asubuhi" (Good morning) goes a long way. Ask about the meaning of the kanga\'s message (jina), as each pattern carries a proverb or statement. Show genuine interest before discussing price.\n\nThe sweet spot is usually 30-40% below the initial quote for single sets, and up to 50% for bulk orders. Always buy in pairs — a kanga set consists of two pieces, and buying singles marks you as a tourist.',
    contentSw: 'Kariakoo, kununua kanga si muamala tu — ni ngoma ya maneno, heshima na uelewa wa kitamaduni. Sheria ya kwanza: kamati kukubali bei ya kwanza. Wauzaji wanatarajia majadiliano na wanaheshimu wananunua wanaoshiriki.\n\nAnza kwa kusalimia muuzaji kwa Kiswahili — "Habari za asubuhi" inaenda mbali. Uliza kuhusu maana ya ujumbe wa kanga (jina), kwa kuwa kila muundo hubeba methali au kauli. Onyesha riba halisi kabla ya kujadili bei.\n\nKiwango cha ajabu ni kawaida 30-40% chini ya nukuu ya awali kwa seti moja, na hadi 50% kwa maagizo ya jumla. Daima nunua jozi — seti ya kanga ina sehemu mbili.',
  },
  {
    id: 's2', title: 'Hidden Gems of Electronics Alley', titleSw: 'Hazina Zilizofichwa za Barabara ya Elektroniki',
    author: 'Fatma Hassan', zone: 'Electronics Zone', tags: ['Tips'], readTime: 4, hasAudio: false, featured: false,
    excerpt: 'Behind the flashy storefronts of Kariakoo\'s electronics section lies a network of repair masters who can fix almost anything.',
    excerptSw: 'Nyuma ya maduka ya kupendeza ya sehemu ya elektroniki ya Kariakoo kuna mtandao wa mabwana wa urekebishaji ambao wanaweza kurekebisha karibu chochote.',
    content: 'Behind the flashy storefronts of Kariakoo\'s electronics section lies a network of repair masters who can fix almost anything. These technicians, working from tiny stalls no bigger than a closet, possess skills that rival certified service centers — at a fraction of the cost.\n\nThe repair alley runs behind the main row of electronics shops, accessible through narrow passages. Look for stalls with circuit boards hanging from strings — that\'s the universal sign of a repair specialist.\n\nA cracked phone screen that costs 150,000 TZS at an official center can be fixed for 35,000 TZS here. The key is knowing which stalls use original parts versus copies. Ask your guide or look for the "Genuine Parts" certificate that some display.',
    contentSw: 'Nyuma ya maduka ya kupendeza ya sehemu ya elektroniki ya Kariakoo kuna mtandao wa mabwana wa urekebishaji ambao wanaweza kurekebisha karibu chochote. Wateknolojia hawa, wakitoka kwenye maduka madogo zaidi ya kabati, wana ujuzi unaoshindana na vituo vya huduma vilivyoidhinishwa — kwa gharama ndogo.\n\nBarabara ya urekebishaji inaendelea nyuma ya safu kuu ya maduka ya elektroniki, inayopatikana kupitia njia nyembamba. Tafuta maduka yenye bodi za mzunguko zinazotumika kutoka kwenye kamba — hiyo ni ishara ya kimataifa ya mtaalamu wa urekebishaji.',
  },
  {
    id: 's3', title: 'A Brief History of Kariakoo Market', titleSw: 'Historia Fupi ya Soko la Kariakoo',
    author: 'Asha Mohamed', zone: 'All Zones', tags: ['History'], readTime: 5, hasAudio: true, featured: false,
    excerpt: 'From a small trading post in the 19th century to Africa\'s largest open market, Kariakoo\'s story is the story of East African commerce itself.',
    excerptSw: 'Kutoka kituo cha biashara kidogo karne ya 19 hadi soko kubwa zaidi la Afrika, hadithi ya Kariakoo ni hadithi ya biashara ya Afrika Mashariki yenyewe.',
    content: 'From a small trading post in the 19th century to Africa\'s largest open market, Kariakoo\'s story is the story of East African commerce itself. Named after the Carrier Corps (Kariakoo in Swahili) of World War I, the area transformed from a military camp into a bustling commercial hub.\n\nBy the 1920s, Indian and Arab merchants had established permanent shops. The market grew organically, with different zones developing around the specialties of their founding merchants. The electronics zone, for example, began with just three shops selling radios in the 1960s.\n\nToday, Kariakoo handles an estimated 60% of Tanzania\'s wholesale trade, with daily transactions exceeding 2 billion TZS. It remains the beating heart of East African commerce, connecting producers, importers, and retailers across the region.',
    contentSw: 'Kutoka kituo cha biashara kidogo karne ya 19 hadi soko kubwa zaidi la Afrika, hadithi ya Kariakoo ni hadithi ya biashara ya Afrika Mashariki yenyewe. Iliitwa jina la Carrier Corps (Kariakoo kwa Kiswahili) wa Vita vya Kwanza vya Dunia, eneo hilo liligeuka kutoka kambi ya kijeshi kuwa kituo cha biashara kinachoendesha.',
  },
  {
    id: 's4', title: 'Spice Routes: From Zanzibar to Kariakoo', titleSw: 'Njia za Viungo: Kutoka Zanzibar hadi Kariakoo',
    author: 'Juma Ramadhani', zone: 'Spices Zone', tags: ['Culture'], readTime: 3, hasAudio: false, featured: false,
    excerpt: 'The same spice routes that once connected Zanzibar to the world now bring fresh aromas to Kariakoo every morning.',
    excerptSw: 'Njia sawa za viungo ambazo ziliunganisha Zanzibar na dunia sasa zinaleta harufu safi Kariakoo kila asubuhi.',
    content: 'The same spice routes that once connected Zanzibar to the world now bring fresh aromas to Kariakoo every morning. Before dawn, trucks loaded with fresh turmeric, cardamom, and cloves arrive from the Spice Island, continuing a tradition that dates back centuries.\n\nThe spice vendors of Kariakoo are among the most knowledgeable in East Africa. Many are third or fourth generation, inheriting not just their stalls but their connections to specific farms in Zanzibar. This is why the same spice can vary 200% in quality — and price — between stalls just meters apart.\n\nThe insider secret: ask for "vichwa" (heads) when buying cardamom. The green pods with intact heads contain the most oil and flavor.',
    contentSw: 'Njia sawa za viungo ambazo ziliunganisha Zanzibar na dunia sasa zinaleta harufu safi Kariakoo kila asubuhi. Kabla ya alfajiri, malori yaliyopakiwa na haldi, iliki na karafuu safi yanafika kutoka Kisiwa cha Viungo.',
  },
  {
    id: 's5', title: 'The Woman Who Built a Wholesale Empire', titleSw: 'Mwanamke Aliyejenga Dola ya Jumla',
    author: 'Halima Abdi', zone: 'Wholesale Zone', tags: ['People'], readTime: 4, hasAudio: true, featured: false,
    excerpt: 'Mama Sakina started with a single sack of rice. Thirty years later, she controls one of the largest wholesale operations in Kariakoo.',
    excerptSw: 'Mama Sakina alianza na gunia moja la mchele. Miaka thelathini baadaye, anadhibiti moja ya shughuli kubwa za jumla Kariakoo.',
    content: 'Mama Sakina started with a single sack of rice in 1993. Thirty years later, she controls one of the largest wholesale operations in Kariakoo, moving over 500 tonnes of grain monthly. Her story is quintessentially Kariakoo — resilience, relationships, and razor-sharp business instincts.\n\n"I learned everything from my mother," she says from her office above stall C-08. "She taught me that in wholesale, your word is your bond. If you promise delivery on Tuesday, it arrives Tuesday — even if it costs you."\n\nHer clients now span six countries, and she mentors young women entering the wholesale business. "Kariakoo gave me everything," she smiles. "Now I give back."',
    contentSw: 'Mama Sakina alianza na gunia moja la mchele mwaka 1993. Miaka thelathini baadaye, anadhibiti moja ya shughuli kubwa za jumla Kariakoo.',
  },
  {
    id: 's6', title: '5 Things Tourists Always Overpay For', titleSw: 'Vitu 5 Watalii Wanawalipa Zaidi',
    author: 'Said Bakari', zone: 'All Zones', tags: ['Tips'], readTime: 2, hasAudio: false, featured: false,
    excerpt: 'After 500+ guided sessions, these are the items where tourists consistently pay 2-3x the local price.',
    excerptSw: 'Baada ya vipindi 500+, hizi ni bidhaa ambapo watalii mara kwa mara walipa mara 2-3 ya bei ya karibu.',
    content: 'After 500+ guided sessions, these are the items where tourists consistently pay 2-3x the local price: (1) Kanga sets — tourists pay 40,000 TZS vs the 15,000-25,000 fair price. (2) Wooden carvings — the "discounted" 80,000 TZS price should be 20,000-35,000. (3) Spices in tourist packaging — skip the gift boxes and buy from bulk vendors at 60% less. (4) Phone accessories — that 15,000 TZS case costs 3,000-5,000 TZS at the right stall. (5) "Authentic" gemstones — most are glass or low-grade. Only buy from certified dealers.\n\nThe solution is simple: get a local guide, or at least research fair prices on our Price Radar before you shop.',
    contentSw: 'Baada ya vipindi 500+, hizi ni bidhaa ambapo watalii mara kwa mara walipa mara 2-3 ya bei ya karibu.',
  },
];

const TAG_CATEGORIES = ['All', 'Culture', 'Tips', 'History', 'People'];

export default function StoriesPage() {
  const { language } = useAuthStore();
  const sw = language === 'sw';
  const [activeTag, setActiveTag] = useState(0);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const l = (en: string, swText: string) => (sw ? swText : en);

  const filtered = STORIES.filter(s => {
    if (activeTag === 0) return true;
    return s.tags.includes(TAG_CATEGORIES[activeTag]);
  });

  const featured = filtered.find(s => s.featured);

  return (
    <div className="px-4 py-4 space-y-5">
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-2xl font-bold text-[#312E81] dark:text-[#818CF8]">{l('Market Stories', 'Hadithi za Soko')}</h1>
        <p className="text-sm text-[#78716C] mt-1">{l('Local insights, tips & tales from Kariakoo', 'Maoni ya karibu, mapendekezo na hadithi kutoka Kariakoo')}</p>
      </motion.div>

      {/* Category Chips */}
      <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
        {TAG_CATEGORIES.map((tag, i) => (
          <button key={tag} onClick={() => setActiveTag(i)} className={`ktag whitespace-nowrap ${activeTag === i ? 'ktag-active' : 'ktag-inactive'}`}>{tag}</button>
        ))}
      </div>

      {/* Featured Story */}
      {featured && (
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="kcard-green p-5 cursor-pointer" onClick={() => setExpandedId(expandedId === featured.id ? null : featured.id)}>
          <div className="flex items-center gap-2 mb-2">
            <span className="kbadge kbadge-gold">Featured</span>
            {featured.hasAudio && <Volume2 className="w-3.5 h-3.5 text-[#D97706]" />}
          </div>
          <h2 className="text-lg font-bold text-white">{sw ? featured.titleSw : featured.title}</h2>
          <p className="text-xs text-white/60 mt-1 flex items-center gap-3">
            <span className="flex items-center gap-1"><PenLine className="w-3 h-3" />{featured.author}</span>
            <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{featured.readTime} min</span>
            <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{featured.zone}</span>
          </p>
          <p className="text-sm text-white/80 mt-3 leading-relaxed">{sw ? featured.excerptSw : featured.excerpt}</p>
          <AnimatePresence>
            {expandedId === featured.id && (
              <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
                <p className="text-sm text-white/80 mt-3 leading-relaxed whitespace-pre-line">{sw ? featured.contentSw : featured.content}</p>
              </motion.div>
            )}
          </AnimatePresence>
          <div className="flex items-center justify-center mt-3 text-white/50">
            {expandedId === featured.id ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </div>
        </motion.div>
      )}

      {/* Story Cards */}
      <div className="space-y-3">
        {filtered.filter(s => !s.featured).map((story, i) => (
          <motion.div
            key={story.id}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            className="kcard p-4 cursor-pointer"
            onClick={() => setExpandedId(expandedId === story.id ? null : story.id)}
          >
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-lg bg-[#E0E7FF] dark:bg-[#1E1B4B] flex items-center justify-center shrink-0">
                <BookOpen className="w-5 h-5 text-[#3730A3] dark:text-[#818CF8]" />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-0.5">
                  {story.tags.map(tag => <span key={tag} className="kbadge kbadge-verified text-[8px]">{tag}</span>)}
                  {story.hasAudio && <Volume2 className="w-3 h-3 text-[#3730A3]" />}
                </div>
                <h4 className="font-semibold text-sm">{sw ? story.titleSw : story.title}</h4>
                <p className="text-xs text-[#78716C] mt-0.5 flex items-center gap-3">
                  <span>{story.author}</span>
                  <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{story.readTime} min</span>
                </p>
              </div>
            </div>
            <p className="text-sm text-[#78716C] mt-2 leading-relaxed">{sw ? story.excerptSw : story.excerpt}</p>
            <AnimatePresence>
              {expandedId === story.id && (
                <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
                  <p className="text-sm text-[#78716C] mt-2 leading-relaxed whitespace-pre-line">{sw ? story.contentSw : story.content}</p>
                </motion.div>
              )}
            </AnimatePresence>
            <div className="flex items-center justify-center mt-2 text-[#78716C]">
              {expandedId === story.id ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

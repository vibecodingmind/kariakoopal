'use client';

import { useRouter, useParams } from 'next/navigation';
import { useAuthStore } from '@/lib/stores/auth-store';
import {
  ArrowLeft, Star, ShieldCheck, MapPin, Phone, Clock, ThumbsUp,
  QrCode, Navigation, ChevronRight, Store
} from 'lucide-react';
import { motion } from 'framer-motion';

const VENDOR_DATA: Record<string, {
  name: string; zone: string; zoneName: string; zoneColor: string; stall: string;
  categories: string[]; rating: number; recs: number; verified: boolean;
  contact: string; hours: string; bio: string; bioSw: string;
}> = {
  v1: { name: 'Zaki Electronics', zone: 'electronics', zoneName: 'Electronics Zone', zoneColor: '#0891B2', stall: 'A-12', categories: ['Phones', 'Accessories', 'Repairs'], rating: 4.8, recs: 234, verified: true, contact: '+255712001234', hours: '8:00-19:00', bio: 'Family-run electronics shop since 1998. Known for honest pricing and expert phone repairs. All phones come with 30-day warranty.', bioSw: 'Duka la elektroniki la kifamilia tangu 1998. Linajulikana kwa bei ya haki na urekebishaji wa simu wa kitaalamu. Simu zote huja na dhamani ya siku 30.' },
  v2: { name: 'Mama Kanga Shop', zone: 'fabrics', zoneName: 'Fabrics Zone', zoneColor: '#7C3AED', stall: 'B-45', categories: ['Kanga', 'Kitenge', 'Lace'], rating: 4.9, recs: 312, verified: true, contact: '+255716007890', hours: '7:00-18:00', bio: 'The largest kanga collection in Kariakoo. Mama Kanga has been dressing Dar es Salaam for 25 years. Custom printing available for orders of 50+ sets.', bioSw: 'Mkusanyiko mkubwa zaidi wa kanga Kariakoo. Mama Kanga amekuva akiwavalisha Dar es Salaam kwa miaka 25. Uchapishaji maalum unapatikana kwa maagizo ya seti 50+.' },
  v3: { name: 'Al-Falah Wholesale', zone: 'wholesale', zoneName: 'Wholesale Zone', zoneColor: '#14B8A6', stall: 'C-08', categories: ['Rice', 'Oil', 'Sugar', 'Bulk'], rating: 4.7, recs: 267, verified: true, contact: '+255720003456', hours: '6:00-17:00', bio: 'Wholesale specialist with direct connections to importers. Best bulk prices in Kariakoo guaranteed. Free delivery within Dar for orders over 500,000 TZS.', bioSw: 'Mtaalamu wa jumla na mahusiano ya moja kwa moja na waagizaji. Bei bora za jumla Kariakoo zimehakikishwa. Usafirishaji bila malipo ndani ya Dar kwa maagizo zaidi ya TZS 500,000.' },
  v4: { name: 'Spice Paradise', zone: 'spices', zoneName: 'Spices Zone', zoneColor: '#EF4444', stall: 'D-22', categories: ['Spices', 'Herbs', 'Tea'], rating: 4.6, recs: 178, verified: false, contact: '+255722001234', hours: '8:00-17:00', bio: 'Fresh spices sourced directly from Zanzibar and India. Our chai masala blend is the most recommended in the market.', bioSw: 'Viungo safi vinavyotoka moja kwa moja Zanzibar na India. Mchanganyiko wetu wa chai masala unapendekezwa zaidi sokoni.' },
  v5: { name: 'Kitchen World', zone: 'kitchenware', zoneName: 'Kitchenware Zone', zoneColor: '#F59E0B', stall: 'E-15', categories: ['Kitchen', 'Home', 'Cookware'], rating: 4.5, recs: 145, verified: true, contact: '+255724009012', hours: '8:00-18:00', bio: 'Premium kitchenware at fair prices. Stainless steel items with 1-year warranty. Bulk discounts for restaurants and hotels.', bioSw: 'Vifaa vya jikoni vya hali ya juu kwa bei ya haki. Vitu vya stainless steel na dhamana ya mwaka 1. Punguzo la jumla kwa migahawa na hoteli.' },
  v6: { name: 'Craft Masters', zone: 'artisanal', zoneName: 'Artisanal Zone', zoneColor: '#8B5E3C', stall: 'F-08', categories: ['Crafts', 'Carvings', 'Jewelry'], rating: 4.7, recs: 98, verified: true, contact: '+255726007890', hours: '9:00-17:00', bio: 'Third-generation artisans preserving traditional Makonde carving techniques. Every piece is handcrafted with a story.', bioSw: 'Wafundi wa kizazi cha tatu wanaohifadhi mbinu za jadi za uchongaji Makonde. Kila kipande kinatengenezwa kwa mkono chenye hadithi.' },
};

export default function VendorProfilePage() {
  const router = useRouter();
  const params = useParams();
  const { language, isAuthenticated } = useAuthStore();
  const sw = language === 'sw';
  const l = (en: string, swText: string) => (sw ? swText : en);

  const vendorId = params.id as string;
  const vendor = VENDOR_DATA[vendorId];

  if (!vendor) {
    return (
      <div className="px-4 py-8 text-center">
        <p className="text-lg font-semibold text-[#64748B]">{l('Vendor not found', 'Muuzaji hajapatikana')}</p>
        <button onClick={() => router.push('/vendors')} className="kbtn mt-4">{l('Back to Vendors', 'Rudi kwa Wauzaji')}</button>
      </div>
    );
  }

  return (
    <div className="px-4 py-4 space-y-5">
      <motion.div initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }}>
        <button onClick={() => router.push('/vendors')} className="flex items-center gap-1 text-sm text-[#64748B] hover:text-[#0A4D3A]">
          <ArrowLeft className="w-4 h-4" /> {l('Back', 'Rudi')}
        </button>
      </motion.div>

      {/* Vendor Header */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="kcard p-5">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center text-white font-bold text-xl" style={{ background: vendor.zoneColor }}>
            {vendor.name.charAt(0)}
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold">{vendor.name}</h1>
              {vendor.verified && <ShieldCheck className="w-5 h-5 text-[#065F46]" />}
            </div>
            <p className="text-sm text-[#64748B] mt-0.5 flex items-center gap-1"><MapPin className="w-3.5 h-3.5" />{vendor.zoneName} · {l('Stall', 'Duka')} {vendor.stall}</p>
          </div>
        </div>

        {vendor.verified && (
          <div className="mt-4 p-3 rounded-lg bg-[#ECFDF5] dark:bg-[#022C22] flex items-center gap-3">
            <QrCode className="w-8 h-8 text-[#065F46] dark:text-[#34D399]" />
            <div>
              <p className="text-sm font-semibold text-[#065F46] dark:text-[#34D399]">{l('Verified Vendor', 'Muuzaji Aliyethibitishwa')}</p>
              <p className="text-xs text-[#64748B]">{l('Scannable QR code available', 'Nambari ya QR inapatikana')}</p>
            </div>
          </div>
        )}

        <div className="grid grid-cols-3 gap-3 mt-4">
          <div className="text-center p-2 rounded-lg bg-[#F8FAFC] dark:bg-[#334155]">
            <div className="flex items-center justify-center gap-1"><Star className="w-4 h-4 fill-[#F59E0B] text-[#F59E0B]" /><span className="font-bold text-sm">{vendor.rating}</span></div>
            <p className="text-[10px] text-[#64748B] mt-0.5">{l('Rating', 'Alama')}</p>
          </div>
          <div className="text-center p-2 rounded-lg bg-[#F8FAFC] dark:bg-[#334155]">
            <div className="flex items-center justify-center gap-1"><ThumbsUp className="w-4 h-4 text-[#065F46]" /><span className="font-bold text-sm">{vendor.recs}</span></div>
            <p className="text-[10px] text-[#64748B] mt-0.5">{l('Recommend', 'Pendekeza')}</p>
          </div>
          <div className="text-center p-2 rounded-lg bg-[#F8FAFC] dark:bg-[#334155]">
            <div className="flex items-center justify-center gap-1"><Clock className="w-4 h-4 text-[#64748B]" /><span className="font-bold text-xs">{vendor.hours}</span></div>
            <p className="text-[10px] text-[#64748B] mt-0.5">{l('Hours', 'Masaa')}</p>
          </div>
        </div>
      </motion.div>

      {/* Categories */}
      <div className="flex gap-2 flex-wrap">
        {vendor.categories.map(cat => (
          <span key={cat} className="kbadge" style={{ background: vendor.zoneColor + '15', color: vendor.zoneColor }}>{cat}</span>
        ))}
      </div>

      {/* About */}
      <div className="kcard p-5">
        <h3 className="font-semibold text-sm mb-2">{l('About', 'Kuhusu')}</h3>
        <p className="text-sm text-[#64748B] leading-relaxed">{sw ? vendor.bioSw : vendor.bio}</p>
      </div>

      {/* Contact */}
      <div className="kcard p-5">
        <h3 className="font-semibold text-sm mb-3">{l('Contact', 'Mawasiliano')}</h3>
        <div className="flex items-center gap-3">
          <Phone className="w-4 h-4 text-[#065F46]" />
          <span className="text-sm">{vendor.contact}</span>
        </div>
      </div>

      {/* CTA */}
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="kcard-green p-5 text-center">
        <Navigation className="w-8 h-8 text-[#F59E0B] mx-auto mb-2" />
        <h3 className="font-bold text-white">{l('Need Help Finding This Stall?', 'Unahitaji Msaada Wa Kupata Duka Hili?')}</h3>
        <p className="text-sm text-white/70 mt-1">{l('A local guide can navigate you directly here', 'Mwongozo wa karani anaweza kukuelekeza moja kwa moja hapa')}</p>
        <button onClick={() => router.push(isAuthenticated ? '/seeker/find' : '/auth')} className="kbtn-yellow mt-3 text-sm">
          {l('Get a Guide', 'Pata Mwongozo')}
        </button>
      </motion.div>
    </div>
  );
}

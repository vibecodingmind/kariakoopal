// ── Demo Data Fallback ──
// Used when database is unavailable (e.g., Railway without PostgreSQL configured)
// Ensures demo mode always works regardless of database state

import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

// ── Zones ──
export const DEMO_ZONES = [
  { id: 'zone-electronics', name: 'Electronics Zone', nameSw: 'Eneo la Elektroniki', description: 'The tech hub of Kariakoo — phones, accessories, gadgets & expert repairs.', geoBounds: '{}', color: '#0891B2', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  { id: 'zone-fabrics', name: 'Fabrics Zone', nameSw: 'Eneo la Vitenge', description: 'Vibrant textiles — kanga, kitenge, lace, silk & custom tailoring.', geoBounds: '{}', color: '#7C3AED', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  { id: 'zone-wholesale', name: 'Wholesale Zone', nameSw: 'Eneo la Jumla', description: 'Bulk buying paradise — rice, oil, sugar & household supplies by the sack.', geoBounds: '{}', color: '#14B8A6', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  { id: 'zone-spices', name: 'Spices Zone', nameSw: 'Eneo la Viungo', description: 'Aromatic treasures — turmeric, cardamom, cinnamon, cloves & herbal remedies.', geoBounds: '{}', color: '#EF4444', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  { id: 'zone-kitchenware', name: 'Kitchenware Zone', nameSw: 'Eneo la Chombo', description: 'Everything for the kitchen — pots, pans, utensils & home essentials.', geoBounds: '{}', color: '#F59E0B', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  { id: 'zone-artisanal', name: 'Artisanal Zone', nameSw: 'Eneo la Kisanii', description: 'Handcrafted treasures — baskets, carvings, jewelry & traditional crafts.', geoBounds: '{}', color: '#8B5E3C', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
];

// ── Vendors ──
export const DEMO_VENDORS = [
  { id: 'v1', name: 'Zaki Electronics', zoneId: 'zone-electronics', categories: '["Phones","Accessories","Repairs"]', stallNumber: 'A-12', contact: '+255712001234', geoLat: -6.8264, geoLng: 39.2695, approved: true, recommendations: 234, openHours: '8:00-19:00', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  { id: 'v2', name: 'Mama Kanga Shop', zoneId: 'zone-fabrics', categories: '["Kanga","Kitenge","Lace"]', stallNumber: 'B-45', contact: '+255716007890', geoLat: -6.8260, geoLng: 39.2690, approved: true, recommendations: 312, openHours: '7:00-18:00', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  { id: 'v3', name: 'Al-Falah Wholesale', zoneId: 'zone-wholesale', categories: '["Rice","Oil","Sugar","Bulk"]', stallNumber: 'C-08', contact: '+255720003456', geoLat: -6.8270, geoLng: 39.2700, approved: true, recommendations: 267, openHours: '6:00-17:00', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  { id: 'v4', name: 'Spice Paradise', zoneId: 'zone-spices', categories: '["Spices","Herbs","Tea"]', stallNumber: 'D-22', contact: '+255722001234', geoLat: -6.8258, geoLng: 39.2688, approved: true, recommendations: 178, openHours: '8:00-17:00', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  { id: 'v5', name: 'Kitchen World', zoneId: 'zone-kitchenware', categories: '["Kitchen","Home","Cookware"]', stallNumber: 'E-15', contact: '+255724009012', geoLat: -6.8255, geoLng: 39.2705, approved: true, recommendations: 145, openHours: '8:00-18:00', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  { id: 'v6', name: 'Craft Masters', zoneId: 'zone-artisanal', categories: '["Crafts","Carvings","Jewelry"]', stallNumber: 'F-08', contact: '+255726007890', geoLat: -6.8272, geoLng: 39.2710, approved: true, recommendations: 98, openHours: '9:00-17:00', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
];

// ── Guides (as Users with GuideProfiles) ──
export const DEMO_GUIDES = [
  {
    user: { id: 'demo-guide-1', phone: '+255712000001', name: 'Hamisi Juma', role: 'guide', languagePref: 'en', email: 'hamisi@demo.com', avatarUrl: null, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
    guideProfile: { id: 'gp-demo-1', userId: 'demo-guide-1', bio: 'Experienced Kariakoo guide specializing in Electronics and Fabrics zones. 5+ years of market navigation.', status: 'active', zones: ['zone-electronics', 'zone-fabrics'], languages: ['sw', 'en'], avgRating: 4.8, totalSessions: 156, isOnline: true, currentStatus: 'online', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  },
  {
    user: { id: 'demo-guide-2', phone: '+255714000001', name: 'Fatma Hassan', role: 'guide', languagePref: 'sw', email: 'fatma@demo.com', avatarUrl: null, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
    guideProfile: { id: 'gp-demo-2', userId: 'demo-guide-2', bio: 'Fabrics specialist with deep connections to Kariakoo textile merchants. Known for finding the best kanga deals.', status: 'active', zones: ['zone-fabrics'], languages: ['sw', 'en'], avgRating: 4.7, totalSessions: 98, isOnline: true, currentStatus: 'online', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  },
  {
    user: { id: 'demo-guide-3', phone: '+255716000001', name: 'Asha Mohamed', role: 'guide', languagePref: 'en', email: 'asha@demo.com', avatarUrl: null, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
    guideProfile: { id: 'gp-demo-3', userId: 'demo-guide-3', bio: 'Wholesale specialist who knows every bulk dealer in Kariakoo. Best prices guaranteed.', status: 'active', zones: ['zone-wholesale'], languages: ['sw', 'en'], avgRating: 4.9, totalSessions: 210, isOnline: true, currentStatus: 'online', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  },
  {
    user: { id: 'demo-guide-4', phone: '+255717000001', name: 'Mwanaildi Juma', role: 'guide', languagePref: 'sw', email: 'mwanaildi@demo.com', avatarUrl: null, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
    guideProfile: { id: 'gp-demo-4', userId: 'demo-guide-4', bio: 'Spice market expert with deep knowledge of Zanzibar imports. Can identify quality by smell alone.', status: 'active', zones: ['zone-spices', 'zone-wholesale'], languages: ['sw', 'en'], avgRating: 4.6, totalSessions: 87, isOnline: false, currentStatus: 'offline', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  },
  {
    user: { id: 'demo-guide-5', phone: '+255718000001', name: 'Halima Abdi', role: 'guide', languagePref: 'sw', email: 'halima@demo.com', avatarUrl: null, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
    guideProfile: { id: 'gp-demo-5', userId: 'demo-guide-5', bio: 'Kitchenware pro who helps families furnish their homes at the best prices. Patient and thorough.', status: 'active', zones: ['zone-kitchenware'], languages: ['sw', 'en'], avgRating: 4.7, totalSessions: 134, isOnline: true, currentStatus: 'online', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  },
];

// ── Price Radar ──
export const DEMO_PRICES = [
  { id: 'pr1', category: 'Electronics', zoneId: 'zone-electronics', priceMin: 450000, priceMax: 550000, updatedAt: new Date().toISOString(), updatedBy: 'admin' },
  { id: 'pr2', category: 'Electronics', zoneId: 'zone-electronics', priceMin: 2800000, priceMax: 3200000, updatedAt: new Date().toISOString(), updatedBy: 'admin' },
  { id: 'pr3', category: 'Electronics', zoneId: 'zone-electronics', priceMin: 25000, priceMax: 40000, updatedAt: new Date().toISOString(), updatedBy: 'guide' },
  { id: 'pr4', category: 'Fabrics', zoneId: 'zone-fabrics', priceMin: 15000, priceMax: 25000, updatedAt: new Date().toISOString(), updatedBy: 'admin' },
  { id: 'pr5', category: 'Fabrics', zoneId: 'zone-fabrics', priceMin: 35000, priceMax: 55000, updatedAt: new Date().toISOString(), updatedBy: 'admin' },
  { id: 'pr6', category: 'Wholesale', zoneId: 'zone-wholesale', priceMin: 65000, priceMax: 80000, updatedAt: new Date().toISOString(), updatedBy: 'admin' },
  { id: 'pr7', category: 'Wholesale', zoneId: 'zone-wholesale', priceMin: 58000, priceMax: 68000, updatedAt: new Date().toISOString(), updatedBy: 'guide' },
  { id: 'pr8', category: 'Spices', zoneId: 'zone-spices', priceMin: 8000, priceMax: 12000, updatedAt: new Date().toISOString(), updatedBy: 'admin' },
  { id: 'pr9', category: 'Spices', zoneId: 'zone-spices', priceMin: 5000, priceMax: 8000, updatedAt: new Date().toISOString(), updatedBy: 'admin' },
  { id: 'pr10', category: 'Kitchenware', zoneId: 'zone-kitchenware', priceMin: 45000, priceMax: 65000, updatedAt: new Date().toISOString(), updatedBy: 'admin' },
  { id: 'pr11', category: 'Artisanal', zoneId: 'zone-artisanal', priceMin: 12000, priceMax: 20000, updatedAt: new Date().toISOString(), updatedBy: 'guide' },
];

// ── Seasonal Events ──
export const DEMO_EVENTS = [
  { id: 'se1', title: 'Ramadan Market Rush', titleSw: 'Msako wa Soko wa Ramadhani', description: 'The biggest shopping season in Kariakoo. Wholesale prices drop as merchants compete for Eid shoppers.', type: 'religious', startDate: '2026-03-01T00:00:00.000Z', endDate: '2026-03-30T00:00:00.000Z', affectedZones: '["zone-electronics","zone-fabrics","zone-wholesale","zone-spices"]', insiderTip: 'Best time for wholesale deals before Eid. Go early morning (6-7am) for first pick.', insiderTipSw: 'Wakati bora kwa mikataba ya jumla kabla ya Eid. Nenda asubuhi (6-7am) kwa chaguo la kwanza.', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  { id: 'se2', title: 'Kariakoo Fabric Festival', titleSw: 'Tamasha la Vitenge la Kariakoo', description: 'Annual celebration of East African textile art. Live demos, fashion shows, and exclusive fabric drops.', type: 'cultural', startDate: '2026-06-15T00:00:00.000Z', endDate: '2026-06-17T00:00:00.000Z', affectedZones: '["zone-fabrics"]', insiderTip: 'Hand-drawn kitenge demos by master artisans. Don\'t miss the fashion show on Day 2!', insiderTipSw: 'Maonyesho ya kitenge ya mkono na mafundi bora. Usikose maonyesho ya mitindo Siku ya 2!', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  { id: 'se3', title: 'Harvest Season Opening', titleSw: 'Funguo la Msimu wa Mavuno', description: 'Fresh produce and spices flood the market. Best prices of the year on turmeric, rice, and cooking oil.', type: 'seasonal', startDate: '2026-08-01T00:00:00.000Z', endDate: '2026-08-31T00:00:00.000Z', affectedZones: '["zone-spices","zone-wholesale"]', insiderTip: 'Fresh spice imports from Zanzibar arrive. Buy turmeric and cardamom now before prices rise.', insiderTipSw: 'Viungo safi kutoka Zanzibar vinafika. Nunua haldi na iliki sasa kabla bei haijapanda.', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  { id: 'se4', title: 'Diwali Market', titleSw: 'Soko la Diwali', description: 'Indian textile imports and kitchenware at wholesale prices. Special Diwali collections available.', type: 'cultural', startDate: '2026-10-20T00:00:00.000Z', endDate: '2026-10-25T00:00:00.000Z', affectedZones: '["zone-fabrics","zone-kitchenware"]', insiderTip: 'Indian textile imports at wholesale prices. Look for the special Diwali collection at Stall B-12.', insiderTipSw: 'Nguo za Kihindi kwa bei za jumla. Tafuta mkusanyiko maalum wa Diwali kwenye Duka B-12.', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
];

// ── Exchange Rates ──
export const DEMO_EXCHANGE_RATES = [
  { id: 'er1', currency: 'USD', rate: 2580, updatedAt: new Date().toISOString() },
  { id: 'er2', currency: 'EUR', rate: 2800, updatedAt: new Date().toISOString() },
  { id: 'er3', currency: 'KES', rate: 17.8, updatedAt: new Date().toISOString() },
  { id: 'er4', currency: 'UGX', rate: 0.69, updatedAt: new Date().toISOString() },
];

// ── Demo Users for Auth ──
export const DEMO_USERS: Record<string, { id: string; phone: string; name: string; role: string; languagePref: string; email: string | null; avatarUrl: string | null }> = {
  '+14155550001': { id: 'demo-seeker-1', phone: '+14155550001', name: 'Sarah Johnson', role: 'seeker', languagePref: 'en', email: 'sarah@demo.com', avatarUrl: null },
  '+255712000001': { id: 'demo-guide-1', phone: '+255712000001', name: 'Hamisi Juma', role: 'guide', languagePref: 'en', email: 'hamisi@demo.com', avatarUrl: null },
  '+255700000001': { id: 'demo-admin-1', phone: '+255700000001', name: 'Admin User', role: 'admin', languagePref: 'en', email: 'admin@demo.com', avatarUrl: null },
};

export const DEMO_GUIDE_PROFILES: Record<string, { id: string; userId: string; bio: string; status: string; zones: string[]; languages: string[]; avgRating: number; totalSessions: number; isOnline: boolean; currentStatus: string }> = {
  'demo-guide-1': { id: 'gp-demo-1', userId: 'demo-guide-1', bio: 'Experienced Kariakoo guide specializing in Electronics and Fabrics zones. 5+ years of market navigation.', status: 'active', zones: ['zone-electronics', 'zone-fabrics'], languages: ['sw', 'en'], avgRating: 4.8, totalSessions: 156, isOnline: true, currentStatus: 'online' },
};

export function isDemoPhone(phone: string): boolean {
  return phone in DEMO_USERS;
}

// ── Export db directly ──
// We import it at the top level. If Prisma can't connect,
// queries will throw at runtime, and calling code catches and uses demo data.
export { db };

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { sanitizeString } from '@/lib/sanitize';

// ── Demo search data (for when DB is empty) ──

const DEMO_DATA = {
  guides: [
    { id: 'g1', name: 'Mwanamvua Juma', type: 'guide', rating: 4.9, price: 15000, zone: 'Fabrics Zone', languages: ['English', 'Swahili'], available: true, specialty: 'Fabrics & Textiles', aiRecommended: true, description: 'Expert in traditional fabrics and kanga', verified: true },
    { id: 'g2', name: 'Asha Mohamed', type: 'guide', rating: 4.8, price: 12000, zone: 'Spice Market', languages: ['Swahili', 'Arabic'], available: true, specialty: 'Spices & Herbs', aiRecommended: false, description: 'Spice specialist with deep knowledge', verified: true },
    { id: 'g3', name: 'Hassan Kimaro', type: 'guide', rating: 4.7, price: 10000, zone: 'Electronics Zone', languages: ['English', 'Swahili'], available: false, specialty: 'Electronics & Gadgets', aiRecommended: false, description: 'Tech expert for best electronics deals', verified: true },
    { id: 'g4', name: 'Fatma Hassan', type: 'guide', rating: 4.9, price: 20000, zone: 'Central Market', languages: ['English', 'Swahili', 'French'], available: true, specialty: 'Cultural Tours', aiRecommended: true, description: 'Award-winning cultural tour guide', verified: true },
    { id: 'g5', name: 'Juma Rashid', type: 'guide', rating: 4.6, price: 8000, zone: 'Food Court', languages: ['Swahili'], available: true, specialty: 'Food & Local Cuisine', aiRecommended: false, description: 'Street food expert and local chef', verified: false },
    { id: 'g6', name: 'Mariam Abdallah', type: 'guide', rating: 4.8, price: 18000, zone: 'Fabrics Zone', languages: ['English', 'Swahili', 'German'], available: true, specialty: 'Wholesale & Bulk', aiRecommended: true, description: 'Wholesale expert for bulk purchasing', verified: true },
  ],
  vendors: [
    { id: 'v1', name: 'Spice Paradise', type: 'vendor', rating: 4.8, category: 'Spices', zone: 'Spice Market', verified: true, description: 'Fresh spices from Zanzibar and beyond' },
    { id: 'v2', name: 'Kanga World', type: 'vendor', rating: 4.6, category: 'Fabrics', zone: 'Fabrics Zone', verified: true, description: 'Largest kanga selection in Kariakoo' },
    { id: 'v3', name: 'Tech Hub Kariakoo', type: 'vendor', rating: 4.5, category: 'Electronics', zone: 'Electronics Zone', verified: false, description: 'Phones, laptops, and accessories' },
    { id: 'v4', name: 'Mama Ntilie', type: 'vendor', rating: 4.9, category: 'Food', zone: 'Food Court', verified: true, description: 'Best local cuisine in the market' },
    { id: 'v5', name: 'Zawadi Jewelry', type: 'vendor', rating: 4.7, category: 'Jewelry', zone: 'Central Market', verified: true, description: 'Handcrafted Tanzanian jewelry' },
  ],
  zones: [
    { id: 'z1', name: 'Central Market', type: 'zone', description: 'Main market area with jewelry and specialty items', guideCount: 12 },
    { id: 'z2', name: 'Fabrics Zone', type: 'zone', description: 'Textiles, kanga, and traditional fabrics', guideCount: 8 },
    { id: 'z3', name: 'Spice Market', type: 'zone', description: 'Fresh spices and herbs from across East Africa', guideCount: 6 },
    { id: 'z4', name: 'Electronics Zone', type: 'zone', description: 'Phones, gadgets, and wholesale electronics', guideCount: 7 },
    { id: 'z5', name: 'Food Court', type: 'zone', description: 'Local cuisine, fresh produce, and street food', guideCount: 5 },
    { id: 'z6', name: 'West Wing', type: 'zone', description: 'Wholesale section and bulk purchasing', guideCount: 4 },
  ],
  packages: [
    { id: 'pkg1', name: 'Cultural Heritage Tour', type: 'package', price: 25000, rating: 4.9, zone: 'Central Market', description: '3-hour guided tour through cultural landmarks', duration: 3, guideCount: 2 },
    { id: 'pkg2', name: 'Wholesale Shopping Package', type: 'package', price: 15000, rating: 4.7, zone: 'West Wing', description: '2-hour bulk shopping with expert negotiator', duration: 2, guideCount: 1 },
    { id: 'pkg3', name: 'Spice Trail Experience', type: 'package', price: 18000, rating: 4.8, zone: 'Spice Market', description: '2.5-hour spice market adventure with tastings', duration: 2.5, guideCount: 1 },
    { id: 'pkg4', name: 'Fabric Safari', type: 'package', price: 12000, rating: 4.6, zone: 'Fabrics Zone', description: '2-hour fabric shopping with style guidance', duration: 2, guideCount: 1 },
  ],
  events: [
    { id: 'e1', name: 'Kanga Festival 2025', type: 'event', date: '2025-07-15', zone: 'Central Market', description: 'Annual celebration of traditional fabrics and fashion', rating: 0 },
    { id: 'e2', name: 'Spice Market Morning Tour', type: 'event', date: '2025-06-20', zone: 'Spice Market', description: 'Early morning spice market walkthrough', rating: 0 },
    { id: 'e3', name: 'Eid Shopping Bonanza', type: 'event', date: '2025-06-10', zone: 'Central Market', description: 'Special Eid shopping event with guides', rating: 0 },
  ],
  products: [
    { id: 'p1', name: 'Kanga Fabric', type: 'item', category: 'Fabrics', zone: 'Fabrics Zone', price: 8000, rating: 0, description: 'Traditional printed cotton fabric with Swahili proverbs', aiRecommended: true },
    { id: 'p2', name: 'Pilau Masala', type: 'item', category: 'Spices', zone: 'Spice Market', price: 3000, rating: 0, description: 'Aromatic spice blend for pilau rice', aiRecommended: false },
    { id: 'p3', name: 'Phone Case', type: 'item', category: 'Electronics', zone: 'Electronics Zone', price: 5000, rating: 0, description: 'Universal phone cases and screen protectors', aiRecommended: false },
    { id: 'p4', name: 'Tanzanite Ring', type: 'item', category: 'Jewelry', zone: 'Central Market', price: 150000, rating: 0, description: 'Rare Tanzanian gemstone in silver setting', aiRecommended: true },
    { id: 'p5', name: 'Kitenge Set', type: 'item', category: 'Fabrics', zone: 'Fabrics Zone', price: 25000, rating: 0, description: 'Matching kitenge fabric set for tailoring', aiRecommended: false },
    { id: 'p6', name: 'Cardamom', type: 'item', category: 'Spices', zone: 'Spice Market', price: 6000, rating: 0, description: 'Premium whole cardamom pods', aiRecommended: false },
    { id: 'p7', name: 'Power Bank', type: 'item', category: 'Electronics', zone: 'Electronics Zone', price: 20000, rating: 0, description: '10,000mAh portable charger', aiRecommended: true },
    { id: 'p8', name: 'Maasai Beads', type: 'item', category: 'Jewelry', zone: 'Central Market', price: 12000, rating: 0, description: 'Traditional Maasai beaded jewelry', aiRecommended: false },
    { id: 'p9', name: 'Fresh Mangoes', type: 'item', category: 'Food', zone: 'Food Court', price: 2000, rating: 0, description: 'Seasonal tropical mangoes', aiRecommended: false },
    { id: 'p10', name: 'Bluetooth Speaker', type: 'item', category: 'Electronics', zone: 'Electronics Zone', price: 35000, rating: 0, description: 'Portable Bluetooth speaker', aiRecommended: false },
  ],
};

// AI-powered search suggestions based on query context
function getAISuggestions(query: string): string[] {
  const q = query.toLowerCase();
  const suggestions: string[] = [];

  if (q.includes('fabric') || q.includes('kanga') || q.includes('kitenge') || q.includes('vitambaa')) {
    suggestions.push('Kanga Fabric - Most popular item in Kariakoo', 'Hire a fabric specialist guide', 'Visit Fabrics Zone for best deals');
  } else if (q.includes('spice') || q.includes('viungo') || q.includes('pilau') || q.includes('cardamom')) {
    suggestions.push('Buy Pilau Masala for TZS 3,000', 'Visit Spice Market early morning', 'Hire a spice expert guide');
  } else if (q.includes('phone') || q.includes('electronic') || q.includes('gadget')) {
    suggestions.push('Compare phone prices in Electronics Zone', 'Get a tech-savvy guide', 'Check Price Radar for fair electronics prices');
  } else if (q.includes('jewelry') || q.includes('tanzanite') || q.includes('vito')) {
    suggestions.push('Tanzanite - Rare gemstone found only in Tanzania', 'Certified jewelry vendors in Central Market', 'Always ask for authenticity certificate');
  } else if (q.includes('food') || q.includes('chakula') || q.includes('mango')) {
    suggestions.push('Try Mama Ntilie for best local cuisine', 'Fresh produce available at Food Court', 'Visit in the morning for freshest produce');
  } else if (q.includes('guide') || q.includes('mwongozo')) {
    suggestions.push('Top-rated guides starting at TZS 8,000', 'Cultural tours are the most popular', 'Verified guides have blue badge');
  } else if (q.includes('tour') || q.includes('cultural') || q.includes('safari')) {
    suggestions.push('Cultural Heritage Tour - 3 hours, TZS 25,000', 'Spice Trail Experience - 2.5 hours', 'Fabric Safari - 2 hours');
  } else if (q.includes('wholesale') || q.includes('jumla')) {
    suggestions.push('Wholesale Shopping Package - TZS 15,000', 'West Wing has best bulk deals', 'Hire Mariam Abdallah for wholesale expertise');
  }

  if (suggestions.length === 0 && q.length >= 2) {
    suggestions.push('Try searching for fabrics, spices, or electronics', 'Browse our verified guides', 'Check Price Radar for fair prices');
  }

  return suggestions;
}

// Highlight matching text
function highlightText(text: string, query: string): string {
  if (!query) return text;
  const regex = new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
  return text.replace(regex, '<mark class="bg-[#F59E0B]/30 text-inherit rounded px-0.5">$1</mark>');
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const q = sanitizeString(searchParams.get('q') || '');
    const type = searchParams.get('type') || 'all';
    const minPrice = parseInt(searchParams.get('minPrice') || '0');
    const maxPrice = parseInt(searchParams.get('maxPrice') || '999999999');
    const minRating = parseFloat(searchParams.get('minRating') || '0');
    const zone = searchParams.get('zone');
    const language = searchParams.get('language');
    const sort = searchParams.get('sort') || 'relevance';
    const includeSuggestions = searchParams.get('suggestions') === 'true';
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');

    let results: any[] = [];

    // Try database search first, fallback to demo data
    let usedDb = false;
    try {
      // Search guides from database
      if (type === 'all' || type === 'guide') {
        const guides = await db.user.findMany({
          where: {
            role: 'guide',
            ...(q ? {
              OR: [
                { name: { contains: q } },
                { guideProfile: { bio: { contains: q } } },
              ],
            } : {}),
          },
          include: { guideProfile: true, badges: true },
          take: 10,
        });
        if (guides.length > 0) {
          usedDb = true;
          results.push(...guides.map(g => ({
            id: g.id,
            name: g.name,
            type: 'guide',
            rating: g.guideProfile?.avgRating || 0,
            price: 15000,
            zone: g.guideProfile?.zones ? JSON.parse(g.guideProfile.zones).join(', ') : '',
            languages: g.guideProfile?.languages ? JSON.parse(g.guideProfile.languages) : [],
            available: g.guideProfile?.isOnline || false,
            specialty: g.guideProfile?.bio || '',
            verified: g.badges.some(b => b.badgeType === 'verified_elite'),
            highlightedName: q ? highlightText(g.name, q) : g.name,
          })));
        }
      }

      // Search vendors from database
      if (type === 'all' || type === 'vendor') {
        const vendors = await db.vendor.findMany({
          where: {
            ...(q ? {
              OR: [
                { name: { contains: q } },
                { categories: { contains: q } },
              ],
            } : {}),
          },
          include: { zone: true },
          take: 10,
        });
        if (vendors.length > 0) {
          usedDb = true;
          results.push(...vendors.map(v => ({
            id: v.id,
            name: v.name,
            type: 'vendor',
            rating: 4.5,
            category: v.categories,
            zone: v.zone?.name || '',
            verified: v.approved,
            description: `${v.stallNumber} - ${v.contact}`,
            highlightedName: q ? highlightText(v.name, q) : v.name,
          })));
        }
      }

      // Search zones from database
      if (type === 'all' || type === 'zone') {
        const zones = await db.zone.findMany({
          where: q ? {
            OR: [
              { name: { contains: q } },
              { nameSw: { contains: q } },
              { description: { contains: q } },
            ],
          } : {},
          take: 10,
        });
        if (zones.length > 0) {
          usedDb = true;
          results.push(...zones.map(z => ({
            id: z.id,
            name: z.name,
            type: 'zone',
            description: z.description,
            guideCount: 0,
            highlightedName: q ? highlightText(z.name, q) : z.name,
          })));
        }
      }

      // Search package deals
      if (type === 'all' || type === 'experience' || type === 'package') {
        const packages = await db.packageDeal.findMany({
          where: q ? {
            OR: [
              { title: { contains: q } },
              { description: { contains: q } },
            ],
          } : {},
          take: 10,
        });
        if (packages.length > 0) {
          usedDb = true;
          results.push(...packages.map(p => ({
            id: p.id,
            name: p.title,
            type: 'package',
            price: p.price,
            rating: 4.5,
            zone: p.zoneIds,
            description: p.description,
            duration: p.duration,
            highlightedName: q ? highlightText(p.title, q) : p.title,
          })));
        }
      }

      // Search seasonal events
      if (type === 'all' || type === 'event') {
        const events = await db.seasonalEvent.findMany({
          where: q ? {
            OR: [
              { title: { contains: q } },
              { titleSw: { contains: q } },
              { description: { contains: q } },
            ],
          } : {},
          take: 10,
        });
        if (events.length > 0) {
          usedDb = true;
          results.push(...events.map(e => ({
            id: e.id,
            name: e.title,
            type: 'event',
            date: e.startDate,
            zone: e.affectedZones,
            description: e.description,
            highlightedName: q ? highlightText(e.title, q) : e.title,
          })));
        }
      }
    } catch (dbErr) {
      console.log('DB search failed, using demo data:', (dbErr as Error).message);
    }

    // Fallback to demo data if DB is empty
    if (!usedDb) {
      // Search guides
      if (type === 'all' || type === 'guide') {
        results.push(...DEMO_DATA.guides.filter(g =>
          (!q || g.name.toLowerCase().includes(q.toLowerCase()) || g.specialty.toLowerCase().includes(q.toLowerCase()) || g.zone.toLowerCase().includes(q.toLowerCase()) || (g.description || '').toLowerCase().includes(q.toLowerCase())) &&
          g.price >= minPrice && g.price <= maxPrice &&
          g.rating >= minRating &&
          (!zone || g.zone.toLowerCase().includes(zone.toLowerCase())) &&
          (!language || (g.languages && g.languages.some(l => l.toLowerCase().includes(language.toLowerCase()))))
        ).map(g => ({ ...g, highlightedName: q ? highlightText(g.name, q) : g.name, highlightedSpecialty: q ? highlightText(g.specialty, q) : g.specialty })));
      }

      // Search vendors
      if (type === 'all' || type === 'vendor') {
        results.push(...DEMO_DATA.vendors.filter(v =>
          (!q || v.name.toLowerCase().includes(q.toLowerCase()) || v.category.toLowerCase().includes(q.toLowerCase()) || (v.description || '').toLowerCase().includes(q.toLowerCase())) &&
          v.rating >= minRating &&
          (!zone || v.zone.toLowerCase().includes(zone.toLowerCase()))
        ).map(v => ({ ...v, highlightedName: q ? highlightText(v.name, q) : v.name, highlightedCategory: q ? highlightText(v.category, q) : v.category })));
      }

      // Search zones
      if (type === 'all' || type === 'zone') {
        results.push(...DEMO_DATA.zones.filter(z =>
          !q || z.name.toLowerCase().includes(q.toLowerCase()) || z.description.toLowerCase().includes(q.toLowerCase())
        ).map(z => ({ ...z, highlightedName: q ? highlightText(z.name, q) : z.name })));
      }

      // Search packages
      if (type === 'all' || type === 'experience' || type === 'package') {
        results.push(...DEMO_DATA.packages.filter(p =>
          !q || p.name.toLowerCase().includes(q.toLowerCase()) || p.description.toLowerCase().includes(q.toLowerCase())
        ).map(p => ({ ...p, highlightedName: q ? highlightText(p.name, q) : p.name })));
      }

      // Search events
      if (type === 'all' || type === 'event') {
        results.push(...DEMO_DATA.events.filter(e =>
          !q || e.name.toLowerCase().includes(q.toLowerCase()) || e.description.toLowerCase().includes(q.toLowerCase())
        ).map(e => ({ ...e, highlightedName: q ? highlightText(e.name, q) : e.name })));
      }

      // Search products
      if (type === 'all' || type === 'item' || type === 'shopping' || type === 'food') {
        results.push(...DEMO_DATA.products.filter(p => {
          const matchesQuery = !q || p.name.toLowerCase().includes(q.toLowerCase()) || p.category.toLowerCase().includes(q.toLowerCase()) || p.description.toLowerCase().includes(q.toLowerCase());
          const matchesPrice = p.price >= minPrice && p.price <= maxPrice;
          const matchesZone = !zone || p.zone.toLowerCase().includes(zone.toLowerCase());
          const matchesType = type === 'all' || type === 'item' || (type === 'shopping' && p.category !== 'Food') || (type === 'food' && p.category === 'Food');
          return matchesQuery && matchesPrice && matchesZone && matchesType;
        }).map(p => ({ ...p, highlightedName: q ? highlightText(p.name, q) : p.name })));
      }
    }

    // Sort
    switch (sort) {
      case 'rating': results.sort((a, b) => b.rating - a.rating); break;
      case 'price_low': results.sort((a, b) => (a.price || 0) - (b.price || 0)); break;
      case 'price_high': results.sort((a, b) => (b.price || 0) - (a.price || 0)); break;
      default: results.sort((a, b) => (b.aiRecommended ? 1 : 0) - (a.aiRecommended ? 1 : 0) || b.rating - a.rating); break;
    }

    // Pagination
    const total = results.length;
    const pagedResults = results.slice((page - 1) * limit, page * limit);

    // AI suggestions
    const aiSuggestions = includeSuggestions && q ? getAISuggestions(q) : [];

    // Trending/popular searches
    const trendingSearches = [
      { term: 'Kanga', count: 1240 },
      { term: 'Spices', count: 890 },
      { term: 'Electronics', count: 756 },
      { term: 'Tanzanite', count: 543 },
      { term: 'Cultural Tour', count: 432 },
      { term: 'Wholesale', count: 321 },
    ];

    // Autocomplete suggestions
    const autocompleteSuggestions: string[] = [];
    if (q.length >= 2) {
      const allNames = [
        ...DEMO_DATA.guides.map(g => g.name),
        ...DEMO_DATA.vendors.map(v => v.name),
        ...DEMO_DATA.zones.map(z => z.name),
        ...DEMO_DATA.packages.map(p => p.name),
        ...DEMO_DATA.events.map(e => e.name),
        ...DEMO_DATA.products.map(p => p.name),
        'Fabrics', 'Kanga', 'Spices', 'Electronics', 'Cultural Tour',
        'Wholesale', 'Textiles', 'Herbs', 'Gadgets', 'Jewelry',
      ];
      const uniqueNames = [...new Set(allNames)];
      uniqueNames
        .filter(n => n.toLowerCase().includes(q.toLowerCase()))
        .slice(0, 8)
        .forEach(n => autocompleteSuggestions.push(n));
    }

    return NextResponse.json({
      success: true,
      results: pagedResults,
      total,
      page,
      limit,
      query: q,
      aiSuggestions,
      trendingSearches,
      autocompleteSuggestions,
    });
  } catch (error: any) {
    console.error('Search error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

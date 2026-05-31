import { NextRequest, NextResponse } from 'next/server';
import { sanitizeSearch } from '@/lib/sanitize';

// Demo search data
const DEMO_DATA = {
  guides: [
    { id: 'g1', name: 'Mwanamvua Juma', type: 'guide', rating: 4.9, price: 15000, zone: 'Fabrics Zone', languages: ['English', 'Swahili'], available: true, specialty: 'Fabrics & Textiles', aiRecommended: true },
    { id: 'g2', name: 'Asha Mohamed', type: 'guide', rating: 4.8, price: 12000, zone: 'Spice Market', languages: ['Swahili', 'Arabic'], available: true, specialty: 'Spices & Herbs', aiRecommended: false },
    { id: 'g3', name: 'Hassan Kimaro', type: 'guide', rating: 4.7, price: 10000, zone: 'Electronics Zone', languages: ['English', 'Swahili'], available: false, specialty: 'Electronics & Gadgets', aiRecommended: false },
    { id: 'g4', name: 'Fatma Hassan', type: 'guide', rating: 4.9, price: 20000, zone: 'Central Market', languages: ['English', 'Swahili', 'French'], available: true, specialty: 'Cultural Tours', aiRecommended: true },
  ],
  vendors: [
    { id: 'v1', name: 'Spice Paradise', type: 'vendor', rating: 4.8, category: 'Spices', zone: 'Spice Market', verified: true },
    { id: 'v2', name: 'Kanga World', type: 'vendor', rating: 4.6, category: 'Fabrics', zone: 'Fabrics Zone', verified: true },
    { id: 'v3', name: 'Tech Hub Kariakoo', type: 'vendor', rating: 4.5, category: 'Electronics', zone: 'Electronics Zone', verified: false },
  ],
  zones: [
    { id: 'z1', name: 'Central Market', type: 'zone', description: 'Main market area', guideCount: 12 },
    { id: 'z2', name: 'Fabrics Zone', type: 'zone', description: 'Textiles and kanga', guideCount: 8 },
    { id: 'z3', name: 'Spice Market', type: 'zone', description: 'Fresh spices and herbs', guideCount: 6 },
  ],
};

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const q = sanitizeSearch(searchParams.get('q') || '');
    const type = searchParams.get('type') || 'all';
    const minPrice = parseInt(searchParams.get('minPrice') || '0');
    const maxPrice = parseInt(searchParams.get('maxPrice') || '999999999');
    const minRating = parseFloat(searchParams.get('minRating') || '0');
    const zone = searchParams.get('zone');
    const sort = searchParams.get('sort') || 'relevance';

    let results: any[] = [];

    // Search guides
    if (type === 'all' || type === 'guide') {
      results.push(...DEMO_DATA.guides.filter(g =>
        (!q || g.name.toLowerCase().includes(q.toLowerCase()) || g.specialty.toLowerCase().includes(q.toLowerCase()) || g.zone.toLowerCase().includes(q.toLowerCase())) &&
        g.price >= minPrice && g.price <= maxPrice &&
        g.rating >= minRating &&
        (!zone || g.zone.toLowerCase().includes(zone.toLowerCase()))
      ));
    }

    // Search vendors
    if (type === 'all' || type === 'vendor') {
      results.push(...DEMO_DATA.vendors.filter(v =>
        (!q || v.name.toLowerCase().includes(q.toLowerCase()) || v.category.toLowerCase().includes(q.toLowerCase())) &&
        v.rating >= minRating &&
        (!zone || v.zone.toLowerCase().includes(zone.toLowerCase()))
      ));
    }

    // Search zones
    if (type === 'all' || type === 'zone') {
      results.push(...DEMO_DATA.zones.filter(z =>
        !q || z.name.toLowerCase().includes(q.toLowerCase()) || z.description.toLowerCase().includes(q.toLowerCase())
      ));
    }

    // Sort
    switch (sort) {
      case 'rating': results.sort((a, b) => b.rating - a.rating); break;
      case 'price_low': results.sort((a, b) => (a.price || 0) - (b.price || 0)); break;
      case 'price_high': results.sort((a, b) => (b.price || 0) - (a.price || 0)); break;
      default: results.sort((a, b) => (b.aiRecommended ? 1 : 0) - (a.aiRecommended ? 1 : 0)); break;
    }

    return NextResponse.json({ success: true, results, total: results.length, query: q });
  } catch (error: any) {
    console.error('Search error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

// Track if seeding has been done in this process
let seeded = false;

export async function GET() {
  // Auto-seed on first health check if not yet done
  if (!seeded) {
    try {
      const userCount = await db.user.count();
      if (userCount === 0) {
        // No users exist — run minimal seed for demo mode
        await seedDemoData();
      }
      seeded = true;
    } catch {
      // DB might not be ready yet, that's OK
    }
  }

  return NextResponse.json({ status: 'ok', timestamp: new Date().toISOString(), demoMode: true })
}

async function seedDemoData() {
  // Create zones
  const zones = [
    { id: 'zone-electronics', name: 'Electronics Zone', nameSw: 'Eneo la Elektroniki', description: 'The tech hub of Kariakoo', color: '#0891B2' },
    { id: 'zone-fabrics', name: 'Fabrics Zone', nameSw: 'Eneo la Vitenge', description: 'Vibrant textiles', color: '#7C3AED' },
    { id: 'zone-wholesale', name: 'Wholesale Zone', nameSw: 'Eneo la Jumla', description: 'Bulk buying paradise', color: '#14B8A6' },
    { id: 'zone-spices', name: 'Spices Zone', nameSw: 'Eneo la Viungo', description: 'Aromatic treasures', color: '#EF4444' },
    { id: 'zone-kitchenware', name: 'Kitchenware Zone', nameSw: 'Eneo la Chombo', description: 'Kitchen essentials', color: '#F59E0B' },
    { id: 'zone-artisanal', name: 'Artisanal Zone', nameSw: 'Eneo la Kisanii', description: 'Handcrafted treasures', color: '#8B5E3C' },
  ];

  for (const z of zones) {
    await db.zone.upsert({ where: { id: z.id }, update: {}, create: z });
  }

  // Create demo users
  const demoUsers = [
    { phone: '+14155550001', name: 'Sarah Johnson', role: 'seeker', languagePref: 'en' },
    { phone: '+255712000001', name: 'Hamisi Juma', role: 'guide', languagePref: 'en' },
    { phone: '+255700000001', name: 'Admin User', role: 'admin', languagePref: 'en' },
  ];

  for (const u of demoUsers) {
    const user = await db.user.upsert({ where: { phone: u.phone }, update: {}, create: u });

    if (u.role === 'guide') {
      await db.guideProfile.upsert({
        where: { userId: user.id },
        update: {},
        create: {
          userId: user.id,
          bio: 'Born and raised in Kariakoo. I know every corner of the market!',
          status: 'active',
          zones: '["zone-electronics","zone-fabrics"]',
          languages: '["sw","en"]',
          avgRating: 4.8,
          totalSessions: 187,
          isOnline: true,
          currentStatus: 'online',
        },
      });
    }
  }

  // Create demo vendors
  const vendors = [
    { id: 'v1', name: 'Zaki Electronics', zoneId: 'zone-electronics', categories: '["Phones","Accessories"]', stallNumber: 'A-12', contact: '+255712001234', recommendations: 234, approved: true },
    { id: 'v2', name: 'Mama Kanga Shop', zoneId: 'zone-fabrics', categories: '["Kanga","Kitenge"]', stallNumber: 'B-45', contact: '+255716007890', recommendations: 312, approved: true },
    { id: 'v3', name: 'Al-Falah Wholesale', zoneId: 'zone-wholesale', categories: '["Rice","Oil","Sugar"]', stallNumber: 'C-08', contact: '+255720003456', recommendations: 267, approved: true },
  ];

  for (const v of vendors) {
    await db.vendor.upsert({ where: { id: v.id }, update: {}, create: v });
  }

  console.log('✅ Demo data auto-seeded on first request');
}

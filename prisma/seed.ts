import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Kariakoo center coordinates
const KARIAKOO_LAT = -6.8264;
const KARIAKOO_LNG = 39.2695;

// Helper: generate a small random offset around Kariakoo center
function randomGeoOffset(range = 0.003) {
  return (Math.random() - 0.5) * 2 * range;
}

// Helper: pick random element from array
function randomPick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

// Helper: pick N random elements from array
function randomPickN<T>(arr: T[], n: number): T[] {
  const shuffled = [...arr].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, Math.min(n, arr.length));
}

async function main() {
  console.log('🌱 Seeding Kariako Guide database...');

  // ─── Clear existing data (respect foreign key order) ───
  console.log('🧹 Clearing existing data...');
  await prisma.message.deleteMany();
  await prisma.session.deleteMany();
  await prisma.fraudAlert.deleteMany();
  await prisma.seasonalEvent.deleteMany();
  await prisma.mentorship.deleteMany();
  await prisma.marketStory.deleteMany();
  await prisma.navWaypoint.deleteMany();
  await prisma.buddyMatch.deleteMany();
  await prisma.sessionRecording.deleteMany();
  await prisma.packageDeal.deleteMany();
  await prisma.guideSubscription.deleteMany();
  await prisma.vendorVerification.deleteMany();
  await prisma.exchangeRate.deleteMany();
  await prisma.badge.deleteMany();
  await prisma.payout.deleteMany();
  await prisma.priceRadar.deleteMany();
  await prisma.vendor.deleteMany();
  await prisma.request.deleteMany();
  await prisma.guideProfile.deleteMany();
  await prisma.user.deleteMany();
  await prisma.zone.deleteMany();

  // ─── Create Zones ───
  console.log('📍 Creating zones...');
  const zones = await Promise.all([
    prisma.zone.create({
      data: {
        name: 'Vyombo Zone',
        nameSw: 'Eneo la Vyombo',
        description: 'Kitchenware, utensils, and household items. The heart of Kariakoo for pots, pans, and cooking essentials.',
        geoBounds: JSON.stringify({
          type: 'Polygon',
          coordinates: [[
            [39.2675, -6.8280],
            [39.2715, -6.8280],
            [39.2715, -6.8250],
            [39.2675, -6.8250],
            [39.2675, -6.8280],
          ]],
        }),
        color: '#E67E22',
      },
    }),
    prisma.zone.create({
      data: {
        name: 'Electronics Zone',
        nameSw: 'Eneo la Vifaa vya Umeme',
        description: 'Gadgets, phones, electronics and accessories. Find the best deals on tech in Dar es Salaam.',
        geoBounds: JSON.stringify({
          type: 'Polygon',
          coordinates: [[
            [39.2700, -6.8285],
            [39.2735, -6.8285],
            [39.2735, -6.8255],
            [39.2700, -6.8255],
            [39.2700, -6.8285],
          ]],
        }),
        color: '#3498DB',
      },
    }),
    prisma.zone.create({
      data: {
        name: 'Fabric Zone',
        nameSw: 'Eneo la Vitenge',
        description: 'Kitenge, vitenge, fabrics and textiles. Vibrant colors and patterns for every occasion.',
        geoBounds: JSON.stringify({
          type: 'Polygon',
          coordinates: [[
            [39.2655, -6.8275],
            [39.2685, -6.8275],
            [39.2685, -6.8245],
            [39.2655, -6.8245],
            [39.2655, -6.8275],
          ]],
        }),
        color: '#E91E63',
      },
    }),
    prisma.zone.create({
      data: {
        name: 'Spices Zone',
        nameSw: 'Eneo la Viungo',
        description: 'Spices, herbs, dried foods and ingredients. The aromatic soul of Kariakoo market.',
        geoBounds: JSON.stringify({
          type: 'Polygon',
          coordinates: [[
            [39.2680, -6.8300],
            [39.2710, -6.8300],
            [39.2710, -6.8275],
            [39.2680, -6.8275],
            [39.2680, -6.8300],
          ]],
        }),
        color: '#27AE60',
      },
    }),
    prisma.zone.create({
      data: {
        name: 'Wholesale Zone',
        nameSw: 'Eneo la Jumla',
        description: 'Bulk wholesale, large quantities and best prices. For serious buyers looking for volume deals.',
        geoBounds: JSON.stringify({
          type: 'Polygon',
          coordinates: [[
            [39.2710, -6.8300],
            [39.2740, -6.8300],
            [39.2740, -6.8270],
            [39.2710, -6.8270],
            [39.2710, -6.8300],
          ]],
        }),
        color: '#9B59B6',
      },
    }),
  ]);

  const [vyomboZone, electronicsZone, fabricZone, spicesZone, wholesaleZone] = zones;
  console.log(`  ✅ Created ${zones.length} zones`);

  // ─── Create Admin User ───
  console.log('👤 Creating admin user...');
  const adminUser = await prisma.user.create({
    data: {
      phone: '+255700000001',
      name: 'Admin User',
      role: 'admin',
      languagePref: 'en',
    },
  });

  // ─── Create Seeker Users ───
  console.log('🛒 Creating seeker users...');
  const seekers = await Promise.all([
    prisma.user.create({
      data: {
        phone: '+14155550001',
        name: 'Sarah Johnson',
        role: 'seeker',
        languagePref: 'en',
      },
    }),
    prisma.user.create({
      data: {
        phone: '+39335550002',
        name: 'Marco Rossi',
        role: 'seeker',
        languagePref: 'en',
      },
    }),
    prisma.user.create({
      data: {
        phone: '+86135550003',
        name: 'Li Wei',
        role: 'seeker',
        languagePref: 'en',
      },
    }),
  ]);
  console.log(`  ✅ Created ${seekers.length} seekers`);

  // ─── Create Guide Users + GuideProfiles ───
  console.log('🧭 Creating guide users and profiles...');

  const guideData = [
    {
      name: 'Hamisi Juma',
      phone: '+255712000001',
      bio: 'Born and raised in Kariakoo. I know every corner of the Vyombo and Electronics zones. Let me help you find the best kitchenware deals in Dar!',
      status: 'active' as const,
      zoneIndices: [0, 1], // vyombo, electronics
      languages: ['sw', 'en'],
      avgRating: 4.8,
      totalSessions: 187,
    },
    {
      name: 'Fatma Hassan',
      phone: '+255712000002',
      bio: 'Third-generation Kariakoo fabric merchant. I can identify quality kitenge by touch. Specializing in Fabric and Wholesale zones for the best textile bargains.',
      status: 'active' as const,
      zoneIndices: [2, 4], // fabric, wholesale
      languages: ['sw', 'en', 'ar'],
      avgRating: 4.9,
      totalSessions: 156,
    },
    {
      name: 'Saidi Mohamed',
      phone: '+255712000003',
      bio: 'Spice expert with 15 years in the Kariakoo market. I know where to find the freshest cardamom, cinnamon, and cloves at wholesale prices.',
      status: 'active' as const,
      zoneIndices: [3, 4], // spices, wholesale
      languages: ['sw', 'en'],
      avgRating: 4.6,
      totalSessions: 98,
    },
    {
      name: 'Amina Mzee',
      phone: '+255712000004',
      bio: 'Kitchenware specialist. From aluminum pots to stainless steel utensils — I will get you the best price in Vyombo Zone. Trusted by hundreds of buyers.',
      status: 'active' as const,
      zoneIndices: [0], // vyombo
      languages: ['sw', 'en'],
      avgRating: 4.5,
      totalSessions: 134,
    },
    {
      name: 'Yusuf Kassim',
      phone: '+255712000005',
      bio: 'Tech enthusiast and Kariakoo electronics expert. I can help you find genuine phones, accessories, and gadgets without getting scammed.',
      status: 'active' as const,
      zoneIndices: [1], // electronics
      languages: ['sw', 'en', 'fr'],
      avgRating: 4.7,
      totalSessions: 112,
    },
    {
      name: 'Mariam Abdallah',
      phone: '+255712000006',
      bio: 'All-around Kariakoo veteran. I guide tourists and buyers through all zones with ease. Your one-stop guide for the full Kariakoo experience!',
      status: 'active' as const,
      zoneIndices: [0, 1, 2, 3, 4], // all zones
      languages: ['sw', 'en', 'de'],
      avgRating: 4.4,
      totalSessions: 75,
    },
    {
      name: 'Juma Rajabu',
      phone: '+255712000007',
      bio: 'Wholesale deals are my specialty. I connect bulk buyers with the best suppliers in the Jumla Zone. Save thousands on large orders!',
      status: 'active' as const,
      zoneIndices: [4], // wholesale
      languages: ['sw', 'en'],
      avgRating: 4.3,
      totalSessions: 45,
    },
    {
      name: 'Khadija Omari',
      phone: '+255712000008',
      bio: 'New to guiding but I grew up helping my mother sell spices in Kariakoo. I know the Spices Zone inside out. Currently building my reputation!',
      status: 'pending' as const,
      zoneIndices: [3], // spices
      languages: ['sw'],
      avgRating: 4.1,
      totalSessions: 12,
    },
    {
      name: 'Ibrahim Selemani',
      phone: '+255712000009',
      bio: 'Electronics and fabric guide. I bridge the gap between traditional textiles and modern tech in Kariakoo. Awaiting verification.',
      status: 'pending' as const,
      zoneIndices: [1, 2], // electronics, fabric
      languages: ['sw', 'en'],
      avgRating: 3.8,
      totalSessions: 8,
    },
    {
      name: 'Rehema Hamisi',
      phone: '+255712000010',
      bio: 'Former guide with extensive Kariakoo knowledge. Currently suspended due to verification issues. Hoping to return soon.',
      status: 'suspended' as const,
      zoneIndices: [0, 3], // vyombo, spices
      languages: ['sw'],
      avgRating: 3.2,
      totalSessions: 5,
    },
  ];

  const guides: { user: Awaited<ReturnType<typeof prisma.user.create>>; profile: Awaited<ReturnType<typeof prisma.guideProfile.create>> }[] = [];

  for (const gd of guideData) {
    const user = await prisma.user.create({
      data: {
        phone: gd.phone,
        name: gd.name,
        role: 'guide',
        languagePref: gd.languages.includes('en') ? 'en' : 'sw',
      },
    });

    const guideZoneIds = gd.zoneIndices.map(i => zones[i].id);
    const profile = await prisma.guideProfile.create({
      data: {
        userId: user.id,
        bio: gd.bio,
        status: gd.status,
        zones: JSON.stringify(guideZoneIds),
        languages: JSON.stringify(gd.languages),
        avgRating: gd.avgRating,
        totalSessions: gd.totalSessions,
        isOnline: gd.status === 'active' && Math.random() > 0.5,
        currentStatus: gd.status === 'active' ? (Math.random() > 0.5 ? 'online' : 'offline') : 'offline',
      },
    });

    guides.push({ user, profile });
  }

  console.log(`  ✅ Created ${guides.length} guides with profiles`);

  // ─── Create Vendors ───
  console.log('🏪 Creating vendors...');

  const vendorData = [
    // Vyombo Zone vendors (4)
    { name: 'Mambo Vyombo General Store', zone: vyomboZone, categories: ['Pots', 'Pans', 'Utensils'], stall: 'V-101', contact: '+255713001001', recs: 45 },
    { name: 'Aluminium Housewares', zone: vyomboZone, categories: ['Aluminium pots', 'Sufurias', 'Plates'], stall: 'V-102', contact: '+255713001002', recs: 38 },
    { name: 'Kariakoo Kitchen Kings', zone: vyomboZone, categories: ['Gas cookers', 'Kettles', 'Flasks'], stall: 'V-103', contact: '+255713001003', recs: 52 },
    { name: 'Royal Plates & Cups', zone: vyomboZone, categories: ['Crockery', 'Cups', 'Glassware'], stall: 'V-104', contact: '+255713001004', recs: 29 },

    // Electronics Zone vendors (4)
    { name: 'Simu World Electronics', zone: electronicsZone, categories: ['Phones', 'Phone cases', 'Chargers'], stall: 'E-201', contact: '+255713002001', recs: 67 },
    { name: 'Dar Tech Hub', zone: electronicsZone, categories: ['Laptops', 'Tablets', 'Accessories'], stall: 'E-202', contact: '+255713002002', recs: 41 },
    { name: 'Mzumbe Electronics', zone: electronicsZone, categories: ['Speakers', 'Headphones', 'Radios'], stall: 'E-203', contact: '+255713002003', recs: 35 },
    { name: 'Power Source Batteries', zone: electronicsZone, categories: ['Batteries', 'Power banks', 'Cables'], stall: 'E-204', contact: '+255713002004', recs: 23 },

    // Fabric Zone vendors (4)
    { name: 'Kitenge Palace', zone: fabricZone, categories: ['Kitenge', 'Vitenge', 'African prints'], stall: 'F-301', contact: '+255713003001', recs: 88 },
    { name: 'Mama Ngola Fabrics', zone: fabricZone, categories: ['Kanga', 'Kikoi', 'Leso'], stall: 'F-302', contact: '+255713003002', recs: 55 },
    { name: 'Silk Road Textiles', zone: fabricZone, categories: ['Silk', 'Satin', 'Lace'], stall: 'F-303', contact: '+255713003003', recs: 34 },
    { name: 'Shopper Fabric Center', zone: fabricZone, categories: ['Cotton', 'Linen', 'Towel fabric'], stall: 'F-304', contact: '+255713003004', recs: 42 },

    // Spices Zone vendors (4)
    { name: 'Pilipili Hot Spices', zone: spicesZone, categories: ['Chili', 'Black pepper', 'Paprika'], stall: 'S-401', contact: '+255713004001', recs: 62 },
    { name: 'Zanzibar Aromatics', zone: spicesZone, categories: ['Cinnamon', 'Cardamom', 'Cloves'], stall: 'S-402', contact: '+255713004002', recs: 71 },
    { name: 'Curry Masters', zone: spicesZone, categories: ['Curry powder', 'Turmeric', 'Cumin'], stall: 'S-403', contact: '+255713004003', recs: 48 },
    { name: 'Dried Foods Center', zone: spicesZone, categories: ['Dried fish', 'Dried fruit', 'Nuts'], stall: 'S-404', contact: '+255713004004', recs: 33 },

    // Wholesale Zone vendors (4)
    { name: 'Jumla Mega Store', zone: wholesaleZone, categories: ['Bulk rice', 'Bulk flour', 'Bulk sugar'], stall: 'W-501', contact: '+255713005001', recs: 95 },
    { name: 'Continental Wholesale', zone: wholesaleZone, categories: ['Bulk cooking oil', 'Bulk soap', 'Cleaning supplies'], stall: 'W-502', contact: '+255713005002', recs: 78 },
    { name: 'East Africa Traders', zone: wholesaleZone, categories: ['Bulk textiles', 'Bulk electronics', 'Mixed goods'], stall: 'W-503', contact: '+255713005003', recs: 63 },
    { name: 'Pemba Wholesale Depot', zone: wholesaleZone, categories: ['Bulk spices', 'Bulk tea', 'Bulk coffee'], stall: 'W-504', contact: '+255713005004', recs: 51 },
  ];

  const vendors: Awaited<ReturnType<typeof prisma.vendor.create>>[] = [];
  for (const vd of vendorData) {
    const vendor = await prisma.vendor.create({
      data: {
        name: vd.name,
        zoneId: vd.zone.id,
        categories: JSON.stringify(vd.categories),
        stallNumber: vd.stall,
        contact: vd.contact,
        geoLat: KARIAKOO_LAT + randomGeoOffset(0.002),
        geoLng: KARIAKOO_LNG + randomGeoOffset(0.002),
        approved: true,
        recommendations: vd.recs,
        openHours: Math.random() > 0.3 ? '8:00-18:00' : '7:00-19:00',
      },
    });
    vendors.push(vendor);
  }
  console.log(`  ✅ Created ${vendors.length} vendors`);

  // ─── Create Price Radar Entries ───
  console.log('📊 Creating price radar entries...');

  const priceRadarData = [
    // Vyombo Zone (10 items)
    { category: 'Aluminium Sufuria (Large)', zone: vyomboZone, min: 8000, max: 15000 },
    { category: 'Stainless Steel Pot Set', zone: vyomboZone, min: 25000, max: 55000 },
    { category: 'Plastic Plates (Pack of 12)', zone: vyomboZone, min: 5000, max: 10000 },
    { category: 'Gas Cooker (Single Burner)', zone: vyomboZone, min: 35000, max: 65000 },
    { category: 'Electric Kettle', zone: vyomboZone, min: 18000, max: 35000 },
    { category: 'Thermos Flask (1 Liter)', zone: vyomboZone, min: 6000, max: 12000 },
    { category: 'Wooden Cooking Spoon Set', zone: vyomboZone, min: 2000, max: 5000 },
    { category: 'Non-stick Frying Pan', zone: vyomboZone, min: 12000, max: 28000 },
    { category: 'Glass Cups (Set of 6)', zone: vyomboZone, min: 4000, max: 9000 },
    { category: 'Kitchen Knife Set', zone: vyomboZone, min: 7000, max: 18000 },

    // Electronics Zone (10 items)
    { category: 'Feature Phone', zone: electronicsZone, min: 15000, max: 35000 },
    { category: 'Smartphone (Budget)', zone: electronicsZone, min: 80000, max: 150000 },
    { category: 'Phone Case', zone: electronicsZone, min: 2000, max: 5000 },
    { category: 'Power Bank (10000mAh)', zone: electronicsZone, min: 12000, max: 25000 },
    { category: 'Rice Cooker', zone: electronicsZone, min: 45000, max: 85000 },
    { category: 'Bluetooth Speaker', zone: electronicsZone, min: 15000, max: 40000 },
    { category: 'USB Cable (Type-C)', zone: electronicsZone, min: 1500, max: 4000 },
    { category: 'Wall Charger (Fast Charge)', zone: electronicsZone, min: 5000, max: 12000 },
    { category: 'Earphones (Wired)', zone: electronicsZone, min: 2000, max: 6000 },
    { category: 'LED Light Bulb (Pack of 4)', zone: electronicsZone, min: 3000, max: 7000 },

    // Fabric Zone (10 items)
    { category: 'Kitenge Fabric (6 yards)', zone: fabricZone, min: 15000, max: 35000 },
    { category: 'Kanga Pair', zone: fabricZone, min: 5000, max: 12000 },
    { category: 'African Print Fabric (Ankara)', zone: fabricZone, min: 8000, max: 20000 },
    { category: 'Silk Fabric (per yard)', zone: fabricZone, min: 12000, max: 30000 },
    { category: 'Kikoi Fabric', zone: fabricZone, min: 4000, max: 9000 },
    { category: 'Lace Fabric (per yard)', zone: fabricZone, min: 6000, max: 15000 },
    { category: 'Satin Fabric (per yard)', zone: fabricZone, min: 5000, max: 12000 },
    { category: 'Cotton Fabric (per yard)', zone: fabricZone, min: 3000, max: 7000 },
    { category: 'Wedding Veil Fabric', zone: fabricZone, min: 20000, max: 50000 },
    { category: 'Towel Fabric (per yard)', zone: fabricZone, min: 4000, max: 8000 },

    // Spices Zone (10 items)
    { category: 'Cardamom (500g)', zone: spicesZone, min: 12000, max: 22000 },
    { category: 'Cinnamon Sticks (500g)', zone: spicesZone, min: 5000, max: 10000 },
    { category: 'Cloves (250g)', zone: spicesZone, min: 8000, max: 15000 },
    { category: 'Curry Powder (1kg)', zone: spicesZone, min: 4000, max: 8000 },
    { category: 'Turmeric Powder (500g)', zone: spicesZone, min: 3000, max: 6000 },
    { category: 'Black Pepper (500g)', zone: spicesZone, min: 6000, max: 12000 },
    { category: 'Chili Powder (500g)', zone: spicesZone, min: 2500, max: 5500 },
    { category: 'Cumin Seeds (500g)', zone: spicesZone, min: 4000, max: 8000 },
    { category: 'Dried Coconut (1kg)', zone: spicesZone, min: 3000, max: 6000 },
    { category: 'Mixed Spice (Garam Masala 500g)', zone: spicesZone, min: 3500, max: 7000 },

    // Wholesale Zone (10 items)
    { category: 'Rice (50kg bag)', zone: wholesaleZone, min: 55000, max: 85000 },
    { category: 'Maize Flour (50kg bag)', zone: wholesaleZone, min: 40000, max: 60000 },
    { category: 'Sugar (50kg bag)', zone: wholesaleZone, min: 70000, max: 110000 },
    { category: 'Cooking Oil (20L)', zone: wholesaleZone, min: 45000, max: 70000 },
    { category: 'Soap (Carton of 24)', zone: wholesaleZone, min: 25000, max: 40000 },
    { category: 'Bleach (5L)', zone: wholesaleZone, min: 5000, max: 9000 },
    { category: 'Toothpaste (Carton)', zone: wholesaleZone, min: 15000, max: 28000 },
    { category: 'Bottled Water (Carton)', zone: wholesaleZone, min: 4000, max: 8000 },
    { category: 'Tea Leaves (1kg pack)', zone: wholesaleZone, min: 6000, max: 12000 },
    { category: 'Coffee (1kg pack)', zone: wholesaleZone, min: 10000, max: 20000 },
  ];

  const priceRadarEntries: Awaited<ReturnType<typeof prisma.priceRadar.create>>[] = [];
  for (const pr of priceRadarData) {
    const entry = await prisma.priceRadar.create({
      data: {
        category: pr.category,
        zoneId: pr.zone.id,
        priceMin: pr.min,
        priceMax: pr.max,
        updatedBy: 'admin',
      },
    });
    priceRadarEntries.push(entry);
  }
  console.log(`  ✅ Created ${priceRadarEntries.length} price radar entries`);

  // ─── Create Badges ───
  console.log('🏅 Creating badges...');

  // Active guides (indices 0-6): give them meaningful badges
  const badgeAssignments: { guideIndex: number; badgeType: string }[] = [
    // Hamisi Juma - Vyombo & Electronics specialist
    { guideIndex: 0, badgeType: 'vyombo_specialist' },
    { guideIndex: 0, badgeType: '100_sessions' },
    { guideIndex: 0, badgeType: 'verified_elite' },
    { guideIndex: 0, badgeType: '7_day_streak' },

    // Fatma Hassan - Fabric expert, top rated
    { guideIndex: 1, badgeType: 'fabric_expert' },
    { guideIndex: 1, badgeType: 'top_rated' },
    { guideIndex: 1, badgeType: '100_sessions' },
    { guideIndex: 1, badgeType: 'guide_of_week' },

    // Saidi Mohamed - Spice master
    { guideIndex: 2, badgeType: 'spice_master' },
    { guideIndex: 2, badgeType: '100_sessions' },
    { guideIndex: 2, badgeType: 'verified_elite' },

    // Amina Mzee - Vyombo specialist
    { guideIndex: 3, badgeType: 'vyombo_specialist' },
    { guideIndex: 3, badgeType: '100_sessions' },
    { guideIndex: 3, badgeType: '7_day_streak' },

    // Yusuf Kassim - Electronics pro
    { guideIndex: 4, badgeType: 'electronics_pro' },
    { guideIndex: 4, badgeType: '100_sessions' },
    { guideIndex: 4, badgeType: 'verified_elite' },

    // Mariam Abdallah - All-rounder
    { guideIndex: 5, badgeType: 'verified_elite' },
    { guideIndex: 5, badgeType: '7_day_streak' },

    // Juma Rajabu - Wholesale guru
    { guideIndex: 6, badgeType: 'wholesale_guru' },
  ];

  let badgeCount = 0;
  for (const ba of badgeAssignments) {
    const guide = guides[ba.guideIndex];
    await prisma.badge.create({
      data: {
        guideId: guide.user.id,
        badgeType: ba.badgeType,
      },
    });
    badgeCount++;
  }
  console.log(`  ✅ Created ${badgeCount} badges`);

  // ─── Create Sample Requests ───
  console.log('📋 Creating sample requests...');

  const requestData = [
    {
      seeker: seekers[0],
      description: 'Looking for quality kitchenware - large aluminium pots and stainless steel utensils',
      zoneIds: [vyomboZone.id],
      budget: 80000,
      status: 'completed',
    },
    {
      seeker: seekers[0],
      description: 'Need a good smartphone under 120000 TZS, preferably Samsung or Tecno',
      zoneIds: [electronicsZone.id],
      budget: 120000,
      status: 'active',
    },
    {
      seeker: seekers[1],
      description: 'Want to buy authentic kitenge fabric for making dresses, at least 20 yards total',
      zoneIds: [fabricZone.id],
      budget: 150000,
      status: 'completed',
    },
    {
      seeker: seekers[1],
      description: 'Looking for wholesale spices - cardamom, cinnamon, and cloves for my restaurant',
      zoneIds: [spicesZone.id, wholesaleZone.id],
      budget: 200000,
      status: 'matched',
    },
    {
      seeker: seekers[2],
      description: 'Need bulk rice and cooking oil for a catering event - 10 bags of rice and 5 containers of oil',
      zoneIds: [wholesaleZone.id],
      budget: 500000,
      status: 'open',
    },
  ];

  const createdRequests: Awaited<ReturnType<typeof prisma.request.create>>[] = [];
  for (const rd of requestData) {
    const request = await prisma.request.create({
      data: {
        seekerId: rd.seeker.id,
        description: rd.description,
        zoneIds: JSON.stringify(rd.zoneIds),
        budget: rd.budget,
        status: rd.status,
      },
    });

    // Connect zones to the request (many-to-many)
    await prisma.request.update({
      where: { id: request.id },
      data: {
        zones: {
          connect: rd.zoneIds.map(zid => ({ id: zid })),
        },
      },
    });

    createdRequests.push(request);
  }
  console.log(`  ✅ Created ${createdRequests.length} sample requests`);

  // ─── Create Sample Sessions ───
  console.log('🔗 Creating sample sessions...');

  // Session 1: Completed session with Sarah and Hamisi
  const session1 = await prisma.session.create({
    data: {
      requestId: createdRequests[0].id,
      guideId: guides[0].user.id,
      seekerId: seekers[0].id,
      sessionCode: 'KRK-2024-001',
      startedAt: new Date('2024-12-15T09:00:00Z'),
      completedAt: new Date('2024-12-15T11:30:00Z'),
      escrowStatus: 'released',
      amount: 15000,
      platformFee: 1500,
      ratingSeeker: 5.0,
      ratingGuide: 4.0,
      reviewSeeker: 'Hamisi was amazing! Found me the best deals on pots and saved me so much money.',
      reviewGuide: 'Sarah was a great client, knew what she wanted.',
      seekerConfirmed: true,
      guideConfirmed: true,
    },
  });

  // Session 2: Completed session with Marco and Fatma
  const session2 = await prisma.session.create({
    data: {
      requestId: createdRequests[2].id,
      guideId: guides[1].user.id,
      seekerId: seekers[1].id,
      sessionCode: 'KRK-2024-002',
      startedAt: new Date('2024-12-16T10:00:00Z'),
      completedAt: new Date('2024-12-16T12:45:00Z'),
      escrowStatus: 'released',
      amount: 20000,
      platformFee: 2000,
      ratingSeeker: 5.0,
      ratingGuide: 5.0,
      reviewSeeker: 'Fatma has incredible knowledge of fabrics! She helped me find the perfect kitenge.',
      reviewGuide: 'Marco was very respectful and a pleasure to guide.',
      seekerConfirmed: true,
      guideConfirmed: true,
    },
  });

  // Session 3: Active session with Marco and Saidi
  const session3 = await prisma.session.create({
    data: {
      requestId: createdRequests[3].id,
      guideId: guides[2].user.id,
      seekerId: seekers[1].id,
      sessionCode: 'KRK-2024-003',
      startedAt: new Date('2024-12-17T14:00:00Z'),
      escrowStatus: 'held',
      amount: 25000,
      platformFee: 2500,
      seekerConfirmed: true,
      guideConfirmed: true,
    },
  });

  // Add some messages to active session
  await Promise.all([
    prisma.message.create({
      data: {
        sessionId: session3.id,
        senderId: seekers[1].id,
        content: 'Hi Saidi! I need about 2kg of cardamom, 3kg cinnamon sticks, and 1kg cloves. What are the best prices?',
      },
    }),
    prisma.message.create({
      data: {
        sessionId: session3.id,
        senderId: guides[2].user.id,
        content: 'Karibu Marco! I know exactly where to find the freshest spices. Let me take you to Zanzibar Aromatics first - they have the best cardamom in Kariakoo.',
      },
    }),
    prisma.message.create({
      data: {
        sessionId: session3.id,
        senderId: seekers[1].id,
        content: 'Sounds great! Do they also have bulk pricing?',
        translatedContent: 'Inasikia vizuri! Je, wana bei ya jumla pia?',
      },
    }),
    prisma.message.create({
      data: {
        sessionId: session3.id,
        senderId: guides[2].user.id,
        content: 'Ndiyo, bei ya jumla ipo! Nitakujengea mpango wa bei nzuri.',
        translatedContent: 'Yes, bulk pricing is available! I will negotiate a good price deal for you.',
      },
    }),
  ]);

  console.log('  ✅ Created 3 sample sessions with messages');

  // ─── Create Payouts ───
  console.log('💰 Creating sample payouts...');

  const payoutData = [
    {
      guide: guides[0], // Hamisi
      amount: 120000,
      status: 'processed',
      mobileMoney: '+255712000001',
      processedAt: new Date('2024-12-20T10:00:00Z'),
    },
    {
      guide: guides[1], // Fatma
      amount: 95000,
      status: 'processed',
      mobileMoney: '+255712000002',
      processedAt: new Date('2024-12-20T10:00:00Z'),
    },
    {
      guide: guides[2], // Saidi
      amount: 25000,
      status: 'pending',
      mobileMoney: '+255712000003',
    },
    {
      guide: guides[3], // Amina
      amount: 80000,
      status: 'processed',
      mobileMoney: '+255712000004',
      processedAt: new Date('2024-12-18T14:00:00Z'),
    },
    {
      guide: guides[4], // Yusuf
      amount: 65000,
      status: 'failed',
      mobileMoney: '+255712000005',
    },
  ];

  let payoutCount = 0;
  for (const pd of payoutData) {
    await prisma.payout.create({
      data: {
        guideId: pd.guide.user.id,
        amount: pd.amount,
        status: pd.status,
        mobileMoneyNumber: pd.mobileMoney,
        processedAt: pd.processedAt || null,
      },
    });
    payoutCount++;
  }
  console.log(`  ✅ Created ${payoutCount} payouts`);

  // ─── Feature: Exchange Rates (18) ───
  console.log('💱 Creating exchange rates...');
  const exchangeRates = await Promise.all([
    prisma.exchangeRate.create({ data: { currency: 'USD', rate: 2580 } }),
    prisma.exchangeRate.create({ data: { currency: 'EUR', rate: 2800 } }),
    prisma.exchangeRate.create({ data: { currency: 'KES', rate: 19.8 } }),
    prisma.exchangeRate.create({ data: { currency: 'UGX', rate: 0.69 } }),
  ]);
  console.log(`  ✅ Created ${exchangeRates.length} exchange rates`);

  // ─── Feature: Vendor Verifications (4) ───
  console.log('✅ Creating vendor verifications...');
  const vendorVerifications = await Promise.all([
    prisma.vendorVerification.create({
      data: { vendorId: vendors[0].id, isVerified: true, verifiedAt: new Date('2024-11-01'), expiresAt: new Date('2025-11-01'), monthlyFee: 5000, qrCode: 'QR-V-101' },
    }),
    prisma.vendorVerification.create({
      data: { vendorId: vendors[8].id, isVerified: true, verifiedAt: new Date('2024-10-15'), expiresAt: new Date('2025-10-15'), monthlyFee: 10000, qrCode: 'QR-F-301' },
    }),
    prisma.vendorVerification.create({
      data: { vendorId: vendors[16].id, isVerified: true, verifiedAt: new Date('2024-09-01'), expiresAt: new Date('2025-09-01'), monthlyFee: 7500, qrCode: 'QR-W-501' },
    }),
    prisma.vendorVerification.create({
      data: { vendorId: vendors[4].id, isVerified: false, monthlyFee: 5000 },
    }),
  ]);
  console.log(`  ✅ Created ${vendorVerifications.length} vendor verifications`);

  // ─── Feature: Guide Subscriptions (5) ───
  console.log('📋 Creating guide subscriptions...');
  const subscriptions = await Promise.all([
    prisma.guideSubscription.create({ data: { guideId: guides[0].user.id, tier: 'elite', autoRenew: true } }),
    prisma.guideSubscription.create({ data: { guideId: guides[1].user.id, tier: 'elite', autoRenew: true } }),
    prisma.guideSubscription.create({ data: { guideId: guides[2].user.id, tier: 'pro', autoRenew: true } }),
    prisma.guideSubscription.create({ data: { guideId: guides[3].user.id, tier: 'pro', autoRenew: false } }),
    prisma.guideSubscription.create({ data: { guideId: guides[4].user.id, tier: 'starter' } }),
  ]);
  console.log(`  ✅ Created ${subscriptions.length} guide subscriptions`);

  // ─── Feature: Package Deals (6) ───
  console.log('📦 Creating package deals...');
  const packageDeals = await Promise.all([
    prisma.packageDeal.create({
      data: { guideId: guides[0].user.id, title: 'Kitchenware Safari', description: 'Complete kitchen shopping tour with delivery', duration: 3, zoneIds: JSON.stringify([zones[0].id]), price: 45000, includesDelivery: true, sessionsCompleted: 23 },
    }),
    prisma.packageDeal.create({
      data: { guideId: guides[1].user.id, title: 'Textile Treasure Hunt', description: 'Best fabric deals with quality assurance', duration: 2.5, zoneIds: JSON.stringify([zones[2].id, zones[4].id]), price: 35000, includesDelivery: false, sessionsCompleted: 18 },
    }),
    prisma.packageDeal.create({
      data: { guideId: guides[2].user.id, title: 'Spice Route Experience', description: 'Aromatic journey through Kariakoo spices', duration: 2, zoneIds: JSON.stringify([zones[3].id]), price: 25000, includesDelivery: false, sessionsCompleted: 12 },
    }),
    prisma.packageDeal.create({
      data: { guideId: guides[5].user.id, title: 'Full Kariakoo Experience', description: 'All zones tour with lunch break and delivery', duration: 5, zoneIds: JSON.stringify(zones.map(z => z.id)), price: 85000, includesDelivery: true, sessionsCompleted: 31 },
    }),
    prisma.packageDeal.create({
      data: { guideId: guides[6].user.id, title: 'Wholesale Bulk Buy', description: 'Best wholesale deals with airport delivery', duration: 3, zoneIds: JSON.stringify([zones[4].id]), price: 55000, includesDelivery: true, sessionsCompleted: 9 },
    }),
    prisma.packageDeal.create({
      data: { guideId: guides[4].user.id, title: 'Electronics Expo', description: 'Gadgets and tech tour with warranty assistance', duration: 2, zoneIds: JSON.stringify([zones[1].id]), price: 30000, includesDelivery: false, sessionsCompleted: 15 },
    }),
  ]);
  console.log(`  ✅ Created ${packageDeals.length} package deals`);

  // ─── Feature: Session Recording (2) ───
  console.log('🎙️ Creating session recordings...');
  await Promise.all([
    prisma.sessionRecording.create({
      data: { sessionId: session1.id, isRecording: false, guideConsent: true, seekerConsent: true, duration: 9000, storageUrl: '/recordings/KRK-2024-001.webm', expiresAt: new Date(Date.now() + 30 * 86400000) },
    }),
    prisma.sessionRecording.create({
      data: { sessionId: session2.id, isRecording: false, guideConsent: true, seekerConsent: true, duration: 9900, storageUrl: '/recordings/KRK-2024-002.webm', expiresAt: new Date(Date.now() + 30 * 86400000) },
    }),
  ]);
  console.log('  ✅ Created 2 session recordings');

  // ─── Feature: Buddy Matches (1) ───
  console.log('👥 Creating buddy matches...');
  await prisma.buddyMatch.create({
    data: { seeker1Id: seekers[0].id, seeker2Id: seekers[2].id, zoneId: vyomboZone.id, timeSlot: '2025-01-15T10:00:00Z', guideId: guides[3].user.id, status: 'completed' },
  });
  console.log('  ✅ Created 1 buddy match');

  // ─── Feature: Nav Waypoints (10) ───
  console.log('🧭 Creating navigation waypoints...');
  const waypointData = [
    { zone: vyomboZone, label: 'Junction A1', labelSw: 'Kivuko A1', type: 'junction', x: 25, y: 30 },
    { zone: vyomboZone, label: "Mama Kitenge's Stall", labelSw: 'Stendi ya Mama Kitenge', type: 'stall', x: 35, y: 45 },
    { zone: electronicsZone, label: 'Junction B1', labelSw: 'Kivuko B1', type: 'junction', x: 55, y: 25 },
    { zone: electronicsZone, label: 'Tech Hub Entry', labelSw: 'Mlango wa Tech Hub', type: 'landmark', x: 60, y: 40 },
    { zone: fabricZone, label: 'Junction C1', labelSw: 'Kivuko C1', type: 'junction', x: 15, y: 50 },
    { zone: fabricZone, label: 'Textile Row Exit', labelSw: 'Toka Njia ya Vitambaa', type: 'exit', x: 20, y: 65 },
    { zone: spicesZone, label: 'Junction D1', labelSw: 'Kivuko D1', type: 'junction', x: 45, y: 70 },
    { zone: spicesZone, label: 'Aromatics Corner', labelSw: 'Kona ya Manukato', type: 'landmark', x: 50, y: 80 },
    { zone: wholesaleZone, label: 'Junction E1', labelSw: 'Kivuko E1', type: 'junction', x: 75, y: 60 },
    { zone: wholesaleZone, label: 'Main Exit', labelSw: 'Toka Kuu', type: 'exit', x: 85, y: 75 },
  ];
  for (const wp of waypointData) {
    await prisma.navWaypoint.create({
      data: { zoneId: wp.zone.id, label: wp.label, labelSw: wp.labelSw, type: wp.type, floorPlanX: wp.x, floorPlanY: wp.y, directions: JSON.stringify({}) },
    });
  }
  console.log(`  ✅ Created ${waypointData.length} navigation waypoints`);

  // ─── Feature: Market Stories (5) ───
  console.log('📖 Creating market stories...');
  const stories = await Promise.all([
    prisma.marketStory.create({
      data: { guideId: guides[0].user.id, vendorId: vendors[0].id, zoneId: vyomboZone.id, title: 'The Copper Pot Legacy', content: 'Mzee Juma has been selling copper pots here since 1987. His grandmother started this stall after independence, and the craftsmanship has been passed down three generations. Every pot is hand-hammered using traditional techniques.', tags: JSON.stringify(['history', 'copper', 'tradition']), isPublic: true },
    }),
    prisma.marketStory.create({
      data: { guideId: guides[1].user.id, vendorId: vendors[8].id, zoneId: fabricZone.id, title: 'The Secret of Kitenge Patterns', content: 'Each kitenge pattern tells a story. The "Khanga" pattern was originally used to send messages between women. The patterns you see in Kariakoo today still carry these hidden meanings - from wedding blessings to political statements.', tags: JSON.stringify(['culture', 'fabric', 'patterns']), isPublic: true },
    }),
    prisma.marketStory.create({
      data: { guideId: guides[2].user.id, vendorId: vendors[13].id, zoneId: spicesZone.id, title: 'Zanzibar Spice Route', content: 'The spices in Kariakoo arrived via the ancient trade routes from Zanzibar. Many of the vendors here are descendants of the original spice traders who sailed the Indian Ocean centuries ago.', tags: JSON.stringify(['spices', 'history', 'zanzibar']), isPublic: true },
    }),
    prisma.marketStory.create({
      data: { guideId: guides[5].user.id, zoneId: wholesaleZone.id, title: 'The Wholesale Secrets', content: 'The best wholesale deals happen before 8 AM. That is when the truck deliveries arrive fresh from the port. Smart buyers know to arrive early for first pick of the new stock.', tags: JSON.stringify(['tips', 'wholesale', 'timing']), isPublic: true },
    }),
    prisma.marketStory.create({
      data: { guideId: guides[4].user.id, vendorId: vendors[4].id, zoneId: electronicsZone.id, title: 'Phone Market Survival Guide', content: 'Not all phones in Kariakoo are genuine. Learn the "IMEI check" trick: dial *#06# to verify the serial number matches the box. Authentic vendors will let you check before buying.', tags: JSON.stringify(['electronics', 'tips', 'safety']), isPublic: true },
    }),
  ]);
  console.log(`  ✅ Created ${stories.length} market stories`);

  // ─── Feature: Mentorships (1) ───
  console.log('🎓 Creating mentorships...');
  await prisma.mentorship.create({
    data: { mentorId: guides[0].user.id, menteeId: guides[7].user.id, status: 'active', sessionsDone: 2, sessionsRequired: 5, bonusPercent: 0.03 },
  });
  console.log('  ✅ Created 1 mentorship');

  // ─── Feature: Seasonal Events (4) ───
  console.log('📅 Creating seasonal events...');
  const seasonalEvents = await Promise.all([
    prisma.seasonalEvent.create({
      data: { title: 'Ramadan Prep Season', titleSw: 'Msimu wa Maandalizi ya Ramadhani', description: 'Spices zone is busiest during Ramadan preparation. Book early for the best deals on cardamom, cloves, and dates.', type: 'religious', startDate: new Date('2025-02-15'), endDate: new Date('2025-03-15'), affectedZones: JSON.stringify([zones[3].id]), insiderTip: 'Visit spices zone at 7 AM before the crowds arrive for freshest stock.', insiderTipSw: 'Tembelea eneo la viungo saa 1 asubuhi kabla ya msongamano kwa bidhaa safi zaidi.' },
    }),
    prisma.seasonalEvent.create({
      data: { title: 'Kwanzaa Export Season', titleSw: 'Msimu wa Usafirishaji wa Kwanzaa', description: 'Best wholesale deals on fabrics and crafts. International buyers flock for Kwanzaa gifts and decorations.', type: 'cultural', startDate: new Date('2025-12-01'), endDate: new Date('2025-12-26'), affectedZones: JSON.stringify([zones[2].id, zones[4].id]), insiderTip: 'Buy fabrics in bulk on weekdays for 20% lower prices than weekends.', insiderTipSw: 'Nunua vitambaa kwa wingi siku za kazi kwa bei ndogo 20% kuliko wikiendi.' },
    }),
    prisma.seasonalEvent.create({
      data: { title: 'Dar es Salaam Trade Fair', titleSw: 'Maonyesho ya Biashara ya Dar es Salaam', description: 'Annual trade fair brings extra visitors to Kariakoo. Electronics and wholesale zones see massive discounts.', type: 'commercial', startDate: new Date('2025-07-01'), endDate: new Date('2025-07-15'), affectedZones: JSON.stringify([zones[1].id, zones[4].id]), insiderTip: 'Vendors are willing to negotiate more during the fair to move volume.', insiderTipSw: 'Wauzaji wanakubali kujadili zaidi wakati wa maonyesho ili kuuzia haraka.' },
    }),
    prisma.seasonalEvent.create({
      data: { title: 'Harvest Season Bulk Sales', titleSw: 'Mauzo ya Jumla ya Mavuno', description: 'Post-harvest season brings the cheapest wholesale prices on rice, flour, and cooking oil.', type: 'seasonal', startDate: new Date('2025-09-01'), endDate: new Date('2025-11-30'), affectedZones: JSON.stringify([zones[4].id]), insiderTip: 'Prices drop further in October when the second harvest arrives.', insiderTipSw: 'Bei zinashuka zaidi Oktoba wakati mavuno ya pili yanapowasili.' },
    }),
  ]);
  console.log(`  ✅ Created ${seasonalEvents.length} seasonal events`);

  // ─── Feature: Fraud Alerts (3) ───
  console.log('🚨 Creating fraud alerts...');
  const fraudAlerts = await Promise.all([
    prisma.fraudAlert.create({
      data: { entityType: 'guide', entityId: guides[9].user.id, alertType: 'fast_completion', confidence: 0.85, details: JSON.stringify({ avgSessionDuration: '12 minutes', threshold: '30 minutes', sessionCount: 5 }), status: 'pending' },
    }),
    prisma.fraudAlert.create({
      data: { entityType: 'seeker', entityId: seekers[2].id, alertType: 'serial_disputer', confidence: 0.72, details: JSON.stringify({ disputeRate: '60%', totalSessions: 5, disputesFiled: 3 }), status: 'pending' },
    }),
    prisma.fraudAlert.create({
      data: { entityType: 'vendor', entityId: vendors[4].id, alertType: 'recommendation_spike', confidence: 0.65, details: JSON.stringify({ previousRecs: 23, currentRecs: 67, spikePercent: '191%' }), status: 'investigated' },
    }),
  ]);
  console.log(`  ✅ Created ${fraudAlerts.length} fraud alerts`);

  // ─── Summary ───
  console.log('\n🎉 Seed completed successfully!');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(`  Zones:         ${zones.length}`);
  console.log(`  Admin:         1`);
  console.log(`  Seekers:       ${seekers.length}`);
  console.log(`  Guides:        ${guides.length} (7 active, 2 pending, 1 suspended)`);
  console.log(`  Vendors:       ${vendors.length}`);
  console.log(`  Price Radar:   ${priceRadarEntries.length}`);
  console.log(`  Badges:        ${badgeCount}`);
  console.log(`  Requests:      ${createdRequests.length}`);
  console.log(`  Sessions:      3`);
  console.log(`  Messages:      4`);
  console.log(`  Payouts:       ${payoutCount}`);
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

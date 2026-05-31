import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding Kariako Guide database...');

  // ── Create Zones ──
  const electronics = await prisma.zone.upsert({
    where: { id: 'zone-electronics' },
    update: {},
    create: {
      id: 'zone-electronics',
      name: 'Electronics Zone',
      nameSw: 'Eneo la Elektroniki',
      description: 'The tech hub of Kariakoo — phones, accessories, gadgets & expert repairs.',
      color: '#0077B6',
    },
  });

  const fabrics = await prisma.zone.upsert({
    where: { id: 'zone-fabrics' },
    update: {},
    create: {
      id: 'zone-fabrics',
      name: 'Fabrics Zone',
      nameSw: 'Eneo la Vitenge',
      description: 'Vibrant textiles — kanga, kitenge, lace, silk & custom tailoring.',
      color: '#8A2BE2',
    },
  });

  const wholesale = await prisma.zone.upsert({
    where: { id: 'zone-wholesale' },
    update: {},
    create: {
      id: 'zone-wholesale',
      name: 'Wholesale Zone',
      nameSw: 'Eneo la Jumla',
      description: 'Bulk buying paradise — rice, oil, sugar & household supplies by the sack.',
      color: '#14B8A6',
    },
  });

  const spices = await prisma.zone.upsert({
    where: { id: 'zone-spices' },
    update: {},
    create: {
      id: 'zone-spices',
      name: 'Spices Zone',
      nameSw: 'Eneo la Viungo',
      description: 'Aromatic treasures — turmeric, cardamom, cinnamon, cloves & herbal remedies.',
      color: '#EF4444',
    },
  });

  const kitchenware = await prisma.zone.upsert({
    where: { id: 'zone-kitchenware' },
    update: {},
    create: {
      id: 'zone-kitchenware',
      name: 'Kitchenware Zone',
      nameSw: 'Eneo la Chombo',
      description: 'Everything for the kitchen — pots, pans, utensils & home essentials.',
      color: '#FFA500',
    },
  });

  const artisanal = await prisma.zone.upsert({
    where: { id: 'zone-artisanal' },
    update: {},
    create: {
      id: 'zone-artisanal',
      name: 'Artisanal Zone',
      nameSw: 'Eneo la Kisanii',
      description: 'Handcrafted treasures — baskets, carvings, jewelry & traditional crafts.',
      color: '#8B5E3C',
    },
  });

  console.log('✅ Zones created');

  // ── Create Vendors ──
  const vendorData = [
    { id: 'v1', name: 'Zaki Electronics', zoneId: electronics.id, categories: '["Phones","Accessories","Repairs"]', stallNumber: 'A-12', contact: '+255712001234', recommendations: 234, approved: true, openHours: '8:00-19:00' },
    { id: 'v2', name: 'Mama Kanga Shop', zoneId: fabrics.id, categories: '["Kanga","Kitenge","Lace"]', stallNumber: 'B-45', contact: '+255716007890', recommendations: 312, approved: true, openHours: '7:00-18:00' },
    { id: 'v3', name: 'Al-Falah Wholesale', zoneId: wholesale.id, categories: '["Rice","Oil","Sugar","Bulk"]', stallNumber: 'C-08', contact: '+255720003456', recommendations: 267, approved: true, openHours: '6:00-17:00' },
    { id: 'v4', name: 'Spice Paradise', zoneId: spices.id, categories: '["Spices","Herbs","Tea"]', stallNumber: 'D-22', contact: '+255722001234', recommendations: 178, approved: false, openHours: '8:00-17:00' },
    { id: 'v5', name: 'Kitchen World', zoneId: kitchenware.id, categories: '["Kitchen","Home","Cookware"]', stallNumber: 'E-15', contact: '+255724009012', recommendations: 145, approved: true, openHours: '8:00-18:00' },
    { id: 'v6', name: 'Craft Masters', zoneId: artisanal.id, categories: '["Crafts","Carvings","Jewelry"]', stallNumber: 'F-08', contact: '+255726007890', recommendations: 98, approved: true, openHours: '9:00-17:00' },
    { id: 'v10', name: 'Digital World', zoneId: electronics.id, categories: '["Gadgets","Phones"]', stallNumber: 'A-28', contact: '+255713005678', recommendations: 156, approved: true, openHours: '8:30-18:30' },
    { id: 'v20', name: 'Kitenge Palace', zoneId: fabrics.id, categories: '["Kitenge","Fashion"]', stallNumber: 'B-12', contact: '+255717001234', recommendations: 278, approved: true, openHours: '7:30-18:30' },
    { id: 'v30', name: 'Grain Masters', zoneId: wholesale.id, categories: '["Grains","Bulk"]', stallNumber: 'C-22', contact: '+255721007890', recommendations: 189, approved: true, openHours: '6:00-16:30' },
    { id: 'v40', name: 'Zanzibar Spice House', zoneId: spices.id, categories: '["Spices","Tea"]', stallNumber: 'D-05', contact: '+255723005678', recommendations: 210, approved: true, openHours: '7:30-17:30' },
    { id: 'v50', name: 'Home Essentials', zoneId: kitchenware.id, categories: '["Home","Kitchen"]', stallNumber: 'E-30', contact: '+255725003456', recommendations: 112, approved: false, openHours: '8:30-18:30' },
    { id: 'v60', name: 'Basket Weavers', zoneId: artisanal.id, categories: '["Baskets","Crafts"]', stallNumber: 'F-12', contact: '+255727001234', recommendations: 76, approved: false, openHours: '9:00-16:00' },
  ];

  for (const v of vendorData) {
    await prisma.vendor.upsert({
      where: { id: v.id },
      update: {},
      create: v,
    });
  }
  console.log('✅ Vendors created');

  // ── Create Price Radar entries ──
  const priceData = [
    { category: 'Electronics', zoneId: electronics.id, priceMin: 450000, priceMax: 550000, updatedBy: 'admin' },
    { category: 'Electronics', zoneId: electronics.id, priceMin: 2800000, priceMax: 3200000, updatedBy: 'admin' },
    { category: 'Electronics', zoneId: electronics.id, priceMin: 25000, priceMax: 40000, updatedBy: 'admin' },
    { category: 'Electronics', zoneId: electronics.id, priceMin: 25000, priceMax: 35000, updatedBy: 'guide' },
    { category: 'Fabrics', zoneId: fabrics.id, priceMin: 15000, priceMax: 25000, updatedBy: 'admin' },
    { category: 'Fabrics', zoneId: fabrics.id, priceMin: 35000, priceMax: 55000, updatedBy: 'admin' },
    { category: 'Fabrics', zoneId: fabrics.id, priceMin: 8000, priceMax: 15000, updatedBy: 'guide' },
    { category: 'Wholesale', zoneId: wholesale.id, priceMin: 65000, priceMax: 80000, updatedBy: 'admin' },
    { category: 'Wholesale', zoneId: wholesale.id, priceMin: 58000, priceMax: 68000, updatedBy: 'guide' },
    { category: 'Wholesale', zoneId: wholesale.id, priceMin: 120000, priceMax: 140000, updatedBy: 'admin' },
    { category: 'Spices', zoneId: spices.id, priceMin: 8000, priceMax: 12000, updatedBy: 'admin' },
    { category: 'Spices', zoneId: spices.id, priceMin: 5000, priceMax: 8000, updatedBy: 'admin' },
    { category: 'Kitchenware', zoneId: kitchenware.id, priceMin: 45000, priceMax: 65000, updatedBy: 'admin' },
    { category: 'Artisanal', zoneId: artisanal.id, priceMin: 12000, priceMax: 20000, updatedBy: 'guide' },
  ];

  for (const p of priceData) {
    await prisma.priceRadar.create({ data: p });
  }
  console.log('✅ Price Radar entries created');

  // ── Create Exchange Rates ──
  const rates = [
    { currency: 'USD', rate: 2580 },
    { currency: 'EUR', rate: 2800 },
    { currency: 'KES', rate: 17.8 },
    { currency: 'UGX', rate: 0.69 },
  ];

  for (const r of rates) {
    await prisma.exchangeRate.upsert({
      where: { currency: r.currency },
      update: { rate: r.rate },
      create: r,
    });
  }
  console.log('✅ Exchange rates created');

  // ── Create Seasonal Events ──
  const events = [
    { title: 'Ramadan Market Rush', titleSw: 'Msako wa Soko wa Ramadhani', type: 'religious', startDate: new Date('2026-03-01'), endDate: new Date('2026-03-30'), affectedZones: '["zone-electronics","zone-fabrics","zone-wholesale","zone-spices","zone-kitchenware","zone-artisanal"]', insiderTip: 'Best time for wholesale deals before Eid. Go early morning (6-7am) for first pick.', insiderTipSw: 'Wakati bora kwa mikataba ya jumla kabla ya Eid. Nenda asubuhi (6-7am) kwa chaguo la kwanza.' },
    { title: 'Kariakoo Fabric Festival', titleSw: 'Tamasha la Vitenge la Kariakoo', type: 'cultural', startDate: new Date('2026-06-15'), endDate: new Date('2026-06-17'), affectedZones: '["zone-fabrics"]', insiderTip: 'Hand-drawn kitenge demos by master artisans. Don\'t miss the fashion show on Day 2!', insiderTipSw: 'Maonyesho ya kitenge ya mkono na mafundi bora. Usikose maonyesho ya mitindo Siku ya 2!' },
    { title: 'Harvest Season Opening', titleSw: 'Funguo la Msimu wa Mavuno', type: 'seasonal', startDate: new Date('2026-08-01'), endDate: new Date('2026-08-31'), affectedZones: '["zone-spices","zone-wholesale"]', insiderTip: 'Fresh spice imports from Zanzibar arrive. Buy turmeric and cardamom now before prices rise.', insiderTipSw: 'Viungo safi kutoka Zanzibar vinafika. Nunua haldi na iliki sasa kabla bei haijapanda.' },
    { title: 'Diwali Market', titleSw: 'Soko la Diwali', type: 'cultural', startDate: new Date('2026-10-20'), endDate: new Date('2026-10-25'), affectedZones: '["zone-fabrics","zone-kitchenware"]', insiderTip: 'Indian textile imports at wholesale prices. Look for the special Diwali collection at Stall B-12.', insiderTipSw: 'Nguo za Kihindi kwa bei za jumla. Tafuta mkusanyiko maalum wa Diwali kwenye Duka B-12.' },
  ];

  for (const e of events) {
    await prisma.seasonalEvent.create({ data: e });
  }
  console.log('✅ Seasonal events created');

  console.log('🎉 Seed complete!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

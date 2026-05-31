import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

const SEED_ESTIMATES = [
  { category: 'Electronics', zoneId: 'zone-electronics', itemName: 'Smartphone (mid-range)', estimatedMin: 250000, estimatedMax: 450000, fairPrice: 350000, confidence: 0.85, dataPoints: 24, sources: '{"priceRadar": true, "vendorReports": true, "aiEstimate": true}' },
  { category: 'Electronics', zoneId: 'zone-electronics', itemName: 'Phone case', estimatedMin: 3000, estimatedMax: 8000, fairPrice: 5000, confidence: 0.92, dataPoints: 31, sources: '{"priceRadar": true, "vendorReports": true, "aiEstimate": true}' },
  { category: 'Electronics', zoneId: 'zone-electronics', itemName: 'Bluetooth speaker', estimatedMin: 25000, estimatedMax: 55000, fairPrice: 35000, confidence: 0.78, dataPoints: 18, sources: '{"priceRadar": true, "vendorReports": false, "aiEstimate": true}' },
  { category: 'Fabrics', zoneId: 'zone-fabrics', itemName: 'Kanga fabric', estimatedMin: 5000, estimatedMax: 20000, fairPrice: 12000, confidence: 0.91, dataPoints: 42, sources: '{"priceRadar": true, "vendorReports": true, "aiEstimate": true}' },
  { category: 'Fabrics', zoneId: 'zone-fabrics', itemName: 'Kitenge fabric', estimatedMin: 8000, estimatedMax: 30000, fairPrice: 18000, confidence: 0.88, dataPoints: 35, sources: '{"priceRadar": true, "vendorReports": true, "aiEstimate": true}' },
  { category: 'Fabrics', zoneId: 'zone-fabrics', itemName: 'Lace fabric', estimatedMin: 12000, estimatedMax: 45000, fairPrice: 25000, confidence: 0.75, dataPoints: 15, sources: '{"priceRadar": true, "vendorReports": false, "aiEstimate": true}' },
  { category: 'Wholesale', zoneId: 'zone-wholesale', itemName: 'Basmati rice (25kg)', estimatedMin: 55000, estimatedMax: 75000, fairPrice: 65000, confidence: 0.89, dataPoints: 28, sources: '{"priceRadar": true, "vendorReports": true, "aiEstimate": true}' },
  { category: 'Wholesale', zoneId: 'zone-wholesale', itemName: 'Cooking oil (5L)', estimatedMin: 18000, estimatedMax: 25000, fairPrice: 21000, confidence: 0.93, dataPoints: 36, sources: '{"priceRadar": true, "vendorReports": true, "aiEstimate": true}' },
  { category: 'Spices', zoneId: 'zone-spices', itemName: 'Turmeric (pack)', estimatedMin: 3000, estimatedMax: 7000, fairPrice: 4500, confidence: 0.87, dataPoints: 22, sources: '{"priceRadar": true, "vendorReports": true, "aiEstimate": true}' },
  { category: 'Spices', zoneId: 'zone-spices', itemName: 'Cardamom (pack)', estimatedMin: 8000, estimatedMax: 18000, fairPrice: 12000, confidence: 0.82, dataPoints: 19, sources: '{"priceRadar": true, "vendorReports": true, "aiEstimate": true}' },
  { category: 'Spices', zoneId: 'zone-spices', itemName: 'Cinnamon (pack)', estimatedMin: 4000, estimatedMax: 9000, fairPrice: 6000, confidence: 0.85, dataPoints: 20, sources: '{"priceRadar": true, "vendorReports": false, "aiEstimate": true}' },
  { category: 'Kitchenware', zoneId: 'zone-kitchenware', itemName: 'Sufuria set (3 pcs)', estimatedMin: 15000, estimatedMax: 35000, fairPrice: 22000, confidence: 0.80, dataPoints: 16, sources: '{"priceRadar": true, "vendorReports": true, "aiEstimate": true}' },
  { category: 'Kitchenware', zoneId: 'zone-kitchenware', itemName: 'Plates set (6 pcs)', estimatedMin: 8000, estimatedMax: 18000, fairPrice: 12000, confidence: 0.83, dataPoints: 14, sources: '{"priceRadar": true, "vendorReports": true, "aiEstimate": true}' },
  { category: 'Artisanal', zoneId: 'zone-artisanal', itemName: 'Tanzanite (small)', estimatedMin: 50000, estimatedMax: 200000, fairPrice: 100000, confidence: 0.65, dataPoints: 8, sources: '{"priceRadar": false, "vendorReports": true, "aiEstimate": true}' },
  { category: 'Artisanal', zoneId: 'zone-artisanal', itemName: 'Maasai beaded necklace', estimatedMin: 5000, estimatedMax: 25000, fairPrice: 12000, confidence: 0.79, dataPoints: 17, sources: '{"priceRadar": true, "vendorReports": true, "aiEstimate": true}' },
  { category: 'Artisanal', zoneId: 'zone-artisanal', itemName: 'Ebony carving', estimatedMin: 10000, estimatedMax: 60000, fairPrice: 28000, confidence: 0.72, dataPoints: 12, sources: '{"priceRadar": true, "vendorReports": false, "aiEstimate": true}' },
  { category: 'Electronics', zoneId: 'zone-electronics', itemName: 'USB cable', estimatedMin: 2000, estimatedMax: 5000, fairPrice: 3000, confidence: 0.94, dataPoints: 40, sources: '{"priceRadar": true, "vendorReports": true, "aiEstimate": true}' },
  { category: 'Fabrics', zoneId: 'zone-fabrics', itemName: 'Silk fabric (per yard)', estimatedMin: 20000, estimatedMax: 60000, fairPrice: 35000, confidence: 0.70, dataPoints: 10, sources: '{"priceRadar": false, "vendorReports": true, "aiEstimate": true}' },
];

export async function POST() {
  try {
    let created = 0;
    for (const est of SEED_ESTIMATES) {
      const existing = await db.priceEstimate.findFirst({
        where: { itemName: est.itemName, zoneId: est.zoneId },
      });
      if (!existing) {
        await db.priceEstimate.create({ data: est });
        created++;
      }
    }
    return NextResponse.json({ success: true, created, total: SEED_ESTIMATES.length });
  } catch (error) {
    console.error('Seed price estimates error:', error);
    return NextResponse.json({ success: false, error: 'Failed to seed' }, { status: 500 });
  }
}

import { NextResponse } from 'next/server';
import { DEMO_REWARDS } from '@/lib/loyalty-data';

export async function GET() {
  try {
    // Return demo rewards (in production, these would come from DB)
    return NextResponse.json({ rewards: DEMO_REWARDS });
  } catch (error) {
    console.error('[Loyalty Rewards] Error:', error);
    return NextResponse.json({ rewards: DEMO_REWARDS });
  }
}

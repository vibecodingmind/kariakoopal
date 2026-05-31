import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { userId, actions } = body;

    if (!userId || !actions) {
      return NextResponse.json({ error: 'userId and actions required' }, { status: 400 });
    }

    const results: Array<{ action: string; success: boolean; error?: string }> = [];

    for (const action of actions) {
      try {
        switch (action.type) {
          case 'favorite': {
            const existing = await db.favorite.findFirst({
              where: { userId, targetId: action.targetId, targetType: action.targetType, collection: action.collection || 'default' },
            });
            if (!existing) {
              await db.favorite.create({
                data: { userId, targetId: action.targetId, targetType: action.targetType, collection: action.collection || 'default', note: action.note || '' },
              });
            }
            results.push({ action: action.type, success: true });
            break;
          }
          case 'booking': {
            // Store as a request for matching
            await db.request.create({
              data: {
                seekerId: userId,
                description: action.description || 'Offline booking sync',
                zoneIds: JSON.stringify(action.zoneIds || []),
                budget: action.budget || 0,
              },
            });
            results.push({ action: action.type, success: true });
            break;
          }
          default:
            results.push({ action: action.type, success: false, error: 'Unknown action type' });
        }
      } catch (err) {
        results.push({ action: action.type, success: false, error: String(err) });
      }
    }

    return NextResponse.json({ synced: results.length, results });
  } catch (error) {
    console.error('Offline sync POST error:', error);
    return NextResponse.json({ error: 'Failed to sync' }, { status: 500 });
  }
}

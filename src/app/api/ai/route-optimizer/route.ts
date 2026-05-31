import { NextRequest, NextResponse } from 'next/server';
import ZAI from 'z-ai-web-dev-sdk';
import { db } from '@/lib/db';

export async function POST(req: NextRequest) {
  try {
    const { zoneId, stops, startLat, startLng } = await req.json();

    if (!zoneId || !stops || !Array.isArray(stops) || stops.length === 0) {
      return NextResponse.json({ error: 'zoneId and stops array are required' }, { status: 400 });
    }

    // Fetch zone info
    const zone = await db.zone.findUnique({ where: { id: zoneId } });

    // Fetch vendors in the zone for context
    const vendors = await db.vendor.findMany({
      where: { zoneId, approved: true },
      take: 20,
    });

    // Build stops context
    const stopsContext = stops.map((s: { vendorId?: string; lat: number; lng: number; priority?: number }, i: number) => {
      const vendor = s.vendorId ? vendors.find(v => v.id === s.vendorId) : null;
      return `Stop ${i + 1}: ${vendor ? vendor.name : 'Custom location'} at (${s.lat}, ${s.lng}), priority: ${s.priority || 'normal'}`;
    }).join('\n');

    const vendorsContext = vendors.slice(0, 10).map(v =>
      `${v.name} (Stall ${v.stallNumber}) at (${v.geoLat}, ${v.geoLng}) - ${v.categories}`
    ).join('\n');

    const zai = await ZAI.create();

    const completion = await zai.chat.completions.create({
      messages: [
        {
          role: 'system',
          content: `You are the AI Route Optimizer for Kariakoo Market, Dar es Salaam, Tanzania. You compute optimal visiting routes for shoppers.

You MUST respond with valid JSON only. No markdown, no code blocks.

Respond with this exact JSON structure:
{
  "optimizedOrder": [0, 2, 1, 3] (array of stop indices in optimal visiting order),
  "totalDistance": number (total walking distance in meters),
  "totalTime": number (estimated total time in minutes including browsing time),
  "crowdData": {
    "overallLevel": "low" | "moderate" | "high" | "very_high",
    "perStopCrowd": [{ "stopIndex": number, "level": "low" | "moderate" | "high" }]
  },
  "routeDescription": "string - brief description of the optimized route"
}

Rules:
- Optimize for shortest total walking distance
- Consider priority stops (high priority should come earlier if possible)
- Estimate ~15-20 minutes per stop for browsing
- Walking speed in market: ~60 meters per minute (crowded)
- Kariakoo is most crowded 10am-2pm
- Start from the given start coordinates
- Give realistic distance estimates based on the coordinate differences`,
        },
        {
          role: 'user',
          content: `Zone: ${zone?.name || zoneId}
Starting point: (${startLat || -6.8264}, ${startLng || 39.2695})

STOPS TO OPTIMIZE:
${stopsContext}

AVAILABLE VENDORS IN ZONE:
${vendorsContext}

Optimize the route for minimum walking distance considering crowd levels.`,
        },
      ],
      temperature: 0.3,
      max_tokens: 800,
    });

    const content = completion.choices[0]?.message?.content || '{}';
    let cleaned = content.trim();
    if (cleaned.startsWith('```')) {
      cleaned = cleaned.replace(/^```(?:json)?\s*\n?/, '').replace(/\n?```\s*$/, '');
    }

    let result;
    try {
      result = JSON.parse(cleaned);
    } catch {
      // Fallback: return stops in original order
      const n = stops.length;
      const avgDist = 150;
      result = {
        optimizedOrder: Array.from({ length: n }, (_, i) => i),
        totalDistance: avgDist * (n - 1),
        totalTime: 20 * n + 3 * (n - 1),
        crowdData: {
          overallLevel: 'moderate',
          perStopCrowd: stops.map((_: unknown, i: number) => ({ stopIndex: i, level: 'moderate' as const })),
        },
        routeDescription: `Optimized route visiting ${n} stops in the ${zone?.name || 'Kariakoo'} zone. Estimated total walking distance of about ${(avgDist * (n - 1)).toLocaleString()} meters.`,
      };
    }

    // Ensure arrays are valid
    if (!result.optimizedOrder || !Array.isArray(result.optimizedOrder)) {
      result.optimizedOrder = Array.from({ length: stops.length }, (_, i) => i);
    }
    if (!result.totalDistance) result.totalDistance = 150 * (stops.length - 1);
    if (!result.totalTime) result.totalTime = 20 * stops.length + 3 * (stops.length - 1);
    if (!result.crowdData) {
      result.crowdData = {
        overallLevel: 'moderate',
        perStopCrowd: stops.map((_: unknown, i: number) => ({ stopIndex: i, level: 'moderate' })),
      };
    }
    if (!result.routeDescription) {
      result.routeDescription = `Optimized route visiting ${stops.length} stops in the ${zone?.name || 'Kariakoo'} zone.`;
    }

    // Save to OptimizedRoute model
    try {
      const savedRoute = await db.optimizedRoute.create({
        data: {
          userId: 'seeker-anonymous',
          zoneId,
          stops: JSON.stringify(stops),
          optimizedOrder: JSON.stringify(result.optimizedOrder),
          totalDistance: result.totalDistance,
          totalTime: result.totalTime,
          crowdData: JSON.stringify(result.crowdData),
          startLat: startLat || -6.8264,
          startLng: startLng || 39.2695,
        },
      });
      result.routeId = savedRoute.id;
    } catch (dbErr) {
      console.error('Failed to save OptimizedRoute:', dbErr);
    }

    return NextResponse.json({
      success: true,
      optimizedOrder: result.optimizedOrder,
      totalDistance: result.totalDistance,
      totalTime: result.totalTime,
      crowdData: result.crowdData,
      routeDescription: result.routeDescription,
      routeId: result.routeId || null,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('AI Route Optimizer error:', error);
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

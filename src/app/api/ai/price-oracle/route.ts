import { NextRequest, NextResponse } from 'next/server';
import ZAI from 'z-ai-web-dev-sdk';
import { db } from '@/lib/db';

export async function POST(req: NextRequest) {
  try {
    const { category, zoneId, itemName, vendorPrice } = await req.json();

    if (!itemName || !zoneId) {
      return NextResponse.json({ error: 'itemName and zoneId are required' }, { status: 400 });
    }

    // Fetch PriceRadar data for context
    const radarEntries = await db.priceRadar.findMany({
      where: { zoneId },
      include: { zone: { select: { name: true, nameSw: true } } },
    });

    // Fetch existing PriceEstimate records for similar items
    const existingEstimates = await db.priceEstimate.findMany({
      where: {
        zoneId,
        OR: [
          { itemName: { contains: itemName } },
          { category: category || 'undefined' },
        ],
      },
      orderBy: { updatedAt: 'desc' },
      take: 10,
    });

    // Build context for AI
    const radarContext = radarEntries.length > 0
      ? radarEntries.map(r => `${r.category}: TZS ${r.priceMin.toLocaleString()} - ${r.priceMax.toLocaleString()}`).join('\n')
      : 'No PriceRadar data available for this zone.';

    const estimateContext = existingEstimates.length > 0
      ? existingEstimates.map(e => `${e.itemName}: fair TZS ${e.fairPrice.toLocaleString()} (range ${e.estimatedMin.toLocaleString()}-${e.estimatedMax.toLocaleString()}, confidence ${(e.confidence * 100).toFixed(0)}%)`).join('\n')
      : 'No existing estimates for similar items.';

    const zai = await ZAI.create();

    const completion = await zai.chat.completions.create({
      messages: [
        {
          role: 'system',
          content: `You are the AI Price Oracle for Kariakoo Market, Dar es Salaam, Tanzania. You compute fair price estimates for items based on market data.

You MUST respond with valid JSON only. No markdown, no code blocks.

Respond with this exact JSON structure:
{
  "fairPrice": number (TZS - best estimate of fair price),
  "estimatedMin": number (TZS - lowest fair price),
  "estimatedMax": number (TZS - highest fair price),
  "confidence": number (0-1, how confident in the estimate),
  "verdict": "great_deal" | "fair" | "overpriced" | "ripoff",
  "tips": ["string - tip1", "string - tip2", "string - tip3"]
}

Rules:
- If vendorPrice is below estimatedMin, verdict = "great_deal"
- If vendorPrice is between estimatedMin and estimatedMax, verdict = "fair"
- If vendorPrice is up to 30% above estimatedMax, verdict = "overpriced"
- If vendorPrice is more than 30% above estimatedMax, verdict = "ripoff"
- If no vendorPrice is provided, set verdict based on fairPrice vs estimatedMax
- Give realistic TZS prices based on Kariakoo market knowledge
- Include 3-5 practical tips for the buyer
- Confidence should be 0.5-0.95 based on data availability`,
        },
        {
          role: 'user',
          content: `Item: ${itemName}
Category: ${category || 'General'}
Zone: ${zoneId}
${vendorPrice ? `Vendor asking price: TZS ${vendorPrice.toLocaleString()}` : 'No vendor price provided - give general estimate'}

MARKET DATA (PriceRadar):
${radarContext}

EXISTING ESTIMATES:
${estimateContext}

Compute the fair price estimate for this item.`,
        },
      ],
      temperature: 0.4,
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
      // Fallback if AI returns invalid JSON
      const basePrice = vendorPrice || 15000;
      result = {
        fairPrice: Math.round(basePrice * 0.7),
        estimatedMin: Math.round(basePrice * 0.5),
        estimatedMax: Math.round(basePrice * 0.85),
        confidence: 0.6,
        verdict: vendorPrice ? (vendorPrice > basePrice * 1.3 ? 'overpriced' : 'fair') : 'fair',
        tips: [
          'Always compare prices across at least 3 vendors before buying',
          'Start by offering 40-50% below the asking price',
          'The best time to get deals is early morning or late afternoon',
        ],
      };
    }

    // Enrich with fallback logic
    if (!result.estimatedMin && result.fairPrice) {
      result.estimatedMin = Math.round(result.fairPrice * 0.7);
    }
    if (!result.estimatedMax && result.fairPrice) {
      result.estimatedMax = Math.round(result.fairPrice * 1.3);
    }
    if (!result.confidence) result.confidence = 0.6;

    // Determine verdict if not set
    if (!result.verdict && vendorPrice) {
      if (vendorPrice <= result.estimatedMin) result.verdict = 'great_deal';
      else if (vendorPrice <= result.estimatedMax) result.verdict = 'fair';
      else if (vendorPrice <= result.estimatedMax * 1.3) result.verdict = 'overpriced';
      else result.verdict = 'ripoff';
    }

    if (!result.tips || !Array.isArray(result.tips)) {
      result.tips = [
        'Compare prices across multiple stalls before buying',
        'Bargaining is expected — never accept the first price',
        'Walking away politely often brings the price down',
      ];
    }

    // Save to PriceEstimate model
    try {
      await db.priceEstimate.create({
        data: {
          category: category || 'General',
          zoneId,
          itemName,
          estimatedMin: result.estimatedMin,
          estimatedMax: result.estimatedMax,
          fairPrice: result.fairPrice,
          confidence: result.confidence,
          dataPoints: existingEstimates.length + radarEntries.length,
          sources: JSON.stringify({ priceRadar: radarEntries.length > 0, existingEstimates: existingEstimates.length > 0, aiEstimate: true }),
        },
      });
    } catch (dbErr) {
      console.error('Failed to save PriceEstimate:', dbErr);
    }

    // Get similar items from PriceRadar for the response
    const similarItems = radarEntries.filter(r =>
      r.category.toLowerCase().includes((category || '').toLowerCase()) ||
      category === undefined
    ).slice(0, 5);

    return NextResponse.json({
      success: true,
      fairPrice: result.fairPrice,
      estimatedMin: result.estimatedMin,
      estimatedMax: result.estimatedMax,
      confidence: result.confidence,
      verdict: result.verdict || 'fair',
      tips: result.tips,
      similarItems: similarItems.map(s => ({
        category: s.category,
        priceMin: s.priceMin,
        priceMax: s.priceMax,
        zone: s.zone?.name || 'Kariakoo',
      })),
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('AI Price Oracle error:', error);
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

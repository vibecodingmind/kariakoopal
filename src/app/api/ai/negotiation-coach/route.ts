import { NextRequest, NextResponse } from 'next/server';
import ZAI from 'z-ai-web-dev-sdk';
import { db } from '@/lib/db';

export async function POST(req: NextRequest) {
  try {
    const { itemName, askingPrice, vendorName, zoneId } = await req.json();

    if (!itemName || !askingPrice) {
      return NextResponse.json({ error: 'itemName and askingPrice are required' }, { status: 400 });
    }

    // Get market data
    const radarEntries = zoneId
      ? await db.priceRadar.findMany({ where: { zoneId } })
      : await db.priceRadar.findMany({});

    const marketContext = radarEntries.length > 0
      ? radarEntries.slice(0, 8).map(r => `${r.category}: TZS ${r.priceMin.toLocaleString()} - ${r.priceMax.toLocaleString()}`).join('\n')
      : 'General Kariakoo market prices apply.';

    const zai = await ZAI.create();

    const completion = await zai.chat.completions.create({
      messages: [
        {
          role: 'system',
          content: `You are the AI Negotiation Coach for Kariakoo Market, Dar es Salaam, Tanzania. You help tourists negotiate fair prices with local vendors.

You MUST respond with valid JSON only. No markdown, no code blocks.

Respond with this exact JSON structure:
{
  "targetPrice": number (TZS - the price you should aim to pay),
  "openingOffer": number (TZS - your first counter-offer),
  "maxWalkAway": number (TZS - maximum price before walking away),
  "tips": [
    { "phase": "opening" | "middle" | "closing", "advice": "string" }
  ],
  "coachScript": "string - a sample dialogue showing how the negotiation should go"
}

Rules:
- openingOffer should be 30-50% below askingPrice
- targetPrice should be 20-40% below askingPrice
- maxWalkAway should be 10-20% below askingPrice
- Include 4-6 tips across opening, middle, and closing phases
- coachScript should be a natural dialogue with Swahili phrases included
- Be culturally appropriate and respectful
- Know that in Kariakoo, initial prices are often inflated 50-100%`,
        },
        {
          role: 'user',
          content: `Item: ${itemName}
Asking price: TZS ${askingPrice.toLocaleString()}
${vendorName ? `Vendor: ${vendorName}` : 'Vendor: unknown'}
Zone: ${zoneId || 'Kariakoo general'}

MARKET DATA:
${marketContext}

Give me a complete negotiation strategy.`,
        },
      ],
      temperature: 0.5,
      max_tokens: 1200,
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
      // Fallback
      result = {
        targetPrice: Math.round(askingPrice * 0.65),
        openingOffer: Math.round(askingPrice * 0.5),
        maxWalkAway: Math.round(askingPrice * 0.85),
        tips: [
          { phase: 'opening', advice: 'Start by showing genuine interest but express surprise at the price' },
          { phase: 'opening', advice: 'Offer about half the asking price as your opening counter' },
          { phase: 'middle', advice: 'Use the "I saw it cheaper elsewhere" technique' },
          { phase: 'middle', advice: 'Be patient and let the vendor make the next move' },
          { phase: 'closing', advice: 'Be willing to walk away — this often brings the best price' },
          { phase: 'closing', advice: 'If price is agreed, shake hands and thank the vendor warmly' },
        ],
        coachScript: 'You: "Habari! Bei gani?" (Hello! How much?)\nVendor: "TZS ' + askingPrice.toLocaleString() + '"\nYou: "Ni ghali sana! Nina TZS ' + Math.round(askingPrice * 0.5).toLocaleString() + ' tu." (It is too expensive! I only have TZS ' + Math.round(askingPrice * 0.5).toLocaleString() + '.)\nVendor: "Ah, that is too low. TZS ' + Math.round(askingPrice * 0.85).toLocaleString() + '?"\nYou: "Nina bei nzuri zaidi dukani lingine." (I have a better price at another shop.)\nVendor: "Okay, TZS ' + Math.round(askingPrice * 0.7).toLocaleString() + '. Final price!"\nYou: "Sawa!" (Okay! Deal!)',
      };
    }

    // Enrich missing fields
    if (!result.targetPrice) result.targetPrice = Math.round(askingPrice * 0.65);
    if (!result.openingOffer) result.openingOffer = Math.round(askingPrice * 0.5);
    if (!result.maxWalkAway) result.maxWalkAway = Math.round(askingPrice * 0.85);
    if (!result.tips || !Array.isArray(result.tips)) {
      result.tips = [
        { phase: 'opening', advice: 'Show interest but express surprise at the price' },
        { phase: 'middle', advice: 'Counter with 50% below asking, then negotiate up slowly' },
        { phase: 'closing', advice: 'Be ready to walk away politely' },
      ];
    }
    if (!result.coachScript) {
      result.coachScript = 'Start by greeting the vendor warmly, then express interest but mention the price seems high. Counter with your opening offer and negotiate toward the target price.';
    }

    // Save to NegotiationSession model
    try {
      const session = await db.negotiationSession.create({
        data: {
          userId: 'seeker-anonymous',
          itemName,
          askingPrice,
          currentOffer: result.openingOffer,
          targetPrice: result.targetPrice,
          coachTips: JSON.stringify(result.tips),
          status: 'active',
        },
      });
      result.sessionId = session.id;
    } catch (dbErr) {
      console.error('Failed to save NegotiationSession:', dbErr);
    }

    return NextResponse.json({
      success: true,
      targetPrice: result.targetPrice,
      openingOffer: result.openingOffer,
      maxWalkAway: result.maxWalkAway,
      tips: result.tips,
      coachScript: result.coachScript,
      sessionId: result.sessionId || null,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('AI Negotiation Coach error:', error);
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

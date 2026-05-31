import { NextRequest, NextResponse } from 'next/server';
import ZAI from 'z-ai-web-dev-sdk';

const MARKET_PRICES: Record<string, { min: number; max: number; unit: string }> = {
  'kanga fabric': { min: 5000, max: 25000, unit: 'piece' },
  'kitenge fabric': { min: 8000, max: 35000, unit: 'piece' },
  'spices': { min: 2000, max: 15000, unit: 'pack' },
  'turmeric': { min: 3000, max: 8000, unit: 'pack' },
  'cardamom': { min: 8000, max: 20000, unit: 'pack' },
  'electronics': { min: 10000, max: 500000, unit: 'item' },
  'phone case': { min: 3000, max: 10000, unit: 'piece' },
  'phone': { min: 100000, max: 3000000, unit: 'piece' },
  'jewelry': { min: 5000, max: 500000, unit: 'piece' },
  'tanzanite': { min: 50000, max: 5000000, unit: 'piece' },
  'clothing': { min: 10000, max: 80000, unit: 'piece' },
  'carvings': { min: 5000, max: 100000, unit: 'piece' },
  'fresh produce': { min: 500, max: 5000, unit: 'bundle' },
  'tea': { min: 3000, max: 12000, unit: 'pack' },
  'coffee': { min: 5000, max: 20000, unit: 'pack' },
  'maasai crafts': { min: 5000, max: 50000, unit: 'piece' },
  'sandalwood': { min: 3000, max: 15000, unit: 'piece' },
  'basmati rice': { min: 4000, max: 8000, unit: 'kg' },
};

function findMarketPrice(item: string): { min: number; max: number; unit: string } | null {
  const lowerItem = item.toLowerCase();
  for (const [key, value] of Object.entries(MARKET_PRICES)) {
    if (lowerItem.includes(key) || key.includes(lowerItem)) {
      return value;
    }
  }
  return null;
}

export async function POST(req: NextRequest) {
  try {
    const { item, askingPrice, vendorType, quality, seekerBudget, language, refinement, chatHistory } = await req.json();

    const zai = await ZAI.create();

    // Find market price data for context
    const marketPrice = findMarketPrice(item || '');
    const marketContext = marketPrice
      ? `\n\nKNOWN MARKET DATA: ${item} typically sells for TZS ${marketPrice.min.toLocaleString()} - ${marketPrice.max.toLocaleString()} per ${marketPrice.unit} in Kariakoo. Use this as a reference but the vendor's specific price may vary based on quality.`
      : '';

    const systemPrompt = `You are an expert bargaining AI for Kariakoo Market, Dar es Salaam, Tanzania. You are a seasoned market negotiator who knows every vendor, every price, and every bargaining trick.

Your knowledge includes:
- Kanga fabric: 5,000-25,000 TZS depending on quality
- Spices (turmeric, cardamom, etc.): 2,000-15,000 TZS per pack
- Fresh produce: very cheap, always bargain hard
- Electronics: 10-30% markup from wholesale
- Jewelry and crafts: 40-60% markup typical, negotiate hard
- Traditional clothing: 15,000-80,000 TZS
- Art and carvings: 5,000-100,000+ TZS, huge variation
${marketContext}

You MUST respond with valid JSON only. No markdown, no code blocks.

If this is an initial request (no refinement), provide:
{
  "fairPriceMin": number (TZS - lowest fair price),
  "fairPriceMax": number (TZS - highest fair price),
  "negotiationStrategy": [
    { "step": number, "icon": "emoji", "description": "short action", "sayWhat": "exact phrase to say" }
  ],
  "swahiliPhrases": [
    { "swahili": "Swahili phrase", "pronunciation": "phonetic guide", "english": "English translation" }
  ],
  "walkAwayPrice": number (TZS - maximum you should pay),
  "culturalTips": ["tip1", "tip2", "tip3"],
  "marketPriceRange": "TZS X - Y typical range",
  "isFairPrice": boolean (is the asking price fair?),
  "fairPriceAssessment": "Brief explanation of whether the price is fair",
  "counterOfferStrategy": "Suggested first counter-offer and reasoning"
}

If this is a refinement request, provide the same structure but adjusted based on the refinement instruction.

Include at least 4 negotiation steps, 4 Swahili phrases, and 3 cultural tips.`;

    let userContent: string;

    if (refinement) {
      userContent = `I need to refine my negotiation advice.

CURRENT ITEM: ${item}
VENDOR ASKING PRICE: ${askingPrice} TZS
MY BUDGET: ${seekerBudget || 'flexible'} TZS
VENDOR TYPE: ${vendorType || 'general'}
QUALITY: ${quality || 'medium'}

REFINEMENT REQUEST: "${refinement}"

${chatHistory ? `PREVIOUS ADVICE SUMMARY: ${JSON.stringify(chatHistory).slice(0, 800)}` : ''}

Please adjust the negotiation strategy accordingly.`;
    } else {
      userContent = `Item: ${item}
Vendor asking price: ${askingPrice} TZS
Vendor type: ${vendorType || 'general'}
Quality: ${quality || 'medium'}
My budget: ${seekerBudget || 'flexible'} TZS
Language: ${language || 'English'}

Help me negotiate a fair price! Include a fair price assessment and counter-offer strategy.`;
    }

    const completion = await zai.chat.completions.create({
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userContent },
      ],
      temperature: 0.6,
      max_tokens: 2000,
    });

    const content = completion.choices[0]?.message?.content || '{}';

    let cleanedContent = content.trim();
    if (cleanedContent.startsWith('```')) {
      cleanedContent = cleanedContent
        .replace(/^```(?:json)?\s*\n?/, '')
        .replace(/\n?```\s*$/, '');
    }

    try {
      const negotiation = JSON.parse(cleanedContent);
      // Enrich with market data
      if (marketPrice && !negotiation.marketPriceRange) {
        negotiation.marketPriceRange = `TZS ${marketPrice.min.toLocaleString()} - ${marketPrice.max.toLocaleString()}`;
      }
      if (!negotiation.isFairPrice && askingPrice && marketPrice) {
        negotiation.isFairPrice = askingPrice <= marketPrice.max * 1.1;
        negotiation.fairPriceAssessment = negotiation.isFairPrice
          ? `The asking price of TZS ${askingPrice.toLocaleString()} is within or close to the fair market range.`
          : `The asking price of TZS ${askingPrice.toLocaleString()} is above the typical market range. You should negotiate down.`;
      }
      if (!negotiation.counterOfferStrategy && askingPrice) {
        const counterPrice = Math.round(askingPrice * 0.6);
        negotiation.counterOfferStrategy = `Start by offering TZS ${counterPrice.toLocaleString()} (about 40% below asking). This gives you room to negotiate up to the fair price range.`;
      }
      return NextResponse.json({ success: true, negotiation });
    } catch {
      return NextResponse.json({ success: true, negotiation: { rawText: content } });
    }
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('AI Price Negotiate error:', error);
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

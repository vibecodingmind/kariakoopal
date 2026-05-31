import { NextRequest, NextResponse } from 'next/server';
import ZAI from 'z-ai-web-dev-sdk';

export async function POST(req: NextRequest) {
  try {
    const { item, askingPrice, vendorType, quality, seekerBudget, language } = await req.json();

    const zai = await ZAI.create();

    const completion = await zai.chat.completions.create({
      messages: [
        {
          role: 'system',
          content: `You are an expert bargaining AI for Kariakoo Market, Dar es Salaam, Tanzania. You know the real market prices for everything and help tourists get fair deals.

Your knowledge:
- Kanga fabric: 5,000-25,000 TZS depending on quality
- Spices (turmeric, cardamom, etc.): 2,000-15,000 TZS per pack
- Fresh produce: very cheap, always bargain
- Electronics: 10-30% markup from wholesale
- Jewelry and crafts: 40-60% markup typical, negotiate hard
- Traditional clothing: 15,000-80,000 TZS
- Art and carvings: 5,000-100,000+ TZS, huge variation

Provide: fairPrice (TZS range), negotiationStrategy (step by step), swahiliPhrases (useful bargaining phrases in Swahili with pronunciation), walkAwayPrice, culturalTips. Return as JSON.`,
        },
        {
          role: 'user',
          content: `Item: ${item}
Vendor asking price: ${askingPrice} TZS
Vendor type: ${vendorType || 'general'}
Quality: ${quality || 'medium'}
My budget: ${seekerBudget || 'flexible'} TZS
Language: ${language || 'English'}

Help me negotiate a fair price!`,
        },
      ],
      temperature: 0.6,
      max_tokens: 1500,
    });

    const content = completion.choices[0]?.message?.content || '{}';

    try {
      const negotiation = JSON.parse(content);
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

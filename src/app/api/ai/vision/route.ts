import { NextRequest, NextResponse } from 'next/server';
import ZAI from 'z-ai-web-dev-sdk';

export async function POST(req: NextRequest) {
  try {
    const { imageBase64, language } = await req.json();

    if (!imageBase64) {
      return NextResponse.json({ error: 'Image required' }, { status: 400 });
    }

    const zai = await ZAI.create();

    const completion = await zai.chat.completions.create({
      messages: [
        {
          role: 'system',
          content: `You are an expert AI for Kariakoo Market, Dar es Salaam, Tanzania. You identify items from photos and provide: 1) Item name (in English and Swahili), 2) Estimated fair price range in TZS, 3) Quality assessment, 4) Negotiation tips, 5) Where in Kariakoo to find this item, 6) Cultural significance if any. Respond in ${language || 'English'}. Return as JSON: { name, nameSwahili, category, fairPriceRange: { min, max, currency: "TZS" }, quality: "low|medium|high|premium", negotiationTips: string[], whereToFind: string, culturalNote: string, alternatives: string[] }`,
        },
        {
          role: 'user',
          content: [
            { type: 'text', text: 'What is this item? Give me price and shopping advice for Kariakoo Market.' },
            {
              type: 'image_url',
              image_url: { url: imageBase64.startsWith('data:') ? imageBase64 : `data:image/jpeg;base64,${imageBase64}` },
            },
          ],
        },
      ] as any,
      temperature: 0.5,
      max_tokens: 1500,
    });

    const content = completion.choices[0]?.message?.content || '';

    try {
      const result = JSON.parse(content);
      return NextResponse.json({ success: true, result });
    } catch {
      return NextResponse.json({ success: true, result: { rawText: content } });
    }
  } catch (error: any) {
    console.error('AI Vision error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

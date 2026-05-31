import { NextRequest, NextResponse } from 'next/server';
import ZAI from 'z-ai-web-dev-sdk';

export async function POST(req: NextRequest) {
  try {
    const { seekerPreferences, availableGuides } = await req.json();

    const zai = await ZAI.create();

    const completion = await zai.chat.completions.create({
      messages: [
        {
          role: 'system',
          content: `You are an AI matching system for Kariako Guide platform. You match tourists (seekers) with the best local guides in Kariakoo, Dar es Salaam, Tanzania.

Consider these matching factors:
1. Language compatibility (English, Swahili, or other)
2. Interest alignment (shopping, culture, food, history, etc.)
3. Budget compatibility
4. Zone expertise (which areas of Kariakoo the guide knows best)
5. Rating and review history
6. Availability and schedule
7. Group size capacity
8. Special needs (accessibility, family-friendly, etc.)

Rate each guide from 0-100 for match score and explain why. Return as JSON array with: guideId, matchScore, reasons (array of strings), highlights (array of strings), estimatedCost. Sort by matchScore descending.`,
        },
        {
          role: 'user',
          content: `Seeker preferences: ${JSON.stringify(seekerPreferences)}

Available guides: ${JSON.stringify(availableGuides)}

Find the best matches!`,
        },
      ],
      temperature: 0.5,
      max_tokens: 2000,
    });

    const content = completion.choices[0]?.message?.content || '[]';

    try {
      const matches = JSON.parse(content);
      return NextResponse.json({ success: true, matches });
    } catch {
      return NextResponse.json({ success: true, matches: [], rawResponse: content });
    }
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('AI Guide Matching error:', error);
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

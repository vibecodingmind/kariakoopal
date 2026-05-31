import { NextRequest, NextResponse } from 'next/server';
import ZAI from 'z-ai-web-dev-sdk';

export async function POST(req: NextRequest) {
  try {
    const { seekerPreferences, availableGuides, action } = await req.json();

    // Quick match - return instant recommendation
    if (action === 'quick') {
      try {
        const zai = await ZAI.create();

        const completion = await zai.chat.completions.create({
          messages: [
            {
              role: 'system',
              content: `You are an AI matching system for Chimbo Direct platform. You match tourists with the best local guides in Kariakoo, Dar es Salaam.

Consider: language compatibility, interest alignment, budget compatibility, zone expertise, ratings, group size capacity.

Return JSON with the SINGLE best match:
{
  "guideId": "string",
  "matchScore": number (0-100),
  "reasons": ["why this guide is perfect for you"],
  "highlights": ["key selling points"],
  "estimatedCostPerHour": number,
  "estimatedCostPerDay": number,
  "suggestedItinerary": "brief 1-sentence suggestion for what to do with this guide"
}`,
            },
            {
              role: 'user',
              content: `Seeker preferences: ${JSON.stringify(seekerPreferences)}
Available guides: ${JSON.stringify(availableGuides)}

Find the single best match!`,
            },
          ],
          temperature: 0.4,
          max_tokens: 800,
        });

        const content = completion.choices[0]?.message?.content || '{}';
        try {
          const match = JSON.parse(content);
          return NextResponse.json({ success: true, matches: [match], quickMatch: true });
        } catch {
          return NextResponse.json({ success: true, matches: [], rawResponse: content });
        }
      } catch {
        // AI unavailable, use scoring algorithm
      }
    }

    // Full matching with detailed analysis
    const zai = await ZAI.create();

    const completion = await zai.chat.completions.create({
      messages: [
        {
          role: 'system',
          content: `You are an AI matching system for Chimbo Direct platform. You match tourists (seekers) with the best local guides in Kariakoo, Dar es Salaam, Tanzania.

Consider these matching factors with weights:
1. Language compatibility (25%) - English, Swahili, or other
2. Interest alignment (25%) - shopping, culture, food, history, etc.
3. Budget compatibility (20%) - does the guide fit the seeker's budget?
4. Zone expertise (15%) - which areas of Kariakoo the guide knows best
5. Rating and experience (10%) - past performance
6. Group size & special needs (5%)

You MUST respond with valid JSON only. No markdown, no code blocks.

Return as JSON array with these fields for EACH guide:
{
  "guideId": "string",
  "name": "string",
  "matchScore": number (0-100),
  "reasons": ["detailed explanation of why this guide matches, specific to the seeker's preferences"],
  "highlights": ["2-3 unique selling points"],
  "estimatedCostPerHour": number (TZS),
  "estimatedCostPerDay": number (TZS),
  "compatibilityBreakdown": {
    "language": number (0-100),
    "interests": number (0-100),
    "budget": number (0-100),
    "zone": number (0-100)
  },
  "suggestedActivities": ["1-2 activity suggestions based on seeker interests and guide expertise"]
}

Sort by matchScore descending. Include ALL provided guides in the results.`,
        },
        {
          role: 'user',
          content: `Seeker preferences: ${JSON.stringify(seekerPreferences)}

Available guides: ${JSON.stringify(availableGuides)}

Find the best matches with detailed analysis!`,
        },
      ],
      temperature: 0.5,
      max_tokens: 3000,
    });

    const content = completion.choices[0]?.message?.content || '[]';

    let cleanedContent = content.trim();
    if (cleanedContent.startsWith('```')) {
      cleanedContent = cleanedContent
        .replace(/^```(?:json)?\s*\n?/, '')
        .replace(/\n?```\s*$/, '');
    }

    try {
      const matches = JSON.parse(cleanedContent);
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

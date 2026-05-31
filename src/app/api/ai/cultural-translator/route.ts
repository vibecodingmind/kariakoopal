import { NextRequest, NextResponse } from 'next/server';
import ZAI from 'z-ai-web-dev-sdk';
import { db } from '@/lib/db';

export async function POST(req: NextRequest) {
  try {
    const { zoneId, category, query } = await req.json();

    if (!zoneId) {
      return NextResponse.json({ error: 'zoneId is required' }, { status: 400 });
    }

    // Check for existing insights first
    const existingInsights = await db.culturalInsight.findMany({
      where: {
        zoneId,
        ...(category ? { category } : {}),
      },
      orderBy: { updatedAt: 'desc' },
      take: 20,
    });

    // Fetch zone info
    const zone = await db.zone.findUnique({ where: { id: zoneId } });

    const zai = await ZAI.create();

    const categoryInstruction = category
      ? `Focus on the "${category}" category.`
      : 'Cover all categories: greetings, gestures, bargaining, dress_code, food, customs.';

    const queryInstruction = query
      ? `The user specifically asks about: "${query}". Address this directly.`
      : '';

    const existingContext = existingInsights.length > 0
      ? `\n\nEXISTING INSIGHTS (use as reference, don't duplicate):\n${existingInsights.map(i => `- ${i.category}/${i.title}: ${i.description.slice(0, 80)}...`).join('\n')}`
      : '';

    const completion = await zai.chat.completions.create({
      messages: [
        {
          role: 'system',
          content: `You are the AI Cultural Translator for Kariakoo Market, Dar es Salaam, Tanzania. You help tourists understand local customs, etiquette, and cultural norms.

You MUST respond with valid JSON only. No markdown, no code blocks.

Respond with this exact JSON structure:
{
  "insights": [
    {
      "category": "greetings" | "gestures" | "bargaining" | "dress_code" | "food" | "customs",
      "title": "string - short title",
      "description": "string - detailed explanation",
      "doAdvice": "string - what you should do",
      "dontAdvice": "string - what you should NOT do",
      "severity": "info" | "important" | "critical"
    }
  ]
}

Rules:
- Provide 4-8 culturally accurate insights for Kariakoo/Tanzania
- severity "critical" = could cause serious offense or safety issue
- severity "important" = important for good relations
- severity "info" = helpful but not essential
- Include Swahili greetings and phrases where relevant
- Be specific to the Kariakoo market context
- Include both do's and don'ts for each insight`,
        },
        {
          role: 'user',
          content: `Zone: ${zone?.name || 'Kariakoo'}
${categoryInstruction}
${queryInstruction}
${existingContext}

Provide cultural insights for a tourist visiting this market zone.`,
        },
      ],
      temperature: 0.5,
      max_tokens: 1500,
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
      // Fallback insights
      result = {
        insights: [
          {
            category: 'greetings',
            title: 'Swahili Greetings Are Essential',
            description: 'Always greet people before starting any conversation or transaction. In Swahili culture, skipping greetings is considered rude.',
            doAdvice: 'Say "Habari!" (Hello/How are you?) or "Mambo!" (What\'s up?) before asking about prices or products.',
            dontAdvice: 'Don\'t jump straight to business without greeting — this is seen as disrespectful.',
            severity: 'important',
          },
          {
            category: 'bargaining',
            title: 'Bargaining Is Expected',
            description: 'In Kariakoo, prices are negotiable. Vendors expect you to bargain and set initial prices higher accordingly.',
            doAdvice: 'Start by offering 40-50% of the asking price, then negotiate up gradually. Always smile and be friendly.',
            dontAdvice: 'Don\'t accept the first price quoted — vendors will assume you are wealthy and won\'t respect the transaction.',
            severity: 'important',
          },
          {
            category: 'dress_code',
            title: 'Dress Modestly',
            description: 'Tanzania is a conservative society. Dress modestly, especially near religious areas.',
            doAdvice: 'Wear knee-length clothing and cover shoulders. Comfortable shoes are essential for market walking.',
            dontAdvice: 'Don\'t wear very short shorts or revealing clothing — this is considered disrespectful.',
            severity: 'important',
          },
          {
            category: 'food',
            title: 'Street Food Etiquette',
            description: 'Kariakoo has amazing street food. Eating with your right hand is the local custom for many dishes.',
            doAdvice: 'Try local dishes like mishkaki (grilled meat skewers), chips mayai (egg fries), and fresh sugarcane juice.',
            dontAdvice: 'Don\'t eat with your left hand — it is considered unclean in local culture.',
            severity: 'info',
          },
          {
            category: 'gestures',
            title: 'Use Right Hand for Exchanges',
            description: 'When giving or receiving money, items, or food, use your right hand or both hands.',
            doAdvice: 'Always use your right hand to exchange money with vendors. It shows respect.',
            dontAdvice: 'Don\'t use your left hand alone to give or receive items — it\'s considered impolite.',
            severity: 'critical',
          },
        ],
      };
    }

    // Ensure insights array
    if (!result.insights || !Array.isArray(result.insights)) {
      result.insights = [];
    }

    // Validate and normalize each insight
    result.insights = result.insights.map((insight: Record<string, unknown>) => ({
      category: insight.category || 'customs',
      title: insight.title || 'Cultural Insight',
      description: insight.description || '',
      doAdvice: insight.doAdvice || '',
      dontAdvice: insight.dontAdvice || '',
      severity: ['info', 'important', 'critical'].includes(insight.severity as string) ? insight.severity : 'info',
    }));

    // Save new insights to database
    try {
      for (const insight of result.insights) {
        const existing = await db.culturalInsight.findFirst({
          where: { zoneId, title: insight.title },
        });
        if (!existing) {
          await db.culturalInsight.create({
            data: {
              zoneId,
              category: insight.category,
              title: insight.title,
              description: insight.description,
              doAdvice: insight.doAdvice,
              dontAdvice: insight.dontAdvice,
              severity: insight.severity,
            },
          });
        }
      }
    } catch (dbErr) {
      console.error('Failed to save CulturalInsight:', dbErr);
    }

    return NextResponse.json({
      success: true,
      insights: result.insights,
      existingInsights: existingInsights.map(i => ({
        id: i.id,
        category: i.category,
        title: i.title,
        description: i.description,
        doAdvice: i.doAdvice,
        dontAdvice: i.dontAdvice,
        severity: i.severity,
      })),
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('AI Cultural Translator error:', error);
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

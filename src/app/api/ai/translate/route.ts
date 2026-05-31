import { NextRequest, NextResponse } from 'next/server';
import ZAI from 'z-ai-web-dev-sdk';

export async function POST(req: NextRequest) {
  try {
    const { text, from, to, context } = await req.json();

    const zai = await ZAI.create();

    const completion = await zai.chat.completions.create({
      messages: [
        {
          role: 'system',
          content: `You are a professional translator specializing in Tanzanian Swahili and English, particularly for the Kariakoo Market context. Translate accurately while preserving cultural nuance and market-specific terminology.

Include:
- translation: the translated text
- pronunciation: phonetic pronunciation guide (for Swahili)
- culturalNote: any cultural context the user should know
- alternatives: 1-2 alternative ways to say the same thing
- formalityLevel: formal/informal/slang

Return as JSON.`,
        },
        {
          role: 'user',
          content: `Translate from ${from} to ${to}: "${text}"
Context: ${context || 'Shopping in Kariakoo Market'}`,
        },
      ],
      temperature: 0.3,
      max_tokens: 800,
    });

    const content = completion.choices[0]?.message?.content || '{}';

    try {
      const translation = JSON.parse(content);
      return NextResponse.json({ success: true, translation });
    } catch {
      return NextResponse.json({ success: true, translation: content });
    }
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('AI Translate error:', error);
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

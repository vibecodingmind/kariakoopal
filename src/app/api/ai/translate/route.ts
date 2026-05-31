import { NextRequest, NextResponse } from 'next/server';
import ZAI from 'z-ai-web-dev-sdk';

export async function POST(req: NextRequest) {
  try {
    const { text, from, to, context, includeCulturalNote } = await req.json();

    const zai = await ZAI.create();

    const systemPrompt = `You are a professional translator specializing in Tanzanian Swahili and English, particularly for the Kariakoo Market context. You are an expert in market-specific vocabulary and cultural nuances.

CRITICAL: You MUST respond with valid JSON only. No markdown, no code blocks.

Return this exact JSON structure:
{
  "translation": "the translated text",
  "pronunciation": "phonetic pronunciation guide (for Swahili words, use simple English phonetics)",
  "phoneticSpelling": "syllable-by-syllable breakdown for difficult words",
  "culturalNote": "cultural context the user should know about this phrase or word",
  "alternatives": ["1-3 alternative ways to say the same thing with different formality levels"],
  "formalityLevel": "formal|informal|slang",
  "marketContext": "How this phrase is specifically used in Kariakoo Market",
  "relatedPhrases": ["2-3 related useful phrases in both languages"],
  "commonMistakes": "Common mistake foreigners make with this phrase (if applicable)"
}

Rules:
- For Swahili translations, always include pronunciation guide
- Include market-specific usage notes
- Add cultural notes about when and how to use the phrase
- If translating to Swahili, include the formal and informal versions in alternatives
- Include related phrases that might be useful in the same context
- ${includeCulturalNote ? 'Always include detailed cultural notes.' : 'Include brief cultural notes when relevant.'}`;

    const completion = await zai.chat.completions.create({
      messages: [
        { role: 'system', content: systemPrompt },
        {
          role: 'user',
          content: `Translate from ${from} to ${to}: "${text}"
Context: ${context || 'Shopping in Kariakoo Market, Dar es Salaam, Tanzania'}`,
        },
      ],
      temperature: 0.3,
      max_tokens: 1200,
    });

    const content = completion.choices[0]?.message?.content || '{}';

    let cleanedContent = content.trim();
    if (cleanedContent.startsWith('```')) {
      cleanedContent = cleanedContent
        .replace(/^```(?:json)?\s*\n?/, '')
        .replace(/\n?```\s*$/, '');
    }

    try {
      const translation = JSON.parse(cleanedContent);
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

// GET endpoint for quick translate (demo/testing)
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const text = searchParams.get('text');
  const from = searchParams.get('from') || 'English';
  const to = searchParams.get('to') || 'Swahili';

  if (!text) {
    return NextResponse.json({ error: 'text parameter required' }, { status: 400 });
  }

  try {
    const zai = await ZAI.create();

    const completion = await zai.chat.completions.create({
      messages: [
        {
          role: 'system',
          content: `You are a Swahili-English translator for Kariakoo Market. Translate and return JSON: { "translation": "...", "pronunciation": "..." }`,
        },
        { role: 'user', content: `Translate from ${from} to ${to}: "${text}"` },
      ],
      temperature: 0.2,
      max_tokens: 300,
    });

    const content = completion.choices[0]?.message?.content || '{}';
    try {
      const translation = JSON.parse(content);
      return NextResponse.json({ success: true, translation });
    } catch {
      return NextResponse.json({ success: true, translation: { translation: content, pronunciation: '' } });
    }
  } catch {
    // Fallback
    return NextResponse.json({
      success: true,
      translation: { translation: '(Translation unavailable)', pronunciation: '' },
      demo: true,
    });
  }
}

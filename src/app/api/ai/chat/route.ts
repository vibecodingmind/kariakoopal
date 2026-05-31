import { NextRequest, NextResponse } from 'next/server';
import ZAI from 'z-ai-web-dev-sdk';

// Store conversation context (in production, use a database)
const conversations = new Map<string, Array<{ role: string; content: string }>>();

function generateSuggestions(message: string, role: string): string[] {
  const lower = message.toLowerCase();
  if (lower.includes('price') || lower.includes('cost') || lower.includes('expensive')) {
    return ['What is a fair price for kanga fabric?', 'How much should I pay for spices?', 'Best budget-friendly restaurants'];
  }
  if (lower.includes('guide') || lower.includes('tour')) {
    return ['Find me a local guide', 'Best guided tours in Kariakoo', 'How do guides work?'];
  }
  if (lower.includes('food') || lower.includes('eat') || lower.includes('restaurant')) {
    return ['Best local food spots', 'Street food safety tips', 'Must-try Tanzanian dishes'];
  }
  if (role === 'guide') {
    return ['How to get more bookings?', 'Tips for better ratings', 'Set my availability'];
  }
  return ['Plan my trip to Kariakoo', 'What should I buy?', 'Safety tips for tourists'];
}

export async function POST(req: NextRequest) {
  try {
    const { message, conversationId, userRole, language, location } = await req.json();

    const zai = await ZAI.create();

    // Get conversation history
    const history = conversations.get(conversationId) || [];
    const messages = [
      {
        role: 'system',
        content: `You are Kariako AI, the friendly assistant for the Kariako Guide platform in Kariakoo, Dar es Salaam, Tanzania. You help tourists (seekers), local guides, and vendors.

Your capabilities:
- Help seekers find the best guides, vendors, and experiences in Kariakoo
- Help guides improve their profiles and get more bookings
- Provide real-time market information, prices, and bargaining tips
- Translate between English and Swahili
- Provide safety advice and emergency information
- Suggest authentic local food, shopping spots, and cultural experiences
- Help with M-Pesa, Tigo Pesa, and Airtel Money payments
- Navigate Kariakoo Market zones and indoor areas

Current user role: ${userRole || 'seeker'}
Current language: ${language || 'English'}
User location: ${location || 'Kariakoo Market'}

Always be warm, helpful, and knowledgeable about Kariakoo. Use local terms and cultural references when appropriate. Keep responses concise but informative. If asked about prices, give realistic TZS estimates.`,
      },
      ...history.slice(-10), // Last 10 messages for context
      { role: 'user', content: message },
    ];

    const completion = await zai.chat.completions.create({
      messages: messages as Array<{ role: string; content: string }>,
      temperature: 0.7,
      max_tokens: 1000,
    });

    const response = completion.choices[0]?.message?.content || 'Sorry, I could not process your request. Please try again.';

    // Update conversation history
    history.push({ role: 'user', content: message });
    history.push({ role: 'assistant', content: response });
    conversations.set(conversationId, history);

    return NextResponse.json({
      success: true,
      response,
      conversationId,
      suggestions: generateSuggestions(message, userRole),
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('AI Chat error:', error);
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

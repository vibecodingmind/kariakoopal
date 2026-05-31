import { NextRequest, NextResponse } from 'next/server';
import ZAI from 'z-ai-web-dev-sdk';

// ── GET /api/ai/recommendations - Return demo recommendations ──
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const location = searchParams.get('location') || 'Kariakoo Market';
    const limit = parseInt(searchParams.get('limit') || '6');
    const category = searchParams.get('category');

    // Return demo recommendations for quick display
    const allRecommendations = [
      { id: 'r1', name: 'Mama Asha\'s Spice Corner', category: 'food', description: 'Authentic Tanzanian spices with the best prices in Zone A', estimatedCost: '5,000-15,000 TZS', rating: 4.9, zone: 'Zone A', tips: 'Visit before noon for freshest stock', bestTime: 'Morning' },
      { id: 'r2', name: 'Kariakoo Electronics Hub', category: 'shopping', description: 'Best deals on phones and accessories', estimatedCost: '50,000-200,000 TZS', rating: 4.6, zone: 'Zone B', tips: 'Haggle for 30% off listed price', bestTime: 'Afternoon' },
      { id: 'r3', name: 'Sunset Rooftop View', category: 'experiences', description: 'Hidden rooftop with panoramic views of the market', estimatedCost: 'Free', rating: 4.8, zone: 'Zone C', tips: 'Best visited at golden hour', bestTime: 'Evening' },
      { id: 'r4', name: 'Historic Indian Quarter', category: 'cultural-sites', description: 'Colonial-era architecture and cultural landmarks', estimatedCost: 'Free', rating: 4.7, zone: 'Zone D', tips: 'Hire a local guide for the full story', bestTime: 'Morning' },
      { id: 'r5', name: 'Underground Fabric Market', category: 'hidden-gems', description: 'Wholesale fabrics at 60% below retail', estimatedCost: '10,000-50,000 TZS', rating: 4.5, zone: 'Zone A', tips: 'Ask for the basement entrance', bestTime: 'Mid-morning' },
      { id: 'r6', name: 'Fresh Juice Alley', category: 'food', description: 'Freshly squeezed sugar cane and passion fruit juices', estimatedCost: '1,000-3,000 TZS', rating: 4.8, zone: 'Zone B', tips: 'Try the mix of mango and passion fruit', bestTime: 'Any time' },
      { id: 'r7', name: 'Vintage Camera Shop', category: 'shopping', description: 'Rare and vintage cameras at unbelievable prices', estimatedCost: '20,000-100,000 TZS', rating: 4.4, zone: 'Zone C', tips: 'Test before you buy', bestTime: 'Afternoon' },
      { id: 'r8', name: 'Street Art Walk', category: 'experiences', description: 'Guided tour through Dar\'s vibrant street art scene', estimatedCost: '15,000 TZS', rating: 4.9, zone: 'Zone D', tips: 'Wear comfortable shoes', bestTime: 'Late afternoon' },
    ];

    const filtered = category
      ? allRecommendations.filter(r => r.category === category)
      : allRecommendations;

    return NextResponse.json({
      success: true,
      recommendations: filtered.slice(0, limit),
      marketInsights: `${location} is bustling with activity today. Best time to visit is early morning.`,
      todaysTip: 'Always negotiate prices - the first quote is typically 40-60% above the fair price.',
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const { userProfile, location, timeOfDay, budget, previousInteractions } = await req.json();

    const zai = await ZAI.create();

    const completion = await zai.chat.completions.create({
      messages: [
        {
          role: 'system',
          content: `You are the Kariako AI recommendation engine for Kariakoo Market, Dar es Salaam, Tanzania. Provide hyper-local, personalized recommendations.

Categories: vendors, food, shopping, experiences, cultural-sites, hidden-gems

For each recommendation include:
- name: specific place/vendor name
- category: from the categories above
- description: why it's recommended (2-3 sentences)
- estimatedCost: realistic TZS range
- rating: estimated 1-5
- zone: which part of Kariakoo
- tips: local insider tip
- bestTime: when to visit

Return as JSON: { recommendations: [...], marketInsights: string, todaysTip: string }`,
        },
        {
          role: 'user',
          content: `User profile: ${JSON.stringify(userProfile)}
Current location: ${location || 'Kariakoo Market'}
Time: ${timeOfDay || 'morning'}
Budget: ${budget || 'moderate'}
Previous interactions: ${JSON.stringify(previousInteractions || [])}

Give me 5-8 personalized recommendations right now!`,
        },
      ],
      temperature: 0.8,
      max_tokens: 2500,
    });

    const content = completion.choices[0]?.message?.content || '{}';

    try {
      const recommendations = JSON.parse(content);
      return NextResponse.json({ success: true, ...recommendations });
    } catch {
      return NextResponse.json({ success: true, recommendations: [], rawResponse: content });
    }
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('AI Recommendations error:', error);
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

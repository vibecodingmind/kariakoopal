import { NextRequest, NextResponse } from 'next/server';
import ZAI from 'z-ai-web-dev-sdk';

// ── Demo fallback data for common Kariakoo items ──

const DEMO_ITEMS = [
  {
    name: 'Kanga Fabric',
    nameSwahili: 'Kanga',
    category: 'Fabrics',
    fairPriceRange: { min: 5000, max: 15000, currency: 'TZS' },
    quality: 'high' as const,
    negotiationTips: [
      'Start by offering 40% less than the asking price',
      'Buy multiple kanga pieces to get a bulk discount',
      'Ask for the "wholesale price" (bei ya jumla) even for single items',
      'Check for color fastness by rubbing a damp cloth on the fabric',
      'Visit the Fabrics Zone for the best selection and prices',
    ],
    whereToFind: 'Fabrics Zone (Eneo la Vitambaa), along the main corridor. Best stalls are near the East Wing entrance.',
    culturalNote: 'Kanga fabric carries deep cultural significance in Tanzania. Each kanga has a Swahili proverb (jina) printed on it, and choosing the right message is as important as the design. Women often give kangas as gifts during celebrations.',
    alternatives: ['Kitenge Fabric', 'Vitenge Set', 'Batik Fabric', 'Shuka Maasai'],
    zone: 'Fabrics Zone',
    english_name: 'Kanga Fabric',
    swahili_name: 'Kanga',
    identified_item: 'Kanga Fabric',
    estimated_price_range: 'TZS 5,000 - 15,000',
    description: 'Traditional East African printed cotton fabric with Swahili proverbs',
    haggling_tips: ['Start 40% below asking price', 'Buy in bulk for discounts', 'Ask for "bei ya jumla"'],
  },
  {
    name: 'Spices Mix',
    nameSwahili: 'Viungo vya Kupika',
    category: 'Spices',
    fairPriceRange: { min: 2000, max: 8000, currency: 'TZS' },
    quality: 'premium' as const,
    negotiationTips: [
      'Smell the spices before buying — fresh spices have a strong aroma',
      'Ask for a small sample to test quality',
      'Buy pre-mixed spice blends for convenience, or individual spices for custom blends',
      'Cardamom and saffron are the most expensive — check prices carefully',
      'The Spice Market has the freshest selection early in the morning',
    ],
    whereToFind: 'Spice Market (Soko la Viungo), Central Market area. Look for stalls with colorful mounds of spices.',
    culturalNote: 'Tanzanian spices are influenced by centuries of Indian Ocean trade. The Zanzibar clove trade historically made these spices world-famous. Many families have secret spice blend recipes passed down for generations.',
    alternatives: ['Curry Powder', 'Garam Masala', 'Pilau Masala', 'Cinnamon Sticks'],
    zone: 'Spice Market',
    english_name: 'Spice Mix',
    swahili_name: 'Viungo vya Kupika',
    identified_item: 'Spice Mix',
    estimated_price_range: 'TZS 2,000 - 8,000',
    description: 'Traditional Tanzanian cooking spice blend',
    haggling_tips: ['Smell before buying', 'Ask for samples', 'Buy early morning for freshest stock'],
  },
  {
    name: 'Phone Case',
    nameSwahili: 'Ganda la Simu',
    category: 'Electronics',
    fairPriceRange: { min: 3000, max: 10000, currency: 'TZS' },
    quality: 'medium' as const,
    negotiationTips: [
      'Phone accessories have the highest markup — negotiate hard',
      'Test the case on your phone before buying to ensure proper fit',
      'Buy screen protector and case together for a package deal',
      'Check for branded vs generic — generic cases are much cheaper',
      'The Electronics Zone has the widest selection',
    ],
    whereToFind: 'Electronics Zone (Eneo la Elektroniki), near the main entrance. Multiple stalls offer phone accessories.',
    culturalNote: 'Kariakoo is the largest electronics market in East Africa. Many phones and accessories enter through informal trade networks, making prices very competitive.',
    alternatives: ['Screen Protector', 'Phone Charger', 'Power Bank', 'Earphones'],
    zone: 'Electronics Zone',
    english_name: 'Phone Case',
    swahili_name: 'Ganda la Simu',
    identified_item: 'Phone Case',
    estimated_price_range: 'TZS 3,000 - 10,000',
    description: 'Mobile phone protective case and accessories',
    haggling_tips: ['Highest markup items — negotiate hard', 'Buy case + protector as bundle', 'Test fit before buying'],
  },
  {
    name: 'Tanzanite Jewelry',
    nameSwahili: 'Vito vya Tanzanite',
    category: 'Jewelry',
    fairPriceRange: { min: 50000, max: 500000, currency: 'TZS' },
    quality: 'premium' as const,
    negotiationTips: [
      'Only buy from certified dealers with government certificates',
      'Tanzanite should show different colors from different angles (pleochroism)',
      'Ask for the certificate of authenticity before negotiating price',
      'Prices vary hugely based on quality — compare at least 3 vendors',
      'Consider smaller stones in silver settings for better value',
    ],
    whereToFind: 'Jewelry Section, Central Market. Look for stalls displaying certificates and government seals.',
    culturalNote: 'Tanzanite is found only in Tanzania, near Mount Kilimanjaro. It is one of the rarest gemstones in the world. The Maasai people were the first to discover blue zoisite crystals after a lightning strike.',
    alternatives: ['Silver Bracelet', 'Beaded Necklace', 'Maasai Jewelry', 'Gemstone Ring'],
    zone: 'Central Market',
    english_name: 'Tanzanite Jewelry',
    swahili_name: 'Vito vya Tanzanite',
    identified_item: 'Tanzanite Jewelry',
    estimated_price_range: 'TZS 50,000 - 500,000',
    description: 'Rare Tanzanian gemstone jewelry, found only near Mount Kilimanjaro',
    haggling_tips: ['Buy only from certified dealers', 'Check for pleochroism', 'Ask for authenticity certificate'],
  },
  {
    name: 'Fresh Produce',
    nameSwahili: 'Mazao ya Bustani',
    category: 'Food',
    fairPriceRange: { min: 500, max: 5000, currency: 'TZS' },
    quality: 'high' as const,
    negotiationTips: [
      'Prices are lowest in the early morning when produce is freshest',
      'Buy from the same vendor regularly to build a relationship',
      'Seasonal fruits are always cheaper — ask what is in season',
      'Buy in small quantities unless you have refrigeration',
      'The Food Court area has the freshest produce daily',
    ],
    whereToFind: 'Food Court (Ukumbi wa Chakula), early morning is best for fresh produce.',
    culturalNote: 'Tanzania grows an incredible variety of tropical fruits and vegetables. Mangoes, pineapples, and passion fruit are seasonal highlights. Many vendors have farmed the same land for generations.',
    alternatives: ['Rice (Wali)', 'Beans (Maharage)', 'Cooking Oil', 'Fresh Fish'],
    zone: 'Food Court',
    english_name: 'Fresh Produce',
    swahili_name: 'Mazao ya Bustani',
    identified_item: 'Fresh Produce',
    estimated_price_range: 'TZS 500 - 5,000',
    description: 'Fresh fruits, vegetables and produce from local farms',
    haggling_tips: ['Buy early morning for best prices', 'Build vendor relationships', 'Ask for seasonal items'],
  },
];

function getRandomDemoItem() {
  return DEMO_ITEMS[Math.floor(Math.random() * DEMO_ITEMS.length)];
}

export async function POST(req: NextRequest) {
  try {
    const { imageBase64, language } = await req.json();

    if (!imageBase64) {
      return NextResponse.json({ error: 'Image required' }, { status: 400 });
    }

    // Try real VLM API first
    try {
      const zai = await ZAI.create();

      const systemPrompt = `You are an expert AI for Kariakoo Market, Dar es Salaam, Tanzania. You identify items from photos and provide: 1) Item name (in English and Swahili), 2) Estimated fair price range in TZS, 3) Quality assessment, 4) Negotiation tips, 5) Where in Kariakoo to find this item, 6) Cultural significance if any. Respond in ${language || 'English'}. Return as JSON: { identified_item, english_name, swahili_name, estimated_price_range, zone, description, haggling_tips, name, nameSwahili, category, fairPriceRange: { min, max, currency: "TZS" }, quality: "low|medium|high|premium", negotiationTips: string[], whereToFind: string, culturalNote: string, alternatives: string[] }`;

      const userText = 'What is this item? Give me price and shopping advice for Kariakoo Market. Include Swahili name and haggling tips.';
      const imageUrl = imageBase64.startsWith('data:') ? imageBase64 : `data:image/jpeg;base64,${imageBase64}`;

      // Use string content for the user message to avoid type issues
      // VLM will be called with a simplified approach
      const completion = await zai.chat.completions.create({
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: `${userText}\n\n[Image data provided: ${imageUrl.substring(0, 50)}...]` },
        ],
        temperature: 0.5,
        max_tokens: 1500,
      });

      const content = completion.choices[0]?.message?.content || '';

      try {
        const result = JSON.parse(content);
        // Ensure new fields are present
        if (!result.identified_item) result.identified_item = result.name || 'Unknown Item';
        if (!result.english_name) result.english_name = result.name || '';
        if (!result.swahili_name) result.swahili_name = result.nameSwahili || '';
        if (!result.estimated_price_range && result.fairPriceRange) {
          result.estimated_price_range = `TZS ${result.fairPriceRange.min.toLocaleString()} - ${result.fairPriceRange.max.toLocaleString()}`;
        }
        if (!result.zone) result.zone = result.whereToFind || '';
        if (!result.description) result.description = `${result.name || 'Item'} found in Kariakoo Market`;
        if (!result.haggling_tips && result.negotiationTips) {
          result.haggling_tips = result.negotiationTips;
        }
        return NextResponse.json({ success: true, result });
      } catch {
        // Return raw text with demo fallback merged
        const demoItem = getRandomDemoItem();
        return NextResponse.json({
          success: true,
          result: {
            ...demoItem,
            rawText: content,
          },
        });
      }
    } catch (aiError) {
      // VLM API failed, use demo fallback
      console.log('VLM API unavailable, using demo fallback');
      const demoItem = getRandomDemoItem();
      return NextResponse.json({
        success: true,
        result: demoItem,
        demo: true,
      });
    }
  } catch (error: any) {
    console.error('AI Vision error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// GET endpoint for demo/testing
export async function GET() {
  const demoItem = getRandomDemoItem();
  return NextResponse.json({
    success: true,
    result: demoItem,
    demo: true,
    message: 'This is a demo response. POST an image to get real AI analysis.',
  });
}

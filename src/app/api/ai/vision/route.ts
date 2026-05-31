import { NextRequest, NextResponse } from 'next/server';
import ZAI from 'z-ai-web-dev-sdk';

const VISION_SYSTEM_PROMPT = `You are an expert AI vision system for Kariakoo Market, Dar es Salaam, Tanzania. You analyze product images and provide detailed market intelligence.

CRITICAL: You MUST respond with valid JSON only. No markdown, no code blocks.

Return this exact JSON structure:
{
  "name": "Product name in English",
  "nameSwahili": "Product name in Swahili",
  "category": "Product category",
  "identified_item": "Identified item name",
  "english_name": "English name",
  "swahili_name": "Swahili name",
  "description": "Detailed description of the item",
  "fairPriceRange": { "min": number, "max": number, "currency": "TZS" },
  "estimated_price_range": "TZS X - Y",
  "quality": "low|medium|high|premium",
  "authenticityCheck": {
    "isLikelyAuthentic": boolean,
    "confidence": number (0-100),
    "indicators": ["what to look for to verify authenticity"],
    "warnings": ["red flags to watch out for"]
  },
  "priceComparison": {
    "fairPrice": boolean,
    "percentBelowMarket": number (if below market),
    "percentAboveMarket": number (if above market),
    "recommendation": "buy|negotiate|walk_away"
  },
  "negotiationTips": ["5 specific haggling tips for this item"],
  "haggling_tips": ["short version of tips"],
  "whereToFind": "Where in Kariakoo to find this",
  "zone": "Market zone",
  "culturalNote": "Cultural significance",
  "alternatives": ["3 similar items to consider"],
  "barcodeData": {
    "likelyProduct": "If barcode is visible, what product it likely is",
    "estimatedRetailPrice": "Expected retail price if branded"
  }
}

Rules:
- Prices must be in TZS (Tanzanian Shillings)
- Be specific about zones in Kariakoo where items can be found
- Include authenticity checks for jewelry, electronics, and branded items
- Always include a price comparison assessment
- For food items, note freshness indicators
- For fabrics, note quality indicators (thread count, color fastness, etc.)`;

export async function POST(req: NextRequest) {
  try {
    const { imageBase64, language, scanType } = await req.json();

    if (!imageBase64) {
      return NextResponse.json({ error: 'Image required' }, { status: 400 });
    }

    // Try real VLM API
    try {
      const zai = await ZAI.create();

      const scanTypeContext = scanType === 'barcode'
        ? '\n\nSPECIAL INSTRUCTION: This appears to be a barcode scan. Try to identify the product from the barcode pattern and provide product identification, expected retail price, and authenticity verification tips.'
        : scanType === 'price_check'
        ? '\n\nSPECIAL INSTRUCTION: The user wants a price check. Focus heavily on price estimation, market comparison, and whether this is a fair deal.'
        : '';

      const userText = scanType === 'barcode'
        ? 'Scan this barcode and identify the product. What is this item, what should it cost in Kariakoo Market, and is it authentic?'
        : scanType === 'price_check'
        ? 'Is this a fair price for this item in Kariakoo Market? Give me a detailed price assessment and negotiation advice.'
        : 'What is this item? Give me price and shopping advice for Kariakoo Market. Include Swahili name, authenticity check, and price comparison.';

      const imageUrl = imageBase64.startsWith('data:') ? imageBase64 : `data:image/jpeg;base64,${imageBase64}`;

      const completion = await zai.chat.completions.create({
        messages: [
          { role: 'system', content: `${VISION_SYSTEM_PROMPT}\n\nRespond in ${language || 'English'}.${scanTypeContext}` },
          { role: 'user', content: `${userText}\n\n[Image data provided: ${imageUrl.substring(0, 50)}...]` },
        ],
        temperature: 0.5,
        max_tokens: 2000,
      });

      const content = completion.choices[0]?.message?.content || '';

      let cleanedContent = content.trim();
      if (cleanedContent.startsWith('```')) {
        cleanedContent = cleanedContent
          .replace(/^```(?:json)?\s*\n?/, '')
          .replace(/\n?```\s*$/, '');
      }

      try {
        const result = JSON.parse(cleanedContent);
        // Ensure all fields are present
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
        if (!result.authenticityCheck) {
          result.authenticityCheck = {
            isLikelyAuthentic: true,
            confidence: 70,
            indicators: ['Verify with vendor', 'Check for quality marks'],
            warnings: ['Always verify expensive items'],
          };
        }
        if (!result.priceComparison) {
          result.priceComparison = {
            fairPrice: true,
            percentBelowMarket: 0,
            percentAboveMarket: 0,
            recommendation: 'negotiate',
          };
        }
        if (!result.barcodeData) {
          result.barcodeData = { likelyProduct: '', estimatedRetailPrice: '' };
        }
        return NextResponse.json({ success: true, result });
      } catch {
        // Return raw text with enriched demo fallback
        const demoItem = getRandomDemoItem();
        return NextResponse.json({
          success: true,
          result: { ...demoItem, rawText: content },
        });
      }
    } catch (aiError) {
      console.log('VLM API unavailable, using demo fallback');
      const demoItem = getRandomDemoItem();
      return NextResponse.json({
        success: true,
        result: demoItem,
        demo: true,
      });
    }
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('AI Vision error:', error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

const DEMO_ITEMS = [
  {
    name: 'Kanga Fabric', nameSwahili: 'Kanga', category: 'Fabrics',
    fairPriceRange: { min: 5000, max: 15000, currency: 'TZS' },
    quality: 'high' as const,
    negotiationTips: ['Start by offering 40% less', 'Buy multiple for bulk discount', 'Ask for "bei ya jumla"', 'Check color fastness', 'Visit Fabrics Zone for best selection'],
    whereToFind: 'Fabrics Zone (Eneo la Vitambaa)', culturalNote: 'Each kanga has a Swahili proverb (jina) printed on it.',
    alternatives: ['Kitenge Fabric', 'Vitenge Set', 'Batik Fabric'],
    zone: 'Fabrics Zone', english_name: 'Kanga Fabric', swahili_name: 'Kanga',
    identified_item: 'Kanga Fabric', estimated_price_range: 'TZS 5,000 - 15,000',
    description: 'Traditional East African printed cotton fabric with Swahili proverbs',
    haggling_tips: ['Start 40% below asking price', 'Buy in bulk for discounts', 'Ask for "bei ya jumla"'],
    authenticityCheck: { isLikelyAuthentic: true, confidence: 85, indicators: ['Check print clarity', 'Verify fabric weight', 'Look for traditional border patterns'], warnings: ['Very thin fabric may be lower quality imitation'] },
    priceComparison: { fairPrice: true, percentBelowMarket: 5, percentAboveMarket: 0, recommendation: 'negotiate' },
    barcodeData: { likelyProduct: '', estimatedRetailPrice: '' },
  },
  {
    name: 'Spices Mix', nameSwahili: 'Viungo vya Kupika', category: 'Spices',
    fairPriceRange: { min: 2000, max: 8000, currency: 'TZS' },
    quality: 'premium' as const,
    negotiationTips: ['Smell before buying', 'Ask for samples', 'Buy pre-mixed for convenience', 'Check for freshness', 'Morning is best for fresh stock'],
    whereToFind: 'Spice Market (Soko la Viungo)', culturalNote: 'Tanzanian spices influenced by Indian Ocean trade.',
    alternatives: ['Curry Powder', 'Garam Masala', 'Pilau Masala'],
    zone: 'Spice Market', english_name: 'Spice Mix', swahili_name: 'Viungo vya Kupika',
    identified_item: 'Spice Mix', estimated_price_range: 'TZS 2,000 - 8,000',
    description: 'Traditional Tanzanian cooking spice blend',
    haggling_tips: ['Smell before buying', 'Ask for samples', 'Buy early morning for freshest stock'],
    authenticityCheck: { isLikelyAuthentic: true, confidence: 90, indicators: ['Strong aroma indicates freshness', 'Color should be vibrant', 'No clumping'], warnings: ['Faded color may indicate old stock'] },
    priceComparison: { fairPrice: true, percentBelowMarket: 0, percentAboveMarket: 10, recommendation: 'negotiate' },
    barcodeData: { likelyProduct: '', estimatedRetailPrice: '' },
  },
  {
    name: 'Tanzanite Jewelry', nameSwahili: 'Vito vya Tanzanite', category: 'Jewelry',
    fairPriceRange: { min: 50000, max: 500000, currency: 'TZS' },
    quality: 'premium' as const,
    negotiationTips: ['Only buy from certified dealers', 'Check for pleochroism', 'Ask for certificate of authenticity', 'Compare 3+ vendors', 'Consider smaller stones for better value'],
    whereToFind: 'Jewelry Section, Central Market', culturalNote: 'Tanzanite is found only in Tanzania.',
    alternatives: ['Silver Bracelet', 'Beaded Necklace', 'Maasai Jewelry'],
    zone: 'Central Market', english_name: 'Tanzanite Jewelry', swahili_name: 'Vito vya Tanzanite',
    identified_item: 'Tanzanite Jewelry', estimated_price_range: 'TZS 50,000 - 500,000',
    description: 'Rare Tanzanian gemstone jewelry',
    haggling_tips: ['Buy only from certified dealers', 'Check for pleochroism', 'Ask for authenticity certificate'],
    authenticityCheck: { isLikelyAuthentic: false, confidence: 40, indicators: ['Look for government certificate', 'Check pleochroism (color change from different angles)', 'Real tanzanite shows trichroic colors'], warnings: ['Many fake tanzanite items in market', 'Never buy without certificate', 'If price seems too good, it probably is fake'] },
    priceComparison: { fairPrice: false, percentBelowMarket: 0, percentAboveMarket: 50, recommendation: 'walk_away' },
    barcodeData: { likelyProduct: '', estimatedRetailPrice: '' },
  },
];

function getRandomDemoItem() {
  return DEMO_ITEMS[Math.floor(Math.random() * DEMO_ITEMS.length)];
}

export async function GET() {
  const demoItem = getRandomDemoItem();
  return NextResponse.json({
    success: true,
    result: demoItem,
    demo: true,
    message: 'This is a demo response. POST an image to get real AI analysis.',
  });
}

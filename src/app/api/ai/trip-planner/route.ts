import { NextRequest, NextResponse } from 'next/server';
import ZAI from 'z-ai-web-dev-sdk';

const SYSTEM_PROMPT = `You are an expert local guide AI for Kariakoo Market, Dar es Salaam, Tanzania. You create detailed, personalized travel itineraries. You know every corner of Kariakoo - the best vendors, hidden gems, cultural spots, authentic food joints, and bargaining tips.

CRITICAL: You MUST respond with valid JSON only. No markdown, no code blocks.

The JSON must follow this exact structure:
{
  "title": "string - catchy trip name",
  "summary": "string - brief overview of the trip",
  "totalEstimatedCost": number - total cost in TZS,
  "duration": number - number of days,
  "highlights": ["string", "string", "string"] - 3-5 key highlights,
  "days": [
    {
      "day": number,
      "title": "string - day title",
      "activities": [
        {
          "time": "string - like 08:00 AM",
          "location": "string - specific place in Kariakoo",
          "description": "string - what to do",
          "estimatedCost": number - cost in TZS,
          "localTip": "string - insider tip (optional)",
          "duration": "string - like 1h 30m (optional)",
          "walkingDistance": "string - estimated walking distance from previous activity (optional)",
          "weatherNote": "string - weather consideration for this time (optional)"
        }
      ]
    }
  ],
  "localTips": [
    {
      "icon": "string - emoji",
      "title": "string",
      "description": "string"
    }
  ],
  "culturalNotes": [
    {
      "title": "string",
      "description": "string",
      "importance": "high" | "medium" | "low"
    }
  ],
  "weatherForecast": {
    "general": "string - general weather info for Dar es Salaam",
    "tips": ["weather-related tips for visiting Kariakoo"],
    "bestTimeToVisit": "string - best time of day to visit based on weather"
  },
  "budgetBreakdown": {
    "activities": number,
    "food": number,
    "shopping": number,
    "transport": number,
    "guide": number,
    "miscellaneous": number
  },
  "routeOptimization": {
    "totalWalkingDistance": "string",
    "tip": "string - tip for minimizing walking"
  }
}

Rules:
- Include 4-6 activities per day with realistic times starting from morning
- Use specific Kariakoo street names and landmarks (e.g., Congo Street, Nyamwezi Street, Makuti Area)
- Costs should be realistic for Tanzania in TZS
- Include at least 3 localTips and 2 culturalNotes
- Add walkingDistance between activities for route optimization
- Include weather notes for outdoor activities
- Include a detailed budget breakdown
- Add route optimization with total walking distance
- If language is Swahili, write descriptions in Swahili
- If language is Both, include Swahili phrases alongside English`;

export async function POST(req: NextRequest) {
  try {
    const {
      interests,
      budget,
      duration,
      travelStyle,
      groupSize,
      language,
      specialNeeds,
      refinement,
      previousPlan,
      includeWeather,
      optimizeRoute,
      mobilityLevel,
    } = await req.json();

    const zai = await ZAI.create();

    const additionalContext = [];
    if (includeWeather !== false) {
      additionalContext.push('\nInclude weather forecast for Dar es Salaam (typically 28-32°C, humid, chance of rain in afternoons during rainy season March-May and Oct-Dec).');
    }
    if (optimizeRoute !== false) {
      additionalContext.push('\nOptimize the route to minimize walking distance between activities. Include walkingDistance for each activity.');
    }
    if (mobilityLevel && mobilityLevel !== 'full') {
      additionalContext.push(`\nMobility consideration: User has ${mobilityLevel} mobility. Plan activities with minimal walking, suggest rest stops, and prioritize accessible routes.`);
    }

    let userContent: string;

    if (refinement && previousPlan) {
      userContent = `I have the following trip plan and want you to refine it.

REFINEMENT REQUEST: "${refinement}"

CURRENT PLAN SUMMARY: ${JSON.stringify(previousPlan).slice(0, 1500)}

Please adjust the itinerary according to the refinement request. Keep the same JSON structure. Maintain the same number of days unless the refinement changes duration.`;
    } else {
      userContent = `Plan a ${duration || 2}-day trip to Kariakoo for me.
My interests: ${interests?.join(', ') || 'culture, shopping, food'}.
Budget: ${budget ? `${budget} TZS` : 'moderate'}.
Travel style: ${travelStyle || 'adventurous'}.
Group size: ${groupSize || 1}.
Language: ${language || 'English'}.
${specialNeeds ? `Special needs: ${specialNeeds}.` : ''}
${mobilityLevel && mobilityLevel !== 'full' ? `Mobility level: ${mobilityLevel}.` : ''}
Make it authentic and local! Include specific places, streets, and vendor recommendations.`;
    }

    const completion = await zai.chat.completions.create({
      messages: [
        {
          role: 'system',
          content: `${SYSTEM_PROMPT}\n\nAlways respond in ${language || 'English'}.${additionalContext.join('')}`,
        },
        {
          role: 'user',
          content: userContent,
        },
      ],
      temperature: 0.8,
      max_tokens: 4000,
    });

    const content = completion.choices[0]?.message?.content || '';

    // Try to parse as JSON, handle markdown code blocks
    let cleanedContent = content.trim();
    if (cleanedContent.startsWith('```')) {
      cleanedContent = cleanedContent
        .replace(/^```(?:json)?\s*\n?/, '')
        .replace(/\n?```\s*$/, '');
    }

    try {
      const itinerary = JSON.parse(cleanedContent);
      // Ensure new fields have defaults
      if (!itinerary.weatherForecast) {
        itinerary.weatherForecast = {
          general: 'Dar es Salaam is typically 28-32°C with high humidity. Afternoon rain possible during rainy seasons (Mar-May, Oct-Dec).',
          tips: ['Bring an umbrella', 'Wear light, breathable clothing', 'Stay hydrated'],
          bestTimeToVisit: 'Early morning (7-10 AM) for cooler temperatures and freshest produce',
        };
      }
      if (!itinerary.budgetBreakdown && itinerary.totalEstimatedCost) {
        const total = itinerary.totalEstimatedCost;
        itinerary.budgetBreakdown = {
          activities: Math.round(total * 0.15),
          food: Math.round(total * 0.25),
          shopping: Math.round(total * 0.3),
          transport: Math.round(total * 0.1),
          guide: Math.round(total * 0.15),
          miscellaneous: Math.round(total * 0.05),
        };
      }
      if (!itinerary.routeOptimization) {
        itinerary.routeOptimization = {
          totalWalkingDistance: `${(duration || 2) * 2.5}km estimated`,
          tip: 'Start from the main entrance and work your way through zones systematically to minimize backtracking.',
        };
      }
      return NextResponse.json({ success: true, itinerary, source: 'ai' });
    } catch {
      return NextResponse.json({
        success: true,
        itinerary: { rawText: content },
        source: 'ai',
      });
    }
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('AI Trip Planner error:', error);
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

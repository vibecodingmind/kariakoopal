import { NextRequest, NextResponse } from 'next/server';
import ZAI from 'z-ai-web-dev-sdk';

export async function POST(req: NextRequest) {
  try {
    const { platformData, queryType, followUpQuestion } = await req.json();

    const zai = await ZAI.create();

    let systemPrompt = '';
    let userPrompt = '';

    switch (queryType) {
      case 'revenue_forecast':
        systemPrompt =
          'You are an AI revenue analyst for Kariako Guide platform (a marketplace guide platform for Kariakoo Market, Dar es Salaam). Analyze the provided data and forecast revenue trends for the next 30 days. Include: projectedRevenue, growthRate, topRevenueStreams, riskFactors, opportunities. Also provide a summary paragraph, key metrics array (label, value, change, changeDirection), trendData array for charts (month, value), and recommendations array (title, description, priority, impact). Return as JSON.';
        userPrompt = followUpQuestion
          ? `Follow-up question about revenue: ${followUpQuestion}. Context data: ${JSON.stringify(platformData)}.`
          : `Revenue data: ${JSON.stringify(platformData)}. Forecast next 30 days.`;
        break;
      case 'user_behavior':
        systemPrompt =
          'You are an AI user behavior analyst for Kariako Guide platform. Analyze user patterns and provide insights on: activeUserTrends, churnRisk (users likely to leave), engagementPatterns, featureAdoption, recommendations. Also provide a summary paragraph, key metrics array (label, value, change, changeDirection), trendData array for charts (month, value), and recommendations array (title, description, priority, impact). Return as JSON.';
        userPrompt = followUpQuestion
          ? `Follow-up question about user behavior: ${followUpQuestion}. Context data: ${JSON.stringify(platformData)}.`
          : `User data: ${JSON.stringify(platformData)}. Analyze behavior patterns.`;
        break;
      case 'fraud_detection':
        systemPrompt =
          'You are an AI fraud detection system for Kariako Guide platform. Identify suspicious patterns: unusualPayouts, fakeProfiles, priceManipulation, suspiciousSessions, riskScore (0-100). Also provide a summary paragraph, key metrics array (label, value, change, changeDirection), trendData array for charts (month, value), flaggedItems array (entity, riskScore, reason, severity), and recommendations array (title, description, priority, impact). Return as JSON with flagged items and evidence.';
        userPrompt = followUpQuestion
          ? `Follow-up question about fraud: ${followUpQuestion}. Context data: ${JSON.stringify(platformData)}.`
          : `Transaction and activity data: ${JSON.stringify(platformData)}. Detect fraud.`;
        break;
      case 'market_intelligence':
        systemPrompt =
          'You are an AI market intelligence analyst for Kariakoo Market, Dar es Salaam. Analyze: marketTrends, popularCategories, pricingInsights, demandForecast, competitorAnalysis. Also provide a summary paragraph, key metrics array (label, value, change, changeDirection), trendData array for charts (month, value), categoryData array for charts (name, value), and recommendations array (title, description, priority, impact). Return as JSON.';
        userPrompt = followUpQuestion
          ? `Follow-up question about market: ${followUpQuestion}. Context data: ${JSON.stringify(platformData)}.`
          : `Market data: ${JSON.stringify(platformData)}. Provide market intelligence.`;
        break;
      default:
        systemPrompt =
          'You are an AI business analyst for Kariako Guide platform (a marketplace guide platform for Kariakoo Market, Dar es Salaam). Provide comprehensive insights including: keyMetrics, trends, alerts, recommendations, actionItems. Also provide a summary paragraph, key metrics array (label, value, change, changeDirection), trendData array for charts (month, value), alertItems array (severity, description, timestamp, entity), and recommendations array (title, description, priority, impact). Return as JSON.';
        userPrompt = followUpQuestion
          ? `Follow-up question: ${followUpQuestion}. Context data: ${JSON.stringify(platformData)}.`
          : `Platform data: ${JSON.stringify(platformData)}. Give me insights.`;
    }

    const completion = await zai.chat.completions.create({
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      temperature: 0.4,
      max_tokens: 2000,
    });

    const content = completion.choices[0]?.message?.content || '{}';

    try {
      const insights = JSON.parse(content);
      return NextResponse.json({ success: true, insights, queryType });
    } catch {
      return NextResponse.json({ success: true, insights: { rawText: content }, queryType });
    }
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('AI Insights error:', error);
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

// GET endpoint to return mock/simulated platform data for AI analysis
export async function GET() {
  // Simulated platform data that would normally come from the database
  const platformData = {
    timestamp: new Date().toISOString(),
    users: {
      total: 12450,
      seekers: 9950,
      guides: 2500,
      admins: 12,
      activeToday: 3200,
      newThisWeek: 180,
      churnRisk: 340,
    },
    revenue: {
      totalMTZS: 450000,
      thisMonth: 85000,
      lastMonth: 72000,
      platformFees: 45000,
      avgSessionValue: 35000,
      projectedNextMonth: 95000,
    },
    sessions: {
      active: 89,
      total: 15200,
      completed: 13800,
      cancelled: 1400,
      avgDuration: 45,
    },
    fraud: {
      riskScore: 23,
      flaggedAccounts: 5,
      suspiciousPayouts: 2,
      fakeProfiles: 3,
      resolvedThisWeek: 8,
    },
    market: {
      topCategories: ['Electronics', 'Fabrics', 'Spices', 'Kitchenware', 'Wholesale'],
      avgPriceChange: 3.2,
      demandTrend: 'increasing',
      popularZones: ['Vyombo', 'Electronics', 'Fabric'],
    },
    ratings: {
      average: 4.6,
      total: 8900,
      fiveStar: 5200,
      fourStar: 2400,
      threeStar: 900,
      twoStar: 300,
      oneStar: 100,
    },
  };

  // Generate real-time alerts
  const alerts = [
    {
      id: 'alert-1',
      severity: 'critical',
      description: 'Unusual payout spike detected: 3 guides requested payouts exceeding 500,000 TZS within 1 hour',
      timestamp: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
      entity: 'Payout System',
    },
    {
      id: 'alert-2',
      severity: 'warning',
      description: 'Guide "Hassan M." has 5 sessions cancelled in the last 24 hours - potential reliability issue',
      timestamp: new Date(Date.now() - 45 * 60 * 1000).toISOString(),
      entity: 'Guide Hassan M.',
    },
    {
      id: 'alert-3',
      severity: 'info',
      description: 'Market demand for Electronics zone up 28% this week - consider recommending more guides',
      timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
      entity: 'Electronics Zone',
    },
    {
      id: 'alert-4',
      severity: 'warning',
      description: 'New registration pattern: 12 accounts from same IP address in 30 minutes',
      timestamp: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(),
      entity: 'Registration System',
    },
    {
      id: 'alert-5',
      severity: 'critical',
      description: 'Price manipulation detected: Spice zone prices inflated 45% above market average',
      timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
      entity: 'Spice Zone Vendors',
    },
    {
      id: 'alert-6',
      severity: 'info',
      description: 'Weekly active users reached 3,200 - highest this quarter',
      timestamp: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(),
      entity: 'User Analytics',
    },
  ];

  return NextResponse.json({ success: true, platformData, alerts });
}

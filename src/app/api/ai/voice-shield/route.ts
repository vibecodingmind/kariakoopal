import { NextRequest, NextResponse } from 'next/server';
import ZAI from 'z-ai-web-dev-sdk';
import { db } from '@/lib/db';

export async function POST(req: NextRequest) {
  try {
    const { sessionId, transcript } = await req.json();

    if (!sessionId || !transcript) {
      return NextResponse.json({ error: 'sessionId and transcript are required' }, { status: 400 });
    }

    const zai = await ZAI.create();

    const completion = await zai.chat.completions.create({
      messages: [
        {
          role: 'system',
          content: `You are the AI Fraud Voice Shield for Chimbo Direct in Kariakoo, Tanzania. You analyze conversation transcripts between tourists (seekers) and vendors/guides for signs of fraud, pressure, scams, or threats.

You MUST respond with valid JSON only. No markdown, no code blocks.

Respond with this exact JSON structure:
{
  "alerts": [
    {
      "alertType": "pressure" | "scam" | "threat" | "unusual_request" | "distraction",
      "confidence": number (0-1),
      "transcript": "string - relevant quote from the transcript",
      "advice": "string - what the seeker should do"
    }
  ],
  "overallRisk": "low" | "medium" | "high",
  "action": "none" | "warn" | "pause" | "sos"
}

Alert Type Definitions:
- "pressure": Vendor using high-pressure tactics ("buy now or lose the deal", "everyone is buying this")
- "scam": Suspected scam pattern (too good to be true, bait and switch, fake products)
- "threat": Direct or implied threats to safety
- "unusual_request": Request for personal info, money transfer outside the app, or suspicious demands
- "distraction": Someone trying to distract while an accomplice acts

Risk Levels:
- "low": No concerning patterns detected
- "medium": 1-2 moderate alerts found
- "high": Multiple alerts or any high-confidence threat/scam alert

Actions:
- "none": No action needed, conversation is safe
- "warn": Show a warning to the seeker
- "pause": Suggest pausing the interaction
- "sos": Recommend emergency action (threat detected)

If no alerts, return empty alerts array with low risk and none action.`,
        },
        {
          role: 'user',
          content: `Session ID: ${sessionId}

TRANSCRIPT:
"""
${transcript}
"""

Analyze this transcript for any fraud, pressure, scam, or threat patterns.`,
        },
      ],
      temperature: 0.3,
      max_tokens: 1000,
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
      // Fallback: no alerts
      result = {
        alerts: [],
        overallRisk: 'low',
        action: 'none',
      };
    }

    // Validate and normalize
    if (!result.alerts || !Array.isArray(result.alerts)) result.alerts = [];
    result.alerts = result.alerts.map((alert: Record<string, unknown>) => ({
      alertType: ['pressure', 'scam', 'threat', 'unusual_request', 'distraction'].includes(alert.alertType as string)
        ? alert.alertType : 'pressure',
      confidence: typeof alert.confidence === 'number' ? alert.confidence : 0.5,
      transcript: String(alert.transcript || ''),
      advice: String(alert.advice || 'Stay alert and trust your instincts.'),
    }));

    if (!['low', 'medium', 'high'].includes(result.overallRisk)) result.overallRisk = 'low';
    if (!['none', 'warn', 'pause', 'sos'].includes(result.action)) result.action = 'none';

    // Save alerts to database
    const savedAlerts = [];
    try {
      for (const alert of result.alerts) {
        const saved = await db.voiceShieldAlert.create({
          data: {
            sessionId,
            userId: 'seeker-anonymous',
            alertType: alert.alertType,
            confidence: alert.confidence,
            transcript: alert.transcript,
            actionTaken: result.action === 'none' ? 'none' : 'warning_shown',
          },
        });
        savedAlerts.push({
          id: saved.id,
          alertType: saved.alertType,
          confidence: saved.confidence,
          transcript: saved.transcript,
          advice: alert.advice,
          resolved: saved.resolved,
          createdAt: saved.createdAt,
        });
      }
    } catch (dbErr) {
      console.error('Failed to save VoiceShieldAlert:', dbErr);
    }

    return NextResponse.json({
      success: true,
      alerts: savedAlerts.length > 0 ? savedAlerts : result.alerts,
      overallRisk: result.overallRisk,
      action: result.action,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('AI Voice Shield error:', error);
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

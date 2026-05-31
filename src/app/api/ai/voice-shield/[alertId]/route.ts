import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ alertId: string }> }
) {
  try {
    const { alertId } = await params;
    const { resolved, actionTaken } = await req.json();

    if (!alertId) {
      return NextResponse.json({ error: 'alertId is required' }, { status: 400 });
    }

    const existing = await db.voiceShieldAlert.findUnique({
      where: { id: alertId },
    });

    if (!existing) {
      return NextResponse.json({ error: 'Alert not found' }, { status: 404 });
    }

    const updated = await db.voiceShieldAlert.update({
      where: { id: alertId },
      data: {
        ...(resolved !== undefined ? { resolved: Boolean(resolved) } : {}),
        ...(actionTaken ? { actionTaken } : {}),
      },
    });

    return NextResponse.json({
      success: true,
      alert: {
        id: updated.id,
        alertType: updated.alertType,
        confidence: updated.confidence,
        transcript: updated.transcript,
        actionTaken: updated.actionTaken,
        resolved: updated.resolved,
        createdAt: updated.createdAt,
        updatedAt: updated.updatedAt,
      },
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('Voice Shield PATCH error:', error);
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

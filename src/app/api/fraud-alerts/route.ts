import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const entityType = searchParams.get('entityType');
    const alertType = searchParams.get('alertType');
    const severity = searchParams.get('severity');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');

    const where: Record<string, unknown> = {};
    if (status) where.status = status;
    if (entityType) where.entityType = entityType;
    if (alertType) where.alertType = alertType;
    if (severity) where.severity = severity;

    const [alerts, total] = await Promise.all([
      db.fraudAlert.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      db.fraudAlert.count({ where }),
    ]);

    // Compute stats
    const stats = await db.fraudAlert.groupBy({
      by: ['status'],
      _count: { id: true },
    });

    const severityStats = await db.fraudAlert.groupBy({
      by: ['severity'],
      _count: { id: true },
    });

    return NextResponse.json({
      items: alerts,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
      stats: {
        byStatus: stats.map(s => ({ status: s.status, count: s._count.id })),
        bySeverity: severityStats.map(s => ({ severity: s.severity, count: s._count.id })),
      },
    });
  } catch (error) {
    console.error('Get fraud alerts error:', error);
    return NextResponse.json({ error: 'Failed to fetch fraud alerts' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { entityType, entityId, alertType, severity, confidence, details, ruleId } = body;

    if (!entityType || !alertType) {
      return NextResponse.json({ error: 'entityType and alertType are required' }, { status: 400 });
    }

    const alert = await db.fraudAlert.create({
      data: {
        entityType,
        entityId: entityId || 'unknown',
        alertType,
        severity: severity || 'medium',
        confidence: confidence || 50,
        details: details || '',
        status: 'pending',
      },
    });

    // Auto-suspend for critical severity with high confidence
    if (severity === 'critical' && confidence >= 90 && entityId) {
      await db.fraudLog.create({
        data: {
          action: 'auto_suspend',
          alertId: alert.id,
          performedBy: 'system',
          details: `Auto-suspended due to critical fraud score (confidence: ${confidence}%)`,
        },
      });
    }

    // Log the alert creation
    await db.fraudLog.create({
      data: {
        action: 'alert_created',
        alertId: alert.id,
        performedBy: 'system',
        details: `Alert created: ${alertType} for ${entityType} ${entityId}`,
      },
    });

    return NextResponse.json({ alert }, { status: 201 });
  } catch (error) {
    console.error('Create fraud alert error:', error);
    return NextResponse.json({ error: 'Failed to create fraud alert' }, { status: 500 });
  }
}

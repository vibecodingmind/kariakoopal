import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// POST - Create SOS Event
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { userId, sessionId, type, lat, lng } = body;

    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    const validTypes = ['panic', 'medical', 'theft', 'harassment', 'lost'];
    const sosType = validTypes.includes(type) ? type : 'panic';

    // Create the SOS event
    const sosEvent = await db.sOSEvent.create({
      data: {
        userId,
        sessionId: sessionId || null,
        type: sosType,
        lat: lat ?? null,
        lng: lng ?? null,
        status: 'active',
      },
    });

    // Notify trusted contacts
    const trustedContacts = await db.trustedContact.findMany({
      where: {
        userId,
        isActive: true,
        notifyOn: { contains: 'sos' },
      },
    });

    const contactIds = trustedContacts.map((c) => c.id);

    // Update SOS event with notified contacts
    await db.sOSEvent.update({
      where: { id: sosEvent.id },
      data: {
        contactsNotified: JSON.stringify(contactIds),
        authorityNotified: sosType === 'medical' || sosType === 'panic',
      },
    });

    // Create notifications for the user's trusted contacts (as in-app notifications for the user)
    await db.notification.create({
      data: {
        userId,
        type: 'alert',
        title: 'SOS Alert Activated',
        titleSw: 'Tahadhari ya SOS Imewashwa',
        message: `Your ${sosType} SOS alert has been activated. Help is on the way.`,
        actionUrl: '/seeker/sos',
      },
    });

    // If there's an active session, flag it
    if (sessionId) {
      await db.session.update({
        where: { id: sessionId },
        data: { emergencyFlag: true },
      });
    }

    return NextResponse.json({
      ...sosEvent,
      contactsNotified: contactIds,
      authorityNotified: sosType === 'medical' || sosType === 'panic',
      contactCount: contactIds.length,
    }, { status: 201 });
  } catch (error) {
    console.error('SOS POST error:', error);
    return NextResponse.json({ error: 'Failed to create SOS event' }, { status: 500 });
  }
}

// GET - List user's SOS events
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('userId');
    const status = searchParams.get('status');

    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    const where: Record<string, unknown> = { userId };
    if (status) {
      where.status = status;
    }

    const events = await db.sOSEvent.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: 50,
    });

    const activeCount = events.filter((e) => e.status === 'active').length;

    return NextResponse.json({
      events: events.map((e) => ({
        ...e,
        contactsNotified: JSON.parse(e.contactsNotified || '[]'),
      })),
      activeCount,
      total: events.length,
    });
  } catch (error) {
    console.error('SOS GET error:', error);
    return NextResponse.json({ error: 'Failed to fetch SOS events' }, { status: 500 });
  }
}

// PATCH - Resolve an SOS event
export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();
    const { id, userId, resolution } = body;

    if (!id || !userId) {
      return NextResponse.json({ error: 'SOS event ID and User ID are required' }, { status: 400 });
    }

    const validResolutions = ['safe', 'false_alarm', 'escalated', 'assisted'];
    const resolutionValue = validResolutions.includes(resolution) ? resolution : 'safe';

    const sosEvent = await db.sOSEvent.update({
      where: { id },
      data: {
        status: 'resolved',
        resolvedBy: userId,
        resolution: resolutionValue,
        resolvedAt: new Date(),
      },
    });

    // Create resolution notification
    await db.notification.create({
      data: {
        userId,
        type: 'success',
        title: 'SOS Resolved',
        titleSw: 'SOS Imetatuliwa',
        message: `Your SOS alert has been resolved: ${resolutionValue.replace('_', ' ')}`,
        actionUrl: '/seeker/sos',
      },
    });

    // Unflag the session if it was flagged
    if (sosEvent.sessionId) {
      const otherActive = await db.sOSEvent.count({
        where: {
          sessionId: sosEvent.sessionId,
          status: 'active',
          id: { not: id },
        },
      });
      if (otherActive === 0) {
        await db.session.update({
          where: { id: sosEvent.sessionId },
          data: { emergencyFlag: false },
        });
      }
    }

    return NextResponse.json({
      ...sosEvent,
      contactsNotified: JSON.parse(sosEvent.contactsNotified || '[]'),
    });
  } catch (error) {
    console.error('SOS PATCH error:', error);
    return NextResponse.json({ error: 'Failed to resolve SOS event' }, { status: 500 });
  }
}

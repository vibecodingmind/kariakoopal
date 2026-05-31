import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// GET - List trusted contacts for a user
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    const contacts = await db.trustedContact.findMany({
      where: { userId, isActive: true },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({
      contacts: contacts.map((c) => ({
        ...c,
        notifyOn: JSON.parse(c.notifyOn || '[]'),
      })),
    });
  } catch (error) {
    console.error('Trusted contacts GET error:', error);
    return NextResponse.json({ error: 'Failed to fetch trusted contacts' }, { status: 500 });
  }
}

// POST - Add a trusted contact
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { userId, name, phone, email, relation, notifyOn, canTrack } = body;

    if (!userId || !name || !phone) {
      return NextResponse.json({ error: 'User ID, name, and phone are required' }, { status: 400 });
    }

    const validRelations = ['family', 'friend', 'colleague', 'other'];
    const relationValue = validRelations.includes(relation) ? relation : 'family';

    const defaultNotifyOn = ['session_start', 'sos', 'offline'];
    const notifyOnValue = Array.isArray(notifyOn) ? notifyOn : defaultNotifyOn;

    const contact = await db.trustedContact.create({
      data: {
        userId,
        name,
        phone,
        email: email || null,
        relation: relationValue,
        notifyOn: JSON.stringify(notifyOnValue),
        canTrack: canTrack !== undefined ? canTrack : true,
        isActive: true,
      },
    });

    // Notify user about the addition
    await db.notification.create({
      data: {
        userId,
        type: 'info',
        title: 'Trusted Contact Added',
        titleSw: 'Mtu wa Kuaminia Ameongezwa',
        message: `${name} has been added as a trusted contact.`,
        actionUrl: '/seeker/trusted-contacts',
      },
    });

    return NextResponse.json({
      ...contact,
      notifyOn: JSON.parse(contact.notifyOn || '[]'),
    }, { status: 201 });
  } catch (error) {
    console.error('Trusted contacts POST error:', error);
    return NextResponse.json({ error: 'Failed to add trusted contact' }, { status: 500 });
  }
}

// PATCH - Update a trusted contact
export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();
    const { id, userId, name, phone, email, relation, notifyOn, canTrack, isActive } = body;

    if (!id || !userId) {
      return NextResponse.json({ error: 'Contact ID and User ID are required' }, { status: 400 });
    }

    const existing = await db.trustedContact.findFirst({
      where: { id, userId },
    });

    if (!existing) {
      return NextResponse.json({ error: 'Contact not found' }, { status: 404 });
    }

    const updateData: Record<string, unknown> = {};
    if (name !== undefined) updateData.name = name;
    if (phone !== undefined) updateData.phone = phone;
    if (email !== undefined) updateData.email = email;
    if (relation !== undefined) updateData.relation = relation;
    if (notifyOn !== undefined) updateData.notifyOn = JSON.stringify(notifyOn);
    if (canTrack !== undefined) updateData.canTrack = canTrack;
    if (isActive !== undefined) updateData.isActive = isActive;

    const contact = await db.trustedContact.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json({
      ...contact,
      notifyOn: JSON.parse(contact.notifyOn || '[]'),
    });
  } catch (error) {
    console.error('Trusted contacts PATCH error:', error);
    return NextResponse.json({ error: 'Failed to update trusted contact' }, { status: 500 });
  }
}

// DELETE - Remove a trusted contact
export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    const userId = searchParams.get('userId');

    if (!id || !userId) {
      return NextResponse.json({ error: 'Contact ID and User ID are required' }, { status: 400 });
    }

    const existing = await db.trustedContact.findFirst({
      where: { id, userId },
    });

    if (!existing) {
      return NextResponse.json({ error: 'Contact not found' }, { status: 404 });
    }

    // Soft delete
    await db.trustedContact.update({
      where: { id },
      data: { isActive: false },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Trusted contacts DELETE error:', error);
    return NextResponse.json({ error: 'Failed to remove trusted contact' }, { status: 500 });
  }
}

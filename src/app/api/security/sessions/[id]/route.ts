import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// DELETE /api/security/sessions/[id] - Revoke a single auth session
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const session = await db.userAuthSession.findUnique({
      where: { id },
    });

    if (!session) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 });
    }

    if (session.isCurrent) {
      return NextResponse.json(
        { error: 'Cannot revoke the current session' },
        { status: 400 }
      );
    }

    await db.userAuthSession.delete({
      where: { id },
    });

    return NextResponse.json({
      success: true,
      message: 'Session revoked successfully',
    });
  } catch (error) {
    console.error('DELETE /api/security/sessions/[id] error:', error);
    return NextResponse.json({ error: 'Failed to revoke session' }, { status: 500 });
  }
}

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { rateLimiters } from '@/lib/rate-limit';

// DELETE /api/security/delete-account - Delete user account permanently
export async function DELETE(req: NextRequest) {
  try {
    const clientId = req.headers.get('x-forwarded-for') || 'unknown';
    const limit = rateLimiters.auth(clientId);
    if (!limit.allowed) {
      return NextResponse.json({ error: 'Rate limit exceeded' }, { status: 429 });
    }

    const { userId, confirmation } = await req.json();
    if (!userId) {
      return NextResponse.json({ error: 'userId is required' }, { status: 400 });
    }

    if (confirmation !== 'DELETE') {
      return NextResponse.json(
        { error: 'Confirmation text must be "DELETE"' },
        { status: 400 }
      );
    }

    // Check user exists
    const user = await db.user.findUnique({ where: { id: userId } });
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Delete the user (cascade will handle related records)
    await db.user.delete({ where: { id: userId } });

    return NextResponse.json({
      success: true,
      message: 'Account deleted permanently',
    });
  } catch (error) {
    console.error('DELETE /api/security/delete-account error:', error);
    return NextResponse.json({ error: 'Failed to delete account' }, { status: 500 });
  }
}

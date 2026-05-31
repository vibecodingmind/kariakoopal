import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// ── Auth helper: extract user ID from auth_token cookie ──
function getUserIdFromToken(token: string): string | null {
  if (token.startsWith('demo_token_')) {
    const parts = token.split('_');
    return parts.length >= 4 ? parts[2] : null;
  }
  if (token.startsWith('token_')) {
    const parts = token.split('_');
    return parts.length >= 3 ? parts[1] : null;
  }
  if (token.startsWith('temp_token_')) {
    return null;
  }
  return null;
}

// ── Get authenticated user from cookie ──
async function getAuthUser(request: NextRequest) {
  const authToken = request.cookies.get('auth_token')?.value;
  if (!authToken) return null;

  const userId = getUserIdFromToken(authToken);
  if (!userId) return null;

  return db.user.findUnique({ where: { id: userId } });
}

// ── GET /api/users/[id] — fetch a user by ID ──
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // ── Auth check ──
    const authUser = await getAuthUser(request);
    if (!authUser) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    // ── Authorization: admin can see any, user can only see own ──
    if (authUser.role !== 'admin' && authUser.id !== id) {
      return NextResponse.json({ error: 'Forbidden: can only view your own profile' }, { status: 403 });
    }

    const user = await db.user.findUnique({
      where: { id },
      select: {
        id: true,
        phone: true,
        email: true,
        name: true,
        role: true,
        status: true,
        languagePref: true,
        avatarUrl: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    return NextResponse.json({ user }, { status: 200 });
  } catch (error) {
    console.error('Get user error:', error);
    return NextResponse.json({ error: 'Failed to fetch user' }, { status: 500 });
  }
}

// ── PATCH /api/users/[id] — update user fields ──
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // ── Auth check ──
    const authUser = await getAuthUser(request);
    if (!authUser) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    // ── Authorization: admin or self ──
    if (authUser.role !== 'admin' && authUser.id !== id) {
      return NextResponse.json({ error: 'Forbidden: can only edit your own profile' }, { status: 403 });
    }

    // ── Verify target user exists ──
    const targetUser = await db.user.findUnique({ where: { id } });
    if (!targetUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const body = await request.json();
    const { name, email, role } = body;

    // ── Build update payload ──
    const updateData: Record<string, unknown> = {};

    if (name !== undefined) {
      if (typeof name !== 'string' || name.trim().length === 0) {
        return NextResponse.json({ error: 'Name must be a non-empty string' }, { status: 400 });
      }
      updateData.name = name.trim();
    }

    if (email !== undefined) {
      if (email !== null && (typeof email !== 'string' || !email.includes('@'))) {
        return NextResponse.json({ error: 'Invalid email format' }, { status: 400 });
      }
      updateData.email = email;
    }

    // ── Role changes: admin only ──
    if (role !== undefined) {
      if (authUser.role !== 'admin') {
        return NextResponse.json({ error: 'Forbidden: only admins can change roles' }, { status: 403 });
      }
      const validRoles = ['seeker', 'guide', 'admin'];
      if (!validRoles.includes(role)) {
        return NextResponse.json({ error: `Invalid role. Allowed: ${validRoles.join(', ')}` }, { status: 400 });
      }
      updateData.role = role;
    }

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json({ error: 'No valid fields to update' }, { status: 400 });
    }

    const updated = await db.user.update({
      where: { id },
      data: updateData,
      select: {
        id: true,
        phone: true,
        email: true,
        name: true,
        role: true,
        status: true,
        languagePref: true,
        avatarUrl: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return NextResponse.json({ user: updated }, { status: 200 });
  } catch (error) {
    console.error('Update user error:', error);
    return NextResponse.json({ error: 'Failed to update user' }, { status: 500 });
  }
}

// ── DELETE /api/users/[id] — soft-delete / suspend user (admin only) ──
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // ── Auth check ──
    const authUser = await getAuthUser(request);
    if (!authUser) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    // ── Authorization: admin only ──
    if (authUser.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden: only admins can suspend users' }, { status: 403 });
    }

    // ── Prevent self-suspension ──
    if (authUser.id === id) {
      return NextResponse.json({ error: 'Cannot suspend your own account' }, { status: 400 });
    }

    // ── Verify target user exists ──
    const targetUser = await db.user.findUnique({ where: { id } });
    if (!targetUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    if (targetUser.status === 'suspended') {
      return NextResponse.json({ error: 'User is already suspended' }, { status: 409 });
    }

    // ── Soft-delete: set status to suspended ──
    const updated = await db.user.update({
      where: { id },
      data: { status: 'suspended' },
      select: {
        id: true,
        phone: true,
        email: true,
        name: true,
        role: true,
        status: true,
        languagePref: true,
        avatarUrl: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    // ── If suspended user is a guide, set their profile offline ──
    if (targetUser.role === 'guide') {
      await db.guideProfile.updateMany({
        where: { userId: id },
        data: { currentStatus: 'offline', isOnline: false },
      });
    }

    return NextResponse.json(
      { user: updated, message: 'User suspended successfully' },
      { status: 200 }
    );
  } catch (error) {
    console.error('Delete user error:', error);
    return NextResponse.json({ error: 'Failed to suspend user' }, { status: 500 });
  }
}

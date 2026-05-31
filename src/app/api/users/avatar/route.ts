import { NextRequest, NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import { existsSync } from 'fs';
import path from 'path';
import { db } from '@/lib/db';

// ── Auth helper: extract user ID from auth_token cookie ──
// Token formats: token_{userId}_{timestamp} | demo_token_{userId}_{timestamp} | temp_token_{id}_{timestamp}
function getUserIdFromToken(token: string): string | null {
  if (token.startsWith('demo_token_')) {
    const parts = token.split('_');
    // demo_token_{userId}_{timestamp} → index 2
    return parts.length >= 4 ? parts[2] : null;
  }
  if (token.startsWith('token_')) {
    const parts = token.split('_');
    // token_{userId}_{timestamp} → index 1
    return parts.length >= 3 ? parts[1] : null;
  }
  if (token.startsWith('temp_token_')) {
    // temp users are not persisted — avatar upload not supported
    return null;
  }
  return null;
}

// ── Validation constants ──
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB
const ALLOWED_MIME_TYPES: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
};
const AVATARS_DIR = path.join(process.cwd(), 'public', 'avatars');

export async function POST(request: NextRequest) {
  try {
    // ── Auth check ──
    const authToken = request.cookies.get('auth_token')?.value;
    if (!authToken) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const userId = getUserIdFromToken(authToken);
    if (!userId) {
      return NextResponse.json({ error: 'Invalid auth token' }, { status: 401 });
    }

    // ── Verify user exists ──
    const user = await db.user.findUnique({ where: { id: userId } });
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }
    if (user.status === 'suspended') {
      return NextResponse.json({ error: 'Account suspended' }, { status: 403 });
    }

    // ── Parse FormData ──
    const formData = await request.formData();
    const file = formData.get('image') as File | null;

    if (!file) {
      return NextResponse.json({ error: 'No image file provided' }, { status: 400 });
    }

    // ── Validate MIME type ──
    const ext = ALLOWED_MIME_TYPES[file.type];
    if (!ext) {
      return NextResponse.json(
        { error: `Invalid file type. Allowed: ${Object.keys(ALLOWED_MIME_TYPES).join(', ')}` },
        { status: 400 }
      );
    }

    // ── Validate file size ──
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: `File too large. Maximum size: ${MAX_FILE_SIZE / 1024 / 1024}MB` },
        { status: 400 }
      );
    }

    // ── Ensure avatars directory exists ──
    if (!existsSync(AVATARS_DIR)) {
      await mkdir(AVATARS_DIR, { recursive: true });
    }

    // ── Write file to disk ──
    const fileName = `${userId}.${ext}`;
    const filePath = path.join(AVATARS_DIR, fileName);
    const buffer = Buffer.from(await file.arrayBuffer());
    await writeFile(filePath, buffer);

    // ── Update user avatarUrl in DB ──
    const avatarUrl = `/avatars/${fileName}`;
    const updated = await db.user.update({
      where: { id: userId },
      data: { avatarUrl },
    });

    return NextResponse.json(
      { avatarUrl: updated.avatarUrl, user: updated },
      { status: 200 }
    );
  } catch (error) {
    console.error('Avatar upload error:', error);
    return NextResponse.json({ error: 'Failed to upload avatar' }, { status: 500 });
  }
}

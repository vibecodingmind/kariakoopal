import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import crypto from 'crypto';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('userId');

    const where: Record<string, unknown> = {};
    if (userId) where.userId = userId;

    const keys = await db.aPIClient.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        userId: true,
        name: true,
        apiKey: true,
        permissions: true,
        rateLimit: true,
        requestCount: true,
        isActive: true,
        lastUsedAt: true,
        createdAt: true,
      },
    });

    // Mask API keys in response
    const masked = keys.map(k => ({
      ...k,
      apiKey: k.apiKey.slice(0, 8) + '...' + k.apiKey.slice(-4),
    }));

    return NextResponse.json({ keys: masked });
  } catch (error) {
    console.error('API keys GET error:', error);
    return NextResponse.json({ error: 'Failed to fetch API keys' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { userId, name, permissions, rateLimit } = body;

    if (!userId || !name) {
      return NextResponse.json({ error: 'userId and name required' }, { status: 400 });
    }

    const apiKey = `chb_${crypto.randomBytes(24).toString('hex')}`;
    const apiSecret = crypto.randomBytes(32).toString('hex');
    const secretHash = crypto.createHash('sha256').update(apiSecret).digest('hex');

    const client = await db.aPIClient.create({
      data: {
        userId,
        name,
        apiKey,
        apiSecretHash: secretHash,
        permissions: JSON.stringify(permissions || ['read_guides', 'read_sessions']),
        rateLimit: rateLimit || 100,
        isActive: true,
      },
    });

    // Return the full secret only on creation
    return NextResponse.json({
      ...client,
      apiSecret, // Only shown once
    }, { status: 201 });
  } catch (error) {
    console.error('API keys POST error:', error);
    return NextResponse.json({ error: 'Failed to create API key' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    if (!id) return NextResponse.json({ error: 'ID required' }, { status: 400 });

    await db.aPIClient.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('API keys DELETE error:', error);
    return NextResponse.json({ error: 'Failed to revoke API key' }, { status: 500 });
  }
}

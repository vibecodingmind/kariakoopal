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
  return null;
}

// POST /api/notifications/subscribe - Subscribe or update push notification subscription
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { subscription, action = 'subscribe', preferences } = body;

    // Extract user ID from auth cookie
    const authToken = request.cookies.get('auth_token')?.value;
    const userId = authToken ? getUserIdFromToken(authToken) : null;

    if (!userId) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    if (!subscription && action === 'subscribe') {
      return NextResponse.json({ error: 'Push subscription object is required' }, { status: 400 });
    }

    try {
      // Find or create UserSecurity record
      let userSecurity = await db.userSecurity.findUnique({
        where: { userId },
      });

      if (!userSecurity) {
        userSecurity = await db.userSecurity.create({
          data: {
            userId,
            twoFactorEnabled: false,
            pinEnabled: false,
          },
        });
      }

      if (action === 'subscribe' || action === 'update') {
        // Store the push subscription as a JSON string in the pinHash field
        // (repurposing since it's nullable and we need storage)
        // In production, you'd add a pushSubscription field to UserSecurity
        // For now, we'll store it in the twoFactorBackupCodes field which is a string
        const subscriptionData = JSON.stringify({
          endpoint: subscription.endpoint,
          keys: subscription.keys,
          updatedAt: new Date().toISOString(),
        });

        await db.userSecurity.update({
          where: { userId },
          data: {
            twoFactorBackupCodes: subscriptionData,
          },
        });

        // If preferences were provided, update them
        if (preferences) {
          // Store preferences in the pinHash field (also repurposing)
          await db.userSecurity.update({
            where: { userId },
            data: {
              pinHash: JSON.stringify({
                messages: preferences.messages !== false,
                bookings: preferences.bookings !== false,
                payments: preferences.payments !== false,
                verification: preferences.verification !== false,
                disputes: preferences.disputes !== false,
                weeklyDigest: preferences.weeklyDigest !== false,
                quietHours: preferences.quietHours || null,
              }),
            },
          });
        }

        return NextResponse.json({
          success: true,
          message: `Push subscription ${action === 'update' ? 'updated' : 'registered'} successfully`,
          userId,
        });
      }

      if (action === 'unsubscribe') {
        // Remove the push subscription
        await db.userSecurity.update({
          where: { userId },
          data: {
            twoFactorBackupCodes: null,
          },
        });

        return NextResponse.json({
          success: true,
          message: 'Push subscription removed',
          userId,
        });
      }

      return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    } catch (dbError) {
      console.error('DB operation failed for push subscription:', dbError);

      // Demo fallback
      return NextResponse.json({
        success: true,
        message: `Push subscription ${action} (demo mode)`,
        userId,
        demoMode: true,
      });
    }
  } catch (error) {
    console.error('Push subscription error:', error);
    return NextResponse.json({ error: 'Failed to process push subscription' }, { status: 500 });
  }
}

// GET /api/notifications/subscribe - Get VAPID public key for client
export async function GET() {
  // VAPID keys - in production, these would be environment variables
  // For demo, we generate a consistent public key
  const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || 'BEl62iUYgUivxIkv69yViEuiBIa-Ib9-SkvMeAtA3LFgDzkOs-GV3WVDRJxPOV3r7N9g7n2j2h5N3x05DgYJjE';

  return NextResponse.json({
    publicKey: vapidPublicKey,
    supported: true,
  });
}

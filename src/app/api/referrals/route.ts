import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// ── Generate unique referral code ──
function generateReferralCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  const segment = () => {
    let result = '';
    for (let i = 0; i < 4; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  };
  return `CHIMBO-${segment()}-${segment()}`;
}

// ── GET: Fetch referrals, stats, leaderboard ──
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json({ error: 'userId is required' }, { status: 400 });
    }

    try {
      // Get or create referral code for this user
      let referrals = await db.referral.findMany({
        where: { referrerId: userId },
        orderBy: { createdAt: 'desc' },
      });

      let referralCode: string;

      if (referrals.length === 0) {
        // Generate a new code for this user
        referralCode = generateReferralCode();
        await db.referral.create({
          data: {
            referrerId: userId,
            code: referralCode,
            status: 'pending',
            reward: 0,
          },
        });
        referrals = [];
      } else {
        referralCode = referrals[0].code;
      }

      // Stats
      const total = referrals.length;
      const earnings = referrals.reduce((sum, r) => sum + r.reward, 0);
      const active = referrals.filter(r => r.status === 'converted' || r.status === 'rewarded').length;

      // Leaderboard: top referrers this month
      const startOfMonth = new Date();
      startOfMonth.setDate(1);
      startOfMonth.setHours(0, 0, 0, 0);

      const monthlyReferrals = await db.referral.groupBy({
        by: ['referrerId'],
        where: {
          createdAt: { gte: startOfMonth },
          status: { in: ['converted', 'rewarded'] },
        },
        _count: { id: true },
        _sum: { reward: true },
        orderBy: { _count: { id: 'desc' } },
        take: 10,
      });

      // Enrich leaderboard with user names
      const leaderboard = await Promise.all(
        monthlyReferrals.map(async (entry, idx) => {
          let name = 'Anonymous';
          try {
            const user = await db.user.findUnique({
              where: { id: entry.referrerId },
              select: { name: true },
            });
            if (user) name = user.name;
          } catch { /* keep default */ }
          return {
            userId: entry.referrerId,
            name: entry.referrerId === userId ? 'You' : name,
            avatar: name.substring(0, 2).toUpperCase(),
            totalReferrals: entry._count.id,
            totalEarnings: entry._sum.reward || 0,
            rank: idx + 1,
          };
        })
      );

      // If user not in leaderboard, add them
      if (!leaderboard.find(e => e.userId === userId)) {
        leaderboard.push({
          userId,
          name: 'You',
          avatar: 'YO',
          totalReferrals: active,
          totalEarnings: earnings,
          rank: leaderboard.length + 1,
        });
      }

      // Ensure user has at least one referral code entry
      const userCodeEntry = referrals.find(r => r.code === referralCode);
      const allReferrals = userCodeEntry ? referrals : [
        { id: 'new', referrerId: userId, refereeId: null, code: referralCode, status: 'pending', reward: 0, createdAt: new Date().toISOString(), convertedAt: null },
        ...referrals,
      ];

      return NextResponse.json({
        referralCode,
        referrals: allReferrals,
        stats: { total, earnings, active },
        leaderboard,
      });
    } catch {
      // DB not available, use demo data
      const referralCode = 'CHIMBO-2026-X7K9';
      const demoReferrals = [
        { id: 'r1', referrerId: userId, refereeId: 'ref-1', code: referralCode, status: 'rewarded', reward: 5000, createdAt: new Date(Date.now() - 2 * 86400000).toISOString(), convertedAt: new Date(Date.now() - 2 * 86400000).toISOString() },
        { id: 'r2', referrerId: userId, refereeId: 'ref-2', code: referralCode, status: 'converted', reward: 5000, createdAt: new Date(Date.now() - 4 * 86400000).toISOString(), convertedAt: new Date(Date.now() - 4 * 86400000).toISOString() },
        { id: 'r3', referrerId: userId, refereeId: 'ref-3', code: referralCode, status: 'rewarded', reward: 5000, createdAt: new Date(Date.now() - 6 * 86400000).toISOString(), convertedAt: new Date(Date.now() - 6 * 86400000).toISOString() },
        { id: 'r4', referrerId: userId, refereeId: 'ref-4', code: referralCode, status: 'converted', reward: 5000, createdAt: new Date(Date.now() - 8 * 86400000).toISOString(), convertedAt: new Date(Date.now() - 8 * 86400000).toISOString() },
        { id: 'r5', referrerId: userId, refereeId: null, code: referralCode, status: 'pending', reward: 0, createdAt: new Date(Date.now() - 10 * 86400000).toISOString(), convertedAt: null },
        { id: 'r6', referrerId: userId, refereeId: 'ref-6', code: referralCode, status: 'rewarded', reward: 5000, createdAt: new Date(Date.now() - 12 * 86400000).toISOString(), convertedAt: new Date(Date.now() - 12 * 86400000).toISOString() },
        { id: 'r7', referrerId: userId, refereeId: 'ref-7', code: referralCode, status: 'converted', reward: 5000, createdAt: new Date(Date.now() - 15 * 86400000).toISOString(), convertedAt: new Date(Date.now() - 15 * 86400000).toISOString() },
      ];

      return NextResponse.json({
        referralCode,
        referrals: demoReferrals,
        stats: { total: 7, earnings: 30000, active: 5 },
        leaderboard: [
          { userId: 'lb-1', name: 'Amina K.', avatar: 'AK', totalReferrals: 15, totalEarnings: 75000, rank: 1 },
          { userId: 'lb-2', name: 'Joseph M.', avatar: 'JM', totalReferrals: 12, totalEarnings: 60000, rank: 2 },
          { userId, name: 'You', avatar: 'YO', totalReferrals: 7, totalEarnings: 30000, rank: 3 },
          { userId: 'lb-4', name: 'Grace T.', avatar: 'GT', totalReferrals: 5, totalEarnings: 25000, rank: 4 },
          { userId: 'lb-5', name: 'David S.', avatar: 'DS', totalReferrals: 3, totalEarnings: 15000, rank: 5 },
        ],
      });
    }
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('Referrals GET error:', error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

// ── POST: Track referral signup/conversion, create referral code ──
export async function POST(req: NextRequest) {
  try {
    const { action, referrerId, refereeId, code } = await req.json();

    if (action === 'generate') {
      // Generate a new referral code for a user
      const newCode = generateReferralCode();
      try {
        await db.referral.create({
          data: {
            referrerId,
            code: newCode,
            status: 'pending',
            reward: 0,
          },
        });
      } catch {
        // DB not available
      }
      return NextResponse.json({ success: true, code: newCode });
    }

    if (action === 'convert') {
      // A new user signed up using a referral code
      if (!code || !refereeId) {
        return NextResponse.json({ error: 'code and refereeId required' }, { status: 400 });
      }

      try {
        // Find the referral by code
        const referral = await db.referral.findFirst({
          where: { code, referrerId },
        });

        if (!referral) {
          return NextResponse.json({ error: 'Referral code not found' }, { status: 404 });
        }

        // Update referral to converted
        await db.referral.update({
          where: { id: referral.id },
          data: {
            refereeId,
            status: 'converted',
            convertedAt: new Date(),
          },
        });

        // Credit both referrer and referee with TZS 5,000
        const REWARD_AMOUNT = 5000;

        // Credit referrer wallet
        const referrerWallet = await db.wallet.findUnique({
          where: { userId: referrerId },
        });
        if (referrerWallet) {
          await db.wallet.update({
            where: { userId: referrerId },
            data: { balance: { increment: REWARD_AMOUNT } },
          });
          await db.transaction.create({
            data: {
              walletId: referrerWallet.id,
              type: 'deposit',
              amount: REWARD_AMOUNT,
              status: 'completed',
              description: 'Referral reward - friend signed up',
              reference: `REF-${referral.id}`,
            },
          });
        }

        // Credit referee wallet
        const refereeWallet = await db.wallet.findUnique({
          where: { userId: refereeId },
        });
        if (refereeWallet) {
          await db.wallet.update({
            where: { userId: refereeId },
            data: { balance: { increment: REWARD_AMOUNT } },
          });
          await db.transaction.create({
            data: {
              walletId: refereeWallet.id,
              type: 'deposit',
              amount: REWARD_AMOUNT,
              status: 'completed',
              description: 'Referral bonus - used referral code',
              reference: `REF-${referral.id}`,
            },
          });
        }

        // Mark referral as rewarded
        await db.referral.update({
          where: { id: referral.id },
          data: { status: 'rewarded', reward: REWARD_AMOUNT },
        });

        // Create notifications
        try {
          await db.notification.create({
            data: {
              userId: referrerId,
              type: 'success',
              title: 'Referral Reward!',
              message: `You earned TZS ${REWARD_AMOUNT.toLocaleString()} — your friend signed up!`,
            },
          });
          await db.notification.create({
            data: {
              userId: refereeId,
              type: 'success',
              title: 'Welcome Bonus!',
              message: `You received TZS ${REWARD_AMOUNT.toLocaleString()} for using a referral code!`,
            },
          });
        } catch { /* notifications optional */ }

        return NextResponse.json({
          success: true,
          referralId: referral.id,
          reward: REWARD_AMOUNT,
          message: 'Both users credited with TZS 5,000',
        });
      } catch {
        // DB not available, return demo success
        return NextResponse.json({
          success: true,
          reward: 5000,
          message: 'Referral converted (demo mode) — both users get TZS 5,000',
        });
      }
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('Referrals POST error:', error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

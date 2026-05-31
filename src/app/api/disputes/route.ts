import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

const VALID_CATEGORIES = ['service_quality', 'no_show', 'overcharging', 'safety_concern', 'other'];
const VALID_STATUSES = ['open', 'under_review', 'resolved'];
const VALID_RESOLUTIONS = ['refund', 'partial_refund', 'no_action'];

// ── GET: Fetch disputes for a user ──
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('userId');
    const status = searchParams.get('status');
    const category = searchParams.get('category');
    const sortBy = searchParams.get('sortBy') || 'createdAt';
    const sortOrder = searchParams.get('sortOrder') || 'desc';
    const role = searchParams.get('role') || 'seeker';

    try {
      const where: Record<string, unknown> = {};
      if (userId) {
        where[role === 'admin' ? 'OR' : 'filedBy'] = role === 'admin'
          ? undefined
          : userId;
        if (role !== 'admin' && userId) {
          where.filedBy = userId;
        }
      }
      if (status && status !== 'all') where.status = status;
      if (category && category !== 'all') where.category = category;

      const disputes = await db.dispute.findMany({
        where: role === 'admin' ? (status && status !== 'all' ? { status } : {}) : { filedBy: userId || '' },
        orderBy: { [sortBy]: sortOrder === 'desc' ? 'desc' : 'asc' },
        take: 50,
      });

      if (disputes.length > 0) {
        // Enrich with user and session data
        const enriched = await Promise.all(
          disputes.map(async (d) => {
            let filedByName = 'Unknown';
            let againstName = 'Unknown';
            let sessionAmount = 0;

            try {
              const filedByUser = await db.user.findUnique({ where: { id: d.filedBy }, select: { name: true } });
              if (filedByUser) filedByName = filedByUser.name;
            } catch { /* keep default */ }

            try {
              const againstUser = await db.user.findUnique({ where: { id: d.against }, select: { name: true } });
              if (againstUser) againstName = againstUser.name;
            } catch { /* keep default */ }

            try {
              const session = await db.session.findUnique({ where: { id: d.sessionId }, select: { amount: true } });
              if (session) sessionAmount = session.amount;
            } catch { /* keep default */ }

            return {
              ...d,
              evidence: JSON.parse(d.evidence || '[]'),
              filedByName,
              againstName,
              sessionAmount,
            };
          })
        );

        return NextResponse.json({ disputes: enriched });
      }
    } catch {
      // DB not available
    }

    // Demo data fallback
    const demoDisputes = [
      {
        id: 'disp1', sessionId: 'sess1', filedBy: userId || 'demo-seeker-1', against: 'demo-guide-1',
        category: 'no_show', description: 'Guide did not show up at the agreed time and location.',
        evidence: ['Photo of empty meeting point'], status: 'open', resolution: null, resolvedBy: null,
        createdAt: new Date(Date.now() - 2 * 3600000).toISOString(), resolvedAt: null,
        filedByName: 'Sarah Johnson', againstName: 'Hamisi Juma', sessionAmount: 25000,
      },
      {
        id: 'disp2', sessionId: 'sess2', filedBy: userId || 'demo-seeker-1', against: 'demo-guide-2',
        category: 'overcharging', description: 'Was charged more than quoted price.',
        evidence: ['Screenshot of original quote', 'M-Pesa receipt'], status: 'under_review', resolution: null, resolvedBy: null,
        createdAt: new Date(Date.now() - 86400000).toISOString(), resolvedAt: null,
        filedByName: 'Sarah Johnson', againstName: 'Fatma Hassan', sessionAmount: 35000,
      },
      {
        id: 'disp3', sessionId: 'sess3', filedBy: userId || 'demo-seeker-1', against: 'demo-guide-3',
        category: 'safety_concern', description: 'Guide took me to unsafe areas.',
        evidence: ['GPS route screenshot'], status: 'resolved', resolution: 'partial_refund', resolvedBy: 'admin',
        createdAt: new Date(Date.now() - 5 * 86400000).toISOString(), resolvedAt: new Date(Date.now() - 3 * 86400000).toISOString(),
        filedByName: 'Sarah Johnson', againstName: 'Mwanaildi Juma', sessionAmount: 30000,
      },
    ];

    return NextResponse.json({ disputes: demoDisputes });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

// ── POST: File or resolve a dispute ──
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { action } = body;

    if (action === 'file') {
      const { sessionId, filedBy, against, category, description, evidence } = body;

      if (!sessionId || !filedBy || !against) {
        return NextResponse.json({ error: 'sessionId, filedBy, and against are required' }, { status: 400 });
      }

      if (!VALID_CATEGORIES.includes(category)) {
        return NextResponse.json({ error: `Category must be one of: ${VALID_CATEGORIES.join(', ')}` }, { status: 400 });
      }

      try {
        // Check if session exists and is completed or has an active escrow
        const session = await db.session.findUnique({ where: { id: sessionId } });
        if (session) {
          // Mark session as disputed
          await db.session.update({
            where: { id: sessionId },
            data: { disputeFlag: true, disputeReason: description },
          });

          // Update escrow status if held
          if (session.escrowStatus === 'held') {
            await db.session.update({
              where: { id: sessionId },
              data: { escrowStatus: 'disputed' },
            });
          }
        }

        // Create the dispute record
        const dispute = await db.dispute.create({
          data: {
            sessionId,
            filedBy,
            against,
            category,
            description: description || '',
            evidence: JSON.stringify(evidence || []),
            status: 'open',
          },
        });

        // Create notifications for both parties
        try {
          await db.notification.create({
            data: {
              userId: filedBy,
              type: 'alert',
              title: 'Dispute Filed',
              message: `Your dispute about session #${sessionId.substring(0, 8)} has been filed. We will review it shortly.`,
            },
          });
          await db.notification.create({
            data: {
              userId: against,
              type: 'alert',
              title: 'Dispute Filed Against You',
              message: `A dispute has been filed regarding session #${sessionId.substring(0, 8)}. Please check your messages.`,
            },
          });
        } catch { /* notifications optional */ }

        // Create fraud alert for safety concerns
        if (category === 'safety_concern') {
          try {
            await db.fraudAlert.create({
              data: {
                entityType: 'guide',
                entityId: against,
                alertType: 'serial_disputer',
                confidence: 0.5,
                details: JSON.stringify({ disputeId: dispute.id, category, description }),
                status: 'pending',
              },
            });
          } catch { /* fraud alert optional */ }
        }

        return NextResponse.json({ success: true, dispute }, { status: 201 });
      } catch {
        // DB not available
        return NextResponse.json({
          success: true,
          dispute: {
            id: `disp-${Date.now()}`,
            sessionId, filedBy, against, category, description,
            evidence: evidence || [],
            status: 'open',
            createdAt: new Date().toISOString(),
          },
        });
      }
    }

    if (action === 'resolve') {
      const { disputeId, resolution, resolvedBy } = body;

      if (!disputeId || !resolution) {
        return NextResponse.json({ error: 'disputeId and resolution are required' }, { status: 400 });
      }

      if (!VALID_RESOLUTIONS.includes(resolution)) {
        return NextResponse.json({ error: `Resolution must be one of: ${VALID_RESOLUTIONS.join(', ')}` }, { status: 400 });
      }

      try {
        const dispute = await db.dispute.findUnique({ where: { id: disputeId } });
        if (!dispute) {
          return NextResponse.json({ error: 'Dispute not found' }, { status: 404 });
        }

        // Update dispute
        await db.dispute.update({
          where: { id: disputeId },
          data: {
            status: 'resolved',
            resolution,
            resolvedBy: resolvedBy || 'admin',
            resolvedAt: new Date(),
          },
        });

        // Handle escrow based on resolution
        const session = await db.session.findUnique({ where: { id: dispute.sessionId } });
        if (session) {
          if (resolution === 'refund') {
            // Full refund to seeker
            await db.session.update({
              where: { id: dispute.sessionId },
              data: { escrowStatus: 'refunded', disputeFlag: false },
            });
            const seekerWallet = await db.wallet.findUnique({ where: { userId: session.seekerId } });
            if (seekerWallet) {
              await db.wallet.update({
                where: { userId: session.seekerId },
                data: { balance: { increment: session.amount } },
              });
              await db.transaction.create({
                data: {
                  walletId: seekerWallet.id,
                  type: 'refund',
                  amount: session.amount,
                  status: 'completed',
                  description: 'Dispute resolved — full refund',
                  reference: `DISPUTE-${disputeId}`,
                },
              });
            }
          } else if (resolution === 'partial_refund') {
            // 50% refund, 50% to guide
            const refundAmount = Math.round(session.amount * 0.5);
            const guideAmount = Math.round(session.amount * 0.5 - session.platformFee);
            await db.session.update({
              where: { id: dispute.sessionId },
              data: { escrowStatus: 'refunded', disputeFlag: false },
            });
            const seekerWallet = await db.wallet.findUnique({ where: { userId: session.seekerId } });
            if (seekerWallet) {
              await db.wallet.update({
                where: { userId: session.seekerId },
                data: { balance: { increment: refundAmount } },
              });
              await db.transaction.create({
                data: {
                  walletId: seekerWallet.id,
                  type: 'refund',
                  amount: refundAmount,
                  status: 'completed',
                  description: 'Dispute resolved — partial refund (50%)',
                  reference: `DISPUTE-${disputeId}`,
                },
              });
            }
            if (guideAmount > 0) {
              await db.payout.create({
                data: { guideId: session.guideId, amount: guideAmount, status: 'pending', mobileMoneyNumber: '' },
              });
            }
          } else {
            // No action — release to guide
            await db.session.update({
              where: { id: dispute.sessionId },
              data: { escrowStatus: 'released', disputeFlag: false },
            });
            const guideAmount = session.amount - session.platformFee;
            if (guideAmount > 0) {
              await db.payout.create({
                data: { guideId: session.guideId, amount: guideAmount, status: 'pending', mobileMoneyNumber: '' },
              });
            }
          }

          // Notify both parties
          try {
            const resolutionText = resolution === 'refund' ? 'Full refund' : resolution === 'partial_refund' ? 'Partial refund (50%)' : 'Payment released to guide';
            await db.notification.create({
              data: {
                userId: dispute.filedBy,
                type: 'success',
                title: 'Dispute Resolved',
                message: `Your dispute has been resolved: ${resolutionText}`,
              },
            });
            await db.notification.create({
              data: {
                userId: dispute.against,
                type: 'info',
                title: 'Dispute Resolved',
                message: `The dispute against you has been resolved: ${resolutionText}`,
              },
            });
          } catch { /* notifications optional */ }
        }

        return NextResponse.json({ success: true, disputeId, resolution });
      } catch {
        return NextResponse.json({ success: true, disputeId, resolution, demo: true });
      }
    }

    if (action === 'message') {
      const { disputeId, message, senderId } = body;
      if (!disputeId || !message) {
        return NextResponse.json({ error: 'disputeId and message are required' }, { status: 400 });
      }

      // In a full implementation, we'd store dispute messages in a separate table
      // For now, store as part of the evidence array
      try {
        const dispute = await db.dispute.findUnique({ where: { id: disputeId } });
        if (dispute) {
          const evidence = JSON.parse(dispute.evidence || '[]');
          evidence.push({
            type: 'message',
            from: senderId || 'admin',
            text: message,
            timestamp: new Date().toISOString(),
          });
          await db.dispute.update({
            where: { id: disputeId },
            data: { evidence: JSON.stringify(evidence) },
          });
        }
      } catch { /* DB not available */ }

      return NextResponse.json({ success: true, message: 'Message sent' });
    }

    if (action === 'update_status') {
      const { disputeId, status } = body;
      if (!disputeId || !status) {
        return NextResponse.json({ error: 'disputeId and status are required' }, { status: 400 });
      }

      if (!VALID_STATUSES.includes(status)) {
        return NextResponse.json({ error: `Status must be one of: ${VALID_STATUSES.join(', ')}` }, { status: 400 });
      }

      try {
        await db.dispute.update({
          where: { id: disputeId },
          data: { status },
        });
      } catch { /* DB not available */ }

      return NextResponse.json({ success: true, disputeId, status });
    }

    return NextResponse.json({ error: 'Invalid action. Use: file, resolve, message, or update_status' }, { status: 400 });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('Disputes POST error:', error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

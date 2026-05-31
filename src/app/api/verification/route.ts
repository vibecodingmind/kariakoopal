import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { sendEmail } from '@/lib/email';
import { sanitizeString } from '@/lib/sanitize';

// ── Zone Knowledge Quiz Questions ──

export const QUIZ_QUESTIONS = [
  {
    id: 'q1',
    question: 'Where can you find the best selection of kanga fabrics in Kariakoo?',
    questionSw: 'Unaweza kupata uchaguzi bora wa kanga Kariakoo wapi?',
    options: ['Electronics Zone', 'Fabrics Zone', 'Spice Market', 'Food Court'],
    optionsSw: ['Eneo la Elektroniki', 'Eneo la Vitambaa', 'Soko la Viungo', 'Ukumbi wa Chakula'],
    correctIndex: 1,
  },
  {
    id: 'q2',
    question: 'What is the Swahili name for the central market area?',
    questionSw: 'Jina la Kiswahili la eneo kuu la soko ni nini?',
    options: ['Soko Kuu', 'Mnamboleo', 'Upeo Mashariki', 'Kariakoo Kusini'],
    optionsSw: ['Soko Kuu', 'Mnamboleo', 'Upeo Mashariki', 'Kariakoo Kusini'],
    correctIndex: 0,
  },
  {
    id: 'q3',
    question: 'Which zone is known for wholesale electronics and gadgets?',
    questionSw: 'Eneo lipi linajulikana kwa elektroniki na vifaa vya jumla?',
    options: ['Fabrics Zone', 'Spice Market', 'Electronics Zone', 'West Wing'],
    optionsSw: ['Eneo la Vitambaa', 'Soko la Viungo', 'Eneo la Elektroniki', 'Upeo Magharibi'],
    correctIndex: 2,
  },
  {
    id: 'q4',
    question: 'What is the typical market opening time for most vendors?',
    questionSw: 'Saa ya kawaida ya kufungua soko kwa wauzaji wengi ni ipi?',
    options: ['6:00 AM', '8:00 AM', '10:00 AM', '12:00 PM'],
    optionsSw: ['Saa 12 asubuhi', 'Saa 2 asubuhi', 'Saa 4 asubuhi', 'Saa 6 mchana'],
    correctIndex: 1,
  },
  {
    id: 'q5',
    question: 'What Swahili phrase should you use to ask for the wholesale price?',
    questionSw: 'Ni kauli gani ya Kiswahili unayotumia kuuliza bei ya jumla?',
    options: ['Bei gani?', 'Bei ya jumla?', 'Punguza bei', 'Nipe bei yako'],
    optionsSw: ['Bei gani?', 'Bei ya jumla?', 'Punguza bei', 'Nipe bei yako'],
    correctIndex: 1,
  },
];

// POST - Submit verification documents
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { guideId, personalInfo, quizAnswers, selfieData, documentFrontData, documentBackData, addressProofData } = body;

    if (!guideId) {
      return NextResponse.json({ error: 'Guide ID required' }, { status: 400 });
    }

    const safeId = sanitizeString(guideId);

    // Calculate quiz score
    let quizScore = 0;
    if (quizAnswers && Array.isArray(quizAnswers)) {
      quizAnswers.forEach((answer: number, index: number) => {
        if (QUIZ_QUESTIONS[index] && answer === QUIZ_QUESTIONS[index].correctIndex) {
          quizScore++;
        }
      });
    }

    if (quizScore < 3) {
      return NextResponse.json({
        error: 'Quiz score below minimum (3/5 required)',
        quizScore,
        quizTotal: QUIZ_QUESTIONS.length,
      }, { status: 400 });
    }

    // Try VLM verification on ID document
    let vlmResult: { verified: boolean; confidence: number; details: string } | null = null;
    if (documentFrontData) {
      try {
        const { default: sdk } = await import('z-ai-web-dev-sdk');
        const vlm = sdk.vlm;
        const vlmResponse = await vlm.chat({
          messages: [
            {
              role: 'user',
              content: [
                { type: 'text', text: 'Analyze this ID document image. Is this a valid government-issued identification document? Check for: 1) Official holograms or security features, 2) Clear photograph, 3) Visible text fields (name, ID number, date of birth), 4) No signs of tampering or forgery. Respond with: VALID or INVALID, followed by a confidence score (0-100) and brief explanation.' },
                { type: 'image_url', image_url: { url: documentFrontData } },
              ],
            },
          ],
          max_tokens: 200,
        });
        const vlmText = vlmResponse.choices?.[0]?.message?.content || '';
        const isVerified = vlmText.toUpperCase().includes('VALID') && !vlmText.toUpperCase().includes('INVALID');
        const confidenceMatch = vlmText.match(/(\d{1,3})/);
        vlmResult = {
          verified: isVerified,
          confidence: confidenceMatch ? parseInt(confidenceMatch[1]) : 50,
          details: vlmText.substring(0, 200),
        };
      } catch (vlmError) {
        console.log('VLM verification skipped (demo mode):', (vlmError as Error).message);
        vlmResult = { verified: true, confidence: 75, details: 'VLM unavailable - document accepted in demo mode' };
      }
    }

    // Create or update verification record in database
    const existing = await db.guideVerification.findUnique({ where: { guideId: safeId } });

    const verificationData = {
      guideId: safeId,
      status: 'pending' as const,
      fullName: sanitizeString(personalInfo?.fullName || '', 100),
      idNumber: sanitizeString(personalInfo?.idNumber || '', 50),
      address: sanitizeString(personalInfo?.address || '', 300),
      quizScore,
      quizTotal: QUIZ_QUESTIONS.length,
      selfieUrl: selfieData ? `selfie-${safeId}-${Date.now()}.jpg` : null,
      documentFrontUrl: documentFrontData ? `id-front-${safeId}-${Date.now()}.jpg` : null,
      documentBackUrl: documentBackData ? `id-back-${safeId}-${Date.now()}.jpg` : null,
      addressProofUrl: addressProofData ? `address-${safeId}-${Date.now()}.jpg` : null,
      backgroundCheckStatus: 'in_progress',
      submittedAt: new Date(),
      vlmResult: vlmResult ? JSON.stringify(vlmResult) : undefined,
    };

    let verification;
    if (existing) {
      verification = await db.guideVerification.update({
        where: { guideId: safeId },
        data: {
          ...verificationData,
          rejectionReason: null,
          reviewedBy: null,
          reviewedAt: null,
        },
      });
    } else {
      verification = await db.guideVerification.create({
        data: verificationData,
      });
    }

    // Send notification email to guide
    try {
      const guideUser = await db.user.findUnique({ where: { id: safeId } });
      if (guideUser?.email) {
        await sendEmail('guide_verification', guideUser.email, {
          name: guideUser.name,
          status: 'pending',
          reason: '',
        });
      }
    } catch (emailErr) {
      console.log('Verification email send failed:', emailErr);
    }

    // Create notification in database
    try {
      await db.notification.create({
        data: {
          userId: safeId,
          type: 'system',
          title: 'Verification Submitted',
          titleSw: 'Uthibitisho Umewasilishwa',
          message: 'Your verification documents have been submitted and are pending review.',
          bodySw: 'Nyaraka zako za uthibitisho zimewasilishwa na zinakaguliwa.',
          actionUrl: '/guide/verification',
        },
      });
    } catch (notifErr) {
      console.log('Notification create failed:', notifErr);
    }

    // In demo mode, auto-transition to under_review after a short delay
    setTimeout(async () => {
      try {
        const current = await db.guideVerification.findUnique({ where: { guideId: safeId } });
        if (current && current.status === 'pending') {
          await db.guideVerification.update({
            where: { guideId: safeId },
            data: { status: 'under_review' },
          });
        }
      } catch { /* ignore */ }
    }, 5000);

    return NextResponse.json({
      success: true,
      verification: {
        id: verification.id,
        guideId: verification.guideId,
        status: verification.status,
        personalInfo: {
          fullName: verification.fullName,
          idNumber: verification.idNumber,
          address: verification.address,
        },
        quizScore: verification.quizScore,
        quizTotal: verification.quizTotal,
        selfieUrl: verification.selfieUrl,
        documentFrontUrl: verification.documentFrontUrl,
        documentBackUrl: verification.documentBackUrl,
        addressProofUrl: verification.addressProofUrl,
        backgroundCheckStatus: verification.backgroundCheckStatus,
        rejectionReason: verification.rejectionReason,
        submittedAt: verification.submittedAt?.toISOString() || null,
        reviewedAt: verification.reviewedAt?.toISOString() || null,
        vlmResult,
      },
      quizQuestions: QUIZ_QUESTIONS,
      message: 'Verification submitted successfully. Review usually takes 24-48 hours.',
    });
  } catch (error: any) {
    console.error('Verification API error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// GET - Check verification status
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const guideId = searchParams.get('guideId');

    if (!guideId) {
      return NextResponse.json({ error: 'Guide ID required' }, { status: 400 });
    }

    const safeId = sanitizeString(guideId);
    const verification = await db.guideVerification.findUnique({ where: { guideId: safeId } });

    if (!verification) {
      return NextResponse.json({
        success: true,
        verification: {
          id: null,
          guideId: safeId,
          status: 'not_submitted',
          personalInfo: null,
          quizScore: null,
          quizTotal: QUIZ_QUESTIONS.length,
          submittedAt: null,
          reviewedAt: null,
          rejectionReason: null,
          backgroundCheckStatus: 'not_started',
        },
        quizQuestions: QUIZ_QUESTIONS,
      });
    }

    return NextResponse.json({
      success: true,
      verification: {
        id: verification.id,
        guideId: verification.guideId,
        status: verification.status,
        personalInfo: {
          fullName: verification.fullName,
          idNumber: verification.idNumber,
          address: verification.address,
        },
        quizScore: verification.quizScore,
        quizTotal: verification.quizTotal,
        selfieUrl: verification.selfieUrl,
        documentFrontUrl: verification.documentFrontUrl,
        documentBackUrl: verification.documentBackUrl,
        addressProofUrl: verification.addressProofUrl,
        backgroundCheckStatus: verification.backgroundCheckStatus,
        rejectionReason: verification.rejectionReason,
        submittedAt: verification.submittedAt?.toISOString() || null,
        reviewedAt: verification.reviewedAt?.toISOString() || null,
      },
      quizQuestions: QUIZ_QUESTIONS,
    });
  } catch (error: any) {
    console.error('Verification API error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// PATCH - Admin approve/reject
export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();
    const { guideId, action, reason, reviewedBy } = body;

    if (!guideId || !action) {
      return NextResponse.json({ error: 'Guide ID and action required' }, { status: 400 });
    }

    const safeId = sanitizeString(guideId);
    const verification = await db.guideVerification.findUnique({ where: { guideId: safeId } });

    if (!verification) {
      return NextResponse.json({ error: 'Verification not found' }, { status: 404 });
    }

    if (action === 'approve') {
      await db.guideVerification.update({
        where: { guideId: safeId },
        data: {
          status: 'approved',
          backgroundCheckStatus: 'passed',
          reviewedBy: sanitizeString(reviewedBy || 'admin', 50),
          reviewedAt: new Date(),
          rejectionReason: null,
        },
      });

      // Update guide profile status to active
      try {
        await db.guideProfile.update({
          where: { userId: safeId },
          data: { status: 'active' },
        });
      } catch { /* profile might not exist */ }

      // Award verified badge
      try {
        const existingBadge = await db.badge.findFirst({
          where: { guideId: safeId, badgeType: 'verified_elite' },
        });
        if (!existingBadge) {
          await db.badge.create({
            data: { guideId: safeId, badgeType: 'verified_elite' },
          });
        }
      } catch { /* badge might exist */ }

      // Send approval email
      try {
        const guideUser = await db.user.findUnique({ where: { id: safeId } });
        if (guideUser?.email) {
          await sendEmail('guide_verification', guideUser.email, {
            name: guideUser.name,
            status: 'approved',
            reason: '',
          });
        }
      } catch (emailErr) {
        console.log('Approval email failed:', emailErr);
      }

      // Create notification
      try {
        await db.notification.create({
          data: {
            userId: safeId,
            type: 'success',
            title: 'Verification Approved!',
            titleSw: 'Uthibitisho Umekubaliwa!',
            message: 'Congratulations! Your guide verification has been approved. You can now accept bookings.',
            bodySw: 'Hongera! Uthibitisho wako umekubaliwa. Sasa unaweza kupokea maombi.',
            actionUrl: '/guide/verification',
          },
        });
      } catch { /* ignore */ }

    } else if (action === 'reject') {
      const rejectionReason = sanitizeString(reason || 'Did not meet verification requirements', 500);

      await db.guideVerification.update({
        where: { guideId: safeId },
        data: {
          status: 'rejected',
          backgroundCheckStatus: 'failed',
          reviewedBy: sanitizeString(reviewedBy || 'admin', 50),
          reviewedAt: new Date(),
          rejectionReason,
        },
      });

      // Send rejection email
      try {
        const guideUser = await db.user.findUnique({ where: { id: safeId } });
        if (guideUser?.email) {
          await sendEmail('guide_verification', guideUser.email, {
            name: guideUser.name,
            status: 'rejected',
            reason: rejectionReason,
          });
        }
      } catch (emailErr) {
        console.log('Rejection email failed:', emailErr);
      }

      // Create notification
      try {
        await db.notification.create({
          data: {
            userId: safeId,
            type: 'warning',
            title: 'Verification Not Approved',
            titleSw: 'Uthibitisho Hakukubaliwa',
            message: `Your verification was not approved. Reason: ${rejectionReason}`,
            bodySw: `Uthibitisho wako haukukubaliwa. Sababu: ${rejectionReason}`,
            actionUrl: '/guide/verification',
          },
        });
      } catch { /* ignore */ }
    }

    const updated = await db.guideVerification.findUnique({ where: { guideId: safeId } });

    return NextResponse.json({
      success: true,
      verification: updated,
    });
  } catch (error: any) {
    console.error('Verification API error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

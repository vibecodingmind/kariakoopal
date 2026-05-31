import { NextRequest, NextResponse } from 'next/server';

// ── Demo verification data ──

interface VerificationSubmission {
  id: string;
  guideId: string;
  status: 'pending' | 'approved' | 'rejected';
  personalInfo: {
    fullName: string;
    idNumber: string;
    address: string;
  };
  quizScore: number;
  quizTotal: number;
  selfieUrl: string | null;
  documentFrontUrl: string | null;
  documentBackUrl: string | null;
  submittedAt: string;
  reviewedAt: string | null;
  rejectionReason: string | null;
}

// In-memory store for demo
const verificationStore: Map<string, VerificationSubmission> = new Map();

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
    const { guideId, personalInfo, quizAnswers, selfieData, documentFrontData, documentBackData } = body;

    if (!guideId) {
      return NextResponse.json({ error: 'Guide ID required' }, { status: 400 });
    }

    // Calculate quiz score
    let quizScore = 0;
    if (quizAnswers && Array.isArray(quizAnswers)) {
      quizAnswers.forEach((answer: number, index: number) => {
        if (QUIZ_QUESTIONS[index] && answer === QUIZ_QUESTIONS[index].correctIndex) {
          quizScore++;
        }
      });
    }

    // Create verification submission
    const submission: VerificationSubmission = {
      id: `ver-${Date.now()}`,
      guideId,
      status: 'pending',
      personalInfo: personalInfo || { fullName: '', idNumber: '', address: '' },
      quizScore,
      quizTotal: QUIZ_QUESTIONS.length,
      selfieUrl: selfieData ? `demo-selfie-${Date.now()}.jpg` : null,
      documentFrontUrl: documentFrontData ? `demo-id-front-${Date.now()}.jpg` : null,
      documentBackUrl: documentBackData ? `demo-id-back-${Date.now()}.jpg` : null,
      submittedAt: new Date().toISOString(),
      reviewedAt: null,
      rejectionReason: null,
    };

    // In demo mode, auto-approve after 3 seconds
    verificationStore.set(guideId, submission);

    // Simulate admin review (in production this would be manual)
    setTimeout(() => {
      const existing = verificationStore.get(guideId);
      if (existing && existing.status === 'pending') {
        // Auto-approve if quiz score >= 3/5
        existing.status = quizScore >= 3 ? 'approved' : 'rejected';
        existing.reviewedAt = new Date().toISOString();
        existing.rejectionReason = quizScore < 3 ? 'Quiz score below minimum (3/5 required)' : null;
        verificationStore.set(guideId, existing);
      }
    }, 3000);

    return NextResponse.json({
      success: true,
      verification: submission,
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

    const verification = verificationStore.get(guideId);

    // Demo: return a default pending status if no submission yet
    if (!verification) {
      return NextResponse.json({
        success: true,
        verification: {
          id: null,
          guideId,
          status: 'not_submitted',
          personalInfo: null,
          quizScore: null,
          quizTotal: QUIZ_QUESTIONS.length,
          submittedAt: null,
          reviewedAt: null,
          rejectionReason: null,
        },
        quizQuestions: QUIZ_QUESTIONS,
      });
    }

    return NextResponse.json({
      success: true,
      verification,
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
    const { guideId, action, reason } = body;

    if (!guideId || !action) {
      return NextResponse.json({ error: 'Guide ID and action required' }, { status: 400 });
    }

    const verification = verificationStore.get(guideId);
    if (!verification) {
      return NextResponse.json({ error: 'Verification not found' }, { status: 404 });
    }

    if (action === 'approve') {
      verification.status = 'approved';
      verification.reviewedAt = new Date().toISOString();
      verification.rejectionReason = null;
    } else if (action === 'reject') {
      verification.status = 'rejected';
      verification.reviewedAt = new Date().toISOString();
      verification.rejectionReason = reason || 'Did not meet verification requirements';
    }

    verificationStore.set(guideId, verification);

    return NextResponse.json({
      success: true,
      verification,
    });
  } catch (error: any) {
    console.error('Verification API error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// POST - Submit KYC documents
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      userId, documentType, documentNumber, documentFrontUrl, documentBackUrl,
      selfieUrl, selfieWithDocUrl, addressProofUrl, address, dateOfBirth, nationality,
    } = body;

    if (!userId || !documentType || !documentNumber) {
      return NextResponse.json({ error: 'User ID, document type, and document number are required' }, { status: 400 });
    }

    const validDocTypes = ['national_id', 'passport', 'drivers_license'];
    if (!validDocTypes.includes(documentType)) {
      return NextResponse.json({ error: 'Invalid document type' }, { status: 400 });
    }

    // Check if user already has a KYC verification
    const existing = await db.kYCVerification.findUnique({
      where: { userId },
    });

    if (existing && (existing.status === 'approved' || existing.status === 'pending')) {
      return NextResponse.json({ error: 'KYC already submitted or approved' }, { status: 400 });
    }

    // AI confidence scores (simulated - in production would use VLM)
    const aiFaceMatchScore = selfieUrl && documentFrontUrl ? 0.85 : 0;
    const aiDocAuthScore = documentFrontUrl ? 0.9 : 0;

    const kyc = await db.kYCVerification.upsert({
      where: { userId },
      create: {
        userId,
        status: 'pending',
        documentType,
        documentNumber,
        documentFrontUrl: documentFrontUrl || null,
        documentBackUrl: documentBackUrl || null,
        selfieUrl: selfieUrl || null,
        selfieWithDocUrl: selfieWithDocUrl || null,
        addressProofUrl: addressProofUrl || null,
        address: address || '',
        dateOfBirth: dateOfBirth || '',
        nationality: nationality || '',
        verificationProvider: 'manual',
        aiFaceMatchScore,
        aiDocAuthScore,
        submittedAt: new Date(),
        expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year
      },
      update: {
        status: 'pending',
        documentType,
        documentNumber,
        documentFrontUrl: documentFrontUrl || null,
        documentBackUrl: documentBackUrl || null,
        selfieUrl: selfieUrl || null,
        selfieWithDocUrl: selfieWithDocUrl || null,
        addressProofUrl: addressProofUrl || null,
        address: address || '',
        dateOfBirth: dateOfBirth || '',
        nationality: nationality || '',
        aiFaceMatchScore,
        aiDocAuthScore,
        submittedAt: new Date(),
        rejectionReason: null,
        reviewedBy: null,
        reviewedAt: null,
      },
    });

    // Create notification
    await db.notification.create({
      data: {
        userId,
        type: 'info',
        title: 'KYC Submitted',
        titleSw: 'KYC Imewasilishwa',
        message: 'Your identity verification documents have been submitted for review.',
        actionUrl: '/guide/kyc',
      },
    });

    return NextResponse.json(kyc, { status: 201 });
  } catch (error) {
    console.error('KYC POST error:', error);
    return NextResponse.json({ error: 'Failed to submit KYC documents' }, { status: 500 });
  }
}

// GET - Get current KYC status for a user
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    const kyc = await db.kYCVerification.findUnique({
      where: { userId },
    });

    if (!kyc) {
      return NextResponse.json({ status: 'not_started' });
    }

    return NextResponse.json(kyc);
  } catch (error) {
    console.error('KYC GET error:', error);
    return NextResponse.json({ error: 'Failed to fetch KYC status' }, { status: 500 });
  }
}

// PATCH - Update KYC (for resubmission)
export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();
    const { userId, ...updateFields } = body;

    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    const existing = await db.kYCVerification.findUnique({
      where: { userId },
    });

    if (!existing) {
      return NextResponse.json({ error: 'KYC record not found' }, { status: 404 });
    }

    const allowedFields = [
      'documentType', 'documentNumber', 'documentFrontUrl', 'documentBackUrl',
      'selfieUrl', 'selfieWithDocUrl', 'addressProofUrl', 'address', 'dateOfBirth', 'nationality',
    ];

    const updateData: Record<string, unknown> = {};
    for (const field of allowedFields) {
      if (updateFields[field] !== undefined) {
        updateData[field] = updateFields[field];
      }
    }

    // If resubmitting after rejection, reset status
    if (existing.status === 'rejected' && Object.keys(updateData).length > 0) {
      updateData.status = 'pending';
      updateData.rejectionReason = null;
      updateData.submittedAt = new Date();
    }

    const updated = await db.kYCVerification.update({
      where: { userId },
      data: updateData,
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error('KYC PATCH error:', error);
    return NextResponse.json({ error: 'Failed to update KYC' }, { status: 500 });
  }
}

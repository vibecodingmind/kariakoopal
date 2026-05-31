import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// GET /api/corporate — get corporate account details
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const adminUserId = searchParams.get('adminUserId');
    const status = searchParams.get('status');

    const where: any = {};
    if (adminUserId) where.adminUserId = adminUserId;
    if (status) where.status = status;

    const accounts = await db.corporateAccount.findMany({
      where,
      include: {
        members: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ accounts });
  } catch (error) {
    console.error('Corporate GET error:', error);
    return NextResponse.json({ error: 'Failed to fetch corporate accounts' }, { status: 500 });
  }
}

// POST /api/corporate — create corporate account
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { companyName, companyEmail, companyPhone, adminUserId, tier, monthlyBudget, invoiceEmail, taxId } = body;

    if (!companyName || !companyEmail || !adminUserId) {
      return NextResponse.json(
        { error: 'companyName, companyEmail, and adminUserId are required' },
        { status: 400 }
      );
    }

    const account = await db.corporateAccount.create({
      data: {
        companyName,
        companyEmail,
        companyPhone: companyPhone || '',
        adminUserId,
        tier: tier || 'business',
        teamSize: 1,
        monthlyBudget: monthlyBudget ? parseFloat(monthlyBudget) : 0,
        invoiceEmail: invoiceEmail || companyEmail,
        taxId: taxId || '',
      },
    });

    // Auto-add admin as a member
    await db.corporateMember.create({
      data: {
        corporateId: account.id,
        userId: adminUserId,
        role: 'admin',
        spendLimit: 0,
        canBook: true,
        canApprove: true,
      },
    });

    return NextResponse.json({ account }, { status: 201 });
  } catch (error: any) {
    if (error.code === 'P2002') {
      return NextResponse.json({ error: 'Corporate account with this email already exists' }, { status: 409 });
    }
    console.error('Corporate POST error:', error);
    return NextResponse.json({ error: 'Failed to create corporate account' }, { status: 500 });
  }
}

// PATCH /api/corporate — update corporate account
export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();
    const { id, companyName, companyPhone, tier, monthlyBudget, invoiceEmail, taxId, status } = body;

    if (!id) {
      return NextResponse.json({ error: 'id is required' }, { status: 400 });
    }

    const data: any = {};
    if (companyName !== undefined) data.companyName = companyName;
    if (companyPhone !== undefined) data.companyPhone = companyPhone;
    if (tier !== undefined) data.tier = tier;
    if (monthlyBudget !== undefined) data.monthlyBudget = parseFloat(monthlyBudget);
    if (invoiceEmail !== undefined) data.invoiceEmail = invoiceEmail;
    if (taxId !== undefined) data.taxId = taxId;
    if (status !== undefined) data.status = status;

    const account = await db.corporateAccount.update({
      where: { id },
      data,
    });

    return NextResponse.json({ account });
  } catch (error) {
    console.error('Corporate PATCH error:', error);
    return NextResponse.json({ error: 'Failed to update corporate account' }, { status: 500 });
  }
}

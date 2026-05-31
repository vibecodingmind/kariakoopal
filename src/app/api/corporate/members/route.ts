import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// GET /api/corporate/members — list corporate members
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const corporateId = searchParams.get('corporateId');

    if (!corporateId) {
      return NextResponse.json({ error: 'corporateId is required' }, { status: 400 });
    }

    const members = await db.corporateMember.findMany({
      where: { corporateId },
      orderBy: { createdAt: 'asc' },
    });

    return NextResponse.json({ members });
  } catch (error) {
    console.error('Corporate members GET error:', error);
    return NextResponse.json({ error: 'Failed to fetch members' }, { status: 500 });
  }
}

// POST /api/corporate/members — add a member
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { corporateId, userId, role, spendLimit, canBook, canApprove } = body;

    if (!corporateId || !userId) {
      return NextResponse.json({ error: 'corporateId and userId are required' }, { status: 400 });
    }

    const member = await db.corporateMember.create({
      data: {
        corporateId,
        userId,
        role: role || 'member',
        spendLimit: spendLimit ? parseFloat(spendLimit) : 0,
        canBook: canBook !== undefined ? canBook : true,
        canApprove: canApprove !== undefined ? canApprove : false,
      },
    });

    // Update team size
    const count = await db.corporateMember.count({ where: { corporateId } });
    await db.corporateAccount.update({
      where: { id: corporateId },
      data: { teamSize: count },
    });

    return NextResponse.json({ member }, { status: 201 });
  } catch (error: any) {
    if (error.code === 'P2002') {
      return NextResponse.json({ error: 'Member already exists in this corporate account' }, { status: 409 });
    }
    console.error('Corporate members POST error:', error);
    return NextResponse.json({ error: 'Failed to add member' }, { status: 500 });
  }
}

// PATCH /api/corporate/members — update member role/limits
export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();
    const { id, role, spendLimit, canBook, canApprove } = body;

    if (!id) {
      return NextResponse.json({ error: 'id is required' }, { status: 400 });
    }

    const data: any = {};
    if (role !== undefined) data.role = role;
    if (spendLimit !== undefined) data.spendLimit = parseFloat(spendLimit);
    if (canBook !== undefined) data.canBook = canBook;
    if (canApprove !== undefined) data.canApprove = canApprove;

    const member = await db.corporateMember.update({
      where: { id },
      data,
    });

    return NextResponse.json({ member });
  } catch (error) {
    console.error('Corporate members PATCH error:', error);
    return NextResponse.json({ error: 'Failed to update member' }, { status: 500 });
  }
}

// DELETE /api/corporate/members — remove a member
export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'id is required' }, { status: 400 });
    }

    const member = await db.corporateMember.delete({ where: { id } });

    // Update team size
    const count = await db.corporateMember.count({ where: { corporateId: member.corporateId } });
    await db.corporateAccount.update({
      where: { id: member.corporateId },
      data: { teamSize: count },
    });

    return NextResponse.json({ member });
  } catch (error) {
    console.error('Corporate members DELETE error:', error);
    return NextResponse.json({ error: 'Failed to remove member' }, { status: 500 });
  }
}

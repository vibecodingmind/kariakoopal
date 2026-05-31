import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// GET /api/premium-content/[id] — get single content (full if purchased, preview if not)
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('userId');

    const content = await db.premiumContent.findUnique({ where: { id } });

    if (!content) {
      return NextResponse.json({ error: 'Content not found' }, { status: 404 });
    }

    // Check if user has purchased
    let hasPurchased = false;
    if (userId) {
      const purchase = await db.contentPurchase.findUnique({
        where: { userId_contentId: { userId, contentId: id } },
      });
      hasPurchased = !!purchase;
    }

    // If purchased or free, return full content
    if (hasPurchased || content.price === 0) {
      return NextResponse.json({ content, hasPurchased: true, accessLevel: 'full' });
    }

    // Otherwise return preview (description only, no contentUrl)
    return NextResponse.json({
      content: {
        ...content,
        contentUrl: '',
        description: content.description.slice(0, 150) + (content.description.length > 150 ? '...' : ''),
      },
      hasPurchased: false,
      accessLevel: 'preview',
    });
  } catch (error) {
    console.error('Premium content [id] GET error:', error);
    return NextResponse.json({ error: 'Failed to fetch content' }, { status: 500 });
  }
}

// PATCH /api/premium-content/[id] — update content
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json();
    const { title, description, contentUrl, coverUrl, category, accessType, price, isActive } = body;

    const data: any = {};
    if (title !== undefined) data.title = title;
    if (description !== undefined) data.description = description;
    if (contentUrl !== undefined) data.contentUrl = contentUrl;
    if (coverUrl !== undefined) data.coverUrl = coverUrl;
    if (category !== undefined) data.category = category;
    if (accessType !== undefined) data.accessType = accessType;
    if (price !== undefined) data.price = parseFloat(price);
    if (isActive !== undefined) data.isActive = isActive;

    const content = await db.premiumContent.update({
      where: { id },
      data,
    });

    return NextResponse.json({ content });
  } catch (error) {
    console.error('Premium content [id] PATCH error:', error);
    return NextResponse.json({ error: 'Failed to update content' }, { status: 500 });
  }
}

// DELETE /api/premium-content/[id] — soft delete (deactivate)
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const content = await db.premiumContent.update({
      where: { id },
      data: { isActive: false },
    });

    return NextResponse.json({ content });
  } catch (error) {
    console.error('Premium content [id] DELETE error:', error);
    return NextResponse.json({ error: 'Failed to delete content' }, { status: 500 });
  }
}

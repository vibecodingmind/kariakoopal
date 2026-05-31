import { NextRequest, NextResponse } from 'next/server';

// GET /api/email/track - Track email open/click events
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    const event = searchParams.get('event');
    const redirect = searchParams.get('redirect');

    if (!id || !event) {
      // Return a 1x1 transparent pixel for missing params
      return new Response(
        Buffer.from('R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7', 'base64'),
        {
          status: 200,
          headers: {
            'Content-Type': 'image/gif',
            'Cache-Control': 'no-store, no-cache, must-revalidate',
          },
        }
      );
    }

    // Log the tracking event
    console.log(`📊 [Email Tracking] ID: ${id}, Event: ${event}, Timestamp: ${Date.now()}`);

    if (event === 'click' && redirect) {
      // Redirect to the actual URL
      return NextResponse.redirect(redirect);
    }

    if (event === 'open') {
      // Return a 1x1 transparent GIF pixel
      return new Response(
        Buffer.from('R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7', 'base64'),
        {
          status: 200,
          headers: {
            'Content-Type': 'image/gif',
            'Cache-Control': 'no-store, no-cache, must-revalidate',
          },
        }
      );
    }

    return new Response('OK', { status: 200 });
  } catch (error) {
    console.error('Email tracking error:', error);
    return new Response('OK', { status: 200 });
  }
}

// POST /api/email/track - Track email events via POST
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, event, timestamp } = body;

    console.log(`📊 [Email Tracking] ID: ${id}, Event: ${event}, Timestamp: ${timestamp || Date.now()}`);

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ success: true });
  }
}

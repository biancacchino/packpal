import { NextResponse } from 'next/server';
import { addShare, listShares, type AccessLevel } from 'app/sharesStore';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const friendId = searchParams.get('friendId') || undefined;
  const tripId = searchParams.get('tripId') || undefined;
  const items = listShares({ friendId, tripId });
  return NextResponse.json({ shares: items });
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { friendId, tripId, access } = body as {
      friendId?: string;
      tripId?: string;
      access?: AccessLevel;
    };

    if (!friendId || !tripId || !access) {
      return NextResponse.json(
        { error: 'Missing required fields: friendId, tripId, access' },
        { status: 400 }
      );
    }

    if (!['view', 'suggest', 'edit'].includes(access)) {
      return NextResponse.json({ error: 'Invalid access level' }, { status: 400 });
    }

    const share = addShare({ friendId, tripId, access });
    return NextResponse.json({ share }, { status: 201 });
  } catch (e) {
    console.error('Failed to create share', e);
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }
}

import { NextResponse } from 'next/server';
import { addFriend, listFriends } from '@/app/friendsStore';

export async function GET() {
  const friends = listFriends();
  return NextResponse.json({ friends });
}

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const name = (body.name as string)?.trim();
    if (!name) return NextResponse.json({ error: 'name required' }, { status: 400 });
    const friend = addFriend(name);
    return NextResponse.json({ friend }, { status: 201 });
  } catch (e) {
    return NextResponse.json({ error: 'invalid body' }, { status: 400 });
  }
}

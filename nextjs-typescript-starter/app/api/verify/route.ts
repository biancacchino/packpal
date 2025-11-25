import { NextResponse } from 'next/server';
import { verifyUser } from 'app/db';

export async function POST(req: Request) {
  try {
    const { token } = await req.json();
    if (!token) return NextResponse.json({ error: 'Token required' }, { status: 400 });

    const success = await verifyUser(token);
    if (!success) {
      return NextResponse.json({ error: 'Invalid or expired token' }, { status: 400 });
    }

    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

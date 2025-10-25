import { NextResponse } from 'next/server';
import { getUser, createUser } from '../../../db';

export async function GET() {
  // Development-only endpoint to ensure a test user exists for quick sign-in
  try {
    const email = 'devtest@example.com';
    const password = 'password123';

    const existing = await getUser(email);
    // getUser may return an array (drizzle) or single object (prisma)
    const user = Array.isArray(existing) ? existing[0] : existing;

    if (!user) {
      await createUser(email, password);
      return NextResponse.json({ ok: true, created: true });
    }

    return NextResponse.json({ ok: true, created: false });
  } catch (err) {
    console.error('ensure-test-user failed', err);
    return NextResponse.json({ ok: false, error: String(err) }, { status: 500 });
  }
}

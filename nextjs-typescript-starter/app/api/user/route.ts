import { NextResponse } from 'next/server';
import { getUser, updateUser } from '@/app/userStore';

export async function GET() {
  const user = getUser();
  return NextResponse.json({ user });
}

export async function PATCH(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const allowed = ['username','email','bio','avatarUrl','isPublic','emailNotifications','theme'] as const;
    const patch: any = {};
    for (const k of allowed) if (k in body) patch[k] = (body as any)[k];
    // If username is provided but email is not, set a default email based on the username
    if (typeof patch.username === 'string' && !('email' in body)) {
      const local = patch.username.trim().toLowerCase().replace(/[^a-z0-9]+/g, '') || 'user';
      patch.email = `${local}@gmail.com`;
    }
    const user = updateUser(patch);
    return NextResponse.json({ user });
  } catch (e) {
    return NextResponse.json({ error: 'invalid body' }, { status: 400 });
  }
}

export async function POST(req: Request) {
  // alias PATCH for simplicity
  return PATCH(req);
}

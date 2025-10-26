import { NextResponse } from 'next/server';
import { createUser, getUser } from 'app/db';

function parseEmail(v: unknown): string | null {
  if (typeof v !== 'string') return null;
  const s = v.trim();
  if (!s) return null;
  return s;
}

export async function POST(req: Request) {
  try {
    let email: string | null = null;
    let password: string | null = null;

    // Try JSON
    try {
      const body = await req.json();
      email = parseEmail((body as any)?.email);
      password = typeof (body as any)?.password === 'string' ? (body as any).password : null;
    } catch {}

    // Try formData
    if (!email || !password) {
      try {
        const form = await req.formData();
        email = email ?? parseEmail(form.get('email'));
        const p = form.get('password');
        password = password ?? (typeof p === 'string' ? p : null);
      } catch {}
    }

    // Try urlencoded
    if (!email || !password) {
      try {
        const text = await req.text();
        const params = new URLSearchParams(text);
        email = email ?? parseEmail(params.get('email'));
        password = password ?? params.get('password');
      } catch {}
    }

    if (!email || !password) {
      return NextResponse.json({ error: 'Email and password are required' }, { status: 400 });
    }

    const existing = await getUser(email);
    if (Array.isArray(existing) && existing.length > 0) {
      return NextResponse.json({ error: 'User already exists' }, { status: 409 });
    }

    await createUser(email, password);
    return NextResponse.json({ ok: true }, { status: 201 });
  } catch (err) {
    console.error('/api/register error', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

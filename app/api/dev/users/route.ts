import { NextResponse } from 'next/server';
import { prisma } from '../../../db';

// Dev-only endpoint: list users (non-sensitive fields) to help debug schema issues.
export async function GET() {
  try {
    const users = await prisma.user.findMany({
      select: { id: true, email: true, createdAt: true },
      take: 10,
    });
    return NextResponse.json({ users });
  } catch (err) {
    console.error('/api/dev/users error', err);
    return NextResponse.json({ error: 'DB error', details: String(err) }, { status: 500 });
  }
}

import { NextResponse } from 'next/server';
import { addItems, resolveToken } from '@/app/trips/store';

export async function GET(_: Request, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const trip = resolveToken(token);
  if (!trip) return NextResponse.json({ error: 'not found' }, { status: 404 });
  return NextResponse.json({ trip });
}

export async function POST(req: Request, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const body = await req.json().catch(() => ({}));
  const items: string[] | undefined = Array.isArray(body.items)
    ? body.items.map((s: any) => String(s))
    : body.text
    ? [String(body.text)]
    : undefined;
  if (!items || items.length === 0) {
    return NextResponse.json({ error: 'items or text required' }, { status: 400 });
  }
  const trip = resolveToken(token);
  if (!trip) return NextResponse.json({ error: 'not found' }, { status: 404 });
  const requested = items.length;
  const created = addItems(trip.id, items, 'shared-link');
  const added = created.length;
  const skipped = Math.max(requested - added, 0);
  return NextResponse.json({ created, added, skipped }, { status: 201 });
}

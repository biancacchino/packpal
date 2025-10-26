import { NextResponse } from 'next/server';
import { addItems, getTrip } from '@/app/trips/store';

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const trip = getTrip(id);
  if (!trip) return NextResponse.json({ error: 'not found' }, { status: 404 });
  return NextResponse.json({ items: trip.items });
}

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await req.json().catch(() => ({}));
    const addedBy = typeof body.addedBy === 'string' ? body.addedBy : undefined;
    const items: string[] | undefined = Array.isArray(body.items)
      ? body.items.map((s: any) => String(s))
      : body.text
      ? [String(body.text)]
      : undefined;
    if (!items || items.length === 0) {
      return NextResponse.json({ error: 'items or text required' }, { status: 400 });
    }
    const requested = items.length;
    const created = addItems(id, items, addedBy);
    const added = created.length;
    const skipped = Math.max(requested - added, 0);
    return NextResponse.json({ created, added, skipped }, { status: 201 });
  } catch (e) {
    return NextResponse.json({ error: 'server error' }, { status: 500 });
  }
}

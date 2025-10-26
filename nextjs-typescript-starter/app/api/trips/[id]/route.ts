import { NextResponse } from 'next/server';
import { getTrip, renameTrip } from '@/app/trips/store';

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const trip = getTrip(id);
  if (!trip) return NextResponse.json({ error: 'not found' }, { status: 404 });
  return NextResponse.json({ trip });
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await req.json().catch(() => ({}));
  const name = (body?.name as string | undefined)?.trim();
  if (!name) return NextResponse.json({ error: 'name required' }, { status: 400 });
  const t = renameTrip(id, name);
  if (!t) return NextResponse.json({ error: 'not found' }, { status: 404 });
  return NextResponse.json({ trip: t });
}

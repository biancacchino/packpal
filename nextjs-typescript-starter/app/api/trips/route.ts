import { NextResponse } from 'next/server';
import { createTrip, listTrips } from '@/app/trips/store';

export async function GET() {
  const trips = listTrips();
  return NextResponse.json({ trips });
}

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const name = (body.name as string)?.trim();
    if (!name) return NextResponse.json({ error: 'name required' }, { status: 400 });
    const trip = createTrip(name);
    return NextResponse.json({ trip }, { status: 201 });
  } catch (e) {
    return NextResponse.json({ error: 'server error' }, { status: 500 });
  }
}

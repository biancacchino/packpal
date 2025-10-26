import { NextResponse } from 'next/server';
import { getTrip } from '@/app/trips/store';

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const trip = getTrip(id);
  if (!trip) return NextResponse.json({ error: 'not found' }, { status: 404 });
  const origin = (() => {
    try {
      return new URL(req.url).origin;
    } catch {
      return undefined;
    }
  })();
  const base = process.env.NEXT_PUBLIC_BASE_URL ?? origin ?? 'http://localhost:3000';
  const shareUrl = `${base}/trips/share/${trip.shareToken}`;
  return NextResponse.json({ token: trip.shareToken, url: shareUrl });
}

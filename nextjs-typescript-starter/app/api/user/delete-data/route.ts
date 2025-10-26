import { NextResponse } from 'next/server';
import { clearFriends } from '@/app/friendsStore';
import { clearShares } from '@/app/sharesStore';
import { clearAllTrips, listTrips } from '@/app/trips/store';
import { listFriends } from '@/app/friendsStore';

export async function POST() {
  const before = { trips: listTrips().length, friends: listFriends().length };
  clearAllTrips();
  clearFriends();
  clearShares();
  const after = { trips: 0, friends: 0 };
  return NextResponse.json({ before, after });
}

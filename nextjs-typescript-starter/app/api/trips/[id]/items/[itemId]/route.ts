import { NextResponse } from 'next/server';
import { deleteItem, toggleItem, updateItemText } from '@/app/trips/store';

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string; itemId: string }> }
) {
  const { id, itemId } = await params;
  const body = await req.json().catch(() => ({}));
  const done = typeof body.done === 'boolean' ? body.done : undefined;
  let item = null;
  if (typeof body.text === 'string') {
    item = updateItemText(id, itemId, String(body.text));
    if (item && typeof done === 'boolean') item = toggleItem(id, itemId, done);
  } else {
    item = toggleItem(id, itemId, done);
  }
  if (!item) return NextResponse.json({ error: 'not found' }, { status: 404 });
  return NextResponse.json({ item });
}

export async function DELETE(
  _: Request,
  { params }: { params: Promise<{ id: string; itemId: string }> }
) {
  const { id, itemId } = await params;
  const ok = deleteItem(id, itemId);
  if (!ok) return NextResponse.json({ error: 'not found' }, { status: 404 });
  return NextResponse.json({ ok: true });
}

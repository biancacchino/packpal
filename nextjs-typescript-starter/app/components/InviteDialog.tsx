"use client";

import { useEffect, useId, useMemo, useState } from 'react';
import type { AccessLevel } from 'app/sharesStore';

type Props = {
  open: boolean;
  onClose: () => void;
  friend: { id: string; name: string } | null;
  onInvited?: (result: { tripId: string; access: AccessLevel }) => void;
};

const sampleTrips = [
  { id: '1', title: 'Cancún Trip 🌴' },
  { id: '2', title: 'NYC Weekend 🗽' },
  { id: '3', title: 'Banff Ski Trip ⛷️' },
];

export default function InviteDialog({ open, onClose, friend, onInvited }: Props) {
  const [tripId, setTripId] = useState<string>('');
  const [access, setAccess] = useState<AccessLevel>('view');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const titleId = useId();

  useEffect(() => {
    if (open) {
      setTripId('');
      setAccess('view');
      setError(null);
    }
  }, [open]);

  const trips = sampleTrips;

  if (!open) return null;

  async function handleInvite() {
    if (!friend) return;
    if (!tripId) {
      setError('Please select a trip.');
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch('/api/shares', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ friendId: friend.id, tripId, access }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'Failed to send invite');
      }
      onInvited?.({ tripId, access });
      onClose();
    } catch (e: any) {
      setError(e.message || 'Something went wrong');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" aria-labelledby={titleId} role="dialog" aria-modal="true">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative w-full max-w-md rounded-xl bg-stone-900 border border-stone-700 p-6 shadow-xl">
        <h2 id={titleId} className="text-lg font-semibold">Invite {friend?.name} to a trip</h2>
        <p className="text-sm text-stone-400 mt-1">Choose which trip to share and the access level.</p>

        <div className="mt-5 space-y-4">
          <div>
            <label className="block text-sm text-stone-300 mb-1">Trip</label>
            <select
              value={tripId}
              onChange={(e) => setTripId(e.target.value)}
              className="w-full rounded-md bg-stone-800 border border-stone-700 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-400"
            >
              <option value="" disabled>Select a trip</option>
              {trips.map((t) => (
                <option key={t.id} value={t.id}>{t.title}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm text-stone-300 mb-1">Access</label>
            <div className="grid grid-cols-3 gap-2">
              {(['view','suggest','edit'] as AccessLevel[]).map((lvl) => (
                <button
                  key={lvl}
                  type="button"
                  onClick={() => setAccess(lvl)}
                  className={`px-3 py-2 rounded-md border text-sm transition-colors ${
                    access === lvl
                      ? 'bg-emerald-500 text-black border-emerald-400'
                      : 'bg-stone-800 text-stone-200 border-stone-700 hover:bg-stone-700'
                  }`}
                  aria-pressed={access === lvl}
                >
                  {lvl === 'view' ? 'View' : lvl === 'suggest' ? 'Suggest' : 'Edit'}
                </button>
              ))}
            </div>
          </div>
          {error && <div className="text-sm text-red-400">{error}</div>}
        </div>

        <div className="mt-6 flex justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-md bg-stone-800 border border-stone-700 hover:bg-stone-700 focus:outline-none focus:ring-2 focus:ring-stone-500"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleInvite}
            disabled={submitting}
            className="px-4 py-2 rounded-md bg-emerald-500 text-black font-medium hover:bg-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-300 disabled:opacity-60"
          >
            {submitting ? 'Sending…' : 'Share'}
          </button>
        </div>
      </div>
    </div>
  );
}

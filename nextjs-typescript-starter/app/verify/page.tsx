'use client';

import { useSearchParams, useRouter } from 'next/navigation';
import { useEffect, useState, Suspense } from 'react';
import Link from 'next/link';

function VerifyContent() {
  const searchParams = useSearchParams();
  const token = searchParams.get('token');
  const router = useRouter();
  const [status, setStatus] = useState<'verifying' | 'success' | 'error'>('verifying');

  useEffect(() => {
    if (!token) {
      setStatus('error');
      return;
    }

    fetch('/api/verify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token }),
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.ok) {
          setStatus('success');
          router.push('/login?verified=true');
        } else {
          setStatus('error');
        }
      })
      .catch(() => setStatus('error'));
  }, [token, router]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gray-50 p-4">
      <div className="w-full max-w-md rounded-xl bg-white p-8 shadow-lg text-center">
        <h1 className="mb-4 text-2xl font-bold">Account Verification</h1>
        {status === 'verifying' && <p>Verifying your account...</p>}
        {status === 'success' && (
          <div>
            <p className="text-green-600 mb-4">Successfully verified! Redirecting to login...</p>
            <Link href="/login" className="text-blue-600 hover:underline">
              Go to Login
            </Link>
          </div>
        )}
        {status === 'error' && (
          <div>
            <p className="text-red-600 mb-4">Verification failed. The token may be invalid or expired.</p>
            <Link href="/login" className="text-blue-600 hover:underline">
              Back to Login
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}

export default function VerifyPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <VerifyContent />
    </Suspense>
  );
}

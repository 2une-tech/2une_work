'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { AlertTriangle } from 'lucide-react';

import { useAuthStore } from '@/lib/store';
import { api } from '@/lib/services/api';

export function ProfileMinimumBanner() {
  const { user } = useAuthStore();
  const [gap, setGap] = useState<{
    showBanner: boolean;
    missingPhone: boolean;
    missingLanguages: boolean;
  } | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!user) {
      setGap(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    const result = await api.getProfileMinimumDetailsGap();
    setGap(
      result ?? {
        showBanner: false,
        missingPhone: false,
        missingLanguages: false,
      },
    );
    setLoading(false);
  }, [user]);

  useEffect(() => {
    const t = setTimeout(() => void load(), 0);
    return () => clearTimeout(t);
  }, [load]);

  useEffect(() => {
    const onSaved = () => void load();
    window.addEventListener('2une-profile-saved', onSaved);
    return () => window.removeEventListener('2une-profile-saved', onSaved);
  }, [load]);

  if (!user || loading || !gap?.showBanner) return null;

  const parts: string[] = [];
  if (gap.missingPhone) parts.push('your phone number');
  if (gap.missingLanguages) parts.push('at least one language');

  return (
    <div
      role="status"
      className="border-b border-amber-200/80 bg-amber-50 px-4 py-3 text-amber-950 md:px-6"
    >
      <div className="mx-auto flex max-w-5xl flex-wrap items-start gap-x-3 gap-y-2 text-[13px] leading-snug md:text-sm">
        <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-700" aria-hidden />
        <p className="min-w-0 flex-1">
          <span className="font-semibold">Finish the basics: </span>
          add {parts.join(' and ')} in your profile (About section).
        </p>
        <Link
          href="/profile"
          className="shrink-0 font-semibold text-amber-900 underline underline-offset-2 hover:text-amber-950"
        >
          Open profile
        </Link>
      </div>
    </div>
  );
}

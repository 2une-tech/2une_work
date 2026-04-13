'use client';

import { useEffect, useState } from 'react';

import { api } from '@/lib/services/api';

/**
 * True when the worker has at least one project application in `approved` status
 * (selected for the project — product copy: “received an offer”).
 */
export function useHasProjectOffer(enabled = true) {
  const [hasOffer, setHasOffer] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!enabled) {
      setLoading(false);
      return;
    }
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const apps = await api.getApplications();
        if (!cancelled) {
          setHasOffer(apps.some((a) => a.status === 'approved'));
        }
      } catch {
        if (!cancelled) setHasOffer(false);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [enabled]);

  return { hasOffer, loading };
}

'use client';

import { useEffect } from 'react';
import { useAuthStore } from '@/lib/store';

/** Loads persisted session from localStorage before auth gates run (Next.js + skipHydration). */
export function AuthHydration() {
  useEffect(() => {
    void Promise.resolve(useAuthStore.persist.rehydrate()).finally(() => {
      useAuthStore.setState({ authReady: true });
    });
  }, []);
  return null;
}

'use client';

import { IndianRupee } from 'lucide-react';
import { useRequireAuth } from '@/lib/useRequireAuth';
import { EmptyState } from '@/components/EmptyState';

export default function EarningsPage() {
  const { isAllowed } = useRequireAuth();
  if (!isAllowed) return null;

  return (
    <div className="mx-auto min-h-screen max-w-4xl bg-background px-6 py-8 md:px-8">
      <div className="mb-6 flex items-center gap-3">
        <IndianRupee className="h-7 w-7 text-muted-foreground" strokeWidth={1.5} />
        <div>
          <h1 className="text-xl font-semibold tracking-tight text-foreground">Earnings</h1>
          <p className="text-sm text-muted-foreground">Your payouts and earnings history.</p>
        </div>
      </div>

      <div className="rounded-lg border border-border bg-card">
        <EmptyState
          title="No earnings yet"
          description="When you complete tasks and your work is approved, your earnings will show up here."
          className="py-12"
        />
      </div>
    </div>
  );
}


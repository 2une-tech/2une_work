'use client';

import { DollarSign } from 'lucide-react';
import { useRequireAuth } from '@/lib/useRequireAuth';
import { EmptyState } from '@/components/EmptyState';

export default function EarningsPage() {
  const { isAllowed } = useRequireAuth();
  if (!isAllowed) return null;

  return (
    <div className="mx-auto min-h-screen max-w-2xl bg-background px-6 py-8 md:px-8">
      <h1 className="text-xl font-semibold tracking-tight text-foreground">Earnings</h1>
      <p className="mt-1 text-sm text-muted-foreground">Payouts and statements will appear here.</p>
      <div className="mt-8 rounded-lg border border-border bg-card">
        <EmptyState
          icon={<DollarSign className="h-5 w-5" />}
          title="Earnings coming soon"
          description="This section isn’t connected to the API yet."
          actions={[{ label: 'Browse projects', href: '/jobs', variant: 'default' }]}
          className="py-12"
        />
      </div>
    </div>
  );
}

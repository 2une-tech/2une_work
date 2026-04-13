'use client';

import { Wallet } from 'lucide-react';

import { EmptyState } from '@/components/EmptyState';
import { OfferRequiredPaymentsShell } from '@/components/payments/OfferRequiredPaymentsShell';
import { useRequireAuth } from '@/lib/useRequireAuth';

export default function PaymentPage() {
  const { isAllowed } = useRequireAuth();
  if (!isAllowed) return null;

  return (
    <OfferRequiredPaymentsShell
      pageTitle="Payment"
      pageSubtitle="Add and manage how you get paid after you join a project."
      icon={<Wallet className="h-5 w-5" />}
    >
      <EmptyState
        icon={<Wallet className="h-5 w-5" />}
        title="Payment setup coming soon"
        description="Bank and payout details will be available here once billing is connected."
        actions={[{ label: 'Browse projects', href: '/jobs', variant: 'default' }]}
        className="py-12"
      />
    </OfferRequiredPaymentsShell>
  );
}

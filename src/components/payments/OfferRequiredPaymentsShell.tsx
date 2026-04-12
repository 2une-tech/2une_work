'use client';

import { Loader2 } from 'lucide-react';
import type { ReactNode } from 'react';

import { EmptyState } from '@/components/EmptyState';
import { useHasProjectOffer } from '@/lib/useHasProjectOffer';

const LOCKED_TITLE = 'Available after you receive an offer';
const LOCKED_DESCRIPTION =
  'Earnings and payment details are only for people who have been offered a role on a project. Please wait until you receive an offer before adding payment details.';

type Props = {
  /** Shown in the page header (e.g. Earnings, Payment). */
  pageTitle: string;
  pageSubtitle: string;
  icon: ReactNode;
  /** Content when the user has an offer (e.g. placeholders or future API UI). */
  children: ReactNode;
};

export function OfferRequiredPaymentsShell({ pageTitle, pageSubtitle, icon, children }: Props) {
  const { hasOffer, loading } = useHasProjectOffer();

  return (
    <div className="mx-auto min-h-screen max-w-2xl bg-background px-6 py-8 md:px-8">
      <h1 className="text-xl font-semibold tracking-tight text-foreground">{pageTitle}</h1>
      <p className="mt-1 text-sm text-muted-foreground">{pageSubtitle}</p>

      <div className="mt-8 rounded-lg border border-border bg-card">
        {loading ? (
          <div className="flex justify-center py-16">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : hasOffer ? (
          children
        ) : (
          <EmptyState
            icon={icon}
            title={LOCKED_TITLE}
            description={LOCKED_DESCRIPTION}
            actions={[
              { label: 'Browse projects', href: '/jobs', variant: 'default' },
              { label: 'Dashboard', href: '/dashboard', variant: 'outline' },
            ]}
            className="py-12"
          />
        )}
      </div>
    </div>
  );
}

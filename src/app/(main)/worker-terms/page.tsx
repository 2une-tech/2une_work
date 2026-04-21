import type { Metadata } from 'next';
import Link from 'next/link';
import { ChevronLeft } from 'lucide-react';

import { ContractPaymentTermsSection } from '@/components/ContractPaymentTermsSection';

export const metadata: Metadata = {
  title: 'Worker terms',
  description: 'Contract and payment terms for independent contractors working with 2une.',
};

export default function WorkerTermsPage() {
  return (
    <div className="mx-auto min-h-screen max-w-3xl bg-background px-6 py-8 md:px-8">
      <div className="mb-8">
        <Link
          href="/"
          className="inline-flex items-center gap-1 text-sm font-medium text-muted-foreground hover:text-foreground"
        >
          <ChevronLeft className="h-4 w-4" />
          Back to Explore
        </Link>
      </div>
      <h1 className="text-2xl font-semibold tracking-tight text-foreground">Worker terms</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Summary of how independent contractors work with 2une. Project-specific rules may add detail
        on each listing.
      </p>
      <div className="mt-8">
        <ContractPaymentTermsSection id="worker-terms-contract-heading" />
      </div>
    </div>
  );
}

'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { Compass, Loader2 } from 'lucide-react';

import JobCard from '@/components/JobCard';
import { useAuthStore, useJobStore } from '@/lib/store';
import { EmptyState } from '@/components/EmptyState';
import { BrandLogo } from '@/components/BrandLogo';

export default function ExplorePage() {
  const { user } = useAuthStore();
  const { jobs, isLoading, fetchJobs } = useJobStore();

  useEffect(() => {
    void fetchJobs();
  }, [fetchJobs]);

  return (
    <div className="mx-auto min-h-screen max-w-6xl bg-background px-6 py-8 md:px-8">
      <div className="mb-6 flex gap-3 rounded-md border border-border bg-muted/30 px-4 py-3 text-sm text-muted-foreground">
        <BrandLogo size={20} className="mt-0.5" />
        <p>
          <span className="font-medium text-foreground">2une</span> — Data sourcing, annotation, and RLHF for AI
          teams. Find flexible project work, built with talent in India in mind.
        </p>
      </div>

      <div className="mb-2 flex items-end justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold tracking-tight text-foreground">Explore</h1>
          <p className="mt-1 text-sm text-muted-foreground">Open projects you can apply to.</p>
        </div>
        {!user ? (
          <Link href="/login" className="text-sm font-medium text-primary hover:underline">
            Sign in to apply
          </Link>
        ) : null}
      </div>

      {isLoading && jobs.length === 0 ? (
        <div className="flex min-h-[40vh] items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : jobs.length === 0 ? (
        <div className="rounded-lg border border-border bg-card">
          <EmptyState
            icon={<Compass className="h-5 w-5" />}
            title="No projects to explore yet"
            description="Once projects are available, they’ll appear here."
            actions={user ? undefined : [{ label: 'Sign in', href: '/login', variant: 'default' }]}
            className="py-12"
          />
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
          {jobs.slice(0, 9).map((job) => (
            <JobCard key={job.id} job={job} />
          ))}
        </div>
      )}

      {!user ? (
        <div className="mt-8 rounded-lg border border-border bg-card p-5">
          <p className="text-sm text-muted-foreground">
            Create an account to apply, complete your profile, and start tasks.
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            <Link
              href="/login"
              className="inline-flex h-9 items-center justify-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground hover:bg-primary/90"
            >
              Sign in
            </Link>
            <Link
              href="/signup"
              className="inline-flex h-9 items-center justify-center rounded-md border border-input bg-background px-4 text-sm font-medium hover:bg-muted/60"
            >
              Create account
            </Link>
          </div>
        </div>
      ) : null}
    </div>
  );
}

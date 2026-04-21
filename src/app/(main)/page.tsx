'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { ChevronLeft, ChevronRight, Compass, Loader2 } from 'lucide-react';

import JobCard from '@/components/JobCard';
import { ExploreWhatsAppBanner } from '@/components/ExploreWhatsAppBanner';
import { useAuthStore } from '@/lib/store';
import { EmptyState } from '@/components/EmptyState';
import { BrandLogo } from '@/components/BrandLogo';
import { api } from '@/lib/services/api';
import type { Job } from '@/types';
import { Button } from '@/components/ui/button';

const PAGE_SIZE = 30;

export default function ExplorePage() {
  const { user } = useAuthStore();
  const [page, setPage] = useState(1);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadPage = useCallback(async (p: number) => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.getJobsPage(p, PAGE_SIZE);
      setJobs(res.jobs);
      setTotal(res.total);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load projects');
      setJobs([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadPage(page);
  }, [page, loadPage]);

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const canPrev = page > 1 && !loading;
  const canNext = page < totalPages && !loading;

  return (
    <div className="mx-auto min-h-screen max-w-6xl bg-background px-6 py-8 md:px-8">
      <div className="mb-6 flex gap-3 rounded-md border border-border bg-muted/30 px-4 py-3 text-sm text-muted-foreground">
        <BrandLogo size={20} className="mt-0.5" />
        <p>
          <span className="font-medium text-foreground">2une</span> — Data sourcing, annotation, and RLHF for AI
          teams. Find flexible project work, built with talent in India in mind.
        </p>
      </div>

      <ExploreWhatsAppBanner className="mb-6" />

      <div className="mb-2 flex items-end justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold tracking-tight text-foreground">Explore</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Open projects you can apply to
            {total > 0 ? (
              <>
                {' '}
                <span className="text-foreground/80">
                  ({total} {total === 1 ? 'project' : 'projects'})
                </span>
              </>
            ) : null}
            .
          </p>
        </div>
        {!user ? (
          <Link href="/login" className="text-sm font-medium text-primary hover:underline">
            Sign in to apply
          </Link>
        ) : null}
      </div>

      {error ? (
        <div className="rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
          {error}
        </div>
      ) : null}

      {loading && jobs.length === 0 ? (
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
        <>
          <div className="relative grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
            {loading ? (
              <div className="absolute inset-0 z-10 flex items-start justify-center bg-background/60 pt-8 backdrop-blur-[1px]">
                <Loader2 className="h-7 w-7 animate-spin text-muted-foreground" />
              </div>
            ) : null}
            {jobs.map((job) => (
              <JobCard key={job.id} job={job} />
            ))}
          </div>

          {totalPages > 1 ? (
            <div className="mt-8 flex flex-col items-center justify-between gap-4 border-t border-border pt-6 sm:flex-row">
              <p className="text-center text-sm text-muted-foreground sm:text-left">
                Page <span className="font-medium text-foreground">{page}</span> of{' '}
                <span className="font-medium text-foreground">{totalPages}</span>
                <span className="hidden sm:inline"> · </span>
                <span className="block sm:inline">
                  Showing {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, total)} of {total}
                </span>
              </p>
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={!canPrev}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  className="gap-1"
                >
                  <ChevronLeft className="h-4 w-4" />
                  Previous
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={!canNext}
                  onClick={() => setPage((p) => p + 1)}
                  className="gap-1"
                >
                  Next
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ) : null}
        </>
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

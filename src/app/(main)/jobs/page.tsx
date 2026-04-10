'use client';

import { useEffect } from 'react';
import { Briefcase, Loader2 } from 'lucide-react';
import JobCard from '@/components/JobCard';
import { useJobStore } from '@/lib/store';
import { useRequireAuth } from '@/lib/useRequireAuth';
import { EmptyState } from '@/components/EmptyState';

export default function JobsListPage() {
  const { isAllowed } = useRequireAuth();
  const { jobs, isLoading, fetchJobs } = useJobStore();

  useEffect(() => {
    if (!isAllowed) return;
    void fetchJobs();
  }, [fetchJobs, isAllowed]);

  if (!isAllowed) return null;

  if (isLoading && jobs.length === 0) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="mx-auto min-h-screen max-w-6xl bg-background px-6 py-8 md:px-8">
      <h1 className="text-xl font-semibold tracking-tight text-foreground">Open projects</h1>
      <p className="mt-1 text-sm text-muted-foreground">All listings you can apply to.</p>

      <div className="mt-8">
        {jobs.length === 0 && !isLoading ? (
          <div className="rounded-lg border border-border bg-card">
            <EmptyState
              icon={<Briefcase className="h-5 w-5" />}
              title="No active projects right now"
              description="New projects show up regularly. Check back soon."
              actions={[{ label: 'Back to Explore', href: '/', variant: 'outline' }]}
              className="py-12"
            />
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
            {jobs.map((job) => (
              <JobCard key={job.id} job={job} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

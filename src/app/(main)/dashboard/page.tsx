'use client';

import { Bookmark, CheckCircle2, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useAuthStore } from '@/lib/store';
import { useRequireAuth } from '@/lib/useRequireAuth';
import { api } from '@/lib/services/api';
import type { Application, Job } from '@/types';
import { EmptyState } from '@/components/EmptyState';
import { ErrorState } from '@/components/ErrorState';
import JobCard from '@/components/JobCard';
import { cn } from '@/lib/utils';
import { AI_INTERVIEW_ENABLED } from '@/lib/featureFlags';
import { getSavedProjectIds, SAVED_JOBS_CHANGED_EVENT } from '@/lib/savedJobs';

type TabType = 'Contracts' | 'Offers' | 'Applications' | 'Saved';

export default function DashboardPage() {
  const { isAllowed } = useRequireAuth();
  const { user } = useAuthStore();
  const [activeTab, setActiveTab] = useState<TabType>('Contracts');
  const [apps, setApps] = useState<Application[]>([]);
  const [appsLoading, setAppsLoading] = useState(false);
  const [appsError, setAppsError] = useState<string | null>(null);

  useEffect(() => {
    if (!isAllowed) return;
    let cancelled = false;
    (async () => {
      setAppsLoading(true);
      setAppsError(null);
      try {
        const rows = await api.getApplications();
        if (!cancelled) setApps(rows);
      } catch (e) {
        if (!cancelled) {
          setApps([]);
          setAppsError(e instanceof Error ? e.message : 'Failed to load applications');
        }
      } finally {
        if (!cancelled) setAppsLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [isAllowed]);

  const offerApps = useMemo(() => apps.filter((a) => a.status === 'approved'), [apps]);
  const pipelineApps = useMemo(() => apps.filter((a) => a.status !== 'approved'), [apps]);

  const [savedCount, setSavedCount] = useState(0);
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const sync = () => setSavedCount(getSavedProjectIds().length);
    sync();
    window.addEventListener(SAVED_JOBS_CHANGED_EVENT, sync);
    window.addEventListener('storage', sync);
    return () => {
      window.removeEventListener(SAVED_JOBS_CHANGED_EVENT, sync);
      window.removeEventListener('storage', sync);
    };
  }, []);

  const tabs: { name: TabType; count?: number }[] = [
    { name: 'Contracts' },
    { name: 'Offers', count: offerApps.length },
    { name: 'Applications', count: pipelineApps.length },
    { name: 'Saved', count: savedCount },
  ];

  if (!isAllowed) return null;

  return (
    <div className="mx-auto min-h-screen max-w-5xl bg-background px-6 py-8 md:px-8">
      <div className="mb-8 flex flex-wrap items-center gap-3">
        <h1 className="text-xl font-semibold tracking-tight text-foreground">
          Welcome back{user?.name ? `, ${user.name}` : ''}
        </h1>
        {user?.linkedinConnected ? (
          <span className="inline-flex items-center gap-1 rounded-md border border-border bg-muted/50 px-2 py-0.5 text-xs text-muted-foreground">
            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
            LinkedIn linked
          </span>
        ) : null}
      </div>

      <div className="mb-6 flex flex-wrap gap-1 border-b border-border">
        {tabs.map((tab) => (
          <button
            key={tab.name}
            type="button"
            onClick={() => setActiveTab(tab.name)}
            className={cn(
              '-mb-px border-b-2 px-3 py-2.5 text-sm font-medium transition-colors',
              activeTab === tab.name
                ? 'border-foreground text-foreground'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            )}
          >
            {tab.name}
            {tab.count !== undefined ? (
              <span className="ml-1.5 rounded bg-muted px-1.5 py-0.5 text-xs font-normal text-muted-foreground">
                {tab.count}
              </span>
            ) : null}
          </button>
        ))}
      </div>

      <div>
        {activeTab === 'Contracts' && <ContractsTab />}
        {activeTab === 'Offers' && (
          <OffersTab apps={offerApps} loading={appsLoading} error={appsError} />
        )}
        {activeTab === 'Applications' && (
          <ApplicationsTab apps={pipelineApps} loading={appsLoading} error={appsError} />
        )}
        {activeTab === 'Saved' && <SavedTab />}
      </div>
    </div>
  );
}

function ContractsTab() {
  return (
    <div className="mt-16 flex flex-col items-center justify-center text-center">
      <div className="mb-4 text-muted-foreground">
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="mx-auto h-10 w-10"
        >
          <rect x="2" y="7" width="20" height="14" rx="2" ry="2" />
          <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
        </svg>
      </div>
      <h3 className="text-sm font-semibold text-foreground">No contracts yet</h3>
      <p className="mt-1 max-w-sm text-sm text-muted-foreground">
        You’ll be notified when a company reaches out.
      </p>
    </div>
  );
}

function OffersTab({
  apps,
  loading,
  error,
}: {
  apps: Application[];
  loading: boolean;
  error: string | null;
}) {
  const byUpdated = useMemo(
    () =>
      [...apps].sort((a, b) => {
        const at = Date.parse(a.updatedAt ?? a.appliedAt);
        const bt = Date.parse(b.updatedAt ?? b.appliedAt);
        return bt - at;
      }),
    [apps]
  );

  if (loading) {
    return (
      <div className="flex justify-center py-16">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error) {
    return <ErrorState description={error} onRetry={() => window.location.reload()} />;
  }

  if (byUpdated.length === 0) {
    return (
      <div className="rounded-lg border border-border bg-card">
        <EmptyState
          title="No offers yet"
          description="When an admin approves your application, it will appear here. You can then pick up tasks for that project."
          actions={[{ label: 'Browse projects', href: '/jobs', variant: 'default' }]}
          className="py-10"
        />
      </div>
    );
  }

  return (
    <div className="max-w-3xl space-y-2">
      {byUpdated.map((app) => (
        <div
          key={app.id}
          className="rounded-lg border border-border bg-card p-4 transition-colors hover:bg-muted/40"
        >
          <div className="flex flex-wrap items-start justify-between gap-4">
            <Link href={`/jobs/${app.jobId}`} className="min-w-0 flex-1">
              <h3 className="text-sm font-semibold text-foreground">{app.projectTitle ?? 'Project'}</h3>
              <p className="mt-1 text-xs text-muted-foreground">
                Approved
                {app.interviewScore != null ? ` · Interview score: ${app.interviewScore}` : ''}
              </p>
            </Link>
            <div className="flex shrink-0 flex-col items-end gap-2 sm:flex-row sm:items-center">
              <span className="text-xs text-muted-foreground">{new Date(app.appliedAt).toLocaleDateString()}</span>
              <Link
                href="/tasks"
                className="inline-flex h-8 items-center rounded-md bg-primary px-3 text-xs font-medium text-primary-foreground hover:bg-primary/90"
              >
                Open tasks
              </Link>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

function SavedTab() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [missingIds, setMissingIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  const loadSaved = useCallback(async () => {
    const ids = getSavedProjectIds();
    if (ids.length === 0) {
      setJobs([]);
      setMissingIds([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    const results = await Promise.all(
      ids.map(async (id) => {
        const j = await api.getJobById(id);
        return { id, job: j };
      })
    );
    const ok: Job[] = [];
    const missing: string[] = [];
    for (const r of results) {
      if (r.job) ok.push(r.job);
      else missing.push(r.id);
    }
    setJobs(ok);
    setMissingIds(missing);
    setLoading(false);
  }, []);

  useEffect(() => {
    void loadSaved();
  }, [loadSaved]);

  useEffect(() => {
    const onChange = () => void loadSaved();
    window.addEventListener(SAVED_JOBS_CHANGED_EVENT, onChange);
    window.addEventListener('storage', onChange);
    return () => {
      window.removeEventListener(SAVED_JOBS_CHANGED_EVENT, onChange);
      window.removeEventListener('storage', onChange);
    };
  }, [loadSaved]);

  if (loading) {
    return (
      <div className="flex justify-center py-16">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (jobs.length === 0 && missingIds.length === 0) {
    return (
      <EmptyState
        icon={<Bookmark className="h-5 w-5" />}
        title="No saved projects"
        description="Save jobs from a project page to see them here."
        actions={[
          { label: 'Browse projects', href: '/jobs', variant: 'default' },
          { label: 'Explore', href: '/', variant: 'outline' },
        ]}
        className="mt-8"
      />
    );
  }

  return (
    <div className="space-y-6">
      {missingIds.length > 0 ? (
        <p className="text-sm text-muted-foreground">
          Some saved projects are no longer available ({missingIds.length}). They may have been closed or removed.
        </p>
      ) : null}
      <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
        {jobs.map((job) => (
          <JobCard key={job.id} job={job} />
        ))}
      </div>
    </div>
  );
}

function ApplicationsTab({
  apps,
  loading,
  error,
}: {
  apps: Application[];
  loading: boolean;
  error: string | null;
}) {
  const byUpdated = useMemo(
    () =>
      [...apps].sort((a, b) => {
        const at = Date.parse(a.updatedAt ?? a.appliedAt);
        const bt = Date.parse(b.updatedAt ?? b.appliedAt);
        return bt - at;
      }),
    [apps]
  );

  if (loading) {
    return (
      <div className="flex justify-center py-16">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error) {
    return <ErrorState description={error} onRetry={() => window.location.reload()} />;
  }

  if (byUpdated.length === 0) {
    return (
      <div className="rounded-lg border border-border bg-card">
        <EmptyState
          title="No active applications"
          description={
            AI_INTERVIEW_ENABLED
              ? 'Apply to a project to start the interview. Approved projects move to the Offers tab.'
              : 'Apply to a project to submit your interest. When approved, you’ll see it under Offers.'
          }
          actions={[{ label: 'Browse projects', href: '/jobs', variant: 'default' }]}
          className="py-10"
        />
      </div>
    );
  }

  return (
    <div className="max-w-3xl space-y-2">
      {byUpdated.map((app) => (
        <Link
          key={app.id}
          href={`/jobs/${app.jobId}`}
          className="block rounded-lg border border-border bg-card p-4 transition-colors hover:bg-muted/40"
        >
          <div className="flex items-start justify-between gap-4">
            <div>
              <h3 className="text-sm font-semibold text-foreground">{app.projectTitle ?? 'Project'}</h3>
              <p className="mt-1 text-xs text-muted-foreground">
                Status: <span className="font-medium text-foreground">{app.status.replace(/_/g, ' ')}</span>
                {app.interviewScore != null ? ` · Interview score: ${app.interviewScore}` : ''}
              </p>
            </div>
            <span className="shrink-0 text-xs text-muted-foreground">
              {new Date(app.appliedAt).toLocaleDateString()}
            </span>
          </div>
        </Link>
      ))}
    </div>
  );
}

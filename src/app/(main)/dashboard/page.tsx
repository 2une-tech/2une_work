'use client';

import { Bookmark, CheckCircle2, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { useAuthStore } from '@/lib/store';
import { useRequireAuth } from '@/lib/useRequireAuth';
import { api } from '@/lib/services/api';
import type { Application } from '@/types';
import { EmptyState } from '@/components/EmptyState';
import { ErrorState } from '@/components/ErrorState';
import { cn } from '@/lib/utils';

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

  const tabs: { name: TabType; count?: number }[] = [
    { name: 'Contracts' },
    { name: 'Offers' },
    { name: 'Applications', count: apps.length },
    { name: 'Saved' },
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
        {activeTab === 'Offers' && <OffersTab />}
        {activeTab === 'Applications' && (
          <ApplicationsTab apps={apps} loading={appsLoading} error={appsError} />
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

function OffersTab() {
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
          <rect x="2" y="6" width="20" height="12" rx="2" ry="2" />
          <circle cx="12" cy="12" r="2" />
          <path d="M6 12h.01M18 12h.01" />
        </svg>
      </div>
      <h3 className="text-sm font-semibold text-foreground">No offers yet</h3>
      <p className="mt-1 max-w-sm text-sm text-muted-foreground">Offers you receive will show up here.</p>
    </div>
  );
}

function SavedTab() {
  return (
    <EmptyState
      icon={<Bookmark className="h-5 w-5" />}
      title="Saved items are coming soon"
      description="Saved projects will appear here once bookmarking is available."
      actions={[
        { label: 'Browse projects', href: '/jobs', variant: 'default' },
        { label: 'Explore', href: '/', variant: 'outline' },
      ]}
      className="mt-8"
    />
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
          title="No applications yet"
          description="Apply to a project to start the interview and unlock tasks."
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

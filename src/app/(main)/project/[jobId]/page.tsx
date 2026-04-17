'use client';

import { useEffect, useMemo, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowUpRight, ChevronLeft, Loader2, Sparkles } from 'lucide-react';

import { api } from '@/lib/services/api';
import { useAuthStore } from '@/lib/store';
import type { Job } from '@/types';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ErrorState } from '@/components/ErrorState';
import { Markdown } from '@/components/Markdown';
import { splitMarkdownSections } from '@/lib/markdownSections';

function routeJobId(raw: ReturnType<typeof useParams>['jobId']): string {
  if (typeof raw === 'string' && raw.trim()) return raw.trim();
  if (Array.isArray(raw) && raw[0] && typeof raw[0] === 'string') return raw[0].trim();
  return '';
}

export default function ProjectDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const jobId = routeJobId(params.jobId);

  const { user, authReady, isLoading: authSessionLoading } = useAuthStore();
  const [job, setJob] = useState<Job | null>(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  const applyHref = useMemo(() => `/interview/${jobId}`, [jobId]);
  const loginHref = useMemo(() => `/login?next=${encodeURIComponent(`/project/${jobId}`)}`, [jobId]);

  useEffect(() => {
    if (!jobId) return;
    let cancelled = false;
    (async () => {
      setLoading(true);
      setErr(null);
      try {
        const j = await api.getJobById(jobId);
        if (cancelled) return;
        if (!j) {
          setErr('This project was not found.');
          setJob(null);
          return;
        }
        setJob(j);
      } catch (e) {
        if (cancelled) return;
        setErr(e instanceof Error ? e.message : 'Failed to load project details');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [jobId]);

  if (!jobId) {
    return (
      <ErrorState
        title="Invalid link"
        description="This URL is missing a project id. Open the project from Explore again."
      />
    );
  }

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (err || !job) {
    return (
      <ErrorState
        title="Could not load project"
        description={err ?? 'Unknown error'}
        onRetry={() => window.location.reload()}
      />
    );
  }

  const sections = splitMarkdownSections(job.description || '');
  const descriptionMd = sections.description ?? job.description ?? '';
  const responsibilitiesMd = sections.responsibilities ?? '';
  const requirementsMd = sections.requirements ?? '';
  const timelineMd = sections.timeline ?? '';
  const faqMd = sections.faq ?? '';

  const requirementChips = Array.from(
    new Set([job.category, ...(job.skillsRequired ?? [])].map((s) => String(s).trim()).filter(Boolean)),
  ).slice(0, 10);

  return (
    <div className="mx-auto min-h-screen max-w-6xl bg-background px-6 py-8 md:px-8">
      <div className="mb-6 flex items-center justify-between gap-3">
        <Link
          href="/"
          className="inline-flex items-center gap-1 text-sm font-medium text-muted-foreground hover:text-foreground"
        >
          <ChevronLeft className="h-4 w-4" />
          Back
        </Link>
      </div>

      <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div className="min-w-0">
          <h1 className="text-2xl font-semibold tracking-tight text-foreground md:text-[28px] md:leading-9">
            {job.title}
          </h1>
          <div className="mt-3 flex flex-wrap items-center gap-2">
            {job.contractLabel ? (
              <Badge variant="secondary" className="text-[11px]">
                {job.contractLabel}
              </Badge>
            ) : null}
            <Badge variant="secondary" className="gap-1 rounded-full px-2.5 py-1 text-[11px] font-medium">
              <Sparkles className="h-3.5 w-3.5" />
              Large hiring
            </Badge>
            {requirementChips.map((t) => (
              <Badge key={t} variant="outline" className="text-[11px]">
                {t}
              </Badge>
            ))}
          </div>
        </div>

        <div className="flex shrink-0 flex-col gap-2 md:items-end">
          <div className="text-[15px] font-semibold text-foreground">
            {job.payHeadline}{' '}
            <span className="font-normal text-muted-foreground">{job.payUnitLine}</span>
          </div>
          <Button
            onClick={() => {
              if (!authReady || authSessionLoading) return;
              if (!user) {
                router.push(loginHref);
                return;
              }
              router.push(applyHref);
            }}
            className="gap-1"
          >
            Apply <ArrowUpRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
        <div className="space-y-6 md:col-span-2">
          <section className="rounded-xl border border-border bg-card p-5">
            <h2 className="text-sm font-semibold text-foreground">Description</h2>
            {descriptionMd.trim() ? (
              <Markdown markdown={descriptionMd} className="mt-3" />
            ) : (
              <p className="mt-3 text-sm text-muted-foreground">No description provided yet.</p>
            )}
          </section>

          <section className="rounded-xl border border-border bg-card p-5">
            <h2 className="text-sm font-semibold text-foreground">Responsibilities</h2>
            {responsibilitiesMd.trim() ? (
              <Markdown markdown={responsibilitiesMd} className="mt-3" />
            ) : (
              <p className="mt-3 text-sm text-muted-foreground">Not specified yet.</p>
            )}
          </section>

          <section className="rounded-xl border border-border bg-card p-5">
            <h2 className="text-sm font-semibold text-foreground">Requirements</h2>
            {requirementsMd.trim() ? (
              <Markdown markdown={requirementsMd} className="mt-3" />
            ) : requirementChips.length ? (
              <div className="mt-3 flex flex-wrap gap-2">
                {requirementChips.map((t) => (
                  <Badge key={`req-${t}`} variant="secondary" className="text-[11px]">
                    {t}
                  </Badge>
                ))}
              </div>
            ) : (
              <p className="mt-3 text-sm text-muted-foreground">Not specified yet.</p>
            )}
          </section>

          <section className="rounded-xl border border-border bg-card p-5">
            <h2 className="text-sm font-semibold text-foreground">Timeline</h2>
            {timelineMd.trim() ? (
              <Markdown markdown={timelineMd} className="mt-3" />
            ) : (
              <p className="mt-3 text-sm text-muted-foreground">Not specified yet.</p>
            )}
          </section>

          <section className="rounded-xl border border-border bg-card p-5">
            <h2 className="text-sm font-semibold text-foreground">FAQ</h2>
            {faqMd.trim() ? (
              <Markdown markdown={faqMd} className="mt-3" />
            ) : (
              <p className="mt-3 text-sm text-muted-foreground">No FAQs yet.</p>
            )}
          </section>
        </div>

        <aside className="md:col-span-1">
          <div className="rounded-xl border border-border bg-card p-5 md:sticky md:top-6">
            <div className="text-[15px] font-semibold text-foreground">
              {job.payHeadline}{' '}
              <span className="font-normal text-muted-foreground">{job.payUnitLine}</span>
            </div>
            <p className="mt-2 text-sm text-muted-foreground">
              Apply to start the next step. If selected, you may be asked to complete a short interview.
            </p>
            <div className="mt-4 flex flex-col gap-2">
              <Button
                onClick={() => {
                  if (!authReady || authSessionLoading) return;
                  if (!user) {
                    router.push(loginHref);
                    return;
                  }
                  router.push(applyHref);
                }}
                className="gap-1"
              >
                Apply <ArrowUpRight className="h-4 w-4" />
              </Button>
              <Button variant="outline" onClick={() => router.push('/')}>
                Explore more
              </Button>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}


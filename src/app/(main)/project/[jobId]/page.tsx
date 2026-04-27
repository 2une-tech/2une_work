'use client';

import { useEffect, useMemo, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowUpRight, ChevronLeft, Loader2, Sparkles } from 'lucide-react';

import { JobShareButton } from '@/components/JobShareButton';
import { MobileProjectAppHandoff } from '@/components/MobileProjectAppHandoff';
import { ContractPaymentTermsSection } from '@/components/ContractPaymentTermsSection';

import { api } from '@/lib/services/api';
import { useAuthStore } from '@/lib/store';
import type { Job } from '@/types';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ErrorState } from '@/components/ErrorState';
import { Markdown } from '@/components/Markdown';
import { splitMarkdownSections } from '@/lib/markdownSections';
import { mergeRequiredProjectFaqMarkdown } from '@/lib/projectFaqDefaults';
import { toast } from 'sonner';

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

  const loginHref = useMemo(() => `/login?next=${encodeURIComponent(`/project/${jobId}`)}`, [jobId]);
  const [applicationStatus, setApplicationStatus] = useState<
    | {
        id: string;
        status: 'applied' | 'under_review' | 'interview_pending' | 'approved' | 'rejected';
        interviewScore?: number | null;
        rejectionReason?: string | null;
        createdAt: string;
        updatedAt: string;
      }
    | null
  >(null);
  const [applicationLoading, setApplicationLoading] = useState(false);
  const [applicationErr, setApplicationErr] = useState<string | null>(null);

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

  useEffect(() => {
    if (!jobId) return;
    if (!authReady || authSessionLoading) return;
    let cancelled = false;
    (async () => {
      setApplicationErr(null);
      if (!user) {
        setApplicationStatus(null);
        return;
      }
      try {
        const status = await api.getProjectApplicationStatus(jobId);
        if (cancelled) return;
        setApplicationStatus(status);
      } catch (e) {
        if (cancelled) return;
        setApplicationErr(e instanceof Error ? e.message : 'Failed to load application status');
        setApplicationStatus(null);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [jobId, user, authReady, authSessionLoading]);

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
  const mergedFaqMd = mergeRequiredProjectFaqMarkdown(faqMd);

  const requirementChips = Array.from(
    new Set([job.category, ...(job.skillsRequired ?? [])].map((s) => String(s).trim()).filter(Boolean)),
  ).slice(0, 10);

  const isApplied = applicationStatus != null;

  return (
    <div className="mx-auto min-h-screen max-w-6xl bg-background px-6 py-8 md:px-8">
      <MobileProjectAppHandoff jobId={jobId} jobTitle={job.title} />
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
          <div className="flex w-full flex-wrap items-center gap-2 md:justify-end">
            <JobShareButton jobId={jobId} jobTitle={job.title} variant="outline" size="sm" />
            <Button
              onClick={async () => {
                if (!authReady || authSessionLoading) return;
                if (!user) {
                  router.push(loginHref);
                  return;
                }
                if (isApplied || applicationLoading) return;
                setApplicationLoading(true);
                setApplicationErr(null);
                try {
                  await api.applyToJob(jobId, user.id);
                  const status = await api.getProjectApplicationStatus(jobId);
                  setApplicationStatus(status);
                  toast.success('Applied');
                } catch (e) {
                  const msg = e instanceof Error ? e.message : 'Failed to apply';
                  setApplicationErr(msg);
                  toast.error(msg);
                } finally {
                  setApplicationLoading(false);
                }
              }}
              className="gap-1"
              disabled={isApplied || applicationLoading}
            >
              {isApplied ? 'Applied' : applicationLoading ? 'Applying…' : 'Apply'}{' '}
              <ArrowUpRight className="h-4 w-4" />
            </Button>
          </div>
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
            <p className="mt-2 text-xs text-muted-foreground">
              Common questions for every 2une project. Your project may add more below the divider when
              the listing includes a custom FAQ.
            </p>
            <Markdown markdown={mergedFaqMd} className="mt-3" />
          </section>

          <ContractPaymentTermsSection id="project-contract-payment-terms-heading" />
        </div>

        <aside className="md:col-span-1">
          <div className="rounded-xl border border-border bg-card p-5 md:sticky md:top-6">
            <div className="text-[15px] font-semibold text-foreground">
              {job.payHeadline}{' '}
              <span className="font-normal text-muted-foreground">{job.payUnitLine}</span>
            </div>
            <p className="mt-2 text-sm text-muted-foreground">
              {isApplied
                ? 'You already applied to this project. Check your dashboard for updates.'
                : 'Apply to submit your application. You can track status on your dashboard.'}
            </p>
            {applicationErr ? (
              <p className="mt-3 text-sm text-destructive">{applicationErr}</p>
            ) : null}
            <div className="mt-4 flex flex-col gap-2">
              <JobShareButton
                jobId={jobId}
                jobTitle={job.title}
                variant="outline"
                className="w-full justify-center gap-1.5"
              />
              <Button
                onClick={async () => {
                  if (!authReady || authSessionLoading) return;
                  if (!user) {
                    router.push(loginHref);
                    return;
                  }
                  if (isApplied || applicationLoading) return;
                  setApplicationLoading(true);
                  setApplicationErr(null);
                  try {
                    await api.applyToJob(jobId, user.id);
                    const status = await api.getProjectApplicationStatus(jobId);
                    setApplicationStatus(status);
                    toast.success('Applied');
                  } catch (e) {
                    const msg = e instanceof Error ? e.message : 'Failed to apply';
                    setApplicationErr(msg);
                    toast.error(msg);
                  } finally {
                    setApplicationLoading(false);
                  }
                }}
                className="gap-1"
                disabled={isApplied || applicationLoading}
              >
                {isApplied ? 'Applied' : applicationLoading ? 'Applying…' : 'Apply'}{' '}
                <ArrowUpRight className="h-4 w-4" />
              </Button>
              {user && isApplied ? (
                <Button variant="outline" onClick={() => router.push('/dashboard')}>
                  Go to dashboard
                </Button>
              ) : null}
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


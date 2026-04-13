'use client';

import { useAuthStore } from '@/lib/store';
import { api } from '@/lib/services/api';
import { useState, useEffect, useCallback } from 'react';
import { Job } from '@/types';
import type { Application } from '@/types';
import { useParams, useRouter } from 'next/navigation';
import { Badge } from '@/components/ui/badge';
import { Building2, MapPin, BrainCircuit, Loader2, ArrowLeft, Bookmark, BookmarkCheck } from 'lucide-react';
import { toast } from 'sonner';
import { useRequireAuth } from '@/lib/useRequireAuth';
import { AI_INTERVIEW_ENABLED } from '@/lib/featureFlags';
import { ErrorState } from '@/components/ErrorState';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import Link from 'next/link';
import { isProjectSaved, toggleSavedProject } from '@/lib/savedJobs';
import { cn } from '@/lib/utils';

function routeJobId(raw: ReturnType<typeof useParams>['id']): string {
  if (typeof raw === 'string' && raw.trim()) return raw.trim();
  if (Array.isArray(raw) && raw[0] && typeof raw[0] === 'string') return raw[0].trim();
  return '';
}

function formatApplicationStatus(status: Application['status']): string {
  return status.replace(/_/g, ' ');
}

export default function JobDetails() {
  const params = useParams();
  const jobId = routeJobId(params.id);

  const { isAllowed } = useRequireAuth();
  const [job, setJob] = useState<Job | null>(null);
  const [loading, setLoading] = useState(true);
  const [applying, setApplying] = useState(false);
  /** Loaded when signed in; null = not applied or not loaded */
  const [myApplication, setMyApplication] = useState<Application | null>(null);
  const [applicationLoading, setApplicationLoading] = useState(false);
  const [saved, setSaved] = useState(false);
  const { user } = useAuthStore();
  const router = useRouter();

  useEffect(() => {
    if (!isAllowed) return;
    if (!jobId) {
      setLoading(false);
      return;
    }
    let cancelled = false;
    async function fetchJob() {
      setLoading(true);
      try {
        const data = await api.getJobById(jobId);
        if (!cancelled) {
          if (data) setJob(data);
          else setJob(null);
        }
      } catch (e) {
        if (!cancelled) {
          console.error('[jobs/[id]]', e);
          setJob(null);
          toast.error('Could not load this project. Check your connection or try again.');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    void fetchJob();
    return () => {
      cancelled = true;
    };
  }, [jobId, isAllowed]);

  useEffect(() => {
    if (typeof window === 'undefined' || !jobId) return;
    setSaved(isProjectSaved(jobId));
  }, [jobId]);

  useEffect(() => {
    if (!isAllowed || !jobId || !user) {
      setMyApplication(null);
      return;
    }
    let cancelled = false;
    setApplicationLoading(true);
    void (async () => {
      try {
        const row = await api.getProjectApplicationStatus(jobId);
        if (cancelled) return;
        if (row) {
          setMyApplication({
            id: row.id,
            jobId,
            userId: user.id,
            status: row.status,
            appliedAt: row.createdAt,
            updatedAt: row.updatedAt,
            interviewScore: row.interviewScore,
            rejectionReason: row.rejectionReason,
          });
        } else {
          setMyApplication(null);
        }
      } catch {
        if (!cancelled) setMyApplication(null);
      } finally {
        if (!cancelled) setApplicationLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [isAllowed, jobId, user]);

  const handleToggleSave = useCallback(() => {
    if (!jobId) return;
    const next = toggleSavedProject(jobId);
    setSaved(next);
    toast.success(next ? 'Job saved' : 'Removed from saved jobs');
  }, [jobId]);

  const handleApply = async () => {
    if (myApplication) {
      toast.message('You already applied to this project.');
      return;
    }
    if (!user) {
      toast.error('Please log in to apply.');
      router.push('/login');
      return;
    }
    setApplying(true);
    try {
      const app = await api.applyToJob(job!.id, user.id);
      setMyApplication(app);
      const ageMs = Date.now() - new Date(app.appliedAt).getTime();
      // `applyToJob` resolves with an existing row when the API returns duplicate; those have an older `appliedAt`.
      if (ageMs > 120_000) {
        toast.info('You already applied to this project.');
      } else {
        toast.success(
          AI_INTERVIEW_ENABLED
            ? 'Application submitted. Continue to the AI interview.'
            : 'Application submitted.'
        );
      }
      if (AI_INTERVIEW_ENABLED) {
        router.push(`/interview/${job!.id}`);
      } else {
        router.push('/dashboard');
      }
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Apply failed');
    } finally {
      setApplying(false);
    }
  };

  const hasApplied = myApplication != null;

  if (loading) {
    return (
      <div className="flex justify-center min-h-screen bg-[#F9FAFB] py-20">
        <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
      </div>
    );
  }

  if (!isAllowed) return null;

  if (!jobId) {
    return (
      <div className="min-h-screen bg-[#F9FAFB] pt-20">
        <ErrorState title="Invalid link" description="This URL is missing a project id. Go back to the project list and open a listing again." />
      </div>
    );
  }

  if (!job) {
    return (
      <div className="min-h-screen bg-[#F9FAFB] pt-20">
        <ErrorState title="Project not found" description="This project may have been removed, inactive, or unavailable." />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F9FAFB] text-gray-900 selection:bg-[#7B61FF]/20 pb-20">
      <div className="border-b border-gray-200 bg-[#F9FAFB]/80 backdrop-blur-md sticky top-0 z-40">
        <div className="mx-auto max-w-6xl px-6 md:px-8 py-4">
          <Link href="/jobs" className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-900 transition-colors">
            <ArrowLeft className="h-4 w-4" />
            Back to Explore
          </Link>
        </div>
      </div>

      <div className="mx-auto max-w-6xl px-6 py-10 md:px-8">
        <div className="grid grid-cols-1 gap-10 lg:grid-cols-12 lg:gap-12 lg:items-start">
          {/* Left column — overview + description */}
          <div className="space-y-8 lg:col-span-8">
            <div className="rounded-2xl border border-gray-200 bg-white p-6 lg:p-8 shadow-sm">
              <h1 className="mb-4 text-3xl font-bold tracking-tight text-gray-900 md:text-4xl">{job.title}</h1>

              <div className="mb-6 flex flex-wrap items-center gap-x-6 gap-y-3 text-sm text-gray-500">
                <span className="flex items-center gap-1.5">
                  <Building2 className="h-4 w-4 text-gray-400" /> {job.company}
                </span>
                <span className="flex items-center gap-1.5">
                  <MapPin className="h-4 w-4 text-gray-400" /> Remote / hybrid
                </span>
              </div>

              <div className="flex flex-wrap gap-2">
                <span className="inline-flex items-center rounded bg-[#7B61FF]/10 px-2.5 py-1 text-xs font-medium text-[#7B61FF] ring-1 ring-inset ring-[#7B61FF]/20">
                  {job.contractLabel || 'Contract'}
                </span>
                <span className="inline-flex items-center rounded bg-gray-50 px-2.5 py-1 text-xs font-medium text-gray-700 ring-1 ring-inset ring-gray-200">
                  {job.category}
                </span>
                <span className="inline-flex items-center rounded bg-gray-50 px-2.5 py-1 text-xs font-medium text-gray-700 ring-1 ring-inset ring-gray-200">
                  {job.experienceLevel}
                </span>
              </div>
            </div>

            <section className="rounded-2xl border border-gray-200 bg-white p-6 lg:p-8 shadow-sm">
              <h2 className="mb-6 text-xs font-bold uppercase tracking-widest text-[#7B61FF]">About the role</h2>
              <div className="text-gray-600 prose prose-gray max-w-none prose-p:leading-relaxed prose-headings:text-gray-900 prose-a:text-[#7B61FF] hover:prose-a:text-[#8e78ff]">
                <ReactMarkdown
                  remarkPlugins={[remarkGfm]}
                  components={{
                    h1: ({ children }) => <h3 className="mt-8 mb-4 text-xl font-semibold text-gray-900">{children}</h3>,
                    h2: ({ children }) => <h3 className="mt-8 mb-4 text-xl font-semibold text-gray-900">{children}</h3>,
                    h3: ({ children }) => <h3 className="mt-6 mb-3 text-lg font-semibold text-gray-900">{children}</h3>,
                    p: ({ children }) => <p className="mb-4 leading-relaxed">{children}</p>,
                    ul: ({ children }) => <ul className="mb-6 list-disc pl-5 space-y-2 text-gray-600">{children}</ul>,
                    ol: ({ children }) => <ol className="mb-6 list-decimal pl-5 space-y-2 text-gray-600">{children}</ol>,
                    li: ({ children }) => <li className="leading-relaxed pl-1">{children}</li>,
                    a: ({ href, children }) => (
                      <a
                        href={href}
                        className="text-[#7B61FF] underline underline-offset-4 decoration-[#7B61FF]/30 hover:decoration-[#7B61FF] transition-all"
                        target="_blank"
                        rel="noreferrer"
                      >
                        {children}
                      </a>
                    ),
                    strong: ({ children }) => <strong className="font-semibold text-gray-900">{children}</strong>,
                    hr: () => <hr className="my-8 border-gray-200" />,
                  }}
                >
                  {job.description}
                </ReactMarkdown>
              </div>
            </section>
          </div>

          {/* Right column — sticky: pay, skills, apply, save */}
          <div className="lg:col-span-4">
            <div className="space-y-6 lg:sticky lg:top-24 lg:self-start">
              <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
                <div className="text-xs font-bold uppercase tracking-widest text-gray-500 mb-3">Compensation</div>
                <p className="text-2xl font-bold leading-tight tracking-tight text-[#7B61FF]">{job.payRange}</p>
              </div>

              <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
                <h3 className="mb-4 text-xs font-bold uppercase tracking-widest text-gray-500">Skills</h3>
                {job.skillsRequired && job.skillsRequired.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {job.skillsRequired.map((skill) => (
                      <Badge
                        key={skill}
                        variant="secondary"
                        className="rounded-lg border border-gray-200 bg-gray-50 px-3 py-1.5 text-sm font-normal text-gray-800"
                      >
                        {skill}
                      </Badge>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-gray-500 italic">No specific skills listed</p>
                )}
              </div>

              <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm space-y-4">
                {applicationLoading && user ? (
                  <div className="flex items-center justify-center gap-2 py-4 text-sm text-gray-500">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Checking application…
                  </div>
                ) : hasApplied && myApplication ? (
                  <div className="rounded-xl border border-emerald-200 bg-emerald-50/80 px-4 py-4">
                    <p className="text-sm font-semibold text-emerald-900">Applied</p>
                    <p className="mt-1 text-xs text-emerald-800/90 capitalize">
                      Status: {formatApplicationStatus(myApplication.status)}
                    </p>
                    <Link
                      href="/dashboard"
                      className="mt-3 inline-flex text-sm font-medium text-[#7B61FF] hover:text-[#8e78ff] hover:underline"
                    >
                      View on dashboard
                    </Link>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={handleApply}
                    disabled={applying}
                    className="flex h-14 w-full items-center justify-center gap-2 rounded-full bg-[#7B61FF] font-semibold text-white transition-all hover:bg-[#8e78ff] hover:shadow-[0_0_20px_rgba(123,97,255,0.3)] active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {applying ? <Loader2 className="h-5 w-5 animate-spin" /> : <BrainCircuit className="h-5 w-5" />}
                    {applying ? 'Submitting…' : 'Apply now'}
                  </button>
                )}

                <button
                  type="button"
                  onClick={handleToggleSave}
                  className={cn(
                    'flex h-12 w-full items-center justify-center gap-2 rounded-full border-2 text-sm font-semibold transition-all',
                    saved
                      ? 'border-[#7B61FF] bg-[#7B61FF]/5 text-[#7B61FF]'
                      : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300 hover:bg-gray-50'
                  )}
                >
                  {saved ? <BookmarkCheck className="h-5 w-5 shrink-0" /> : <Bookmark className="h-5 w-5 shrink-0" />}
                  {saved ? 'Saved' : 'Save job'}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

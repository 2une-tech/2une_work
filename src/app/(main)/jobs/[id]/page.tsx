'use client';

import { useAuthStore } from '@/lib/store';
import { api } from '@/lib/services/api';
import { useState, useEffect } from 'react';
import { Job } from '@/types';
import { useParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Building2, MapPin, BrainCircuit, Loader2, ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';
import { ApiRequestError } from '@/lib/services/api';
import { useRequireAuth } from '@/lib/useRequireAuth';
import { ErrorState } from '@/components/ErrorState';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import Link from 'next/link';

function routeJobId(raw: ReturnType<typeof useParams>['id']): string {
  if (typeof raw === 'string' && raw.trim()) return raw.trim();
  if (Array.isArray(raw) && raw[0] && typeof raw[0] === 'string') return raw[0].trim();
  return '';
}

export default function JobDetails() {
  const params = useParams();
  const jobId = routeJobId(params.id);

  const { isAllowed } = useRequireAuth();
  const [job, setJob] = useState<Job | null>(null);
  const [loading, setLoading] = useState(true);
  const [applying, setApplying] = useState(false);
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

  const handleApply = async () => {
    if (!user) {
      toast.error('Please log in to apply.');
      router.push('/login');
      return;
    }
    setApplying(true);
    try {
      await api.applyToJob(job!.id, user.id);
      toast.success('Application submitted. Continue to the AI interview.');
      router.push(`/interview/${job!.id}`);
    } catch (e) {
      if (e instanceof ApiRequestError && e.code === 'PROFILE_INCOMPLETE') {
        toast.error('Complete your profile before applying.');
        router.push('/profile');
        return;
      }
      toast.error(e instanceof Error ? e.message : 'Apply failed');
    } finally {
      setApplying(false);
    }
  };

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
      
      {/* Back Navigation Header */}
      <div className="border-b border-gray-200 bg-[#F9FAFB]/80 backdrop-blur-md sticky top-0 z-40">
        <div className="mx-auto max-w-5xl px-6 md:px-8 py-4">
          <Link href="/jobs" className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-900 transition-colors">
            <ArrowLeft className="h-4 w-4" />
            Back to Explore
          </Link>
        </div>
      </div>

      <div className="mx-auto max-w-5xl px-6 py-10 md:px-8">
        
        {/* Main Banner */}
        <div className="mb-10 rounded-2xl border border-gray-200 bg-white p-6 lg:p-10 shadow-sm">
          <div className="flex flex-col gap-8 lg:flex-row lg:items-start lg:justify-between">
            <div className="min-w-0 flex-1">
              <h1 className="mb-4 text-3xl md:text-4xl font-bold tracking-tight text-gray-900">{job.title}</h1>
              
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

            <div className="flex w-full flex-col gap-4 sm:flex-row sm:items-stretch lg:w-72 lg:shrink-0 lg:flex-col mt-2 lg:mt-0">
              <div className="rounded-xl border border-gray-200 bg-gray-50 px-6 py-5 sm:min-w-[14rem] flex flex-col justify-center">
                <div className="text-xs font-bold uppercase tracking-widest text-gray-500 mb-3">Compensation</div>
                <p className="text-2xl font-bold leading-tight tracking-tight text-[#7B61FF] md:text-3xl">{job.payRange}</p>
              </div>
              
              <button 
                onClick={handleApply} 
                disabled={applying} 
                className="h-14 w-full rounded-full bg-[#7B61FF] hover:bg-[#8e78ff] hover:shadow-[0_0_20px_rgba(123,97,255,0.3)] text-white font-semibold transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {applying ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  <BrainCircuit className="h-5 w-5" />
                )}
                {applying ? 'Submitting...' : 'Apply Now'}
              </button>
            </div>
          </div>
        </div>

        {/* Details Two-column Grid */}
        <div className="grid grid-cols-1 gap-10 lg:grid-cols-3">
          
          <div className="space-y-6 lg:col-span-2">
            <section className="rounded-2xl border border-gray-200 bg-white p-6 lg:p-8 shadow-sm">
              <h2 className="mb-6 text-xs font-bold uppercase tracking-widest text-[#7B61FF]">
                About the role
              </h2>
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
                      <a href={href} className="text-[#7B61FF] underline underline-offset-4 decoration-[#7B61FF]/30 hover:decoration-[#7B61FF] transition-all" target="_blank" rel="noreferrer">
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
          
          <div className="space-y-6">
            <div className="rounded-2xl border border-gray-200 bg-white p-6 lg:p-8 sticky top-24 shadow-sm">
              <h3 className="mb-5 text-xs font-bold uppercase tracking-widest text-gray-500">Skills & Tech Stack</h3>
              {job.skillsRequired && job.skillsRequired.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {job.skillsRequired.map(skill => (
                    <div key={skill} className="px-3 py-1.5 rounded-lg bg-gray-50 border border-gray-200 text-sm text-gray-700">
                      {skill}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-500 italic">No specific skills listed</p>
              )}
            </div>
          </div>
          
        </div>
      </div>
    </div>
  );
}

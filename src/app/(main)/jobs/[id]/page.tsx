'use client';

import { useAuthStore } from '@/lib/store';
import { api } from '@/lib/services/api';
import { useState, useEffect } from 'react';
import { Job } from '@/types';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Building2, MapPin, DollarSign, BrainCircuit, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { ApiRequestError } from '@/lib/services/api';
import { useRequireAuth } from '@/lib/useRequireAuth';
import { ErrorState } from '@/components/ErrorState';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

export default function JobDetails({ params }: { params: { id: string } }) {
  const { isAllowed } = useRequireAuth();
  const [job, setJob] = useState<Job | null>(null);
  const [loading, setLoading] = useState(true);
  const [applying, setApplying] = useState(false);
  const { user } = useAuthStore();
  const router = useRouter();

  useEffect(() => {
    if (!isAllowed) return;
    async function fetchJob() {
      try {
        const data = await api.getJobById(params.id);
        if (data) setJob(data);
      } finally {
        setLoading(false);
      }
    }
    fetchJob();
  }, [params.id, isAllowed]);

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
      <div className="flex justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!isAllowed) return null;

  if (!job) {
    return <ErrorState title="Project not found" description="This project may have been removed or is unavailable." />;
  }

  return (
    <div className="mx-auto max-w-4xl px-6 py-8 md:px-8">
      <div className="mb-8 rounded-lg border border-border bg-card p-6 md:p-8">
        <div className="flex flex-col items-start justify-between gap-6 md:flex-row">
          <div>
            <h1 className="mb-2 text-2xl font-semibold tracking-tight">{job.title}</h1>
            <div className="mb-5 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
              <span className="flex items-center gap-1">
                <Building2 className="h-4 w-4" /> {job.company}
              </span>
              <span className="flex items-center gap-1">
                <MapPin className="h-4 w-4" /> Remote / hybrid
              </span>
              <span className="flex items-center gap-1">
                <DollarSign className="h-4 w-4" /> {job.payRange}
              </span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              <Badge variant="outline" className="border-border bg-muted/50 font-normal">
                {job.category}
              </Badge>
              <Badge variant="outline" className="border-border bg-muted/50 font-normal">
                {job.experienceLevel}
              </Badge>
              {job.tags.map((tag) => (
                <Badge key={tag} variant="secondary" className="font-normal">
                  {tag}
                </Badge>
              ))}
            </div>
          </div>
          <div className="flex w-full gap-2 md:w-auto md:shrink-0">
            <Button onClick={handleApply} disabled={applying} className="h-9 flex-1 md:w-auto md:min-w-[8rem]">
              {applying ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <BrainCircuit className="mr-2 h-4 w-4" />
              )}
              Apply
            </Button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
        <div className="space-y-6 md:col-span-2">
          <section>
            <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
              About the role
            </h2>
            <div className="text-muted-foreground leading-relaxed">
              <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                components={{
                  h1: ({ children }) => <h3 className="mt-6 mb-2 text-base font-semibold text-foreground">{children}</h3>,
                  h2: ({ children }) => <h3 className="mt-6 mb-2 text-base font-semibold text-foreground">{children}</h3>,
                  h3: ({ children }) => <h3 className="mt-6 mb-2 text-base font-semibold text-foreground">{children}</h3>,
                  p: ({ children }) => <p className="mb-3 leading-relaxed">{children}</p>,
                  ul: ({ children }) => <ul className="mb-3 list-disc pl-5 space-y-1">{children}</ul>,
                  ol: ({ children }) => <ol className="mb-3 list-decimal pl-5 space-y-1">{children}</ol>,
                  li: ({ children }) => <li className="leading-relaxed">{children}</li>,
                  a: ({ href, children }) => (
                    <a href={href} className="text-primary underline underline-offset-2" target="_blank" rel="noreferrer">
                      {children}
                    </a>
                  ),
                  strong: ({ children }) => <strong className="font-semibold text-foreground">{children}</strong>,
                  hr: () => <hr className="my-5 border-border" />,
                }}
              >
                {job.description}
              </ReactMarkdown>
            </div>
          </section>
        </div>
        
        <div className="space-y-6">
          <div className="rounded-lg border border-border bg-muted/20 p-5">
            <h3 className="mb-3 text-sm font-semibold text-foreground">Skills required</h3>
            <div className="flex flex-wrap gap-2">
              {job.skillsRequired.map(skill => (
                <Badge key={skill} variant="secondary">{skill}</Badge>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

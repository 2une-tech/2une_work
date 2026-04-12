'use client';

import { useAuthStore } from '@/lib/store';
import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import ChatUI from '@/components/ChatUI';
import { api, ApiRequestError } from '@/lib/services/api';
import type { Application } from '@/types';
import { Loader2, MessageSquareWarning } from 'lucide-react';
import { toast } from 'sonner';
import Link from 'next/link';
import { ErrorState } from '@/components/ErrorState';
import { EmptyState } from '@/components/EmptyState';
function routeJobId(raw: ReturnType<typeof useParams>['jobId']): string {
  if (typeof raw === 'string' && raw.trim()) return raw.trim();
  if (Array.isArray(raw) && raw[0] && typeof raw[0] === 'string') return raw[0].trim();
  return '';
}

export default function InterviewPage() {
  const params = useParams();
  const jobId = routeJobId(params.jobId);

  const { user } = useAuthStore();
  const router = useRouter();
  const [app, setApp] = useState<Application | null>(null);
  const [questions, setQuestions] = useState<{ id: string; question: string }[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) {
      router.push('/login');
      setLoading(false);
      return;
    }

    if (!jobId) {
      setLoading(false);
      return;
    }

    const sessionUser = user;

    async function run() {
      const uid = sessionUser.id;
      setLoading(true);
      setError(null);
      try {
        const applications = await api.getApplications();
        let current = applications.find((a) => a.jobId === jobId && a.userId === uid);

        if (!current) {
          try {
            current = await api.applyToJob(jobId, uid);
          } catch (e) {
            if (e instanceof ApiRequestError && e.code === 'PROFILE_INCOMPLETE') {
              toast.error('Complete your profile before applying.');
              router.push('/profile');
              return;
            }
            throw e;
          }
        }

        setApp(current);

        if (current.status === 'interview_pending') {
          try {
            const start = await api.startAiInterview(current.id);
            setQuestions(start.questions);
          } catch (e) {
            const msg = e instanceof Error ? e.message : 'Could not start interview';
            setError(msg);
            setQuestions([]);
            toast.error(msg);
          }
        } else {
          setQuestions([]);
        }
      } catch (e) {
        const msg = e instanceof Error ? e.message : 'Failed to load application';
        setError(msg);
        toast.error(msg);
      } finally {
        setLoading(false);
      }
    }

    void run();
  }, [user, jobId, router]);

  if (!jobId) {
    return (
      <ErrorState
        title="Invalid link"
        description="This URL is missing a project id. Open the interview from a project listing again."
      />
    );
  }

  if (loading || !app) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error && app.status === 'interview_pending' && questions !== null && questions.length === 0) {
    return <ErrorState description={error} onRetry={() => window.location.reload()} />;
  }

  if (app.status !== 'interview_pending') {
    return (
      <div className="mx-auto max-w-3xl space-y-4 px-6 py-8 md:px-8">
        <h1 className="text-xl font-semibold tracking-tight">Application status</h1>
        <p className="text-sm text-muted-foreground">
          This application is <strong>{app.status.replace(/_/g, ' ')}</strong>
          {app.interviewScore != null ? ` (interview score: ${app.interviewScore})` : ''}.
        </p>
        <Link
          href="/dashboard"
          className="inline-flex h-9 items-center justify-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground hover:bg-primary/90"
        >
          Go to dashboard
        </Link>
      </div>
    );
  }

  if (questions === null) {
    return (
      <div className="mx-auto max-w-lg py-16 text-center">
        <Loader2 className="mx-auto h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (questions.length === 0) {
    return (
      <EmptyState
        icon={<MessageSquareWarning className="h-6 w-6" />}
        title="No interview questions returned"
        description="Please try again in a moment."
        actions={[
          { label: 'Retry', onClick: () => window.location.reload(), variant: 'default' },
          { label: 'Back to projects', href: '/jobs', variant: 'outline' },
        ]}
      />
    );
  }

  return (
    <div className="mx-auto max-w-3xl px-6 py-8 md:px-8">
      <div className="mb-6">
        <h1 className="text-xl font-semibold tracking-tight">AI interview</h1>
        <p className="text-sm text-muted-foreground">Answer each question to complete this step.</p>
      </div>
      <ChatUI applicationId={app.id} questions={questions} />
    </div>
  );
}

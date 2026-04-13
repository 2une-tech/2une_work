'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ClipboardList, Inbox, Loader2, Play } from 'lucide-react';
import { toast } from 'sonner';

import { useAuthStore } from '@/lib/store';
import { api, ApiRequestError } from '@/lib/services/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { EmptyState } from '@/components/EmptyState';

export default function TasksPage() {
  const router = useRouter();
  const { user, authReady, isLoading: authSessionLoading } = useAuthStore();
  const [loading, setLoading] = useState(true);
  const [listLoading, setListLoading] = useState(false);
  const [assignments, setAssignments] = useState<
    Array<{
      id: string;
      task: { id: string; inputData: unknown; project: { title: string } };
    }>
  >([]);
  const [activeTaskId, setActiveTaskId] = useState<string | null>(null);
  const [inputData, setInputData] = useState<unknown>(null);
  const [outputJson, setOutputJson] = useState('{}');
  const [submitting, setSubmitting] = useState(false);

  const loadList = useCallback(async () => {
    setListLoading(true);
    try {
      const data = await api.listMyTasks(1, 50);
      setAssignments(data.items);
    } catch (e) {
      if (e instanceof ApiRequestError && e.code === 'PROFILE_INCOMPLETE') {
        toast.error('Complete your profile to access tasks.');
        router.push('/profile');
        return;
      }
      toast.error(e instanceof Error ? e.message : 'Failed to load tasks');
    } finally {
      setListLoading(false);
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    if (!authReady || authSessionLoading) return;
    if (!user) {
      router.replace('/login');
      return;
    }
    void loadList();
  }, [authReady, authSessionLoading, user, router, loadList]);

  const claimNext = async () => {
    try {
      const data = await api.nextTask();
      if (!data.assignment) {
        toast.message('No tasks available right now.');
        return;
      }
      const t = data.assignment.task;
      setActiveTaskId(t.id);
      setInputData(t.inputData);
      setOutputJson('{}');
      toast.success('Task assigned.');
      await loadList();
    } catch (e) {
      if (e instanceof ApiRequestError && e.code === 'PROFILE_INCOMPLETE') {
        toast.error('Complete your profile to access tasks.');
        router.push('/profile');
        return;
      }
      if (e instanceof ApiRequestError && e.code === 'NO_APPROVED_PROJECTS') {
        toast.error('You need an approved project application before tasks can be assigned.');
        return;
      }
      toast.error(e instanceof Error ? e.message : 'Could not claim task');
    }
  };

  const submit = async () => {
    if (!activeTaskId) return;
    let outputData: unknown;
    try {
      outputData = JSON.parse(outputJson || '{}');
    } catch {
      toast.error('Output must be valid JSON.');
      return;
    }
    setSubmitting(true);
    try {
      await api.submitTask(activeTaskId, outputData, 0);
      toast.success('Submission recorded.');
      setActiveTaskId(null);
      setInputData(null);
      setOutputJson('{}');
      await loadList();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Submit failed');
    } finally {
      setSubmitting(false);
    }
  };

  if (!authReady || authSessionLoading || !user || loading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="mx-auto min-h-screen max-w-4xl space-y-8 bg-background px-6 py-8 md:px-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <ClipboardList className="h-7 w-7 text-muted-foreground" strokeWidth={1.5} />
          <div>
            <h1 className="text-xl font-semibold tracking-tight text-foreground">Tasks</h1>
            <p className="text-sm text-muted-foreground">Claim work from projects you&apos;re approved for.</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => loadList()} disabled={listLoading}>
            {listLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Refresh list'}
          </Button>
          <Button onClick={() => void claimNext()}>
            <Play className="h-4 w-4 mr-2" />
            Get next task
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Current task</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {!activeTaskId ? (
            <EmptyState
              icon={<Inbox className="h-6 w-6" />}
              title="No active task"
              description='Click "Get next task" to pull an assignment from the queue.'
              actions={[{ label: 'Get next task', onClick: () => void claimNext(), variant: 'default' }]}
              className="py-8"
            />
          ) : (
            <>
              <div>
                <Label className="text-xs text-muted-foreground">Input data</Label>
                <pre className="mt-1 p-3 rounded-md bg-muted text-xs overflow-auto max-h-48">
                  {JSON.stringify(inputData, null, 2)}
                </pre>
              </div>
              <div>
                <Label htmlFor="output">Output (JSON)</Label>
                <Textarea
                  id="output"
                  className="mt-1 font-mono text-xs min-h-[120px]"
                  value={outputJson}
                  onChange={(e) => setOutputJson(e.target.value)}
                />
              </div>
              <Button onClick={() => void submit()} disabled={submitting}>
                {submitting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                Submit
              </Button>
            </>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Your assigned tasks</CardTitle>
        </CardHeader>
        <CardContent>
          {assignments.length === 0 ? (
            <EmptyState
              title="No assignments yet"
              description="Once you're approved for a project, tasks will appear here."
              actions={[{ label: 'Explore projects', href: '/', variant: 'outline' }]}
              className="py-8"
            />
          ) : (
            <ul className="space-y-2 text-sm">
              {assignments.map((row) => (
                <li
                  key={row.id}
                  className="flex justify-between rounded-md border border-border bg-card p-3"
                >
                  <span className="font-medium">{row.task.project.title}</span>
                  <span className="text-muted-foreground font-mono text-xs">{row.task.id.slice(0, 8)}…</span>
                </li>
              ))}
            </ul>
          )}
          <p className="text-xs text-muted-foreground mt-4">
            Need an approved application?{' '}
            <Link href="/" className="text-primary underline">
              Explore projects
            </Link>
            .
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { api, type AdminBulkCreateProjectsResponse, type AdminBulkProjectInput } from '@/lib/services/api';
import { useRequireAuth } from '@/lib/useRequireAuth';
import { useAuthStore } from '@/lib/store';
import { Button, buttonVariants } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Shield } from 'lucide-react';

const SAMPLE_FALLBACK = `{
  "projects": [
    {
      "title": "Example project",
      "domain": "Legal",
      "payType": "per_task",
      "payMin": 1,
      "payMax": 1,
      "status": "draft",
      "config": {
        "task_type": "generic",
        "input_schema": {
          "type": "object",
          "fields": [{ "name": "text", "type": "string", "required": true, "description": "Input text" }]
        },
        "output_schema": { "type": "single_select", "options": ["Yes", "No"] },
        "evaluation": { "type": "manual", "passing_score": 0.8 }
      }
    }
  ]
}`;

const EXAMPLE_UPLOAD_STATUS_RESPONSE = `{
  "success": true,
  "data": {
    "totalRequested": 3,
    "totalCreated": 2,
    "results": [
      { "index": 0, "ok": true, "project": { "id": "…", "title": "…", "status": "draft", "domain": "Legal", "payType": "per_hour", "payMin": 0, "payMax": 65, "payPerTask": 65 } },
      { "index": 1, "ok": false, "message": "…" },
      { "index": 2, "ok": true, "project": { "id": "…", "title": "…", "status": "paused", "domain": "Finance", "payType": "per_task", "payMin": 0.5, "payMax": 2.5, "payPerTask": 2.5 } }
    ],
    "created": [ "…" ],
    "errors": [ { "index": 1, "message": "…" } ]
  }
}`;

function normalizeBulkPayload(parsed: unknown): AdminBulkProjectInput[] {
  if (Array.isArray(parsed)) {
    return parsed as AdminBulkProjectInput[];
  }
  if (parsed && typeof parsed === 'object' && 'projects' in parsed && Array.isArray((parsed as { projects: unknown }).projects)) {
    return (parsed as { projects: AdminBulkProjectInput[] }).projects;
  }
  throw new Error('JSON must be an array of projects or an object with a "projects" array');
}

type RowSummary = { index: number; title: string; domain: string; status: string };

export default function AdminProjectsBulkPage() {
  const router = useRouter();
  const { isAllowed } = useRequireAuth();
  const { user } = useAuthStore();
  const [jsonText, setJsonText] = useState('');
  const [sampleLoading, setSampleLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [lastResult, setLastResult] = useState<AdminBulkCreateProjectsResponse | null>(null);
  const [lastRowSummaries, setLastRowSummaries] = useState<RowSummary[] | null>(null);

  useEffect(() => {
    let cancelled = false;
    void fetch('/samples/bulk-projects-upload.json')
      .then((r) => (r.ok ? r.text() : Promise.reject(new Error(String(r.status)))))
      .then((t) => {
        if (!cancelled) setJsonText(t);
      })
      .catch(() => {
        if (!cancelled) setJsonText(SAMPLE_FALLBACK);
      })
      .finally(() => {
        if (!cancelled) setSampleLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const disabled = useMemo(
    () => submitting || sampleLoading || !jsonText.trim() || !isAllowed || user?.role !== 'admin',
    [submitting, sampleLoading, jsonText, isAllowed, user?.role],
  );

  if (!isAllowed || user?.role !== 'admin') {
    return null;
  }

  async function loadSampleFromFile() {
    try {
      const res = await fetch('/samples/bulk-projects-upload.json');
      if (!res.ok) throw new Error(String(res.status));
      const t = await res.text();
      setJsonText(t);
      toast.success('Loaded sample from /samples/bulk-projects-upload.json');
    } catch {
      setJsonText(SAMPLE_FALLBACK);
      toast.message('Using built-in fallback sample');
    }
  }

  return (
    <div className="mx-auto max-w-6xl px-6 py-8 md:px-8">
      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className="rounded-md border border-border p-2 text-muted-foreground">
            <Shield className="h-5 w-5" strokeWidth={1.5} />
          </div>
          <div>
            <h1 className="text-xl font-semibold tracking-tight text-foreground">Bulk project upload</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Create many projects in one request. Uses <code className="rounded bg-muted px-1 py-0.5 text-xs">POST /admin/projects/bulk</code> with the same
              JSON shape as the admin console.
            </p>
            <Link
              href="/admin"
              className={cn(buttonVariants({ variant: 'link', size: 'sm' }), 'mt-1 inline-flex h-auto items-center gap-1 p-0 text-sm')}
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              Back to admin
            </Link>
          </div>
        </div>
      </div>

      <Card className="mb-4">
        <CardHeader>
          <CardTitle className="text-base">Sample file and upload status</CardTitle>
          <CardDescription>
            Download{' '}
            <a href="/samples/bulk-projects-upload.json" download="bulk-projects-upload.json" className="font-medium text-foreground underline">
              bulk-projects-upload.json
            </a>{' '}
            (request template) and{' '}
            <a
              href="/samples/bulk-upload-response.example.json"
              download="bulk-upload-response.example.json"
              className="font-medium text-foreground underline"
            >
              bulk-upload-response.example.json
            </a>{' '}
            (example upload-status response). Three sample rows use different <code className="rounded bg-muted px-1 text-xs">status</code> values. After upload,
            the table mirrors <code className="rounded bg-muted px-1 text-xs">data.results</code> by <code className="rounded bg-muted px-1 text-xs">index</code>.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <details className="rounded-md border border-border bg-muted/40 p-3">
            <summary className="cursor-pointer text-xs font-medium text-foreground">Example API response (upload status)</summary>
            <pre className="mt-2 max-h-56 overflow-auto rounded-md border border-border bg-background p-3 font-mono text-[11px] leading-relaxed">
              {EXAMPLE_UPLOAD_STATUS_RESPONSE}
            </pre>
          </details>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">JSON payload</CardTitle>
          <CardDescription>Up to 100 projects. Paste JSON or load the sample file.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex flex-wrap gap-2">
            <Button type="button" variant="outline" size="sm" onClick={() => void loadSampleFromFile()}>
              Load sample JSON
            </Button>
            <a
              href="/samples/bulk-projects-upload.json"
              download="bulk-projects-upload.json"
              className={cn(buttonVariants({ variant: 'outline', size: 'sm' }))}
            >
              Download sample
            </a>
            <label className="inline-flex cursor-pointer items-center">
              <span className="inline-flex h-9 items-center rounded-md border border-input bg-background px-3 text-sm font-medium hover:bg-muted/50">
                Choose file
              </span>
              <input
                type="file"
                accept=".json,application/json"
                className="sr-only"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (!file) return;
                  const reader = new FileReader();
                  reader.onload = () => {
                    const text = typeof reader.result === 'string' ? reader.result : '';
                    setJsonText(text);
                    toast.success(`Loaded ${file.name}`);
                  };
                  reader.onerror = () => toast.error('Could not read file');
                  reader.readAsText(file, 'UTF-8');
                  e.target.value = '';
                }}
              />
            </label>
          </div>
          {sampleLoading ? (
            <p className="text-sm text-muted-foreground">Loading sample template…</p>
          ) : (
            <Textarea value={jsonText} onChange={(e) => setJsonText(e.target.value)} className="min-h-[320px] font-mono text-xs" spellCheck={false} />
          )}
          <Button
            disabled={disabled}
            onClick={async () => {
              setSubmitting(true);
              setLastResult(null);
              setLastRowSummaries(null);
              try {
                let parsed: unknown;
                try {
                  parsed = JSON.parse(jsonText) as unknown;
                } catch {
                  throw new Error('Invalid JSON');
                }
                const projects = normalizeBulkPayload(parsed);
                if (projects.length === 0) throw new Error('No projects in payload');
                if (projects.length > 100) throw new Error('Maximum 100 projects per request');
                const summaries: RowSummary[] = projects.map((p, index) => ({
                  index,
                  title: p.title ?? `(row ${index})`,
                  domain: p.domain ?? '—',
                  status: p.status ?? 'draft',
                }));
                const result = await api.adminBulkCreateProjects(projects);
                setLastResult(result);
                setLastRowSummaries(summaries);
                if (result.totalCreated === result.totalRequested) {
                  toast.success(`Created ${result.totalCreated} project(s)`);
                } else if (result.totalCreated > 0) {
                  toast.message(`Created ${result.totalCreated} of ${result.totalRequested}`);
                } else {
                  toast.error('No projects were created');
                }
              } catch (e) {
                toast.error(e instanceof Error ? e.message : 'Bulk upload failed');
              } finally {
                setSubmitting(false);
              }
            }}
          >
            {submitting ? 'Uploading…' : 'Upload projects'}
          </Button>
        </CardContent>
      </Card>

      {lastResult && lastRowSummaries ? (
        <Card className="mt-4">
          <CardHeader>
            <CardTitle className="text-base">Upload status</CardTitle>
            <CardDescription>
              {lastResult.totalCreated} of {lastResult.totalRequested} created.
              {lastResult.totalCreated > 0 ? (
                <Button variant="link" className="ml-1 h-auto p-0 align-baseline text-sm" onClick={() => router.push('/jobs')}>
                  Browse projects
                </Button>
              ) : null}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">#</TableHead>
                  <TableHead>Title</TableHead>
                  <TableHead>Requested status</TableHead>
                  <TableHead>Result</TableHead>
                  <TableHead>Details</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {lastRowSummaries.map((row) => {
                  const r = lastResult.results.find((x) => x.index === row.index);
                  const ok = r?.ok === true;
                  return (
                    <TableRow key={row.index}>
                      <TableCell className="font-mono text-xs text-muted-foreground">{row.index}</TableCell>
                      <TableCell className="max-w-[220px] truncate font-medium" title={row.title}>
                        {row.title}
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary">{row.status}</Badge>
                      </TableCell>
                      <TableCell>
                        {r == null ? (
                          '—'
                        ) : ok ? (
                          <Badge className="bg-emerald-600 hover:bg-emerald-600">Created</Badge>
                        ) : (
                          <Badge variant="destructive">Failed</Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-xs">
                        {r == null ? (
                          '—'
                        ) : ok ? (
                          <Link href={`/jobs/${r.project.id}`} className="font-medium text-primary underline">
                            Open listing
                          </Link>
                        ) : (
                          <span className="text-destructive">{r.message}</span>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>

            <details className="rounded-md border border-border bg-muted/40 p-3">
              <summary className="cursor-pointer text-xs font-medium">Raw API payload (debug)</summary>
              <pre className="mt-2 max-h-48 overflow-auto rounded-md border border-border bg-background p-2 font-mono text-[11px]">
                {JSON.stringify(
                  {
                    totalRequested: lastResult.totalRequested,
                    totalCreated: lastResult.totalCreated,
                    errors: lastResult.errors,
                    results: lastResult.results,
                  },
                  null,
                  2,
                )}
              </pre>
            </details>
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}

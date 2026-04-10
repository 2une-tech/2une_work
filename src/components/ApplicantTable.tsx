'use client';

import { useJobStore } from '@/lib/store';
import { Application } from '@/types';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { Badge } from './ui/badge';
import { useEffect, useState } from 'react';
import { api } from '@/lib/services/api';
import { Skeleton } from './ui/skeleton';

export default function ApplicantTable() {
  const [apps, setApps] = useState<Application[]>([]);
  const { jobs, fetchJobs } = useJobStore();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      if (jobs.length === 0) await fetchJobs();
      const applications = await api.getApplications();
      // Sort by AI score by default
      const sorted = applications.sort((a, b) => (b.aiScore || 0) - (a.aiScore || 0));
      setApps(sorted);
      setLoading(false);
    }
    loadData();
  }, [jobs, fetchJobs]);

  if (loading) {
    return <div className="space-y-4"><Skeleton className="h-10 w-full" /><Skeleton className="h-10 w-full" /><Skeleton className="h-10 w-full" /></div>;
  }

  if (apps.length === 0) {
    return (
      <div className="rounded-lg border border-border bg-card py-12 text-center text-sm text-muted-foreground">
        No applications found.
      </div>
    );
  }

  return (
    <div className="rounded-md border border-border">
      <Table>
        <TableHeader>
          <TableRow className="bg-muted/50">
            <TableHead>Candidate</TableHead>
            <TableHead>Job Role</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-right">AI Score</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {apps.map((app) => {
            const job = jobs.find(j => j.id === app.jobId);
            return (
              <TableRow key={app.id}>
                <TableCell className="font-medium">User {app.userId.split('-')[1]} {/* Masked name for simplicity, can fetch real user */}</TableCell>
                <TableCell>{job ? job.title : 'Unknown Job'}</TableCell>
                <TableCell>
                  <Badge
                    variant={
                      app.status === 'approved'
                        ? 'default'
                        : app.status === 'rejected'
                          ? 'destructive'
                          : 'secondary'
                    }
                  >
                    {app.status.replace(/_/g, ' ')}
                  </Badge>
                </TableCell>
                <TableCell className="text-right font-semibold">
                  {app.aiScore != null ? (
                    <span className={app.aiScore > 80 ? 'text-green-500' : 'text-yellow-500'}>{app.aiScore}%</span>
                  ) : (
                    <span className="text-muted-foreground font-normal text-sm">Pending</span>
                  )}
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}

'use client';

import type { Job } from '@/types';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export default function JobCard(props: { job: Job; className?: string }) {
  const { job, className } = props;

  return (
    <div className={cn('rounded-lg border border-border bg-card p-4', className)}>
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="truncate text-sm font-semibold text-foreground">{job.title}</h3>
            {job.contractLabel ? (
              <Badge variant="secondary" className="text-[11px]">
                {job.contractLabel}
              </Badge>
            ) : null}
          </div>
          <p className="mt-1 text-xs text-muted-foreground">{job.company}</p>
        </div>
        <div className="shrink-0 text-right">
          <div className="text-sm font-semibold text-foreground">{job.payHeadline}</div>
          <div className="text-xs text-muted-foreground">{job.payUnitLine}</div>
        </div>
      </div>

      <p className="mt-3 text-sm text-muted-foreground">{job.shortDescription}</p>

      {job.tags?.length ? (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {job.tags.slice(0, 8).map((t) => (
            <Badge key={t} variant="outline" className="text-[11px]">
              {t}
            </Badge>
          ))}
        </div>
      ) : null}

      <div className="mt-4 flex items-center justify-between gap-3">
        <div className="text-xs text-muted-foreground">{job.footerMetaText ?? job.category}</div>
        <Button size="sm" className="h-8">
          View
        </Button>
      </div>
    </div>
  );
}


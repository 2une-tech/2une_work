'use client';

import type { Job } from '@/types';
import { Badge } from '@/components/ui/badge';
import { JobShareButton } from '@/components/JobShareButton';
import { cn } from '@/lib/utils';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowUpRight, Sparkles } from 'lucide-react';

export default function JobCard(props: { job: Job; className?: string }) {
  const { job, className } = props;
  const router = useRouter();

  const detailsHref = `/project/${job.id}`;
  const applyHref = detailsHref;

  return (
    <div
      role="link"
      tabIndex={0}
      className={cn(
        'group rounded-lg border border-border bg-card p-4 transition-colors hover:bg-muted/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:border-primary focus-within:border-primary',
        className,
      )}
      onClick={() => router.push(detailsHref)}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          router.push(detailsHref);
        }
      }}
      aria-label={`View ${job.title}`}
    >
      <div className="flex items-start justify-between gap-3">
        <h3 className="min-w-0 flex-1 text-[15px] font-semibold leading-snug text-foreground line-clamp-2">
          {job.title}
        </h3>

        <div className="flex shrink-0 items-center gap-0.5">
          <JobShareButton
            jobId={job.id}
            jobTitle={job.title}
            variant="ghost"
            size="icon-xs"
            className="text-muted-foreground max-md:opacity-100 md:opacity-0 md:group-hover:opacity-100 md:group-focus-within:opacity-100 md:focus-visible:opacity-100"
          />
          <Link
            href={applyHref}
            onClick={(e) => e.stopPropagation()}
            className="inline-flex shrink-0 items-center gap-1 text-[13px] font-medium text-primary opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 focus:opacity-100 hover:underline"
          >
            Apply <ArrowUpRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      </div>

      <div className="mt-1 text-[13px] text-muted-foreground">
        <span className="font-medium text-foreground">{job.payHeadline}</span> {job.payUnitLine}
      </div>

      <div className="mt-3">
        <Badge variant="secondary" className="gap-1 rounded-full px-2.5 py-1 text-[11px] font-medium">
          <Sparkles className="h-3.5 w-3.5" />
          Large hiring
        </Badge>
      </div>
    </div>
  );
}


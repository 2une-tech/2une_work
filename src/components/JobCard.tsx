'use client';

import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import type { Job } from '@/types';
import { cn } from '@/lib/utils';

export default function JobCard({ job }: { job: Job }) {
  // Max 4 tags, omitting category if present
  const skillTags = job.tags.filter((t) => t !== job.category);
  const tagPills = (skillTags.length > 0 ? skillTags : job.tags).slice(0, 4);

  return (
    <Link
      href={`/jobs/${job.id}`}
      aria-label={`View project: ${job.title}`}
      className={cn(
        'group relative flex h-full min-h-[260px] flex-col overflow-hidden',
        'rounded-2xl border border-gray-200 bg-white p-6 text-sm text-gray-600',
        'transition-all duration-300 ease-out',
        'hover:-translate-y-1 hover:border-[#7B61FF]/40 hover:shadow-[0_8px_30px_rgb(123,97,255,0.08)]',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#7B61FF]'
      )}
    >
      <div className="flex flex-1 flex-col z-10 transition-transform duration-300 group-hover:-translate-y-2">
        <h2 className="line-clamp-2 md:text-lg text-base font-bold leading-snug text-gray-900 mb-4">
          {job.title}
        </h2>

        {/* Tags */}
        {tagPills.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-6">
            {tagPills.map((tag) => (
              <span
                key={tag}
                className="inline-flex items-center rounded-md bg-gray-50 px-2.5 py-1 text-xs font-medium text-gray-700 ring-1 ring-inset ring-gray-200"
              >
                {tag}
              </span>
            ))}
          </div>
        )}

        <div className="min-h-4 flex-1" aria-hidden />

        {/* Single line: e.g. $5 – $25 per hour */}
        <div className="mt-auto border-t border-gray-100 pt-4">
          <p className="text-xl font-bold leading-snug text-gray-900 md:text-2xl">{job.payRange}</p>
        </div>
      </div>

      {/* Slide-up Apply Area */}
      <div className="absolute bottom-0 left-0 right-0 p-6 pt-24 bg-gradient-to-t from-white via-white/90 to-transparent translate-y-[100%] opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-300 z-20 flex items-end">
        <button 
          className="flex w-full items-center justify-center gap-2 rounded-full bg-[#7B61FF] hover:bg-[#8e78ff] hover:shadow-[0_0_15px_rgba(123,97,255,0.4)] text-white py-3.5 px-4 font-semibold transition-all active:scale-[0.98]"
        >
          Apply Now
          <ArrowRight className="h-4 w-4" />
        </button>
      </div>
    </Link>
  );
}

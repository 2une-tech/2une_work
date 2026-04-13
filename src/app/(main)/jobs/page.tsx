'use client';

import { useEffect, useMemo, useState } from 'react';
import { Briefcase, Search, SlidersHorizontal, ChevronDown } from 'lucide-react';
import JobCard from '@/components/JobCard';
import { useJobStore } from '@/lib/store';
import { useRequireAuth } from '@/lib/useRequireAuth';
import { EmptyState } from '@/components/EmptyState';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import type { Job } from '@/types';

function jobMatchesSearch(job: Job, raw: string): boolean {
  const q = raw.trim().toLowerCase();
  if (!q) return true;
  const blob = [
    job.title,
    job.category,
    job.shortDescription,
    job.description,
    ...job.tags,
    ...job.skillsRequired,
  ]
    .join(' ')
    .toLowerCase();
  return blob.includes(q);
}

export default function JobsListPage() {
  const { isAllowed } = useRequireAuth();
  const { jobs, isLoading, fetchJobs, searchQuery, setSearchQuery } = useJobStore();
  const [filterHourly, setFilterHourly] = useState(false);
  const [filterPerTask, setFilterPerTask] = useState(false);

  const payTypeForApi: 'per_hour' | 'per_task' | undefined =
    filterHourly && !filterPerTask ? 'per_hour' : filterPerTask && !filterHourly ? 'per_task' : undefined;

  useEffect(() => {
    if (!isAllowed) return;
    void fetchJobs(payTypeForApi ? { payType: payTypeForApi } : undefined);
  }, [fetchJobs, isAllowed, payTypeForApi]);

  const visibleJobs = useMemo(
    () => jobs.filter((job) => jobMatchesSearch(job, searchQuery)),
    [jobs, searchQuery],
  );

  const resetFilters = () => {
    setFilterHourly(false);
    setFilterPerTask(false);
    setSearchQuery('');
  };

  if (!isAllowed) return null;

  return (
    <div className="min-h-screen bg-[#F9FAFB] text-gray-900 selection:bg-[#7B61FF]/20">
      {/* Header Section */}
      <div className="relative overflow-hidden border-b border-gray-200 bg-white pt-20 pb-16">
        <div className="absolute inset-0 bg-gradient-to-b from-[#7B61FF]/5 to-transparent pointer-events-none" />

        <div className="relative mx-auto max-w-6xl px-6 md:px-8 text-center">
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-gray-900 mb-4">
            Explore Opportunities
          </h1>
          <p className="text-lg text-gray-600 mb-10 max-w-2xl mx-auto">
            Work on real-world AI training projects. Find elite roles or accessible tasks in our hybrid marketplace.
          </p>

          <div className="max-w-2xl mx-auto relative group">
            <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-gray-400 group-focus-within:text-[#7B61FF] transition-colors" />
            </div>
            <Input
              type="text"
              placeholder="Search by role, skill, or keyword..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-white border-gray-200 shadow-sm h-14 pl-12 pr-4 rounded-xl text-gray-900 placeholder:text-gray-400 focus-visible:ring-[#7B61FF] focus-visible:border-[#7B61FF] text-lg transition-all"
            />
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-6 py-12 md:px-8">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Left Panel: Filters */}
          <div className="w-full lg:w-64 shrink-0 space-y-8">
            <div className="flex items-center justify-between lg:hidden mb-4">
              <h2 className="text-lg font-semibold text-gray-900">Filters</h2>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="bg-white border-gray-200 text-gray-700"
                onClick={resetFilters}
              >
                <SlidersHorizontal className="h-4 w-4 mr-2" />
                Show all
              </Button>
            </div>

            <div className="hidden lg:block sticky top-24 space-y-8">
              {/* Filter Group: Domain */}
              <div className="space-y-4">
                <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider">Domain</h3>
                <div className="space-y-2">
                  {['AI Engineering', 'Software Dev', 'Language', 'Legal'].map((item) => (
                    <label key={item} className="flex items-center gap-3 cursor-pointer group">
                      <div className="w-4 h-4 rounded border border-gray-300 bg-white flex items-center justify-center group-hover:border-[#7B61FF] transition-colors" />
                      <span className="text-sm text-gray-600 group-hover:text-gray-900">{item}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Filter Group: Pay basis (server-side) */}
              <div className="space-y-4">
                <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider">Pay basis</h3>
                <p className="text-xs text-gray-500">
                  Choose hourly or per-task to filter the list. Select both or neither to show all pay types.
                </p>
                <div className="space-y-2">
                  <label className="flex items-center gap-3 cursor-pointer group">
                    <input
                      type="checkbox"
                      checked={filterHourly}
                      onChange={(e) => setFilterHourly(e.target.checked)}
                      className="h-4 w-4 rounded border-gray-300 text-[#7B61FF] focus:ring-[#7B61FF]"
                    />
                    <span className="text-sm text-gray-600 group-hover:text-gray-900">Hourly</span>
                  </label>
                  <label className="flex items-center gap-3 cursor-pointer group">
                    <input
                      type="checkbox"
                      checked={filterPerTask}
                      onChange={(e) => setFilterPerTask(e.target.checked)}
                      className="h-4 w-4 rounded border-gray-300 text-[#7B61FF] focus:ring-[#7B61FF]"
                    />
                    <span className="text-sm text-gray-600 group-hover:text-gray-900">Per task</span>
                  </label>
                </div>
              </div>

              {/* Filter Group: Experience */}
              <div className="space-y-4">
                <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider">Experience Level</h3>
                <div className="space-y-2">
                  {['Entry Level', 'Intermediate', 'Expert'].map((item) => (
                    <label key={item} className="flex items-center gap-3 cursor-pointer group">
                      <div className="w-4 h-4 rounded border border-gray-300 bg-white flex items-center justify-center group-hover:border-[#7B61FF] transition-colors" />
                      <span className="text-sm text-gray-600 group-hover:text-gray-900">{item}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Right Section: Job Grid */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between mb-8">
              <p className="text-sm text-gray-500">
                Showing{' '}
                <span className="text-gray-900 font-bold">{visibleJobs.length}</span>
                {searchQuery.trim() && jobs.length !== visibleJobs.length ? (
                  <span className="text-gray-400"> of {jobs.length}</span>
                ) : null}{' '}
                opportunities
              </p>

              <div className="flex items-center gap-3">
                <span className="text-sm text-gray-500 hidden sm:inline">Sort by:</span>
                <button
                  type="button"
                  className="flex items-center gap-2 bg-white border border-gray-200 rounded-lg px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors shadow-sm"
                >
                  Relevance
                  <ChevronDown className="h-4 w-4" />
                </button>
              </div>
            </div>

            {isLoading && jobs.length === 0 ? (
              <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
                {[1, 2, 3, 4, 5, 6].map((i) => (
                  <div
                    key={i}
                    className="rounded-2xl border border-gray-200 bg-white p-6 h-[300px] animate-pulse flex flex-col shadow-sm"
                  >
                    <div className="h-4 w-24 bg-gray-200 rounded mb-4" />
                    <div className="h-6 w-3/4 bg-gray-200 rounded mb-6" />
                    <div className="flex gap-2 mb-8">
                      <div className="h-6 w-16 bg-gray-200 rounded" />
                      <div className="h-6 w-16 bg-gray-200 rounded" />
                    </div>
                    <div className="mt-auto h-8 w-1/3 bg-gray-200 rounded mb-2" />
                    <div className="h-8 w-full bg-[#7B61FF]/10 rounded-lg" />
                  </div>
                ))}
              </div>
            ) : jobs.length === 0 ? (
              <div className="rounded-2xl border border-gray-200 bg-white p-12 shadow-sm">
                <EmptyState
                  icon={<Briefcase className="h-6 w-6 text-gray-400" />}
                  title="No opportunities found"
                  description="Try adjusting your filters or search query to find more matching roles."
                  className="py-12"
                />
              </div>
            ) : visibleJobs.length === 0 ? (
              <div className="rounded-2xl border border-gray-200 bg-white p-12 shadow-sm">
                <EmptyState
                  icon={<Briefcase className="h-6 w-6 text-gray-400" />}
                  title="No matches for your search"
                  description="Try different keywords or clear the search box to see all loaded projects."
                  className="py-12"
                />
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
                {visibleJobs.map((job) => (
                  <JobCard key={job.id} job={job} />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

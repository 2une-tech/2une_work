'use client';

import { Job } from '@/types';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from './ui/card';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import Link from 'next/link';

export default function JobCard({ job }: { job: Job }) {
  return (
    <Card className="flex h-full flex-col transition-colors hover:border-foreground/15">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="mb-1 text-base">{job.title}</CardTitle>
            <p className="text-sm text-muted-foreground">{job.company}</p>
          </div>
        </div>
      </CardHeader>
      <CardContent className="flex-1">
        <div className="mb-3 flex flex-wrap gap-1.5">
          <Badge variant="secondary" className="font-normal">
            {job.payRange}
          </Badge>
          <Badge variant="outline" className="font-normal">
            {job.experienceLevel}
          </Badge>
          {job.tags.slice(0, 2).map((tag) => (
            <Badge key={tag} variant="secondary" className="bg-muted font-normal">
              {tag}
            </Badge>
          ))}
        </div>
        <p className="line-clamp-2 text-sm text-muted-foreground">{job.shortDescription}</p>
      </CardContent>
      <CardFooter className="border-t border-border bg-transparent pt-4">
        <Link href={`/jobs/${job.id}`} className="w-full">
          <Button className="w-full" variant="default" size="sm">
            View details
          </Button>
        </Link>
      </CardFooter>
    </Card>
  );
}

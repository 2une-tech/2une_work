import { Smartphone } from 'lucide-react';

import { mobileAppLinks } from '@/lib/site';
import { cn } from '@/lib/utils';

export function MobileAppBanner({ className }: { className?: string }) {
  return (
    <div
      role="region"
      aria-label="Download the 2une mobile app"
      className={cn(
        'sticky top-14 z-40 w-full self-start border-b border-border bg-background/95 px-4 py-2.5 text-foreground shadow-sm backdrop-blur-md supports-backdrop-filter:bg-background/80 md:top-0 md:px-6',
        className,
      )}
    >
      <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-center gap-x-3 gap-y-2 text-center sm:text-left md:justify-between">
        <p className="flex min-w-0 flex-1 items-center justify-center gap-2 text-[13px] leading-snug text-muted-foreground sm:justify-start md:text-sm">
          <Smartphone className="h-4 w-4 shrink-0 text-foreground" aria-hidden />
          <span>
            <span className="font-medium text-foreground">Get the 2une app</span>
            {' — '}
            discover jobs, screen, and submit tasks from your phone.
          </span>
        </p>
        <div className="flex shrink-0 flex-wrap items-center justify-center gap-2">
          <a
            href={mobileAppLinks.googlePlay}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex rounded-md border border-border bg-background px-3 py-1.5 text-xs font-semibold text-foreground shadow-sm transition-colors hover:bg-muted/80"
          >
            Google Play
          </a>
          <a
            href={mobileAppLinks.appStore}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex rounded-md border border-border bg-background px-3 py-1.5 text-xs font-semibold text-foreground shadow-sm transition-colors hover:bg-muted/80"
          >
            App Store
          </a>
        </div>
      </div>
    </div>
  );
}

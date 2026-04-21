'use client';

import type { ComponentProps, ReactNode } from 'react';
import { Share2 } from 'lucide-react';
import { toast } from 'sonner';

import { jobShareUrl } from '@/lib/site';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export type JobShareButtonProps = Omit<ComponentProps<typeof Button>, 'onClick' | 'children'> & {
  jobId: string;
  jobTitle: string;
  /** When true, shows the word “Share” next to the icon (default on non-icon sizes). */
  showLabel?: boolean;
  children?: ReactNode;
};

async function shareJob(jobId: string, jobTitle: string) {
  const url = jobShareUrl(jobId);
  const title = `${jobTitle} · 2une`;
  const text = `Check out this project on 2une: ${jobTitle}`;

  if (typeof navigator !== 'undefined' && typeof navigator.share === 'function') {
    try {
      await navigator.share({ title, text, url });
      return;
    } catch (err: unknown) {
      const name = err instanceof Error ? err.name : (err as { name?: string })?.name;
      if (name === 'AbortError') return;
    }
  }

  try {
    if (typeof navigator === 'undefined' || !navigator.clipboard?.writeText) {
      throw new Error('no clipboard');
    }
    await navigator.clipboard.writeText(url);
    toast.success('Link copied. It opens in the 2une app when the app is installed.');
  } catch {
    toast.error('Could not share or copy. Try copying the address from your browser.');
  }
}

export function JobShareButton({
  jobId,
  jobTitle,
  showLabel,
  className,
  size,
  children,
  ...buttonProps
}: JobShareButtonProps) {
  const isIconOnly =
    size === 'icon' || size === 'icon-xs' || size === 'icon-sm' || size === 'icon-lg';
  const labelVisible = showLabel ?? (!isIconOnly && size !== 'xs');

  return (
    <Button
      type="button"
      {...buttonProps}
      size={size}
      className={cn(className)}
      aria-label={labelVisible ? undefined : `Share: ${jobTitle}`}
      onClick={async (e) => {
        e.stopPropagation();
        await shareJob(jobId, jobTitle);
      }}
    >
      {children ?? (
        <>
          <Share2 className={cn(isIconOnly ? 'size-4' : 'size-3.5')} aria-hidden />
          {labelVisible ? <span>Share</span> : null}
        </>
      )}
    </Button>
  );
}

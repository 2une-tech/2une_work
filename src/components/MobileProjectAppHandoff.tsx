'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button, buttonVariants } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { isAndroidHandoffClient, isMobileAppHandoffClient } from '@/lib/isMobileAppHandoffClient';
import { mobileAppLinks, workSiteUrl } from '@/lib/site';

const ANDROID_PACKAGE = 'com.tune.work';

function sessionSkipKey(jobId: string): string {
  return `2une:projectHandoff:skip:${jobId}`;
}

function readSkipped(jobId: string): boolean {
  try {
    return typeof sessionStorage !== 'undefined' && sessionStorage.getItem(sessionSkipKey(jobId)) === '1';
  } catch {
    return false;
  }
}

function writeSkipped(jobId: string): void {
  try {
    sessionStorage.setItem(sessionSkipKey(jobId), '1');
  } catch {
    /* ignore quota / private mode */
  }
}

function projectHttpsUrl(jobId: string): string {
  const base = workSiteUrl.replace(/\/$/, '');
  return `${base}/project/${encodeURIComponent(jobId)}`;
}

/** Chrome Android intent: open app via verified link, else Play Store. */
function buildAndroidProjectIntentUrl(projectHttpsUrl: string, playStoreUrl: string): string {
  const u = new URL(projectHttpsUrl);
  const hostPathQuery = `${u.host}${u.pathname}${u.search}`;
  const fallback = encodeURIComponent(playStoreUrl);
  return `intent://${hostPathQuery}#Intent;scheme=https;package=${ANDROID_PACKAGE};S.browser_fallback_url=${fallback};end`;
}

/** Matches Flutter `deep_link_uri` for custom scheme (authority omitted so `path` is `/project/...`). */
function tuneProjectUrl(jobId: string): string {
  return `tune:///project/${encodeURIComponent(jobId)}`;
}

export type MobileProjectAppHandoffProps = {
  jobId: string;
  jobTitle?: string;
};

export function MobileProjectAppHandoff({ jobId, jobTitle }: MobileProjectAppHandoffProps) {
  const [open, setOpen] = useState(false);
  const dismissedRef = useRef(false);

  useEffect(() => {
    dismissedRef.current = false;
  }, [jobId]);

  const dismiss = useCallback(() => {
    writeSkipped(jobId);
    dismissedRef.current = true;
    setOpen(false);
  }, [jobId]);

  const openInApp = useCallback(() => {
    window.location.href = tuneProjectUrl(jobId);
  }, [jobId]);

  useEffect(() => {
    if (typeof window === 'undefined' || typeof document === 'undefined') return;
    if (!isMobileAppHandoffClient()) return;
    if (readSkipped(jobId)) return;

    if (isAndroidHandoffClient()) {
      if (document.visibilityState !== 'visible') return;
      window.location.assign(
        buildAndroidProjectIntentUrl(projectHttpsUrl(jobId), mobileAppLinks.googlePlay),
      );
      const timer = window.setTimeout(() => {
        if (dismissedRef.current) return;
        if (document.visibilityState === 'visible') {
          setOpen(true);
        }
      }, 900);
      return () => window.clearTimeout(timer);
    }

    const showModal = window.setTimeout(() => {
      setOpen(true);
    }, 0);
    return () => window.clearTimeout(showModal);
  }, [jobId]);

  return (
    <Dialog
      open={open}
      onOpenChange={(next, eventDetails) => {
        if (next) {
          setOpen(true);
          return;
        }
        if (eventDetails?.reason === 'outside-press' || eventDetails?.reason === 'escape-key') {
          dismiss();
          return;
        }
        setOpen(false);
      }}
      modal
    >
      <DialogContent showCloseButton={false} className="max-w-[calc(100%-2rem)] sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Open in the 2une app</DialogTitle>
          <DialogDescription>
            {jobTitle ? (
              <>
                <span className="font-medium text-foreground">{jobTitle}</span>
                {' — '}
              </>
            ) : null}
            Apply and track projects in the app. You can keep browsing here if you prefer.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="flex-col gap-2 sm:flex-col">
          <Button type="button" className="w-full" onClick={openInApp}>
            Open in app
          </Button>
          <div className="flex w-full flex-wrap gap-2">
            <a
              href={mobileAppLinks.googlePlay}
              target="_blank"
              rel="noopener noreferrer"
              className={cn(buttonVariants({ variant: 'outline' }), 'min-w-0 flex-1 text-center')}
            >
              Google Play
            </a>
            <a
              href={mobileAppLinks.appStore}
              target="_blank"
              rel="noopener noreferrer"
              className={cn(buttonVariants({ variant: 'outline' }), 'min-w-0 flex-1 text-center')}
            >
              App Store
            </a>
          </div>
          <Button variant="ghost" type="button" className="w-full text-muted-foreground" onClick={dismiss}>
            Continue on web
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

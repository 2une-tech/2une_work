import { MessageCircle } from 'lucide-react';

import { whatsappCommunityUrl } from '@/lib/site';
import { cn } from '@/lib/utils';

export function ExploreWhatsAppBanner({ className }: { className?: string }) {
  return (
    <div
      role="region"
      aria-label="Join the 2une WhatsApp community for updates"
      className={cn(
        'rounded-lg border border-emerald-200/80 bg-emerald-50/90 px-4 py-3 text-emerald-950 dark:border-emerald-900/60 dark:bg-emerald-950/40 dark:text-emerald-50',
        className,
      )}
    >
      <div className="flex flex-wrap items-start gap-3 sm:items-center">
        <MessageCircle
          className="mt-0.5 h-5 w-5 shrink-0 text-emerald-700 dark:text-emerald-300"
          aria-hidden
        />
        <p className="min-w-0 flex-1 text-[13px] leading-snug sm:text-sm">
          <span className="font-semibold text-emerald-950 dark:text-emerald-50">
            Faster updates on WhatsApp
          </span>
          {' — '}
          Join the <span className="font-medium">2UNE Audio Projects Hub</span> community for announcements,
          new drops, and quick questions.
        </p>
        <a
          href={whatsappCommunityUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex shrink-0 items-center justify-center rounded-md bg-[#25D366] px-3 py-1.5 text-xs font-semibold text-white shadow-sm transition-opacity hover:opacity-95"
        >
          Join on WhatsApp
        </a>
      </div>
    </div>
  );
}

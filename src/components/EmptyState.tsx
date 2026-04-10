import type { ReactNode } from 'react';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

type Action =
  | { label: string; href: string; variant?: 'default' | 'secondary' | 'outline' | 'ghost' | 'link' }
  | { label: string; onClick: () => void; variant?: 'default' | 'secondary' | 'outline' | 'ghost' | 'link' };

export function EmptyState(props: {
  title: string;
  description?: string;
  icon?: ReactNode;
  actions?: Action[];
  className?: string;
}) {
  const { title, description, icon, actions, className } = props;
  return (
    <div className={cn('flex flex-col items-center justify-center px-4 py-14 text-center', className)}>
      {icon ? (
        <div className="mb-4 inline-flex h-11 w-11 items-center justify-center rounded-md border border-border bg-muted/60 text-muted-foreground">
          <div className="h-5 w-5">{icon}</div>
        </div>
      ) : null}
      <h3 className="text-sm font-semibold text-foreground">{title}</h3>
      {description ? (
        <p className="mt-2 max-w-md text-sm text-muted-foreground">{description}</p>
      ) : null}
      {actions && actions.length ? (
        <div className="mt-6 flex flex-wrap items-center justify-center gap-2">
          {actions.map((a, idx) =>
            'href' in a ? (
              <Link key={`${a.label}-${idx}`} href={a.href}>
                <Button variant={a.variant ?? 'default'}>{a.label}</Button>
              </Link>
            ) : (
              <Button key={`${a.label}-${idx}`} variant={a.variant ?? 'default'} onClick={a.onClick}>
                {a.label}
              </Button>
            ),
          )}
        </div>
      ) : null}
    </div>
  );
}


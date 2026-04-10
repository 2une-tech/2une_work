import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

export function ProfileSection(props: {
  title: string;
  description?: string;
  children: ReactNode;
  className?: string;
}) {
  const { title, description, children, className } = props;
  return (
    <section className={cn('border-b border-border pb-8 last:border-b-0 last:pb-0', className)}>
      <div className="mb-4">
        <h3 className="text-sm font-semibold text-foreground">{title}</h3>
        {description ? (
          <p className="mt-1 text-sm text-muted-foreground">{description}</p>
        ) : null}
      </div>
      {children}
    </section>
  );
}

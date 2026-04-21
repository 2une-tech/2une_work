import { contractPaymentTermBullets } from '@/lib/contractPaymentTerms';
import { cn } from '@/lib/utils';

export function ContractPaymentTermsSection({
  className,
  id = 'contract-payment-terms-heading',
}: {
  className?: string;
  /** Override heading id when multiple instances exist on one page. */
  id?: string;
}) {
  return (
    <section
      className={cn('rounded-xl border border-border bg-card p-5', className)}
      aria-labelledby={id}
    >
      <h2 id={id} className="text-sm font-semibold text-foreground">
        Contract and payment terms
      </h2>
      <ul className="mt-3 list-disc space-y-2 pl-5 text-sm leading-relaxed text-muted-foreground">
        {contractPaymentTermBullets.map((text) => (
          <li key={text}>{text}</li>
        ))}
      </ul>
    </section>
  );
}

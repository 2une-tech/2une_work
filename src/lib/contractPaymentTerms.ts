/**
 * Standard worker-facing contract & payment summary for 2une (work portal).
 * For full legal terms, link to counsel-approved documents when available.
 */
export const contractPaymentTermBullets: readonly string[] = [
  'You will be engaged as an independent contractor with 2une, not as an employee.',
  'This is a fully remote role that you can complete on your own schedule, within each project’s deadlines and quality expectations.',
  'Projects may be extended, shortened, or concluded early depending on client needs, volume, and your performance.',
  'Your work with 2une should not involve access to confidential or proprietary information from any other employer, client, or institution. If a task ever asks for that kind of access, stop and contact support.',
  'Payments are typically made weekly (where the project supports it) via Stripe or Wise, based on services rendered and approved submissions, subject to each project’s payout rules.',
] as const;

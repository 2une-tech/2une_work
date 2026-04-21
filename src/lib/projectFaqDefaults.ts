/**
 * Required FAQ block shown on every project (merged before listing-specific `## FAQ` content).
 * Keep in sync with `tune_app/lib/core/constants/required_project_faq.dart`.
 */
export const requiredProjectFaqMarkdown = `
### Who can apply to 2une projects?
Adults who can legally enter into a contract, honestly complete their profile, and meet the skills and language requirements shown on each listing. Some projects add a short screening or interview step.

### How do payments work?
Payout timing and method depend on the project. Many roles pay on a **weekly** cadence (where the project supports it) via **Stripe** or **Wise** after your work is reviewed and approved. Read **Contract and payment terms** on this page for the standard summary.

### Am I an employee of 2une?
No. You are engaged as an **independent contractor**, not an employee. See **Worker terms** in the app or on work.2une.in for a short summary.

### What is the schedule and where do I work?
Roles are **fully remote**. You choose when you work within each project’s deadlines, task SLAs, and quality expectations.

### What happens after I apply?
Applications are reviewed in order. Status updates appear on your **dashboard**. Some listings include a screening task or interview before you can start paid work.

### Can I work on more than one project at a time?
Usually yes, as long as you can meet deadlines and any **exclusivity or conflict** rules stated on a specific listing.
`.trim();

/** Combine platform-required FAQs with optional project-authored FAQ markdown. */
export function mergeRequiredProjectFaqMarkdown(projectSpecificFaq: string): string {
  const extra = projectSpecificFaq.trim();
  if (!extra) return requiredProjectFaqMarkdown;
  return `${requiredProjectFaqMarkdown}\n\n---\n\n${extra}`;
}

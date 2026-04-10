import type { MockWorkerProfile } from '@/types/profile';
import { validateProfileTab } from '@/lib/profileValidation';

/** Idle delay before attempting autosave (Mercor-style). */
export const RESUME_AUTOSAVE_DEBOUNCE_MS = 2200;

export function serializeResumeForAutosave(p: MockWorkerProfile): string {
  return JSON.stringify(p.resume);
}

/**
 * Autosave blockers: name/email, languages, and links only.
 * Draft education/experience rows do not block saving publications, skills, demographics, etc.
 * (Manual Save still runs the same persist rules; incomplete rows are simply skipped server-side.)
 */
export function getResumeAutoSaveBlockers(p: MockWorkerProfile): string | null {
  const tabErr = validateProfileTab('Resume', p);
  if (tabErr) return tabErr;

  for (const row of p.resume.languageEntries) {
    const hasLang = row.language.trim().length > 0;
    const hasLevel = Boolean(row.speakLevel) || Boolean(row.writeLevel);
    if (hasLevel && !hasLang) {
      return 'Languages: enter the language name, or clear speak/write levels.';
    }
  }

  for (const link of p.resume.links) {
    if (link.url.trim() && !link.label.trim()) {
      return 'Links: add a label for each URL you entered.';
    }
  }

  return null;
}

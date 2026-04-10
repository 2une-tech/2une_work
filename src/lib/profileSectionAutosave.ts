import { validateProfileTab } from '@/lib/profileValidation';
import { getResumeAutoSaveBlockers, serializeResumeForAutosave } from '@/lib/profileResumeAutosave';
import type { MockWorkerProfile, ProfileUiSection } from '@/types/profile';

/** Debounce for all profile sections (same as resume). */
export const PROFILE_SECTION_AUTOSAVE_DEBOUNCE_MS = 2200;

export function serializeProfileSection(section: ProfileUiSection, p: MockWorkerProfile): string {
  switch (section) {
    case 'about':
      return serializeResumeForAutosave(p);
    case 'location':
      return JSON.stringify(p.workAuthorization);
    case 'schedule':
      return JSON.stringify({ availability: p.availability, workPreferences: p.workPreferences });
    case 'account':
      return JSON.stringify({ communications: p.communications, account: p.account });
    default:
      return '';
  }
}

/**
 * Same validation rules as manual Save: required fields per tab, plus resume-specific
 * field rules (education/experience/languages/links) when saving About.
 */
export function getProfileSectionAutoSaveBlockers(section: ProfileUiSection, p: MockWorkerProfile): string | null {
  switch (section) {
    case 'about':
      return getResumeAutoSaveBlockers(p);
    case 'location':
      return validateProfileTab('Location & Work authorization', p);
    case 'schedule': {
      const av = validateProfileTab('Availability', p);
      if (av) return av;
      const wp = p.workPreferences;
      const y = parseInt(wp.minExpectedFullTimeYearly, 10);
      const h = parseInt(wp.minExpectedPartTimeHourly, 10);
      if (wp.minExpectedFullTimeYearly.trim() && (Number.isNaN(y) || y < 0)) {
        return 'Work preferences: full-time minimum must be a valid number.';
      }
      if (wp.minExpectedPartTimeHourly.trim() && (Number.isNaN(h) || h < 0)) {
        return 'Work preferences: part-time hourly minimum must be a valid number.';
      }
      return null;
    }
    case 'account':
      return null;
    default:
      return null;
  }
}

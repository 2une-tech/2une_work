const STORAGE_KEY = '2une_saved_project_ids';

/** Fired after saved IDs change (same-tab updates for dashboard Saved tab). */
export const SAVED_JOBS_CHANGED_EVENT = '2une-saved-jobs-changed';

function parseIds(raw: string | null): string[] {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw) as unknown;
    return Array.isArray(parsed) ? parsed.filter((x): x is string => typeof x === 'string') : [];
  } catch {
    return [];
  }
}

export function getSavedProjectIds(): string[] {
  if (typeof window === 'undefined') return [];
  return parseIds(localStorage.getItem(STORAGE_KEY));
}

export function isProjectSaved(projectId: string): boolean {
  return getSavedProjectIds().includes(projectId);
}

/** Returns true if the project is saved after toggle. */
export function toggleSavedProject(projectId: string): boolean {
  if (typeof window === 'undefined') return false;
  const set = new Set(getSavedProjectIds());
  if (set.has(projectId)) {
    set.delete(projectId);
  } else {
    set.add(projectId);
  }
  localStorage.setItem(STORAGE_KEY, JSON.stringify([...set]));
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent(SAVED_JOBS_CHANGED_EVENT));
  }
  return set.has(projectId);
}

const STORAGE_KEY = '2une_saved_project_ids';

export const SAVED_JOBS_CHANGED_EVENT = '2une-saved-jobs-changed';

export function getSavedProjectIds(): string[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    const parsed = raw ? (JSON.parse(raw) as unknown) : [];
    return Array.isArray(parsed) ? parsed.filter((x): x is string => typeof x === 'string') : [];
  } catch {
    return [];
  }
}

export function setSavedProjectIds(ids: string[]): void {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(ids));
  window.dispatchEvent(new Event(SAVED_JOBS_CHANGED_EVENT));
}

export function toggleSavedProjectId(id: string): void {
  const ids = new Set(getSavedProjectIds());
  if (ids.has(id)) ids.delete(id);
  else ids.add(id);
  setSavedProjectIds([...ids]);
}


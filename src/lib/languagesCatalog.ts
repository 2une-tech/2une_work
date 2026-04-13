import raw from '../../languages.json';

export type CatalogLanguage = {
  code: string;
  language: string;
  region: string;
  native: string;
};

const rows = (raw as { languages: CatalogLanguage[] }).languages;

/** String stored on the user profile; backend max length 60. */
export function profileLanguageLabel(row: CatalogLanguage): string {
  const base = `${row.language} (${row.region})`;
  if (base.length <= 60) return base;
  return row.code.length <= 60 ? row.code : row.code.slice(0, 60);
}

export const LANGUAGE_CATALOG: CatalogLanguage[] = [...rows].sort((a, b) =>
  profileLanguageLabel(a).localeCompare(profileLanguageLabel(b), undefined, { sensitivity: 'base' }),
);

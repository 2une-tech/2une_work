export const DOMAIN_OPTIONS = [
  { label: 'Software engineering', icon: '</>' },
  { label: 'Other engineering', icon: '⚙️' },
  { label: 'Medicine', icon: '♡' },
  { label: 'Law', icon: '⚖' },
  { label: 'Data analysis', icon: '📊' },
  { label: 'Finance', icon: '$' },
  { label: 'Business operations', icon: '💼' },
  { label: 'Life, Physical, and Social Science', icon: '🔬' },
  { label: 'Arts & Design', icon: '🎨' },
  { label: 'Language and Audio', icon: 'A' },
  { label: 'Humanities', icon: '📚' },
  { label: 'Miscellaneous', icon: '✨' },
] as const;

export const YEAR_OPTIONS = Array.from({ length: 2035 - 1980 + 1 }, (_, i) => String(1980 + i));

export const AVAILABILITY_START_OPTIONS = [
  { value: 'immediate', label: 'Immediately' },
  { value: 'two_weeks', label: 'Within two weeks' },
  { value: 'one_month', label: 'Within one month' },
  { value: 'more_than_one_month', label: 'More than one month' },
] as const;

const FALLBACK_TIMEZONES = [
  'UTC',
  'America/New_York',
  'America/Chicago',
  'America/Denver',
  'America/Los_Angeles',
  'Europe/London',
  'Europe/Paris',
  'Asia/Dubai',
  'Asia/Kolkata',
  'Asia/Singapore',
  'Asia/Tokyo',
  'Australia/Sydney',
];

export function getTimeZoneOptions(): string[] {
  try {
    if (typeof Intl !== 'undefined' && 'supportedValuesOf' in Intl) {
      return Intl.supportedValuesOf('timeZone');
    }
  } catch {
    /* ignore */
  }
  return FALLBACK_TIMEZONES;
}

export const DAY_LETTERS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'] as const;

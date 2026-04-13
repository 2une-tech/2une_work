import type { User } from '@/types';
import type {
  DemographicsOption,
  LanguageProficiencyLevel,
  MockAvailability,
  MockAvailabilityException,
  MockWorkerProfile,
  MockWorkingDay,
} from '@/types/profile';
import { createDefaultWorkerProfile, newId } from '@/types/profile';

const DEMO_VALUES = new Set<string>(['man', 'woman', 'non_binary', 'prefer_not', '']);

function resumeExtrasFromProfileRow(raw: unknown): Partial<MockWorkerProfile['resume']> {
  if (raw == null || typeof raw !== 'object' || Array.isArray(raw)) return {};
  const o = raw as Record<string, unknown>;
  const patch: Partial<MockWorkerProfile['resume']> = {};
  if (Array.isArray(o.publications)) {
    patch.publications = o.publications
      .filter((x): x is { id?: unknown; text?: unknown } => x != null && typeof x === 'object' && !Array.isArray(x))
      .map((x) => ({
        id: typeof x.id === 'string' && x.id.trim() ? x.id : newId(),
        text: typeof x.text === 'string' ? x.text : '',
      }));
  }
  if (Array.isArray(o.certifications)) {
    patch.certifications = o.certifications
      .filter((x): x is { id?: unknown; text?: unknown } => x != null && typeof x === 'object' && !Array.isArray(x))
      .map((x) => ({
        id: typeof x.id === 'string' && x.id.trim() ? x.id : newId(),
        text: typeof x.text === 'string' ? x.text : '',
      }));
  }
  if (Array.isArray(o.awards)) {
    patch.awards = o.awards.map((a) => (typeof a === 'string' ? a : '')).filter((s) => s.length > 0);
  }
  if (typeof o.demographics === 'string' && DEMO_VALUES.has(o.demographics)) {
    patch.demographics = o.demographics as DemographicsOption | '';
  }
  return patch;
}

/** UI uses `immediate`; API expects `immediately`. */
export function availabilityStartToApi(value: string): 'immediately' | 'two_weeks' | 'one_month' | 'more_than_one_month' | undefined {
  if (!value) return undefined;
  if (value === 'immediate') return 'immediately';
  if (value === 'two_weeks' || value === 'one_month' || value === 'more_than_one_month') return value;
  return undefined;
}

export function availabilityStartFromApi(value: string | null | undefined): MockAvailability['availabilityToStart'] {
  if (value === 'immediately') return 'immediate';
  if (value === 'two_weeks' || value === 'one_month' || value === 'more_than_one_month') return value;
  return '';
}

export function parseTimeToMinutes(raw: string): number | null {
  const s = raw.trim().toLowerCase().replace(/\s+/g, '');
  if (!s) return null;
  const m = s.match(/^(\d{1,2})(?::(\d{2}))?(am|pm)$/);
  if (!m) return null;
  let h = parseInt(m[1], 10);
  const min = m[2] ? parseInt(m[2], 10) : 0;
  const ap = m[3];
  if (ap === 'pm' && h < 12) h += 12;
  if (ap === 'am' && h === 12) h = 0;
  if (h < 0 || h > 23 || min < 0 || min > 59) return null;
  return h * 60 + min;
}

export function formatMinutesToTime(total: number): string {
  const h24 = Math.floor(total / 60);
  const m = total % 60;
  const ap = h24 >= 12 ? 'pm' : 'am';
  let h = h24 % 12;
  if (h === 0) h = 12;
  const mm = m.toString().padStart(2, '0');
  return `${h}:${mm}${ap}`;
}

export function workingDaysToApi(days: MockWorkingDay[]) {
  const sorted = [...days].sort((a, b) => a.dayOfWeek - b.dayOfWeek);
  return sorted.map((d) => {
    if (!d.available) {
      return { dayOfWeek: d.dayOfWeek, status: 'unavailable' as const };
    }
    const start = parseTimeToMinutes(d.startTime);
    const end = parseTimeToMinutes(d.endTime);
    if (start == null || end == null) {
      return { dayOfWeek: d.dayOfWeek, status: 'unavailable' as const };
    }
    return {
      dayOfWeek: d.dayOfWeek,
      status: 'available' as const,
      startMinute: start,
      endMinute: end,
    };
  });
}

export function workingHoursFromApi(
  rows: Array<{ dayOfWeek: number; status: string; startMinute: number | null; endMinute: number | null }>,
): MockWorkingDay[] {
  const byDay = new Map<number, MockWorkingDay>();
  for (let d = 0; d <= 6; d++) {
    byDay.set(d, {
      dayOfWeek: d,
      available: false,
      startTime: '9:00am',
      endTime: '5:00pm',
    });
  }
  for (const r of rows) {
    const available = r.status === 'available' && r.startMinute != null && r.endMinute != null;
    byDay.set(r.dayOfWeek, {
      dayOfWeek: r.dayOfWeek,
      available,
      startTime:
        available && r.startMinute != null ? formatMinutesToTime(r.startMinute) : '9:00am',
      endTime: available && r.endMinute != null ? formatMinutesToTime(r.endMinute) : '5:00pm',
    });
  }
  return [0, 1, 2, 3, 4, 5, 6].map((d) => byDay.get(d)!);
}

export function mergeProfileFromApi(
  user: User,
  parts: {
    profile: {
      profile: {
        fullName?: string | null;
        phone?: string | null;
        linkedinUrl?: string | null;
        linkedinConnected?: boolean | null;
        resumeExtras?: unknown;
        generativeProfilePictures?: boolean | null;
      } | null;
      skills: { name: string }[];
    };
    resume: {
      files: { id: string; fileName: string; status: string }[];
      experiences: Array<{
        id: string;
        title: string;
        company: string;
        location?: string | null;
        startDate: string;
        endDate?: string | null;
        isCurrent?: boolean;
        description?: string | null;
      }>;
      education: Array<{
        id: string;
        school: string;
        degree?: string | null;
        fieldOfStudy?: string | null;
        startYear?: number | null;
        endYear?: number | null;
        description?: string | null;
      }>;
      links: Array<{ id: string; label?: string | null; url: string; type?: string | null }>;
      languages: Array<{
        id: string;
        language: string;
        speakLevel?: string | null;
        writeLevel?: string | null;
      }>;
    };
    workAuth: Record<string, unknown> | null;
    availability: Record<string, unknown> | null;
    workingHours: Array<{
      dayOfWeek: number;
      status: string;
      startMinute: number | null;
      endMinute: number | null;
    }>;
    exceptions: Array<{ id: string; date: string; note?: string | null }>;
    workPreferences: Record<string, unknown> | null;
    communications: Record<string, unknown> | null;
  },
): MockWorkerProfile {
  const base = createDefaultWorkerProfile(user);
  const p = parts.profile.profile;
  const fullName = p?.fullName?.trim() || user.name;
  const primaryFile = parts.resume.files.find((f) => f.status === 'uploaded' || f.status === 'pending_upload');

  base.resume = {
    ...base.resume,
    fullName,
    displayEmail: user.email,
    phone: p?.phone?.trim() ?? '',
    linkedinConnected: !!p?.linkedinConnected,
    linkedinUrl: p?.linkedinUrl ?? '',
    resumeUploaded: !!primaryFile,
    resumeFileName: primaryFile?.fileName ?? '',
    skills: parts.profile.skills.map((s) => s.name).join(', '),
    // Empty arrays from the API mean "no rows saved" — do not fall back to createDefaultWorkerProfile
    // placeholders or deleted education/experience reappear after reload.
    education: (parts.resume.education ?? []).map((e) => ({
      id: e.id,
      school: e.school,
      degree: e.degree ?? '',
      fieldOfStudy: e.fieldOfStudy ?? '',
      grade: '',
      startYear: e.startYear != null ? String(e.startYear) : '',
      endYear: e.endYear != null ? String(e.endYear) : '',
      description: e.description ?? '',
    })),
    experience: (parts.resume.experiences ?? []).map((x) => ({
      id: x.id,
      company: x.company,
      role: x.title,
      startDate: x.startDate.slice(0, 10),
      endDate: x.isCurrent ? '' : x.endDate?.slice(0, 10) ?? '',
      city: x.location ?? '',
      description: x.description ?? '',
    })),
    links: (() => {
      const slots = [...base.resume.links];
      const all = parts.resume.links;
      for (let i = 0; i < Math.min(2, all.length); i++) {
        slots[i] = {
          id: all[i].id,
          label: all[i].label || slots[i].label,
          url: all[i].url,
        };
      }
      return slots;
    })(),
    projects:
      parts.resume.links.length > 2
        ? parts.resume.links.slice(2).map((l) => ({
            id: l.id,
            name: l.label || 'Project',
            url: l.url,
            description: '',
          }))
        : [],
    languageEntries:
      parts.resume.languages.length > 0
        ? parts.resume.languages.map((row) => {
            const sl = (row.speakLevel ?? '') as LanguageProficiencyLevel;
            const wl = (row.writeLevel ?? '') as LanguageProficiencyLevel;
            return {
              id: row.id,
              language: row.language,
              speakLevel: sl,
              writeLevel: wl,
            };
          })
        : base.resume.languageEntries,
    ...resumeExtrasFromProfileRow(p?.resumeExtras),
  };

  const wa = parts.workAuth as {
    country?: string;
    stateRegion?: string;
    city?: string;
    postalCode?: string;
    workingFromDifferentCountry?: boolean;
    dateOfBirth?: string | Date | null;
    attestAuthorizedToWork?: boolean;
    attestRemainInCountry?: boolean;
  } | null;
  if (wa) {
    base.workAuthorization = {
      country: wa.country ?? '',
      stateRegion: wa.stateRegion ?? '',
      city: wa.city ?? '',
      postalCode: wa.postalCode ?? '',
      workingFromDifferentCountry: !!wa.workingFromDifferentCountry,
      dateOfBirth: wa.dateOfBirth ? String(wa.dateOfBirth).slice(0, 10) : '',
      attestAuthorizedToWork: !!wa.attestAuthorizedToWork,
      attestRemainInCountry: !!wa.attestRemainInCountry,
    };
  }

  const av = parts.availability as {
    availabilityToStart?: string | null;
    timezone?: string | null;
    preferredWeeklyHours?: number | null;
    lastUpdatedAt?: string | Date | null;
  } | null;
  if (av) {
    base.availability = {
      ...base.availability,
      availabilityToStart: availabilityStartFromApi(av.availabilityToStart ?? undefined),
      timezone: av.timezone ?? '',
      preferredWeeklyHours:
        av.preferredWeeklyHours != null ? String(av.preferredWeeklyHours) : base.availability.preferredWeeklyHours,
      workingDays:
        parts.workingHours.length > 0
          ? workingHoursFromApi(parts.workingHours)
          : base.availability.workingDays,
      exceptions: parts.exceptions.map((ex) => ({
        id: ex.id,
        date: typeof ex.date === 'string' ? ex.date.slice(0, 10) : String(ex.date).slice(0, 10),
        note: ex.note ?? '',
      })),
      lastUpdatedLabel: av.lastUpdatedAt
        ? new Date(av.lastUpdatedAt).toLocaleDateString(undefined, {
            month: '2-digit',
            day: '2-digit',
            year: '2-digit',
          })
        : '',
    };
  }

  const wp = parts.workPreferences as {
    domainInterests?: string[];
    domainInterestsOther?: string | null;
    minExpectedFullTimeYearly?: number | null;
    minExpectedPartTimeHourly?: number | null;
  } | null;
  if (wp) {
    base.workPreferences = {
      domainInterests: wp.domainInterests ?? [],
      domainInterestsOther: wp.domainInterestsOther ?? '',
      minExpectedFullTimeYearly: String(wp.minExpectedFullTimeYearly ?? 0),
      minExpectedPartTimeHourly: String(wp.minExpectedPartTimeHourly ?? 0),
    };
  }

  const comm = parts.communications as Partial<MockWorkerProfile['communications']> | null;
  if (comm) {
    base.communications = { ...base.communications, ...comm };
  }

  if (p && typeof p.generativeProfilePictures === 'boolean') {
    base.account = { ...base.account, generativeProfilePictures: p.generativeProfilePictures };
  }

  return base;
}

export function exceptionBodyFromMock(ex: MockAvailabilityException) {
  return {
    date: ex.date.includes('T') ? ex.date.slice(0, 10) : ex.date,
    status: 'unavailable' as const,
    note: ex.note?.trim() || undefined,
  };
}

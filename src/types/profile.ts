import type { User } from './index';

export type DemographicsOption = 'man' | 'woman' | 'non_binary' | 'prefer_not';

export interface MockEducation {
  id: string;
  school: string;
  degree: string;
  fieldOfStudy: string;
  grade: string;
  startYear: string;
  endYear: string;
  description: string;
}

export interface MockExperience {
  id: string;
  company: string;
  role: string;
  startDate: string;
  endDate: string;
  city: string;
  description: string;
}

export interface MockProject {
  id: string;
  name: string;
  url: string;
  description: string;
}

export interface MockPublication {
  id: string;
  text: string;
}

export interface MockCertification {
  id: string;
  text: string;
}

export interface MockLink {
  id: string;
  label: string;
  url: string;
}

/** Matches backend `LanguageProficiency`; empty string = not set in UI. */
export type LanguageProficiencyLevel = 'beginner' | 'intermediate' | 'advanced' | 'fluent' | 'native' | '';

export interface MockLanguageEntry {
  id: string;
  language: string;
  speakLevel: LanguageProficiencyLevel;
  writeLevel: LanguageProficiencyLevel;
}

export interface MockResumeSection {
  fullName: string;
  displayEmail: string;
  phoneCountryLabel: string;
  phone: string;
  /** Profile URL is shown only when the account is LinkedIn-connected (OAuth or import). */
  linkedinConnected: boolean;
  linkedinUrl: string;
  resumeUploaded: boolean;
  resumeFileName: string;
  education: MockEducation[];
  experience: MockExperience[];
  projects: MockProject[];
  publications: MockPublication[];
  certifications: MockCertification[];
  awards: string[];
  links: MockLink[];
  skills: string;
  languageEntries: MockLanguageEntry[];
  demographics: DemographicsOption | '';
}

export interface MockWorkAuthorization {
  country: string;
  stateRegion: string;
  city: string;
  postalCode: string;
  workingFromDifferentCountry: boolean;
  dateOfBirth: string;
  attestAuthorizedToWork: boolean;
  attestRemainInCountry: boolean;
}

export type AvailabilityToStart =
  | 'immediate'
  | 'two_weeks'
  | 'one_month'
  | 'more_than_one_month'
  | '';

export interface MockWorkingDay {
  dayOfWeek: number;
  available: boolean;
  startTime: string;
  endTime: string;
}

export interface MockAvailabilityException {
  id: string;
  date: string;
  note: string;
}

export interface MockAvailability {
  availabilityToStart: AvailabilityToStart;
  preferredWeeklyHours: string;
  timezone: string;
  workingDays: MockWorkingDay[];
  exceptions: MockAvailabilityException[];
  lastUpdatedLabel: string;
}

export interface MockWorkPreferences {
  domainInterests: string[];
  domainInterestsOther: string;
  minExpectedFullTimeYearly: string;
  minExpectedPartTimeHourly: string;
}

export interface MockCommunications {
  channelEmail: boolean;
  channelSms: boolean;
  opportunityFullTime: boolean;
  opportunityPartTime: boolean;
  opportunityReferral: boolean;
  generalJobOpportunities: boolean;
  generalWorkUpdates: boolean;
  unsubscribeAll: boolean;
}

export interface MockAccountSettings {
  generativeProfilePictures: boolean;
}

export interface MockWorkerProfile {
  resume: MockResumeSection;
  workAuthorization: MockWorkAuthorization;
  availability: MockAvailability;
  workPreferences: MockWorkPreferences;
  communications: MockCommunications;
  account: MockAccountSettings;
}

export type ProfileTabId =
  | 'Resume'
  | 'Location & Work authorization'
  | 'Availability'
  | 'Work preferences'
  | 'Communications'
  | 'Account';

/** Sidebar sections on the profile page (each maps to one or more `ProfileTabId` saves). */
export type ProfileUiSection = 'about' | 'location' | 'schedule' | 'account';

export function newId(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) return crypto.randomUUID();
  return `id-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

export function createDefaultWorkingDays(): MockWorkingDay[] {
  return [0, 1, 2, 3, 4, 5, 6].map((dayOfWeek) => ({
    dayOfWeek,
    available: dayOfWeek >= 1 && dayOfWeek <= 5,
    startTime: '9:00am',
    endTime: '5:00pm',
  }));
}

export function createDefaultWorkerProfile(user: User): MockWorkerProfile {
  const email = user.email;
  const name = user.name || email.split('@')[0] || 'User';

  return {
    resume: {
      fullName: name,
      displayEmail: email,
      phoneCountryLabel: '🇮🇳 +91',
      phone: '',
      linkedinConnected: false,
      linkedinUrl: '',
      resumeUploaded: !!user.resumeFileName,
      resumeFileName: user.resumeFileName || '',
      education: [
        {
          id: newId(),
          school: '',
          degree: '',
          fieldOfStudy: '',
          grade: '',
          startYear: String(new Date().getFullYear() - 4),
          endYear: String(new Date().getFullYear()),
          description: '',
        },
      ],
      experience: [
        {
          id: newId(),
          company: '',
          role: '',
          startDate: '',
          endDate: '',
          city: '',
          description: '',
        },
      ],
      projects: [
        {
          id: newId(),
          name: '',
          url: '',
          description: '',
        },
      ],
      publications: [],
      certifications: [],
      awards: [],
      links: [
        { id: newId(), label: 'GitHub', url: '' },
        { id: newId(), label: 'Portfolio', url: '' },
      ],
      skills: user.skills?.join(', ') || '',
      languageEntries: [],
      demographics: '',
    },
    workAuthorization: {
      country: '',
      stateRegion: '',
      city: '',
      postalCode: '',
      workingFromDifferentCountry: false,
      dateOfBirth: '',
      attestAuthorizedToWork: false,
      attestRemainInCountry: false,
    },
    availability: {
      availabilityToStart: 'immediate',
      preferredWeeklyHours: '',
      timezone: '',
      workingDays: createDefaultWorkingDays(),
      exceptions: [],
      lastUpdatedLabel: '',
    },
    workPreferences: {
      domainInterests: [],
      domainInterestsOther: '',
      minExpectedFullTimeYearly: '0',
      minExpectedPartTimeHourly: '0',
    },
    communications: {
      channelEmail: true,
      channelSms: false,
      opportunityFullTime: true,
      opportunityPartTime: true,
      opportunityReferral: true,
      generalJobOpportunities: true,
      generalWorkUpdates: true,
      unsubscribeAll: false,
    },
    account: {
      generativeProfilePictures: true,
    },
  };
}

import type { Application, Job, User } from '@/types';
import type { MockWorkerProfile, ProfileTabId } from '@/types/profile';
import {
  ApiRequestError,
  apiRequest,
  clearTokens,
  setTokens,
} from './httpClient';
import {
  availabilityStartToApi,
  exceptionBodyFromMock,
  mergeProfileFromApi,
  workingDaysToApi,
} from './profileMap';

export { ApiRequestError };

export const PENDING_FULL_NAME_KEY = '2une_pending_full_name';

function stripMarkdownToText(input: string): string {
  let s = input;
  // Remove fenced code blocks
  s = s.replace(/```[\s\S]*?```/g, ' ');
  // Inline code
  s = s.replace(/`([^`]+)`/g, '$1');
  // Images: ![alt](url) -> alt
  s = s.replace(/!\[([^\]]*)\]\([^)]+\)/g, '$1');
  // Links: [text](url) -> text
  s = s.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '$1');
  // Headings / blockquotes
  s = s.replace(/^\s{0,3}(#{1,6})\s+/gm, '');
  s = s.replace(/^\s{0,3}>\s?/gm, '');
  // List markers
  s = s.replace(/^\s*[-*+]\s+/gm, '');
  s = s.replace(/^\s*\d+\.\s+/gm, '');
  // Emphasis / strike
  s = s.replace(/\*\*([^*]+)\*\*/g, '$1');
  s = s.replace(/\*([^*]+)\*/g, '$1');
  s = s.replace(/__([^_]+)__/g, '$1');
  s = s.replace(/_([^_]+)_/g, '$1');
  s = s.replace(/~~([^~]+)~~/g, '$1');
  // Collapse whitespace
  s = s.replace(/\s+/g, ' ').trim();
  return s;
}

function mapProjectToJob(p: {
  id: string;
  title: string;
  description?: string | null;
  domain: string;
  payPerTask: number;
  requirement?: { requiredSkills?: string[] } | null;
}): Job {
  const skills = p.requirement?.requiredSkills ?? [];
  const pay = p.payPerTask;
  const cleanDescription = p.description ? stripMarkdownToText(p.description) : '';
  return {
    id: p.id,
    title: p.title,
    company: '2une partner',
    payRange: `$${pay} / task`,
    tags: [p.domain, ...skills].filter(Boolean).slice(0, 8),
    shortDescription: ((cleanDescription || p.title).slice(0, 180) || p.title).trim(),
    description: p.description?.trim() || '',
    category: p.domain,
    experienceLevel: 'Annotator',
    skillsRequired: skills.length ? skills : [p.domain],
  };
}

function mapApplication(row: {
  id: string;
  projectId: string;
  userId: string;
  status: Application['status'];
  createdAt: string;
  updatedAt: string;
  interviewScore?: number | null;
  rejectionReason?: string | null;
  project?: { title?: string };
}): Application {
  const score = row.interviewScore ?? undefined;
  return {
    id: row.id,
    jobId: row.projectId,
    userId: row.userId,
    status: row.status,
    appliedAt: row.createdAt,
    updatedAt: row.updatedAt,
    interviewScore: row.interviewScore,
    aiScore: score,
    projectTitle: row.project?.title,
    rejectionReason: row.rejectionReason,
  };
}

async function findApplicationByProject(projectId: string): Promise<Application | null> {
  const apps = await apiRequest<
    Array<{
      id: string;
      projectId: string;
      userId: string;
      status: Application['status'];
      createdAt: string;
      updatedAt: string;
      interviewScore?: number | null;
      rejectionReason?: string | null;
      project?: { title?: string };
    }>
  >('/applications/my', { auth: true });
  const row = apps.find((a) => a.projectId === projectId);
  return row ? mapApplication(row) : null;
}

async function flushPendingFullName(): Promise<void> {
  if (typeof window === 'undefined') return;
  const name = sessionStorage.getItem(PENDING_FULL_NAME_KEY)?.trim();
  if (!name) return;
  try {
    await apiRequest('/users/profile', {
      method: 'PATCH',
      auth: true,
      body: { fullName: name },
    });
    sessionStorage.removeItem(PENDING_FULL_NAME_KEY);
  } catch {
    /* keep for retry */
  }
}

export const api = {
  async signup(input: { email: string; password: string; name: string }): Promise<{
    verificationToken?: string;
    message: string;
  }> {
    const data = await apiRequest<{
      user: { id: string; email: string };
      verificationToken: string;
      message: string;
    }>('/auth/signup', {
      method: 'POST',
      body: { email: input.email.trim().toLowerCase(), password: input.password },
    });
    if (typeof window !== 'undefined' && input.name.trim()) {
      sessionStorage.setItem(PENDING_FULL_NAME_KEY, input.name.trim());
    }
    return { verificationToken: data.verificationToken, message: data.message };
  },

  async verifyEmail(token: string): Promise<void> {
    await apiRequest('/auth/verify-email', {
      method: 'POST',
      body: { token: token.trim() },
    });
  },

  async login(email: string, password?: string): Promise<User> {
    if (!password || password.length < 8) {
      throw new Error('Password must be at least 8 characters.');
    }
    const data = await apiRequest<{
      accessToken: string;
      refreshToken: string;
      user: { id: string; email: string; role: string };
    }>('/auth/login', {
      method: 'POST',
      body: { email: email.trim().toLowerCase(), password },
    });
    setTokens(data.accessToken, data.refreshToken);
    await flushPendingFullName();
    const session = await this.getUserProfile();
    if (!session) throw new Error('Login failed');
    return session;
  },

  async loginWithGoogle(idToken: string): Promise<User> {
    const data = await apiRequest<{
      accessToken: string;
      refreshToken: string;
      user: { id: string; email: string; role: string };
    }>('/auth/google', {
      method: 'POST',
      body: { idToken: idToken.trim() },
    });
    setTokens(data.accessToken, data.refreshToken);
    await flushPendingFullName();
    const session = await this.getUserProfile();
    if (!session) throw new Error('Login failed');
    return session;
  },

  async logout(): Promise<void> {
    clearTokens();
    if (typeof window !== 'undefined') sessionStorage.removeItem(PENDING_FULL_NAME_KEY);
  },

  /** Used for global “minimum profile” banner (phone + languages). */
  async getProfileMinimumDetailsGap(): Promise<{
    showBanner: boolean;
    missingPhone: boolean;
    missingLanguages: boolean;
  } | null> {
    if (typeof window === 'undefined') return null;
    try {
      const data = await apiRequest<{
        profile: { phone?: string | null } | null;
        languages: Array<unknown>;
      }>('/users/profile', { auth: true });
      const missingPhone = !data.profile?.phone?.trim();
      const missingLanguages = !Array.isArray(data.languages) || data.languages.length < 1;
      return {
        showBanner: missingPhone || missingLanguages,
        missingPhone,
        missingLanguages,
      };
    } catch {
      return null;
    }
  },

  async getUserProfile(): Promise<User | null> {
    if (typeof window === 'undefined') return null;
    const token = localStorage.getItem('2une_access_token');
    if (!token) return null;
    try {
      const me = await apiRequest<{ id: string; email: string; role: string; isVerified: boolean }>('/users/me', {
        auth: true,
      });
      let name = me.email.split('@')[0] || 'User';
      let linkedinConnected = false;
      try {
        const bundle = await apiRequest<{
          profile: { fullName?: string | null; linkedinConnected?: boolean | null; phone?: string | null } | null;
        }>('/users/profile', {
          auth: true,
        });
        if (bundle.profile?.fullName?.trim()) name = bundle.profile.fullName.trim();
        linkedinConnected = !!bundle.profile?.linkedinConnected;
      } catch {
        /* ignore */
      }
      return {
        id: me.id,
        email: me.email,
        name,
        skills: [],
        experience: '',
        bio: '',
        role: me.role as User['role'],
        isVerified: me.isVerified,
        linkedinConnected,
      };
    } catch {
      clearTokens();
      return null;
    }
  },

  async updateUserProfile(data: Partial<User>): Promise<User> {
    const patch: { fullName?: string; education?: string; experienceLevel?: string } = {};
    if (data.name != null) patch.fullName = data.name;
    if (Object.keys(patch).length > 0) {
      await apiRequest('/users/profile', { method: 'PATCH', auth: true, body: patch });
    }
    const current = await this.getUserProfile();
    if (!current) throw new Error('Not authenticated');
    return {
      ...current,
      ...data,
      name: data.name ?? current.name,
      skills: data.skills ?? current.skills,
      experience: data.experience ?? current.experience,
      bio: data.bio ?? current.bio,
      resumeFileName: data.resumeFileName ?? current.resumeFileName,
      linkedinConnected: data.linkedinConnected ?? current.linkedinConnected,
    };
  },

  async getJobs(page = 1, limit = 50): Promise<Job[]> {
    const qs = new URLSearchParams({ page: String(page), limit: String(limit) });
    const data = await apiRequest<{ items: Parameters<typeof mapProjectToJob>[0][]; total: number }>(
      `/projects?${qs}`,
    );
    return data.items.map(mapProjectToJob);
  },

  async getJobById(id: string): Promise<Job | undefined> {
    try {
      const p = await apiRequest<Parameters<typeof mapProjectToJob>[0]>(`/projects/${id}`);
      return mapProjectToJob(p);
    } catch (e) {
      if (e instanceof ApiRequestError && e.status === 404) return undefined;
      throw e;
    }
  },

  async applyToJob(jobId: string, _userId: string): Promise<Application> {
    try {
      const row = await apiRequest<{
        id: string;
        projectId: string;
        userId: string;
        status: Application['status'];
        createdAt: string;
        updatedAt: string;
        project?: { title?: string };
      }>(`/projects/${jobId}/apply`, { method: 'POST', auth: true });
      return mapApplication(row);
    } catch (e) {
      if (e instanceof ApiRequestError && e.code === 'DUPLICATE_APPLICATION') {
        const existing = await findApplicationByProject(jobId);
        if (existing) return existing;
      }
      throw e;
    }
  },

  async getApplications(): Promise<Application[]> {
    const apps = await apiRequest<
      Array<{
        id: string;
        projectId: string;
        userId: string;
        status: Application['status'];
        createdAt: string;
        updatedAt: string;
        interviewScore?: number | null;
        rejectionReason?: string | null;
        project?: { title?: string };
      }>
    >('/applications/my', { auth: true });
    return apps.map(mapApplication);
  },

  async startAiInterview(applicationId: string): Promise<{
    applicationId: string;
    projectId: string;
    questions: { id: string; question: string }[];
  }> {
    return apiRequest(`/applications/${applicationId}/ai-interview/start`, { method: 'POST', auth: true });
  },

  async submitAiInterview(
    applicationId: string,
    transcript: Array<{ role: 'system' | 'user' | 'assistant'; content: string }>,
  ): Promise<Application> {
    const row = await apiRequest<{
      id: string;
      projectId: string;
      userId: string;
      status: Application['status'];
      createdAt: string;
      updatedAt: string;
      interviewScore?: number | null;
      project?: { title?: string };
    }>(`/applications/${applicationId}/ai-interview/submit`, {
      method: 'POST',
      auth: true,
      body: { transcript },
    });
    return mapApplication(row);
  },

  async getWorkerProfile(_userId: string, user: User): Promise<MockWorkerProfile> {
    type ProfilePart = {
      profile: {
        fullName?: string | null;
        phone?: string | null;
        linkedinUrl?: string | null;
        linkedinConnected?: boolean | null;
        resumeExtras?: unknown;
      } | null;
      skills: { name: string }[];
    };
    type ResumeCore = {
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
    };
    type LangRow = { id: string; language: string; speakLevel?: string | null; writeLevel?: string | null };
    type MergePayload = Parameters<typeof mergeProfileFromApi>[1];

    const mergeFromParts = (parts: MergePayload) => mergeProfileFromApi(user, parts);

    try {
      const bundle = await apiRequest<{
        profile: ProfilePart;
        resume: ResumeCore & { languages: LangRow[] };
        workAuth: Record<string, unknown> | null;
        availability: Record<string, unknown> | null;
        workingHours: Array<{ dayOfWeek: number; status: string; startMinute: number | null; endMinute: number | null }>;
        exceptions: Array<{ id: string; date: string; note?: string | null }>;
        workPreferences: Record<string, unknown> | null;
        communications: Record<string, unknown> | null;
      }>('/users/profile/worker-bundle', { auth: true });
      return mergeFromParts({
        profile: bundle.profile,
        resume: bundle.resume,
        workAuth: bundle.workAuth,
        availability: bundle.availability,
        workingHours: bundle.workingHours,
        exceptions: bundle.exceptions,
        workPreferences: bundle.workPreferences,
        communications: bundle.communications,
      });
    } catch (e) {
      if (typeof console !== 'undefined' && console.warn) {
        console.warn('[2une] GET /users/profile/worker-bundle failed; using granular profile fetches', e);
      }
    }

    const from = '2020-01-01';
    const to = '2035-12-31';
    const emptyProfile: ProfilePart = { profile: null, skills: [] };
    const emptyResume: ResumeCore = { files: [], experiences: [], education: [], links: [] };

    const [profile, resume, languages, workAuth, availability, workingHours, exceptions, workPreferences, communications] =
      await Promise.all([
        apiRequest<ProfilePart>('/users/profile', { auth: true }).catch(() => emptyProfile),
        apiRequest<ResumeCore>('/users/profile/resume', { auth: true }).catch(() => emptyResume),
        apiRequest<LangRow[]>('/users/profile/languages', { auth: true }).catch(() => []),
        apiRequest<Record<string, unknown> | null>('/users/profile/work-authorization', { auth: true }).catch(() => null),
        apiRequest<Record<string, unknown> | null>('/users/profile/availability', { auth: true }).catch(() => null),
        apiRequest<Array<{ dayOfWeek: number; status: string; startMinute: number | null; endMinute: number | null }>>(
          '/users/profile/availability/working-hours',
          { auth: true },
        ).catch(() => []),
        apiRequest<Array<{ id: string; date: string; note?: string | null }>>(
          `/users/profile/availability/exceptions?from=${from}&to=${to}`,
          { auth: true },
        ).catch(() => []),
        apiRequest<Record<string, unknown> | null>('/users/profile/work-preferences', { auth: true }).catch(() => null),
        apiRequest<Record<string, unknown> | null>('/users/profile/communications', { auth: true }).catch(() => null),
      ]);

    return mergeFromParts({
      profile,
      resume: { ...resume, languages: Array.isArray(languages) ? languages : [] },
      workAuth,
      availability,
      workingHours,
      exceptions,
      workPreferences,
      communications,
    });
  },

  async saveWorkerProfile(_userId: string, profile: MockWorkerProfile, activeTab: ProfileTabId): Promise<void> {
    if (activeTab === 'Resume') {
      const fullName = profile.resume.fullName.trim();
      await apiRequest('/users/profile', {
        method: 'PATCH',
        auth: true,
        body: {
          ...(fullName ? { fullName } : {}),
          phone: profile.resume.phone.trim(),
          resumeExtras: {
            publications: profile.resume.publications
              .map(({ id, text }) => ({ id, text: text.trim() }))
              .filter((row) => row.text.length > 0),
            certifications: profile.resume.certifications
              .map(({ id, text }) => ({ id, text: text.trim() }))
              .filter((row) => row.text.length > 0),
            awards: profile.resume.awards.map((a) => a.trim()).filter(Boolean),
            demographics: profile.resume.demographics || '',
          },
        },
      });
      const skillParts = profile.resume.skills
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean);
      for (const name of skillParts) {
        try {
          await apiRequest('/users/profile/skills', { method: 'POST', auth: true, body: { name } });
        } catch (e) {
          if (e instanceof ApiRequestError && e.code === 'SKILL_EXISTS') continue;
          throw e;
        }
      }

      const langUuid = (id: string) => /^[0-9a-f-]{36}$/i.test(id);
      const profValues = ['beginner', 'intermediate', 'advanced', 'fluent', 'native'] as const;
      const profForPost = (v: string) => (profValues as readonly string[]).includes(v) ? v : undefined;
      const profForPatch = (v: string): (typeof profValues)[number] | null => {
        if (!v) return null;
        return (profValues as readonly string[]).includes(v) ? (v as (typeof profValues)[number]) : null;
      };
      const serverLangs = await apiRequest<Array<{ id: string }>>('/users/profile/languages', { auth: true });
      const langRows = profile.resume.languageEntries.filter((e) => e.language.trim());
      const keepLangIds = new Set(langRows.map((e) => e.id).filter((id) => langUuid(id)));
      for (const row of serverLangs) {
        if (!keepLangIds.has(row.id)) {
          await apiRequest(`/users/profile/languages/${row.id}`, { method: 'DELETE', auth: true });
        }
      }
      for (const e of langRows) {
        const language = e.language.trim();
        if (langUuid(e.id)) {
          await apiRequest(`/users/profile/languages/${e.id}`, {
            method: 'PATCH',
            auth: true,
            body: {
              language,
              speakLevel: profForPatch(e.speakLevel),
              writeLevel: profForPatch(e.writeLevel),
            },
          });
        } else {
          const body: { language: string; speakLevel?: string; writeLevel?: string } = { language };
          const sp = profForPost(e.speakLevel);
          const wp = profForPost(e.writeLevel);
          if (sp) body.speakLevel = sp;
          if (wp) body.writeLevel = wp;
          await apiRequest('/users/profile/languages', { method: 'POST', auth: true, body });
        }
      }

      const serverResume = await apiRequest<{
        education: Array<{ id: string }>;
        experiences: Array<{ id: string }>;
        links: Array<{ id: string }>;
      }>('/users/profile/resume', { auth: true });

      const keepEducationIds = new Set(
        profile.resume.education.map((e) => e.id).filter((id) => langUuid(id)),
      );
      for (const row of serverResume.education ?? []) {
        if (!keepEducationIds.has(row.id)) {
          await apiRequest(`/users/profile/resume/education/${row.id}`, { method: 'DELETE', auth: true });
        }
      }

      const keepExperienceIds = new Set(
        profile.resume.experience.map((e) => e.id).filter((id) => langUuid(id)),
      );
      for (const row of serverResume.experiences ?? []) {
        if (!keepExperienceIds.has(row.id)) {
          await apiRequest(`/users/profile/resume/experience/${row.id}`, { method: 'DELETE', auth: true });
        }
      }

      const keepPortfolioIds = new Set<string>();
      for (const link of profile.resume.links) {
        if (langUuid(link.id)) keepPortfolioIds.add(link.id);
      }
      for (const proj of profile.resume.projects) {
        if (langUuid(proj.id)) keepPortfolioIds.add(proj.id);
      }
      for (const row of serverResume.links ?? []) {
        if (!keepPortfolioIds.has(row.id)) {
          await apiRequest(`/users/profile/resume/portfolio/${row.id}`, { method: 'DELETE', auth: true });
        }
      }

      for (const ed of profile.resume.education) {
        if (!ed.school.trim()) continue;
        await apiRequest('/users/profile/resume/education', {
          method: 'PUT',
          auth: true,
          body: {
            id: ed.id.match(/^[0-9a-f-]{36}$/i) ? ed.id : undefined,
            school: ed.school.trim(),
            degree: ed.degree.trim() || undefined,
            fieldOfStudy: ed.fieldOfStudy.trim() || undefined,
            startYear: ed.startYear ? parseInt(ed.startYear, 10) : undefined,
            endYear: ed.endYear ? parseInt(ed.endYear, 10) : undefined,
            description: ed.description.trim() || undefined,
          },
        });
      }
      for (const ex of profile.resume.experience) {
        if (!ex.company.trim() || !ex.role.trim() || !ex.startDate.trim()) continue;
        const startDate = ex.startDate.includes('T') ? ex.startDate : `${ex.startDate}T12:00:00.000Z`;
        const endDate =
          ex.endDate.trim() && !ex.endDate.includes('T') ? `${ex.endDate}T12:00:00.000Z` : ex.endDate.trim() || undefined;
        await apiRequest('/users/profile/resume/experience', {
          method: 'PUT',
          auth: true,
          body: {
            id: ex.id.match(/^[0-9a-f-]{36}$/i) ? ex.id : undefined,
            title: ex.role.trim(),
            company: ex.company.trim(),
            location: ex.city.trim() || undefined,
            startDate,
            endDate,
            isCurrent: !ex.endDate.trim(),
            description: ex.description.trim() || undefined,
          },
        });
      }
      const portfolioBodies: Array<{ id?: string; label?: string; url: string; type?: string }> = [];
      for (const link of profile.resume.links) {
        if (link.url.trim()) {
          portfolioBodies.push({
            id: link.id.match(/^[0-9a-f-]{36}$/i) ? link.id : undefined,
            label: link.label,
            url: link.url.trim(),
            type: link.label.toLowerCase().includes('git') ? 'github' : 'portfolio',
          });
        }
      }
      for (const proj of profile.resume.projects) {
        if (proj.url.trim()) {
          portfolioBodies.push({
            id: proj.id.match(/^[0-9a-f-]{36}$/i) ? proj.id : undefined,
            label: proj.name || 'Project',
            url: proj.url.trim(),
            type: 'portfolio',
          });
        }
      }
      for (const body of portfolioBodies) {
        await apiRequest('/users/profile/resume/portfolio', { method: 'PUT', auth: true, body });
      }
    }

    if (activeTab === 'Location & Work authorization') {
      const w = profile.workAuthorization;
      await apiRequest('/users/profile/work-authorization', {
        method: 'PUT',
        auth: true,
        body: {
          country: w.country.trim(),
          stateRegion: w.stateRegion.trim(),
          city: w.city.trim(),
          postalCode: w.postalCode.trim(),
          workingFromDifferentCountry: w.workingFromDifferentCountry,
          dateOfBirth: w.dateOfBirth.trim() || undefined,
          attestAuthorizedToWork: w.attestAuthorizedToWork,
          attestRemainInCountry: w.attestRemainInCountry,
        },
      });
    }

    if (activeTab === 'Availability') {
      const a = profile.availability;
      const hours = parseInt(a.preferredWeeklyHours.trim(), 10);
      await apiRequest('/users/profile/availability', {
        method: 'PUT',
        auth: true,
        body: {
          availabilityToStart: availabilityStartToApi(a.availabilityToStart),
          timezone: a.timezone.trim() || undefined,
          preferredWeeklyHours: Number.isFinite(hours) ? hours : undefined,
        },
      });
      await apiRequest('/users/profile/availability/working-hours', {
        method: 'PUT',
        auth: true,
        body: { days: workingDaysToApi(a.workingDays) },
      });

      const exUuid = (id: string) => /^[0-9a-f-]{36}$/i.test(id);
      const from = '2020-01-01';
      const to = '2035-12-31';
      const serverExceptions = await apiRequest<Array<{ id: string }>>(
        `/users/profile/availability/exceptions?from=${from}&to=${to}`,
        { auth: true },
      );
      const keepExceptionIds = new Set(a.exceptions.map((e) => e.id).filter((id) => exUuid(id)));
      for (const row of serverExceptions ?? []) {
        if (!keepExceptionIds.has(row.id)) {
          await apiRequest(`/users/profile/availability/exceptions/${row.id}`, { method: 'DELETE', auth: true });
        }
      }

      for (const ex of a.exceptions) {
        try {
          await apiRequest('/users/profile/availability/exceptions', {
            method: 'POST',
            auth: true,
            body: exceptionBodyFromMock(ex),
          });
        } catch {
          /* ignore */
        }
      }
    }

    if (activeTab === 'Work preferences') {
      const w = profile.workPreferences;
      await apiRequest('/users/profile/work-preferences', {
        method: 'PUT',
        auth: true,
        body: {
          domainInterests: w.domainInterests,
          domainInterestsOther: w.domainInterestsOther.trim() || undefined,
          minExpectedFullTimeYearly: parseInt(w.minExpectedFullTimeYearly, 10) || 0,
          minExpectedPartTimeHourly: parseInt(w.minExpectedPartTimeHourly, 10) || 0,
        },
      });
    }

    if (activeTab === 'Communications') {
      await apiRequest('/users/profile/communications', {
        method: 'PUT',
        auth: true,
        body: profile.communications,
      });
    }
  },

  async uploadResumeFile(file: File): Promise<{ fileName: string }> {
    const sasPayload = await apiRequest<{
      file: { id: string; fileName: string };
      sas: { uploadUrlSas: string };
    }>('/users/profile/resume/files/sas', {
      method: 'POST',
      auth: true,
      body: {
        fileName: file.name,
        mimeType: file.type || 'application/pdf',
        sizeBytes: file.size,
      },
    });
    const put = await fetch(sasPayload.sas.uploadUrlSas, {
      method: 'PUT',
      headers: {
        'Content-Type': file.type || 'application/pdf',
        'x-ms-blob-type': 'BlockBlob',
      },
      body: file,
    });
    if (!put.ok) {
      throw new Error(`Upload failed (${put.status})`);
    }
    await apiRequest(`/users/profile/resume/files/${sasPayload.file.id}/confirm-upload`, {
      method: 'POST',
      auth: true,
    });
    return { fileName: sasPayload.file.fileName };
  },

  async listMyTasks(page = 1, limit = 20) {
    const qs = new URLSearchParams({ page: String(page), limit: String(limit) });
    return apiRequest<{
      items: Array<{
        id: string;
        status: string;
        task: {
          id: string;
          inputData: unknown;
          status: string;
          project: { id: string; title: string };
        };
      }>;
      page: number;
      limit: number;
      total: number;
    }>(`/tasks?${qs}`, { auth: true });
  },

  async nextTask() {
    return apiRequest<{
      assignment: {
        id: string;
        status: string;
        task: { id: string; inputData: unknown; status: string; project: { id: string; title: string } };
      } | null;
    }>('/tasks/next', { auth: true });
  },

  async submitTask(taskId: string, outputData: unknown, timeTaken: number) {
    return apiRequest(`/tasks/${taskId}/submit`, {
      method: 'POST',
      auth: true,
      body: { outputData, timeTaken },
    });
  },

  async profileCompletionStatus() {
    return apiRequest<{ isComplete: boolean; score: number; missing: string[] }>(
      '/users/profile/completion-status',
      { auth: true },
    ).catch(() => null);
  },
};

'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';

import { useAuthStore } from '@/lib/store';
import { api } from '@/lib/services/api';
import { validateProfileTab } from '@/lib/profileValidation';
import {
  PROFILE_SECTION_AUTOSAVE_DEBOUNCE_MS,
  getProfileSectionAutoSaveBlockers,
  serializeProfileSection,
} from '@/lib/profileSectionAutosave';
import type { MockWorkerProfile, ProfileTabId, ProfileUiSection } from '@/types/profile';

import { ProfileTabActions } from '@/components/profile/ProfileTabActions';
import { ProfileSection } from '@/components/profile/ProfileSection';
import { ResumeTab } from '@/components/profile/ResumeTab';
import { LocationTab } from '@/components/profile/LocationTab';
import { AvailabilityTab } from '@/components/profile/AvailabilityTab';
import { WorkPreferencesTab } from '@/components/profile/WorkPreferencesTab';
import { CommunicationsTab } from '@/components/profile/CommunicationsTab';
import { AccountTab } from '@/components/profile/AccountTab';
import { cn } from '@/lib/utils';

const SECTIONS: {
  id: ProfileUiSection;
  label: string;
  hint: string;
  backendTabs: ProfileTabId[];
  showAvailabilityDot?: boolean;
}[] = [
  { id: 'about', label: 'About', hint: 'Resume, experience, and skills.', backendTabs: ['Resume'] },
  {
    id: 'location',
    label: 'Location',
    hint: 'Where you live and where you are authorized to work.',
    backendTabs: ['Location & Work authorization'],
  },
  {
    id: 'schedule',
    label: 'Schedule',
    hint: 'When you are available and how you prefer to work.',
    backendTabs: ['Availability', 'Work preferences'],
    showAvailabilityDot: true,
  },
  {
    id: 'account',
    label: 'Account',
    hint: 'Notifications, payout preferences, and account security.',
    backendTabs: ['Communications', 'Account'],
  },
];

const LINKEDIN_ERROR_MESSAGES: Record<string, string> = {
  access_denied: 'LinkedIn sign-in was cancelled.',
  oauth_denied: 'LinkedIn sign-in was denied.',
  invalid_callback: 'LinkedIn sign-in failed (invalid callback).',
  email_mismatch: 'Your LinkedIn email must match your 2une account email.',
  account_in_use: 'That LinkedIn account is already linked to another user.',
  invalid_state: 'LinkedIn sign-in expired. Please try again.',
  linkedin_api_error: 'LinkedIn could not complete sign-in. Try again later.',
  link_failed: 'Could not connect LinkedIn.',
};

export default function ProfilePage() {
  const router = useRouter();
  const { user, updateUser, checkAuth } = useAuthStore();
  const [activeSection, setActiveSection] = useState<ProfileUiSection>('about');
  const [profile, setProfile] = useState<MockWorkerProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [autosaving, setAutosaving] = useState(false);

  const profileRef = useRef<MockWorkerProfile | null>(null);
  profileRef.current = profile;

  const lastSavedBySection = useRef<Partial<Record<ProfileUiSection, string>>>({});
  const persistMutex = useRef(false);
  const profileHydrated = useRef(false);
  const lastAutosaveBlocker = useRef<{ section: ProfileUiSection; msg: string; at: number } | null>(null);

  const fillSavedSnapshots = useCallback((p: MockWorkerProfile) => {
    lastSavedBySection.current = {
      about: serializeProfileSection('about', p),
      location: serializeProfileSection('location', p),
      schedule: serializeProfileSection('schedule', p),
      account: serializeProfileSection('account', p),
    };
  }, []);

  const reloadFromStorage = useCallback(async () => {
    const u = useAuthStore.getState().user;
    if (!u) return;
    const p = await api.getWorkerProfile(u.id, u);
    setProfile(p);
    fillSavedSnapshots(p);
    profileHydrated.current = true;
  }, [fillSavedSnapshots]);

  const linkedinReturnHandled = useRef(false);
  useEffect(() => {
    if (typeof window === 'undefined' || linkedinReturnHandled.current) return;
    const q = new URLSearchParams(window.location.search);
    const connected = q.get('linkedin_connected');
    const err = q.get('linkedin_error');
    if (connected !== '1' && !err) return;
    linkedinReturnHandled.current = true;

    const path = window.location.pathname;

    if (connected === '1') {
      toast.success(
        'LinkedIn connected to this account. Your name is updated from LinkedIn only if it was empty; other sections are unchanged.',
      );
      void (async () => {
        await checkAuth();
        await reloadFromStorage();
      })();
    } else if (err) {
      toast.error(LINKEDIN_ERROR_MESSAGES[err] ?? LINKEDIN_ERROR_MESSAGES.link_failed);
    }

    router.replace(path, { scroll: false });
  }, [checkAuth, reloadFromStorage, router]);

  const userId = user?.id;

  useEffect(() => {
    if (!userId) {
      router.replace('/login');
      return;
    }
    let cancelled = false;
    (async () => {
      setLoading(true);
      const u = useAuthStore.getState().user;
      if (!u || u.id !== userId) {
        if (!cancelled) setLoading(false);
        return;
      }
      const p = await api.getWorkerProfile(userId, u);
      if (!cancelled) {
        setProfile(p);
        fillSavedSnapshots(p);
        profileHydrated.current = true;
        setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [userId, router, fillSavedSnapshots]);

  useEffect(() => {
    profileHydrated.current = false;
    lastSavedBySection.current = {};
  }, [userId]);

  useEffect(() => {
    if (!user || loading || !profile || !profileHydrated.current) return;

    const section = activeSection;
    const timer = window.setTimeout(async () => {
      const p = profileRef.current;
      if (!p || !user || persistMutex.current) return;

      const serialized = serializeProfileSection(section, p);
      if (serialized === lastSavedBySection.current[section]) return;

      const blocker = getProfileSectionAutoSaveBlockers(section, p);
      if (blocker) {
        const now = Date.now();
        const prev = lastAutosaveBlocker.current;
        const repeatSame =
          prev && prev.section === section && prev.msg === blocker && now - prev.at < 10_000;
        if (!repeatSame) {
          lastAutosaveBlocker.current = { section, msg: blocker, at: now };
          toast.message(blocker, { id: `profile-autosave-blocker-${section}`, duration: 5000 });
        }
        return;
      }
      lastAutosaveBlocker.current = null;

      const tabs = SECTIONS.find((s) => s.id === section)!.backendTabs;

      persistMutex.current = true;
      setAutosaving(true);
      try {
        for (const tab of tabs) {
          await api.saveWorkerProfile(user.id, p, tab);
        }

        if (tabs.includes('Resume')) {
          const skills = p.resume.skills
            .split(',')
            .map((s) => s.trim())
            .filter(Boolean);
          await updateUser(
            {
              name: p.resume.fullName,
              resumeFileName: p.resume.resumeFileName || undefined,
              skills,
            },
            { silent: true },
          );
        }

        const needsReload = tabs.includes('Resume') || tabs.includes('Availability');
        if (needsReload) {
          const u = useAuthStore.getState().user;
          if (u) {
            const fresh = await api.getWorkerProfile(u.id, u);
            setProfile(fresh);
            fillSavedSnapshots(fresh);
          }
        } else {
          lastSavedBySection.current[section] = serialized;
        }

        if (typeof window !== 'undefined') {
          window.dispatchEvent(new Event('2une-profile-saved'));
        }
        toast.success('Saved', { id: 'profile-autosave-ok', duration: 1400 });
      } catch (e) {
        toast.error(e instanceof Error ? e.message : 'Autosave failed', { id: 'profile-autosave-err' });
      } finally {
        persistMutex.current = false;
        setAutosaving(false);
      }
    }, PROFILE_SECTION_AUTOSAVE_DEBOUNCE_MS);

    return () => window.clearTimeout(timer);
  }, [profile, user, loading, activeSection, updateUser, fillSavedSnapshots]);

  const sectionMeta = useMemo(
    () => SECTIONS.find((s) => s.id === activeSection)!,
    [activeSection]
  );

  const missingAvailability =
    profile &&
    (!profile.availability.timezone.trim() || !profile.availability.preferredWeeklyHours.trim());

  const handleSave = async () => {
    if (!user || !profile) return;
    if (persistMutex.current) {
      toast.message('Please wait for the save in progress to finish.');
      return;
    }
    const tabs = sectionMeta.backendTabs;

    for (const tab of tabs) {
      const err = validateProfileTab(tab, profile);
      if (err) {
        toast.error(err);
        return;
      }
    }

    let toSave = profile;
    if (tabs.includes('Availability')) {
      toSave = {
        ...profile,
        availability: {
          ...profile.availability,
          lastUpdatedLabel: new Date().toLocaleDateString(undefined, {
            month: '2-digit',
            day: '2-digit',
            year: '2-digit',
          }),
        },
      };
      setProfile(toSave);
    }

    persistMutex.current = true;
    setSaving(true);
    try {
      for (const tab of tabs) {
        await api.saveWorkerProfile(user.id, toSave, tab);
      }
      if (tabs.includes('Resume')) {
        const skills = toSave.resume.skills
          .split(',')
          .map((s) => s.trim())
          .filter(Boolean);
        await updateUser(
          {
            name: toSave.resume.fullName,
            resumeFileName: toSave.resume.resumeFileName || undefined,
            skills,
          },
          { silent: true },
        );
      }

      const needsReload = tabs.includes('Resume') || tabs.includes('Availability');
      if (needsReload) {
        const u = useAuthStore.getState().user;
        if (u) {
          const fresh = await api.getWorkerProfile(u.id, u);
          setProfile(fresh);
          fillSavedSnapshots(fresh);
        }
      } else {
        fillSavedSnapshots(toSave);
      }

      if (typeof window !== 'undefined') {
        window.dispatchEvent(new Event('2une-profile-saved'));
      }
      toast.success('Saved to your profile', { duration: 2000 });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Save failed');
    } finally {
      persistMutex.current = false;
      setSaving(false);
    }
  };

  const handleReset = async () => {
    await reloadFromStorage();
    toast.message('Restored last saved data');
  };

  const setProfileSafe = useCallback((action: React.SetStateAction<MockWorkerProfile>) => {
    setProfile((prev) => {
      if (!prev) return prev;
      return typeof action === 'function' ? action(prev) : action;
    });
  }, []);

  if (!user || loading || !profile) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-6 md:px-6 md:py-8">
      <h1 className="text-xl font-semibold tracking-tight text-foreground">Profile</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Complete your profile to apply to projects and receive tasks.
      </p>

      <div className="mt-6 md:hidden">
        <label htmlFor="profile-section" className="sr-only">
          Profile section
        </label>
        <select
          id="profile-section"
          value={activeSection}
          onChange={(e) => setActiveSection(e.target.value as ProfileUiSection)}
          className="h-10 w-full rounded-md border border-border bg-background px-3 text-sm"
        >
          {SECTIONS.map((s) => (
            <option key={s.id} value={s.id}>
              {s.label}
            </option>
          ))}
        </select>
      </div>

      <div className="mt-8 grid gap-10 md:grid-cols-[11rem_minmax(0,1fr)] lg:grid-cols-[12rem_minmax(0,1fr)]">
        <nav className="hidden flex-col gap-1 md:flex" aria-label="Profile sections">
          {SECTIONS.map((s) => {
            const isActive = activeSection === s.id;
            const showDot = s.showAvailabilityDot && missingAvailability;
            return (
              <button
                key={s.id}
                type="button"
                onClick={() => setActiveSection(s.id)}
                className={cn(
                  'flex w-full items-center justify-between gap-2 rounded-md px-3 py-2 text-left text-sm font-medium transition-colors',
                  isActive
                    ? 'bg-muted text-foreground'
                    : 'text-muted-foreground hover:bg-muted/70 hover:text-foreground'
                )}
              >
                <span>{s.label}</span>
                {showDot ? (
                  <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-primary" aria-hidden />
                ) : null}
              </button>
            );
          })}
        </nav>

        <div className="min-w-0 max-w-2xl space-y-6">
          <header>
            <h2 className="text-sm font-semibold text-foreground">{sectionMeta.label}</h2>
            <p className="mt-1 text-sm text-muted-foreground">{sectionMeta.hint}</p>
            {activeSection === 'schedule' && missingAvailability ? (
              <div className="mt-3 rounded-md border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive">
                <p className="font-medium">Availability incomplete</p>
                <ul className="mt-1 list-inside list-disc text-xs">
                  {!profile.availability.timezone.trim() && <li>Time zone</li>}
                  {!profile.availability.preferredWeeklyHours.trim() && <li>Preferred weekly hours</li>}
                </ul>
              </div>
            ) : null}
          </header>

          <div className="space-y-8">
            {activeSection === 'about' && (
              <ResumeTab profile={profile} setProfile={setProfileSafe} authEmail={user.email} />
            )}
            {activeSection === 'location' && (
              <LocationTab profile={profile} setProfile={setProfileSafe} />
            )}
            {activeSection === 'schedule' && (
              <>
                <ProfileSection
                  title="Availability"
                  description="Timezone, hours per week, and typical working hours."
                >
                  <AvailabilityTab profile={profile} setProfile={setProfileSafe} />
                </ProfileSection>
                <ProfileSection
                  title="Work preferences"
                  description="Domains and compensation expectations."
                >
                  <WorkPreferencesTab profile={profile} setProfile={setProfileSafe} />
                </ProfileSection>
              </>
            )}
            {activeSection === 'account' && (
              <>
                <ProfileSection title="Notifications" description="Channels and types of updates.">
                  <CommunicationsTab profile={profile} setProfile={setProfileSafe} />
                </ProfileSection>
                <ProfileSection title="Account & payouts" description="Profile photo, payouts, email, and deletion.">
                  <AccountTab profile={profile} setProfile={setProfileSafe} />
                </ProfileSection>
              </>
            )}
          </div>

          <ProfileTabActions
            onSave={handleSave}
            onReset={handleReset}
            saving={saving}
            autosaving={autosaving}
          />
        </div>
      </div>
    </div>
  );
}

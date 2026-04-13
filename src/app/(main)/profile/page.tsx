'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';

import { useAuthStore } from '@/lib/store';
import { api, ApiRequestError } from '@/lib/services/api';
import { validateProfileTab } from '@/lib/profileValidation';
import {
  getResumeAutoSaveBlockers,
  serializeResumeForAutosave,
  RESUME_AUTOSAVE_DEBOUNCE_MS,
} from '@/lib/profileResumeAutosave';
import type { MockWorkerProfile, ProfileTabId } from '@/types/profile';

import { ProfileTabActions } from '@/components/profile/ProfileTabActions';
import { ProfileSection } from '@/components/profile/ProfileSection';
import { ResumeTab } from '@/components/profile/ResumeTab';
import { CommunicationsTab } from '@/components/profile/CommunicationsTab';
import { AccountTab, DeleteAccountSection } from '@/components/profile/AccountTab';

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
  const { user, updateUser, checkAuth, authReady, isLoading: authSessionLoading } = useAuthStore();
  const [profile, setProfile] = useState<MockWorkerProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [autosaving, setAutosaving] = useState(false);

  const profileRef = useRef<MockWorkerProfile | null>(null);
  profileRef.current = profile;

  const persistMutex = useRef(false);
  const autosaveMutex = useRef(false);
  const profileHydrated = useRef(false);
  const lastSavedResumeSerializedRef = useRef<string>('');
  const resumeAutosaveTimerRef = useRef<number | null>(null);

  const reloadFromStorage = useCallback(async () => {
    const u = useAuthStore.getState().user;
    if (!u) return;
    const p = await api.getWorkerProfile(u.id, u);
    setProfile(p);
    profileHydrated.current = true;
    lastSavedResumeSerializedRef.current = serializeResumeForAutosave(p);
  }, []);

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
    if (!authReady || authSessionLoading) return;
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
        profileHydrated.current = true;
        lastSavedResumeSerializedRef.current = serializeResumeForAutosave(p);
        setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [authReady, authSessionLoading, userId, router]);

  useEffect(() => {
    profileHydrated.current = false;
  }, [userId]);

  // Autosave Resume (includes languages) after idle debounce.
  useEffect(() => {
    if (!user || !profile) return;
    if (!profileHydrated.current) return;
    if (saving) return;

    const current = serializeResumeForAutosave(profile);
    if (current === lastSavedResumeSerializedRef.current) return;

    if (resumeAutosaveTimerRef.current != null) {
      window.clearTimeout(resumeAutosaveTimerRef.current);
    }

    resumeAutosaveTimerRef.current = window.setTimeout(() => {
      const pNow = profileRef.current;
      if (!pNow) return;
      if (!user) return;
      if (persistMutex.current) return;
      if (autosaveMutex.current) return;

      const blocker = getResumeAutoSaveBlockers(pNow);
      if (blocker) {
        if (typeof console !== 'undefined' && console.info) {
          console.info('[2une][profile] resume autosave blocked', { blocker });
        }
        return;
      }

      autosaveMutex.current = true;
      setAutosaving(true);
      if (typeof console !== 'undefined' && console.info) {
        console.info('[2une][profile] resume autosave start');
      }
      void (async () => {
        try {
          await api.saveWorkerProfile(user.id, pNow, 'Resume');
          const uAfter = useAuthStore.getState().user;
          if (uAfter) {
            const fresh = await api.getWorkerProfile(uAfter.id, uAfter);
            setProfile(fresh);
            lastSavedResumeSerializedRef.current = serializeResumeForAutosave(fresh);
          } else {
            lastSavedResumeSerializedRef.current = serializeResumeForAutosave(pNow);
          }
          if (typeof window !== 'undefined') {
            window.dispatchEvent(new Event('2une-profile-saved'));
          }
          if (typeof console !== 'undefined' && console.info) {
            console.info('[2une][profile] resume autosave success');
          }
        } catch (e) {
          if (typeof console !== 'undefined' && console.warn) {
            const msg = e instanceof ApiRequestError ? `${e.code} ${e.message}` : e instanceof Error ? e.message : String(e);
            console.warn('[2une][profile] resume autosave failed', msg);
          }
        } finally {
          autosaveMutex.current = false;
          setAutosaving(false);
        }
      })();
    }, RESUME_AUTOSAVE_DEBOUNCE_MS);

    return () => {
      if (resumeAutosaveTimerRef.current != null) {
        window.clearTimeout(resumeAutosaveTimerRef.current);
        resumeAutosaveTimerRef.current = null;
      }
    };
  }, [profile, saving, user]);

  const handleSave = async () => {
    if (!user || !profile) return;
    if (persistMutex.current) {
      toast.message('Please wait for the save in progress to finish.');
      return;
    }
    const tabs: ProfileTabId[] = ['Resume', 'Communications', 'Account'];

    for (const tab of tabs) {
      const err = validateProfileTab(tab, profile);
      if (err) {
        toast.error(err);
        return;
      }
    }

    const toSave = profile;

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

      const u = useAuthStore.getState().user;
      if (u) {
        const fresh = await api.getWorkerProfile(u.id, u);
        setProfile(fresh);
        lastSavedResumeSerializedRef.current = serializeResumeForAutosave(fresh);
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

  if (!authReady || authSessionLoading || !user || loading || !profile) {
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
        Keep your profile up to date to get matched with the right tasks.
      </p>

      <div className="mt-8 min-w-0 max-w-2xl space-y-8">
        <AccountTab profile={profile} setProfile={setProfileSafe} />
        <ResumeTab profile={profile} setProfile={setProfileSafe} authEmail={user.email} />

        <ProfileSection title="Notifications" description="Channels and types of updates.">
          <CommunicationsTab profile={profile} setProfile={setProfileSafe} />
        </ProfileSection>
        {/*
        <ProfileSection title="Account & payouts" description="Profile photo, payouts, email, and deletion.">
          <AccountTab profile={profile} setProfile={setProfileSafe} />
        </ProfileSection>
        */}

        {/* Location + Schedule are commented out for now (per request). */}
        {/*
        <LocationTab profile={profile} setProfile={setProfileSafe} />
        <ProfileSection title="Availability" description="Timezone, hours per week, and typical working hours.">
          <AvailabilityTab profile={profile} setProfile={setProfileSafe} />
        </ProfileSection>
        <ProfileSection title="Work preferences" description="Domains and compensation expectations.">
          <WorkPreferencesTab profile={profile} setProfile={setProfileSafe} />
        </ProfileSection>
        */}

        <DeleteAccountSection />

        <ProfileTabActions
          onSave={handleSave}
          onReset={handleReset}
          saving={saving}
          autosaving={autosaving}
        />
      </div>
    </div>
  );
}

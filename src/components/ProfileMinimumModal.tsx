'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { Loader2, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

import { useAuthStore } from '@/lib/store';
import {
  api,
  ApiRequestError,
  MINIMUM_PROFILE_MODAL_DISMISSED_KEY,
} from '@/lib/services/api';
import { LANGUAGE_CATALOG, profileLanguageLabel } from '@/lib/languagesCatalog';
import { PROFICIENCY_LEVELS, PROF_SELECT_NONE } from '@/components/profile/constants';
import type { LanguageProficiencyLevel } from '@/types/profile';
import { newId } from '@/types/profile';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

/** Keeps language Select controlled; Base UI treats `undefined` as uncontrolled. */
const LANG_SELECT_NONE = '__lang_none__';

type ModalLangRow = {
  id: string;
  code: string;
  speakLevel: string;
  writeLevel: string;
};

const emptyLangRow = (): ModalLangRow => ({
  id: newId(),
  code: '',
  speakLevel: '',
  writeLevel: '',
});

export function ProfileMinimumModal() {
  const { user, checkAuth } = useAuthStore();
  const [open, setOpen] = useState(false);
  const [gap, setGap] = useState<{
    showBanner: boolean;
    missingPhone: boolean;
    missingLanguages: boolean;
  } | null>(null);
  const [loadingGap, setLoadingGap] = useState(true);
  const [saving, setSaving] = useState(false);
  const [phone, setPhone] = useState('');
  const [languageRows, setLanguageRows] = useState<ModalLangRow[]>([emptyLangRow()]);
  const [linkedinUrl, setLinkedinUrl] = useState('');
  const [linkedinImporting, setLinkedinImporting] = useState(false);
  /** Avoid treating programmatic close after save like “Not now” (session dismiss). */
  const closingAfterSaveRef = useRef(false);

  const loadGap = useCallback(async () => {
    if (!user) {
      setGap(null);
      setOpen(false);
      setLoadingGap(false);
      return;
    }
    setLoadingGap(true);
    const result = await api.getProfileMinimumDetailsGap();
    setGap(
      result ?? {
        showBanner: false,
        missingPhone: false,
        missingLanguages: false,
      },
    );
    setLoadingGap(false);
  }, [user]);

  useEffect(() => {
    void loadGap();
  }, [loadGap]);

  useEffect(() => {
    const onSaved = () => void loadGap();
    window.addEventListener('2une-profile-saved', onSaved);
    return () => window.removeEventListener('2une-profile-saved', onSaved);
  }, [loadGap]);

  useEffect(() => {
    if (loadingGap || !user || !gap?.showBanner) {
      if (!gap?.showBanner) setOpen(false);
      return;
    }
    if (typeof window === 'undefined') return;
    const dismissed = sessionStorage.getItem(MINIMUM_PROFILE_MODAL_DISMISSED_KEY);
    if (dismissed) {
      setOpen(false);
      return;
    }
    setOpen(true);
  }, [loadingGap, user, gap?.showBanner]);

  const wasOpenRef = useRef(false);
  useEffect(() => {
    if (open && !wasOpenRef.current) {
      setPhone('');
      setLanguageRows([emptyLangRow()]);
      setLinkedinUrl('');
    }
    wasOpenRef.current = open;
  }, [open]);

  const updateLangRow = (id: string, patch: Partial<ModalLangRow>) => {
    setLanguageRows((rows) => rows.map((row) => (row.id === id ? { ...row, ...patch } : row)));
  };

  const removeLangRow = (id: string) => {
    setLanguageRows((rows) => (rows.length <= 1 ? rows : rows.filter((r) => r.id !== id)));
  };

  const addLangRow = () => {
    setLanguageRows((rows) => [...rows, emptyLangRow()]);
  };

  const handleLinkedinImport = async () => {
    const url = linkedinUrl.trim();
    if (!url) {
      toast.error('Paste your LinkedIn profile URL.');
      return;
    }
    setLinkedinImporting(true);
    try {
      await api.importLinkedinProfile(url);
      toast.success('LinkedIn profile imported.');
      await checkAuth();
      window.dispatchEvent(new Event('2une-profile-saved'));
      setLinkedinUrl('');
    } catch (err) {
      const msg =
        err instanceof ApiRequestError
          ? err.message
          : err instanceof Error
            ? err.message
            : 'Could not import LinkedIn profile.';
      toast.error(msg);
    } finally {
      setLinkedinImporting(false);
    }
  };

  const dismissForSession = () => {
    if (typeof window !== 'undefined') {
      sessionStorage.setItem(MINIMUM_PROFILE_MODAL_DISMISSED_KEY, '1');
    }
    setOpen(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!gap) return;
    const trimmedPhone = phone.trim();
    if (gap.missingPhone && !trimmedPhone) {
      toast.error('Enter your phone number.');
      return;
    }

    const resolvedLanguages: Array<{ language: string; speakLevel?: string; writeLevel?: string }> = [];
    if (gap.missingLanguages) {
      for (const row of languageRows) {
        if (!row.code.trim()) continue;
        const catalog = LANGUAGE_CATALOG.find((r) => r.code === row.code);
        const language = catalog ? profileLanguageLabel(catalog) : '';
        if (!language) continue;
        resolvedLanguages.push({
          language,
          speakLevel: row.speakLevel.trim() || undefined,
          writeLevel: row.writeLevel.trim() || undefined,
        });
      }
      if (resolvedLanguages.length === 0) {
        toast.error('Add at least one language from the list.');
        return;
      }
    }

    setSaving(true);
    try {
      await api.saveMinimumProfileDetails({
        ...(gap.missingPhone ? { phone: trimmedPhone } : {}),
        ...(gap.missingLanguages && resolvedLanguages.length > 0 ? { languages: resolvedLanguages } : {}),
      });
      toast.success('Profile updated.');
      if (typeof window !== 'undefined') {
        sessionStorage.removeItem(MINIMUM_PROFILE_MODAL_DISMISSED_KEY);
      }
      window.dispatchEvent(new Event('2une-profile-saved'));
      await loadGap();
      closingAfterSaveRef.current = true;
      setOpen(false);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Could not save.');
    } finally {
      setSaving(false);
    }
  };

  if (!user || loadingGap || !gap?.showBanner) return null;

  return (
    <Dialog
      open={open}
      onOpenChange={(next, eventDetails) => {
        if (next) {
          setOpen(true);
          return;
        }
        if (closingAfterSaveRef.current) {
          closingAfterSaveRef.current = false;
          setOpen(false);
          return;
        }
        if (eventDetails?.reason === 'escape-key') {
          dismissForSession();
          return;
        }
        setOpen(false);
      }}
      modal
      disablePointerDismissal
    >
      <DialogContent
        showCloseButton={false}
        className="max-h-[min(90vh,calc(100%-2rem))] max-w-[calc(100%-2rem)] overflow-y-auto sm:max-w-xl"
      >
        <form onSubmit={(e) => void handleSubmit(e)}>
          <DialogHeader>
            <DialogTitle>Finish setting up your profile</DialogTitle>
            <DialogDescription>
              {gap.missingPhone && gap.missingLanguages
                ? 'Add your phone number and languages (with speak/write levels) so we can match you to projects.'
                : gap.missingPhone
                  ? 'Add your phone number so we can reach you about projects.'
                  : 'Add at least one language and how well you speak and write it, same as on your profile.'}
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-2">
            {gap.missingPhone ? (
              <div className="space-y-2">
                <Label htmlFor="minimum-profile-phone" className="text-xs text-muted-foreground">
                  Phone number
                </Label>
                <Input
                  id="minimum-profile-phone"
                  type="tel"
                  autoComplete="tel"
                  placeholder="Your mobile number"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  maxLength={40}
                  className="h-10 bg-background text-sm"
                />
              </div>
            ) : null}

            {gap.missingLanguages ? (
              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground">Languages</Label>
                <p className="text-xs text-muted-foreground">
                  Add each language and rate how well you speak and write it (optional levels).
                </p>
                <div className="space-y-3">
                  {languageRows.map((row) => (
                    <div key={row.id} className="flex flex-wrap items-end gap-2">
                      <div className="min-w-[160px] flex-1 space-y-1">
                        <div className="text-xs font-medium text-muted-foreground">Language</div>
                        <Select
                          value={row.code || LANG_SELECT_NONE}
                          onValueChange={(v) =>
                            updateLangRow(row.id, { code: v === LANG_SELECT_NONE ? '' : (v ?? '') })
                          }
                        >
                          <SelectTrigger className="h-9 w-full min-w-0 border-border bg-background text-sm">
                            <SelectValue placeholder="Select a language" />
                          </SelectTrigger>
                          <SelectContent className="max-h-60 min-w-[var(--anchor-width)]">
                            <SelectItem value={LANG_SELECT_NONE} className="text-muted-foreground">
                              Select a language
                            </SelectItem>
                            {LANGUAGE_CATALOG.map((opt) => (
                              <SelectItem key={opt.code} value={opt.code}>
                                {profileLanguageLabel(opt)}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="w-[130px] space-y-1">
                        <div className="text-xs font-medium text-muted-foreground">Speak</div>
                        <Select
                          value={row.speakLevel ? row.speakLevel : PROF_SELECT_NONE}
                          onValueChange={(v) =>
                            updateLangRow(row.id, {
                              speakLevel: v === PROF_SELECT_NONE ? '' : (v as LanguageProficiencyLevel),
                            })
                          }
                        >
                          <SelectTrigger className="h-9 border-border bg-background text-[13px]">
                            <SelectValue placeholder="Level" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value={PROF_SELECT_NONE}>Not set</SelectItem>
                            {PROFICIENCY_LEVELS.map((opt) => (
                              <SelectItem key={opt.value} value={opt.value}>
                                {opt.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="w-[130px] space-y-1">
                        <div className="text-xs font-medium text-muted-foreground">Write</div>
                        <Select
                          value={row.writeLevel ? row.writeLevel : PROF_SELECT_NONE}
                          onValueChange={(v) =>
                            updateLangRow(row.id, {
                              writeLevel: v === PROF_SELECT_NONE ? '' : (v as LanguageProficiencyLevel),
                            })
                          }
                        >
                          <SelectTrigger className="h-9 border-border bg-background text-[13px]">
                            <SelectValue placeholder="Level" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value={PROF_SELECT_NONE}>Not set</SelectItem>
                            {PROFICIENCY_LEVELS.map((opt) => (
                              <SelectItem key={`w-${opt.value}`} value={opt.value}>
                                {opt.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        className="h-9 shrink-0"
                        disabled={languageRows.length <= 1}
                        onClick={() => removeLangRow(row.id)}
                        aria-label="Remove language"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  className="h-8 px-0 text-sm font-medium text-primary hover:bg-primary/10 hover:text-primary"
                  onClick={addLangRow}
                >
                  + Add language
                </Button>
              </div>
            ) : null}

            {!user.linkedinConnected ? (
              <div className="space-y-2 rounded-lg border border-border bg-muted/20 p-3">
                <Label htmlFor="minimum-profile-linkedin" className="text-xs text-muted-foreground">
                  LinkedIn (optional)
                </Label>
                <p className="text-xs text-muted-foreground">
                  Paste your public profile URL (for example https://www.linkedin.com/in/your-handle). Optional — you still
                  need phone and languages when those are required above.
                </p>
                <div className="flex flex-col gap-2 sm:flex-row sm:items-end">
                  <Input
                    id="minimum-profile-linkedin"
                    type="url"
                    autoComplete="url"
                    placeholder="https://www.linkedin.com/in/…"
                    value={linkedinUrl}
                    onChange={(e) => setLinkedinUrl(e.target.value)}
                    className="h-10 flex-1 bg-background text-sm"
                  />
                  <Button
                    type="button"
                    variant="secondary"
                    className="h-10 shrink-0"
                    disabled={linkedinImporting}
                    onClick={() => void handleLinkedinImport()}
                  >
                    {linkedinImporting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                    Import profile
                  </Button>
                </div>
              </div>
            ) : null}
          </div>

          <DialogFooter className="gap-2 sm:justify-between sm:gap-2">
            <Button type="button" variant="ghost" className="sm:mr-auto" onClick={dismissForSession}>
              Not now
            </Button>
            <Button type="submit" disabled={saving}>
              {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Save and continue
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

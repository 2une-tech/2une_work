'use client';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import type { LanguageProficiencyLevel, MockLanguageEntry, MockWorkerProfile } from '@/types/profile';
import { newId } from '@/types/profile';
import { LANGUAGE_CATALOG, profileLanguageLabel } from '@/lib/languagesCatalog';
import { PROFICIENCY_LEVELS, PROF_SELECT_NONE } from './constants';

type Props = {
  profile: MockWorkerProfile;
  setProfile: React.Dispatch<React.SetStateAction<MockWorkerProfile>>;
  authEmail: string;
};

const emptyLanguage = (): MockLanguageEntry => ({
  id: newId(),
  language: '',
  speakLevel: '',
  writeLevel: '',
});

export function ResumeTab({ profile, setProfile, authEmail }: Props) {
  const r = profile.resume;

  const setResume = (patch: Partial<MockWorkerProfile['resume']>) => {
    setProfile((p) => ({ ...p, resume: { ...p.resume, ...patch } }));
  };

  const updateLanguage = (id: string, patch: Partial<MockLanguageEntry>) => {
    setResume({
      languageEntries: r.languageEntries.map((row) => (row.id === id ? { ...row, ...patch } : row)),
    });
  };

  const removeLanguage = (id: string) => {
    setResume({ languageEntries: r.languageEntries.filter((e) => e.id !== id) });
  };

  const addLanguage = () => setResume({ languageEntries: [...r.languageEntries, emptyLanguage()] });

  return (
    <div className="space-y-12">
      <div className="space-y-4">
        <div>
          <label className="text-[13px] font-bold text-foreground block mb-1">Full Name *</label>
          <Input
            value={r.fullName}
            onChange={(e) => setResume({ fullName: e.target.value })}
            className="h-9 border-border bg-background text-[13px]"
          />
        </div>

        <div>
          <label className="text-[13px] font-bold text-foreground block mb-1">Email *</label>
          <Input
            readOnly
            type="email"
            value={r.displayEmail}
            className="h-9 border-border bg-muted/30 text-[13px] text-muted-foreground"
          />
          <p className="text-[11px] text-muted-foreground mt-1">Signed in as {authEmail}</p>
        </div>

        <div>
          <label className="text-[13px] font-bold text-foreground block mb-1">Phone</label>
          <div className="flex max-w-md">
            <Input
              value={r.phoneCountryLabel}
              onChange={(e) => setResume({ phoneCountryLabel: e.target.value })}
              className="h-9 w-[100px] rounded-r-none border-border bg-muted/50 text-[13px] shrink-0"
              placeholder="+91"
              aria-label="Country or dial code"
            />
            <Input
              value={r.phone}
              onChange={(e) => setResume({ phone: e.target.value })}
              className="h-9 rounded-l-none border-border bg-background text-[13px] flex-1"
              placeholder="Phone number"
              inputMode="tel"
            />
          </div>
        </div>

        <div>
          <h3 className="text-[13px] font-bold text-foreground mb-1">Languages</h3>
          <p className="mb-3 text-[12px] text-muted-foreground">Add each language and rate how well you speak and write it.</p>
          <datalist id="2une-language-catalog">
            {LANGUAGE_CATALOG.map((opt) => {
              const label = profileLanguageLabel(opt);
              return <option key={opt.code} value={label} />;
            })}
          </datalist>
          <div className="space-y-3">
            {r.languageEntries.map((row) => (
              <div key={row.id} className="flex flex-wrap items-end gap-2">
                <div className="min-w-[140px] flex-1 space-y-1">
                  <div className="text-xs font-medium text-muted-foreground">Language</div>
                  <Input
                    list="2une-language-catalog"
                    value={row.language}
                    onChange={(e) => updateLanguage(row.id, { language: e.target.value })}
                    className="h-9 border-border bg-background"
                    placeholder="e.g. Spanish"
                  />
                </div>
                <div className="w-[140px] space-y-1">
                  <div className="text-xs font-medium text-muted-foreground">Speak</div>
                  <Select
                    value={row.speakLevel ? row.speakLevel : PROF_SELECT_NONE}
                    onValueChange={(v) =>
                      updateLanguage(row.id, {
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
                <div className="w-[140px] space-y-1">
                  <div className="text-xs font-medium text-muted-foreground">Write</div>
                  <Select
                    value={row.writeLevel ? row.writeLevel : PROF_SELECT_NONE}
                    onValueChange={(v) =>
                      updateLanguage(row.id, {
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
                <Button type="button" variant="outline" size="sm" className="h-9" onClick={() => removeLanguage(row.id)}>
                  Remove
                </Button>
              </div>
            ))}
          </div>
          <Button
            type="button"
            variant="ghost"
            className="mt-2 h-8 px-0 text-[13px] font-medium text-primary hover:bg-primary/10 hover:text-primary"
            onClick={addLanguage}
          >
            + Add language
          </Button>
        </div>

        {/*
        <div>
          <h3 className="text-[16px] font-bold text-foreground mb-2">Skills</h3>
          <Textarea
            value={r.skills}
            onChange={(e) => setResume({ skills: e.target.value })}
            className="h-20 resize-none border-border bg-background"
          />
        </div>
        */}
      </div>
    </div>
  );
}


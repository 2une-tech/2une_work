'use client';

import { useRef } from 'react';
import { CheckCircle2, Trash2, UploadCloud } from 'lucide-react';
import { toast } from 'sonner';
import { api, ApiRequestError } from '@/lib/services/api';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import type {
  DemographicsOption,
  LanguageProficiencyLevel,
  MockEducation,
  MockExperience,
  MockLanguageEntry,
  MockProject,
  MockWorkerProfile,
} from '@/types/profile';
import { newId } from '@/types/profile';
import { PROFICIENCY_LEVELS, PROF_SELECT_NONE, YEAR_OPTIONS } from './constants';

type Props = {
  profile: MockWorkerProfile;
  setProfile: React.Dispatch<React.SetStateAction<MockWorkerProfile>>;
  authEmail: string;
};

const emptyEducation = (): MockEducation => ({
  id: newId(),
  school: '',
  degree: '',
  fieldOfStudy: '',
  grade: '',
  startYear: String(new Date().getFullYear() - 4),
  endYear: String(new Date().getFullYear()),
  description: '',
});

const emptyExperience = (): MockExperience => ({
  id: newId(),
  company: '',
  role: '',
  startDate: '',
  endDate: '',
  city: '',
  description: '',
});

const emptyProject = (): MockProject => ({
  id: newId(),
  name: '',
  url: '',
  description: '',
});

const emptyLanguage = (): MockLanguageEntry => ({
  id: newId(),
  language: '',
  speakLevel: '',
  writeLevel: '',
});

export function ResumeTab({ profile, setProfile, authEmail }: Props) {
  const fileRef = useRef<HTMLInputElement>(null);
  const r = profile.resume;

  const setResume = (patch: Partial<MockWorkerProfile['resume']>) => {
    setProfile((p) => ({ ...p, resume: { ...p.resume, ...patch } }));
  };

  const updateEducation = (id: string, patch: Partial<MockEducation>) => {
    setResume({
      education: r.education.map((row) => (row.id === id ? { ...row, ...patch } : row)),
    });
  };

  const removeEducation = (id: string) => {
    setResume({ education: r.education.filter((e) => e.id !== id) });
  };

  const addEducation = () => setResume({ education: [...r.education, emptyEducation()] });

  const updateExperience = (id: string, patch: Partial<MockExperience>) => {
    setResume({
      experience: r.experience.map((row) => (row.id === id ? { ...row, ...patch } : row)),
    });
  };

  const removeExperience = (id: string) => {
    setResume({ experience: r.experience.filter((e) => e.id !== id) });
  };

  const addExperience = () => setResume({ experience: [...r.experience, emptyExperience()] });

  const updateProject = (id: string, patch: Partial<MockProject>) => {
    setResume({
      projects: r.projects.map((row) => (row.id === id ? { ...row, ...patch } : row)),
    });
  };

  const removeProject = (id: string) => {
    setResume({ projects: r.projects.filter((e) => e.id !== id) });
  };

  const addProject = () => setResume({ projects: [...r.projects, emptyProject()] });

  const updateLanguage = (id: string, patch: Partial<MockLanguageEntry>) => {
    setResume({
      languageEntries: r.languageEntries.map((row) => (row.id === id ? { ...row, ...patch } : row)),
    });
  };

  const removeLanguage = (id: string) => {
    setResume({ languageEntries: r.languageEntries.filter((e) => e.id !== id) });
  };

  const addLanguage = () => setResume({ languageEntries: [...r.languageEntries, emptyLanguage()] });

  const setDemographics = (value: DemographicsOption) => {
    setResume({ demographics: value });
  };

  const onResumeFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const { fileName } = await api.uploadResumeFile(file);
      setResume({ resumeUploaded: true, resumeFileName: fileName });
      toast.success(`Resume "${fileName}" uploaded.`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Upload failed (configure Azure on the API for SAS uploads)');
    }
    e.target.value = '';
  };

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
            type="email"
            value={r.displayEmail}
            onChange={(e) => setResume({ displayEmail: e.target.value })}
            className="h-9 border-border bg-background text-[13px] text-foreground"
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
              placeholder="+1"
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
          <p className="mb-3 text-[12px] text-muted-foreground">
            Add each language and rate how well you speak and write it.
          </p>
          <div className="space-y-3">
            {r.languageEntries.map((row) => (
              <div key={row.id} className="flex flex-wrap items-end gap-2">
                <div className="min-w-[140px] flex-1 space-y-1">
                  <div className="text-xs font-medium text-muted-foreground">Language</div>
                  <Input
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

        <div>
          <label className="text-[13px] font-bold text-foreground block mb-1">LinkedIn</label>
          {r.linkedinConnected ? (
            <>
              <p className="mb-2 text-[12px] text-muted-foreground">
                {r.linkedinUrl?.trim()
                  ? 'Your LinkedIn account is connected. This URL comes from your connection and cannot be edited here.'
                  : 'Your LinkedIn account is connected with Sign in with LinkedIn. LinkedIn’s OpenID API does not include your public /in/ profile URL.'}
              </p>
              {r.linkedinUrl?.trim() ? (
                <Input
                  readOnly
                  placeholder="https://linkedin.com/in/username"
                  value={r.linkedinUrl}
                  className="h-9 border-border bg-muted/30 text-[13px] text-muted-foreground"
                />
              ) : (
                <p className="rounded-md border border-border bg-muted/30 px-3 py-2 text-[13px] text-muted-foreground">
                  Profile URL not provided by LinkedIn for this connection.
                </p>
              )}
            </>
          ) : (
            <>
              <p className="mb-2 text-[12px] text-muted-foreground">
                Connect with LinkedIn while signed in to 2une — we only link that LinkedIn identity to your existing
                account (we never create a second 2une user). Each LinkedIn account can link to at most one 2une
                profile.
              </p>
              <p className="mb-2 text-[12px] text-muted-foreground">
                LinkedIn’s OpenID API only shares basic identity (e.g. name, photo URL, email when allowed). It does not
                fill work history, education, skills, or your full resume — you still enter those here. We only set your
                display name from LinkedIn if it was still empty.
              </p>
              <p className="mb-2 text-[12px] text-muted-foreground">
                During onboarding you can still paste a public profile URL for the separate import flow (demo data
                today).
              </p>
              <Button
                type="button"
                variant="outline"
                className="h-9 text-[13px] font-medium border-border bg-background"
                onClick={() => {
                  void (async () => {
                    try {
                      const { authorizationUrl } = await api.getLinkedinOAuthUrl();
                      window.location.assign(authorizationUrl);
                    } catch (e) {
                      if (e instanceof ApiRequestError && e.code === 'LINKEDIN_NOT_CONFIGURED') {
                        toast.error('LinkedIn sign-in is not configured on the server yet.');
                      } else {
                        const msg = e instanceof Error ? e.message : 'Could not start LinkedIn sign-in.';
                        toast.error(msg);
                      }
                    }
                  })();
                }}
              >
                Connect LinkedIn
              </Button>
            </>
          )}
        </div>
      </div>

      <div>
        <label className="text-[13px] font-bold text-foreground block mb-2">Resume upload</label>
        <input ref={fileRef} type="file" accept=".pdf,.doc,.docx" className="hidden" onChange={onResumeFile} />
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          className="flex w-full cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-border bg-muted/20 p-12 text-left transition-colors hover:bg-muted/40"
        >
          <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary text-primary-foreground">
            {r.resumeUploaded ? <CheckCircle2 className="w-6 h-6" /> : <UploadCloud className="w-6 h-6" />}
          </div>
          <p className="text-[14px] font-bold text-foreground mb-1">
            {r.resumeFileName || 'Click to choose a file'}
          </p>
          <p className="text-[12px] text-muted-foreground">
            {r.resumeUploaded ? 'Uploaded successfully' : 'PDF or Word'}
          </p>
        </button>
      </div>

      <div>
        <h3 className="text-[16px] font-bold text-foreground mb-4">Education</h3>
        {r.education.map((ed) => (
          <div key={ed.id} className="border border-border rounded-xl p-5 mb-4 bg-background">
            <div className="flex justify-end mb-2">
              <button type="button" className="text-red-500 hover:text-red-600" onClick={() => removeEducation(ed.id)}>
                <span className="sr-only">Remove</span>
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <label className="text-[12px] font-bold text-foreground block mb-1">School/University</label>
                <Input
                  value={ed.school}
                  onChange={(e) => updateEducation(ed.id, { school: e.target.value })}
                  className="h-9 border-border"
                />
              </div>
              <div>
                <label className="text-[12px] font-bold text-foreground block mb-1">Degree</label>
                <Input
                  value={ed.degree}
                  onChange={(e) => updateEducation(ed.id, { degree: e.target.value })}
                  className="h-9 border-border"
                />
              </div>
              <div>
                <label className="text-[12px] font-bold text-foreground block mb-1">Field of study</label>
                <Input
                  value={ed.fieldOfStudy}
                  onChange={(e) => updateEducation(ed.id, { fieldOfStudy: e.target.value })}
                  className="h-9 border-border"
                />
              </div>
              <div>
                <label className="text-[12px] font-bold text-foreground block mb-1">Grade (CGPA)</label>
                <Input
                  value={ed.grade}
                  onChange={(e) => updateEducation(ed.id, { grade: e.target.value })}
                  className="h-9 border-border"
                />
              </div>
              <div>
                <label className="text-[12px] font-bold text-foreground block mb-1">Start Year</label>
                <Select value={ed.startYear} onValueChange={(v) => updateEducation(ed.id, { startYear: v ?? '' })}>
                  <SelectTrigger className="h-9">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="max-h-60">
                    {YEAR_OPTIONS.map((y) => (
                      <SelectItem key={y} value={y}>
                        {y}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-[12px] font-bold text-foreground block mb-1">End Year</label>
                <Select value={ed.endYear} onValueChange={(v) => updateEducation(ed.id, { endYear: v ?? '' })}>
                  <SelectTrigger className="h-9">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="max-h-60">
                    {YEAR_OPTIONS.map((y) => (
                      <SelectItem key={y} value={y}>
                        {y}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <label className="text-[12px] font-bold text-foreground block mb-1">Description</label>
              <Textarea
                placeholder="Core coursework, clubs, etc."
                value={ed.description}
                onChange={(e) => updateEducation(ed.id, { description: e.target.value })}
                className="h-20 resize-none border-border"
              />
            </div>
          </div>
        ))}
        <Button
          type="button"
          variant="ghost"
          className="h-8 px-0 text-[13px] font-medium text-primary hover:bg-primary/10 hover:text-primary"
          onClick={addEducation}
        >
          + Add education
        </Button>
      </div>

      <div>
        <h3 className="text-[16px] font-bold text-foreground mb-4">Work Experience</h3>
        {r.experience.map((ex) => (
          <div key={ex.id} className="border border-border rounded-xl p-5 mb-4 bg-background">
            <div className="flex justify-end mb-2">
              <button type="button" className="text-red-500 hover:text-red-600" onClick={() => removeExperience(ex.id)}>
                <span className="sr-only">Remove</span>
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <label className="text-[12px] font-bold text-foreground block mb-1">Company</label>
                <Input
                  value={ex.company}
                  onChange={(e) => updateExperience(ex.id, { company: e.target.value })}
                  className="h-9 border-border"
                />
              </div>
              <div>
                <label className="text-[12px] font-bold text-foreground block mb-1">Role</label>
                <Input
                  value={ex.role}
                  onChange={(e) => updateExperience(ex.id, { role: e.target.value })}
                  className="h-9 border-border"
                />
              </div>
              <div>
                <label className="text-[12px] font-bold text-foreground block mb-1">Start date</label>
                <Input
                  placeholder="MM/YYYY"
                  value={ex.startDate}
                  onChange={(e) => updateExperience(ex.id, { startDate: e.target.value })}
                  className="h-9 border-border"
                />
              </div>
              <div>
                <label className="text-[12px] font-bold text-foreground block mb-1">End date</label>
                <Input
                  placeholder="MM/YYYY"
                  value={ex.endDate}
                  onChange={(e) => updateExperience(ex.id, { endDate: e.target.value })}
                  className="h-9 border-border"
                />
              </div>
              <div className="col-span-2">
                <label className="text-[12px] font-bold text-foreground block mb-1">City</label>
                <Input
                  value={ex.city}
                  onChange={(e) => updateExperience(ex.id, { city: e.target.value })}
                  className="h-9 border-border"
                />
              </div>
            </div>
            <div>
              <label className="text-[12px] font-bold text-foreground block mb-1">Description</label>
              <Textarea
                value={ex.description}
                onChange={(e) => updateExperience(ex.id, { description: e.target.value })}
                className="h-24 resize-none border-border"
              />
            </div>
          </div>
        ))}
        <Button
          type="button"
          variant="ghost"
          className="h-8 px-0 text-[13px] font-medium text-primary hover:bg-primary/10 hover:text-primary"
          onClick={addExperience}
        >
          + Add work experience
        </Button>
      </div>

      <div>
        <h3 className="text-[16px] font-bold text-foreground mb-4">Projects</h3>
        {r.projects.map((pr) => (
          <div key={pr.id} className="border border-border rounded-xl p-5 mb-4 bg-background">
            <div className="flex justify-end mb-2">
              <button type="button" className="text-red-500 hover:text-red-600" onClick={() => removeProject(pr.id)}>
                <span className="sr-only">Remove</span>
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <label className="text-[12px] font-bold text-foreground block mb-1">Project Name</label>
                <Input
                  value={pr.name}
                  onChange={(e) => updateProject(pr.id, { name: e.target.value })}
                  className="h-9 border-border"
                />
              </div>
              <div>
                <label className="text-[12px] font-bold text-foreground block mb-1">Project URL</label>
                <Input
                  value={pr.url}
                  onChange={(e) => updateProject(pr.id, { url: e.target.value })}
                  className="h-9 border-border"
                />
              </div>
            </div>
            <div>
              <label className="text-[12px] font-bold text-foreground block mb-1">Description</label>
              <Textarea
                value={pr.description}
                onChange={(e) => updateProject(pr.id, { description: e.target.value })}
                className="h-20 resize-none border-border"
              />
            </div>
          </div>
        ))}
        <Button
          type="button"
          variant="ghost"
          className="h-8 px-0 text-[13px] font-medium text-primary hover:bg-primary/10 hover:text-primary"
          onClick={addProject}
        >
          + Add project
        </Button>
      </div>

      <div className="space-y-8 pt-4">
        <div>
          <h3 className="text-[16px] font-bold text-foreground mb-2">Publications</h3>
          {r.publications.map((pub) => (
            <div key={pub.id} className="flex gap-2 mb-2">
              <Input
                value={pub.text}
                onChange={(e) =>
                  setResume({
                    publications: r.publications.map((p) => (p.id === pub.id ? { ...p, text: e.target.value } : p)),
                  })
                }
                className="h-9 border-border bg-background flex-1"
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="shrink-0"
                onClick={() => setResume({ publications: r.publications.filter((p) => p.id !== pub.id) })}
              >
                Remove
              </Button>
            </div>
          ))}
          <Button
            type="button"
            variant="ghost"
            className="h-8 px-0 text-[13px] font-medium text-primary hover:bg-primary/10 hover:text-primary"
            onClick={() => setResume({ publications: [...r.publications, { id: newId(), text: '' }] })}
          >
            + Add publication
          </Button>
        </div>

        <div>
          <h3 className="text-[16px] font-bold text-foreground mb-2">Certifications</h3>
          {r.certifications.map((c) => (
            <div key={c.id} className="flex gap-2 mb-2">
              <Input
                value={c.text}
                onChange={(e) =>
                  setResume({
                    certifications: r.certifications.map((x) => (x.id === c.id ? { ...x, text: e.target.value } : x)),
                  })
                }
                className="h-9 border-border bg-background flex-1"
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setResume({ certifications: r.certifications.filter((x) => x.id !== c.id) })}
              >
                Remove
              </Button>
            </div>
          ))}
          <Button
            type="button"
            variant="ghost"
            className="h-8 px-0 text-[13px] font-medium text-primary hover:bg-primary/10 hover:text-primary"
            onClick={() => setResume({ certifications: [...r.certifications, { id: newId(), text: '' }] })}
          >
            + Add certification
          </Button>
        </div>

        <div>
          <h3 className="text-[16px] font-bold text-foreground mb-4">Awards</h3>
          <div className="space-y-3 mb-3">
            {r.awards.map((award, idx) => (
              <div key={idx} className="flex gap-2">
                <Input
                  value={award}
                  onChange={(e) => {
                    const next = [...r.awards];
                    next[idx] = e.target.value;
                    setResume({ awards: next });
                  }}
                  className="h-9 border-border bg-background flex-1"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setResume({ awards: r.awards.filter((_, i) => i !== idx) })}
                >
                  Remove
                </Button>
              </div>
            ))}
          </div>
          <Button
            type="button"
            variant="ghost"
            className="h-8 px-0 text-[13px] font-medium text-primary hover:bg-primary/10 hover:text-primary"
            onClick={() => setResume({ awards: [...r.awards, ''] })}
          >
            + Add award
          </Button>
        </div>

        <div>
          <h3 className="text-[16px] font-bold text-foreground mb-4">Links</h3>
          <div className="space-y-3 mb-3">
            {r.links.map((link) => (
              <div key={link.id} className="flex items-center gap-3">
                <Input
                  value={link.label}
                  onChange={(e) =>
                    setResume({
                      links: r.links.map((l) => (l.id === link.id ? { ...l, label: e.target.value } : l)),
                    })
                  }
                  className="w-[120px] h-9 border-border bg-background text-[13px]"
                  placeholder="Label"
                />
                <Input
                  value={link.url}
                  onChange={(e) =>
                    setResume({
                      links: r.links.map((l) => (l.id === link.id ? { ...l, url: e.target.value } : l)),
                    })
                  }
                  className="h-9 border-border bg-background flex-1"
                  placeholder="URL"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setResume({ links: r.links.filter((l) => l.id !== link.id) });
                  }}
                >
                  Remove
                </Button>
              </div>
            ))}
          </div>
          <Button
            type="button"
            variant="ghost"
            className="h-8 px-0 text-[13px] font-medium text-primary hover:bg-primary/10 hover:text-primary"
            onClick={() => setResume({ links: [...r.links, { id: newId(), label: 'Link', url: '' }] })}
          >
            + Add link
          </Button>
        </div>

        <div>
          <h3 className="text-[16px] font-bold text-foreground mb-2">Skills</h3>
          <Textarea
            value={r.skills}
            onChange={(e) => setResume({ skills: e.target.value })}
            className="h-20 resize-none border-border bg-background"
          />
        </div>

        <div>
          <h3 className="text-[16px] font-bold text-foreground mb-4">Demographics</h3>
          <div className="flex flex-wrap items-center gap-6 text-[13px] text-foreground">
            {(
              [
                ['man', 'Man'],
                ['woman', 'Woman'],
                ['non_binary', 'Non-binary'],
                ['prefer_not', 'Prefer not to say'],
              ] as const
            ).map(([value, label]) => (
              <label key={value} className="flex items-center gap-2 cursor-pointer">
                <Checkbox
                  checked={r.demographics === value}
                  onCheckedChange={(checked) => {
                    if (checked) setDemographics(value);
                    else if (r.demographics === value) setResume({ demographics: '' });
                  }}
                />
                {label}
              </label>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

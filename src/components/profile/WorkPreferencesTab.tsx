'use client';

import { HelpCircle } from 'lucide-react';

import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import type { MockWorkerProfile } from '@/types/profile';
import { DOMAIN_OPTIONS } from './constants';

type Props = {
  profile: MockWorkerProfile;
  setProfile: React.Dispatch<React.SetStateAction<MockWorkerProfile>>;
};

export function WorkPreferencesTab({ profile, setProfile }: Props) {
  const wp = profile.workPreferences;

  const setWP = (patch: Partial<MockWorkerProfile['workPreferences']>) => {
    setProfile((p) => ({ ...p, workPreferences: { ...p.workPreferences, ...patch } }));
  };

  const toggleDomain = (label: string) => {
    const has = wp.domainInterests.includes(label);
    setWP({
      domainInterests: has ? wp.domainInterests.filter((d) => d !== label) : [...wp.domainInterests, label],
    });
  };

  return (
    <div className="space-y-10">
      <div>
        <h3 className="text-[14px] font-bold text-foreground mb-1 flex items-center gap-1.5">
          Domain Interests <HelpCircle className="w-3.5 h-3.5 text-muted-foreground" />
        </h3>
        <p className="text-[13px] text-foreground font-medium mb-1 mt-4">What domains are you interested in?</p>
        <p className="text-[12px] text-muted-foreground mb-4">Select all that apply:</p>
        <div className="flex flex-wrap gap-2 mb-4">
          {DOMAIN_OPTIONS.map((d) => {
            const selected = wp.domainInterests.includes(d.label);
            return (
              <button
                key={d.label}
                type="button"
                onClick={() => toggleDomain(d.label)}
                className={cn(
                  'flex items-center gap-2 px-3 py-1.5 border rounded text-[12px] transition-colors',
                  selected
                    ? 'border-primary bg-primary/10 text-foreground'
                    : 'border-border text-muted-foreground hover:bg-muted/50 bg-background',
                )}
              >
                <span className="text-[10px] text-muted-foreground">{d.icon}</span> {d.label}
              </button>
            );
          })}
        </div>
        <Input
          placeholder="Others (please specify)"
          value={wp.domainInterestsOther}
          onChange={(e) => setWP({ domainInterestsOther: e.target.value })}
          className="h-9 border-border text-[13px] mb-12 bg-background"
        />
      </div>
      <div>
        <h3 className="text-[14px] font-bold text-foreground mb-6 flex items-center gap-1.5">
          Minimum expected compensation <HelpCircle className="w-3.5 h-3.5 text-muted-foreground" />
        </h3>
        <div className="space-y-6">
          <div>
            <h4 className="text-[13px] text-foreground font-medium mb-2">Full-time</h4>
            <div className="flex items-center gap-2 mb-1">
              <div className="relative flex-1">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[13px] text-foreground font-bold">₹</span>
                <Input
                  inputMode="numeric"
                  value={wp.minExpectedFullTimeYearly}
                  onChange={(e) => setWP({ minExpectedFullTimeYearly: e.target.value.replace(/[^\d]/g, '') })}
                  className="pl-6 h-9 border-border bg-background text-[13px] font-medium"
                />
              </div>
              <span className="text-[13px] text-muted-foreground">/ year</span>
            </div>
            <p className="text-[11px] text-muted-foreground">
              We won&apos;t reach out about roles below this. This stays private and won&apos;t impact your offers.
            </p>
          </div>
          <div>
            <h4 className="text-[13px] text-foreground font-medium mb-2">Part-time</h4>
            <div className="flex items-center gap-2 mb-1">
              <div className="relative flex-1">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[13px] text-foreground font-bold">₹</span>
                <Input
                  inputMode="numeric"
                  value={wp.minExpectedPartTimeHourly}
                  onChange={(e) => setWP({ minExpectedPartTimeHourly: e.target.value.replace(/[^\d]/g, '') })}
                  className="pl-6 h-9 border-border bg-background text-[13px] font-medium"
                />
              </div>
              <span className="text-[13px] text-muted-foreground">/ hour</span>
            </div>
            <p className="text-[11px] text-muted-foreground">
              We won&apos;t reach out about roles below this. This stays private and won&apos;t impact your offers.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

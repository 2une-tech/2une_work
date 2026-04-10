'use client';

import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import type { MockWorkerProfile } from '@/types/profile';

type Props = {
  profile: MockWorkerProfile;
  setProfile: React.Dispatch<React.SetStateAction<MockWorkerProfile>>;
};

export function LocationTab({ profile, setProfile }: Props) {
  const w = profile.workAuthorization;

  const setWA = (patch: Partial<MockWorkerProfile['workAuthorization']>) => {
    setProfile((p) => ({ ...p, workAuthorization: { ...p.workAuthorization, ...patch } }));
  };

  const workCountry = w.country.trim() || 'your country';

  return (
    <div className="space-y-10">
      <div className="border-b border-border pb-10">
        <h3 className="text-[15px] font-bold text-foreground mb-1">Location of Residence</h3>
        <p className="text-[12px] text-muted-foreground mb-6 leading-relaxed">
          Let us know your location of residence, which is where you&apos;re based for most of the year. This might be
          different from your citizenship.
        </p>
        <div className="grid grid-cols-2 gap-x-6 gap-y-4 mb-4">
          <div>
            <label className="text-[13px] font-bold text-foreground block mb-1">Country</label>
            <Input
              value={w.country}
              onChange={(e) => setWA({ country: e.target.value })}
              className="h-9 border-border bg-background text-[13px]"
            />
          </div>
          <div>
            <label className="text-[13px] font-bold text-foreground block mb-1">State / Province / Region</label>
            <Input
              value={w.stateRegion}
              onChange={(e) => setWA({ stateRegion: e.target.value })}
              className="h-9 border-border bg-background text-[13px]"
            />
          </div>
          <div>
            <label className="text-[13px] font-bold text-foreground block mb-1">City</label>
            <Input
              value={w.city}
              onChange={(e) => setWA({ city: e.target.value })}
              className="h-9 border-border bg-background text-[13px]"
            />
          </div>
          <div>
            <label className="text-[13px] font-bold text-foreground block mb-1">Postal code</label>
            <Input
              value={w.postalCode}
              onChange={(e) => setWA({ postalCode: e.target.value })}
              className="h-9 border-border bg-background text-[13px]"
            />
          </div>
        </div>
        <div className="flex items-start gap-2 pt-2">
          <Checkbox
            id="diff-country"
            checked={w.workingFromDifferentCountry}
            onCheckedChange={(c) => setWA({ workingFromDifferentCountry: c === true })}
            className="mt-0.5 border-border data-[state=checked]:bg-primary data-[state=checked]:border-primary"
          />
          <label htmlFor="diff-country" className="text-[13px] text-muted-foreground leading-snug">
            I will be physically working from a different country than {workCountry} while performing services through
            2une.
          </label>
        </div>
      </div>

      <div>
        <h3 className="text-[15px] font-bold text-foreground mb-1">Legal attestation</h3>
        <p className="text-[12px] text-muted-foreground mb-6">Confirm your legally authorized work status</p>
        <div className="mb-8">
          <label className="text-[13px] font-bold text-foreground block mb-1">Date of Birth (in MM/DD/YYYY)</label>
          <Input
            value={w.dateOfBirth}
            onChange={(e) => setWA({ dateOfBirth: e.target.value })}
            className="h-9 border-border bg-background text-[13px] w-[300px]"
          />
        </div>
        <div className="space-y-6">
          <div className="flex items-start gap-3">
            <Checkbox
              checked={w.attestAuthorizedToWork}
              onCheckedChange={(c) => setWA({ attestAuthorizedToWork: c === true })}
              className="mt-0.5 border-border data-[state=checked]:bg-primary data-[state=checked]:border-primary"
            />
            <div>
              <p className="text-[13px] font-bold text-foreground mb-2">
                I confirm that I am legally authorized to work from {workCountry}. *
              </p>
              <p className="text-[11px] text-muted-foreground leading-tight mb-1">By checking this box, you represent and warrant that:</p>
              <ol className="list-decimal pl-3 text-[11px] text-muted-foreground leading-snug space-y-1">
                <li>You have all necessary visas, permits, and/or legal rights to work from the country you have indicated.</li>
                <li>You will defend, indemnify, and hold harmless 2une from any claims, losses, or liabilities arising from your failure to maintain proper work authorization.</li>
              </ol>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <Checkbox
              checked={w.attestRemainInCountry}
              onCheckedChange={(c) => setWA({ attestRemainInCountry: c === true })}
              className="mt-0.5 border-border data-[state=checked]:bg-primary data-[state=checked]:border-primary"
            />
            <div>
              <p className="text-[13px] font-bold text-foreground mb-2">
                I agree to remain working from {workCountry}, and to notify 2une in writing prior to any change. *
              </p>
              <p className="text-[11px] text-muted-foreground leading-tight mb-1">By checking this box, you agree to:</p>
              <ol className="list-decimal pl-3 text-[11px] text-muted-foreground leading-snug space-y-1">
                <li>Continue working only from the country specified above unless you have provided 2une with prior written notice of your intended change of work location.</li>
                <li>Obtain and maintain proper work authorization for any future country from which you intend to work before beginning work from that country.</li>
              </ol>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

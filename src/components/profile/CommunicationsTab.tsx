'use client';

import { HelpCircle } from 'lucide-react';

import { Switch } from '@/components/ui/switch';
import type { MockWorkerProfile } from '@/types/profile';

type Props = {
  profile: MockWorkerProfile;
  setProfile: React.Dispatch<React.SetStateAction<MockWorkerProfile>>;
};

export function CommunicationsTab({ profile, setProfile }: Props) {
  const c = profile.communications;

  const setComm = (patch: Partial<MockWorkerProfile['communications']>) => {
    setProfile((p) => ({ ...p, communications: { ...p.communications, ...patch } }));
  };

  return (
    <div className="space-y-10">
      <div className="border-b border-border pb-10">
        <h3 className="text-[14px] font-bold text-foreground mb-6 flex items-center gap-1.5">
          Communication channels <HelpCircle className="w-3.5 h-3.5 text-muted-foreground" />
        </h3>
        <div className="space-y-6">
          <div className="flex justify-between items-center gap-4">
            <span className="text-[13px] text-foreground">Email</span>
            <Switch
              checked={c.channelEmail}
              onCheckedChange={(v) => setComm({ channelEmail: v })}
              className="data-[state=checked]:bg-primary"
            />
          </div>
          <div className="flex justify-between items-center gap-4">
            <span className="text-[13px] text-foreground">Text message (SMS)</span>
            <Switch
              checked={c.channelSms}
              onCheckedChange={(v) => setComm({ channelSms: v })}
              className="data-[state=checked]:bg-primary"
            />
          </div>
        </div>
      </div>
      <div className="border-b border-border pb-10">
        <h3 className="text-[14px] font-bold text-foreground mb-6 flex items-center gap-1.5">
          Opportunity types <HelpCircle className="w-3.5 h-3.5 text-muted-foreground" />
        </h3>
        <div className="space-y-6">
          <div className="flex justify-between items-start gap-4">
            <div>
              <h4 className="text-[13px] text-foreground">Full-time opportunities</h4>
              <p className="text-[12px] text-muted-foreground">Contact me about full-time roles</p>
            </div>
            <Switch
              checked={c.opportunityFullTime}
              onCheckedChange={(v) => setComm({ opportunityFullTime: v })}
              className="data-[state=checked]:bg-primary shrink-0"
            />
          </div>
          <div className="flex justify-between items-start gap-4">
            <div>
              <h4 className="text-[13px] text-foreground">Part-time opportunities</h4>
              <p className="text-[12px] text-muted-foreground">Contact me about part-time roles</p>
            </div>
            <Switch
              checked={c.opportunityPartTime}
              onCheckedChange={(v) => setComm({ opportunityPartTime: v })}
              className="data-[state=checked]:bg-primary shrink-0"
            />
          </div>
          <div className="flex justify-between items-start gap-4">
            <div>
              <h4 className="text-[13px] text-foreground">Referral opportunities</h4>
              <p className="text-[12px] text-muted-foreground">Contact me about 2une referral opportunities</p>
            </div>
            <Switch
              checked={c.opportunityReferral}
              onCheckedChange={(v) => setComm({ opportunityReferral: v })}
              className="data-[state=checked]:bg-primary shrink-0"
            />
          </div>
        </div>
      </div>
      <div>
        <h3 className="text-[14px] font-bold text-foreground mb-6 flex items-center gap-1.5">
          General <HelpCircle className="w-3.5 h-3.5 text-muted-foreground" />
        </h3>
        <div className="space-y-6">
          <div className="flex justify-between items-start gap-4">
            <div>
              <h4 className="text-[13px] text-foreground">Job opportunities</h4>
              <p className="text-[12px] text-muted-foreground">
                Receive notifications about new job openings, interviews, and application invitations.
              </p>
            </div>
            <Switch
              checked={c.generalJobOpportunities}
              onCheckedChange={(v) => setComm({ generalJobOpportunities: v })}
              className="data-[state=checked]:bg-primary shrink-0"
            />
          </div>
          <div className="flex justify-between items-start gap-4">
            <div>
              <h4 className="text-[13px] text-foreground">Work-related updates</h4>
              <p className="text-[12px] text-muted-foreground">
                Get updates about offers, work trials, contracts, and project status changes.
              </p>
            </div>
            <Switch
              checked={c.generalWorkUpdates}
              onCheckedChange={(v) => setComm({ generalWorkUpdates: v })}
              className="data-[state=checked]:bg-primary shrink-0"
            />
          </div>
          <div className="flex justify-between items-start gap-4">
            <div>
              <h4 className="text-[13px] text-foreground">Unsubscribe from all</h4>
              <p className="text-[12px] text-muted-foreground">Turn this on to stop all the outreach.</p>
            </div>
            <Switch
              checked={c.unsubscribeAll}
              onCheckedChange={(v) => setComm({ unsubscribeAll: v })}
              className="data-[state=checked]:bg-primary shrink-0"
            />
          </div>
        </div>
      </div>
    </div>
  );
}

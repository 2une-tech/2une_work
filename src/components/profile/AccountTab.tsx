'use client';

import { useRef } from 'react';
import { toast } from 'sonner';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { useAuthStore } from '@/lib/store';
import type { MockWorkerProfile } from '@/types/profile';

type Props = {
  profile: MockWorkerProfile;
  setProfile: React.Dispatch<React.SetStateAction<MockWorkerProfile>>;
};

export function AccountTab({ profile, setProfile }: Props) {
  const { user, updateUser } = useAuthStore();
  const fileRef = useRef<HTMLInputElement>(null);
  const acc = profile.account;

  const setAcc = (patch: Partial<MockWorkerProfile['account']>) => {
    setProfile((p) => ({ ...p, account: { ...p.account, ...patch } }));
  };

  const initials =
    user?.name
      ?.split(/\s+/)
      .map((w) => w[0])
      .join('')
      .slice(0, 2)
      .toUpperCase() || 'ME';

  const onAvatarPick = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      toast.error('Please choose an image file.');
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = typeof reader.result === 'string' ? reader.result : '';
      void updateUser({ avatar: dataUrl }, { silent: true });
      toast.success('Avatar updated for this device.');
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  return (
    <div className="space-y-10">
      <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/gif,image/webp" className="hidden" onChange={onAvatarPick} />
      <div className="flex items-center gap-6">
        <Avatar className="w-16 h-16 rounded-xl border border-border">
          <AvatarImage src={user?.avatar} className="object-cover" />
          <AvatarFallback className="rounded-xl">{initials}</AvatarFallback>
        </Avatar>
        <div>
          <Button
            type="button"
            variant="outline"
            className="h-8 text-[13px] font-medium border-border mb-2"
            onClick={() => fileRef.current?.click()}
          >
            Change avatar
          </Button>
          <p className="text-[11px] text-muted-foreground">JPG, PNG, or GIF. Max 2 MB. Files over 150KB will be compressed.</p>
        </div>
      </div>

      <div className="border-b border-border pb-10">
        <div className="flex justify-between items-start mb-2 gap-4">
          <div>
            <h3 className="text-[14px] font-bold text-foreground">Generative profile pictures</h3>
            <p className="text-[12px] text-muted-foreground max-w-[500px]">
              Let 2une generate a professional photo from your AI interview. Your image will be created once your profile joins our talent pool.
            </p>
          </div>
          <Switch
            checked={acc.generativeProfilePictures}
            onCheckedChange={(v) => setAcc({ generativeProfilePictures: v })}
            className="data-[state=checked]:bg-primary shrink-0"
          />
        </div>
      </div>

      <div className="border-b border-border pb-10">
        <h3 className="text-[14px] font-bold text-foreground mb-1">Payout preferences</h3>
        <p className="text-[12px] text-muted-foreground mb-6">Choose how you want to receive your payouts - standard or instant.</p>
        <div className="mb-4 rounded-lg border border-border bg-muted/30 p-4">
          <h4 className="text-[13px] font-semibold text-foreground">Only one payout option available</h4>
          <p className="text-[12px] text-muted-foreground">This option has been automatically selected for you.</p>
        </div>
        <div className="flex items-start gap-4 rounded-lg border border-border bg-muted/20 p-5">
          <div className="mt-1">
            <div className="flex h-4 w-4 items-center justify-center rounded-full border-4 border-primary bg-background">
              <div className="h-1.5 w-1.5 rounded-full bg-primary" />
            </div>
          </div>
          <div className="flex-1">
            <div className="flex justify-between items-center mb-1">
              <h4 className="text-[14px] font-bold text-foreground">Standard Payout</h4>
              <span className="rounded-sm bg-emerald-500/15 px-2 py-0.5 text-[10px] font-semibold text-emerald-800">
                Free
              </span>
            </div>
            <div className="flex justify-between items-center text-[12px] flex-wrap gap-2">
              <p className="text-muted-foreground">
                Funds arrive in your Stripe account quickly, then transfer to your bank within 5 business days
              </p>
              <span className="text-muted-foreground shrink-0">Up to 5 business days</span>
            </div>
          </div>
        </div>
      </div>
      <div className="border-b border-border pb-10">
        <h3 className="text-[14px] font-bold text-foreground mb-1">Change email</h3>
        <p className="text-[12px] text-muted-foreground mb-4">
          Transfer all your data and account-related communications to a new email address.
        </p>
        <Button
          type="button"
          variant="outline"
          className="h-8 text-[13px] font-medium border-border"
          onClick={() => toast.message('Changing your login email is not supported yet.')}
        >
          Change email
        </Button>
      </div>
      <div>
        <h3 className="text-[14px] font-bold text-foreground mb-1">Delete account</h3>
        <p className="mb-4 text-xs text-muted-foreground">Permanently delete your account and all data from 2une.</p>
        <Button
          type="button"
          variant="outline"
          className="h-8 border-destructive/40 text-destructive hover:bg-destructive/10 hover:text-destructive"
          onClick={() => toast.message('Account deletion is coming soon.')}
        >
          Delete account
        </Button>
      </div>
    </div>
  );
}

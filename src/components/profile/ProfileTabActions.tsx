'use client';

import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';

type Props = {
  onSave: () => void;
  onReset: () => void;
  saving: boolean;
  autosaving?: boolean;
};

export function ProfileTabActions({ onSave, onReset, saving, autosaving }: Props) {
  const busy = saving || autosaving;
  return (
    <div className="mt-8 flex flex-wrap items-center gap-3 border-t border-border pt-6">
      <div className="flex flex-wrap gap-2">
        <Button type="button" onClick={onSave} disabled={busy}>
          {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
          Save
        </Button>
        <Button type="button" variant="outline" onClick={onReset} disabled={busy}>
          Reset
        </Button>
      </div>
      {autosaving && !saving ? (
        <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden />
          Autosaving…
        </span>
      ) : null}
    </div>
  );
}

'use client';

import { toast } from 'sonner';
import { Plus } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import type { MockWorkerProfile } from '@/types/profile';
import { newId } from '@/types/profile';
import { AVAILABILITY_START_OPTIONS, DAY_LETTERS, getTimeZoneOptions } from './constants';

type Props = {
  profile: MockWorkerProfile;
  setProfile: React.Dispatch<React.SetStateAction<MockWorkerProfile>>;
};

export function AvailabilityTab({ profile, setProfile }: Props) {
  const a = profile.availability;
  const timezones = getTimeZoneOptions();

  const setAvail = (patch: Partial<MockWorkerProfile['availability']>) => {
    setProfile((p) => ({ ...p, availability: { ...p.availability, ...patch } }));
  };

  const sortedDays = [...a.workingDays].sort((x, y) => x.dayOfWeek - y.dayOfWeek);

  const toggleDay = (dayOfWeek: number) => {
    setAvail({
      workingDays: a.workingDays.map((d) =>
        d.dayOfWeek === dayOfWeek ? { ...d, available: !d.available } : d,
      ),
    });
  };

  const updateDay = (dayOfWeek: number, patch: { startTime?: string; endTime?: string }) => {
    setAvail({
      workingDays: a.workingDays.map((d) => (d.dayOfWeek === dayOfWeek ? { ...d, ...patch } : d)),
    });
  };

  const addException = () => {
    const dateStr = window.prompt('Exception date (YYYY-MM-DD)?');
    if (!dateStr?.trim()) return;
    const t = Date.parse(dateStr);
    if (Number.isNaN(t)) {
      toast.error('Invalid date.');
      return;
    }
    const note = window.prompt('Note (optional)?') ?? '';
    setAvail({
      exceptions: [...a.exceptions, { id: newId(), date: dateStr.trim(), note }],
    });
    toast.success('Exception added.');
  };

  return (
    <div className="space-y-10">
      <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-border bg-muted/30 p-2.5">
        <span className="ml-2 text-[13px] font-medium text-foreground">Is your availability still the same?</span>
        <Button
          type="button"
          variant="outline"
          className="h-8 text-[13px] font-medium border-border bg-background"
          onClick={() => toast.message('We’ll support saving “last week” snapshots soon.')}
        >
          Keep same as last week
        </Button>
      </div>
      <div className="grid grid-cols-2 gap-6 pb-8 border-b border-border">
        <div>
          <h3 className="text-[13px] font-bold text-foreground mb-1">Availability to start *</h3>
          <p className="text-[12px] text-muted-foreground mb-2">How soon you could begin a new role if offered</p>
          <Select
            value={a.availabilityToStart || undefined}
            onValueChange={(v) => setAvail({ availabilityToStart: (v as MockWorkerProfile['availability']['availabilityToStart']) ?? '' })}
          >
            <SelectTrigger className="h-9 border-border bg-background">
              <SelectValue placeholder="Select" />
            </SelectTrigger>
            <SelectContent>
              {AVAILABILITY_START_OPTIONS.map((o) => (
                <SelectItem key={o.value} value={o.value}>
                  {o.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <h3 className="text-[13px] font-bold text-foreground mb-1">Preferred time commitment *</h3>
          <p className="text-[12px] text-muted-foreground mb-2">Ideal number of hours you&apos;d like to work each week</p>
          <Input
            placeholder="Ex: 40"
            value={a.preferredWeeklyHours}
            onChange={(e) => setAvail({ preferredWeeklyHours: e.target.value })}
            className="h-9 border-border bg-background text-[13px]"
          />
        </div>
        <div className="col-span-2">
          <h3 className="text-[13px] font-bold text-foreground mb-1">Timezone *</h3>
          <p className="text-[12px] text-muted-foreground mb-2">
            Select the time zone you primarily work from. This will be used to interpret your weekly availability hours.
          </p>
          <Select value={a.timezone || undefined} onValueChange={(v) => setAvail({ timezone: v ?? '' })}>
            <SelectTrigger className="h-9 border-border bg-background text-[13px]">
              <SelectValue placeholder="Select timezone" />
            </SelectTrigger>
            <SelectContent className="max-h-60">
              {timezones.map((tz) => (
                <SelectItem key={tz} value={tz}>
                  {tz}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
      <div className="pb-10 border-b border-border">
        <h3 className="text-[14px] font-bold text-foreground mb-1 flex items-center gap-1.5">
          <svg className="w-4 h-4 ml-[-2px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3" />
            <path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5" />
            <path d="M21 5c0 1.66-4 3-9 3s-9-1.34-9-3s4-3 9-3s9 1.34 9 3" />
          </svg>{' '}
          Working hours
        </h3>
        <p className="text-[12px] text-muted-foreground mb-6">Select when you are typically available to work</p>
        <div className="space-y-4">
          {sortedDays.map((d) => {
            const letter = DAY_LETTERS[d.dayOfWeek];
            return (
              <div key={d.dayOfWeek} className="flex items-center gap-4 flex-wrap">
                <button
                  type="button"
                  onClick={() => toggleDay(d.dayOfWeek)}
                  className={`w-7 h-7 rounded-full flex items-center justify-center text-[12px] font-bold ${
                    d.available
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted text-muted-foreground'
                  }`}
                >
                  {letter}
                </button>
                {d.available ? (
                  <div className="flex items-center gap-3 flex-wrap">
                    <Input
                      value={d.startTime}
                      onChange={(e) => updateDay(d.dayOfWeek, { startTime: e.target.value })}
                      className="w-[100px] h-8 border-border bg-muted/30 text-[13px] text-foreground"
                    />
                    <span className="text-muted-foreground">-</span>
                    <Input
                      value={d.endTime}
                      onChange={(e) => updateDay(d.dayOfWeek, { endTime: e.target.value })}
                      className="w-[100px] h-8 border-border bg-muted/30 text-[13px] text-foreground"
                    />
                    <button
                      type="button"
                      className="text-muted-foreground hover:text-foreground"
                      onClick={() => updateDay(d.dayOfWeek, { startTime: '9:00am', endTime: '5:00pm' })}
                      title="Reset times"
                    >
                      ↺
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center gap-3">
                    <span className="text-[13px] text-muted-foreground w-[230px]">Unavailable</span>
                    <button type="button" className="text-muted-foreground hover:text-foreground" onClick={() => toggleDay(d.dayOfWeek)}>
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
      <div>
        <div className="flex justify-between items-start mb-4 flex-wrap gap-2">
          <div>
            <h3 className="text-[14px] font-bold text-foreground mb-1 flex items-center gap-1.5">
              <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                <line x1="16" y1="2" x2="16" y2="6" />
                <line x1="8" y1="2" x2="8" y2="6" />
                <line x1="3" y1="10" x2="21" y2="10" />
              </svg>{' '}
              Date-specific hours
            </h3>
            <p className="text-[12px] text-muted-foreground">Specify date-based exceptions to your weekly availability.</p>
          </div>
          <Button type="button" variant="outline" className="h-8 text-[13px] font-medium border-border bg-background" onClick={addException}>
            <Plus className="w-3.5 h-3.5 mr-1" /> Add exceptions
          </Button>
        </div>
        {a.exceptions.length === 0 ? (
          <div className="bg-muted/20 border border-border rounded-md p-6 text-center text-[13px] text-muted-foreground font-medium">
            No active exceptions
          </div>
        ) : (
          <ul className="space-y-2 border border-border rounded-md p-4 bg-background">
            {a.exceptions.map((ex) => (
              <li key={ex.id} className="flex justify-between items-center text-[13px] gap-2">
                <span>
                  <span className="font-medium text-foreground">{ex.date}</span>
                  {ex.note ? <span className="text-muted-foreground"> — {ex.note}</span> : null}
                </span>
                <Button type="button" variant="ghost" size="sm" className="text-red-500" onClick={() => setAvail({ exceptions: a.exceptions.filter((x) => x.id !== ex.id) })}>
                  Remove
                </Button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

import type { MockWorkerProfile, ProfileTabId } from '@/types/profile';

function emailOk(s: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s.trim());
}

export function validateProfileTab(tab: ProfileTabId, p: MockWorkerProfile): string | null {
  switch (tab) {
    case 'Resume': {
      if (!p.resume.fullName.trim()) return 'Full name is required.';
      if (!p.resume.displayEmail.trim() || !emailOk(p.resume.displayEmail))
        return 'A valid email is required.';
      return null;
    }
    case 'Location & Work authorization': {
      if (!p.workAuthorization.country.trim()) return 'Country is required.';
      if (!p.workAuthorization.city.trim()) return 'City is required.';
      if (!p.workAuthorization.attestAuthorizedToWork)
        return 'You must confirm you are legally authorized to work from your country.';
      if (!p.workAuthorization.attestRemainInCountry)
        return 'You must agree to notify 2une before changing work location.';
      return null;
    }
    case 'Availability': {
      if (!p.availability.timezone.trim()) return 'Timezone is required.';
      const hours = p.availability.preferredWeeklyHours.trim();
      if (!hours) return 'Preferred weekly hours is required.';
      const n = Number(hours);
      if (Number.isNaN(n) || n < 1 || n > 80) return 'Preferred weekly hours must be between 1 and 80.';
      if (!p.availability.availabilityToStart) return 'Availability to start is required.';
      return null;
    }
    case 'Work preferences':
    case 'Communications':
    case 'Account':
      return null;
    default:
      return null;
  }
}

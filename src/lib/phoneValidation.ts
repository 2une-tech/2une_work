/**
 * International phone validation (E.164-style): optional +country in one field, or
 * country label (e.g. "+91", "🇮🇳 +91") + national digits. Max 15 digits total.
 */

/** Strip spaces, dashes, dots, parentheses; preserve leading + then digits only. */
export function normalizePhoneInput(raw: string): string {
  const t = raw.trim();
  if (!t) return '';
  if (t.startsWith('+')) {
    return `+${t.slice(1).replace(/\D/g, '')}`;
  }
  return t.replace(/\D/g, '');
}

/** Extract ITU-style country calling code digits from a label (1–4 digits after +, or digits-only 1–4). */
export function parseDialCodeFromLabel(label: string): string | null {
  const trimmed = label.trim();
  if (!trimmed) return null;
  const withPlus = trimmed.match(/\+(\d{1,4})/);
  if (withPlus) return withPlus[1];
  const digits = trimmed.replace(/\D/g, '');
  if (digits.length >= 1 && digits.length <= 4 && /^[1-9]/.test(digits)) return digits;
  return null;
}

export type PhoneValidationResult =
  | { ok: true; e164: string }
  | { ok: false; message: string };

function validateFullInternational(normalized: string): PhoneValidationResult {
  if (!normalized.startsWith('+')) {
    return { ok: false, message: 'Phone number is invalid.' };
  }
  const digits = normalized.slice(1);
  if (digits.length < 8 || digits.length > 15) {
    return { ok: false, message: 'Use 8–15 digits after + (include country code).' };
  }
  if (!/^[1-9]\d+$/.test(digits)) {
    return { ok: false, message: 'Invalid phone number.' };
  }
  return { ok: true, e164: `+${digits}` };
}

/** Required phone: must yield valid E.164 (two fields or single field starting with +). */
export function validateRequiredPhoneParts(countryLabel: string, phoneLine: string): PhoneValidationResult {
  const raw = phoneLine.trim();
  if (!raw) {
    return { ok: false, message: 'Enter your phone number.' };
  }
  const normalized = normalizePhoneInput(raw);
  if (normalized.startsWith('+')) {
    return validateFullInternational(normalized);
  }
  const cc = parseDialCodeFromLabel(countryLabel);
  if (!cc) {
    return { ok: false, message: 'Enter a valid country code (e.g. +91).' };
  }
  if (!/^\d+$/.test(normalized)) {
    return { ok: false, message: 'Phone number should only contain digits.' };
  }
  if (normalized.length < 4) {
    return { ok: false, message: 'Phone number is too short.' };
  }
  const fullDigits = cc + normalized;
  if (fullDigits.length < 8 || fullDigits.length > 15) {
    return { ok: false, message: 'Phone number must be 8–15 digits including country code.' };
  }
  return { ok: true, e164: `+${fullDigits}` };
}

/**
 * Optional phone (profile resume): both empty is OK; otherwise must be valid.
 * National-only requires a parseable country label; full international can live in the phone field alone.
 */
export function validateOptionalPhoneParts(countryLabel: string, phoneLine: string): PhoneValidationResult {
  const raw = phoneLine.trim();
  const ccRaw = countryLabel.trim();
  if (!raw && !ccRaw) {
    return { ok: true, e164: '' };
  }
  if (!raw && ccRaw) {
    return { ok: false, message: 'Enter your phone number or clear the country code field.' };
  }
  const normalized = normalizePhoneInput(raw);
  if (normalized.startsWith('+')) {
    return validateFullInternational(normalized);
  }
  if (!ccRaw) {
    return {
      ok: false,
      message:
        'Enter a country code (e.g. +91), or type the full number starting with + and country code.',
    };
  }
  const cc = parseDialCodeFromLabel(countryLabel);
  if (!cc) {
    return { ok: false, message: 'Enter a valid country code (e.g. +91).' };
  }
  if (!/^\d+$/.test(normalized)) {
    return { ok: false, message: 'Phone number should only contain digits.' };
  }
  if (normalized.length < 4) {
    return { ok: false, message: 'Phone number is too short.' };
  }
  const fullDigits = cc + normalized;
  if (fullDigits.length < 8 || fullDigits.length > 15) {
    return { ok: false, message: 'Phone number must be 8–15 digits including country code.' };
  }
  return { ok: true, e164: `+${fullDigits}` };
}

/** After client-side validation passes; max 40 chars for API. */
export function formatPhoneForApi(countryLabel: string, phoneLine: string): string {
  const v = validateOptionalPhoneParts(countryLabel, phoneLine);
  if (!v.ok) {
    throw new Error(v.message);
  }
  return v.e164.slice(0, 40);
}

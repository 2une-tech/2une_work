/** Error query keys from GET /auth/linkedin/callback when signing in. */
export const LINKEDIN_LOGIN_ERROR_MESSAGES: Record<string, string> = {
  access_denied: 'LinkedIn sign-in was cancelled.',
  oauth_denied: 'LinkedIn sign-in was denied.',
  invalid_callback: 'LinkedIn sign-in failed (invalid callback).',
  invalid_state: 'LinkedIn sign-in expired. Please try again.',
  email_required: 'LinkedIn did not return a verified email. Use an account with a verified email on LinkedIn.',
  user_blocked: 'This account is blocked.',
  linkedin_api_error: 'LinkedIn could not complete sign-in. Try again later.',
  not_configured: 'LinkedIn sign-in is not configured on the server.',
  signin_failed: 'Could not sign in with LinkedIn.',
};

/** Reads `#linkedin_handoff=...`, clears the hash, returns the JWT or null. */
export function consumeLinkedinHandoffFromHash(): string | null {
  if (typeof window === 'undefined') return null;
  const raw = window.location.hash;
  const prefix = '#linkedin_handoff=';
  if (!raw.startsWith(prefix)) return null;
  const encoded = raw.slice(prefix.length);
  let token: string;
  try {
    token = decodeURIComponent(encoded);
  } catch {
    return null;
  }
  const path = window.location.pathname + (window.location.search || '');
  window.history.replaceState(null, '', path);
  return token.trim() || null;
}

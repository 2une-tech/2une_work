/**
 * Whether this browser session should show the native-app handoff on project pages.
 * Client-only: call from `useEffect` or event handlers (not during SSR render) to avoid
 * hydration mismatch.
 */
export function isMobileAppHandoffClient(): boolean {
  if (typeof navigator === 'undefined') return false;
  const ua = navigator.userAgent;

  if (/Android/i.test(ua)) return true;
  if (/iPhone|iPod/i.test(ua)) return true;
  if (/iPad/i.test(ua)) return true;

  // iPadOS 13+ Safari often reports as Mac with touch.
  if (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1) {
    return true;
  }

  if (/webOS|BlackBerry|IEMobile|Opera Mini/i.test(ua)) return true;

  // Desktop OS heuristics (narrow windows are still desktop).
  if (/Windows NT|Win64|WOW64/i.test(ua)) return false;
  if (/Macintosh|Mac OS X/i.test(ua)) return false;
  if (/X11; Linux|Linux x86_64|CrOS/i.test(ua) && !/Android/i.test(ua)) return false;

  return false;
}

export function isAndroidHandoffClient(): boolean {
  if (typeof navigator === 'undefined') return false;
  return /Android/i.test(navigator.userAgent);
}

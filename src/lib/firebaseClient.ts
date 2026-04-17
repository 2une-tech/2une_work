import { initializeApp, getApps, getApp, type FirebaseOptions } from 'firebase/app';
import {
  getAuth,
  getRedirectResult,
  GoogleAuthProvider,
  linkWithPopup,
  linkWithRedirect,
  signInWithPopup,
  signInWithRedirect,
  signOut,
} from 'firebase/auth';
import { FirebaseError } from 'firebase/app';

function readFirebaseOptions(): FirebaseOptions {
  const apiKey = process.env.NEXT_PUBLIC_FIREBASE_API_KEY?.trim();
  const authDomain = process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN?.trim();
  const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID?.trim();
  const storageBucket = process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET?.trim();
  const messagingSenderId = process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID?.trim();
  const appId = process.env.NEXT_PUBLIC_FIREBASE_APP_ID?.trim();
  const measurementId = process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID?.trim();

  if (!apiKey || !authDomain || !projectId || !storageBucket || !messagingSenderId || !appId) {
    throw new Error(
      'Firebase is not configured. Set NEXT_PUBLIC_FIREBASE_API_KEY, AUTH_DOMAIN, PROJECT_ID, STORAGE_BUCKET, MESSAGING_SENDER_ID, and APP_ID.',
    );
  }

  const opts: FirebaseOptions = {
    apiKey,
    authDomain,
    projectId,
    storageBucket,
    messagingSenderId,
    appId,
  };
  if (measurementId) opts.measurementId = measurementId;
  return opts;
}

export function getFirebaseApp() {
  if (typeof window === 'undefined') {
    throw new Error('Firebase can only be used in the browser.');
  }
  if (!getApps().length) {
    return initializeApp(readFirebaseOptions());
  }
  return getApp();
}

export function getFirebaseAuth() {
  return getAuth(getFirebaseApp());
}

/**
 * Full-page redirect — use when popups are blocked (COOP / embedded browsers) or as fallback.
 */
export async function signInWithGoogleRedirect(): Promise<void> {
  const auth = getFirebaseAuth();
  const provider = new GoogleAuthProvider();
  await signInWithRedirect(auth, provider);
}

/** Ensures a single in-flight `getRedirectResult` (React Strict Mode runs effects twice; only one may consume). */
let pendingRedirectIdToken: Promise<string | null> | null = null;

/** After returning from Google OAuth, call once; returns an ID token or null if this was not a redirect return. */
export async function consumeGoogleRedirectIdToken(): Promise<string | null> {
  if (!pendingRedirectIdToken) {
    pendingRedirectIdToken = (async () => {
      const auth = getFirebaseAuth();
      const result = await getRedirectResult(auth);
      if (!result?.user) return null;
      return result.user.getIdToken();
    })().finally(() => {
      pendingRedirectIdToken = null;
    });
  }
  return pendingRedirectIdToken;
}

export type GoogleInteractiveSignInResult =
  | { kind: 'id_token'; idToken: string }
  | { kind: 'redirect_started' };

/**
 * Prefer popup (no full-page reload). Falls back to redirect when popups are blocked or COOP blocks window.opener.
 */
export async function signInWithGoogleInteractive(): Promise<GoogleInteractiveSignInResult> {
  const auth = getFirebaseAuth();
  const provider = new GoogleAuthProvider();
  try {
    // If the user is already signed in (e.g., returning from an earlier Google flow), link instead of switching accounts.
    const result = auth.currentUser
      ? await linkWithPopup(auth.currentUser, provider)
      : await signInWithPopup(auth, provider);
    const idToken = await result.user.getIdToken();
    if (!idToken) throw new Error('Google sign-in failed');
    return { kind: 'id_token', idToken };
  } catch (e) {
    if (e instanceof FirebaseError) {
      if (e.code === 'auth/popup-closed-by-user') throw e;
      if (
        e.code === 'auth/popup-blocked' ||
        e.code === 'auth/cancelled-popup-request' ||
        e.code === 'auth/operation-not-supported-in-this-environment'
      ) {
        if (auth.currentUser) {
          await linkWithRedirect(auth.currentUser, provider);
        } else {
          await signInWithRedirect(auth, provider);
        }
        return { kind: 'redirect_started' };
      }
    }
    throw e;
  }
}

export async function signOutFirebase(): Promise<void> {
  const auth = getFirebaseAuth();
  await signOut(auth);
}

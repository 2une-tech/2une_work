import { initializeApp, getApps, getApp, type FirebaseOptions } from 'firebase/app';
import {
  createUserWithEmailAndPassword,
  getAuth,
  getRedirectResult,
  GoogleAuthProvider,
  sendEmailVerification,
  signInWithEmailAndPassword,
  signInWithPopup,
  signInWithRedirect,
  signOut,
  type User,
} from 'firebase/auth';
import { FirebaseError } from 'firebase/app';

function readableFirebaseAuthError(e: unknown): Error {
  if (!(e instanceof FirebaseError)) {
    return e instanceof Error ? e : new Error('Sign-in failed');
  }

  // Firebase JS SDK wraps Identity Toolkit errors; `e.code` is the most reliable signal.
  // Common codes: auth/invalid-credential, auth/user-not-found, auth/wrong-password,
  // auth/invalid-email, auth/operation-not-allowed, auth/too-many-requests.
  const code = e.code || 'auth/unknown';
  const base = (() => {
    switch (code) {
      case 'auth/invalid-email':
        return 'Invalid email address.';
      case 'auth/user-not-found':
        return 'No account found for this email.';
      case 'auth/wrong-password':
      case 'auth/invalid-credential':
        return 'Incorrect email or password.';
      case 'auth/operation-not-allowed':
        return 'Email/password sign-in is not enabled for this Firebase project.';
      case 'auth/too-many-requests':
        return 'Too many attempts. Please try again later.';
      default:
        return 'Sign-in failed.';
    }
  })();

  const message = `${base} (${code})`;
  const err = new Error(message);
  // Preserve original code for any UI that wants it.
  (err as Error & { code?: string }).code = code;
  return err;
}

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
    const result = await signInWithPopup(auth, provider);
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
        await signInWithRedirect(auth, provider);
        return { kind: 'redirect_started' };
      }
    }
    throw e;
  }
}

export async function signInWithEmailPassword(email: string, password: string): Promise<string> {
  const auth = getFirebaseAuth();
  try {
    const cred = await signInWithEmailAndPassword(auth, email.trim().toLowerCase(), password);
    return cred.user.getIdToken();
  } catch (e) {
    throw readableFirebaseAuthError(e);
  }
}

export async function createUserWithEmailPassword(email: string, password: string): Promise<User> {
  const auth = getFirebaseAuth();
  try {
    const cred = await createUserWithEmailAndPassword(auth, email.trim().toLowerCase(), password);
    return cred.user;
  } catch (e) {
    throw readableFirebaseAuthError(e);
  }
}

export async function sendEmailVerificationForUser(user: User): Promise<void> {
  await sendEmailVerification(user);
}

export async function signOutFirebase(): Promise<void> {
  const auth = getFirebaseAuth();
  await signOut(auth);
}

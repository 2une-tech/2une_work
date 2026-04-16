import { initializeApp, getApps, getApp, type FirebaseOptions } from 'firebase/app';
import {
  createUserWithEmailAndPassword,
  getAuth,
  getRedirectResult,
  GoogleAuthProvider,
  sendEmailVerification,
  signInWithEmailAndPassword,
  signInWithRedirect,
  signOut,
  type User,
} from 'firebase/auth';

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
 * Full-page redirect (recommended for production). Avoids popup + Cross-Origin-Opener-Policy issues on hosts
 * that set strict COOP (Azure SWA, some CDNs).
 */
export async function signInWithGoogleRedirect(): Promise<void> {
  const auth = getFirebaseAuth();
  const provider = new GoogleAuthProvider();
  await signInWithRedirect(auth, provider);
}

/** After returning from Google OAuth, call once; returns an ID token or null if this was not a redirect return. */
export async function consumeGoogleRedirectIdToken(): Promise<string | null> {
  const auth = getFirebaseAuth();
  const result = await getRedirectResult(auth);
  if (!result?.user) return null;
  return result.user.getIdToken();
}

export async function signInWithEmailPassword(email: string, password: string): Promise<string> {
  const auth = getFirebaseAuth();
  const cred = await signInWithEmailAndPassword(auth, email.trim().toLowerCase(), password);
  return cred.user.getIdToken();
}

export async function createUserWithEmailPassword(email: string, password: string): Promise<User> {
  const auth = getFirebaseAuth();
  const cred = await createUserWithEmailAndPassword(auth, email.trim().toLowerCase(), password);
  return cred.user;
}

export async function sendEmailVerificationForUser(user: User): Promise<void> {
  await sendEmailVerification(user);
}

export async function signOutFirebase(): Promise<void> {
  const auth = getFirebaseAuth();
  await signOut(auth);
}

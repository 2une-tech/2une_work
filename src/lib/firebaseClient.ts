import { initializeApp, getApps, getApp, type FirebaseOptions } from 'firebase/app';
import { getAuth, GoogleAuthProvider, signInWithPopup } from 'firebase/auth';

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

export async function signInWithGoogleAndGetIdToken(): Promise<string> {
  const auth = getFirebaseAuth();
  const provider = new GoogleAuthProvider();
  const result = await signInWithPopup(auth, provider);
  return result.user.getIdToken();
}

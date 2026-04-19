'use client';

import { FirebaseError } from 'firebase/app';
import { Suspense, useEffect, useMemo, useRef, useState } from 'react';
import { useAuthStore } from '@/lib/store';
import { Button, buttonVariants } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useRouter, useSearchParams } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import Link from 'next/link';
import { api, ApiRequestError } from '@/lib/services/api';
import {
  consumeGoogleRedirectIdToken,
  signInWithGoogleInteractive,
} from '@/lib/firebaseClient';
import { consumeLinkedinHandoffFromHash, LINKEDIN_LOGIN_ERROR_MESSAGES } from '@/lib/linkedinOAuth';
import { AuthBrand } from '@/components/AuthBrand';

/** Open-redirect safe relative path from a raw `next` query value. */
function readSafeNextParam(next: string | null): string {
  const n = next?.trim() ?? '';
  if (!n.startsWith('/') || n.startsWith('//')) return '';
  return n;
}

/** Open-redirect safe relative path from `?next=` in the current URL. */
function readSafeNextPath(): string {
  if (typeof window === 'undefined') return '';
  return readSafeNextParam(new URLSearchParams(window.location.search).get('next'));
}

function LoginCard() {
  const searchParams = useSearchParams();
  const pendingNext = useMemo(() => readSafeNextParam(searchParams.get('next')), [searchParams]);

  const { login, loginWithLinkedinHandoff } = useAuthStore();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const linkedinHandoffStarted = useRef(false);
  const linkedinQueryErrorShown = useRef(false);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const idToken = await consumeGoogleRedirectIdToken();
        if (!idToken || cancelled) return;
        setLoading(true);
        await useAuthStore.getState().loginWithFirebase(idToken);
        if (cancelled) return;
        toast.success('Logged in successfully.');
        router.push(readSafeNextPath() || '/dashboard');
      } catch (err) {
        if (cancelled) return;
        if (err instanceof ApiRequestError && err.code === 'INVALID_FIREBASE_TOKEN') {
          toast.error(
            'Google sign-in could not be verified on the server. Ensure the API has FIREBASE_SERVICE_ACCOUNT_JSON for the same Firebase project as this app.',
          );
        } else {
          toast.error(err instanceof Error ? err.message : 'Google sign-in failed');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [router]);

  useEffect(() => {
    if (linkedinHandoffStarted.current) return;
    const token = consumeLinkedinHandoffFromHash();
    if (!token) return;
    linkedinHandoffStarted.current = true;
    void (async () => {
      try {
        setLoading(true);
        await loginWithLinkedinHandoff(token);
        toast.success('Logged in successfully.');
        router.push(readSafeNextPath() || '/dashboard');
      } catch (err) {
        if (err instanceof ApiRequestError && err.code === 'INVALID_LINKEDIN_HANDOFF') {
          toast.error('Sign-in session expired. Try LinkedIn again.');
        } else {
          toast.error(err instanceof Error ? err.message : 'LinkedIn sign-in failed');
        }
      } finally {
        setLoading(false);
        linkedinHandoffStarted.current = false;
      }
    })();
  }, [router, loginWithLinkedinHandoff]);

  useEffect(() => {
    if (typeof window === 'undefined' || linkedinQueryErrorShown.current) return;
    const q = new URLSearchParams(window.location.search);
    const err = q.get('linkedin_error');
    if (!err) return;
    linkedinQueryErrorShown.current = true;
    toast.error(LINKEDIN_LOGIN_ERROR_MESSAGES[err] ?? LINKEDIN_LOGIN_ERROR_MESSAGES.signin_failed);
    router.replace('/login', { scroll: false });
  }, [router]);

  const runLogin = async () => {
    if (!email.trim()) {
      toast.error('Please enter your email.');
      return;
    }
    if (!password.trim()) {
      toast.error('Please enter your password.');
      return;
    }
    setLoading(true);
    try {
      await login(email, password);
      toast.success('Logged in successfully.');
      router.push(readSafeNextPath() || '/dashboard');
    } catch (err) {
      if (err instanceof ApiRequestError && err.code === 'EMAIL_REQUIRED') {
        toast.error('Your sign-in session is missing an email. Try Google sign-in again or contact support.');
        return;
      }
      if (
        err instanceof ApiRequestError &&
        (err.code === 'USE_GOOGLE_LOGIN' || err.code === 'USE_OAUTH_LOGIN')
      ) {
        toast.error('This account uses Google or LinkedIn sign-in.');
        return;
      }
      toast.error(err instanceof Error ? err.message : 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    await runLogin();
  };

  const runGoogleSignIn = async () => {
    setLoading(true);
    try {
      const result = await signInWithGoogleInteractive();
      if (result.kind === 'redirect_started') {
        return;
      }
      await useAuthStore.getState().loginWithFirebase(result.idToken);
      toast.success('Logged in successfully.');
      router.push(readSafeNextPath() || '/dashboard');
    } catch (err) {
      if (err instanceof FirebaseError && err.code === 'auth/popup-closed-by-user') {
        toast.message('Sign-in cancelled.');
        return;
      }
      toast.error(err instanceof Error ? err.message : 'Google sign-in failed');
    } finally {
      setLoading(false);
    }
  };

  const runLinkedinSignIn = async () => {
    setLoading(true);
    try {
      const { authorizationUrl } = await api.getLinkedinLoginOAuthUrl();
      window.location.assign(authorizationUrl);
    } catch (err) {
      setLoading(false);
      if (err instanceof ApiRequestError && err.code === 'LINKEDIN_NOT_CONFIGURED') {
        toast.error('LinkedIn sign-in is not configured on the server yet.');
        return;
      }
      toast.error(err instanceof Error ? err.message : 'LinkedIn sign-in failed');
    }
  };

  return (
    <div className="w-full max-w-md">
      <Card className="border-border p-6 shadow-none">
        <AuthBrand title="Sign in to 2une" />
        <CardContent className="p-0">
          {pendingNext ? (
            <p className="mb-4 rounded-md border border-border bg-muted/40 px-3 py-2 text-xs text-muted-foreground">
              Sign in to continue what you started. After you log in, you will return to that page.
            </p>
          ) : null}
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-xs text-muted-foreground">
                Email
              </Label>
              <Input
                id="email"
                type="email"
                autoComplete="email"
                placeholder="you@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="h-10 bg-background text-sm"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password" className="text-xs text-muted-foreground">
                Password
              </Label>
              <Input
                id="password"
                type="password"
                autoComplete="current-password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="h-10 bg-background text-sm"
              />
            </div>

            <div className="space-y-2 pt-1">
              <Button className="h-10 w-full font-medium" type="submit" disabled={loading}>
                {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                Log in
              </Button>
              <Link
                href="/signup"
                className={cn(buttonVariants({ variant: 'outline' }), 'h-10 w-full font-medium')}
              >
                Create account
              </Link>
            </div>

            <div className="relative my-5">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-border" />
              </div>
              <div className="relative flex justify-center text-xs">
                <span className="bg-card px-2 text-muted-foreground">Or continue with</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <Button
                variant="outline"
                type="button"
                className="h-10 font-normal"
                onClick={() => void runGoogleSignIn()}
                disabled={loading}
              >
                <svg className="mr-2 h-[18px] w-[18px]" viewBox="0 0 24 24">
                  <path
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    fill="#4285F4"
                  />
                  <path
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    fill="#34A853"
                  />
                  <path
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                    fill="#FBBC05"
                  />
                  <path
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                    fill="#EA4335"
                  />
                  <path d="M1 1h22v22H1z" fill="none" />
                </svg>
                Google
              </Button>
              <Button
                variant="outline"
                type="button"
                className="h-10 font-normal"
                onClick={() => void runLinkedinSignIn()}
                disabled={loading}
              >
                <svg className="mr-2 h-[18px] w-[18px]" viewBox="0 0 24 24" aria-hidden>
                  <path
                    fill="#0A66C2"
                    d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"
                  />
                </svg>
                LinkedIn
              </Button>
            </div>
          </form>

          <div className="mt-4 flex justify-center">
            <Link
              href="/"
              className={cn(
                buttonVariants({ variant: 'ghost' }),
                'h-9 px-3 text-sm font-normal text-muted-foreground hover:text-foreground',
              )}
            >
              Browse projects without signing in
            </Link>
          </div>

          <p className="mt-6 text-center text-xs text-muted-foreground">
            By signing in, you agree to our{' '}
            <Link href="#" className="underline underline-offset-2">
              Worker Terms
            </Link>
            .
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

function LoginPageFallback() {
  return (
    <div className="w-full max-w-md">
      <Card className="border-border p-6 shadow-none">
        <div className="flex justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </Card>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<LoginPageFallback />}>
      <LoginCard />
    </Suspense>
  );
}

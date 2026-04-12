'use client';

import { FirebaseError } from 'firebase/app';
import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';

import { api, ApiRequestError, PENDING_FULL_NAME_KEY } from '@/lib/services/api';
import { useAuthStore } from '@/lib/store';
import { consumeGoogleRedirectIdToken, signInWithGoogleRedirect } from '@/lib/firebaseClient';
import { consumeLinkedinHandoffFromHash, LINKEDIN_LOGIN_ERROR_MESSAGES } from '@/lib/linkedinOAuth';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { AuthBrand } from '@/components/AuthBrand';

export default function SignupPage() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const redirectConsumeStarted = useRef(false);
  const linkedinHandoffStarted = useRef(false);
  const linkedinQueryErrorShown = useRef(false);

  useEffect(() => {
    if (redirectConsumeStarted.current) return;
    redirectConsumeStarted.current = true;

    void (async () => {
      try {
        const idToken = await consumeGoogleRedirectIdToken();
        if (!idToken) {
          redirectConsumeStarted.current = false;
          return;
        }
        setLoading(true);
        await useAuthStore.getState().loginWithGoogle(idToken);
        toast.success('Signed in with Google.');
        router.push('/dashboard');
      } catch (err) {
        if (err instanceof ApiRequestError && err.code === 'INVALID_FIREBASE_TOKEN') {
          toast.error(
            'Google sign-in could not be verified on the server. Ensure the API has FIREBASE_SERVICE_ACCOUNT_JSON for the same Firebase project as this app.',
          );
        } else {
          toast.error(err instanceof Error ? err.message : 'Google sign-up failed');
        }
      } finally {
        setLoading(false);
        redirectConsumeStarted.current = false;
      }
    })();
  }, [router]);

  useEffect(() => {
    if (linkedinHandoffStarted.current) return;
    const token = consumeLinkedinHandoffFromHash();
    if (!token) return;
    linkedinHandoffStarted.current = true;
    void (async () => {
      try {
        setLoading(true);
        await useAuthStore.getState().loginWithLinkedinHandoff(token);
        toast.success('Signed in with LinkedIn.');
        router.push('/dashboard');
      } catch (err) {
        if (err instanceof ApiRequestError && err.code === 'INVALID_LINKEDIN_HANDOFF') {
          toast.error('Sign-in session expired. Try LinkedIn again.');
        } else {
          toast.error(err instanceof Error ? err.message : 'LinkedIn sign-up failed');
        }
      } finally {
        setLoading(false);
        linkedinHandoffStarted.current = false;
      }
    })();
  }, [router]);

  useEffect(() => {
    if (typeof window === 'undefined' || linkedinQueryErrorShown.current) return;
    const q = new URLSearchParams(window.location.search);
    const err = q.get('linkedin_error');
    if (!err) return;
    linkedinQueryErrorShown.current = true;
    toast.error(LINKEDIN_LOGIN_ERROR_MESSAGES[err] ?? LINKEDIN_LOGIN_ERROR_MESSAGES.signin_failed);
    router.replace('/signup', { scroll: false });
  }, [router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { verificationToken } = await api.signup({ email, password, name });
      toast.success('Account created. Verify your email before logging in.');
      if (verificationToken && typeof window !== 'undefined') {
        sessionStorage.setItem('2une_last_verify_token', verificationToken);
      }
      router.push('/verify-email');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Signup failed';
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  const runGoogleSignup = async () => {
    setLoading(true);
    try {
      if (name.trim() && typeof window !== 'undefined') {
        sessionStorage.setItem(PENDING_FULL_NAME_KEY, name.trim());
      }
      await signInWithGoogleRedirect();
    } catch (err) {
      setLoading(false);
      if (err instanceof FirebaseError && err.code === 'auth/popup-closed-by-user') {
        toast.message('Sign-in cancelled.');
        return;
      }
      toast.error(err instanceof Error ? err.message : 'Google sign-up failed');
    }
  };

  const runLinkedinSignup = async () => {
    setLoading(true);
    try {
      if (name.trim() && typeof window !== 'undefined') {
        sessionStorage.setItem(PENDING_FULL_NAME_KEY, name.trim());
      }
      const { authorizationUrl } = await api.getLinkedinLoginOAuthUrl();
      window.location.assign(authorizationUrl);
    } catch (err) {
      setLoading(false);
      if (err instanceof ApiRequestError && err.code === 'LINKEDIN_NOT_CONFIGURED') {
        toast.error('LinkedIn sign-in is not configured on the server yet.');
        return;
      }
      toast.error(err instanceof Error ? err.message : 'LinkedIn sign-up failed');
    }
  };

  return (
    <div className="w-full max-w-md">
      <Card className="border-border p-6 shadow-none">
        <AuthBrand
          title="Create your account"
          subtitle="You’ll verify email next. In development, the API may return a token in the response."
        />
        <CardContent className="p-0">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name" className="text-xs text-muted-foreground">
                Full name
              </Label>
              <Input
                id="name"
                autoComplete="name"
                placeholder="Your name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="h-10 bg-background text-sm"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email" className="text-xs text-muted-foreground">
                Email
              </Label>
              <Input
                id="email"
                type="email"
                autoComplete="email"
                placeholder="you@company.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="h-10 bg-background text-sm"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password" className="text-xs text-muted-foreground">
                Password
              </Label>
              <Input
                id="password"
                type="password"
                autoComplete="new-password"
                placeholder="At least 8 characters"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="h-10 bg-background text-sm"
                required
                minLength={8}
              />
            </div>
            <Button type="submit" className="mt-1 h-10 w-full font-medium" disabled={loading}>
              {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Sign up
            </Button>

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
                onClick={() => void runGoogleSignup()}
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
                onClick={() => void runLinkedinSignup()}
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

            <p className="pt-1 text-center text-sm text-muted-foreground">
              Already have an account?{' '}
              <Link href="/login" className="font-medium text-primary hover:underline">
                Log in
              </Link>
            </p>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

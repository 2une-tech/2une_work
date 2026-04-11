'use client';

import { FirebaseError } from 'firebase/app';
import { useEffect, useRef, useState } from 'react';
import { useAuthStore } from '@/lib/store';
import { Button, buttonVariants } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import Link from 'next/link';
import { ApiRequestError } from '@/lib/services/api';
import { consumeGoogleRedirectIdToken, signInWithGoogleRedirect } from '@/lib/firebaseClient';
import { AuthBrand } from '@/components/AuthBrand';

export default function LoginPage() {
  const { login } = useAuthStore();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  /** Avoid duplicate getRedirectResult under React Strict Mode (second mount must not run). */
  const redirectConsumeStarted = useRef(false);

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
        toast.success('Logged in successfully.');
        router.push('/dashboard');
      } catch (err) {
        if (err instanceof ApiRequestError && err.code === 'INVALID_FIREBASE_TOKEN') {
          toast.error(
            'Google sign-in could not be verified on the server. Ensure the API has FIREBASE_SERVICE_ACCOUNT_JSON for the same Firebase project as this app.',
          );
        } else {
          toast.error(err instanceof Error ? err.message : 'Google sign-in failed');
        }
      } finally {
        setLoading(false);
        redirectConsumeStarted.current = false;
      }
    })();
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
      router.push('/dashboard');
    } catch (err) {
      if (err instanceof ApiRequestError && err.code === 'EMAIL_NOT_VERIFIED') {
        toast.error('Verify your email first.');
        router.push('/verify-email');
        return;
      }
      if (err instanceof ApiRequestError && err.code === 'USE_GOOGLE_LOGIN') {
        toast.error('This account uses Google sign-in.');
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
      await signInWithGoogleRedirect();
    } catch (err) {
      setLoading(false);
      if (err instanceof FirebaseError && err.code === 'auth/popup-closed-by-user') {
        toast.message('Sign-in cancelled.');
        return;
      }
      toast.error(err instanceof Error ? err.message : 'Google sign-in failed');
    }
  };

  return (
    <div className="w-full max-w-md">
      <Card className="border-border p-6 shadow-none">
        <AuthBrand title="Sign in to 2une" />
        <CardContent className="p-0">
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
                onClick={() => toast.info('Okta sign-in is not available yet.')}
                disabled={loading}
              >
                <svg className="mr-2 h-[18px] w-[18px]" viewBox="0 0 100 100" fill="none">
                  <path
                    d="M50 0C22.4 0 0 22.4 0 50c0 27.6 22.4 50 50 50 27.6 0 50-22.4 50-50C100 22.4 77.6 0 50 0zm0 82.5c-17.9 0-32.5-14.6-32.5-32.5 0-17.9 14.6-32.5 32.5-32.5 17.9 0 32.5 14.6 32.5 32.5 0 17.9-14.6 32.5-32.5 32.5z"
                    fill="currentColor"
                  />
                  <path
                    d="M50 35c-8.3 0-15 6.7-15 15 0 8.3 6.7 15 15 15 8.3 0 15-6.7 15-15 0-8.3-6.7-15-15-15z"
                    fill="currentColor"
                  />
                </svg>
                Okta
              </Button>
            </div>
          </form>

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

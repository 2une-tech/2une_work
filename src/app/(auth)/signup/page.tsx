'use client';

import { FirebaseError } from 'firebase/app';
import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';

import { api, PENDING_FULL_NAME_KEY } from '@/lib/services/api';
import { useAuthStore } from '@/lib/store';
import { signInWithGoogleAndGetIdToken } from '@/lib/firebaseClient';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { AuthBrand } from '@/components/AuthBrand';

export default function SignupPage() {
  const { loginWithGoogle } = useAuthStore();
  const router = useRouter();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

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
      const idToken = await signInWithGoogleAndGetIdToken();
      await loginWithGoogle(idToken);
      toast.success('Signed in with Google.');
      router.push('/dashboard');
    } catch (err) {
      if (err instanceof FirebaseError && err.code === 'auth/popup-closed-by-user') {
        toast.message('Sign-in cancelled.');
        return;
      }
      toast.error(err instanceof Error ? err.message : 'Google sign-up failed');
    } finally {
      setLoading(false);
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

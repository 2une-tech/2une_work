'use client';

import { reload } from 'firebase/auth';
import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';

import { getFirebaseAuth, sendEmailVerificationForUser } from '@/lib/firebaseClient';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { AuthBrand } from '@/components/AuthBrand';

export default function VerifyEmailPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [hasUser, setHasUser] = useState<boolean | null>(null);

  const refreshAuthUser = useCallback(() => {
    if (typeof window === 'undefined') return;
    try {
      const u = getFirebaseAuth().currentUser;
      setHasUser(!!u);
    } catch {
      setHasUser(false);
    }
  }, []);

  useEffect(() => {
    refreshAuthUser();
  }, [refreshAuthUser]);

  const handleResend = async () => {
    setLoading(true);
    try {
      const u = getFirebaseAuth().currentUser;
      if (!u) {
        toast.error('Sign in with the account you just created, or start signup again.');
        return;
      }
      await sendEmailVerificationForUser(u);
      toast.success('Verification email sent again.');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Could not resend email');
    } finally {
      setLoading(false);
    }
  };

  const handleCheckVerified = async () => {
    setLoading(true);
    try {
      const u = getFirebaseAuth().currentUser;
      if (!u) {
        toast.message('Open the link in your email, then log in here.');
        router.push('/login');
        return;
      }
      await reload(u);
      if (u.emailVerified) {
        toast.success('Email verified. You can log in.');
        router.push('/login');
      } else {
        toast.message('Not verified yet—check your inbox and spam folder.');
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md">
      <Card className="border-border p-6 shadow-none">
        <AuthBrand
          title="Verify your email"
          subtitle="We sent a link to your address. Open it on this device, then continue below."
        />
        <CardContent className="space-y-3 p-0 pt-2">
          <Button
            type="button"
            className="h-10 w-full font-medium"
            onClick={() => void handleCheckVerified()}
            disabled={loading}
          >
            {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            I’ve verified — continue to log in
          </Button>
          <Button
            type="button"
            variant="outline"
            className="h-10 w-full font-medium"
            onClick={() => void handleResend()}
            disabled={loading || hasUser === false}
          >
            Resend verification email
          </Button>
          {hasUser === false ? (
            <p className="text-center text-xs text-muted-foreground">
              Resend is available when you’re still signed in after signup. Otherwise use{' '}
              <Link href="/signup" className="font-medium text-primary hover:underline">
                Create account
              </Link>{' '}
              or{' '}
              <Link href="/login" className="font-medium text-primary hover:underline">
                Log in
              </Link>
              .
            </p>
          ) : null}
          <p className="pt-1 text-center text-sm text-muted-foreground">
            <Link href="/login" className="font-medium text-primary hover:underline">
              Back to log in
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

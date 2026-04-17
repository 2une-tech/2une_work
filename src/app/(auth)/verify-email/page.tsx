'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';

import { api } from '@/lib/services/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { AuthBrand } from '@/components/AuthBrand';

export default function VerifyEmailPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [token, setToken] = useState('');

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const pending = sessionStorage.getItem('2une_pending_verify_token')?.trim() ?? '';
    if (pending) setToken(pending);
  }, []);

  const handleVerify = async () => {
    const t = token.trim();
    if (!t) {
      toast.error('Enter the verification token.');
      return;
    }
    setLoading(true);
    try {
      await api.verifyEmail(t);
      if (typeof window !== 'undefined') sessionStorage.removeItem('2une_pending_verify_token');
      toast.success('Email verified. You can log in.');
      router.push('/login');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Verification failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md">
      <Card className="border-border p-6 shadow-none">
        <AuthBrand
          title="Verify your email"
          subtitle="Paste the verification token you received, then continue."
        />
        <CardContent className="space-y-3 p-0 pt-2">
          <div className="space-y-2">
            <Label htmlFor="token" className="text-xs text-muted-foreground">
              Verification token
            </Label>
            <Input
              id="token"
              autoComplete="one-time-code"
              placeholder="Paste token"
              value={token}
              onChange={(e) => setToken(e.target.value)}
              className="h-10 bg-background text-sm"
            />
          </div>
          <Button
            type="button"
            className="h-10 w-full font-medium"
            onClick={() => void handleVerify()}
            disabled={loading}
          >
            {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            Verify email
          </Button>
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

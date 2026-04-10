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
  const [token, setToken] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const t = typeof window !== 'undefined' ? sessionStorage.getItem('2une_last_verify_token') : null;
    if (t) {
      setToken(t);
      sessionStorage.removeItem('2une_last_verify_token');
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token.trim()) {
      toast.error('Paste the verification token from your signup response.');
      return;
    }
    setLoading(true);
    try {
      await api.verifyEmail(token.trim());
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
          subtitle="In development, the API returns a verification token in the signup response. Paste it below."
        />
        <CardContent className="p-0">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="token" className="text-xs text-muted-foreground">
                Verification token
              </Label>
              <Input
                id="token"
                autoComplete="off"
                placeholder="Token from signup"
                value={token}
                onChange={(e) => setToken(e.target.value)}
                className="h-10 bg-background font-mono text-xs"
              />
            </div>
            <Button type="submit" className="h-10 w-full font-medium" disabled={loading}>
              {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Verify
            </Button>
            <p className="pt-1 text-center text-sm text-muted-foreground">
              <Link href="/login" className="font-medium text-primary hover:underline">
                Back to log in
              </Link>
            </p>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

'use client';

import ApplicantTable from '@/components/ApplicantTable';
import { Shield } from 'lucide-react';
import { useRequireAuth } from '@/lib/useRequireAuth';
import { useAuthStore } from '@/lib/store';

export default function AdminPage() {
  const { isAllowed } = useRequireAuth();
  const { user } = useAuthStore();
  if (!isAllowed) return null;
  if (user?.role !== 'admin') return null;

  return (
    <div className="mx-auto max-w-6xl px-6 py-8 md:px-8">
      <div className="mb-8 flex items-start gap-3">
        <div className="rounded-md border border-border p-2 text-muted-foreground">
          <Shield className="h-5 w-5" strokeWidth={1.5} />
        </div>
        <div>
          <h1 className="text-xl font-semibold tracking-tight text-foreground">Admin</h1>
          <p className="text-sm text-muted-foreground">Review candidates and application status.</p>
        </div>
      </div>

      <ApplicantTable />
    </div>
  );
}

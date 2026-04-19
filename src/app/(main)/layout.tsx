import Sidebar from '@/components/Sidebar';
import { ProfileMinimumBanner } from '@/components/ProfileMinimumBanner';
import { ProfileMinimumModal } from '@/components/ProfileMinimumModal';
import { MainLayoutGate } from '@/components/MainLayoutGate';

export default function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <MainLayoutGate>
      <div className="flex min-h-screen">
        <Sidebar />
        <div className="flex min-h-screen min-w-0 flex-1 flex-col pt-14 md:ml-56 md:pt-0">
          <ProfileMinimumModal />
          <ProfileMinimumBanner />
          <main className="min-w-0 flex-1">{children}</main>
        </div>
      </div>
    </MainLayoutGate>
  );
}

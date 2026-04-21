import { MobileAppBanner } from '@/components/MobileAppBanner';

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col bg-muted/40">
      <MobileAppBanner className="top-0" />
      <div className="flex flex-1 flex-col items-center justify-center px-4 py-10">
        {children}
      </div>
    </div>
  );
}

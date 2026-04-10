import Image from 'next/image';
import { cn } from '@/lib/utils';

type BrandLogoProps = {
  className?: string;
  /** Pixel size of the mark inside the dark tile */
  size?: number;
};

/** White mark on a dark tile so it stays visible on light UI surfaces. */
export function BrandLogo({ className, size = 22 }: BrandLogoProps) {
  const pad = Math.max(4, Math.round(size * 0.18));
  const box = size + pad * 2;
  return (
    <span
      className={cn('inline-flex shrink-0 items-center justify-center rounded-md bg-zinc-900', className)}
      style={{ width: box, height: box, padding: pad }}
    >
      <Image
        src="/logo_white.png"
        alt=""
        width={size}
        height={size}
        className="object-contain"
        priority
      />
    </span>
  );
}

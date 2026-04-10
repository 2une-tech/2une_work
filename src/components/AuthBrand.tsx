import { BrandLogo } from './BrandLogo';

export function AuthBrand({
  title,
  subtitle,
}: {
  title: string;
  subtitle?: string;
}) {
  return (
    <div className="mb-8 flex flex-col items-center pt-1 text-center">
      <div className="mb-4">
        <BrandLogo size={36} />
      </div>
      <h1 className="text-xl font-semibold tracking-tight text-foreground">{title}</h1>
      {subtitle ? (
        <p className="mt-2 max-w-sm text-sm text-muted-foreground">{subtitle}</p>
      ) : null}
    </div>
  );
}

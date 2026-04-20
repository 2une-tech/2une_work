/** Canonical site URL for metadata, OG tags, and sitemap. Set in production via NEXT_PUBLIC_SITE_URL. */
export const siteUrl =
  process.env.NEXT_PUBLIC_SITE_URL?.trim().replace(/\/$/, '') || 'https://2une.in';

export const siteConfig = {
  name: '2une',
  title: '2une — AI data work & projects',
  description:
    'Train AI with data sourcing, annotation, and RLHF. Find flexible projects and apply to work with 2une — built for talent in India.',
  locale: 'en_IN',
} as const;

/** Official mobile apps (work.2une.in banner + deep links). */
export const mobileAppLinks = {
  googlePlay: 'https://play.google.com/store/apps/details?id=com.tune.work',
  appStore: 'https://apps.apple.com/in/app/2unee/id6761867005',
} as const;

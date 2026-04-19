import { ImageResponse } from 'next/og';
import { siteConfig } from '@/lib/site';

export const alt = siteConfig.title;
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default function OpenGraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          padding: 72,
          background: 'linear-gradient(135deg, #fafafa 0%, #e4e9f2 45%, #d4dce8 100%)',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 20,
            marginBottom: 28,
          }}
        >
          <div
            style={{
              width: 88,
              height: 88,
              borderRadius: 20,
              background: '#18181b',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#fafafa',
              fontSize: 48,
              fontWeight: 700,
              fontFamily:
                'ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
            }}
          >
            2
          </div>
          <span
            style={{
              fontSize: 56,
              fontWeight: 700,
              color: '#18181b',
              letterSpacing: -0.02,
              fontFamily:
                'ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
            }}
          >
            {siteConfig.name}
          </span>
        </div>
        <p
          style={{
            margin: 0,
            fontSize: 30,
            color: '#3f3f46',
            lineHeight: 1.35,
            maxWidth: 900,
            fontFamily:
              'ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
          }}
        >
          {siteConfig.description}
        </p>
      </div>
    ),
    { ...size },
  );
}

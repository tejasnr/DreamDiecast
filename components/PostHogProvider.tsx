'use client';

import posthog from 'posthog-js';
import { PostHogProvider as PHProvider } from 'posthog-js/react';
import { usePathname, useSearchParams } from 'next/navigation';
import { useEffect, Suspense } from 'react';

function PostHogPageView() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    if (pathname) {
      posthog.capture('$pageview', { path: pathname });
    }
  }, [pathname, searchParams]);

  return null;
}

export default function PostHogProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    const key = process.env.NEXT_PUBLIC_POSTHOG_KEY;
    const host = process.env.NEXT_PUBLIC_POSTHOG_HOST;
    if (key) {
      posthog.init(key, {
        api_host: host || 'https://us.i.posthog.com',
        capture_pageview: false,
        capture_pageleave: true,
        session_recording: {
          maskAllInputs: false,
          maskInputFn: (text, element) => {
            if (element?.getAttribute('type') === 'password') return '*'.repeat(text.length);
            return text;
          },
        },
        loaded: (ph) => {
          if (process.env.NODE_ENV === 'development') {
            ph.opt_out_capturing();
          }
        },
      });
    }
  }, []);

  return (
    <PHProvider client={posthog}>
      <Suspense fallback={null}>
        <PostHogPageView />
      </Suspense>
      {children}
    </PHProvider>
  );
}

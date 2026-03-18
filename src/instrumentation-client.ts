// This file configures the initialization of Sentry on the client.
// The added config here will be used whenever a users loads a page in their browser.
// https://docs.sentry.io/platforms/javascript/guides/nextjs/

import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,

  // CRITICAL: 0.1 — never 1.0 for a real-time game app (quota protection)
  tracesSampleRate: 0.1,

  // Capture 100% of errors (only traces are sampled)
  sampleRate: 1.0,

  environment: process.env.NODE_ENV,

  // Enable logs to be sent to Sentry
  enableLogs: true,

  beforeSend(event) {
    // Drop expected Socket.IO polling noise — not a real error
    if (event.exception?.values?.[0]?.value?.includes("xhr poll error")) {
      return null;
    }
    return event;
  },
});

export const onRouterTransitionStart = Sentry.captureRouterTransitionStart;

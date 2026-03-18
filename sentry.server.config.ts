// This file configures the initialization of Sentry on the server.
// The config you add here will be used whenever the server handles a request.
// https://docs.sentry.io/platforms/javascript/guides/nextjs/

import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,

  // CRITICAL: 0.1 — never 1.0 for a real-time game app (quota protection)
  tracesSampleRate: 0.1,

  environment: process.env.NODE_ENV,

  // Enable logs to be sent to Sentry
  enableLogs: true,
});

import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: "https://97d5217a320745e1cd3f48a330b06318@o4511412586086400.ingest.de.sentry.io/4511412599652432",

  // CRITICAL: 0.1 — never 1.0 for a real-time game app (quota protection)
  tracesSampleRate: 0.1,

  environment: process.env.NODE_ENV,

  // Enable logs to be sent to Sentry
  enableLogs: true,

  // Enable sending user PII (Personally Identifiable Information)
  // https://docs.sentry.io/platforms/javascript/guides/nextjs/configuration/options/#sendDefaultPii
  sendDefaultPii: true,
});

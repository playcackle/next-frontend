export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    await import("../sentry.server.config").catch(() => {});
  }

  if (process.env.NEXT_RUNTIME === "edge") {
    await import("../sentry.edge.config").catch(() => {});
  }
}

export const onRequestError = async (...args: Parameters<(err: unknown, req: unknown, ctx: unknown) => void>) => {
  const Sentry = await import("@sentry/nextjs").catch(() => null);
  if (Sentry) Sentry.captureRequestError(...(args as Parameters<typeof Sentry.captureRequestError>));
};

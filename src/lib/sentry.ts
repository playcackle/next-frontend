// src/lib/sentry.ts
// Central Sentry abstraction — all application code uses these helpers.
// Direct @sentry/nextjs imports are forbidden outside this file and global-error.tsx.
import * as Sentry from "@sentry/nextjs";
import type { User } from "@supabase/supabase-js";

export function setSentryUser(user: User): void {
  Sentry.setUser({
    id: user.id,
    email: user.email ?? undefined,
  });
}

export function setSentryGameContext(roomId: string, phase?: string): void {
  Sentry.setContext("gameroom", {
    roomId,
    phase: phase ?? "unknown",
  });
}

export function clearSentryUser(): void {
  Sentry.setUser(null);
}

export function captureException(
  error: unknown,
  options?: { tags?: Record<string, string> }
): void {
  if (options?.tags) {
    Sentry.withScope((scope) => {
      Object.entries(options.tags!).forEach(([key, value]) =>
        scope.setTag(key, value)
      );
      Sentry.captureException(error);
    });
  } else {
    Sentry.captureException(error);
  }
}

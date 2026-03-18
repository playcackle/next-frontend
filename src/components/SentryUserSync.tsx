// src/components/SentryUserSync.tsx
"use client";

import { useEffect } from "react";
import type { AuthChangeEvent, Session } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/client";
import { setSentryUser, clearSentryUser } from "@/lib/sentry";

export function SentryUserSync() {
  useEffect(() => {
    const supabase = createClient();

    // Set user immediately if already signed in when component mounts
    supabase.auth.getUser().then(({ data }: { data: { user: import("@supabase/supabase-js").User | null } }) => {
      if (data.user) setSentryUser(data.user);
    });

    // Keep in sync with future auth state changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event: AuthChangeEvent, session: Session | null) => {
      if (session?.user) {
        setSentryUser(session.user);
      } else {
        clearSentryUser();
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  return null;
}

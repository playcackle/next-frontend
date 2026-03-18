"use client";

import dynamic from "next/dynamic";
import { PerformanceInitializer } from "@/components/performance-initializer";
import { PerformanceModal } from "@/components/performance-modal";
import { Provider as JotaiProvider } from "jotai";
import type React from "react";

// SentryUserSync only sets Sentry user context — no SSR value, safe to defer.
// Dynamic import from Provider (Client Component) produces a genuine webpack code split,
// moving the Supabase 645KB chunk out of the main entry bundle.
const SentryUserSync = dynamic(
  () => import("@/components/SentryUserSync").then((m) => ({ default: m.SentryUserSync })),
  { ssr: false }
);

type Props = {
  children?: React.ReactNode;
};

export const Provider = ({ children }: Props) => {
  return (
    <JotaiProvider>
      <PerformanceInitializer />
      <SentryUserSync />
      <PerformanceModal />
      {children}
    </JotaiProvider>
  );
};

"use client";

import { PerformanceInitializer } from "@/components/performance-initializer";
import { PerformanceModal } from "@/components/performance-modal";
import { SentryUserSync } from "@/components/SentryUserSync";
import { Provider as JotaiProvider } from "jotai";
import type React from "react";

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

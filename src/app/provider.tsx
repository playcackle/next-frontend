"use client";

import { PerformanceInitializer } from "@/components/performance-initializer";
import { PerformanceModal } from "@/components/performance-modal";
import { Provider as JotaiProvider } from "jotai";
import { SessionProvider } from "next-auth/react";
import type React from "react";

type Props = {
  children?: React.ReactNode;
};

export const Provider = ({ children }: Props) => {
  return (
    <SessionProvider>
      <JotaiProvider>
        <PerformanceInitializer />
        <PerformanceModal />
        {children}
      </JotaiProvider>
    </SessionProvider>
  );
};

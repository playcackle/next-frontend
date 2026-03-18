"use client";

import { useEffect } from "react";
import { captureException } from "@/lib/sentry";

export default function AppError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    captureException(error);
  }, [error]);

  return (
    <div style={{ padding: "2rem", color: "white", background: "#0a0a1f" }}>
      <h2>Something went wrong</h2>
      <button
        onClick={reset}
        style={{ marginTop: "1rem", padding: "0.5rem 1rem", cursor: "pointer" }}
      >
        Try again
      </button>
    </div>
  );
}

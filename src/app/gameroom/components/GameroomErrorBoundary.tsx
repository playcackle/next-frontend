"use client";

import React from "react";
import { captureException } from "@/lib/sentry";

interface Props {
  children: React.ReactNode;
}

interface State {
  hasError: boolean;
  recoveryAttempted: boolean;
}

export class GameroomErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, recoveryAttempted: false };
  }

  static getDerivedStateFromError(_error: Error): Partial<State> {
    // Only mark that an error occurred — no side effects allowed here.
    return { hasError: true };
  }

  componentDidCatch(error: Error, _info: React.ErrorInfo): void {
    // NOTE: info.componentStack is multi-line and would be truncated by Sentry
    // if passed as a tag value — we intentionally omit it from tags.
    captureException(error, { tags: { boundary: "gameroom" } });

    // Gate the auto-reset: without this guard a persistent error would cause
    // an infinite setState -> crash loop (setState -> re-render -> crash -> repeat).
    if (!this.state.recoveryAttempted) {
      setTimeout(() => {
        this.setState({ hasError: false, recoveryAttempted: true });
      }, 0);
    }
  }

  render(): React.ReactNode {
    // Case a: second crash after recovery attempt — unrecoverable, show minimal fallback
    if (this.state.hasError && this.state.recoveryAttempted) {
      return (
        <div
          style={{
            padding: "2rem",
            color: "white",
            background: "#0a0a1f",
          }}
        >
          <h2>Game connection lost</h2>
          <p>Return to lobby and rejoin.</p>
        </div>
      );
    }

    // Case b: first crash — silent recovery in progress, render nothing
    if (this.state.hasError && !this.state.recoveryAttempted) {
      return null;
    }

    // Case c: no error (or successful recovery) — render children normally
    return this.props.children;
  }
}

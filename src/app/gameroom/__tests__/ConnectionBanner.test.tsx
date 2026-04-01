import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import { render, screen, act } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Provider, createStore } from "jotai";
import ConnectionBanner from "../components/ConnectionBanner";
import { connectionStatusAtom } from "../store/gameAtoms";

function renderWithStore(
  ui: React.ReactElement,
  initialStatus: "connecting" | "connected" | "reconnecting" | "disconnected" = "connecting"
) {
  const store = createStore();
  store.set(connectionStatusAtom, initialStatus);

  const result = render(<Provider store={store}>{ui}</Provider>);
  return { ...result, store };
}

beforeEach(() => {
  vi.useFakeTimers();
});

afterEach(() => {
  vi.useRealTimers();
});

describe("ConnectionBanner", () => {
  it("does not render when status is 'connecting' (initial load)", () => {
    renderWithStore(<ConnectionBanner />);
    expect(screen.queryByRole("status")).not.toBeInTheDocument();
  });

  it("does not render when status is steady 'connected'", () => {
    renderWithStore(<ConnectionBanner />, "connected");
    expect(screen.queryByRole("status")).not.toBeInTheDocument();
  });

  it("shows reconnecting banner when status is 'reconnecting'", () => {
    renderWithStore(<ConnectionBanner />, "reconnecting");
    expect(screen.getByRole("status")).toBeInTheDocument();
    expect(screen.getByText("Reconnecting…")).toBeInTheDocument();
  });

  it("shows disconnected banner with retry button", () => {
    const onRetry = vi.fn();
    renderWithStore(<ConnectionBanner onRetry={onRetry} />, "disconnected");

    expect(screen.getByText("Connection lost")).toBeInTheDocument();
    expect(screen.getByText("Retry")).toBeInTheDocument();
  });

  it("calls onRetry when retry button is clicked", async () => {
    vi.useRealTimers(); // need real timers for userEvent
    const onRetry = vi.fn();
    renderWithStore(<ConnectionBanner onRetry={onRetry} />, "disconnected");

    await userEvent.click(screen.getByText("Retry"));
    expect(onRetry).toHaveBeenCalledOnce();
  });

  it("shows 'Reconnected' briefly after going from reconnecting → connected", () => {
    const { store } = renderWithStore(<ConnectionBanner />, "reconnecting");

    // Should show reconnecting
    expect(screen.getByText("Reconnecting…")).toBeInTheDocument();

    // Transition to connected
    act(() => {
      store.set(connectionStatusAtom, "connected");
    });

    expect(screen.getByText("Reconnected ✓")).toBeInTheDocument();

    // After 2 seconds, banner should disappear
    act(() => {
      vi.advanceTimersByTime(2000);
    });

    expect(screen.queryByRole("status")).not.toBeInTheDocument();
  });
});

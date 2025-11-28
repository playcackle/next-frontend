import Header from "@/components/header";
import SynthwaveBackground from "@/components/synthwave-background";
import { Progress, Theme } from "@radix-ui/themes";
import "@radix-ui/themes/styles.css";
import "animate.css";
import type { Metadata } from "next";
import { headers } from "next/headers";
import Script from "next/script";
import type React from "react";
import { Suspense } from "react";
import "./globals.css";
import { Provider } from "./provider";

export const metadata: Metadata = {
  title: "Race. Claim. Win",
  description: "Snap answers first, win points. Chaotic and addictive!",
  generator: "v0.dev",
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const headersList = await headers();
  const pathname =
    headersList.get("x-invoke-path") || headersList.get("referer");

  const isGameroom = pathname?.includes("gameroom");
  const isAdmin = pathname?.includes("/admin");
  const runtimeEnv = {
    NEXT_PUBLIC_LOBBY_MANAGER_URL:
      process.env.NEXT_PUBLIC_LOBBY_MANAGER_URL ?? "",
  };

  if (typeof globalThis !== "undefined") {
    (globalThis as any).__ENV = {
      ...(globalThis as any).__ENV,
      ...runtimeEnv,
    };
  }

  return (
    <html lang="en">
      <head>
        <Script id="runtime-env" strategy="beforeInteractive">
          {`window.__ENV = Object.assign(window.__ENV || {}, ${JSON.stringify(
            runtimeEnv
          )});`}
        </Script>
      </head>
      <body
        style={{
          backgroundColor: "#0a0a1f",
          margin: 0,
          padding: 0,
          minHeight: "100vh",
          overflow: "hidden",
        }}
      >
        <Theme>
          <div className="crt-container">
            <div className="crt-content">
              <Provider>
                <Suspense fallback={<Progress />}>
                  <SynthwaveBackground animated={false} />
                  {!isAdmin && <Header />}
                  <main>{children}</main>
                </Suspense>
              </Provider>
            </div>
          </div>
        </Theme>
      </body>
    </html>
  );
}

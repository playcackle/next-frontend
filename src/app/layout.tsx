import Header from "@/components/header";
import SynthwaveBackground from "@/components/synthwave-background";
import { Progress, Theme } from "@radix-ui/themes";
import "@radix-ui/themes/styles.css";
import type { Metadata } from "next";
import type React from "react";
import { Suspense } from "react";
import "./globals.css";
import { Provider } from "./provider";
import { WebVitalsLogger } from "./_components/WebVitalsLogger";

export const metadata: Metadata = {
  title: "Cackle",
  description: "Trivia reinvented!",
  generator: "v0.dev",
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body
        style={{
          backgroundColor: "#0a0a1f",
          margin: 0,
          padding: 0,
          minHeight: "100vh",
          overflow: "hidden",
        }}
      >
        <WebVitalsLogger />
        <Theme appearance="dark" hasBackground={false}>
          <div className="crt-container">
            <div className="crt-content">
              <Provider>
                <Suspense fallback={<Progress />}>
                  <SynthwaveBackground animated={false} />
                  <Header />
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
